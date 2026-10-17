//src\app\api\user\set-username\route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { verifyWalletSignature, WalletSignatureError } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const body = await req.json();
        const { walletAddress, username } = body;

        if (!walletAddress || !username) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const actingAddress = verifyWalletSignature(body, "user/set-username", username);

        const existing = await User.findOne({ username });
        if (existing) {
            return NextResponse.json({ error: "Username already taken" }, { status: 400 });
        }

        const user = await User.findOneAndUpdate(
            { walletAddress: { $regex: `^${actingAddress}$`, $options: "i" } },
            { username },
            { new: true }
        );

        return NextResponse.json({ success: true, user });
    } catch (error) {
        if (error instanceof WalletSignatureError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
