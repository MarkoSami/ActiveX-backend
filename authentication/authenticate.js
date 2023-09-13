    const jwt = require('jsonwebtoken');
    require('dotenv').config();
    const { User } = require('../models/User');

    const authenticate = async (req, res, next) => {
        if (req.path == '/#/login') {
            next(); // Skip authentication for login route
            return;
        }

        const cookies = req.cookies;
        console.log(cookies['token']);
        if (!cookies || !('token' in cookies)) {
            console.log(`Missing token cookie`);
            res.status(401).json({Message: `Missing token cookie, rdirect to login page`}) // Redirect if userName is missing in the token
            return; 
        }

        const token = cookies['token'];
        console.log(token);
        try {
            const decodedToken = jwt.verify(token, process.env.SECRET_KEY);

            if (!decodedToken.userName) {
            console.log(`Missing username`);

                res.status(401).json({Message: `Missing username, rdirect to login page`}) // Redirect if userName is missing in the token
                return ;
            }

            const user = await User.findOne({ userName: decodedToken.userName });

            if (user) {
                req.userName = user;
                next(); // Continue to the next middleware if user is found
                return;
            }

            res.status(401).json({Message: `User not found!, rdirect to login page`}) // Redirect if userName is not fund in the database
            return; 
        } catch (error) {   
            console.log(error);
            next();
        }
    };

    module.exports = {
        authenticate
    };
