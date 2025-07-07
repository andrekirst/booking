# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution and project files
COPY Directory.Packages.props ./
COPY BookingSystem.sln ./
COPY Booking.Api/Booking.Api.csproj ./Booking.Api/
COPY Booking.Api.Tests/Booking.Api.Tests.csproj ./Booking.Api.Tests/

# Restore dependencies
RUN dotnet restore

# Copy source code
COPY . .

# Build application
RUN dotnet build -c Release --no-restore

# Publish application
RUN dotnet publish Booking.Api/Booking.Api.csproj -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Install PostgreSQL client for health checks
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

# Copy published application
COPY --from=build /app/publish .

# Set environment variables
ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_ENVIRONMENT=Production

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Run application
ENTRYPOINT ["dotnet", "Booking.Api.dll"]