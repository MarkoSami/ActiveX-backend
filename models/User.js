const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: [true, `User name is required`],
        unique: [true, `User name must be Unique`],
        minlength: [6, `User name can't be less than 6 charachters`],
        maxlength: [20, `User name can't exceed 20 charachters`]
    },
    password: {
        type: String,
        required: [true, `Password is required`],
        minlength: [8, `Password can;t be less than 8 charachters`],
        maxlength: [20, `Password can't exceed 20 charachters`]
    },
    userDescription: {
        type: String,
        default: 'No description',
        maxlength: [500, 'User description is too long']
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    imgURL: {
        type: String,
        default: ''
    }

});

const User = mongoose.model('User', UserSchema);
module.exports = User;