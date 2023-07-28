
var express = require('express');
var router = express.Router();
const Post = require('../models/Posts');
const User = require('../models/User')

router
    .get('/:userName', async (req, res, next) => {
        const userName = req.params.userName;
        if(!userName){
            res.status(400).json({err: `there is no userID in the request`})
        }
        try {
            const user = await User.find({userName});
            const feed = await Post.find({ publisher: { $in: [userName, ...user[0].friends] } })
                .sort({ publishDate: -1, postPoints: -1 })
                .skip(user.feedOffset)
                .limit(10);
            console.log(feed);
            res.json(feed);
        } catch (err) {
            console.log(err);
            next(err);
        }

    })
    .all('/', (req, res, next) => {
        res.statusCode = 403;
        res.json(`The only allowed method on the /feed path is GET`);
    })


module.exports = router;


