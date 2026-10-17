// src\components\CreateBounty.tsx

"use client";

import { useState } from "react";
import axios from "axios";
import { useUser } from "@/context/UserContext";
import { ethers, type Log, type LogDescription } from "ethers";
import { ESCROW_ADDRESS, USDC_ADDRESS, ESCROW_ABI, ERC20_ABI } from "@/lib/contracts";
import { signAction } from "@/lib/signAction";
import { useToast } from "@/components/ui/Toast";

export default function CreateBounty() {
    const { user } = useUser();
    const showToast = useToast();
    const [open, setOpen] = useState(false);
    const [description, setDescription] = useState("");
    const [reward, setReward] = useState("");
    const [lat, setLat] = useState("");
    const [lng, setLng] = useState("");
    const [address, setAddress] = useState("");
    const [loading, setLoading] = useState(false);

    const createBounty = async () => {
        if (!user) {
            showToast("Connect your wallet first.", "info");
            return;
        }

        try {
            setLoading(true);

            if (!(window as any).ethereum) {
                showToast("No browser wallet was found.", "error");
                return;
            }

            const provider = new ethers.BrowserProvider((window as any).ethereum);

            let network = await provider.getNetwork();

            if (network.chainId !== 10143n) {
                try {
                    await (window as any).ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: "0x279f" }], // 10143 in hex
                    });
                } catch (switchError: any) {
                    // Network not added → add it
                    if (switchError.code === 4902) {
                        await (window as any).ethereum.request({
                            method: "wallet_addEthereumChain",
                            params: [
                                {
                                    chainId: "0x279f",
                                    chainName: "Monad Testnet",
                                    rpcUrls: ["https://testnet-rpc.monad.xyz"],
                                    nativeCurrency: {
                                        name: "MON",
                                        symbol: "MON",
                                        decimals: 18,
                                    },
                                    blockExplorerUrls: ["https://explorer.monad.xyz"],
                                },
                            ],
                        });
                    } else {
                        showToast("Please switch to Monad Testnet.", "error");
                        return;
                    }
                }
            }

            network = await provider.getNetwork();
            if (network.chainId !== 10143n) {
                showToast("Please switch to Monad Testnet.", "error");
                return;
            }

            const signer = await provider.getSigner();

            const amount = Number(reward);

            if (!amount || amount <= 0) {
                showToast("Enter a valid reward amount.", "error");
                setLoading(false);
                return;
            }

            // USDC has 6 decimals
            const amountInUnits = ethers.parseUnits(amount.toString(), 6);
            const deadline = Math.floor(Date.now() / 1000) + 24 * 60 * 60;

            // Step 1 — Approve USDC
            const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);

            const approveTx = await usdc.approve(ESCROW_ADDRESS, amountInUnits);
            await approveTx.wait();

            // Step 2 — Create bounty on-chain
            const escrow = new ethers.Contract(
                ESCROW_ADDRESS,
                [
                    ...ESCROW_ABI,
                    "event BountyCreated(uint256 indexed bountyId, address indexed creator, uint256 amount, uint256 deadline)",
                ],
                signer
            );

            const tx = await escrow.createBounty(amountInUnits, deadline);
            const receipt = await tx.wait();
            const bountyCreatedEvent = receipt?.logs
                .filter((log: Log) => log.address.toLowerCase() === ESCROW_ADDRESS.toLowerCase())
                .map((log: Log) => escrow.interface.parseLog(log))
                .find((event: LogDescription | null) => event?.name === "BountyCreated");

            if (!bountyCreatedEvent) {
                showToast(`Bounty transaction confirmed, but its BountyCreated event was not found. Transaction: ${tx.hash}. The bounty was not saved to the database.`, "error");
                return;
            }

            const onChainId = Number(bountyCreatedEvent.args.bountyId);

            const auth = await signAction("bounty/create", onChainId);

            // Save in MongoDB
            await axios.post("/api/bounty/create", {
                ...auth,
                description,
                reward: amount,
                deadline,
                lat: Number(lat),
                lng: Number(lng),
                address,
                mediaUrl: "",
                onChainId,
            });

            showToast("Bounty created and funds locked.", "success");

            setDescription("");
            setReward("");
            setLat("");
            setLng("");
            setAddress("");

        } catch (err) {
            console.error(err);
            showToast("Transaction failed.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (

        <div className="max-w-xl mx-auto mt-8 bg-white shadow-md rounded-2xl p-6 border">
            <h2 className="text-xl font-semibold mb-4">Create a Bounty</h2>

            <textarea
                placeholder="Ask what's happening at a location..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border rounded-lg p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-black"
                rows={3}
            />

            <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="Reward (USDC)"
                    value={reward}
                    onChange={(e) => setReward(e.target.value)}
                    className="border rounded-lg p-2"
                />

                <input
                    placeholder="Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="border rounded-lg p-2"
                />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <input
                    placeholder="Latitude"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="border rounded-lg p-2"
                />

                <input
                    placeholder="Longitude"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="border rounded-lg p-2"
                />
            </div>

            <button
                onClick={createBounty}
                disabled={loading}
                className="w-full bg-black text-white py-2 rounded-lg hover:opacity-90 transition"
            >
                {loading ? "Posting..." : "Post Bounty"}
            </button>
        </div>
    );
}
