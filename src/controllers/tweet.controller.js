import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import ApiError from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/AsyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body

    if (!content && (content.trim()==="")) {
        throw new ApiError(400, "Content is required in tweet")
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    })

    if (!tweet) {
        throw new ApiError(500, "Something went wrong in creating tweet")
    }

    return res.status(200)
              .json(new ApiResponse(200, tweet, "Tweet created Successfully"))

})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "User is not valid")
    }

    const user = await User.findById(userId)

    if (!user) {
        throw new ApiError(400, "User not found")
    }

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: user._id
            }
        }
    ])

    if(!tweets){
        throw new ApiError(500, "Something went wrong while fetching tweets")
    }

    return res.status(200)
              .json(new ApiResponse(200, tweets, "Tweets fetched Successfully"))

})

const updateTweet = asyncHandler(async (req, res) => {
    const {content} = req.body
    const {tweetId} = req.params

    if (!content && (content.trim()==="")) {
        throw new ApiError(400, "Content is required in tweet to update")
    }

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Tweet is not valid")
    }
    
    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(400, "Tweet is not found")
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to update this tweet")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content
            }
        },
        {new: true}
    )

    if (!updatedTweet) {
        throw new ApiError(500, "Something went wrong while updating tweet")
    }

    return res.status(200)
                .json(new ApiResponse(200, updatedTweet, "Tweet updated Successfully"))

})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Tweet is not valid")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(400, "Tweet is not found")
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to update this tweet")
    }

    const deletedTweet = await Tweet.deleteOne(tweet._id)

    if (!deletedTweet) {
        throw new ApiError(500, "Something went wrong while updating tweet")
    }

    return res.status(200)
                .json(new ApiResponse(200, deletedTweet, "Tweet is deleted Successfully"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}