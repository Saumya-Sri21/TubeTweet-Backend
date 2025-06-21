import { asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.models.js";   //ye user hi h jo db se baat kr rha h
import {uploadFileonCloud} from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser=asyncHandler(async(req,res)=>{
   //get user details from frontend
   const {fullname,email,username,password}=req.body
   console.log(`email:${email}`)

   if([fullname,username,email,password].some((field)=>field?.trim()==="")){  //shortform of multiple ifs...agr koi v field hogi empty them print this msg
    throw new ApiError(400, "All the fields are required")
   }
   const existedUser=User.findOne({     //checks if any of the username or email already in the database under User schema 
    $or:[{username},{email}]
   })
   if(existedUser) throw new ApiError(409,"User with this email or username already exists")

    const avtarLocalPath=req.files?.avatar[0]?.path;            //local path lene k liye via multer(upload)
    const coverImageLocalPath=req.files?.coverImage[0]?.path;

    if(!avtarLocalPath) throw new ApiError(410, "Avtar is required");
    const avatar =await uploadFileonCloud(avtarLocalPath)               //file cloudinary m save krne k liye
    const coverImage=await uploadFileonCloud(coverImageLocalPath)

    if(!avatar) throw new ApiError(410, "Avtar is required");   //check kr lo hui h save or not

    const user=await User.create({    //ye sb data as object db m jaega
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })
     const createUser=await User.findById(user._id).select( "-password -refreshToken")  //will save all the data except the ones inside the slecet filef i.e password and refresh tokens

     // "new ApiError" or "new ApiResponse" object create kr rha h aur uske ander parameters pass kr de rhe h

     if(!createUser) throw new ApiError(500, "Something went wrong while registering the user") //agr user create ni hua h then error

     return res.status(200).json(
        new ApiResponse(200,createUser,"User registered successfully")
     )

   
})

export {registerUser,}
