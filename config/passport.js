const passport=require('passport')
const GoogleStrategy =require('passport-google-oauth20').Strategy;

const User=require('../models/userModel')
const env=require('dotenv').config();


passport.use(new GoogleStrategy({

   clientID: process.env.GOOGLE_CLIENT_ID,
   clientSecret:process.env.GOOGLE_CLIENT_SECRET,
   callbackURL:`${process.env.BASE_URL}/auth/google/callback`,
   prompt: 'select_account', 
},
async (accessToken,refreshToken,profile,done,req,res) => {
   try {
      
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
         });
         await user.save();
         return done(null,user)
      }

   } catch (error) {
      
      return done(error,null)
   }
}

));

passport.serializeUser((user,done)=>{
   done(null,user.id)

})
passport.deserializeUser((id,done)=>{ 
   User.findById(id)
   .then(user => {
      if (user && user.isBlocked) {

         return done(null, false);  
      }
      done(null, user); // if the user is not blocked proceed as usual//////
   })
   .catch(err => {
      done(err, null);
   });
})


    
module.exports=passport;