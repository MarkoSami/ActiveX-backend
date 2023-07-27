
const express = require('express');
const router = express.Router();
const Post = require('../models/Posts');

router
    .get('/', async (req, res, next) => {
        try {
            const posts = await Post.find({});
            res.statusCode = 200;
            res.contentType = 'application/json';
            res.json(posts);
        } catch (err) {
            res.statusCode = 500;
            res.contentType = 'application/json';
            res.json(err + `internal server error`);
            next(err);
        }
    })
    .post('/', async (req, res, next) => {
        const { body } = req;
        try {
            const result = await Post.create(body);
            res.json(result);
        } catch (err) {
            // res.statusCode = 500;
            // res.contentType = 'application/json';
            // res.json(err + `internal server error`);
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
            const postId = req.params.id;
            const post = await Post.findById(postID);
            if (!post) {
                res.status(404).json({ message: 'Post not found' });
                return;
            }
            res.status(200).json(post);
        } catch (err) {
            res.status(500).json({ message: 'Internal server error' });
            next(err);
        }
    })
    .post('/:postID', async (req, res, next) => {
        res.status(403).json({ message: 'POST requests are not allowed on this URL: /posts/:id' });
    })
    .put('/:postID', async (req, res, next) => {
        try {
            if(!req.body || !req.params || req.params.postID){
                res.status(400).json({message: `The request has no body.`});
                return next();
            }
            const postId = req.params.postID;
            const { caption,mediaURL}= req.body;
            const post = await Post.findByIdAndUpdate(postId, body, { new: true });
            if (!post) {
                res.status(404).json({ message: 'Post not found' });
                return;
            }
            res.status(200).json(post);
        } catch (err) {
            res.status(500).json({ message: 'Internal server error' });
            next(err);
        }
    })
    .delete('/:postID', async (req, res, next) => {
        try {
            const postId = req.params.id;
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

module.exports = router;
