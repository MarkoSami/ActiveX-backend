        const mongoose = require('mongoose');
        const reactsEnum = require('./ReactsEnum');
        const {CommentSchema} = require('./Comment');
        const {ReactSchema} = require('./React');
        const {extractMediTypeFromURI} = require('../lib/utils');

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
                        return this.mediaURL || this.caption;
                    },
                    message: `A post should contain at least an image or a caption`
                }
            },  
            mediaURL: {
                type: String,
                default: ''
            },
            mediaType: {
                type: String,
                enum: ['video', 'image', 'audio', 'none'],
                // default: extractMediTypeFromURI(this.mediaURL),
                validate: {
                    validator: function (value) {
                        if (!this.mediaURL) {
                            // No mediaURL, so mediaType is allowed to be empty
                            return true;
                        }
                    
                        return !!value;
                    },
                    message: `mediaType cannot be empty!`
                }
            },
            labels: {
                type: [{
                    type: String,
                    minlength: [3, 'label is too short'],
                    maxlength: [15, 'label is too long']
                }],
                default: []
            },

            postPoints: {
                type: Number,
                default: 0
            },
            reacts: [ReactSchema],     
            comments: [CommentSchema],       
            publishDate: {
                type: Date,
                default: () => new Date()
            },   

            
        },
        {
            toJSON: {virtuals: true}
        }
        );

        // validating the mediaType field 
        PostSchema.pre('validate', function (next) {
            
            if (this. mediaURL && !this.mediaType) { 
              this.invalidate('mediaType', 'mediaType cannot be empty!', this.mediaType);
              return next();
            }

            if(this.mediaType && extractMediTypeFromURI(this.mediaURL) !== this.mediaType){
                this.invalidate('mediaType','mediaType is not valid for this media!',this.mediaType);
            }

            next();
          });


const Post = mongoose.model('Post', PostSchema);
module.exports = Post;
