const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/Usermodel');
const router = express.Router();

const protect = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Sign Up
router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        user = new User({ username, email, password: bcrypt.hashSync(password, 10) });

        await user.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });
console.log(password);
console.log(user.password);

const isMatch = await bcrypt.compare(password, user.password);
console.log(isMatch, "password match");
        
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ user: { id: user._id } }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add a task
router.post('/task', protect, async (req, res) => {
    const { name } = req.body;

    try {
        const user = await User.findById(req.user.id);
        user.tasks.push({ name });
        await user.save();
        res.status(201).json({ message: 'Task added' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update task status
router.put('/task/:taskId', protect, async (req, res) => {
    const { taskId } = req.params;
    const { status } = req.body;

    try {
        const user = await User.findById(req.user.id);
        const task = user.tasks.id(taskId);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        task.status = status;
        await user.save();
        res.json({ message: 'Task updated' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete task
router.delete('/task/:taskId', protect, async (req, res) => {
    const { taskId } = req.params;

    try {
        const user = await User.findById(req.user.id);
        user.tasks.id(taskId).remove();
        await user.save();
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
