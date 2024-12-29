const express=require('express');
const dbConnect = require('./config/dbConnect');
const app=express()
const path=require('path')
const env=require('dotenv').config()
const authRouter=require('./routes/authRoute');

const PORT=process.env.PORT || 2000;
//database connection
dbConnect();
app.use(express.json())
app.use(express.urlencoded({extended:false}) )

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', [
    path.join(__dirname, 'views/user'),
    path.join(__dirname, 'views/admin')
]);

// Serve static files from the "public" directory
app.use(express.static('public'));


app.use('/',authRouter)



app.listen(PORT ,()=>{
    console.log(`server is running at ${PORT} http://localhost:4000/`)
})