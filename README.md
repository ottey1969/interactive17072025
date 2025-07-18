# Sofeia AI - Advanced Content Writing Platform

An enterprise-grade AI-powered content creation platform that leverages intelligent research and innovative generation capabilities to streamline digital content production.

## 🚀 Key Features

- **Multi-AI Integration**: Anthropic Claude Sonnet 4, Groq Processing, Perplexity API
- **Professional Grant Writing**: Specialized AI training for NIH, NSF, and foundation proposals
- **Enterprise Security**: IP whitelisting/blacklisting, VPN detection, device fingerprinting
- **Real-time AI Visualization**: Live thinking process with WebSocket connections
- **Local Authentication**: Secure password-based authentication without third-party dependencies
- **Admin Management**: Comprehensive user and security management system
- **SEO Optimization**: Advanced content optimization with keyword research

## 🛠 Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI with Tailwind CSS
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket server for live updates
- **Authentication**: Local session-based auth with scrypt hashing

### AI Services
- **Primary**: Anthropic Claude Sonnet 4
- **Fast Processing**: Groq Llama-3.1-70B
- **Research**: Perplexity API for live data
- **Intelligent Routing**: Smart service selection based on content type

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/sofeia-ai.git
   cd sofeia-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with:
   ```env
   DATABASE_URL=your_postgresql_url
   ANTHROPIC_API_KEY=your_anthropic_key
   GROQ_API_KEY=your_groq_key
   PERPLEXITY_API_KEY=your_perplexity_key
   SESSION_SECRET=your_session_secret
   ```

4. **Initialize the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔐 Security Features

- **IP Management**: Whitelist/blacklist system with admin controls
- **Rate Limiting**: 100 requests/hour, 1000/day limits
- **VPN Detection**: Real-time blocking of proxy services
- **Device Fingerprinting**: Canvas, WebGL, and device tracking
- **Admin Protection**: Auto-whitelisting prevents admin lockouts
- **Threat Monitoring**: Real-time security statistics and alerts

## 👥 User Management

### Admin Features
- Unlimited credits and questions
- User management dashboard
- Security monitoring panel
- IP whitelist/blacklist controls
- Credit allocation system

### Authentication
- Secure local authentication
- Session-based security
- Password strength requirements
- Auto-login for authorized users

## 🎯 Grant Writing

Specialized features for professional grant writing:
- AI trained on NIH, NSF standards
- Large document processing
- Reference document integration
- Context-aware generation
- Professional formatting

## 📊 Performance

- **Fast Responses**: Groq-first strategy for ultra-fast processing
- **Intelligent Fallbacks**: Automatic service switching based on content needs
- **Real-time Updates**: Live AI thinking process visualization
- **Optimized Caching**: Smart query caching and invalidation

## 🔄 Development

### Database Schema
The application uses Drizzle ORM with PostgreSQL. Key tables:
- `users` - User accounts and preferences
- `conversations` - Chat sessions
- `messages` - Chat message history
- `ai_activities` - Real-time AI processing logs
- `subscriptions` - Payment and plan management

### API Endpoints
- `/api/auth/*` - Authentication routes
- `/api/conversations/*` - Chat management
- `/api/admin/*` - Admin controls
- `/api/security/*` - Security monitoring

### Build Commands
```bash
npm run dev          # Development server
npm run build        # Production build
npm run db:push      # Database schema update
npm run db:generate  # Generate migrations
```

## 🌐 Deployment

The application is optimized for Replit deployment with:
- Automatic environment detection
- Built-in PostgreSQL support
- WebSocket configuration
- Static file serving

## 📝 License

Private project - All rights reserved.

## 🤝 Contributing

This is a private project. For access requests, contact the administrator.

## 📧 Support

For technical support or questions, contact the development team.

---

**Sofeia AI** - Revolutionizing content creation with intelligent AI assistance.