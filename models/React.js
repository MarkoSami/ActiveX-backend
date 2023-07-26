const mongoose = require('mongoose');


const ReactSchema = new mongoose.Schema({
    publisher: {
        type: mongoose.Schema.Types.ObjectId,
        require: [true, 'publisher can not be empty']
    },
    type: {
        type: String,
        enum: ['love', 'amazing', 'thunder', 'dislike', 'skull', 'shit'],
    },
    reactDate: {
        type: Date,
        default: Date.now
    }

});


const React = mongoose.model('React', ReactSchema);
module.exports = React;
