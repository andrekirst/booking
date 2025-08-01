using System.Net;
using System.Text;
using MediatR;
using Booking.Api.Configuration;
using Booking.Api.Controllers;
using Booking.Api.Data;
using Booking.Api.Data.Interceptors;
using Booking.Api.Domain.Aggregates;
using Booking.Api.Domain.ReadModels;
using Booking.Api.Features.SleepingAccommodations.Repositories;
using Booking.Api.Repositories.ReadModels;
using Booking.Api.Services;
using Booking.Api.Services.Caching;
using Booking.Api.Services.EventSourcing;
using Booking.Api.Services.Projections;
using Booking.Api.Services.Projections.EventAppliers;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Booking.Api;

public class Program
{
    public static async Task Main(string[] args)
    {
        // Configure Npgsql to handle DateTime.Kind=Unspecified for PostgreSQL compatibility
        AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
        
        var builder = WebApplication.CreateBuilder(args);

        // Add services to the container.
        builder.Services.AddControllers(options =>
        {
            options.Filters.Add(new AuthorizeFilter());
            options.Filters.Add(new ProducesResponseTypeAttribute<ErrorResponse>((int)HttpStatusCode.Unauthorized));
        });
        
        // Configure Entity Framework Core with PostgreSQL
        builder.Services.AddDbContext<BookingDbContext>(options =>
            options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
                   .AddInterceptors(new AuditInterceptor()));
        
        // Configure MediatR for CQS pattern
        builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));
        
        // Register custom services
        builder.Services.AddScoped<IPasswordService, PasswordService>();
        builder.Services.AddScoped<IJwtService, JwtService>();
        builder.Services.AddScoped<IEncryptionService, EncryptionService>();
        builder.Services.AddScoped<IEmailService, EmailService>();
        
        // Register Event Sourcing services
        builder.Services.AddScoped<IEventStore, EventStore>();
        builder.Services.AddScoped<IEventSerializer, EventSerializer>();
        builder.Services.AddScoped<IEventDispatcher, EventDispatcher>();
        builder.Services.AddScoped<IEventSourcedRepository<SleepingAccommodationAggregate>, EventSourcedRepository<SleepingAccommodationAggregate>>();
        builder.Services.AddScoped<ISleepingAccommodationRepository, SleepingAccommodationRepository>();
        builder.Services.AddScoped<IEventSourcedRepository<BookingAggregate>, EventSourcedRepository<BookingAggregate>>();
        
        // Register Read Model Repository and Caching
        builder.Services.AddMemoryCache();
        builder.Services.AddScoped<SleepingAccommodationReadModelRepository>();
        builder.Services.AddScoped<ISleepingAccommodationReadModelRepository>(provider =>
        {
            var innerRepository = provider.GetRequiredService<SleepingAccommodationReadModelRepository>();
            var cache = provider.GetRequiredService<IReadModelCache<SleepingAccommodationReadModel>>();
            var logger = provider.GetRequiredService<ILogger<CachedSleepingAccommodationReadModelRepository>>();
            return new CachedSleepingAccommodationReadModelRepository(innerRepository, cache, logger);
        });
        builder.Services.AddSingleton<IReadModelCache<SleepingAccommodationReadModel>, InMemoryReadModelCache<SleepingAccommodationReadModel>>();
        
        // Register Projection Services
        builder.Services.AddScoped<IProjectionService<SleepingAccommodationAggregate, SleepingAccommodationReadModel>, SleepingAccommodationProjectionService>();
        builder.Services.AddScoped<IProjectionService<BookingAggregate, BookingReadModel>, BookingProjectionService>();
        
        // Register Event Appliers for SleepingAccommodation
        builder.Services.AddScoped<IEventApplier<SleepingAccommodationReadModel>, SleepingAccommodationCreatedEventApplier>();
        builder.Services.AddScoped<IEventApplier<SleepingAccommodationReadModel>, SleepingAccommodationUpdatedEventApplier>();
        builder.Services.AddScoped<IEventApplier<SleepingAccommodationReadModel>, SleepingAccommodationDeactivatedEventApplier>();
        builder.Services.AddScoped<IEventApplier<SleepingAccommodationReadModel>, SleepingAccommodationReactivatedEventApplier>();
        
        // Register Event Appliers for Booking
        builder.Services.AddScoped<IEventApplier<BookingReadModel>, BookingCreatedEventApplier>();
        builder.Services.AddScoped<IEventApplier<BookingReadModel>, BookingUpdatedEventApplier>();
        builder.Services.AddScoped<IEventApplier<BookingReadModel>, BookingCancelledEventApplier>();
        builder.Services.AddScoped<IEventApplier<BookingReadModel>, BookingConfirmedEventApplier>();
        builder.Services.AddScoped<IEventApplier<BookingReadModel>, BookingAcceptedEventApplier>();
        builder.Services.AddScoped<IEventApplier<BookingReadModel>, BookingRejectedEventApplier>();
        
        
        // Configure JwtSettings with Options pattern
        builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection(JwtSettings.SectionName));
        
        // Configure EmailSettings with Options pattern
        builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
        
        // Configure ProjectionRetryOptions
        builder.Services.Configure<ProjectionRetryOptions>(builder.Configuration.GetSection(ProjectionRetryOptions.SectionName));
        
        // Configure JWT Authentication
        var jwtSettings = builder.Configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>();
        
        // Ensure JWT secret is configured
        if (jwtSettings == null || string.IsNullOrEmpty(jwtSettings.Secret))
        {
            throw new InvalidOperationException("JWT Secret is not configured. Please set the JwtSettings:Secret in user secrets or environment variables.");
        }

        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),
                    ValidateIssuer = true,
                    ValidIssuer = jwtSettings.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwtSettings.Audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };
            });

        builder.Services.AddAuthorization();
        
        // Configure CORS from settings
        var corsSettings = builder.Configuration.GetSection(CorsSettings.SectionName).Get<CorsSettings>();
        if (corsSettings != null && corsSettings.AllowedOrigins.Any())
        {
            builder.Services.AddCors(options =>
            {
                options.AddPolicy(corsSettings.PolicyName, policy =>
                {
                    policy.WithOrigins(corsSettings.AllowedOrigins.ToArray())
                          .AllowAnyHeader()
                          .AllowAnyMethod();
                    
                    if (corsSettings.AllowCredentials)
                    {
                        policy.AllowCredentials();
                    }
                });
            });
        }
        
        // Configure OpenAPI/Swagger
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        var app = builder.Build();

        // Ensure database is created and seeded in development
        if (app.Environment.IsDevelopment())
        {
            using var scope = app.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<BookingDbContext>();
            var passwordService = scope.ServiceProvider.GetRequiredService<IPasswordService>();
            var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
            
            await context.Database.MigrateAsync();
            await DbSeeder.SeedAsync(context, passwordService, mediator);
        }

        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        // CORS must be called before UseHttpsRedirection
        var appCorsSettings = app.Configuration.GetSection(CorsSettings.SectionName).Get<CorsSettings>();
        if (appCorsSettings != null && appCorsSettings.AllowedOrigins.Any())
        {
            app.UseCors(appCorsSettings.PolicyName);
        }

        app.UseHttpsRedirection();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapControllers();
        
        // Add simple health check endpoint
        app.MapGet("/health", () => Results.Ok(new { status = "healthy" }))
            .AllowAnonymous();

        app.Run();
    }
}