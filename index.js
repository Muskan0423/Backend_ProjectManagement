const connectToMongo = require('./db');
const express = require('express');
const app = express();
const cors = require('cors');
const port = 5001;
const dotenv = require('dotenv');
const User = require('./models/Usermodel'); 

const Admin = require('./models/Adminmodel'); 
const jwt = require('jsonwebtoken');

dotenv.config();

connectToMongo();
app.use(cors({
  origin: '*', 
  credentials: true 
}));
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

app.use('/api/users', require('./routes/Userroutes')); 
app.use('/api/admin', require('./routes/AdminRoutes')); 

app.use('/api/protected', protect, (req, res) => {
  res.json({ message: 'This is a protected route!', user: req.user });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
