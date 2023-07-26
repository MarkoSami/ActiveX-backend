const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.createJWT = async(userName)=>{
    try{
        const JWT = await jwt.sign({
            userName,
          },process.env.SECRET_KEY , { expiresIn: '24h' });
          return JWT;
    }catch(err){
        console.log(err);
        return next(err);
    }

    
}