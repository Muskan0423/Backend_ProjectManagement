const connecttomongo=require('./db')


connecttomongo();
const express = require('express')
const app = express()
const port = 5001;

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use(express.json())
app.use('/api/users', require('./routes/Userroutes'));

// app.use('/api/notes',require{'./routes/notes'})
app.listen(port, () => {
    console.log(`Example app listening on port http://localhost:${port}`);
})