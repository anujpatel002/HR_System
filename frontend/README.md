# WorkZen Frontend

Next.js 14 frontend for the WorkZen HR Management System.

## Features

- Modern React with Next.js 14 App Router
- Responsive design with Tailwind CSS
- Interactive charts with Recharts
- Redux Toolkit for state management
- Role-based UI components
- Real-time form validation

## Setup

1. **Install dependencies**
```bash
npm install
```

2. **Environment setup**
```bash
cp .env.local.example .env.local
# Edit .env.local with your API URL
```

3. **Start development server**
```bash
npm run dev
```

The app will be available at http://localhost:3000

## Project Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Protected dashboard pages
│   └── layout.jsx         # Root layout
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # API client and utilities
├── store/                 # Redux store and slices
├── styles/                # Global CSS and Tailwind
└── utils/                 # Helper functions and constants
```

## Key Components

### Authentication
- Login page with form validation
- JWT token management
- Automatic redirect handling

### Dashboard Pages
- **Main Dashboard**: Overview with charts and stats
- **Attendance**: Check-in/out and history
- **Leave**: Apply and manage leave requests
- **Payroll**: View payslips and generate payroll
- **Admin**: User management (Admin/HR only)
- **Analytics**: Comprehensive HR analytics

### UI Components
- **Navbar**: User info and logout
- **Sidebar**: Role-based navigation
- **StatsCard**: Metric display cards
- **Charts**: Interactive data visualizations

## Role-Based Access

The UI adapts based on user roles:

- **Employee**: Basic access to personal data
- **HR Officer**: User and leave management
- **Payroll Officer**: Payroll generation and management
- **Admin**: Full system access

## State Management

Redux Toolkit manages:
- User authentication state
- API loading states
- Error handling
- User profile data

## API Integration

Axios client with:
- Automatic token attachment
- Response interceptors
- Error handling
- Cookie-based authentication

## Styling

Tailwind CSS with:
- Custom component classes
- Responsive design
- Dark/light theme support
- Consistent color palette

## Charts and Analytics

Recharts library provides:
- Bar charts for payroll trends
- Pie charts for department distribution
- Line charts for attendance trends
- Interactive tooltips and legends

## Build and Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

Recommended deployment platforms:
- **Vercel**: Optimized for Next.js
- **Netlify**: Static site hosting
- **AWS Amplify**: Full-stack deployment

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=WorkZen
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)