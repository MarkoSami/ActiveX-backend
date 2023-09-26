var express = require("express");
var router = express.Router();
const Post = require("../models/Posts");
const { User } = require("../models/User");
const postController = require("../controllers/postsController");
const authorize = require('../authorization/authorize');

router
  .get("/:userName", async (req, res, next) => {
    const userName = req.params.userName;
    const offset = req.query.offset ? req.query.offset : 0;
    const limit = req.query.limit ? req.query.limit : 10;
    console.log(`====>offset: ${offset} limit: ${limit}`);
    if (!userName) {
      res.status(400).json({ err: `there is no userID in the request` });
      return;
    }
    try {
      //query,viewerUserName,offset,limit
      const user = await User.find({ userName });
      if (!user) {
        return res.status(404).json("User not found!");
      }
      // if(!authorize(userName)){
      //   return json.status(401).json({Message: `user is not authorized to take this action!`});
      // }
      
      const feed = await postController.getPosts(
        { publisher: { $in: [userName, ...user[0].friends] } },
        req.query.req,
        offset,
        limit
      );
      // const feed = await Post.find({ publisher: { $in: [userName, ...user[0].friends] } })
      //     .sort({ publishDate: -1})
      //     .skip(offest)
      //     .limit(limit);
      res.json(feed);
    } catch (err) {
      console.log(err);
      next(err);
    }
  })
  .all("/", (req, res, next) => {
    res.statusCode = 403;
    res.json(`The only allowed method on the /feed path is GET`);
  });

module.exports = router;
