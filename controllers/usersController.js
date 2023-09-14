const { User } = require('../models/User');
const mongoose = require('mongoose');

const usersMatchQuery = (querry) => {
    return (querry) ? querry : {};
};

const getUsersPipeline = (querry) => {
    return [
        {
            $match: usersMatchQuery(querry)
        },
        {
            $project: {
                _id: 0,
                firstName: 1,
                lastName: 1,
                userDescription: 1,
                userName: 1,
                imgURL: 1,
                coverURL: 1,
                friends: 1,
                friendRequests: 1,
            }
        },
        {
            $limit: 50
        }
    ];
};

const getUsers = async (querry) => {
    const users = await User.aggregate(getUsersPipeline(querry));
    return users; // You were missing this return statement
};

module.exports = {
    getUsers
};
