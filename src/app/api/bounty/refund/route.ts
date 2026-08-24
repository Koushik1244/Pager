import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Bounty from "@/models/Bounty";
import User from "@/models/User";

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const { bountyId, walletAddress } = await req.json();

        if (!bountyId || !walletAddress) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const user = await User.findOne({ walletAddress }).select("_id");
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const bounty = await Bounty.findOne({
            _id: bountyId,
            creator: user._id,
            status: "open",
        });

        if (!bounty) {
            return NextResponse.json({ error: "Bounty not found or not refundable" }, { status: 404 });
        }

        if (bounty.deadline.getTime() >= Date.now()) {
            return NextResponse.json({ error: "Bounty has not expired" }, { status: 400 });
        }

        bounty.status = "refunded";
        await bounty.save();

        return NextResponse.json({ success: true, bounty });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}