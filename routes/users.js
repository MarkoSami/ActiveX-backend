var express = require('express');
var router = express.Router();
const User = require('../models/User');


// handling HTTP requests on the '/users/' gateway
router
  .get('/', async (req, res, next) => {
    try {
      const users = await User.find({}).select('-password -feedOffset -commentOffset -friendRequestsOffset');
      res.status = 200;
      res.contentType = 'application/json';
      res.json(users);
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
      const result = await User.create(body);
      res.statusCode = 200;
      res.json(result);
    } catch (err) {
      res.statusCode = 500;
      res.contentType = 'application/json';
      res.json(err + `internal server error`);
      next(err);
    }
  })
  .put('/', async (req, res, next) => {
    res.status = 403;
    res.json(`PUT request is not allowed on this URL: /users`);
  })
  .delete('/', async (req, res, next) => {
    try {
      const result = await User.deleteMany();
      res.json(result);
    } catch (err) {
      res.statusCode = 500;
      res.contentType = 'application/json';
      res.json(err + `internal server error`);
    }
  })

// handling HTTP requests on the '/users/:id' gateway
router
  .get('/:id', async (req, res, next) => {
    try {
      const userId = req.params.id;
      const users = await User.findOne({ id }).select('-password');
      res.status = 200;
      res.contentType = 'application/json';
      res.json(users);
    } catch (err) {
      res.statusCode = 500;
      res.contentType = 'application/json';
      res.json(err + `internal server error`);
      next(err);
    }
  })
  .post('/:id', async (req, res, next) => {
    res.statusCode = 403;
    res.json(`POST requests is not allowed on this URL: /users/:id`);
  })
  .put('/:id', async (req, res, next) => {
    try {
      const result = User.updateOne({ id });
      res.json(result);
    } catch (err) {
      res.statusCode = 500;
      res.contentType = 'application/json';
      res.json(err + `internal server error`);
      next(err);
    }
  })
  .delete('/:id', async (req, res, next) => {
    try {
      const result = User.deleteOne({ id });
      res.json(result);
    } catch (err) {
      res.statusCode = 500;
      res.contentType = 'application/json';
      res.json(err + `internal server error`);
      next(err);
    }
  })


module.exports = router;
