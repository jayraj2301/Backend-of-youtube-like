import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import ApiError from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/AsyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {

    const channelStats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                likes: {$size: "$likes"}
            }
        },
        {
            $group: {
                _id: null,
                totalViews: {$sum: "$views"},
                totalVideos: {$sum: 1},
                totalLikes: {$sum: "$likes"}
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "owner",
                foreignField: "channel",
                as: "totalSubscribers"
            }
        },
        {
            $addFields: {
                totlSubscribers : {
                    $size: "$totalSubscribers"
                }
            }
        },
        {
            $project: {
                _id: 0,
                owner: 0
            }
        }
    ])

    if (!channelStats) {
        throw new ApiError(500, "Can't find channel status")
    }


    res.status(200)
       .json(new ApiResponse(200, channelStats, "Channel status fetched Successfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {

    const allVideo = await Video.find({
        owner: req.user._id
    })

    if (!allVideo) {
        throw new ApiError(500, "Something went wrong while fetching videos")
    }

    return res.status(200)
              .json(new ApiResponse(200, allVideo, "Your videos fetched Successfully"))
})

export {
    getChannelStats, 
    getChannelVideos
    }