const mongoose = require('mongoose');


const ReactSchema = new mongoose.Schema({
    publisher: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'publisher can not be empty']
    },
    reactType: {
        type: String,
        enum: ['Love', 'Amazing', 'Thunder', 'Dislike', 'Skull', 'Shit'],
        required: true
    },
    reactDate: {
        type: Date,
        default: Date.now
    }

});


const React = mongoose.model('React', ReactSchema);
module.exports = {React,ReactSchema};
