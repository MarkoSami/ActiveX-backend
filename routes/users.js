var express = require('express');
var router = express.Router();
const User = require('../models/User');


// handling HTTP requests on the '/users/' gateway
router
  .get('/', async (req, res, next) => {
    try {
      const users = await User.find({}).select('-password -feedOffset -commentOffset -friendRequestsOffset');
      res.statusCode = 200;
      res.contentType = 'application/json';
      res.json(users);
    } catch (err) {
      next(err);
    }
  })
  .post('/', async (req, res, next) => {
    const { body } = req;
    try {
      const result = await User.create(body);
      res.statusCode = 200;
      res.json(result);
    } catch (err) {
      // res.json(`err`);
      console.log(err);
      res.json({err})

      // next(err);
    }
  })
  .put('/', async (req, res, next) => {
    res.statusCode = 403;
    res.json(`PUT request is not allowed on this URL: /users`);
  })
  .delete('/', async (req, res, next) => {
    try {
      const result = await User.deleteMany();
      res.json(result);
    } catch (err) {
      next(err);
    }
  })

// handling HTTP requests on the '/users/:id' gateway
router
  .get('/:userName', async (req, res, next) => {
    try {
      const userName = req.params.userName;
      const users = await User.findOne({ userName }).select('-password -feedOffset -commentOffset -friendRequestsOffset');
      res.statusCode = 200;
      res.contentType = 'application/json';
      res.json(users);
    } catch (err) {
      next(err);
    }
  })
  .post('/:userName', async (req, res, next) => {
    res.statusCode = 403;
    res.json(`POST requests is not allowed on this URL: /users/:id`);
  })
  .put('/:id', async (req, res, next) => {
    try {
      const result = User.updateOne({ id });
      res.json(result);
    } catch (err) {
      next(err);
    }
  })
  .delete('/:userName', async (req, res, next) => {
    try {
      const userName = req.body.userName;
      const result = User.deleteOne({ userName });
      res.json(result);
    } catch (err) {
      next(err);
    }
  })


module.exports = router;
