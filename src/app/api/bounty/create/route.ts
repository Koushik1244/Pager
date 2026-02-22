//src\app\api\bounty\create\route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Bounty from "@/models/Bounty";
import User from "@/models/User";

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const { walletAddress, description, reward, lat, lng, address, mediaUrl, onChainId } =
            await req.json();

        if (!walletAddress || !description || !reward) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const user = await User.findOne({ walletAddress });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const bounty = await Bounty.create({
            creator: user._id,
            username: user.username,
            description,
            reward,
            location: { lat, lng, address },
            mediaUrl,
            onChainId,
        });

        return NextResponse.json({ success: true, bounty });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
