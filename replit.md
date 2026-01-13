# ParcelX Admin Dashboard

## Overview
A comprehensive admin dashboard for ParcelX logistics system built with Next.js and Mantine UI. The dashboard manages shipments, user profiles, and flight operations with full CRUD operations, status tracking, and real-time data display. Protected by admin password authentication.

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
│   └── [id].js             # Shipment details with image upload
├── users/
│   ├── index.js            # User profiles list
│   └── [id].js             # User profile details
├── flights/
│   ├── index.js            # Flights list with search/filter
│   ├── new.js              # Create flight
│   └── [id].js             # Flight details/edit
├── airlines/
│   └── index.js            # Airlines management
├── airports/
│   └── index.js            # Airports management
└── crypto-wallets/
    └── index.js            # Crypto wallets management
components/
├── Layout.js               # App layout with sidebar navigation
└── AdminAuth.js            # Admin password protection
lib/
└── supabase.js             # Supabase client and constants
```

## Features

### Shipments
- **Shipments Management**: List view with search/filter, pagination, status updates, delete functionality
- **Shipment Creation**: Auto-generated tracking numbers, user assignment, estimated delivery
- **Shipment Details**: Edit form, tracking history timeline, add tracking updates
- **Parcel Photos**: Upload, view, and delete parcel images
- **Extended Fields**: Item name, quantity, category, customs info, insurance

### Flight Management
- **Flights**: List with search, filter by airline/status, pagination, action buttons (view, edit, duplicate, activate/deactivate, delete)
- **Flight Details**: Flight number, airline, airports, schedule, pricing per cabin class, amenities, operating days
- **Airlines**: CRUD operations for airline management (code, name, country, logo)
- **Airports**: CRUD operations for airport management (code, name, city, country, timezone, coordinates)

### Users
- **Users Management**: Profile list with search, shipment count display
- **User Details**: Profile editing, associated shipments view

### Crypto Wallets
- **Wallet Management**: Add, edit, delete crypto wallet addresses
- **Supported Networks**: ERC20, TRC20, BEP20, BTC, SOL, Polygon, and more
- **Wallet Details**: Crypto name, symbol, network type, wallet address, confirmations, display order
- **Quick Presets**: Fast selection for common cryptocurrencies (BTC, ETH, USDT, etc.)

### General
- **Admin Password Protection**: All pages require password authentication
- **Dashboard**: Statistics cards, delivery performance chart, recent shipments, status overview
- **Mobile Responsive**: All pages optimized for portrait/mobile screens

## Database Schema (Supabase)
- **profiles**: User profiles (id, email, full_name, country, phone, etc.)
- **shipments**: Shipments with sender/receiver info, item details, customs, insurance
- **shipment_images**: Photos attached to shipments
- **tracking_updates**: Tracking events for shipments
- **flights**: Flight schedules with pricing and amenities
- **airlines**: Airline information
- **airports**: Airport information with coordinates
- **flight_bookings**: User flight bookings
- **flight_passengers**: Passenger details for bookings
- **crypto_wallets**: Crypto wallet addresses for payments

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
- **2026-01-13**: Added crypto wallets management page
- **2026-01-13**: Added flight management system (flights, airlines, airports pages)
- **2026-01-13**: Added item name, quantity, category, customs/insurance fields to shipments
- **2026-01-13**: Added parcel photo upload functionality
- **2026-01-11**: Converted from TypeScript to JavaScript
- **2026-01-11**: Added admin password protection
- **2026-01-11**: Migrated from Vite to Next.js with pages router
