---
description: Repository Information Overview
alwaysApply: true
---

# Cloud Ledger Information

## Summary
A Next.js-based accounting and inventory management system with features for sales, purchases, ledger management, and financial reporting. The application provides comprehensive business management capabilities including customer management, supplier tracking, stock validation, and financial accounting.

## Structure
- **app/**: Next.js application with pages, API routes, and components
- **components/**: Reusable UI components for the application
- **lib/**: Core business logic, database models, and services
- **public/**: Static assets like images and icons
- **scripts/**: Utility scripts for database operations and fixes
- **tests/**: Testing files for application functionality

## Language & Runtime
**Language**: JavaScript/React
**Version**: Next.js 15.3.1, React 19.0.0
**Build System**: Next.js build system
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- **Framework**: Next.js 15.3.1, React 19.0.0
- **Database**: Mongoose 8.13.2 (MongoDB)
- **Accounting**: Medici 7.1.0 (double-entry accounting)
- **UI**: Radix UI components, Tailwind CSS
- **PDF/Excel**: @react-pdf/renderer 4.3.0, jspdf 3.0.1, xlsx 0.18.5
- **Authentication**: jsonwebtoken 9.0.2, bcryptjs 3.0.2
- **Localization**: nepali-date-converter 3.4.0

**Development Dependencies**:
- ESLint 9.x
- Tailwind CSS 4.x
- Babel runtime 7.27.0

## Database
**Type**: MongoDB
**Connection**: Mongoose ORM with connection pooling
**Models**: Account, ChartOfAccounts, Customer, Invoice, Item, Organization, Payment, StockEntry, Supplier, Transaction

## Build & Installation
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start
```

## Main Components
**Accounting System**:
- Chart of accounts management
- Journal entries and ledger
- Trial balance and financial reports
- Day book and transaction tracking

**Inventory Management**:
- Stock tracking and validation
- Item management with stock warnings
- Warehouse operations

**Sales System**:
- Sales vouchers and returns
- Customer management
- Invoice generation and PDF/Excel exports

**Purchase System**:
- Purchase orders and bills
- Supplier management
- Purchase returns

## API Structure
- **/api/accounting/**: Accounting-related endpoints
- **/api/organization/**: Organization management
- **/api/inventory/**: Stock and inventory management
- **/api/auth/**: Authentication and user management

## Testing
**Test Files**: Limited testing implementation in tests directory
**Test File**: profit-loss-test.js for testing profit and loss calculations

## Authentication
**Method**: JWT-based authentication
**Storage**: Cookie-based token storage
**Routes**: Login, register, forgot-password, and reset-password