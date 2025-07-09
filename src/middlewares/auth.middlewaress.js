import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT=asyncHandler(async(req,res,next)=>{

    try {

        const tokens=req.cookies?.accessToken || req.header("Authorization").replace("Bearer ","")

        if(!tokens){
            throw new ApiError(401,"Token not found")
        }

        const decodedToken=jwt.verify(tokens,process.env.ACCESS_TOKEN_SECRET)

        const user=await User.findById(decodedToken?._id).select("-password -refreshTokens")

        if(!user){
            throw new ApiError(401,"Invalid Tokens")
        }

        req.user=user;
        next()
        
    } catch (error) {
        
        throw new ApiError(401,error?.message || "Invalid Tokens")
    }

})