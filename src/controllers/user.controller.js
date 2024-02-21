import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res) => {
    
    // get user details from frontend
    const { fullName, email, username, password } = req.body
    console.log("Email : ", email);

    // validation - not empty
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // check if user already exists by matching username and email
    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with Email or Username already exists")
    }

    // check for images, check for avatar
    const avatarLocalPath =  req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    // uploading avatar and coverImage on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // check if avatar is uploaded or not on cloudinary
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    // create user object and create entry in DB
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // removing password & refreshToken field from response before giving response back to user
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // checking for user creation
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    } 

    // returning response to user
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
    )


})

export {registerUser}
