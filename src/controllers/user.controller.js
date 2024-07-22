import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from "../utils/ApiError.js";
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import fs from "fs"

const registerUser = asyncHandler(async (req,res) => {
    // get all data from user
    // validate all data like not empty
    // check if the user already exists: userName, email
    // check for images, check for avatar
    // upload the file to cloudinary
    // create user object - create data in db
    // remove password and refres token from response
    // check for user creation response
    // return response

    const { userName, email, fullName, password } = req.body;
    // console.log("🚀 ~ registerUser ~ email:", email)

    if([userName, email, fullName, password].some(field => field?.trim() === "")){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ userName }, { email }]
    })
    if(existedUser){
        fs.unlinkSync()
        throw new ApiError(409, "User with userName or email already exists");
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Avatar file is required");
    }
    const user = await User.create({
        userName,
        email,
        fullName,
        avatar: avatar.url,
        coverImage : coverImage?.url || "",
        password

    });
    const createdUser = await User.findById(user?._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user !");
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered successfully")
    )
    
})

export { registerUser };