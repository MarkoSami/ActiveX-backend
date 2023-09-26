const Post = require('../models/Posts');
const mongoose = require('mongoose');

const getpostsPipeline = (query,viewerUserName,offset,limit)=>{

  limit = (!limit || limit>30) ? +30 : +limit; // validating the limit value
  offset = (!offset || offset <=0 )? 0 : +offset;  
  console.log(`===>${(!offset)?  0 :(offset-1)*limit}`);
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
    },
    {
      $skip: (!offset)?  0 :(offset-1)*limit
    },

    {
      $limit: limit
    }
  ]
  
}

module.exports.getPosts = async (query,viewerUserName,offset,limit)=>{

console.log(`querried post with querry : {${query} and requester: ${viewerUserName}}`);

  const posts = await Post.aggregate(getpostsPipeline(query,viewerUserName,offset,limit));
  return posts;
}

