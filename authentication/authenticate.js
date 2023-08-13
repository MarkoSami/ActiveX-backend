const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require('../models/User');


const authenticate = async (req, res, next) => {
    if(req.path == '/#/login'){
        return next();
    }
    const cookies = req.cookies;
    console.log(cookies);
    if(!cookies){
        
        console.log(`user redirected`);
        return res.redirect('/login')
    }
    if (!('token' in cookies)) {
        console.log(cookies);
        res.status(401).json({ message: `Unauthorized please login.` });
        return;
    }
    const token = cookies['token'];
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    if (!decodedToken.userName) {
        return res.status(400).json({ error: 'Invalid token: userName is missing.' });
    }
    const user = await User.findOne({ userName: decodedToken.userName })
    if (user) {
        return next();
    }
    return res.redirect('/#/login')
    res.status(404).json({ err: `Username not found.` });
};



module.exports = {
    authenticate
};