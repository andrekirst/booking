# Environment Variables Configuration

This document describes the environment variables available for configuring the Booking API application, with a focus on the newly added seeding configuration options.

## Seeding Configuration

The application supports configurable database seeding via environment variables, providing flexible control over seeding behavior in different environments.

### Available Seeding Environment Variables

| Environment Variable | Type | Default | Description |
|---------------------|------|---------|-------------|
| `SeedingSettings__EnableSeeding` | boolean | `true` | Master switch for all seeding operations. When set to `false`, no seeding will occur regardless of other settings. |
| `SeedingSettings__EnableBasicSeeding` | boolean | `true` | Controls seeding of essential data (admin user, basic system data). Recommended to keep `true` for all environments. |
| `SeedingSettings__EnableComprehensiveSeeding` | boolean | `false` | Controls seeding of test data (sample users, accommodations, bookings). Should be `true` only in development/testing. |
| `SeedingSettings__ForceComprehensiveSeeding` | boolean | `false` | **DANGER**: Forces comprehensive seeding even in production environments. Use with extreme caution. |
| `SeedingSettings__EnableSeedingLogs` | boolean | `true` | Controls whether detailed seeding logs are written. Useful for debugging seeding issues. |

### Environment Variable Format

- **Boolean Values**: Environment variables accept the following values (case-insensitive):
  - `true`, `True`, `TRUE`, `1`, `yes`, `Yes`, `YES`
  - `false`, `False`, `FALSE`, `0`, `no`, `No`, `NO`

- **Naming Convention**: Uses .NET's standard double underscore (`__`) format for nested configuration sections.

### Usage Examples

#### Development Environment
```bash
# Enable all seeding for development
export SeedingSettings__EnableSeeding=true
export SeedingSettings__EnableBasicSeeding=true
export SeedingSettings__EnableComprehensiveSeeding=true
export SeedingSettings__ForceComprehensiveSeeding=false
export SeedingSettings__EnableSeedingLogs=true
```

#### Production Environment
```bash
# Only basic seeding in production
export SeedingSettings__EnableSeeding=true
export SeedingSettings__EnableBasicSeeding=true
export SeedingSettings__EnableComprehensiveSeeding=false
export SeedingSettings__ForceComprehensiveSeeding=false
export SeedingSettings__EnableSeedingLogs=false
```

#### Testing Environment
```bash
# Full seeding with detailed logs for testing
export SeedingSettings__EnableSeeding=true
export SeedingSettings__EnableBasicSeeding=true
export SeedingSettings__EnableComprehensiveSeeding=true
export SeedingSettings__ForceComprehensiveSeeding=true
export SeedingSettings__EnableSeedingLogs=true
```

#### Disable All Seeding
```bash
# Completely disable seeding
export SeedingSettings__EnableSeeding=false
```

## Docker Integration

### Docker Compose Example

The provided `docker-compose.yml` includes environment variable examples:

```yaml
services:
  api:
    environment:
      # Seeding Configuration
      SeedingSettings__EnableSeeding: "true"
      SeedingSettings__EnableBasicSeeding: "true"
      SeedingSettings__EnableComprehensiveSeeding: "true"
      SeedingSettings__ForceComprehensiveSeeding: "false"
      SeedingSettings__EnableSeedingLogs: "true"
```

### Docker Run Example

```bash
docker run -e SeedingSettings__EnableSeeding=true \
           -e SeedingSettings__EnableBasicSeeding=true \
           -e SeedingSettings__EnableComprehensiveSeeding=false \
           -e SeedingSettings__ForceComprehensiveSeeding=false \
           -e SeedingSettings__EnableSeedingLogs=true \
           booking-api
```

## CI/CD Integration

### GitHub Actions Example

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    env:
      SEEDING__ENABLESEEDING: true
      SEEDING__ENABLEBASICSEEDING: true
      SEEDING__ENABLECOMPREHENSIVESEEDING: true
      SEEDING__ENABLESEEDINGLOGS: true
    steps:
      - name: Run Tests
        run: dotnet test
```

### Azure DevOps Example

```yaml
variables:
  SEEDING__ENABLESEEDING: true
  SEEDING__ENABLEBASICSEEDING: true
  SEEDING__ENABLECOMPREHENSIVESEEDING: true
  SEEDING__ENABLESEEDINGLOGS: true

steps:
- task: DotNetCoreCLI@2
  inputs:
    command: 'test'
  env:
    SEEDING__ENABLESEEDING: $(SEEDING__ENABLESEEDING)
    SEEDING__ENABLEBASICSEEDING: $(SEEDING__ENABLEBASICSEEDING)
    SEEDING__ENABLECOMPREHENSIVESEEDING: $(SEEDING__ENABLECOMPREHENSIVESEEDING)
    SEEDING__ENABLESEEDINGLOGS: $(SEEDING__ENABLESEEDINGLOGS)
```

## Configuration Precedence

The .NET configuration system applies settings in the following order (later sources override earlier ones):

1. `appsettings.json` (base configuration)
2. `appsettings.{Environment}.json` (environment-specific configuration)
3. **Environment Variables** (highest precedence)
4. Command line arguments (if applicable)

This means environment variables will always override settings in configuration files.

## Validation and Logging

The application automatically validates seeding configuration on startup and logs:

- **Configuration Summary**: Shows current seeding settings
- **Validation Warnings**: Alerts about potentially dangerous configurations
- **Validation Errors**: Reports logical inconsistencies

Example startup logs:
```
info: SeedingSettings[0] Seeding configuration loaded: SeedingSettings Configuration: [EnableSeeding: True, EnableBasicSeeding: True, EnableComprehensiveSeeding: True, ForceComprehensiveSeeding: False, EnableSeedingLogs: True]
warn: SeedingSettings[0] WARNING: ForceComprehensiveSeeding is enabled. This will seed test data in production environments.
```

## Security Considerations

### Production Safety

- **Never** set `SEEDING__FORCECOMPREHENSIVESEEDING=true` in production
- Consider setting `SEEDING__ENABLECOMPREHENSIVESEEDING=false` in production
- Keep `SEEDING__ENABLEBASICSEEDING=true` to ensure admin user exists

### Development Best Practices

- Use environment-specific configuration files when possible
- Override with environment variables only when necessary
- Document any environment variable overrides in deployment scripts
- Use descriptive values in Docker Compose for team clarity

## Troubleshooting

### Common Issues

1. **Boolean Parsing Errors**
   - Ensure boolean values are quoted in Docker Compose: `"true"` not `true`
   - Use standard boolean representations: `true`/`false`, not `yes`/`no`

2. **Configuration Not Applied**
   - Check environment variable names for typos (double underscores)
   - Verify environment variables are properly set in container
   - Review application logs for configuration validation messages

3. **Seeding Not Working**
   - Ensure `SEEDING__ENABLESEEDING=true`
   - Check database connectivity
   - Review seeding logs if `SEEDING__ENABLESEEDINGLOGS=true`

### Debug Commands

```bash
# Check environment variables in container
docker exec -it booking-api env | grep SEEDING

# View application logs
docker logs booking-api

# Test configuration locally
dotnet run --environment=Development
```

## Migration from Configuration Files

If you're migrating from configuration file-only setup:

1. **Identify Current Settings**: Check your `appsettings.json` and `appsettings.{Environment}.json`
2. **Set Environment Variables**: Convert settings to environment variable format
3. **Test Configuration**: Verify environment variables override file settings
4. **Update Deployment**: Add environment variables to deployment scripts
5. **Document Changes**: Update team documentation and runbooks

## Additional Configuration Sections

While this document focuses on seeding configuration, the application supports environment variables for other sections as well:

- Database: `ConnectionStrings__DefaultConnection`
- JWT: `JwtSettings__Secret`, `JwtSettings__Issuer`, etc.
- Email: `EmailSettings__SmtpHost`, `EmailSettings__SmtpPort`, etc.
- CORS: `CorsSettings__AllowedOrigins__0`, `CorsSettings__AllowCredentials`, etc.

For array values, use indexed notation: `MyArray__0`, `MyArray__1`, etc.