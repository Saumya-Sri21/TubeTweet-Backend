import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema= new mongoose.Schema({

    videoFile:{
        type:String ,         //cloudinary url
        required:[true, "Upload The Video File"]
    },
    thumbnail:{
        type:String,
        required:true
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
        index:true
    },
    title:{
        type:String,
        required:true,
        index:true
    },
    description:{
        type:String,
        required:true
    },
    duration:{
        type:Number
    },
    views:{
        type:Number,
        default:0
    },
    isPublished:{
        type:Boolean,
        default:false
    },

},{timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate)            //to write quries
                                                       //plugin is a middleware

export const Video=mongoose.model('Video',videoSchema)