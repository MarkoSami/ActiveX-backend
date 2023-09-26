const { User } = require('../models/User');
const mongoose = require('mongoose');

// const usersMatchQuery = (querry) => {
//     return (querry) ? querry : {};
// };

const getUsersPipeline = (query,vierwerUserName,offset ,limit ) => {
  
  limit = (!limit || limit>30) ? +30 : +limit; // validating the limit value
  offset = (!offset || offset <=0 )? 0 : +offset; 
  return [
      {
        $skip: (!offset)?  0 :(offset-1)*limit
      },
      {
        $match: (query) ? query : {}
      },
      {
          $addFields: {
            viewerData: {
              $literal: vierwerUserName || '', // Use $literal to set the vieweruserName as a constant value
            },
          },
      },
      {
          $lookup: {
            from: 'users',
            localField: 'viewerData',
            foreignField: 'userName',
            pipeline: [
              { $project: {_id: 0,friendRequests: 1} },
              {$limit: 1}
            ],
            as: 'viewerData',
          },
      },
      {
          $addFields: {
              viewerData: {
                  $cond: {
                      if: { $gt: [{ $size: '$viewerData' }, 0] },
                      then: { $arrayElemAt: ['$viewerData', 0] },
                      else: [] // or specify a default value if 'viewerData' is empty
                  }
              }
          }
      },
      {
        $addFields: {
          friendshipStatus: {
            $cond: {
              if: {
                $in: [vierwerUserName || '', "$friends"]
              },
              then: "friend",
              else: {
                $cond: {
                  if: {
                      $in: [vierwerUserName, "$friendRequests"]
                  },
                  then: "requested",
                  else:{
                      $cond: {
                          if:{
                              $in: ['$userName', '$viewerData.friendRequests']
                          },
                          then: "notConfirmed",
                          else: "none"
                      }
                  }
                }
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          firstName: 1,
          lastName: 1,
          userDescription: 1,
          userName: 1,
          imgURL: 1,
          coverURL: 1,
          friendshipStatus: 1 
        }
      },
      {
        $limit: limit? limit : +30
      }
    ]
      ;
};

const getUsers = async (querry,vierwerUserName,offset,limit) => {
    const users = await User.aggregate(getUsersPipeline(querry,vierwerUserName,offset,limit));
    return users; // You were missing this return statement
};

module.exports = {
    getUsers,
    getUsersPipeline
};
