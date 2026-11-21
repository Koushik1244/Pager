import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

function escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q") || "";
        const escapedQuery = escapeRegex(query);
        const isWalletAddress = /^0x[0-9a-f]{40}$/i.test(query);

        const exact = searchParams.get("exact") === "1";
        const userFilter = isWalletAddress
            ? { walletAddress: { $regex: `^${escapedQuery}$`, $options: "i" } }
            : { username: { $regex: exact ? `^${escapedQuery}$` : escapedQuery, $options: "i" } };

        const users = exact
            ? await User.findOne(userFilter).select("username walletAddress")
            : await User.find(userFilter).limit(20).select("username walletAddress");

        return NextResponse.json({
            success: true,
            users: exact ? (users ? [users] : []) : users,
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
}
