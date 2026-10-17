type BountyRuleRecord = {
    creator?: unknown;
    status?: string;
    deadline?: Date | string | number;
};

type SubmissionRuleRecord = {
    status?: string;
};

type RuleError = { status: number; message: string };

function sameId(left: unknown, right: unknown) {
    if (left == null || right == null) return false;
    return String(left) === String(right);
}

export function checkSubmissionCreateRules(
    bounty: BountyRuleRecord | null,
    submitterId: unknown,
    hasPendingSubmission: boolean,
    now = Date.now()
): RuleError | null {
    if (!bounty) return { status: 404, message: "Bounty not found" };
    if (bounty.status !== "open") return { status: 409, message: "Bounty is not open" };

    const deadline = new Date(bounty.deadline ?? NaN).getTime();
    if (!Number.isFinite(deadline) || deadline <= now) {
        return { status: 409, message: "Bounty deadline has passed" };
    }

    if (sameId(bounty.creator, submitterId)) {
        return { status: 403, message: "Bounty creators cannot submit to their own bounty" };
    }

    if (hasPendingSubmission) {
        return { status: 409, message: "You already have a pending submission for this bounty" };
    }

    return null;
}

export function checkSubmissionActionRules(
    bounty: BountyRuleRecord | null,
    submission: SubmissionRuleRecord | null,
    actingUserId: unknown,
    allowSyncedReplay = false
): RuleError | null {
    if (!bounty) return { status: 404, message: "Bounty not found" };
    if (!sameId(bounty.creator, actingUserId)) {
        return { status: 403, message: "Only the bounty creator may perform this action" };
    }
    if (!submission) return { status: 404, message: "Submission not found" };
    if (bounty.status !== "open" && !allowSyncedReplay) {
        return { status: 409, message: "Bounty is not open" };
    }
    if (submission.status !== "pending" && !allowSyncedReplay) {
        return { status: 409, message: "Submission is not pending" };
    }
    return null;
}

export function getComputedBountyStatus(
    bounty: BountyRuleRecord,
    now = Date.now()
) {
    if (
        bounty.status === "open" &&
        Number.isFinite(new Date(bounty.deadline ?? NaN).getTime()) &&
        new Date(bounty.deadline ?? NaN).getTime() <= now
    ) {
        return "expired";
    }

    return bounty.status;
}

export function distanceMeters(
    latitude1: number,
    longitude1: number,
    latitude2: number,
    longitude2: number
) {
    const radians = (degrees: number) => (degrees * Math.PI) / 180;
    const latitudeDelta = radians(latitude2 - latitude1);
    const longitudeDelta = radians(longitude2 - longitude1);
    const haversine =
        Math.sin(latitudeDelta / 2) ** 2 +
        Math.cos(radians(latitude1)) *
            Math.cos(radians(latitude2)) *
            Math.sin(longitudeDelta / 2) ** 2;

    return 6_371_000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}
