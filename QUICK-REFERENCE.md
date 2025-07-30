# 🚀 Quick Reference - Booking System

## Login Credentials

### Admin Account
```
Email: admin@booking.com
Password: admin123
```

### Active Test Users (Password: member123)
```
maria.mueller@familie-mueller.de    - Maria Müller (Senior member)
thomas.schmidt@gmail.com            - Thomas Schmidt (Recently approved)
anna.weber@web.de                   - Anna Weber (Established member)
julia.klein@student.de              - Julia Klein (Young member)
```

### Pending Approval Users (Password: member123)
```
lisa.hoffmann@hotmail.de            - Lisa Hoffmann (Recently registered)
michael.bauer@t-online.de           - Michael Bauer (Waiting longer)
robert.fischer@gmx.de               - Robert Fischer (Email verified)
```

## Quick Start Commands

### Development Setup
```bash
# Backend
cd src/backend/Booking.Api
dotnet restore
dotnet ef database update
dotnet run

# Frontend (new terminal)
cd src/frontend
npm install
npm run dev
```

### Reset Database
```bash
cd src/backend/Booking.Api
dotnet ef database drop
dotnet ef database update
```

### Environment Variables
```bash
# Disable all seeding
export SEEDING__ENABLESEEDING=false

# Development with full test data
export ASPNETCORE_ENVIRONMENT=Development
export SEEDING__ENABLECOMPREHENSIVESEEDING=true
```

## URLs
- **Frontend**: http://localhost:3000
- **Backend API**: https://localhost:7190
- **Swagger Docs**: https://localhost:7190/swagger

## Test Data Overview

### Accommodations
- Hauptschlafzimmer (2 persons)
- Gästezimmer (1 person)  
- Kinderzimmer (2 persons)
- Wohnzimmer Schlafsofa (1 person)
- Garten Zeltplatz (4 persons)

### Booking Scenarios
- Past bookings (completed/cancelled)
- Current bookings (active/confirmed)
- Pending bookings (awaiting approval)
- Future bookings (planned stays)

## Common Issues

**Can't login?** → Check if database seeding completed successfully in logs
**No test data?** → Ensure ASPNETCORE_ENVIRONMENT=Development
**Migration errors?** → Drop and recreate database