const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: [true, `User name is required`],
        unique: [true, `User name must be Unique`],
        minlength: [6, `User name can't be less than 6 charachters`],
        maxlength: [20, `User name can't exceed 20 charachters`],
        validate: {
            // validate that tthe username doesn't contain anu special charachters excepts '_'
            validator: function (value) {
                return /^[a-zA-Z0-9_]+$/.test(value);
            },
            message: 'User name must only contain letters, numbers, and underscores.'
        }
    },
    password: {
        type: String,
        required: [true, `Password is required`],
        minlength: [8, `Password can't be less than 8 charachters`],
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
    friendRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    imgURL: {
        type: String,
        default: ''
    },
    influence: {
        type: Number,
        default: 0,
        min: [0, `influence can't be a negative number.`]
    },
    feedOffset: {
        type: Number,
        default: 0,
        min: [0, `the offeset of the posts feed can't be a negative number`]
    },
    commentsOffset: {
        type: Number,
        default: 0,
        min: [0, `the offeset of the comments feed can't be a negative number`]
    },
    friendRequestsOffset: {
        type: Number,
        default: 0,
        min: [0, `the offeset of the friend requests can't be a negative number`]
    }

});


UserSchema.set('_id', false);

const User = mongoose.model('User', UserSchema);
module.exports = User;