//src\app\api\submission\approve\route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Bounty from "@/models/Bounty";

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const { submissionId, bountyId } = await req.json();

        // Approve submission
        await Submission.findByIdAndUpdate(submissionId, {
            status: "approved",
        });

        // Mark bounty completed
        await Bounty.findByIdAndUpdate(bountyId, {
            status: "completed",
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
