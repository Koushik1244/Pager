import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const { walletAddress } = await req.json();

        if (!walletAddress) {
            return NextResponse.json({ error: "Wallet required" }, { status: 400 });
        }

        let user = await User.findOne({ walletAddress });

        // If user doesn't exist → create
        if (!user) {
            user = await User.create({ walletAddress });
        }

        return NextResponse.json({
            success: true,
            user,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
