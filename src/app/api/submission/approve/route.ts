//src\app\api\submission\approve\route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Bounty from "@/models/Bounty";
import User from "@/models/User";
import {
    EscrowTransactionVerificationError,
    verifyEscrowTransaction,
} from "@/lib/escrowVerification";
import { verifyWalletSignature, WalletSignatureError } from "@/lib/auth";
import { checkSubmissionActionRules } from "@/lib/bountyRules";

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const body = await req.json();
        const { submissionId, bountyId, walletAddress, txHash } = body;

        if (!submissionId || !bountyId || !walletAddress || !txHash) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const actingAddress = verifyWalletSignature(body, "submission/approve", submissionId);

        const user = await User.findOne({ walletAddress: { $regex: `^${actingAddress}$`, $options: "i" } }).select("_id");

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const bounty = await Bounty.findById(bountyId);
        const submission = await Submission.findOne({ _id: submissionId, bountyId });
        const alreadySynced =
            submission?.status === "approved" && submission.approvedTxHash === txHash;
        const allowSyncedReplay =
            Boolean(alreadySynced && bounty && ["open", "completed"].includes(bounty.status));
        const ruleError = checkSubmissionActionRules(
            bounty,
            submission,
            user._id,
            allowSyncedReplay
        );

        if (ruleError) {
            return NextResponse.json({ error: ruleError.message }, { status: ruleError.status });
        }

        const validBounty = bounty!;
        const validSubmission = submission!;

        if (!Number.isSafeInteger(validBounty.onChainId) || validBounty.onChainId < 1) {
            return NextResponse.json({ error: "Bounty has no valid on-chain ID" }, { status: 400 });
        }

        if (validSubmission.approvedTxHash && validSubmission.approvedTxHash !== txHash) {
            return NextResponse.json({ error: "Submission is already linked to a different approval transaction" }, { status: 409 });
        }

        const hashAlreadyUsed = await Submission.findOne({ approvedTxHash: txHash }).select("_id");
        if (hashAlreadyUsed && hashAlreadyUsed._id.toString() !== validSubmission._id.toString()) {
            return NextResponse.json({ error: "Approval transaction is already linked to another submission" }, { status: 409 });
        }

        await verifyEscrowTransaction({
            txHash,
            eventName: "BountyApproved",
            bountyId: validBounty.onChainId,
            expectedSender: actingAddress,
            expectedHunter: validSubmission.hunterWallet,
        });

        if (alreadySynced && validBounty.status === "completed") {
            return NextResponse.json({ success: true });
        }

        if (!alreadySynced) {
            validSubmission.status = "approved";
            validSubmission.approvedTxHash = txHash;
            await validSubmission.save();
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

        validBounty.status = "completed";
        await validBounty.save();

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof WalletSignatureError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        if (error instanceof EscrowTransactionVerificationError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error(error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
