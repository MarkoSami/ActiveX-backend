var express = require("express");
var router = express.Router();
const User = require("../models/User");

// handling HTTP requests on the '/users/' gateway
router
  .get("/", async (req, res, next) => {
    try {
      const users = await User.find({}).select(
        "-password -feedOffset -commentOffset -friendRequestsOffset"
      );
      res.statusCode = 200;
      res.contentType = "application/json";
      res.json(users);
    } catch (err) {
      next(err);
    }
  })
  .post("/", async (req, res, next) => {
    const { body } = req;
    try {
      const result = await User.create(body);
      res.statusCode = 200;
      res.json(result);
    } catch (err) {
      // res.json(`err`);
      console.log(err);
      res.json({ err });

      // next(err);
    }
  })
  .put("/", async (req, res, next) => {
    res.statusCode = 403;
    res.json(`PUT request is not allowed on this URL: /users`);
  })
  .delete("/", async (req, res, next) => {
    try {
      const result = await User.deleteMany();
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

// handling HTTP requests on the '/users/:id' gateway
router
  .get("/:userName", async (req, res, next) => {
    try {
      const userName = req.params.userName;
      const users = await User.findOne({ userName }).select(
        "-password -feedOffset -commentOffset -friendRequestsOffset"
      );
      res.json(users);
    } catch (err) {
      console.log(err);
      next(err);
    }
  })
  .post("/:userName", async (req, res, next) => {
    res.statusCode = 403;
    res.json(`POST requests is not allowed on this URL: /users/:id`);
  })
  .put("/:userName", async (req, res, next) => {
    if (!req.body || !req.params || !req.params.userName) {
      res.status(400).json({ message: `The request has no body.` });
      return next();
    }
    console.log(req.body);
    let updateData = {};
    if (req.body.userName) {
      updateData.firstName = res.body.firstName;
    }
    if (req.body.lastName) {
      updateData.lastName = req.body.lastName;
    }
    if (req.body.userDescription) {
      updateData.userDescription = req.body.userDescription;
    }
    if (req.body.imgURL) {
      updateData.imgURL = req.body.imgURL;
    }
    if (req.body.coverURL) {
      updateData.coverURL = req.body.coverURL;
    }
    const userName = req.params.userName;

    console.log(updateData);
    try {
      const result = await User.findOneAndUpdate({ userName }, updateData, {
        new: true,
      });
      console.log(result);
      res.json(result);
    } catch (err) {
      console.log(err);
      next(err);
    }
  })
  .delete("/:userName", async (req, res, next) => {
    try {
      const userName = req.params.userName;
      const result = await User.deleteOne({ userName });
      res.json({ result });
    } catch (err) {
      console.log(err);
      next(err);
    }
  });

// router
// .get('/userName/postId',async(req,res,next)=>{
//   req.params
// })
// .post('/userName/postId',async(req,res,next)=>{

// })
// .put('/userName/postId',async(req,res,next)=>{

// })
// .delete('/userName/postId',async(req,res,next)=>{

// })

module.exports = router;
