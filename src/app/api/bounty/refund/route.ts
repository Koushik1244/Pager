import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Bounty from "@/models/Bounty";
import User from "@/models/User";
import {
    EscrowTransactionVerificationError,
    verifyEscrowTransaction,
} from "@/lib/escrowVerification";
import { verifyWalletSignature, WalletSignatureError } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const body = await req.json();
        const { bountyId, walletAddress, txHash } = body;

        if (!bountyId || !walletAddress || !txHash) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const actingAddress = verifyWalletSignature(body, "bounty/refund", bountyId);

        const user = await User.findOne({ walletAddress: { $regex: `^${actingAddress}$`, $options: "i" } }).select("_id");
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const bounty = await Bounty.findOne({
            _id: bountyId,
            creator: user._id,
        });

        if (!bounty) {
            return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
        }

        if (!Number.isSafeInteger(bounty.onChainId) || bounty.onChainId < 1) {
            return NextResponse.json({ error: "Bounty has no valid on-chain ID" }, { status: 400 });
        }

        const alreadySynced =
            bounty.status === "refunded" && bounty.refundTxHash === txHash;

        if (bounty.refundTxHash && bounty.refundTxHash !== txHash) {
            return NextResponse.json({ error: "Bounty is already linked to a different refund transaction" }, { status: 409 });
        }

        if (bounty.status !== "open" && !alreadySynced) {
            return NextResponse.json({ error: "Bounty is not refundable" }, { status: 409 });
        }

        const hashAlreadyUsed = await Bounty.findOne({ refundTxHash: txHash }).select("_id");
        if (hashAlreadyUsed && hashAlreadyUsed._id.toString() !== bounty._id.toString()) {
            return NextResponse.json({ error: "Refund transaction is already linked to another bounty" }, { status: 409 });
        }

        await verifyEscrowTransaction({
            txHash,
            eventName: "BountyRefunded",
            bountyId: bounty.onChainId,
            expectedSender: actingAddress,
        });

        if (alreadySynced) {
            return NextResponse.json({ success: true, bounty });
        }

        bounty.status = "refunded";
        bounty.refundTxHash = txHash;
        await bounty.save();

        return NextResponse.json({ success: true, bounty });
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
