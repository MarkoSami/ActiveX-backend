
const express = require('express');
const router = express.Router();
const {Comment} = require('../models/Comment');
//
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
        return ;
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

// 
router
.get('/:commentID',async(req,res,next)=>{
    const commentId = req.params.commentID;
    if(!req.body || !req.params || !commentId){
        res.status(400).json({err: `Wrong parameters!.`});
        return ;
    }
    try{
        const comment = await Comment.findById({_id: commentId}); 
        res.json(comment);
    }catch(err){
        console.log(err);
        next(err);
    }
})
.post('/:commentID',async(req,res,next)=>{
 res.status(400).json({err: `POST is not allowed on this path.`})
    
})
.put('/:commentID',async(req,res,next)=>{
    const commentId = req.params.commentID;
    if(!req.body || !req.params || commentId){
        res.status(400).json({message: `The request has no body.`});
        return next();
    }
    const {caption,mediaURL} = req.body;
    const updatedComment = await Comment.findByIdAndUpdate(commentId,{caption,mediaURL},{new: true});
    res.json(updatedComment);
})
.delete('/:commentID',async(req,res,next)=>{
    const commentId = req.params.commentID;

    if(!req.body || !req.params || commentId){
        res.status(400).json({message: `The request has no body.`});
        return next();
    }
    try{
        const result = await Comment.findByIdAndDelete(commentId);
        res.json(result);
    }catch(err){
        next(err);
    }
});

module.exports = router;
