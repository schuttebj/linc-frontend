# LINC Driver's Licensing System - Frontend

## Overview

LINC Frontend is a modern React application built with TypeScript and Material-UI that provides a user-friendly interface for the LINC Driver's Licensing System. It features responsive design, comprehensive form validation, and modular architecture for multi-country deployment.

## Features

- **Modern React 18+**: Using latest React features with TypeScript
- **Material-UI v5**: Professional, accessible UI components
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Multi-Country Support**: Country-specific configurations and routing
- **Form Validation**: React Hook Form with Yup schema validation
- **Real-time Data**: React Query for efficient server state management
- **Modular Architecture**: Reusable components and clear separation of concerns
- **Comprehensive Testing**: Jest and React Testing Library

## Technology Stack

- **Frontend Framework**: React 18+
- **Language**: TypeScript
- **UI Library**: Material-UI v5
- **Form Management**: React Hook Form
- **Validation**: Yup schemas
- **State Management**: React Query + Zustand
- **Routing**: React Router v6
- **Build Tool**: Vite
- **Testing**: Jest + React Testing Library

## Quick Start

### Prerequisites

- Node.js 16+
- npm 8+ or yarn 1.22+

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd LINC\ Frontend
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Start the development server**
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

## Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run tests
npm run test:coverage # Run tests with coverage

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # TypeScript type checking
```

## Project Structure

```
LINC Frontend/
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── common/       # Generic components
│   │   ├── forms/        # Form components
│   │   └── layout/       # Layout components
│   ├── pages/            # Page components
│   │   ├── persons/      # Person management pages
│   │   ├── licenses/     # License management pages
│   │   └── admin/        # Administration pages
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API service functions
│   ├── types/            # TypeScript type definitions
│   ├── contexts/         # React contexts
│   ├── utils/            # Utility functions
│   ├── config/           # Configuration files
│   └── main.tsx         # Application entry point
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## Core Features

### Person Management

Implementation of Section 1.1 Person Registration/Search Screen:

**Person Registration Form**
- Identification type and number validation
- Personal details capture
- Address management
- Business rule validation (V00001-V00019)

**Person Search**
- Multi-criteria search functionality
- Results pagination
- Export capabilities

### Form Validation

Comprehensive validation using React Hook Form and Yup:

```typescript
// Example validation schema
const personValidationSchema = yup.object({
  identificationType: yup.string().required('Identification type is mandatory (V00001)'),
  identificationNumber: yup.string()
    .required('Identification number is mandatory (V00013)')
    .length(13, 'Must be 13 characters (V00018)'),
  firstName: yup.string().required('First name is required'),
  surname: yup.string().required('Surname is required'),
});
```

### Multi-Country Support

Country-specific configurations and routing:

```typescript
// Country selection affects:
- Available license types
- Validation rules
- Fee structures
- UI language/localization
- Available modules/features
```

## API Integration

### Service Layer

Axios-based services with React Query integration:

```typescript
// Example API service
export const personService = {
  create: (countryCode: string, personData: PersonCreateRequest) =>
    api.post(`/${countryCode}/persons/`, personData),
  
  search: (countryCode: string, searchParams: PersonSearchParams) =>
    api.get(`/${countryCode}/persons/search`, { params: searchParams }),
    
  validate: (countryCode: string, personData: PersonCreateRequest) =>
    api.post(`/${countryCode}/persons/validate`, personData),
};
```

### State Management

React Query for server state, Zustand for app state:

```typescript
// React Query hook example
const usePersonSearch = (countryCode: string, searchParams: PersonSearchParams) => {
  return useQuery({
    queryKey: ['persons', 'search', countryCode, searchParams],
    queryFn: () => personService.search(countryCode, searchParams),
    enabled: !!countryCode,
  });
};
```

## Component Architecture

### Reusable Components

**Form Components**
- `PersonForm`: Person registration/editing
- `AddressForm`: Address capture
- `ValidationSummary`: Business rule validation display

**Layout Components**
- `DashboardLayout`: Main application layout
- `Header`: Navigation and country selection
- `Sidebar`: Module navigation

**Common Components**
- `DataTable`: Paginated data display
- `LoadingSpinner`: Loading states
- `ErrorBoundary`: Error handling

### Component Example

```typescript
interface PersonFormProps {
  initialData?: PersonData;
  onSubmit: (data: PersonCreateRequest) => Promise<void>;
  countryCode: string;
}

export const PersonForm: React.FC<PersonFormProps> = ({
  initialData,
  onSubmit,
  countryCode
}) => {
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(personValidationSchema),
    defaultValues: initialData,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
};
```

## Styling and Theming

### Material-UI Theme

Custom theme configuration for professional appearance:

```typescript
export const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none' },
      },
    },
  },
});
```

### Responsive Design

Mobile-first responsive design using Material-UI breakpoints:

```typescript
const useStyles = makeStyles((theme) => ({
  container: {
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1),
    },
    [theme.breakpoints.up('md')]: {
      padding: theme.spacing(3),
    },
  },
}));
```

## Testing

### Unit Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Examples

```typescript
// Component test example
describe('PersonForm', () => {
  it('validates required fields', async () => {
    render(<PersonForm onSubmit={mockSubmit} countryCode="ZA" />);
    
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    expect(await screen.findByText(/identification type is mandatory/i)).toBeInTheDocument();
  });
});
```

## Deployment

### Vercel Deployment

1. **Connect Repository**
   - Sign in to Vercel
   - Import your Git repository

2. **Configure Build Settings**
   ```bash
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

3. **Environment Variables**
   ```bash
   VITE_API_BASE_URL=https://your-backend-api.com
   VITE_APP_TITLE=LINC Driver's Licensing System
   ```

4. **Deploy**
   - Vercel automatically deploys on git push
   - Preview deployments for branches
   - Production deployment for main branch

### Environment Configuration

Create environment files for different stages:

**.env.development**
```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_ENABLE_DEBUG=true
```

**.env.production**
```bash
VITE_API_BASE_URL=https://api.linc-system.com
VITE_ENABLE_DEBUG=false
```

### Build Optimization

Vite automatically optimizes builds:
- Code splitting by route
- Tree shaking for unused code
- Asset optimization
- Browser caching headers

## Configuration

### Country Configuration

Each country can have different configurations:

```typescript
interface CountryConfig {
  countryCode: string;
  countryName: string;
  currency: string;
  modules: {
    personManagement: boolean;
    licenseApplications: boolean;
    cardProduction: boolean;
    // ...
  };
  licenseTypes: string[];
  ageRequirements: Record<string, number>;
}
```

### Feature Toggles

Control feature availability per country:

```typescript
const useFeatureToggle = (feature: string, countryCode: string) => {
  const { data: countryConfig } = useCountryConfig(countryCode);
  return countryConfig?.modules[feature] || false;
};
```

## Development Guidelines

### Code Standards

- Use TypeScript strict mode
- Follow React best practices
- Implement proper error boundaries
- Use semantic HTML and ARIA labels
- Follow Material-UI design principles

### Performance Guidelines

- Use React.memo for expensive components
- Implement proper loading states
- Use React Query for data caching
- Lazy load routes and components
- Optimize bundle size

### Accessibility

- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management

## API Integration

### Backend Communication

The frontend communicates with the LINC Backend API:

```typescript
// API base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 10000,
});

// Request interceptor for auth
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow the coding standards
2. Write comprehensive tests
3. Update documentation
4. Ensure accessibility compliance
5. Test across supported browsers

## License

This project is proprietary software for government licensing systems. 