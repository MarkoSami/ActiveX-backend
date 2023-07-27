const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');

router
.get('/',async(req,res,next)=>{
    try{
        const comments = await Comment.find({}); 
        res.json(comments);
    }catch(err){
        next(err);
    }
})
.post('/',async(req,res,next)=>{
    if(!req.body){
        res.status(400).json({message: `The request has no body.`});
        return next();
    }
    const {publisher,caption,mediaURL} = req.body;
    try{
        const createdComment = await Comment.create({
            publisher,
            caption,
            mediaURL
        })
        res.json(createdComment);
    }catch(err){
        next(err);
    }
    
})
.put('/',async(req,res,next)=>{
    res.status(400).json({err: `Can't use PUT on this path`})
})
.delete('/',async(req,res,next)=>{
    try{
        const result = await Comment.deleteMany({});
        res.json(result);
    }catch(err){
        next(err);
    }
});