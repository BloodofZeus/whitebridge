# Finora Banking Application

A comprehensive full-stack banking application built with modern web technologies, featuring user authentication, account management, money transfers, and administrative controls.

## 🏦 Overview

Finora is a complete banking solution that provides:
- **Customer Banking**: Account overview, transaction history, money transfers, bill payments
- **Admin Dashboard**: User management, transfer approvals, audit logs, system statistics
- **Public Website**: Marketing pages, branch finder, product information
- **Security Features**: Role-based authentication, session management, audit trails

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd finora-banking-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/finora_db
   SESSION_SECRET=your-super-secret-session-key
   NODE_ENV=development
   ```

4. **Initialize the database**
   ```bash
   # Create database tables
   npm run db:push
   
   # Seed with sample data
   npm run db:seed
   ```

5. **Start the application**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5000
   - Admin login: admin@admin.com / admin123
   - Customer login: john.doe@email.com / password123

## 🏗️ Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state caching
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with custom Finora design system
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with bcrypt password hashing
- **Session Storage**: PostgreSQL-backed sessions
- **API Design**: RESTful endpoints with proper error handling

### Database Schema
- **Users**: Authentication and profile information
- **Accounts**: Bank accounts with balances and status
- **Transfers**: Money transfer requests and approvals
- **Transactions**: Detailed transaction history
- **Audit Logs**: System activity tracking
- **Email Notifications**: Communication history

## 📁 Project Structure

```
finora-banking-app/
├── client/                     # Frontend React application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ui/           # Base UI components (buttons, forms, etc.)
│   │   │   ├── admin/        # Admin-specific components
│   │   │   └── customer/     # Customer-specific components
│   │   ├── pages/            # Page components and routes
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utility functions and configurations
│   │   └── index.css         # Global styles and Tailwind config
├── server/                    # Backend Express application
│   ├── auth.ts               # Authentication configuration
│   ├── routes.ts             # API route definitions
│   ├── storage.ts            # Data access layer
│   ├── db.ts                 # Database connection
│   ├── seed.ts               # Database seeding script
│   └── index.ts              # Server entry point
├── shared/                   # Shared TypeScript definitions
│   └── schema.ts             # Database schema and validation
├── package.json              # Dependencies and scripts
├── tailwind.config.ts        # Tailwind CSS configuration
├── vite.config.ts           # Vite build configuration
└── drizzle.config.ts        # Database migration configuration
```

## 🎨 Design System

### Color Palette
```css
/* Primary Finora Colors */
--finora-primary: #1E3A8A    /* Primary Blue */
--finora-secondary: #0F766E  /* Teal Green */
--finora-accent: #0EA5E9     /* Sky Blue */
--finora-light: #EFF6FF      /* Light Blue */
--finora-dark: #1E293B       /* Dark Blue */
```

### Typography
- **Primary Font**: Inter font family with system font fallback
- **Headings**: Bold weights (600-700)
- **Body Text**: Regular weight (400)
- **UI Text**: Medium weight (500)

### Mobile-First Responsive Design
- **Breakpoints**: Mobile (375px+), Tablet (640px+), Desktop (1024px+)
- **Navigation**: Collapsible hamburger menus on mobile
- **Typography**: Responsive text scaling across all screen sizes
- **Layouts**: Flexible grid systems that adapt to screen size
- **Touch Targets**: Minimum 44px for all interactive elements on mobile

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Database
npm run db:push      # Apply schema changes to database
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open database management interface

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

### Development Workflow

1. **Feature Development**
   ```bash
   # Create feature branch
   git checkout -b feature/new-feature
   
   # Make changes
   # Test locally
   npm run dev
   
   # Check for issues
   npm run lint
   npm run type-check
   
   # Commit and push
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   ```

2. **Database Changes**
   ```bash
   # Modify schema in shared/schema.ts
   # Apply changes
   npm run db:push
   
   # If needed, re-seed data
   npm run db:seed
   ```

## 🔐 Authentication & Security

### Authentication Flow
1. User submits login credentials
2. Server validates against database (bcrypt)
3. Session created and stored in PostgreSQL
4. Session ID returned as HTTP-only cookie
5. Subsequent requests authenticated via session

### Security Features
- **Password Hashing**: bcrypt with salt rounds
- **Session Management**: Secure HTTP-only cookies
- **CSRF Protection**: SameSite cookie policy
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Parameterized queries
- **Rate Limiting**: Request throttling on sensitive endpoints

## 🏦 Banking Features

### Customer Features
- **Account Overview**: Balance and account information with mobile-optimized layouts
- **Transaction History**: Detailed transaction records with responsive tables
- **Money Transfers**: Internal and external transfers with mobile-friendly forms
- **Bill Payments**: Utility and service payments with touch-optimized interfaces
- **Card Management**: Debit/credit card controls with mobile card layouts
- **Investment Dashboard**: Portfolio management with responsive charts
- **Profile Management**: Personal information updates with mobile forms
- **Customer Support**: Integrated chat and ticket system
- **Notifications Center**: Real-time alerts and messaging

### Admin Features
- **User Management**: Create, update, disable accounts with responsive admin tables
- **Transfer Approval**: Review and approve large transfers with mobile workflows
- **Account Controls**: Freeze/unfreeze accounts with simplified mobile interfaces
- **Audit Logs**: System activity monitoring with mobile-optimized views
- **Statistics Dashboard**: Key metrics and analytics with responsive charts
- **Support Tickets**: Customer service management with mobile support tools
- **Email Configuration**: Notification management system
- **KYC Management**: Document verification workflows

## 🔧 Configuration

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Authentication
SESSION_SECRET=your-secret-key-here

# Application
NODE_ENV=development|production
PORT=5000

# Optional: Email notifications
RESEND_API_KEY=your-resend-api-key
```

### Customization

1. **Branding**: Update colors in `client/src/index.css`
2. **Logo**: Replace logo assets in `attached_assets/`
3. **Content**: Modify page content in `client/src/pages/`
4. **Features**: Add new routes in `client/src/App.tsx` and `server/routes.ts`

## 📊 Database Schema

### Core Tables

**Users Table**
```sql
users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  role user_role DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT NOW()
)
```

**Accounts Table**
```sql
accounts (
  id UUID PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  account_number VARCHAR UNIQUE,
  account_type VARCHAR DEFAULT 'checking',
  balance DECIMAL(15,2) DEFAULT 0.00,
  status account_status DEFAULT 'active'
)
```

**Transfers Table**
```sql
transfers (
  id UUID PRIMARY KEY,
  from_account_id UUID REFERENCES accounts(id),
  to_account_id UUID REFERENCES accounts(id),
  amount DECIMAL(15,2) NOT NULL,
  status transfer_status DEFAULT 'pending',
  description TEXT
)
```

## 🚀 Deployment

### Production Setup

1. **Environment Setup**
   ```bash
   # Set production environment variables
   export NODE_ENV=production
   export DATABASE_URL=your-production-db-url
   export SESSION_SECRET=your-production-secret
   ```

2. **Build Application**
   ```bash
   npm run build
   ```

3. **Database Migration**
   ```bash
   npm run db:push
   ```

4. **Start Production Server**
   ```bash
   npm start
   ```

### Deployment Platforms

- **Replit**: Fully configured for Replit Deployments
- **Vercel**: Frontend deployment with API routes
- **Railway**: Full-stack deployment with PostgreSQL
- **Heroku**: Traditional PaaS deployment
- **Docker**: Container-based deployment

## 📈 Performance & Monitoring

### Performance Features
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Responsive images with lazy loading
- **Caching**: TanStack Query for intelligent data caching
- **Bundle Optimization**: Vite's optimized build process

### Monitoring
- **Error Handling**: Comprehensive error boundaries
- **Logging**: Structured request/response logging
- **Metrics**: Built-in performance monitoring
- **Health Checks**: Application health endpoints

## 🧪 Testing

### Testing Strategy
```bash
# Unit Tests
npm run test:unit

# Integration Tests  
npm run test:integration

# End-to-End Tests
npm run test:e2e

# All Tests
npm run test
```

### Test Accounts
- **Admin**: admin@admin.com / admin123
- **Customer 1**: john.doe@email.com / password123
- **Customer 2**: jane.smith@email.com / password123

## 🤝 Contributing

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Code formatting
- **Conventional Commits**: Commit message format

### Pull Request Process
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Code review and approval
6. Merge to main branch

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

## 🔧 Recent Fixes & Updates

### Latest Improvements ✅
- **Mobile Responsiveness**: Completely redesigned for mobile-first experience
  - Customer dashboard tabs now responsive (2-5 columns instead of 10 on mobile)
  - Added hamburger navigation menus for both main and customer navbars
  - Optimized text sizes, button spacing, and layouts for mobile devices
  - Improved account cards and forms for better mobile readability
  - Enhanced hero section and landing page for mobile optimization
- **Authentication System**: Fixed session persistence and automatic logout issues 
- **Customer Dashboard**: Resolved redirect loops causing endless login attempts
- **Profile Updates**: Fixed timestamp conversion errors for date fields (dateOfBirth)
- **Document Upload**: Added missing `/api/profile/documents` endpoint for KYC documents
- **Database Schema**: Proper handling of date/timestamp fields in customer profiles
- **Redirect Issues**: Fixed wrong redirect URLs from `/api/login` to `/login`

### Known Working Features
- ✅ Admin login (admin@admin.com / admin123)
- ✅ Customer registration and login
- ✅ Profile information updates
- ✅ Document upload for verification
- ✅ Session persistence across page refreshes
- ✅ Role-based dashboard access
- ✅ **Fully responsive mobile design** - Works perfectly on all mobile devices
- ✅ Account management with real-time balance updates
- ✅ Money transfer system with approval workflow
- ✅ Transaction history and analytics
- ✅ Bill payment functionality
- ✅ Card management system
- ✅ Investment dashboard
- ✅ Customer support system
- ✅ Administrative controls and user management

## 📞 Support

### Getting Help
- **Documentation**: Check this README and code comments
- **Issues**: Create GitHub issue for bugs/features
- **Discussions**: Use GitHub Discussions for questions
- **Email**: support@finora.com

### Troubleshooting

**Common Issues:**

1. **Database Connection Errors**
   ```bash
   # Check DATABASE_URL format
   postgresql://username:password@localhost:5432/database_name
   
   # Verify PostgreSQL is running
   pg_ctl status
   ```

2. **Build Failures**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Authentication Issues**
   ```bash
   # Check SESSION_SECRET is set
   echo $SESSION_SECRET
   
   # Clear browser cookies
   # Check network tab for session cookie
   ```

---

**Built with ❤️ using modern web technologies**