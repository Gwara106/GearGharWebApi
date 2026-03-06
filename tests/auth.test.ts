import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createServer } from '../server/index';
import { connectToDatabase } from '../lib/db';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

describe('Authentication & User Management Tests', () => {
  let app: any;
  let db: any;
  let usersCollection: any;
  let adminToken: string;
  let userToken: string;
  let adminId: string;
  let userId: string;

  beforeAll(async () => {
    app = createServer();
    const { db: database } = await connectToDatabase();
    db = database;
    usersCollection = db.collection('users');
  });

  beforeEach(async () => {
    // Clean up users collection
    await usersCollection.deleteMany({});
    
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminResult = await usersCollection.insertOne({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: adminPassword,
      role: 'admin',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    adminId = adminResult.insertedId.toString();

    // Create regular user
    const userPassword = await bcrypt.hash('user123', 12);
    const userResult = await usersCollection.insertOne({
      firstName: 'Regular',
      lastName: 'User',
      email: 'user@test.com',
      password: userPassword,
      role: 'user',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    userId = userResult.insertedId.toString();
  });

  afterEach(async () => {
    await usersCollection.deleteMany({});
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user.firstName).toBe(userData.firstName);
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.role).toBe('user');
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.token).toBeDefined();
    });

    it('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John',
          email: 'john@test.com'
        })
        .expect(400);

      expect(response.body.message).toBe('All fields are required');
    });

    it('should reject registration with duplicate email', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'user@test.com', // Already exists
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toBe('User with this email already exists');
    });

    it('should reject registration with invalid email format', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
    });
  });

  describe('User Login', () => {
    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'user@test.com',
        password: 'user123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.token).toBeDefined();
      userToken = response.body.token;
    });

    it('should reject login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should reject login with invalid password', async () => {
      const loginData = {
        email: 'user@test.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com'
        })
        .expect(400);

      expect(response.body.message).toBe('Email and password are required');
    });
  });

  describe('Admin User Management', () => {
    beforeEach(async () => {
      // Login as admin to get token
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'admin123'
        });
      adminToken = adminLogin.body.token;
    });

    it('should get all users with pagination', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('Users retrieved successfully');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(2);
    });

    it('should search users by name', async () => {
      const response = await request(app)
        .get('/api/admin/users?search=Admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].firstName).toBe('Admin');
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/admin/users?role=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].role).toBe('admin');
    });

    it('should create a new user', async () => {
      const newUser = {
        firstName: 'New',
        lastName: 'User',
        email: 'newuser@test.com',
        password: 'newpassword123',
        role: 'user'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser)
        .expect(201);

      expect(response.body.message).toBe('User created successfully');
      expect(response.body.user.firstName).toBe(newUser.firstName);
      expect(response.body.user.email).toBe(newUser.email);
    });

    it('should get user by ID', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('User retrieved successfully');
      expect(response.body.user._id).toBe(userId);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should update user information', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        role: 'user',
        status: 'active'
      };

      const response = await request(app)
        .put(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('User updated successfully');
      expect(response.body.user.firstName).toBe(updateData.firstName);
      expect(response.body.user.lastName).toBe(updateData.lastName);
    });

    it('should delete a user', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('User deleted successfully');

      // Verify user is deleted
      const deletedUser = await usersCollection.findOne({ _id: new ObjectId(userId) });
      expect(deletedUser).toBeNull();
    });

    it('should prevent admin from deleting themselves', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.message).toBe('Cannot delete your own account');
    });

    it('should reject unauthorized access to admin routes', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .expect(401);

      expect(response.body.message).toBe('No token provided');
    });

    it('should reject non-admin access to admin routes', async () => {
      // Login as regular user
      const userLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'user123'
        });

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userLogin.body.token}`)
        .expect(403);

      expect(response.body.message).toBe('Admin access required');
    });
  });

  describe('Password Reset', () => {
    it('should send password reset email for existing user', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'user@test.com' })
        .expect(200);

      expect(response.body.message).toBe('If an account with that email exists, a password reset link has been sent.');
    });

    it('should not reveal if email exists for password reset', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@test.com' })
        .expect(200);

      expect(response.body.message).toBe('If an account with that email exists, a password reset link has been sent.');
    });

    it('should reject password reset with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({})
        .expect(400);

      expect(response.body.message).toBe('Email is required');
    });

    it('should verify valid reset token', async () => {
      // First request password reset
      const resetResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'user@test.com' });

      const resetToken = resetResponse.body.resetToken;

      // Verify the token
      const response = await request(app)
        .post('/api/auth/verify-reset-token')
        .send({ token: resetToken })
        .expect(200);

      expect(response.body.message).toBe('Token is valid');
      expect(response.body.user.email).toBe('user@test.com');
    });

    it('should reject invalid reset token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-reset-token')
        .send({ token: 'invalid-token' })
        .expect(400);

      expect(response.body.message).toBe('Invalid or expired reset token');
    });

    it('should reset password with valid token', async () => {
      // First request password reset
      const resetResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'user@test.com' });

      const resetToken = resetResponse.body.resetToken;
      const newPassword = 'newpassword123';

      // Reset password
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword
        })
        .expect(200);

      expect(response.body.message).toBe('Password reset successfully. You can now login with your new password.');

      // Verify login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: newPassword
        })
        .expect(200);

      expect(loginResponse.body.message).toBe('Login successful');
    });

    it('should reject password reset with short password', async () => {
      const resetResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'user@test.com' });

      const resetToken = resetResponse.body.resetToken;

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: '123'
        })
        .expect(400);

      expect(response.body.message).toBe('Password must be at least 6 characters long');
    });
  });

  describe('User Profile Management', () => {
    beforeEach(async () => {
      // Login as regular user
      const userLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'user123'
        });
      userToken = userLogin.body.token;
    });

    it('should get user profile', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.user.email).toBe('user@test.com');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should update user profile', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.user.firstName).toBe(updateData.firstName);
    });

    it('should reject profile update without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.message).toBe('No token provided');
    });
  });

  describe('Pagination Edge Cases', () => {
    beforeEach(async () => {
      // Login as admin
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'admin123'
        });
      adminToken = adminLogin.body.token;
    });

    it('should handle page less than 1', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=0')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.message).toBe('Page must be greater than 0');
    });

    it('should handle limit greater than 100', async () => {
      const response = await request(app)
        .get('/api/admin/users?limit=101')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.message).toBe('Limit must be between 1 and 100');
    });

    it('should handle empty search results', async () => {
      const response = await request(app)
        .get('/api/admin/users?search=nonexistent')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });
  });
});
