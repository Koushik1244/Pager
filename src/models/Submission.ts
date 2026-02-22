import mongoose, { Schema, models, model } from "mongoose";

const SubmissionSchema = new Schema(
    {
        bountyId: {
            type: Schema.Types.ObjectId,
            ref: "Bounty",
            required: true,
        },

        hunter: {
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
            default: "",
        },

        mediaUrl: {
            type: String,
            required: true,
        },

        status: {
            type: String,
            default: "pending", // pending | approved | rejected
        },

        hunterWallet: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const Submission =
    models.Submission || model("Submission", SubmissionSchema);

export default Submission;
