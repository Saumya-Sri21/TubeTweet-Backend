import mongoose from "mongoose";
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken";

const userSchema= new mongoose.Schema({

    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true       
    },
    email:{
        type:String,
        required:true,
        lowercase:true,
        unique:true,
        trim:true
    },
    fullname:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avtar:{
        type:String,     
        unique:true,
        required:true
    },
    coverImage:{
        type:String
    },
    password:{
        type:String,
        required:[true, "Password is required"]
    },
    watchHistory:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'Video'
        }
    ],
    refreshTokens:{
        type:String
    }

},{timestamps:true})

userSchema.pre("save",async function(next){

    if(this.isModified("password")) return next();

    this.password= await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect= async function(password) {

    return await bcrypt.compare(password,this.password)
}

//to generate Access Tokens
userSchema.methods.GenerateAccessToken= async function(){

    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            user:this.username,
            fullname:this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )}

    //to generate Refresh Tokens
    userSchema.methods.GenerateRefreshToken = function(){

        jwt.sign(
           {
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
        )}

export const User=mongoose.model('User',userSchema)
