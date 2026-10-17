//src\app\api\bounty\create\route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Bounty from "@/models/Bounty";
import User from "@/models/User";
import { verifyWalletSignature, WalletSignatureError } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const body = await req.json();
        const { walletAddress, description, reward, lat, lng, address, mediaUrl, onChainId, deadline } = body;

        if (!walletAddress || !description || !reward || !deadline || !onChainId) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const actingAddress = verifyWalletSignature(body, "bounty/create", onChainId);

        const deadlineDate = new Date(Number(deadline) * 1000);

        if (Number.isNaN(deadlineDate.getTime())) {
            return NextResponse.json({ error: "Invalid deadline" }, { status: 400 });
        }

        const user = await User.findOne({ walletAddress: { $regex: `^${actingAddress}$`, $options: "i" } });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const bounty = await Bounty.create({
            creator: user._id,
            username: user.username,
            description,
            reward,
            deadline: deadlineDate,
            location: { lat, lng, address },
            mediaUrl,
            onChainId,
        });

        return NextResponse.json({ success: true, bounty });
    } catch (error) {
        if (error instanceof WalletSignatureError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error(error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
