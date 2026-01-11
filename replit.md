# ParcelX Admin Dashboard

## Overview
A comprehensive admin dashboard for ParcelX logistics system built with Next.js and Mantine UI. The dashboard manages shipments and user profiles with full CRUD operations, status tracking, and real-time data display. Protected by admin password authentication.

## Technology Stack
- **Framework**: Next.js 14 (Pages Router)
- **Language**: JavaScript
- **UI Library**: Mantine v8 with Tabler Icons
- **State Management**: TanStack React Query
- **Database**: Supabase (PostgreSQL)
- **Form Handling**: React Hook Form with Zod validation

## Project Architecture
```
pages/
├── _app.js                 # App wrapper with providers and auth
├── index.js                # Dashboard page
├── shipments/
│   ├── index.js            # Shipment list
│   ├── new.js              # Create shipment
│   └── [id].js             # Shipment details
└── users/
    ├── index.js            # User profiles list
    └── [id].js             # User profile details
components/
├── Layout.js               # App layout with sidebar
└── AdminAuth.js            # Admin password protection
lib/
└── supabase.js             # Supabase client
```

## Features
- **Admin Password Protection**: All pages require password authentication
- **Dashboard**: Statistics cards, delivery performance chart, recent shipments, status overview
- **Shipments Management**: List view with search/filter, pagination, status updates, delete functionality
- **Shipment Creation**: Auto-generated tracking numbers, user assignment, estimated delivery
- **Shipment Details**: Edit form, tracking history timeline, add tracking updates
- **Users Management**: Profile list with search, shipment count display
- **User Details**: Profile editing, associated shipments view
- **Mobile Responsive**: All pages optimized for portrait/mobile screens

## Database Schema (Supabase)
- **profiles**: User profiles (id, email, full_name, country, phone, etc.)
- **shipments**: Shipments (tracking_number, status, origin, destination, estimated_delivery)
- **tracking_updates**: Tracking events (shipment_id, location, description, status, occurrence_time)

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous/public key
- `NEXT_PUBLIC_ADMIN_PASSWORD`: Admin password (default: admin123)

## Development
```bash
npm run dev    # Start development server on port 5000
npm run build  # Build for production
npm run start  # Start production server
```

## Recent Changes
- **2026-01-11**: Converted from TypeScript to JavaScript (.js files)
- **2026-01-11**: Added admin password protection for all pages
- **2026-01-11**: Improved mobile/portrait responsive layout
- **2026-01-11**: Migrated from Vite to Next.js with pages router
- Implemented Dashboard, Shipments, Users pages with full CRUD
- Integrated Supabase for data persistence
