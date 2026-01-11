# ParcelX Admin Dashboard

## Overview
A comprehensive admin dashboard for ParcelX logistics system built with React, TypeScript, and Mantine UI. The dashboard manages shipments and user profiles with full CRUD operations, status tracking, and real-time data display.

## Technology Stack
- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Mantine v8 with Tabler Icons
- **State Management**: TanStack React Query
- **Routing**: React Router DOM v6
- **Database**: Supabase (PostgreSQL)
- **Form Handling**: React Hook Form with Zod validation

## Project Architecture
```
src/
├── App.tsx                 # Main app with routing
├── main.tsx                # App entry point with providers
├── lib/
│   └── supabase.ts         # Supabase client and types
├── components/
│   └── Sidebar.tsx         # Navigation sidebar
└── pages/
    ├── Dashboard.tsx       # Statistics and overview
    ├── Shipments.tsx       # Shipment list with CRUD
    ├── CreateShipment.tsx  # New shipment form
    ├── ShipmentDetail.tsx  # Edit shipment and tracking history
    ├── Users.tsx           # User profiles list
    └── UserDetail.tsx      # Edit user profile
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

## Environment Variables Required
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous/public key

## Development
The app runs on port 5000 with Vite dev server. All hosts are allowed for Replit compatibility.

## Recent Changes
- **2026-01-11**: Built complete admin dashboard with all pages
- Implemented Dashboard, Shipments, Users pages
- Added routing with React Router
- Integrated Supabase for data persistence
- Added graceful handling when Supabase is not configured
