# Next Level Software Backend - Prisma + PostgreSQL

Node.js + Express + Prisma + PostgreSQL API with Swagger, Tests, and CI/CD ready structure.

## 🚀 Features

- **Express.js** - Fast, unopinionated web framework
- **Prisma ORM** - Modern database toolkit for PostgreSQL
- **PostgreSQL** - Powerful, open-source relational database
- **Modular Architecture** - Feature-based folder structure for better organization
- **JWT Authentication** - Secure token-based authentication
- **Role-based Access Control** - Flexible permission system
- **Redis Caching** - Fast in-memory data store
- **BullMQ** - Robust job queue system
- **Socket.IO** - Real-time bidirectional communication
- **Email Service** - Nodemailer integration
- **File Upload** - Local and S3 storage support
- **Rate Limiting** - API request throttling
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger
- **Pino** - Fast JSON logger
- **ESLint + Prettier** - Code quality and formatting

## 📋 Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 14.x
- Redis (optional, for caching and queues)
- npm or pnpm

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nls-prisma-boilerplate
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up PostgreSQL database**
   ```bash
   # Create a new database
   createdb nextlevel_dev
   ```

4. **Configure environment variables**
   ```bash
   # Copy the development environment file
   cp .env.dev .env
   
   # Update DATABASE_URL in .env with your PostgreSQL credentials
   DATABASE_URL=postgresql://username:password@localhost:5432/nextlevel_dev?schema=public
   ```

5. **Run Prisma migrations**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

6. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`

## 📁 Project Structure

This project follows a **modular architecture** where each feature has its own folder. See [MODULAR_STRUCTURE.md](MODULAR_STRUCTURE.md) for details.

```
nls-prisma-boilerplate/
├── prisma/
│   └── schema.prisma          # Prisma schema definition
├── src/
│   ├── modules/               # 🎯 Feature modules (NEW)
│   │   ├── auth/              # Authentication module
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.route.js
│   │   ├── user/              # User module
│   │   │   ├── user.model.js
│   │   │   ├── user.controller.js
│   │   │   └── user.route.js
│   │   ├── role/              # Role module
│   │   ├── session/           # Session module
│   │   ├── otp/               # OTP module
│   │   ├── file/              # File upload module
│   │   └── backup/            # Backup module
│   ├── config/                # Configuration files
│   │   ├── database.js        # PostgreSQL connection
│   │   ├── prisma.js          # Prisma client instance
│   │   ├── logger.js          # Pino logger setup
│   │   └── index.js           # App configuration
│   ├── constants/             # Application constants
│   ├── middlewares/           # Express middlewares
│   ├── providers/             # File storage providers
│   ├── queues/                # BullMQ job queues
│   ├── routes/                # Main route aggregator
│   │   └── index.js          # Imports all module routes
│   ├── scripts/               # Utility scripts
│   ├── seed/                  # Database seeding
│   ├── services/              # Shared services
│   ├── startup/               # Initialization logic
│   ├── templates/             # Email templates
│   ├── utils/                 # Helper utilities
│   ├── workers/               # Queue workers
│   ├── app.js                 # Express app setup
│   └── index.js               # Entry point
├── .env.dev                   # Development environment
├── .env.prod                  # Production environment
├── .env.test                  # Test environment
└── package.json
```

## 🗄️ Database Schema

The application uses the following models:

- **User** - User accounts with authentication
- **Role** - User roles and permissions
- **Session** - JWT refresh token sessions
- **Otp** - One-time passwords for verification

## 🎯 Modular Architecture

This project uses a **feature-based modular structure** where each feature/model has its own folder containing all related files (controller, service, model, routes).

**Benefits:**
- ✅ Better code organization
- ✅ Easy to find related files
- ✅ Scalable and maintainable
- ✅ Modules can be developed independently
- ✅ Easy to test in isolation

**Example Module Structure:**
```
src/modules/user/
├── user.model.js       # Data model (Prisma wrapper)
├── user.controller.js  # Request handlers
├── user.service.js     # Business logic (if needed)
└── user.route.js       # Route definitions
```

**Learn More:** See [MODULAR_STRUCTURE.md](MODULAR_STRUCTURE.md) for complete documentation on the modular architecture.

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server with nodemon

# Production
npm start                # Start production server

# Database
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio (GUI)
npm run prisma:push      # Push schema changes to database
npm run seed             # Seed database with initial data

# Utilities
npm run backup           # Backup database
npm run migrate:db       # Run database migration script

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors

# Testing
npm test                 # Run tests
```

## 🔐 Environment Variables

### Database
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - Environment (development/production/test)
- `PORT` - Server port (default: 3000)

### Authentication
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_ACCESS_EXPIRES` - Access token expiry (default: 1h)
- `JWT_REFRESH_EXPIRES` - Refresh token expiry (default: 7d)

### Email
- `EMAIL_HOST` - SMTP host
- `EMAIL_PORT` - SMTP port
- `EMAIL_USER` - SMTP username
- `EMAIL_PASS` - SMTP password
- `EMAIL_FROM_NAME` - Sender name
- `EMAIL_FROM_EMAIL` - Sender email

### Redis
- `REDIS_URL` - Redis connection URL

### File Storage
- `FILE_STORAGE` - Storage type (local/s3)
- `AWS_ACCESS_KEY` - AWS access key (for S3)
- `AWS_SECRET_ACCESS_KEY` - AWS secret key (for S3)
- `AWS_REGION` - AWS region (for S3)
- `AWS_BUCKET` - S3 bucket name (for S3)

### Supabase
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Supabase service role key for backend operations
  - Prefer `service_role` key for server-side access
  - If you use `anon` public key, ensure it has only public access

## 🔄 Migration from MongoDB to PostgreSQL

This project was migrated from MongoDB/Mongoose to PostgreSQL/Prisma. Key changes:

1. **Database**: MongoDB → PostgreSQL
2. **ORM**: Mongoose → Prisma
3. **IDs**: ObjectId → UUID
4. **Queries**: MongoDB query syntax → Prisma query syntax
5. **Relations**: Manual population → Prisma relations
6. **Transactions**: MongoDB transactions → Prisma transactions

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout current session
- `POST /api/auth/logout-all` - Logout all sessions
- `GET /api/auth/me` - Get current user

### User Endpoints

- `GET /api/users` - Get all users (with pagination and filters)

## 🧪 Testing

```bash
npm test
```

## 🚀 Deployment

1. Set up PostgreSQL database on your hosting platform
2. Update `.env.prod` with production credentials
3. Run migrations: `npm run prisma:migrate`
4. Start the server: `npm start`

## 📝 License

MIT

## 👥 Authors

Next Level Software

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
