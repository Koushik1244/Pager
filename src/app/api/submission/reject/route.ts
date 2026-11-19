//src\app\api\submission\reject\route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Bounty from "@/models/Bounty";
import User from "@/models/User";
import { verifyWalletSignature, WalletSignatureError } from "@/lib/auth";
import { checkSubmissionActionRules } from "@/lib/bountyRules";

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const body = await req.json();
        const { submissionId, bountyId, walletAddress } = body;

        if (!submissionId || !bountyId || !walletAddress) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const actingAddress = verifyWalletSignature(body, "submission/reject", submissionId);

        const user = await User.findOne({ walletAddress: { $regex: `^${actingAddress}$`, $options: "i" } }).select("_id");
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const [bounty, existingSubmission] = await Promise.all([
            Bounty.findById(bountyId),
            Submission.findOne({ _id: submissionId, bountyId }),
        ]);
        const ruleError = checkSubmissionActionRules(bounty, existingSubmission, user._id);

        if (ruleError) {
            return NextResponse.json({ error: ruleError.message }, { status: ruleError.status });
        }

        const submission = await Submission.findOneAndUpdate({
            _id: submissionId,
            bountyId,
            status: "pending",
        }, {
            status: "rejected",
        }, { new: true });

        if (!submission) {
            return NextResponse.json({ error: "Pending submission not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof WalletSignatureError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error(error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
