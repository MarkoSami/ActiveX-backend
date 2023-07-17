const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    publisher: {
        type: mongoose.Schema.Types.ObjectId,
        require: [true, 'publisher can not be empty']
    },
    caption: {
        type: String,
        default: '',
        maxlength: [200, 'caption is too long'],
        // validate whether the post has at least either a caption or an image
        validate: {
            validator: function () {
                return this.img || this.caption;
            },
            message: 'You must provide either an image or a caption.'
        }
    },
    img: {
        type: URL,
        default: ''
    },
    reactCount: {
        type: Map,
        of: Number,
        default: {}
    },
    publishDate: {
        type: Date,
        default: Date.now
    }

});



const Comment = mongoose.model('Comment', CommentSchema);
module.exports = Comment;
