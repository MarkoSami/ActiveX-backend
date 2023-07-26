const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const { use } = require('./feed');
const {createJWT} = require('../authentication/createJWT');


router.post('/', async (req, res) => {
    if (!req.body || !body.userName || !body.password) {
        res.status(400).json({ err: `bad request` });
        return;
    }

    try {
        const user = await User.findOne({ userName: body.userName });
        if (!user) {
            res.status(401).json({ err: `Invalid credentials.` })
            return;
        }
        const isPasswordValid = await bcrypt.compare(body.password, use.password);
        if (!isPasswordValid) {
            res.status(401).json({ err: `Invalid credentials.` });
            return;
        }
        res.cookie('token',createJWT(user.userName),{ maxAge: 24*60*60, httpOnly: true });

    } catch (err) {
        next(err);
    }

})
.all('/',async(req,res,next)=>{
    res.status(403).json({err: `Can't ${req.method} in the ${req.path} path`});
});

module.exports = router;