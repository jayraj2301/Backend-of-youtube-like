import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import ApiError from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from '../utils/AsyncHandler.js';
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if (!name || !description) {
        throw new ApiError(400, "All fields are required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    })

    if (!playlist) {
        throw new ApiError(500, "Something went wrong when create a Playlist")
    }

    return res.status(200)
                .json(new ApiResponse(200,playlist,"Playlist created Successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(400,"This user is not valid")
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(400,"User not found")
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $addFields:{
                playlist: {
                    $first: "$videos"
                }
            }
        }
    ])

    if (!playlists) {
        throw new ApiError(500, "Something went wrong while fetching Playlists")
    }

    return res.status(200)
                .json(new ApiResponse(200, playlists,"Playlists fetched Successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400,"This playlist is not valid")
    }

    const findPlaylist = await Playlist.findById(playlistId)

    if (!findPlaylist) {
        throw new ApiError(400, "Playlist not found")
    }

    return res.status(200)
                .json(new ApiResponse(200, findPlaylist, "Playlist fetch Successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400,"This playlist is not valid")
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400,"This video is not valid")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(400, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to add video in playlist")
    }

    const video = await Video.findById(videoId)
    
    if (!video) {
        throw new ApiError(401, "Video not found")
    }

    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video already exist in playlist")
    }

    const addInPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: {
                videos: videoId
            }
        },
        {
            new: true
        }
    )

    if (!addInPlaylist) {
        throw new ApiError(400, "Something went wrong while add video in Playlist")
    }

    return res.status(200)
                .json(new ApiResponse(200, addInPlaylist, "Video add in playlist Successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400,"This playlist is not valid")
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400,"This video is not valid")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(400, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to remove video in playlist")
    }

    const video = await Video.findById(videoId)
    
    if (!video) {
        throw new ApiError(401, "Video not found")
    }

    const removeInPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId
            }
        },
        {
            new: true
        }
    )

    if (!removeInPlaylist) {
        throw new ApiError(400, "Something went wrong while remove video in Playlist")
    }

    return res.status(200)
                .json(new ApiResponse(200, removeInPlaylist, "Video removed in playlist Successfully"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400,"This playlist is not valid")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(400, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to delete playlist")
    }

    const delPlaylist = await Playlist.deleteOne({
        _id: playlistId
    })

    if (!delPlaylist) {
        throw new ApiError(400, "Something went wrong to delete a Playlist")
    }

    return res.status(200)
                .json(new ApiResponse(200, delPlaylist, "Playlist deleted Successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400,"This playlist is not valid")
    }

    if (!((!name || name?.trim() === "") || (!description || description?.trim() === ""))) {
        throw new ApiError(400, "Either name or description is required");
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(400, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to delete playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set:{
                name,
                description
            }
        },
        {new:true}
    )

    if (!updatePlaylist) {
        throw new ApiError(400, "Something went wrong at update playlist")
    }

    return res.status(200)
                .json(new ApiResponse(200, updatePlaylist, "Playlist updated Successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}