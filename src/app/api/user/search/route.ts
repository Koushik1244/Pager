import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q") || "";

        const users = await User.find({
            username: { $regex: query, $options: "i" },
        })
            .limit(20)
            .select("username walletAddress");

        return NextResponse.json({
            success: true,
            users,
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
}
