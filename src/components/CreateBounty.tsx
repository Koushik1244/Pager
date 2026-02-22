// src\components\CreateBounty.tsx

"use client";

import { useState } from "react";
import axios from "axios";
import { useUser } from "@/context/UserContext";
import { ethers } from "ethers";
import { ESCROW_ADDRESS, USDC_ADDRESS, ESCROW_ABI, ERC20_ABI } from "@/lib/contracts";

export default function CreateBounty() {
    const { user } = useUser();
    const [open, setOpen] = useState(false);
    const [description, setDescription] = useState("");
    const [reward, setReward] = useState("");
    const [lat, setLat] = useState("");
    const [lng, setLng] = useState("");
    const [address, setAddress] = useState("");
    const [loading, setLoading] = useState(false);

    const createBounty = async () => {
        if (!user) {
            alert("Connect wallet first");
            return;
        }

        try {
            setLoading(true);

            if (!(window as any).ethereum) {
                alert("MetaMask not found");
                return;
            }

            const provider = new ethers.BrowserProvider((window as any).ethereum);

            const network = await provider.getNetwork();

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
                        alert("Please switch to Monad Testnet");
                        return;
                    }
                }
            }

            const signer = await provider.getSigner();

            const amount = Number(reward);

            if (!amount || amount <= 0) {
                alert("Enter a valid reward amount");
                setLoading(false);
                return;
            }

            // USDC has 6 decimals
            const amountInUnits = ethers.parseUnits(amount.toString(), 6);

            // Step 1 — Approve USDC
            const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);

            const approveTx = await usdc.approve(ESCROW_ADDRESS, amountInUnits);
            await approveTx.wait();

            // Step 2 — Create bounty on-chain
            const escrow = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);

            const tx = await escrow.createBounty(amountInUnits);
            await tx.wait();

            // Step 3 — Get latest on-chain ID
            const bountyCount = await escrow.bountyCount();

            // Step 4 — Save in MongoDB
            await axios.post("/api/bounty/create", {
                walletAddress: user.walletAddress,
                description,
                reward: amount,
                lat: Number(lat),
                lng: Number(lng),
                address,
                mediaUrl: "",
                onChainId: Number(bountyCount),
            });

            alert("Bounty created & funds locked!");

            setDescription("");
            setReward("");
            setLat("");
            setLng("");
            setAddress("");

        } catch (err) {
            console.error(err);
            alert("Transaction failed");
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
