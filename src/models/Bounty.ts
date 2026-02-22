import mongoose, { Schema, models, model } from "mongoose";

const BountySchema = new Schema(
    {
        creator: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        username: {
            type: String,
            required: true,
        },

        description: {
            type: String,
            required: true,
        },

        reward: {
            type: Number,
            required: true,
        },

        location: {
            lat: Number,
            lng: Number,
            address: String,
        },

        mediaUrl: {
            type: String,
            default: "",
        },

        status: {
            type: String,
            default: "open", // open | completed
        },
        onChainId: {
            type: Number,
            default: null,
        },
    },
    { timestamps: true }
);

const Bounty = models.Bounty || model("Bounty", BountySchema);

export default Bounty;
