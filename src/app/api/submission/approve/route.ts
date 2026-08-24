//src\app\api\submission\approve\route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Bounty from "@/models/Bounty";
import User from "@/models/User";

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const { submissionId, bountyId, walletAddress } = await req.json();

        if (!submissionId || !bountyId || !walletAddress) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const user = await User.findOne({ walletAddress }).select("_id");
        const bounty = await Bounty.findOne({ _id: bountyId, creator: user?._id, status: "open" });

        if (!user || !bounty) {
            return NextResponse.json({ error: "Unauthorized or inactive bounty" }, { status: 403 });
        }

        // Approve submission
        const submission = await Submission.findOneAndUpdate({
            _id: submissionId,
            bountyId,
            status: "pending",
        }, {
            status: "approved",
        }, { new: true });

        if (!submission) {
            return NextResponse.json({ error: "Pending submission not found" }, { status: 404 });
        }

        await Submission.updateMany(
            {
                bountyId,
                status: "pending",
                _id: { $ne: submissionId },
            },
            {
                status: "rejected",
            }
        );

        // Mark bounty completed
        await Bounty.findByIdAndUpdate(bountyId, {
            status: "completed",
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
