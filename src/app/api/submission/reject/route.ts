//src\app\api\submission\reject\route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Submission from "@/models/Submission";

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const { submissionId } = await req.json();

        await Submission.findByIdAndUpdate(submissionId, {
            status: "rejected",
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}