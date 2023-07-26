const express = require('express');
const router = express.Router();
const User = require('../models/User');
const {createJWT} = require('../authentication/createJWT');


router.post('/',async (req,res,next)=>{
    if(!req.body){
        res.status(400).json({err: `request does not contain a body`});
        return;   
    }
    const {userName,password,firstName,lastName,describtion} = req.body;
    try{
        const createdUser = await User.create({
            userName,
            password,
            firstName,
            lastName,
            describtion
        });
        res.cookie('token',createJWT(createdUser.userName),{ maxAge: 24*60*60, httpOnly: true });
    }catch(err){
        next(err);
    }

})
.all('/',async(req,res,next)=>{
    res.status(403).json({err: `Can't ${req.method} in the ${req.path} path`});
})

module.exports = router;