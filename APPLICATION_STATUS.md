# Application Status Report

> 🤖 Automatisch generiert am 2025-07-31 16:48:18
> 
> Dieses Dokument bietet eine vollständige Übersicht über den aktuellen Stand der Booking-Anwendung.

## 📊 Übersicht

### Projektstruktur
```
booking/
├── src/
│   ├── backend/           # .NET 9 API
│   └── frontend/          # Next.js Frontend
├── scripts/               # Automation Scripts
└── docs/                  # Dokumentation
```


## 🎨 Frontend-Komponenten

### React-Komponenten
- **function** - `src/frontend/components/ui/ConfirmationModal.tsx`
- **function** - `src/frontend/app/components/FullCalendarView.tsx`
- **function** - `src/frontend/app/components/landing/FeatureHighlights.tsx`
- **function** - `src/frontend/app/components/landing/LandingPage.tsx`
- **function** - `src/frontend/app/components/landing/LoginCard.tsx`
- **function** - `src/frontend/app/components/landing/HeroSection.tsx`
- **function** - `src/frontend/app/components/BookingListView.tsx`
- **function** - `src/frontend/app/components/CompactBookingList.tsx`
- **function** - `src/frontend/app/components/BookingCalendarView.tsx`
- **function** - `src/frontend/app/components/BookingCardSkeleton.tsx`
- **function** - `src/frontend/app/components/CompactBookingListSkeleton.tsx`
- **function** - `src/frontend/app/components/BookingFullCalendarView.tsx`
- **function** - `src/frontend/app/components/BookingTooltip.tsx`
- **function** - `src/frontend/app/components/admin/SleepingAccommodationsTable.tsx`
- **function** - `src/frontend/app/components/admin/SleepingAccommodationForm.tsx`
- **function** - `src/frontend/app/components/CalendarView.tsx`
- **function** - `src/frontend/app/components/CreateBookingButton.tsx`
- **function** - `src/frontend/app/components/CalendarLegend.tsx`
- **function** - `src/frontend/app/components/DayPickerCalendarView.tsx`
- **function** - `src/frontend/app/components/FilterPanel.tsx`
- **function** - `src/frontend/app/components/CalendarViewSkeleton.tsx`
- **function** - `src/frontend/app/components/TimeRangeFilter.tsx`
- **UserMenuDropdown** - `src/frontend/app/components/ui/UserMenuDropdown.tsx`
- **Alert** - `src/frontend/app/components/ui/Alert.tsx`
- **UserAvatar** - `src/frontend/app/components/ui/UserAvatar.tsx`
- **function** - `src/frontend/app/components/ui/Tabs.tsx`
- **function** - `src/frontend/app/components/ui/NumberSpinner.tsx`
- **function** - `src/frontend/app/components/ui/BookingHistoryTimeline.tsx`
- **function** - `src/frontend/app/components/BookingStatusFilter.tsx`
- **function** - `src/frontend/app/components/CalendarToolbar.tsx`
- **function** - `src/frontend/app/components/DayPickerBookingCalendarView.tsx`
- **function** - `src/frontend/app/components/CalendarEvent.tsx`
- **PasswordStrengthIndicator** - `src/frontend/app/components/auth/PasswordStrengthIndicator.tsx`
- **RegistrationForm** - `src/frontend/app/components/auth/RegistrationForm.tsx`
- **function** - `src/frontend/app/components/booking/BookingActionMenu.tsx`
- **function** - `src/frontend/app/components/booking/BookingHistory.tsx`
- **function** - `src/frontend/app/components/booking/AccommodationSelector.tsx`
- **function** - `src/frontend/app/components/booking/BookingForm.tsx`
- **function** - `src/frontend/app/components/booking/BookingOverview.tsx`
- **function** - `src/frontend/app/components/booking/skeletons/BookingActionMenuSkeleton.tsx`
- **function** - `src/frontend/app/components/booking/skeletons/BookingAccommodationsSkeleton.tsx`
- **function** - `src/frontend/app/components/booking/skeletons/BookingOverviewSkeleton.tsx`
- **function** - `src/frontend/app/components/booking/skeletons/BookingHistorySkeleton.tsx`
- **function** - `src/frontend/app/components/booking/BookingNotes.tsx`
- **function** - `src/frontend/app/components/booking/DateRangePicker.tsx`
- **function** - `src/frontend/app/components/booking/BookingAccommodations.tsx`
- **function** - `src/frontend/app/components/ViewToggle.tsx`
- **metadata:** - `src/frontend/app/layout.tsx`
- **function** - `src/frontend/app/verify-email/page.tsx`
- **function** - `src/frontend/app/admin/sleeping-accommodations/page.tsx`
- **function** - `src/frontend/app/admin/sleeping-accommodations/[id]/edit/page.tsx`
- **function** - `src/frontend/app/admin/sleeping-accommodations/new/page.tsx`
- **function** - `src/frontend/app/admin/layout.tsx`
- **function** - `src/frontend/app/admin/page.tsx`
- **function** - `src/frontend/app/admin/users/page.tsx`
- **function** - `src/frontend/app/page.tsx`
- **function** - `src/frontend/app/login/page.tsx`
- **function** - `src/frontend/app/bookings/page.tsx`
- **function** - `src/frontend/app/bookings/[id]/page.tsx`
- **function** - `src/frontend/app/bookings/new/page.tsx`
- **function** - `src/frontend/app/api-test/page.tsx`
- **function** - `src/frontend/app/register/page.tsx`
- **ApiProvider:** - `src/frontend/contexts/ApiContext.tsx`
- **useAlert** - `src/frontend/hooks/useAlert.tsx`

### 🌐 Verfügbare Routen
- **/verify-email** - `src/frontend/app/verify-email/page.tsx`
- **/admin/sleeping-accommodations** - `src/frontend/app/admin/sleeping-accommodations/page.tsx`
- **/admin/sleeping-accommodations/:id/edit** - `src/frontend/app/admin/sleeping-accommodations/[id]/edit/page.tsx`
- **/admin/sleeping-accommodations/new** - `src/frontend/app/admin/sleeping-accommodations/new/page.tsx`
- **/admin** - `src/frontend/app/admin/page.tsx`
- **/admin/users** - `src/frontend/app/admin/users/page.tsx`
- **/** - `src/frontend/app/page.tsx`
- **/login** - `src/frontend/app/login/page.tsx`
- **/bookings** - `src/frontend/app/bookings/page.tsx`
- **/bookings/:id** - `src/frontend/app/bookings/[id]/page.tsx`
- **/bookings/new** - `src/frontend/app/bookings/new/page.tsx`
- **/api-test** - `src/frontend/app/api-test/page.tsx`
- **/register** - `src/frontend/app/register/page.tsx`

## 🔌 API-Endpoints

### Backend-Controller
#### EmailSettingsController

**Base Route:** `api/admin/email-settings`

**Endpoints:**
- **GET** `api/admin/email-settings/[HttpGet]`
- **PUT** `api/admin/email-settings/[HttpPut]`
- **POST("TEST")** `api/admin/email-settings/test`

_Datei: `src/backend/Booking.Api/Features/EmailSettings/EmailSettingsController.cs`_

#### ProjectionManagementController

**Base Route:** `api/admin/projections`

**Endpoints:**
- **POST("SLEEPING-ACCOMMODATIONS/{ID}/REBUILD")** `api/admin/projections/sleeping-accommodations/{id}/rebuild`
- **POST("SLEEPING-ACCOMMODATIONS/REBUILD-ALL")** `api/admin/projections/sleeping-accommodations/rebuild-all`
- **POST("SLEEPING-ACCOMMODATIONS/{ID}/PROJECT")** `api/admin/projections/sleeping-accommodations/{id}/project`

_Datei: `src/backend/Booking.Api/Controllers/ProjectionManagementController.cs`_

#### BookingsController

**Base Route:** `api/bookings`

**Endpoints:**
- **GET** `api/bookings/[HttpGet]`
- **GET("{ID:GUID}")** `api/bookings/{id:guid}`
- **POST** `api/bookings/[HttpPost]`
- **PUT("{ID:GUID}")** `api/bookings/{id:guid}`
- **POST("{ID:GUID}/CANCEL")** `api/bookings/{id:guid}/cancel`
- **POST("{ID:GUID}/CONFIRM")** `api/bookings/{id:guid}/confirm`
- **POST("{ID:GUID}/ACCEPT")** `api/bookings/{id:guid}/accept`
- **POST("{ID:GUID}/REJECT")** `api/bookings/{id:guid}/reject`
- **GET("AVAILABILITY")** `api/bookings/availability`
- **POST("VALIDATE")** `api/bookings/validate`
- **GET("DEBUG/EVENTS")** `api/bookings/debug/events`
- **POST("PROJECTIONS/REBUILD")** `api/bookings/projections/rebuild`

_Datei: `src/backend/Booking.Api/Controllers/BookingsController.cs`_

#### BaseApiController

**Base Route:** `api/[controller]`

**Endpoints:**

_Datei: `src/backend/Booking.Api/Controllers/BaseApiController.cs`_

#### SleepingAccommodationsController

**Base Route:** `api/sleeping-accommodations`

**Endpoints:**
- **GET** `api/sleeping-accommodations/[HttpGet]`
- **GET("{ID:GUID}")** `api/sleeping-accommodations/{id:guid}`
- **POST** `api/sleeping-accommodations/[HttpPost]`
- **PUT("{ID:GUID}")** `api/sleeping-accommodations/{id:guid}`
- **DELETE("{ID:GUID}")** `api/sleeping-accommodations/{id:guid}`

_Datei: `src/backend/Booking.Api/Controllers/SleepingAccommodationsController.cs`_

#### AuthController

**Endpoints:**
- **POST("LOGIN")** `/login`
- **POST("REGISTER")** `/register`
- **POST("VERIFY-EMAIL")** `/verify-email`
- **POST("RESEND-VERIFICATION")** `/resend-verification`

_Datei: `src/backend/Booking.Api/Controllers/AuthController.cs`_

#### AdminController

**Base Route:** `api/[controller]`

**Endpoints:**
- **GET("USERS/PENDING")** `api/[controller]/users/pending`
- **POST("USERS/{USERID:INT}/APPROVE")** `api/[controller]/users/{userId:int}/approve`
- **POST("USERS/{USERID:INT}/REJECT")** `api/[controller]/users/{userId:int}/reject`

_Datei: `src/backend/Booking.Api/Controllers/AdminController.cs`_


## 📊 Datenmodelle

### Entities (Domain Models)
- **User** - `src/backend/Booking.Api/Domain/Entities/User.cs`
- **EventStoreSnapshot** - `src/backend/Booking.Api/Domain/Entities/EventStoreSnapshot.cs`
- **EmailSettings** - `src/backend/Booking.Api/Domain/Entities/EmailSettings.cs`
- **SleepingAccommodation** - `src/backend/Booking.Api/Domain/Entities/SleepingAccommodation.cs`
- **EventStoreEvent** - `src/backend/Booking.Api/Domain/Entities/EventStoreEvent.cs`

### Read Models (Projections)
- **SleepingAccommodationReadModel** - `src/backend/Booking.Api/Domain/ReadModels/SleepingAccommodationReadModel.cs`
- **BookingReadModel** - `src/backend/Booking.Api/Domain/ReadModels/BookingReadModel.cs`

## 🛠 Technologie-Stack

### Backend
- **.NET 9** - Web API mit Native AOT
- **Entity Framework Core** - Datenzugriff
- **PostgreSQL** - Datenbank
- **MediatR** - CQRS Pattern
- **xUnit** - Testing Framework

### Frontend  
- **Next.js 15** - React Framework mit App Router
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling
- **Jest** - Unit Testing
- **Playwright** - E2E Testing

### DevOps
- **Docker** - Containerization
- **GitHub Actions** - CI/CD
- **Multi-Agent Development** - Parallele Entwicklung mit Git Worktrees


_Letztes Update: 2025-07-31 16:48:19_
