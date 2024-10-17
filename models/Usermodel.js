const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    name: { type: String, required: true },
    status: { type: String, enum: ['pending', 'fulfilled'], default: 'pending' },
});

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String,  unique: true },
    password: { type: String, required: true },
    tasks: [taskSchema]
});

module.exports = mongoose.model('User', userSchema);
