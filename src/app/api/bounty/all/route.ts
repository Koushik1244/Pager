//src\app\api\bounty\all\route.ts

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Bounty from "@/models/Bounty";
import { getComputedBountyStatus } from "@/lib/bountyRules";

export async function GET() {
    try {
        await connectDB();

        const bounties = await Bounty.find()
            .sort({ createdAt: -1 })
            .limit(50);

        const responseBounties = bounties.map((bounty) => {
            const value = bounty.toObject();
            return { ...value, status: getComputedBountyStatus(value) };
        });

        return NextResponse.json({ success: true, bounties: responseBounties });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
