//src\app\api\submission\create\route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Bounty from "@/models/Bounty";
import User from "@/models/User";
import { verifyWalletSignature, WalletSignatureError } from "@/lib/auth";
import { checkSubmissionCreateRules, distanceMeters } from "@/lib/bountyRules";

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const body = await req.json();
        const { walletAddress, bountyId, description, mediaUrl, captureLat, captureLng, capturedAt } = body;

        if (!walletAddress || !bountyId || !mediaUrl || captureLat == null || captureLng == null || capturedAt == null) {
            return NextResponse.json(
                { error: "Missing fields" },
                { status: 400 }
            );
        }

        const actingAddress = verifyWalletSignature(body, "submission/create", bountyId);

        const user = await User.findOne({ walletAddress: { $regex: `^${actingAddress}$`, $options: "i" } });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const bounty = await Bounty.findById(bountyId);
        const pendingSubmission = bounty
            ? await Submission.findOne({
                  bountyId: bounty._id,
                  hunterWallet: { $regex: `^${actingAddress}$`, $options: "i" },
                  status: "pending",
              }).select("_id")
            : null;
        const ruleError = checkSubmissionCreateRules(
            bounty,
            user._id,
            Boolean(pendingSubmission)
        );

        if (ruleError) {
            return NextResponse.json({ error: ruleError.message }, { status: ruleError.status });
        }

        const latitude = Number(captureLat);
        const longitude = Number(captureLng);
        const captureTime = typeof capturedAt === "number"
            ? new Date(capturedAt)
            : new Date(capturedAt);
        const bountyLat = Number(bounty!.location?.lat);
        const bountyLng = Number(bounty!.location?.lng);

        if (
            !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
            !Number.isFinite(longitude) || longitude < -180 || longitude > 180 ||
            Number.isNaN(captureTime.getTime())
        ) {
            return NextResponse.json({ error: "Capture coordinates or timestamp are invalid" }, { status: 400 });
        }

        if (!Number.isFinite(bountyLat) || !Number.isFinite(bountyLng)) {
            return NextResponse.json({ error: "Bounty location is unavailable for distance verification" }, { status: 400 });
        }

        if (distanceMeters(latitude, longitude, bountyLat, bountyLng) > 300) {
            return NextResponse.json({ error: "Submission must be captured within 300 meters of the bounty location" }, { status: 403 });
        }

        const submission = await Submission.create({
            bountyId: bounty!._id,
            hunter: user._id,
            username: user.username,
            description,
            mediaUrl,
            hunterWallet: actingAddress,
            captureLat: latitude,
            captureLng: longitude,
            capturedAt: captureTime,
        });

        return NextResponse.json({ success: true, submission });
    } catch (error) {
        if (error instanceof WalletSignatureError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error(error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
