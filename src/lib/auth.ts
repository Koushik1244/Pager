import { verifyMessage } from "ethers";

const MAX_SIGNATURE_AGE_MS = 5 * 60 * 1000;

export class WalletSignatureError extends Error {
    status = 401;
}

type WalletSignatureBody = {
    walletAddress?: unknown;
    signature?: unknown;
    timestamp?: unknown;
};

/** Verify that the claimed wallet signed the route's action and target. */
export function verifyWalletSignature(
    body: WalletSignatureBody,
    action: string,
    targetId: string | number
): string {
    const { walletAddress, signature, timestamp } = body;

    if (
        typeof walletAddress !== "string" ||
        typeof signature !== "string" ||
        !signature ||
        typeof timestamp !== "number" ||
        !Number.isSafeInteger(timestamp)
    ) {
        throw new WalletSignatureError("Missing or invalid wallet signature fields");
    }

    const now = Date.now();
    if (timestamp > now || now - timestamp > MAX_SIGNATURE_AGE_MS) {
        throw new WalletSignatureError("Wallet signature timestamp is expired or in the future");
    }

    const message = `Pager:${action}:${String(targetId)}:${timestamp}`;
    let signer: string;
    try {
        signer = verifyMessage(message, signature);
    } catch {
        throw new WalletSignatureError("Invalid wallet signature");
    }

    if (signer.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new WalletSignatureError("Wallet signature does not match the claimed address");
    }

    return signer;
}
