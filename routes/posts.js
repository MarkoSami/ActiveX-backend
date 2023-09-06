
const express = require('express');
const router = express.Router();
const Post = require('../models/Posts');
const {Comment,CommentSchema} = require('../models/Comment');
const {React,ReactSchema} = require('../models/React');
const { default: mongoose } = require('mongoose');
router
    .get('/', async (req, res, next) => {
        try {
            const posts = await Post.find({});
            res.status(200).json(posts);
        } catch (err) {
            console.log(err);
            res.statusCode = 500;
            res.contentType = 'application/json';
            next(err);
        }
    })
    .post('/', async (req, res, next) => {
        const { body } = req;
        try {
            const result = await Post.create(body);
            res.json(result);
        } catch (err) {
            console.log(err);
            next(err);
        }
    })
    .put('/', async (req, res, next) => {
        res.status = 403;
        res.json(`PUT request is not allowed on this URL: /posts`)
    })
    .delete('/', async (req, res, next) => {
        try {
            const result = await Post.deleteMany({});
            res.json(result);
        } catch (err) {
            res.statusCode = 500;
            res.contentType = 'application/json';
            res.json(err + `internal server error`);
            next(err);
        }
    });


router
    .get('/:postID', async (req, res, next) => {
        try {
            const postId = req.params.postID;
            const post = await Post.findById(postId);
            if (!post) {
                res.status(404).json({ message: 'Post not found' });
                return;
            }
            res.status(200).json(post);
        } catch (err) {
            console.log(err);
            next(err);
        }
    })
    .post('/:postID', async (req, res, next) => {
        res.status(403).json({ message: 'POST requests are not allowed on this URL: /posts/:id' });
    })
    .put('/:postID', async (req, res, next) => {
        try {
            if(!req.body || !req.params || !req.params.postID){
                res.status(400).json({message: `The request has no body.`});
                return ;
            }
            const postId = req.params.postID;
            const { caption,mediaURL}= req.body;
            const updatedPost = await Post.findByIdAndUpdate(postId, {caption,mediaURL}, { new: true });
            if (!updatedPost) {
                res.status(404).json({ message: 'Post not found' });
                return;
            }
            res.status(200).json(updatedPost);
        } catch (err) {
            res.status(500).json({ message: 'Internal server error' });
            next(err);
        }
    })
    .delete('/:postID', async (req, res, next) => {
        try {
            const postId = req.params.postID;
            const post = await Post.findByIdAndDelete(postId);
            if (!post) {
                res.status(404).json({ message: 'Post not found' });
                return;
            }
            res.status(200).json({ message: 'Post deleted successfully' });
        } catch (err) {
            res.status(500).json({ message: 'Internal server error' });
            next(err);
        }
    });


    router.get('/:postId/comments',async (req,res,next)=>{
        const postId = req.params.postId;
        if(!postId){
            res.status(404).json({err: `Missing data (Post id)!`});
            return ;
        }
        try{
            const post = await Post.findById({_id: postId});
            if(!post){
                res.status(404).json({err: `Post not found`});
                return;
            }
            const comments = await Comment.find({
                _id:{$in: post.comments} 
            }).select('-__v');
            res.json(comments);
        }catch(err){
            console.log(err);
            next(err);
        }
    })
    .post('/:postId/comments',async (req,res,next)=>{
        const postId = req.params.postId;
        if(!postId){
            res.status(404).json({err: `Post not found!`});
            return next();
        }
        const commentData = {};
  if ('publisher' in req.body) {
    commentData.publisher = req.body.publisher;
  }
  if ('caption' in req.body) {
    commentData.caption = req.body.caption;
  }
  if ('mediaURL' in req.body) {
    commentData.mediaURL = req.body.mediaURL;
  }

        try{
            const newComment = new Comment(commentData);
            await newComment.save();
            const post = await Post.findById(postId);
            if(!post){
                res.status(404).json({err: `Post not found!`})
            }
            const result = await post.comments.push(newComment._id);
            await post.save();
            res.json(newComment);
        }catch(err){
            console.log(err);
            next(err);
        }   
    })
    .put('/:postId/comments',async (req,res,next)=>{
        res.status(403).json({err: `Put is not allowed on this path`});
    })
    .delete('/:postId/comments',async (req,res,next)=>{
        const postId = req.params.postId;
        if(!postId){
            res.status(404).json({err: `POst not found!`});
            return next();
        }
        try{
            const result = await Comment.deleteMany({});
            res.json(result);
        }catch(err){
            console.log(err);
            next(err);
        }
    });


// to get a specific post reacts
router.get("/:postID/reacts",async (req,res,next)=>{
    try{
            const postID  = new  mongoose.Types.ObjectId(req.params.postID);
            const post = await Post.findById(postID);  
            if(!post){
                res.status(404).json({err: `Post not found!`});
                return;
            }
            console.log(post.reacts);
            const reactsData = {};
            const reacts = await Post.aggregate([
                { $match: { _id: postID} },
                { $unwind: '$reacts' }, 
                { $group: { _id: '$reacts.reactType', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $project: { reactType: '$_id', reactCount: '$count' ,_id: 0} }
            ]).exec();
            reactsData.count = post.reacts.length;
            reactsData.reacts = reacts;
    console.log(reactsData);
    // reactsData.reacts = post.
     res.json(reactsData);
  }catch(err){
    console.log(err);
    next(err);
  }  
})
.post("/:postID/reacts",async (req,res,next)=>{
    const postID = req.params.postID;
    if(!req.body){
        res.status(400).json({err: `Missing body!`});
        return;
    }
    if(!req.body.publisher || !req.body.reactType){
        res.status(400).json({err: `Missing data!`});
        return;
    }
    const {publisher, reactType} = req.body;
    try{
        const newReact = new React({publisher,reactType});
        await Post.updateOne({_id: postID},{$push: {reacts: newReact}});
        res.json({message: `Added a new React successfully!`,reactData: newReact});
    }catch(err){
        console.log(err);
        next(err);
    }
})
.delete("/:postID/reacts", async (req,res,next)=>{
    if(!req.query.publisher){
        return;
    }
    const postId = req.params.postID;
    try{
        const result = await Post.updateOne({_id: postId},{
            $pull: {reacts: {publisher: req.query.publisher}}
        })
        res.json({message: `React of User ${req.query.publisher} has been removed successfully!`,result})
    }catch(err){
        console.log(err);
        next(err);
    }
})
.delete("/:postID/reacts",async (req,res,next)=>{
    try{
        const {postID} = req.params; 
        const post = await Post.findById(postID);
        post.reacts = [];
        await post.save();
        res.status(200).json({message: `All Reacts has been deleted successfully!`});
    }catch(err){
        coneole.log(err);
        next();
    }
});


module.exports = router;
