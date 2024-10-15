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

  
  router.get('/tasks',  async (req, res) => {
    try {
      const users = await User.find().populate('tasks');
      
      const allTasks = users.flatMap(user => user.tasks);
      const pending=allTasks.filter(task => task.status === 'pending')
      const fulfilled=allTasks.filter(task => task.status === 'completed')
      const pendingTasks = allTasks.filter(task => task.status === 'pending').length;
      const fulfilledTasks = allTasks.filter(task => task.status === 'completed').length;
      
      const totalUsers = users.length;
      
      res.json({ pending,fulfilled,pendingTasks, fulfilledTasks, totalTasks: allTasks.length, totalUsers });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  

module.exports = router;
