import mongoose from 'mongoose';
import mongooseAggregatePagination from 'mongoose-aggregate-paginate-v2';

const commentSchema = new mongoose.Schema({
    content:{
        type: String,
        required: true
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
},{timestamps:true})

commentSchema.plugin(mongooseAggregatePagination)
export const Comment = mongoose.model("Comment", commentSchema)