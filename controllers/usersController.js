const { User } = require('../models/User');
const mongoose = require('mongoose');

// const usersMatchQuery = (querry) => {
//     return (querry) ? querry : {};
// };

const getUsersPipeline = (query,vierwerUserName) => {
    return [
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
                       
                        $or: [
                            {
                                $in: [vierwerUserName, "$friendRequests"]
                            },
                            {
                                $in: ['$userName', '$viewerData.friendRequests']
                            }
                        ]
                    },
                    then: "requested",
                    else: "none"
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
          $limit: 50
        }
      ]
      ;
};

const getUsers = async (querry,vierwerUserName) => {
    const users = await User.aggregate(getUsersPipeline(querry,vierwerUserName));
    return users; // You were missing this return statement
};

module.exports = {
    getUsers
};
