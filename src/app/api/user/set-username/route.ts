//src\app\api\user\set-username\route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const { walletAddress, username } = await req.json();

        if (!walletAddress || !username) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const existing = await User.findOne({ username });
        if (existing) {
            return NextResponse.json({ error: "Username already taken" }, { status: 400 });
        }

        const user = await User.findOneAndUpdate(
            { walletAddress },
            { username },
            { new: true }
        );

        return NextResponse.json({ success: true, user });
    } catch (error) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
