const passport=require('passport')
const GoogleStrategy =require('passport-google-oauth20').Strategy;

const User=require('../models/userModel')
const env=require('dotenv').config();

console.log("Google Client ID:", process.env.GOOGLE_CALLBACK_URL);
passport.use(new GoogleStrategy({

   clientID: process.env.GOOGLE_CLIENT_ID,
   clientSecret:process.env.GOOGLE_CLIENT_SECRET,
   callbackURL:  process.env.GOOGLE_CALLBACK_URL,
   prompt: 'select_account', 
},
async (accessToken,refreshToken,profile,done,req,res) => {
   try {
      
      console.log('Profile received from Google:', profile);
      console.log('Access Token:', accessToken);
      console.log('Refresh Token:', refreshToken);

      let user=await User.findOne({googleId:profile.id});
     
      if (user && user.isBlocked) {
         return done(null, false, { message: 'User is blocked' });
      }
      if(user){
         return done(null,user);
      }else{

         user=new User({
            firstname: profile.name.givenName,
            lastname: profile.name.familyName,
            email:profile.emails[0].value,
            googleId:profile.id,
            accessToken, // Save tokens if needed
            refreshToken
         });
         await user.save();
         return done(null,user)
      }

   } catch (error) {
      console.error('Error during authentication:', error);

      return done(error,null)
   }
}

));

passport.serializeUser((user,done)=>{
   done(null,user.id)

})

passport.deserializeUser((id, done) => { 
   User.findById(id)
     .then(user => {
       if (user && user.isBlocked) {
         return done(new Error('User is blocked'), null); // Handle blocked users with an error
       }
       done(null, user);
     })
     .catch(err => done(err, null));
 });
 

    
module.exports=passport;