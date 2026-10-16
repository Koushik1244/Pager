//src\app\api\submission\by-bounty\[bountyId]\route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Submission from "@/models/Submission";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ bountyId: string }> }
) {
    try {
        await connectDB();

        // FIX: await params
        const { bountyId } = await context.params;

        const submissions = await Submission.find({
            bountyId: bountyId,
        }).sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            submissions,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
}
