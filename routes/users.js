var express = require('express');
var router = express.Router();
const User = require('../models/User');

// GET all users
router.get('/', (req, res, next) => {
  User.find()
    .then(users => {
      res.json(users);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    });
});

// GET a specific user by ID
router.get('/:id', (req, res, next) => {
  const userId = req.params.id;

  User.findById(userId)
    .then(user => {
      if (!user) {
        res.status(404).json({ error: 'User not found' });
      } else {
        res.json(user);
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    });
});

// POST create a new user
router.post('/', (req, res, next) => {
  const { userName, password } = req.body;

  const newUser = new User({
    userName,
    password
  });

  newUser.save()
    .then(user => {
      res.json(user);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    });
});

// PUT update an existing user
router.put('/:id', (req, res, next) => {
  const userId = req.params.id;
  const { userName, password } = req.body;

  User.findByIdAndUpdate(userId, { userName, password }, { new: true })
    .then(updatedUser => {
      if (!updatedUser) {
        res.status(404).json({ error: 'User not found' });
      } else {
        res.json(updatedUser);
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    });
});

// DELETE a user
router.delete('/:id', (req, res, next) => {
  const userId = req.params.id;

  User.findByIdAndRemove(userId)
    .then(removedUser => {
      if (!removedUser) {
        res.status(404).json({ error: 'User not found' });
      } else {
        res.json({ message: 'User deleted successfully' });
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    });
});

module.exports = router;
