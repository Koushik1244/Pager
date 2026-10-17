import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Bounty from "@/models/Bounty";
import { getComputedBountyStatus } from "@/lib/bountyRules";

export async function GET(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { id } = await context.params;
        const bounty = await Bounty.findById(id);

        if (!bounty) {
            return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
        }

        const value = bounty.toObject();
        return NextResponse.json({
            success: true,
            bounty: { ...value, status: getComputedBountyStatus(value) },
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
