import mongoose,{isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
import ApiError from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/AsyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video not valid")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(400, "Video not found")
    }

    const aggregateComments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        }
    ])

    const comments = await Comment.aggregatePaginate(
        aggregateComments,
        {
            page,
            limit
        }
    )

    if (!comments) {
        throw new ApiError(400, "Something went wrong while getting comments")
    }

    return res.status(200)
                .json(new ApiResponse(200, comments, "Comment fetched Successfully"))
})

const addComment = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {content} = req.body

    if (!content || (content.trim() === "")) {
        throw new ApiError(400, "Comment are required")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "This video id is not valid")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })

    if (!comment) {
        throw new ApiError(500, "Something went wrong while add a comment")
    }

    return res.status(200)
                .json(new ApiResponse(200,comment, "Comment added Successfully"))

})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const {content} = req.body

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Comment not exist")
    }
    if (!content || (content.trim() === "")) {
        throw new ApiError(400, "Content are require to update")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You have not permissin to change comment")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content
            }
        },
        {new:true}
    )

    if (!updatedComment) {
        throw new ApiError(500, "Something went wrong while updating Comment")
    }

    return res.status(200)
                .json(new ApiResponse(200, updatedComment, "Comment updated Successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Comment not exist")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You have not permissin to delete comment")
    }

    const deletedComment = await Comment.deleteOne(comment._id)

    if(!deletedComment){
        throw new ApiError(500, "something went wrong while deleting comment")
    }

    return res.status(200)
                .json(new ApiResponse(200, deletedComment, "Comment deleted Successfully"))

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }