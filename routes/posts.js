const express = require("express");
const router = express.Router();
const Post = require("../models/Posts");
const { Comment, CommentSchema } = require("../models/Comment");
const { React, ReactSchema } = require("../models/React");
const { default: mongoose } = require("mongoose");
const postController = require("../controllers/postsController");
const { reactsEnum } = require("../models/ReactsEnum");
const utils = require("../lib/utils");
const { User } = require("../models/User");
const Notification = require("../models/Notification");
  const {authorize} = require("../authorization/authorize");

router
  .get("/", async (req, res, next) => {


    const query = {};
    if (req.query.mediaType) {
      query.mediaType = req.query.mediaType;
    }

    try {
      console.log(`The offset query is ${req.query.offset}`);
      const posts = await postController.getPosts(
        query,
        req.query.req,
        req.query.offset ? req.query.offset : 0,
        req.query.limit ? req.query.limit : 20
      );
      console.log(`requester is ${req.query.req}`);
      res.status(200).json(posts);
    } catch (err) {
      console.log(err);
      res.statusCode = 500;
      res.contentType = "application/json";
      next(err);
    }
  })
  .post("/", async (req, res, next) => {
    const { body } = req;

    // checking for the existence of the userName in the body
    if (!body.publisher) {
      return res
        .status(400)
        .json({ Message: `Publisher was not provided in the request body!` });
    }
    
    try {
    // checking for the Existence of the user
    const publisher = await User.findOne({ userName: body.publisher });
    if (!publisher) {
      return res.json(404).json({ Message: `Publisher was not found!` });
    }

    

    // mapping the data in the body to the data wanted to create the post and avoiding  unnecessary data
    const postData = utils.FieldMapper(body, [
      "publisher",
      "caption",
      "mediaURL",
      "mediaType",
    ]);

    // adding the media type if not provided
    if (postData.mediaURL && !postData.mediaType) {
      postData.mediaType = utils.extractMediTypeFromURI(postData.mediaURL);
    }

      const result = await Post.create(postData);

      const reponse = {
        _id: result.id,
        publisher: result.publisher,
        mediaURL: result.mediaURL,
        caption: result.caption,
        publishDate: result.publishDate,
        publisherData: {
          userName: publisher.userName,
          firstName: publisher.firstName,
          lastName: publisher.lastName,
          imgURL: publisher.imgURL
        }
      }
      res.json(reponse);

      const io = req.app.locals;
      const connectedUsers_UserNametoId = req.app.locals;

      // modify
      const userData = {
        userName: publisher.userName,
        imgURL: publisher.imgURL,
        firstName: publisher.firstName,
        lasName: publisher.lastName,
      };
      const notificationData = {
        causativeUser: publisher.userName,
        notificationType: "postMade",
        notificationReceiver: post.publisher,
        postId: result._id,
        userNotified: connectedUsers_UserNametoId[post.publisher]? true: false,
      };
      const notification = new Notification(notificationData);
      await notification.save();
      console.log("notification saved successfully!");

      notificationData.userData = userData;
      notificationData.notificationDate = new Date();
      notificationData._id = notification._id;


      if(connectedUsers_UserNametoId[publisher.userName] && notification.causativeUser !== reponse.publisher){

        io.to(connectedUsers_UserNametoId[publisher.userNamer]).emit(
          "postMade",
          notificationData
        );
  
        utils.logSocketEvent(`Sent Post notification`);
      }




      
    } catch (err) {
      console.log(err);
      next(err);
    }
  })
  .put("/", async (req, res, next) => {
    res.status = 403;
    res.json(`PUT request is not allowed on this URL: /posts`);
  })
  .delete("/", async (req, res, next) => {
    try {
      // if (!authorize(req.userName, "user", "deleteAll", req)) {
      //   return res
      //     .status(401)
      //     .json({ Message: `User is not authorized to take this action!` });
      // }
      const result = await Post.deleteMany({});
      res.json(result);
    } catch (err) {
      res.statusCode = 500;
      res.contentType = "application/json";
      res.json(err + `internal server error`);
      next(err);
    }
  });

router
  .get("/:postID", async (req, res, next) => {
    try {
      console.log(`entered the post b y id ${req.params.postID}`);
      const postId = req.params.postID;
      const post = await postController.getPosts(
        { _id: new mongoose.Types.ObjectId(postId) },
        req.query.req,
        req.query.offset ? req.query.offset : 0,
        req.query.limit ? req.query.limit : 30
      );
      if (!post) {
        res.status(404).json({ message: "Post not found" });
        return;
      }
      res.status(200).json(post);
    } catch (err) {
      console.log(err);
      next(err);
    }
  })
  .post("/:postID", async (req, res, next) => {
    res
      .status(403)
      .json({
        message: "POST requests are not allowed on this URL: /posts/:id",
      });
  })
  .put("/:postID", async (req, res, next) => {
    try {
      if (!req.body || !req.params || !req.params.postID) {
        res.status(400).json({ message: `The request has no body.` });
        return;
      }
      const postId = req.params.postID;
      const postData = utils.FieldMapper(req.body, [
        "caption",
        "mediaURL",
        "mediaType",
      ]);
      const updatedPost = await Post.findByIdAndUpdate(postId, postData, {
        new: true,
      });
      if (!updatedPost) {
        res.status(404).json({ message: "Post not found" });
        return;
      }
      res.status(200).json(updatedPost);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
      next(err);
    }
  })
  .delete("/:postID", async (req, res, next) => {
    try {
      const postId = req.params.postID;
      const post = await Post.findByIdAndDelete(postId);
      if (!post) {
        res.status(404).json({ message: "Post not found" });
        return;
      }
      res.status(200).json({ message: "Post deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
      next(err);
    }
  });

router
  .get("/:postId/comments", async (req, res, next) => {
    const postId = req.params.postId;
    if (!postId) {
      res.status(404).json({ err: `Missing data (Post id)!` });
      return;
    }
    try {
      const post = await Post.findById(postId);
      if (!post) {
        res.status(404).json({ err: `Post not found` });
        return;
      }
      const offset = req.query.offset? req.query.offset : 0 ;
      const limit = req.query.limit? req.query.limit : 10;

      // const comments = post.comments;

      const comments = await Post.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(req.params.postId), // Convert postId to ObjectId if it's a string
          },
        },
        {
          $unwind: "$comments", // Unwind the comments array
        },
        {
          $lookup: {
            from: 'users',
            localField: 'comments.publisher',
            foreignField: 'userName',
            as: 'publisherData',
            pipeline: [
              {
                $project: {
                  _id: 0,
                  userName: 1,
                  firstName: 1,
                  lastName: 1,
                  imgURL: 1
                }
              }
            ]
          }
        },
        {
          $addFields: {
            "comments.commentPublisherData": { $arrayElemAt: ["$publisherData", 0] }
          }
        },
        {
          $project: {
            "comments.publisher": 0, // Exclude the original publisher field if needed
          }
        },
        {
          $replaceRoot: { newRoot: "$comments" }, // Replace the root with the comments object
        },
        {
          $sort:{publishDate: -1},
        },
        {
          $skip: (offset<=0)? 0 : (offset-1)* + limit
        },
        {
          $limit: +limit
        }

      ]
      );
      // const comments = await Comment.aggregate([
      //   {
      //     $match: {
      //       _id: { $in: post.comments },
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: "users",
      //       localField: "publisher",
      //       foreignField: "userName",
      //       as: "publisherData",
      //       pipeline: [
      //         {
      //           $project: {
      //             userName: 1,
      //             firstName: 1,
      //             lastName: 1,
      //             imgURL: 1,
      //           },
      //         },
      //       ],
      //     },
      //   },
      //   {
      //     $project: {
      //       publisher: 0,
      //       __v: 0,
      //     },
      //   },
      // ]);

      res.json(comments);
    } catch (err) {
      console.log(err);
      next(err);
    }
  })

  .post("/:postId/comments", async (req, res, next) => {
    const postId = req.params.postId;
    if (!postId) {
      res.status(404).json({ err: `Post not found!` });
      return next();
    }

    try {
      // preparing data to be sent to the client
      const commentData = utils.FieldMapper(req.body, [
        "publisher",
        "caption",
        "mediaURL",
      ]);

      

      const newComment = new Comment(commentData);

      const post = await Post.findById(postId);
      const publisher = await User.findOne({ userName: req.body.publisher });
      if(!newComment.caption && !newComment.mediaURL){
        const validationError = new mongoose.Error.ValidationError();
        validationError.errors.caption = new mongoose.Error.ValidatorError({
          message: 'You must include a caption or a media in your comment!',
        });
        validationError.errors.mediaURL = new mongoose.Error.ValidatorError({
          message: 'You must include a caption or a media in your comment!',
        });
        throw validationError
      }
      // validating the post existence
      if (!post) {
        res.status(404).json({ err: `Post not found!` });
        return next();
      }
      if (!publisher) {
        res
          .status(400)
          .json({ Message: `Publisher username is not correct! ` });
        return next();
      }
      
      const result = await post.comments.push(newComment);
      await post.save();


      newComment.commentPublisherData = {
        userName: publisher.userName,
        firstName: publisher.firstName,
        lastName: publisher.lastName,
        imgURL: publisher.imgURL
      }
      
      const response = {
        _id: newComment.id,
        caption: newComment.caption,
        mediaURL: newComment.mediaURL,
        publishDate: newComment.publishDate,
        commentPublisherData: {
          userName: publisher.userName,
          firstName: publisher.firstName,
          lastName: publisher.lastName,
          imgURL: publisher.imgURL
        }

      };
      res.json(response);

      // pushing notification to the client
      const io = req.app.locals.io;
      const connectedUsers_UserNametoId =
        req.app.locals.connectedUsers_UserNametoId;

      const notificationData = {
        causativeUser: req.body.publisher,
        notificationType: "commentMade",
        commentId: newComment._id,
        notificationReceiver: post.publisher,
        postId: post._id,
        userNotified: connectedUsers_UserNametoId[post.publisher]? true : false,
      };
      const notification = new Notification(notificationData);
      await notification.save();

      notificationData.postID = post._id;
      notificationData.userData = {
        userName: publisher.userName,
        imgURL: publisher.imgURL,
      };
      notificationData.notificationDate = new Date();
      notificationData._id = notification._id;

      if(connectedUsers_UserNametoId[post.publisher]){

        io.to(connectedUsers_UserNametoId[post.publisher]).emit(
          "commentMade",
          notificationData
        );
        utils.logSocketEvent(`==> Comment publishing  notification has been sent successfully to user: ${
          post.publisher
        } with socket id : ${
          connectedUsers_UserNametoId[post.publisher]
        } made by user: ${req.body.publisher}`);
      }

      
    } catch (err) {
      console.log(err);
      next(err);
    }
  })
  .put("/:postId/comments", async (req, res, next) => {
    res.status(403).json({ err: `Put is not allowed on this path` });
  })
  .delete("/:postId/comments", async (req, res, next) => {
    const postId = req.params.postId;
    if (!postId) {
      res.status(404).json({ err: `Post not found!` });
      return next();
    }
    try {
      // const result = await Comment.deleteMany({});
      const post = await Post.findById(postId);
      const commentCount = post.comments.length;
      post.comments = [];
      await post.save();
      
       
      res.json({Messge: `Deleted ${commentCount} comments successfully!`});
    } catch (err) {
      console.log(err);
      next(err);
    }
  });


  router.get("/:postId/comments/:commentId",async (req,res,next)=>{
    console.log(req.params.postId,req.params.commentId );
    if(!req.params.postId || !req.params.commentId){
      return res.json(400).json({Message: `Invalid or missing  parameters!`});
    }
    try{
      const comment = await Post.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(req.params.postId), // Convert postId to ObjectId if it's a string
          },
        },
        {
          $unwind: "$comments", // Unwind the comments array
        },
        {
          $match: { "comments._id": new mongoose.Types.ObjectId(req.params.commentId) }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'comments.publisher',
            foreignField: 'userName',
            as: 'publisherData',
            pipeline: [
              {
                $project: {
                  _id: 0,
                  userName: 1,
                  firstName: 1,
                  lastName: 1,
                  imgURL: 1
                }
              }
            ]
          }
        },
        {
          $addFields: {
            "comments.publisherData": { $arrayElemAt: ["$publisherData", 0] }
          }
        },
        {
          $project: {
            "comments.publisher": 0, // Exclude the original publisher field if needed
          }
        },
        {
          $replaceRoot: { newRoot: "$comments" }, // Replace the root with the comments object
        },
      ]
      );
        
      
      if(!comment.length){
        return res.status(404).json({Message: `Comment not found!`});
      }
      // console.log(comment);
      res.json(comment[0])
    }catch(err){
      console.log(err);
      next(err);
    }
  })
  .put("/:postId/comments/:commentId",async (req,res,next)=>{
    
    try{
      const updateFields = {};

      if (req.body.caption) {
        updateFields['comments.$.caption'] = req.body.caption;
      }

      if (req.body.mediaURL) {
        updateFields['comments.$.mediaURL'] = req.body.mediaURL;
      }

      const updateOperation = {
        $set: updateFields
      };

      const result   = await  Post.updateOne({
        _id: new mongoose.Types.ObjectId(req.params.postId),
        'comments._id': new mongoose.Types.ObjectId(req.params.commentId),
       },

       updateOperation
      );

      res.status(result? 200 : 404).json({Message: result? `Comment was updated successfully!` : `Comment not found!`});

    }catch(err){
      console.log(err);
      next(err);
    }
  })
  .delete("/:postId/comments/:commentId",async (req,res,next)=>{

    try{
      
      const result = await Post.updateOne(
        {
        _id: new mongoose.Types.ObjectId(req.params.postId),
        },
        {
          $pull: {
            comments:{_id: new mongoose.Types.ObjectId(req.params.commentId)}  
          }
        }
      );
      res.status(result? 200 : 404).json({Message: result? `Comment was deleted successfully!` : `Comment not found!`});

    }catch(err){
      console.log(err)
      next(err);
    }

  })


  .all("/:postId/comments/:commentId",async (req,res,next)=>{
    res.status(401).json({Message: `This operation is not  allowed on path ${req.path}   `})
  })

// to get a specific post reacts
router
  .get("/:postID/reacts", async (req, res, next) => {
    try {
      const postID = new mongoose.Types.ObjectId(req.params.postID);
      const post = await Post.findById(postID);
      if (!post) {
        res.status(404).json({ err: `Post not found!` });
        return;
      }
      console.log(post.reacts);
      const reactsData = {};
      const reacts = await Post.aggregate([
        { $match: { _id: postID } },
        { $unwind: "$reacts" },
        { $group: { _id: "$reacts.reactType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { reactType: "$_id", reactCount: "$count", _id: 0 } },
      ]).exec();
      reactsData.count = post.reacts.length;
      reactsData.reacts = reacts;
      console.log(reactsData);
      // reactsData.reacts = post.
      res.json(reactsData);
    } catch (err) {
      console.log(err);
      next(err);
    }
  })
  .post("/:postID/reacts", async (req, res, next) => {
    // checking for the existence of the body.
    const postID = req.params.postID;
    if (!req.body) {
      res.status(400).json({ err: `Missing body!` });
      return;
    }
    // checking for existence of the publisher and reactType fields in the body provided.
    if (!req.body.publisher || !req.body.reactType) {
      res.status(400).json({ err: `Missing data!` });
      return;
    }

    // checking if teh reactType field in the body is correct (of type reactsEnum).
    if (!req.body.reactType in reactsEnum) {
      res
        .status(400)
        .json({
          Message: `Wrong react type!. you should provide one of these types${reactsEnum.join(
            ", "
          )}`,
        });
    }

    const { publisher, reactType } = req.body;
    try {
      // checking for the existence of the post with id provided in the URI.
      const post = await Post.findById({ _id: postID });
      if (!post) {
        res.status(404).json({ Message: `Post not found!` });
        return;
      }

      // checking for the existence of the post publisher
      const publisherDoc = await User.findOne({ userName: publisher });
      if (!publisherDoc) {
        return res.status(404).json({ Message: `Publisher was not found!` });
      }

      // Getting the user old react index if exists.
      const reactIndex = post.reacts.findIndex(
        (react) => react.publisher === req.body.publisher
      );
      // creating new react
      const newReact = new React({ publisher, reactType });
      if (reactIndex !== -1) {
        post.postPoints -= reactsEnum[post.reacts[reactIndex].reactType]; // removing the old post point of the old react
        post.reacts[reactIndex] = newReact;
        post.postPoints += reactsEnum[newReact.reactType]; // adding the post points value of the new react type
        await post.save();
        res
          .status(200)
          .json({
            Message: `React has successfully changed to "${reactType}" `,
          });
        return;
      }

      // creating a new react and updating the post document.
      post.reacts.push(newReact);
      post.postPoints += reactsEnum[reactType];
      console.log(post.postPoints);
      // saving the post document.
      await post.save();

      // sending the response to the user.
      res.json({
        message: `Added a new React successfully!`,
        reactData: newReact,
      });
      const io = req.app.locals.io;
      const connectedUsers_UserNametoId =
        req.app.locals.connectedUsers_UserNametoId;

      // const reactData = {
      //     postId: post._id,
      // }
      const userData = {
        userName: publisherDoc.userName,
        imgURL: publisherDoc.imgURL,
        firstName: publisherDoc.firstName,
        lasName: publisherDoc.lastName,
      };
      const notificationData = {
        causativeUser: publisher,
        notificationType: "reactMade",
        reactType,
        notificationReceiver: post.publisher,
        postId: postID,
        userNotified: connectedUsers_UserNametoId[post.publisher]? true: false,
      };
      const notification = new Notification(notificationData);
      await notification.save();
      console.log("notification saved successfully!");

      notificationData.userData = userData;
      notificationData.notificationDate = new Date();
      notificationData._id = notification._id;


      if(connectedUsers_UserNametoId[post.publisher] && notification.causativeUser !== post.publisher){
        
        console.log(`======>`,notification.causativeUser,post.publisher);
        io.to(connectedUsers_UserNametoId[post.publisher]).emit(
          "reactMade",
          notificationData
        );
  
        utils.logSocketEvent(`Sent user react notification to user ${
          post.publisher
        } with socketId: ${
          connectedUsers_UserNametoId[post.publisher]
        } on post with if : ${post._id} by user ${publisher} with socketId: ${
          connectedUsers_UserNametoId[publisher]
        } `);
      }
      
    } catch (err) {
      console.log(err);
      next(err);
    }
  })
  .delete("/:postID/reacts", async (req, res, next) => {
    if (!req.query.publisher) {
      return next();
    }
    const postId = req.params.postID;
    try {
      const result = await Post.updateOne(
        { _id: postId },
        {
          $pull: { reacts: { publisher: req.query.publisher } },
        }
      );

      res.json({
        message: `React of User ${req.query.publisher} has been removed successfully!`,
        result,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  })
  .delete("/:postID/reacts", async (req, res, next) => {
    try {
      const { postID } = req.params;
      const post = await Post.findById(postID);
      post.reacts = [];
      await post.save();
      res
        .status(200)
        .json({ message: `All Reacts has been deleted successfully!` });
    } catch (err) {
      coneole.log(err);
      next();
    }
  });

module.exports = router;
