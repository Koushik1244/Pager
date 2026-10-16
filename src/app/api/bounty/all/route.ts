//src\app\api\bounty\all\route.ts

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Bounty from "@/models/Bounty";

export async function GET() {
    try {
        await connectDB();

        const bounties = await Bounty.find()
            .sort({ createdAt: -1 })
            .limit(50);

        return NextResponse.json({ success: true, bounties });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
