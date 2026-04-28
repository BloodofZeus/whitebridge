# Replit.md

## Overview

This is a full-stack banking application built with Express.js, React, and PostgreSQL. The application provides a complete banking system with user authentication, account management, money transfers, and administrative controls. It features a modern UI built with shadcn/ui components and implements proper security measures for financial transactions.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Updates

### NorthBridge Capital Bank Rebrand & Homepage Redesign (Task #6 — Latest)
The public-facing site has been fully rebranded from "Finora Bank" to **NorthBridge Capital Bank Ltd.** (UK-based, FCA-regulated):
- **Brand**: All public pages now show NorthBridge branding with shield logo. Currency is £ (GBP). UK regulatory info (FCA No. 778901, FSCS, company reg. 09284756, Manchester address).
- **Color palette**: Teal/emerald accent `#00C896` replaced with crimson red `#C5003E` across all CSS variables and public components. Legacy `--finora-*` variables retained as aliases for backward compatibility with authenticated pages.
- **3-tier US Bank-style navbar** (`navbar.tsx`): Utility bar (gray, thin, Log In button in red) + Primary nav (white, shield logo, 5 mega-menu tabs with hover dropdowns) + Navy blue sub-nav (6 product quick-links). Mobile hamburger collapses all tiers.
- **Hero slideshow** (`landing.tsx`): 4-slide auto-carousel with Unsplash photos, left overlay card (category + headline + 2 CTAs), right "Access your account" card with login/enroll links, prev/next arrows, dot indicators.
- **Account Plans section**: Replaced 6-card product grid with Standard (£0) / Plus (£9.99/mo, "Most Popular") / Premium (£24.99/mo) pricing cards with checkmark features and FSCS small print.
- **Our People section**: 4 leadership headshot photo cards (Oliver Grant, Sarah Whitmore, James Kaur, Linda Rahman).
- **Testimonials**: Replaced avatar initials with Unsplash circular photos; UK names and NorthBridge references.
- **Why NorthBridge**: Full-bleed photo background with dark overlay; red icon wrappers; FSCS/FCA UK copy.
- **Stats bar**: 1.2M+ customers, £3.8B+ assets, 4 UK cities, Est. 2014.
- **BOA-style login page** (`login.tsx`): FSCS top bar + white header + crimson red banner + 3-column layout (Sign In form | App promo | Help links) + secure gray footer. All existing auth logic preserved.
- **Footer**: Manchester address (85 King Street, M2 4WQ), UK phone/email, SWIFT NBCBGB2M, Sort Code 40-62-18, company reg.
- Authenticated dashboard pages are **out of scope** — brand rename deferred to a follow-up task.

### Mobile Responsiveness (Latest Update)
The application has been completely optimized for mobile devices with:
- **Responsive Navigation**: Hamburger menus for both main and customer navigation
- **Adaptive Layouts**: Customer dashboard tabs now display properly on mobile (2-5 columns instead of cramped 10)
- **Mobile-First Typography**: Responsive text sizing that scales appropriately across devices
- **Touch-Friendly Interface**: Properly sized touch targets and improved button spacing
- **Optimized Forms**: Account cards and forms redesigned for mobile readability
- **Enhanced Landing Page**: Hero sections and service icons optimized for mobile viewing

### Authentication & Login System
- Admin login: admin@admin.com / admin123
- Customer login system working with proper session management
- Role-based access control functioning correctly
- Fixed redirect loops and session persistence issues

### Banking Features Status
All core banking features are functional:
- Account management with real-time balance updates
- Money transfer system with approval workflow
- Transaction history and detailed analytics
- Bill payment functionality
- Card management system
- Investment dashboard with charts
- Customer support system with chat
- Administrative controls and user management

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and Vite for build tooling
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom Santander brand colors and design system
- **Routing**: Wouter for client-side routing with role-based access control
- **State Management**: TanStack Query for server state management and caching
- **Form Handling**: React Hook Form with Zod validation

The frontend follows a component-based architecture with clear separation between customer and admin interfaces. The application uses a mobile-first responsive design that provides optimal user experience across all devices, with special attention to mobile banking users who represent the majority of our user base.

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with OpenID Connect integration
- **Session Management**: PostgreSQL-backed sessions with connect-pg-simple
- **Email Service**: Resend API integration for notifications

The backend implements a RESTful API structure with proper error handling, request logging, and middleware for authentication and authorization.

### Database Design
- **Primary Database**: PostgreSQL (Neon serverless)
- **Schema Management**: Drizzle migrations with schema defined in shared TypeScript files
- **Key Tables**:
  - Users with role-based access (admin/customer)
  - Accounts with status management (active/frozen/closed)
  - Transfers with approval workflow and status tracking
  - Transactions for detailed financial history
  - Audit logs for compliance and security tracking
  - Email notifications for communication history

The database schema enforces referential integrity and includes proper indexing for performance.

### Authentication & Authorization
- **Provider**: Replit Auth (OpenID Connect)
- **Session Storage**: PostgreSQL with automatic cleanup
- **Authorization**: Role-based access control (admin vs customer)
- **Security**: HTTPS enforcement, secure cookies, CSRF protection

### Business Logic
- **Transfer Workflow**: Multi-step approval process with admin oversight
- **Account Management**: Creation, status updates, balance tracking
- **Audit Trail**: Comprehensive logging of all financial operations
- **Email Notifications**: Automated alerts for important events

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL serverless database
- **Authentication**: Replit Auth service for user management
- **Email Service**: Resend API for transactional emails
- **Session Storage**: PostgreSQL-based session management

### Development Tools
- **Build System**: Vite for fast development and optimized production builds
- **Type Safety**: TypeScript across the entire stack
- **Database Migrations**: Drizzle Kit for schema management
- **UI Components**: Radix UI primitives with shadcn/ui styling

### Third-Party Libraries
- **Frontend**: React Query for data fetching, Wouter for routing, React Hook Form for forms
- **Backend**: Express.js web framework, Passport.js for authentication middleware
- **Database**: Drizzle ORM with Neon driver
- **Styling**: Tailwind CSS with custom design tokens

The application is designed to be deployed on Replit with minimal configuration, leveraging Replit's built-in authentication and database provisioning.