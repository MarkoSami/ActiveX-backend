const mongoose = require('mongoose');


const reactTypeEnum = Object.freeze({
    COOL: 'cool',
    STAR: 'star',
    THUNDER: 'thunder'
});

const ReactSchema = new mongoose.Schema({
    publisher: {
        type: mongoose.Schema.Types.ObjectId,
        require: [true, 'publisher can not be empty']
    },
    type: {
        type: String,
        enum: ['cool', 'star', 'thunder'],
        default: 'cool'
    },
    reactDate: {
        type: Date,
        default: Date.now
    }

});


const React = mongoose.model('React', ReactSchema);
module.exports = React;
