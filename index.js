
const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;


//middleware
app.use(cors({
    origin:['http://localhost:5173',]
}));
app.use(express.json());



app.get('/', (req, res) => {
    res.send('Alternative Product System....!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})