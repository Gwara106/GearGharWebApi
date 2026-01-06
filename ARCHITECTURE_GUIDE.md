# Clean Architecture Implementation Guide

## Architecture Overview

This project implements the **App-Route-Controller-Service-Repository** pattern with clean architecture principles.

## Directory Structure

```
src/
├── config/
│   └── database.ts          # Database connection configuration
├── models/
│   └── User.ts              # Mongoose user model with role field
├── dto/
│   └── auth.dto.ts          # Data Transfer Objects with Zod validation
├── repositories/
│   └── user.repository.ts   # Data access layer
├── services/
│   └── auth.service.ts      # Business logic layer
├── controllers/
│   └── auth.controller.ts   # Request/response handling layer
└── types/                   # TypeScript type definitions

app/api/auth/
├── register/route.ts        # Registration endpoint
├── login/route.ts           # User login endpoint
└── admin-login/route.ts     # Admin login endpoint
```

## Architecture Layers

### 1. Models Layer (`src/models/`)
- **User.ts**: Mongoose schema with role field
- Includes validation, indexes, and JSON transformation
- Role enum: `['user', 'admin']` with default `'user'`

### 2. DTO Layer (`src/dto/`)
- **auth.dto.ts**: Zod schemas for request validation
- RegisterDto, LoginDto, AdminLoginDto
- Comprehensive validation with custom error messages
- Type exports for TypeScript integration

### 3. Repository Layer (`src/repositories/`)
- **user.repository.ts**: Data access operations
- Interface-based design for testability
- Methods: `findByEmail`, `findById`, `create`, `updateLastLogin`, `emailExists`

### 4. Service Layer (`src/services/`)
- **auth.service.ts**: Business logic implementation
- Handles user registration, login, and admin authentication
- Password hashing, JWT token generation, validation
- Error handling and response formatting

### 5. Controller Layer (`src/controllers/`)
- **auth.controller.ts**: HTTP request/response handling
- DTO validation using Zod
- Calls service layer methods
- Proper HTTP status codes and error responses

### 6. Route Layer (`app/api/auth/`)
- Clean, minimal route handlers
- Database connection initialization
- Controller delegation
- Method not allowed handling

## Key Features

### Role-Based Authentication
- Users have role `'user'` by default
- Admin users have role `'admin'`
- Separate login endpoints for users and admins
- Role-based access control in service layer

### Security Features
- Password hashing with bcryptjs (salt rounds: 10)
- JWT tokens with 7-day expiration
- Input validation with Zod schemas
- Email uniqueness validation
- Account status checking (active/inactive)

### Data Validation
- **Registration**: Name validation, email format, password strength, terms agreement
- **Login**: Email format, password minimum length
- **Admin Login**: Same as login with additional role verification

### Error Handling
- Structured error responses
- Validation error details with field-specific messages
- Database error handling
- Graceful degradation

## MongoDB Configuration

### Environment Variables

**File**: `.env` (root directory)

**Line 3**: Add your MongoDB URI
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gearghar?retryWrites=true&w=majority
```

**Alternative Configuration Files**:
- `.env.example` - Template with all required variables
- `src/config/database.ts` - Database connection logic

### Database Setup

1. **MongoDB Atlas Setup**:
   - Create a free MongoDB Atlas account
   - Create a new cluster
   - Add your IP to the whitelist (0.0.0.0/0 for development)
   - Create a database user with read/write permissions

2. **Connection String Format**:
   ```
   mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
   ```

3. **Environment Variables**:
   ```bash
   # Required
   MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/gearghar
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   
   # Optional
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

## API Endpoints

### User Registration
```
POST /api/auth/register
```

### User Login
```
POST /api/auth/login
```

### Admin Login
```
POST /api/auth/admin-login
```

## Testing with Postman

See `POSTMAN_GUIDE.md` for detailed testing instructions including:
- Request/response examples
- Validation error scenarios
- Test scripts for automation
- Environment setup

## Development Workflow

1. **Setup Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   ```

2. **Install Dependencies**:
   ```bash
   pnpm install
   ```

3. **Start Development Server**:
   ```bash
   pnpm dev
   ```

4. **Test with Postman**:
   - Import the collection from POSTMAN_GUIDE.md
   - Set up environment variables
   - Run authentication tests

## Code Quality Features

- **TypeScript**: Full type safety throughout
- **Zod Validation**: Runtime type checking and validation
- **Interface-Based Design**: Testable and maintainable code
- **Error Handling**: Comprehensive error management
- **Security**: Best practices for authentication
- **Clean Architecture**: Separation of concerns
- **Scalability**: Easy to extend and maintain

## Future Enhancements

- Middleware for JWT token verification
- Role-based route protection
- Password reset functionality
- Email verification
- Rate limiting
- Audit logging
- Unit and integration tests

## Dependencies

- **mongoose**: MongoDB object modeling
- **zod**: Schema validation
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT token generation
- **@hookform/resolvers**: Form validation integration

This architecture provides a solid foundation for scalable, maintainable authentication systems with proper separation of concerns and comprehensive validation.
