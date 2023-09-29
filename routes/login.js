const express = require("express");
const router = express.Router();
const {User} = require("../models/User");
const bcrypt = require("bcrypt");
const { use } = require("./feed");
const { createJWT } = require("../authentication/createJWT");

router.post("/", async (req, res, next) => {
  const body = req.body;
  if (!req.body || !body.userName || !body.password) {
    res.status(400).json({ err: `bad request` });
    return;
  }

  try {
    const user = await User.findOne({ userName: body.userName });
    if (!user) {
      console.log(`invalid credentials`);
      res.status(401).json({ err: `Incorrect username or password!` });
      return;
    }
    const isPasswordValid = await bcrypt.compare(body.password, user.password);
    if (!isPasswordValid) {
      console.log(`Invalid credentials`);
      res.status(401).json({ err: `Incorrect username or password!` });
      return;
    }
    const jwt = await createJWT(user.userName);
    console.log(jwt);
    res.cookie("token", jwt, {
      maxAge: 24 * 60 * 60 * 1000, // Set maxAge in milliseconds (24 hours)
      sameSite: 'None', // Allow cross-site requests for modern browsers
      domain: "v.onrender.com", // Change the domain to the common root domain
      // path: '/',
      secure: false, // Ensure the cookie is sent over HTTPS
      httpOnly: false
    });
    
    
    console.log(`--->cookie has been set with token ${jwt}`);
    res.json({Message: `logged  in successfully!`});
  } catch (err) {
    console.log(err);
    next(err);
    
  }
})
  .all("/", async (req, res, next) => {
    res
      .status(403)
      .json({ err: `Can't ${req.method} in the ${req.path} path` });
  });

module.exports = router;
