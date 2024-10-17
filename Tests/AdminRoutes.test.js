const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Adminmodel'); 
const jwt = require('jsonwebtoken');
const User = require('../models/Usermodel');
const adminRoutes = require('../routes/AdminRoutes');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes); 

beforeAll(async () => {
    const url = 'mongodb+srv://muskankewlanicimet:Vgj0O4kXtR5y84wn@cluster0.ebuz8.mongodb.net/testing'; // Use your actual connection string
    await mongoose.connect(url);
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Admin Management API', () => {
    let token;
    let testUser;

    const generateAdminToken = async () => {
        const admin = await Admin.findOne({ username: 'Harsh' });
        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        return token;
    };

    beforeEach(async () => {
        const password = 'Muskan@23';
        const hashedPassword = await bcrypt.hash(password, 10);
    
        // Ensure admin exists
        await Admin.findOneAndUpdate(
            { username: 'Harsh' },
            { password: hashedPassword },
            { upsert: true }
        );

        // Create a test user with a unique username
        testUser = await User.create({ username: `testUser_${Date.now()}`, password: hashedPassword });
        token = await generateAdminToken();
    });

    afterEach(async () => {
        // Clean up the created admin
        await Admin.deleteMany({ username: 'Harsh' });
        // Cleanup the test user
        if (testUser) {
            await User.findByIdAndDelete(testUser._id);
        }
    });

    afterAll(async () => {
       
        await User.deleteMany({ username: /testUser_/ }); 
    });

    test('POST /signup - should create a new admin', async () => {
        const res = await request(app)
            .post('/api/admin/signup')
            .send({ username: 'newAdmin', password: 'password123' }); 
    
        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('Admin created successfully');
    });

    test('POST /login - should login an admin', async () => {
        const res = await request(app)
            .post('/api/admin/login')
            .send({ username: 'Harsh', password: 'Muskan@23' });
    
        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBeDefined();
    });

    test('POST /task - should add a task for a user', async () => {
        const res = await request(app)
            .post('/api/admin/task')
            .send({ userId: testUser._id, name: 'New Task' })
            .set('Authorization', `Bearer ${token}`);
    
        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('Task added successfully');
        expect(res.body.task.name).toBe('New Task');
    });
    
    test('DELETE /users/:id - should delete a user', async () => {
        const res = await request(app)
            .delete(`/api/admin/users/${testUser._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('User deleted successfully.');
    });

    test('GET /tasks/:userId - should retrieve tasks for a user', async () => {
        await request(app)
            .post('/api/admin/task')
            .set('Authorization', `Bearer ${token}`)
            .send({ userId: testUser._id, name: 'New Task' });

        const res = await request(app)
            .get(`/api/admin/tasks/${testUser._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Tasks retrieved successfully');
        expect(res.body.tasks).toHaveLength(1);
    });

    test('GET /tasks - should get summary of tasks', async () => {
        const res = await request(app)
            .get('/api/admin/tasks')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('pendingTasks');
        expect(res.body).toHaveProperty('fulfilledTasks');
        expect(res.body).toHaveProperty('totalTasks');
        expect(res.body).toHaveProperty('totalUsers');
    });
});
