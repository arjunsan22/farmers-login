const express=require('express');
const dbConnect = require('./config/dbConnect');
const app=express()
const path=require('path')
const session=require('express-session')
const env=require('dotenv').config()
const authRouter=require('./routes/authRoute');
const adminRouter=require('./routes/adminRoute')
const passport=require('./config/passport')
const http =require('http').createServer(app);
const io=require('socket.io')(http)
const Chat = require('./models/chatModel');
const User = require('./models/userModel');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));  // For form data//

const PORT=process.env.PORT || 2000;


app.use(express.static('public'));

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
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

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

//this unmached routes for all//
app.use((req, res, next) => {
  // Check if the URL starts with /admin  
  if (req.originalUrl.startsWith('/admin')) {
    res.status(404).render('error'); // Admin error page//
  } else {
    res.status(404).render('pagenotfound'); // User error page//
  }
});

// Global Error Handler i added this for server errors in admin and user//
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (req.originalUrl.startsWith('/admin')) {
    res.status(500).render('error', {
      message: 'Something went wrong! Please try again later.'
    });
  } else {
    res.status(500).render('pagenotfound', {
      message: 'Something went wrong! Please try again later.'
    });
  }

});


//socket io setup
// ...existing code..
io.on('connection', (socket) => {
    console.log('user connected');

    // Join a chat room
    socket.on('joinChat', (chatId) => {
        socket.join(chatId);
    });

    // Handle sending messages
    socket.on('sendMessage', async ({ chatId, userId, text }) => {
        try {
            const chat = await Chat.findById(chatId);
            if (!chat) return;
            chat.messages.push({ sender: userId, text });
            await chat.save();

            // Get sender's name
            const user = await User.findById(userId);
            const senderName = user ? user.firstname : 'User';

            // Emit to all in the room
            io.to(chatId).emit('newMessage', {
                senderName,
                text,
                sentAt: new Date()
            });
        } catch (err) {
            console.error('Chat error:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});


http.listen(PORT ,()=>{
    console.log(`server is running at ${PORT} http://localhost:4000/`)
})