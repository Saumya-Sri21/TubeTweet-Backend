import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js";  
import { uploadFileonCloud } from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

//function to generate refresh and access tokens
const GenerateAccessAndRefreshToken = async (userId) => {

   try {

      const user = await User.findById(userId)
      const accessToken = user.GenerateAccessToken()
      const refreshToken = user.GenerateRefreshToken()

      console.log("accessToken: ",accessToken)
      console.log("refreshToken:",refreshToken)
      

      user.refreshToken=refreshToken   
      user.save({ validateBeforeSave:false })  

      return {accessToken,refreshToken}

   } catch (error) {
      throw new ApiError(500, "Something went wrong while generating tokens")
   }


}

const registerUser = asyncHandler(async (req, res) => {
   //get user details from frontend
   const { fullname, email, username, password } = req.body
   console.log(`email:${email}`)

   if ([fullname, username, email, password].some((field) => field?.trim() === "")) {  
      throw new ApiError(400, "All the fields are required")
   }
   const existedUser = await User.findOne({     
      $or: [{ username }, { email }]
   })
   if (existedUser) throw new ApiError(409, "User with this email or username already exists")

   // console.log(req.files)


   const avatarLocalPath = req.files?.avatar[0]?.path;            


   let coverImageLocalPath;
   if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files.coverImage[0].path;
   }



   if (!avatarLocalPath) throw new ApiError(410, "Avtar is required");
   const avatar = await uploadFileonCloud(avatarLocalPath)               
   const coverImage = await uploadFileonCloud(coverImageLocalPath)

   if (!avatar) throw new ApiError(410, "Avtar is required");   

   const user = await User.create({    
      fullname,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase()
   })
   const createUser = await User.findById(user._id).select("-password -refreshToken")   

   if (!createUser) throw new ApiError(500, "Something went wrong while registering the user") 

   return res.status(201).json(
      new ApiResponse(200, createUser, "User registered successfully")
   )


})

const loginUser = asyncHandler(async (req, res) => {

   const { email, username, password } = req.body

   if (!(username || email)) {
      throw new ApiError(400, "Username or email is required")
   }

   const user = await User.findOne({ $or: [{ username }, { email }] })

   if (!user) {
      throw new ApiError(404, "User not found")
   }

   const isPasswordValid = user.isPasswordCorrect(password)

   if (!isPasswordValid) {
      throw new ApiError(401, "Incorrect Password")
   }


   const {accessToken,refreshToken}=await GenerateAccessAndRefreshToken(user._id)  

   console.log(accessToken,refreshToken)
   

   const loggedInUser=await User.findById(user._id).select("-password -refreshTokens")  
   
   const options={
      httpOnly:true,
      secure:true
   }
   
   return res.status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json(
      new ApiResponse(
         200,
      {
         user:loggedInUser,accessToken,refreshToken
      },
      "User Logged In Successfully")

   )

})

const logOutUser=asyncHandler(async(req,res)=>{

   User.findByIdAndUpdate(req.user._id,            
      
      {
         $set:{ refreshTokens:undefined}   
      },
      {
         new:true
      }
   )

   const options={
      httpOnly:true,
      secure:false
   }

   return res.status(200).clearCookie("accessToken",options)    
   .clearCookie("refreshToken",options)
   .json(
      new ApiResponse(
         200,
         {},
         "User Logged Out Successfully"
      )
   )

})

const refreshAccessToken=asyncHandler(async(req,res)=>{

   const incomingRefreshToken=req.cookie.refreshToken || req.header.refreshToken

   if(!incomingRefreshToken){
      throw new ApiError(401,"Unauthorized Request")
   }

   const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

   const user=await User.findById(decodedToken?._id)

   if(!user){
      throw new ApiError(401,"Invalid Token")
   }

   if(incomingRefreshToken!==user?.refreshTokens){
      throw new ApiError(401,"Refresh Token is used or expired")
   }

   const options={
      httpOnly:true,
      secure:true
   }

   const {accessToken,newRefreshToken} =GenerateAccessAndRefreshToken(user._id)

   return res.status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",newRefreshToken,options)
   .json(
      new ApiResponse(
         200,
         {accessToken,refreshToken:newRefreshToken},
         "Access Token Refreshed"
      )
   )
})

export { registerUser, loginUser,logOutUser,refreshAccessToken }
