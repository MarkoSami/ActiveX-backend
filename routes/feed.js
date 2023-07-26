
var express = require('express');
var router = express.Router();
const Post = require('../models/Posts');
const User = require('../models/User')

router
    .get('/:userId', async (req, res, next) => {
        const userID = req.params.userId;
        if(!userID){
            res.status(400).json({err: `there is no userID in the request`})
        }
        try {
            const user = await User.findById(userID);
            const feed = await Post.find({ publisher: { $in: [userID, ...user.friends] } })
                .sort({ publishDate: -1, postPoints: -1 })
                .skip(user.feedOffset)
                .limit(10);

            res.json(feed);
        } catch (err) {
            next(err);
        }

    })
    .all('/', (req, res, next) => {
        res.statusCode = 403;
        res.json(`The only allowed method on the /feed path is GET`);
    })


module.exports = router;


