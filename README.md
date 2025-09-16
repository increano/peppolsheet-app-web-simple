# PeppolSheet Web Frontend

Modern Next.js 14 web application for multi-tenant e-invoicing and cashflow management.

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Supabase project with authentication enabled

### Installation

1. **Clone and navigate to the project**:
   ```bash
   cd frontend/web
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks

# Development Tools
npm run dev:turbo    # Start with Turbopack (experimental)
```

## 🏗️ Project Structure

```
web/
├── app/                 # Next.js 14 App Router
│   ├── [locale]/       # Internationalized routes
│   ├── api/            # API routes
│   └── globals.css     # Global styles
├── components/         # React components
│   ├── auth/          # Authentication components
│   ├── ui/            # UI components (Shadcn)
│   └── shared/        # Shared components
├── lib/               # Utilities and configurations
├── hooks/             # Custom React hooks
├── messages/          # i18n translations
├── public/            # Static assets
└── docs/              # Project documentation
```

## 🌐 Features

- **Multi-tenant Architecture**: Support for multiple business entities
- **Authentication**: Supabase Auth integration
- **Internationalization**: English and French support
- **Modern UI**: Shadcn/ui components with Tailwind CSS
- **Type Safety**: Full TypeScript implementation
- **Responsive Design**: Mobile-first approach

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ |

### Supabase Setup

1. Create a new Supabase project
2. Enable authentication in your Supabase dashboard
3. Configure authentication providers (optional)
4. Copy your project URL and keys to `.env.local`

## 📱 Usage

### Authentication
- Navigate to `/login` to sign in
- Navigate to `/signup` to create an account
- Email verification is required for new accounts

### Multi-tenant Features
- Create or join business entities during onboarding
- Switch between tenants using the tenant switcher
- Each tenant has isolated data and settings

## 🛠️ Development

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Internationalization**: next-intl

### Code Quality
- ESLint for code linting
- TypeScript for type safety
- Prettier for code formatting (recommended)

## 📚 Documentation

Detailed project documentation is available in the [`docs/`](./docs/) directory:

- **[Project Status](./docs/implementation/PROJECT_STATUS.md)** - Current implementation status
- **[Authentication](./docs/auth/)** - Authentication system documentation
- **[Search Features](./docs/search/)** - Search implementation guides
- **[PEPPOL Integration](./docs/peppol/)** - PEPPOL network integration
- **[API Integration](./docs/integration/)** - External API integrations

## 🐛 Troubleshooting

### Common Issues

**Build Errors**:
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

**Environment Variables**:
- Ensure all required environment variables are set
- Check that Supabase URLs and keys are correct
- Verify Supabase project is active

**Authentication Issues**:
- Confirm Supabase authentication is enabled
- Check email confirmation settings
- Verify redirect URLs in Supabase dashboard

## 🤝 Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Update documentation for significant changes
4. Test authentication flows before submitting

## 📄 License

This project is part of the PeppolSheet application suite.

---

For detailed implementation status and technical documentation, see [`docs/implementation/PROJECT_STATUS.md`](./docs/implementation/PROJECT_STATUS.md).