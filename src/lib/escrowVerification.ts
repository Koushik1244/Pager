import {
    getAddress,
    Interface,
    isHexString,
    JsonRpcProvider,
    type LogDescription,
} from "ethers";
import { ESCROW_ADDRESS } from "@/lib/contracts";

const MONAD_TESTNET_CHAIN_ID = 10143n;
const escrowEvents = new Interface([
    "event BountyApproved(uint256 indexed bountyId, address indexed hunter, uint256 amount)",
    "event BountyRefunded(uint256 indexed bountyId, address indexed creator, uint256 amount)",
]);

export type EscrowEventName = "BountyApproved" | "BountyRefunded";

export class EscrowTransactionVerificationError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "EscrowTransactionVerificationError";
        this.status = status;
    }
}

function sameAddress(left: string | null | undefined, right: string) {
    if (!left) return false;

    try {
        return getAddress(left) === getAddress(right);
    } catch {
        return false;
    }
}

type VerifyEscrowTransactionOptions = {
    txHash: string;
    eventName: EscrowEventName;
    bountyId: number;
    expectedSender: string;
    expectedHunter?: string;
};

export async function verifyEscrowTransaction({
    txHash,
    eventName,
    bountyId,
    expectedSender,
    expectedHunter,
}: VerifyEscrowTransactionOptions): Promise<LogDescription> {
    if (!isHexString(txHash, 32)) {
        throw new EscrowTransactionVerificationError("A valid transaction hash is required.", 400);
    }

    if (!Number.isSafeInteger(bountyId) || bountyId < 1) {
        throw new EscrowTransactionVerificationError("The bounty has no valid on-chain ID.", 400);
    }

    const rpcUrl = process.env.MONAD_RPC;
    if (!rpcUrl) {
        throw new EscrowTransactionVerificationError("Monad RPC is not configured on the server.", 503);
    }

    const provider = new JsonRpcProvider(rpcUrl, Number(MONAD_TESTNET_CHAIN_ID), {
        staticNetwork: true,
    });

    try {
        const [chainId, transaction, receipt] = await Promise.all([
            provider.send("eth_chainId", []),
            provider.getTransaction(txHash),
            provider.getTransactionReceipt(txHash),
        ]);

        if (BigInt(chainId) !== MONAD_TESTNET_CHAIN_ID) {
            throw new EscrowTransactionVerificationError("The configured RPC is not Monad testnet.", 503);
        }

        if (!transaction || !receipt) {
            throw new EscrowTransactionVerificationError("The transaction was not found or is not confirmed yet.", 409);
        }

        if (receipt.status !== 1) {
            throw new EscrowTransactionVerificationError("The transaction did not succeed on-chain.", 400);
        }

        if (!sameAddress(transaction.to, ESCROW_ADDRESS)) {
            throw new EscrowTransactionVerificationError("The transaction was not sent to the Pager escrow contract.", 400);
        }

        if (!sameAddress(transaction.from, expectedSender)) {
            throw new EscrowTransactionVerificationError("The transaction sender does not match the bounty creator.", 403);
        }

        const expectedBountyId = BigInt(bountyId);
        let matchingEvent: LogDescription | null = null;

        for (const log of receipt.logs) {
            if (!sameAddress(log.address, ESCROW_ADDRESS)) continue;

            let parsedEvent: LogDescription | null;
            try {
                parsedEvent = escrowEvents.parseLog(log);
            } catch {
                continue;
            }

            if (
                !parsedEvent ||
                parsedEvent.name !== eventName ||
                BigInt(parsedEvent.args.bountyId) !== expectedBountyId
            ) {
                continue;
            }

            if (eventName === "BountyApproved" && !sameAddress(parsedEvent.args.hunter, expectedHunter ?? "")) {
                throw new EscrowTransactionVerificationError("The approval event does not name this submission's hunter.", 400);
            }

            if (eventName === "BountyRefunded" && !sameAddress(parsedEvent.args.creator, expectedSender)) {
                throw new EscrowTransactionVerificationError("The refund event does not name the bounty creator.", 400);
            }

            matchingEvent = parsedEvent;
            break;
        }

        if (!matchingEvent) {
            throw new EscrowTransactionVerificationError(
                `The transaction receipt does not contain ${eventName} for bounty ${bountyId}.`,
                400
            );
        }

        return matchingEvent;
    } catch (error) {
        if (error instanceof EscrowTransactionVerificationError) throw error;

        console.error("Monad escrow transaction verification failed", error);
        throw new EscrowTransactionVerificationError("Could not verify the transaction with Monad RPC.", 503);
    } finally {
        provider.destroy();
    }
}
