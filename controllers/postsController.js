const Post = require('../models/Posts');
const mongoose = require('mongoose');

const postsPipelineMatch = (userName, postID) => {
  if(postID){
    return {_id: new mongoose.Types.ObjectId(postID)};
  }
  if(userName){
    return{publisher: userName};
  }
  return {};
};
const postsPipeline = (userName,viewerUserName,postID)=>{
  const postsPipeLineMatchQuerryObj = postsPipelineMatch(userName,postID);

  console.log(`in tthe pipeline the posId is ${postID} and req is ${viewerUserName}`);
  return [
    {
      $match: postsPipelineMatch(userName,postID)
    }
    ,
    {
      $lookup: {
        from: 'users',
        localField: 'publisher',
        foreignField: 'userName',
        pipeline: [
          { $project: { userName: 1, firstName: 1, lastName: 1, imgURL: 1 } },
        ],
        as: 'publisherData',
      },
    },
    {
      $lookup: {
        from: 'comments',
        localField: 'comments',
        foreignField: '_id',
        pipeline: [
          { $limit: 10 },
          {
            $lookup: {
              from: 'users',
              localField: 'publisher',
              foreignField: 'userName',
              pipeline: [
                { $project: { userName: 1, firstName: 1, lastName: 1, imgURL: 1, _id: 0 } },
              ],
              as: 'commentPublisherData',
            },
          },
          { $project: { publisher: 0, _id: 0, __v: 0 } },
        ],
        as: 'initialComments',
      },
    },
    {
      $addFields: {
        userReact: {
          $arrayElemAt: [
            {
              $map: {
                input: {
                  $filter: {
                    input: '$reacts',
                    as: 'react',
                    cond: { $eq: ['$$react.publisher', viewerUserName || ''] },
                  },
                },
                as: 'react',
                in: '$$react.reactType',
              },
            },
            0,
          ],
        },
        reacts: {
          $reduce: {
            input: '$reacts',
            initialValue: [],
            in: {
              $cond: {
                if: { $in: ['$$this.reactType', '$$value.reactType'] },
                then: {
                  $map: {
                    input: '$$value',
                    as: 'el',
                    in: {
                      $cond: {
                        if: { $eq: ['$$el.reactType', '$$this.reactType'] },
                        then: {
                          reactType: '$$el.reactType',
                          count: { $add: ['$$el.count', 1] },
                        },
                        else: '$$el',
                      },
                    },
                  },
                },
                else: {
                  $concatArrays: [
                    '$$value',
                    [{ reactType: '$$this.reactType', count: 1 }],
                  ],
                },
              },
            },
          },
        },
      },
    },
    {
      $project: {
        labels: 0,
        comments: 0,
        __v: 0,
        reacts: 0,
        publisher: 0,
      },
    },
  ]
  
}

module.exports.getPosts = async (userName,viewerUserName,postID)=>{

  const posts = await Post.aggregate(postsPipeline(userName,viewerUserName,postID));
  return posts;
}


