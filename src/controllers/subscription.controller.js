import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import ApiError from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/AsyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Channel not found")
    }

    const user = await User.findById(channelId)

    if (!user) {
        throw new ApiError(400, "Channel not found")
    }

    let subscribe, unsubscribe

    const itHasSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    })

    if (itHasSubscription) {
        unsubscribe = await Subscription.findOne({
            subscriber: req.user._id,
            channel: channelId
        })

        if (!unsubscribe) {
            throw new ApiError(500, "Something went wrong at unsubscribe")
        }

        return res.status(200)
                    .json(new ApiResponse(200, subscribe, "Channel subscribed Successfully"))

    }else{
        subscribe = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        })

        if (!subscribe) {
            throw new ApiError(500, "Something went wrong at subscribe")
        }

        return res.status(200)
                    .json(new ApiResponse(200, subscribe, "Channel subscribed Successfully"))
    }

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {subscriberId} = req.params

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Channel not valid")
    }

    const subscriptions = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers"
            }
        },
        {
            $project: {
                subscribers: {
                    username: 1,
                    fullName: 1,
                    avatar: 1
                }
            }
        }
    ])

    return res.status(200)
                .json(new ApiResponse(200, subscriptions[0], "Subscribers fetched Successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Subscriber not valid")
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannel"
            }
        },
        {
            $project: {
                subscribedChannel: {
                    username: 1,
                    avatar: 1
                }
            }
        }
    ])

    return res.status(200)
                .json(new ApiResponse(200, subscribedChannels[0], "Subscribers fetched Successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}