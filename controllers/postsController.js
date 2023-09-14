const Post = require('../models/Posts');
const mongoose = require('mongoose');

const getpostsPipeline = (query,viewerUserName)=>{
  return [
    {
      $match: (query)? query : {}
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
        }
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
    {
      $sort: {
        "publishDate": -1
      }
    }
  ]
  
}

module.exports.getPosts = async (query,viewerUserName)=>{

  const posts = await Post.aggregate(getpostsPipeline(query,viewerUserName));
  return posts;
}

