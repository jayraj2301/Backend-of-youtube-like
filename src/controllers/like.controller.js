import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import ApiError from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/AsyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video is not valid")
    }

    const videoLike = await Like.findOne({
        video: videoId
    })

    let like, unlike;
    // check video is already liked or not
    if (videoLike) { // already liked
        
        unlike = await Like.deleteOne({
            video: videoId
        })

        if (!unlike) {
            throw new ApiError(500, "Something went wrong while unliked a video")
        }

    }else{

        like = await Like.create({
            video: videoId,
            likedBy: req.user._id
        })

        if (!like) {
            throw new ApiError(500, "Something went wrong while liked a video")
        }

    }

    return res.status(200)
                .json(new ApiResponse(200, {} , `Video ${like? "liked" : "unliked"} Successfully`))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Comment is not valid")
    }

    const commentLike = await Like.findOne({
        comment: commentId
    })

    let like, unlike;

    if (commentLike) { 
        
        unlike = await Like.deleteOne({
            comment: commentId
        })

        if (!unlike) {
            throw new ApiError(500, "Something went wrong while unliked a comment")
        }

    }else{

        like = await Like.create({
            comment: commentId,
            likedBy: req.user._id
        })

        if (!like) {
            throw new ApiError(500, "Something went wrong while liked a comment")
        }

    }

    return res.status(200)
                .json(new ApiResponse(200, {} , `comment ${like? "liked" : "unliked"} Successfully`))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Tweet is not valid")
    }

    const tweetLike = await Like.findOne({
        tweet: tweetId
    })

    let like, unlike;

    if (tweetLike) { 
        
        unlike = await Like.deleteOne({
            tweet: tweetId
        })

        if (!unlike) {
            throw new ApiError(500, "Something went wrong while unliked a tweet")
        }

    }else{

        like = await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        })

        if (!like) {
            throw new ApiError(500, "Something went wrong while liked a tweet")
        }

    }

    return res.status(200)
                .json(new ApiResponse(200, {} , `Tweet ${like? "liked" : "unliked"} Successfully`))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "This user id is not valid")
    }

    const likedVideos = await Like.aggregate([
        {
            $lookup: {
                from: videos,
                localField: "video",
                foreignField: "_id",
                as: "likedVideos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            videoOwner: {
                                $arrayElemAt: ["$owner",0] 
                            }
                        }
                    }
                ]
            }
        }
    ])

    if (!likedVideos) {
        throw new ApiError(500, "Can't aggregate to liked videos")
    }

    return res.status(200)
                .json(new ApiResponse(200, likedVideos[0].likedVideos, "fetched Liked videos successfully"))

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}