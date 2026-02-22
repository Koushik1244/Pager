import mongoose, { Schema, models, model } from "mongoose";

const UserSchema = new Schema(
    {
        walletAddress: {
            type: String,
            required: true,
            unique: true,
        },
        username: {
            type: String,
            unique: true,
            sparse: true,
        },
        profilePic: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

const User = models.User || model("User", UserSchema);

export default User;
