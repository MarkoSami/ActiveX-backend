var express = require('express');
var router = express.Router();
const Post = require('../models/Posts');
const User = require('../models/User')

router
    .get('/', async (req, res, next) => {
        const userID = req.params.userId;
        try {
            const user = await User.findById(userID);
            const feed = await Post.find({ publisher: { $in: [userID, ...user.friends] } })
                .sort({ publishDate: -1 })
                .skip(user.feedOffset)
                .limit(50);

            res.json(feed);
        } catch (err) {
            next(err);
        }

    })
    .all('/', (req, res, next) => {
        res.statusCode = 403;
        res.json(`The ob=nly allowe method on this path is GET`);
    })


module.exports = router;


