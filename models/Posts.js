const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    publisher: {
        type: mongoose.Schema.Types.ObjectId,
        require: [true, 'publisher cannot be empty']
    },
    caption: {
        type: String,
        default: '',
        maxlength: [200, 'caption is too long'],
        validate: {
            validator: function () {
                return this.img || this.caption;
            }
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
// Define a virtual field for the total post points
ReactSchema.virtual('postPoints').get(function () {
    let total = 0;
    for (const count of this.reactCount.values()) {
        total += count;
    }
    return total;
});
const Post = mongoose.model('Post', PostSchema);
module.exports = Post;
