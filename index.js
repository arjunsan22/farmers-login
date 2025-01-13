const express=require('express');
const dbConnect = require('./config/dbConnect');
const app=express()
const path=require('path')
const session=require('express-session')
const env=require('dotenv').config()
const authRouter=require('./routes/authRoute');
const adminRouter=require('./routes/adminRoute')
const passport=require('./config/passport')

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));  // For form data
app.use(bodyParser.json());

const PORT=process.env.PORT || 2000;




//database connection
dbConnect();
app.use(express.json())
app.use(express.urlencoded({extended:false}) )
app.use(
    session({
      secret:process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
      cookie:{
        secret:false,
        httpOnly:true,
        maxAge:22*60*60*1000
      }
    })
  );
app.use(passport.initialize())
app.use(passport.session())

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', [
    path.join(__dirname, 'views/user'),
    path.join(__dirname, 'views/admin')
]);

// Serve static files from the "public" directory
app.use(express.static("public"));

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store'); // or 'no-cache'
  next();
});


app.use('/',authRouter) //for user//
app.use('/admin',adminRouter)


//logoutroute



app.listen(PORT ,()=>{
    console.log(`server is running at ${PORT} http://localhost:4000/`)
})