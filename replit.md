# ParcelX Admin Dashboard

## Overview
A comprehensive admin dashboard for ParcelX logistics system built with Next.js, TypeScript, and Mantine UI. The dashboard manages shipments and user profiles with full CRUD operations, status tracking, and real-time data display.

## Technology Stack
- **Framework**: Next.js 14 (Pages Router)
- **Language**: TypeScript
- **UI Library**: Mantine v8 with Tabler Icons
- **State Management**: TanStack React Query
- **Database**: Supabase (PostgreSQL)
- **Form Handling**: React Hook Form with Zod validation

## Project Architecture
```
pages/
├── _app.tsx                # App wrapper with providers
├── index.tsx               # Dashboard page
├── shipments/
│   ├── index.tsx           # Shipment list
│   ├── new.tsx             # Create shipment
│   └── [id].tsx            # Shipment details
└── users/
    ├── index.tsx           # User profiles list
    └── [id].tsx            # User profile details
components/
└── Layout.tsx              # App layout with sidebar
lib/
└── supabase.ts             # Supabase client and types
```

## Features
- **Dashboard**: Statistics cards, delivery performance chart, recent shipments, status overview
- **Shipments Management**: List view with search/filter, pagination, status updates, delete functionality
- **Shipment Creation**: Auto-generated tracking numbers, user assignment, estimated delivery
- **Shipment Details**: Edit form, tracking history timeline, add tracking updates
- **Users Management**: Profile list with search, shipment count display
- **User Details**: Profile editing, associated shipments view

## Database Schema (Supabase)
- **profiles**: User profiles (id, email, full_name, country, phone, etc.)
- **shipments**: Shipments (tracking_number, status, origin, destination, estimated_delivery)
- **tracking_updates**: Tracking events (shipment_id, location, description, status, occurrence_time)

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous/public key

## Development
```bash
npm run dev    # Start development server on port 5000
npm run build  # Build for production
npm run start  # Start production server
```

## Recent Changes
- **2026-01-11**: Migrated from Vite to Next.js with pages router
- Implemented Dashboard, Shipments, Users pages with full CRUD
- Integrated Supabase for data persistence
- Uses NEXT_PUBLIC_ environment variables for Supabase configuration
