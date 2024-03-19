import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = "^/video/",
    sortBy = "createdAt",
    sortType = 1,
    userId = req.user._id,
  } = req.query;

  // const sortOrder = sortType.toLowerCase() === "asc" ? 1 : -1;

  const videoAggregate = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user._id),
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      },
    },
    {
      $sort: { [sortBy]: sortType },
    },
    {
      $limit: parseInt(limit),
    },
    {
      $skip: (page - 1) * limit,
    },
  ]);

  await Video.aggregatePaginate(videoAggregate, { page, limit })
    .then((result) => {
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Videos fetched successfully"));
    })
    .catch((error) => {
      throw new ApiError(400, error?.message || "Can't fetched videos");
    });
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title && !description) {
    throw new ApiError(401, "Title and Description are required");
  }

  const videoPath = req.files?.videoFile?.[0].path;
  const thumbNail = req.files?.thumbnail?.[0].path;

  if (!videoPath) {
    throw new ApiError(400, "Video file is missing");
  }

  const videoFile = await uploadOnCloudinary(videoPath);
  const thumbnailFile = await uploadOnCloudinary(thumbNail);

  if (!videoFile) {
    throw new ApiError(500, "something went wrong while uploading video file on cloudinary")
  }

  // console.log(videoFile?.url +"\n"+thumbnailFile?.url);
  const uploadedVideo = await Video.create({
    videoFile: videoFile?.url,
    thumbnail: thumbnailFile?.url,
    owner: req.user._id,
    title,
    description,
    isPublished: true,
    duration: videoFile.duration,
  });

  if (!uploadedVideo) {
    throw new ApiError(500, "Something went wrong when upload a video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, uploadedVideo, "Video published Successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched Successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  const thumbnailFilePath = req.file?.path;

  if (
    !(
      thumbnailFilePath ||
      !(!title || title?.trim() === "") ||
      !(!description || description?.trim() === "")
    )
  ) {
    throw new ApiError(400, "update fields are required");
  }

  const video = await Video.findOne({_id: videoId})

  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  let thumbNail
  if (thumbnailFilePath) {
    thumbNail = await uploadOnCloudinary(thumbnailFilePath)

    if(!thumbNail){
      throw new ApiError(500, "something went wrong while updating thumbnail on cloudinary !!")
    }
  }
  
  const uploadVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set:{
        title,
        description,
        thumbnail: thumbNail.url
      }
    },
    {
      new:true
    }
  )

  if (!uploadVideo) {
    throw new ApiError(500, "something went wrong while updating video on cloudinary !!")
  }

  return res.status(200)
              .json(new ApiResponse(200, uploadVideo, "Video updated Successfully"))

});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  const video = await Video.findById(videoId)

  if (!video) {
    throw new ApiError(400,"Video not found")
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403,"You don't have permission to delete")
  }

  // here we delete a video and thumbnail in cloudinary : TODO

  const deleteVideo = await Video.findByIdAndDelete(videoId)

  if (!deleteVideo) {
    throw new ApiError(500, "Something went wrong to delete a video")
  }

  return res.status(200)
              .json(200,deleteVideo, "Video deleted Successfully")

})

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  const video = await Video.findById(videoId)

  if (!video) {
    throw new ApiError(400,"Video not found")
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403,"You don't have permission to toggle")
  }

  video.isPublished = !video.isPublished

  await video.save({validateBeforeSave: false})

  return res.status(200)
            .json(new ApiResponse(200,"Toggle Publish"))

})

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus
}