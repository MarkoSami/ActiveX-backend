const mongoose = require('mongoose');

const NotificationSchema  = new mongoose.Schema({

    causativeUser: {
        type: String,
        required: [true,`Causative user can't be empty!`],
    },
    notificationType: {
        type: String,
        required: [true,`Notification type can't be empty!`],
        enum: ['friendRequest','reactMade','commentMade','friendRequestAccepted']
    },
    userNotified: {
        type: Boolean,
        default: false
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post' ,
        validate: {
            // validating for the existence of the post id with the comment or react notifications
            validator: function(postId){
                if(this.commentId || this.reactType){
                    return postId;
                }
                return (!this.commentId && !this.reactType);
            },
            message: `The postId is related to the existence of commentId or a reactType!`
        }
    },
    reactType: {
        type:String,
        enum: ['Love', 'Amazing', 'Thunder', 'Dislike', 'Skull', 'Shit']
    },
    commentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        validate: {
            validator: function(commentId){
                if(this.reactType){
                    return false;
                }
                return true;
            } ,
            message: `Can't include comment and react type at the same notification`
        }
    },
    notificationReceiver: {
        type: String,
        required: true
    },

    notificationDate: {
        type: Date,
        default: () => new Date()
    }

});

NotificationSchema.statics.sendNotifications = async function(socket){
    const offset = 0;
    let notifications;

    do{
        let notifications = await Notification.find({userNotified: false}).skip(offset).limit(10);
        for(const notification of notifications){
            socket.emit(notification.notificationType,notification);
            notification.userNotified = true;
            await notification.save();
        }
        offset+=10;

    }while(notifications);
}

const Notification = mongoose.model('Notification', NotificationSchema);

module.exports = Notification;