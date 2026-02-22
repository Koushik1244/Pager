import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Submission from "@/models/Submission";
import User from "@/models/User";

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const { walletAddress, bountyId, description, mediaUrl } =
            await req.json();

        if (!walletAddress || !bountyId || !mediaUrl) {
            return NextResponse.json(
                { error: "Missing fields" },
                { status: 400 }
            );
        }

        const user = await User.findOne({ walletAddress });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const submission = await Submission.create({
            bountyId,
            hunter: user._id,
            username: user.username,
            description,
            mediaUrl,
            hunterWallet: walletAddress,
        });

        return NextResponse.json({ success: true, submission });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
