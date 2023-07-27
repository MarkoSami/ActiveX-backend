const express = require("express");
const router = express.Router();
const User = require("../models/User");
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
      res.status(401).json({ err: `Invalid credentials.` });
      return;
    }
    const isPasswordValid = await bcrypt.compare(body.password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ err: `Invalid credentials password.` });
      return;
    }
    const jwtCreation = await createJWT(user.userName);
    // console.log(jwtCreation);
    res.cookie("token", jwtCreation, {
      maxAge: 24 * 60 * 60,
      httpOnly: false,
      sameSite: 'none' ,// Allow cross-site requests
      secure: true
    });
    res.json("logged in successfully");
  } catch (err) {
    console.log(err);
    next(err);
  }
})
 .get('/',(req,res,next)=>{

})
  .all("/", async (req, res, next) => {
    res
      .status(403)
      .json({ err: `Can't ${req.method} in the ${req.path} path` });
  });

module.exports = router;
