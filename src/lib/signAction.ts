"use client";

import { BrowserProvider } from "ethers";

export async function signAction(action: string, targetId: string | number) {
    const ethereum = (window as Window & { ethereum?: unknown }).ethereum;
    if (!ethereum) {
        throw new Error("No connected wallet was found");
    }

    const provider = new BrowserProvider(ethereum as any);
    const signer = await provider.getSigner();
    const walletAddress = await signer.getAddress();
    const timestamp = Date.now();
    const message = `Pager:${action}:${String(targetId)}:${timestamp}`;
    const signature = await signer.signMessage(message);

    return { walletAddress, signature, timestamp };
}
