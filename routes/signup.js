const express = require('express');
const router = express.Router();
const {User} = require('../models/User');
const {createJWT} = require('../authentication/createJWT');
const utils = require('../lib/utils');


router.post('/',async (req,res,next)=>{
    if(!req.body){
        res.status(400).json({err: `request does not contain a body`});
        return;   
    }
    const userData = utils.FieldMapper(req.body,['userName','password','firstName','lastName','describtion','imgURL']);
    
    const user = await User.findOne({userName: userData.userName});
    console.log(user);
    if(userData.userName && user){
        return res.status(409).json({Message: `This is user is already registered!`});
    }
    
    try{
        const createdUser = await User.create(userData);

        res.cookie('token',createJWT(createdUser().userName),{
            maxAge: 24 * 60 * 60 * 1000, // Set maxAge in milliseconds (24 hours)
            sameSite: 'None', // Allow cross-site requests for modern browsers
            domain: "https://screenmates-beta-v.onrender.com",
            secure: true
          });

        if(createdUser){
            const responseUserData = {
                userName: userData.userName,
                firstName: userData.firstName,
                lastName: userData.lastName,
                imgURL: userData.imgURL
            }   
            const jwt = await  createJWT(userData.userName);
            res.json({
                Message: `User signed up successfullt!`,
                userData: responseUserData,
                // token: jwt,
            })
        }
        
    }catch(err){
        next(err);
    }

})
.all('/',async(req,res,next)=>{
    res.status(403).json({err: `Can't ${req.method} in the ${req.path} path`});
})

module.exports = router;