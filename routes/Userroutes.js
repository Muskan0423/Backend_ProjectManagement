const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/Usermodel');
const SupportTicket=require('../models/Supportmodel')
const router = express.Router();

const protect = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    console.log('Authorization header:', req.headers.authorization);

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Token is not valid' });
        }
        req.user = decoded.user; 
        next();
    });
};


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

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ user: { id: user._id } }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/task', protect, async (req, res) => {
    const { name } = req.body;
    try {
        const user = await User.findById(req.user.id);
        const newTask = { name };
        user.tasks.push(newTask);
        await user.save();
        res.status(201).json({ task: newTask });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/tasks', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('tasks');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ tasks: user.tasks });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/task/:taskId', protect, async (req, res) => {
    const { taskId } = req.params;
    const { name } = req.body;

    try {
        const user = await User.findById(req.user.id);
        const task = user.tasks.id(taskId);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        task.name = name; 
        await user.save();
        res.json({ message: 'Task updated' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
router.get('/users',  async (req, res) => {
    try {
        const users = await User.find().select('-password'); 
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
router.get('/users/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
router.delete('/task/:taskId', protect, async (req, res) => {
    const { taskId } = req.params;

    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.tasks) {
            return res.status(404).json({ message: 'User or tasks not found' });
        }

        user.tasks = user.tasks.filter(task => task._id.toString() !== taskId);
        await user.save();
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
router.post('/tickets', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]; 

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
        const userId = decoded.user.id; 

        const ticket = new SupportTicket({
            user: userId, 
            subject: req.body.subject,
            message: req.body.message
        });
        
        await ticket.save();
        res.status(201).json(ticket);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.get('/tickets/user/me', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]; 

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
        const userId = decoded.user.id; 

        const tickets = await SupportTicket.find({ user: userId }); 
        res.json(tickets);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.get('/tickets/user/:userId', protect, async (req, res) => {
    try {
        const tickets = await SupportTicket.find({ user: req.params.userId });
        res.json(tickets);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
