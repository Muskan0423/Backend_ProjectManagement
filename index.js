const connectToMongo = require('./db');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const userRoutes = require('./routes/Userroutes');
const adminRoutes = require('./routes/AdminRoutes');

dotenv.config();

const app = express();
const port = 5000;

connectToMongo();
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});
const protect = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/protected', protect, (req, res) => {
    res.json({ message: 'This is a protected route!', user: req.user });
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}

module.exports = app; 
