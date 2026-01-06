# Postman Testing Guide - GearGhar Authentication API

This guide provides step-by-step instructions for testing the authentication endpoints using Postman.

## Base URL
```
http://localhost:3000/api/auth
```

## 1. User Registration

### Endpoint: `POST /api/auth/register`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "Password123",
  "confirmPassword": "Password123",
  "agreeToTerms": true
}
```

**Expected Success Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "65a1b2c3d4e5f6789012345",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "user",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Validation Error Response (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please enter a valid email address"
    },
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    }
  ]
}
```

**Email Already Exists Response (400):**
```json
{
  "success": false,
  "message": "Email already registered"
}
```

---

## 2. User Login

### Endpoint: `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "Password123"
}
```

**Expected Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "65a1b2c3d4e5f6789012345",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "user",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Invalid Credentials Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**Account Inactive Response (401):**
```json
{
  "success": false,
  "message": "Account is inactive. Please contact support."
}
```

---

## 3. Admin Login

### Endpoint: `POST /api/auth/admin-login`

**Request Body:**
```json
{
  "email": "admin@gearghar.com",
  "password": "AdminPass123"
}
```

**Expected Success Response (200):**
```json
{
  "success": true,
  "message": "Admin login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "_id": "65a1b2c3d4e5f6789012346",
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@gearghar.com",
    "role": "admin",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Invalid Admin Credentials Response (401):**
```json
{
  "success": false,
  "message": "Invalid admin credentials"
}
```

---

## Postman Collection Setup

### 1. Environment Variables
Create an environment with the following variables:
- `baseUrl`: `http://localhost:3000`
- `userToken`: (will be set after login)
- `adminToken`: (will be set after admin login)

### 2. Test Scripts

**Registration Test Script:**
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("userToken", response.token);
    pm.test("User registered successfully", function () {
        pm.expect(response.success).to.be.true;
        pm.expect(response.token).to.be.a('string');
        pm.expect(response.user.email).to.eql(pm.request.body.raw.split('"')[3]);
    });
}
```

**Login Test Script:**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("userToken", response.token);
    pm.test("User login successful", function () {
        pm.expect(response.success).to.be.true;
        pm.expect(response.token).to.be.a('string');
        pm.expect(response.user.role).to.eql('user');
    });
}
```

**Admin Login Test Script:**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("adminToken", response.token);
    pm.test("Admin login successful", function () {
        pm.expect(response.success).to.be.true;
        pm.expect(response.token).to.be.a('string');
        pm.expect(response.admin.role).to.eql('admin');
    });
}
```

### 3. Headers
For all requests, set:
- `Content-Type`: `application/json`

### 4. Authorization (for future protected endpoints)
For protected endpoints, add:
- `Authorization`: `Bearer {{userToken}}` or `Bearer {{adminToken}}`

---

## Testing Scenarios

### Scenario 1: Complete User Flow
1. Register a new user
2. Login with the same credentials
3. Verify token is generated and stored

### Scenario 2: Validation Testing
1. Try registering with invalid email
2. Try registering with weak password
3. Try registering without agreeing to terms
4. Verify validation error messages

### Scenario 3: Duplicate Email Testing
1. Register a user
2. Try registering again with same email
3. Verify duplicate email error

### Scenario 4: Admin vs User Login
1. Try logging in as user with admin endpoint
2. Try logging in as admin with user endpoint
3. Verify role-based access control

---

## Common Issues and Solutions

### 1. MongoDB Connection Error
- Ensure MongoDB URI is correctly set in `.env` file
- Check if MongoDB Atlas IP whitelist includes your IP address

### 2. Validation Errors
- Ensure all required fields are included
- Check password requirements (uppercase, lowercase, number)
- Verify email format is correct

### 3. Server Not Responding
- Ensure the development server is running: `pnpm dev`
- Check if port 3000 is available
- Verify environment variables are loaded

### 4. Token Issues
- Tokens are valid for 7 days by default
- Check JWT_SECRET environment variable
- Verify token format in authorization header

---

## Video Recording Tips

When recording your Postman demonstration:

1. **Show Environment Setup**: Display environment variables
2. **Test Validation**: Demonstrate validation errors first
3. **Successful Registration**: Show complete user registration
4. **Login Flow**: Demonstrate both user and admin login
5. **Error Handling**: Show various error responses
6. **Token Usage**: Display how tokens are stored and used
7. **Database Verification**: Optionally show data in MongoDB Compass

Make sure to highlight:
- Clean architecture validation responses
- DTO validation error messages
- Role-based authentication differences
- Security features (password hashing, JWT tokens)
