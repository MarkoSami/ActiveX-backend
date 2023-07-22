const mongoose = require('mongoose');
const reactsEnum = require('./ReactsEnum');

const PostSchema = new mongoose.Schema({
    publisher: {
        type: String,
        required: [true, `publisher can't be empty`]
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
            message: `A post should contain at least an image or a caption`
        }
    },
    imgURL: {
        type: String,
        default: ''
    },
    labels: {
        type: [{
            type: String,
            minlength: [3, 'label is too short'],
            maxlength: [15, 'label is too long']
        }],
        default: []
    },
    reactsCount: {
        type: Map,
        of: Number,
        default: {}
    },
    publishDate: {
        type: Date,
        default: () => new Date()
    }
});
// Define a virtual field for the total post points
PostSchema.virtual('postPoints').get(function () {
    let total = 0;
    for (const [emoji, count] of this.reactsCount) {
        total += count * reactsEnum[emoji];
    }
    return total;
});
const Post = mongoose.model('Post', PostSchema);
module.exports = Post;
