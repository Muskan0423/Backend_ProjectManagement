const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Adminmodel');
const User = require('../models/Usermodel');

const router = express.Router();

router.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = new Admin({ username, password: hashedPassword });
        await newAdmin.save();
        res.status(201).json({ message: 'Admin created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const admin = await Admin.findOne({ username });
        if (!admin) return res.status(404).json({ message: 'Admin not found' });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/task', async (req, res) => {
    const { userId, name } = req.body;
    const token = req.headers.authorization?.split(" ")[1]; 

    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.id; 

        const admin = await Admin.findById(adminId);
        if (!admin) return res.status(403).json({ message: 'Access denied. Not an admin.' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const newTask = {
            name,
            status: 'pending',
        };

        user.tasks.push(newTask);
        await user.save();

        res.status(201).json({
            message: 'Task added successfully',
            task: {
                id: newTask._id,
                name: newTask.name,
                status: newTask.status,
                assignedTo: {
                    id: user._id,
                    username: user.username,
                },
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/users/:id', async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1]; 
    const userIdToDelete = req.params.id;

    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.id; 

        const admin = await Admin.findById(adminId);
        if (!admin) return res.status(403).json({ message: 'Access denied. Not an admin.' });

        const user = await User.findById(userIdToDelete);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        await User.findByIdAndDelete(userIdToDelete);

        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/tasks/:userId', async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1]; 
    const { userId } = req.params;

    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.id;

        const admin = await Admin.findById(adminId);
        if (!admin) return res.status(403).json({ message: 'Access denied. Not an admin.' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({
            message: 'Tasks retrieved successfully',
            tasks: user.tasks,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/tasks', async (req, res) => {
    try {
        const users = await User.find().populate('tasks');

        const allTasks = users.flatMap(user => user.tasks);
        const pending = allTasks.filter(task => task.status === 'pending');
        const fulfilled = allTasks.filter(task => task.status === 'completed');

        res.json({
            pending,
            fulfilled,
            pendingTasks: pending.length,
            fulfilledTasks: fulfilled.length,
            totalTasks: allTasks.length,
            totalUsers: users.length,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
