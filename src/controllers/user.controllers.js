import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js";   //ye user hi h jo db se baat kr rha h
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
      

      user.refreshToken=refreshToken   //refresh token db m v save krana hota h aur user ko v dena hota h toh ye kr diya save db m
      user.save({ validateBeforeSave:false })  //save kra db k data aur save krne p db saare parameters ko check krne lgta h ki h ya ni toh validateBeforeSave ensure krega ki bs y data save kro thats it 

      return {accessToken,refreshToken}

   } catch (error) {
      throw new ApiError(500, "Something went wrong while generating tokens")
   }


}

const registerUser = asyncHandler(async (req, res) => {
   //get user details from frontend
   const { fullname, email, username, password } = req.body
   console.log(`email:${email}`)

   if ([fullname, username, email, password].some((field) => field?.trim() === "")) {  //shortform of multiple ifs...agr koi v field hogi empty them print this msg
      throw new ApiError(400, "All the fields are required")
   }
   const existedUser = await User.findOne({     //checks if any of the username or email already in the database under User schema 
      $or: [{ username }, { email }]
   })
   if (existedUser) throw new ApiError(409, "User with this email or username already exists")

   // console.log(req.files)


   const avatarLocalPath = req.files?.avatar[0]?.path;            //local path lene k liye via multer(upload)
   //  const coverImageLocalPath=req.files?.coverImage[0]?.path;   -->Not using this bcz agr coverImage ni diya toh db m error aega aur koi check v ni lgaya h


   let coverImageLocalPath;
   if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files.coverImage[0].path;
   }



   if (!avatarLocalPath) throw new ApiError(410, "Avtar is required");
   const avatar = await uploadFileonCloud(avatarLocalPath)               //file cloudinary m save krne k liye
   const coverImage = await uploadFileonCloud(coverImageLocalPath)

   if (!avatar) throw new ApiError(410, "Avtar is required");   //check kr lo hui h save or not

   const user = await User.create({    //ye sb data as object db m jaega
      fullname,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase()
   })
   const createUser = await User.findById(user._id).select("-password -refreshToken")  //will save all the data except the ones inside the select filed i.e password and refresh tokens

   // "new ApiError" or "new ApiResponse" object create kr rha h aur uske ander parameters pass kr de rhe 

   if (!createUser) throw new ApiError(500, "Something went wrong while registering the user") //agr user create ni hua h then error

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

   //if password is correct we'll generate accessTokens and refreshToken for which we will make a function so that it could be used whenever required
   //genrating tokens by calling function

   const {accessToken,refreshToken}=await GenerateAccessAndRefreshToken(user._id)  //db se userid lene k liye ._id krte h

   console.log(accessToken,refreshToken)
   

   const loggedInUser=await User.findById(user._id).select("-password -refreshTokens")  // mann ho tih gya variable bna lo db se baat krne ko else pehle k "user" vale ko hi use kr lo
   
   const options={
      httpOnly:true,
      secure:true
   }
   //sb jb ho jae successfull tb cookies set kro aur response send kr do
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

   User.findByIdAndUpdate(req.user._id,            //using Id and Update taki set kr de issi m 
      
      {
         $set:{ refreshTokens:undefined}   //to set/clear refresh Tokens
      },
      {
         new:true
      }
   )

   const options={
      httpOnly:true,
      secure:false
   }

   return res.status(200).clearCookie("accessToken",options)    //clearing cookies
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
