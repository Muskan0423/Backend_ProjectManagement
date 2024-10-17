const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/Usermodel');

const mongoURI = "mongodb+srv://muskankewlanicimet:Vgj0O4kXtR5y84wn@cluster0.ebuz8.mongodb.net/";

let token;
let createdUser;

beforeAll(async () => {
    await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

    // Create a new user for testing
    createdUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
    });

    // Log in to get the token
    const res = await request(app).post('/api/users/login').send({
        email: 'test@example.com',
        password: 'password123'
    });
    token = res.body.token;
});

afterAll(async () => {
    // Clean up the specific user after all tests have run
    if (createdUser) {
        await User.deleteOne({ _id: createdUser._id });
    }
    await mongoose.connection.close();
});

describe('User Routes', () => {
    it('should create a new user', async () => {
        const res = await request(app).post('/api/users/signup').send({
            username: 'newuser',
            email: 'new@example.com',
            password: 'password123'
        });

        expect(res.statusCode).toEqual(201);
        expect(res.body.message).toBe('User created successfully');

        // Store the created user for later cleanup
        createdUser = await User.findOne({ email: 'new@example.com' });
    });

    it('should log in a user', async () => {
        const res = await request(app).post('/api/users/login').send({
            email: 'new@example.com',
            password: 'password123'
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');

        // Ensure the token is set
        token = res.body.token;
        console.log('Token:', token); // Log the token
    });
});


describe('Task Routes', () => {
    beforeEach(async () => {
        // Clear tasks for the user before each test
        const user = await User.findById(createdUser._id);
        user.tasks = []; // Clear the tasks
        await user.save();
    });

    it('should create a new task', async () => {
        const res = await request(app)
            .post('/api/users/task')  // Ensure the correct endpoint
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'New Task' });

        expect(res.statusCode).toEqual(201);
        expect(res.body.task.name).toBe('New Task');
    });

    it('should retrieve all tasks', async () => {
        await request(app)
            .post('/api/users/task')  // Ensure the correct endpoint
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'New Task' });

        const res = await request(app)
            .get('/api/users/tasks')  // Ensure the correct endpoint
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.tasks.length).toBe(1); // This should now be correct
    });
});

