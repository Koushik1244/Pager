// src\components\BountyModal.tsx

"use client";

import { useEffect, useState } from "react";
import MapPicker from "./ui/MapPicker";
import ImageUploader from "./ui/ImageUploader";
import axios from "axios";
import { useUser } from "@/context/UserContext";
import { ethers } from "ethers";
import { ESCROW_ADDRESS, USDC_ADDRESS, ESCROW_ABI, ERC20_ABI } from "@/lib/contracts";
import { IoImageSharp } from "react-icons/io5";

type Props = {
    open: boolean;
    onClose: () => void;
};

export default function BountyModal({ open, onClose }: Props) {
    const [isVisible, setIsVisible] = useState(false);
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [imageUrl, setImageUrl] = useState("");
    const { user } = useUser();
    const [description, setDescription] = useState("");
    const [reward, setReward] = useState("");
    const [loading, setLoading] = useState(false);


    // Handle mount + scroll lock
    useEffect(() => {
        if (open) {
            setIsVisible(true);
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
            const timer = setTimeout(() => setIsVisible(false), 250);
            return () => clearTimeout(timer);
        }
    }, [open]);

    if (!isVisible) return null;

    const handleLocation = (lat: number, lng: number) => {
        setLat(lat);
        setLng(lng);
    };

    const createBounty = async () => {
        if (!user) {
            alert("Connect wallet first");
            return;
        }

        if (!lat || !lng) {
            alert("Please select a location");
            return;
        }

        const amount = Number(reward);

        if (!amount || amount <= 0) {
            alert("Enter valid reward");
            return;
        }

        try {
            setLoading(true);

            if (!(window as any).ethereum) {
                alert("MetaMask not found");
                return;
            }

            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();

            // Ensure Monad
            const network = await provider.getNetwork();
            if (network.chainId !== 10143n) {
                await (window as any).ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: "0x279f" }],
                });
            }

            const amountInUnits = ethers.parseUnits(amount.toString(), 6);

            // Approve USDC
            const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
            const approveTx = await usdc.approve(ESCROW_ADDRESS, amountInUnits);
            await approveTx.wait();

            // Lock funds
            const escrow = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
            const tx = await escrow.createBounty(amountInUnits);
            await tx.wait();

            const bountyCount = await escrow.bountyCount();

            // Save in Mongo
            await axios.post("/api/bounty/create", {
                walletAddress: user.walletAddress,
                description,
                reward: amount,
                lat,
                lng,
                mediaUrl: imageUrl,
                onChainId: Number(bountyCount),
            });

            alert("Bounty created!");

            // Reset
            setDescription("");
            setReward("");
            setImageUrl("");
            setLat(null);
            setLng(null);

            onClose();
            window.location.reload(); // refresh feed

        } catch (err) {
            console.error(err);
            alert("Transaction failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Overlay */}
            <div
                onClick={onClose}
                className={`
          absolute inset-0
          bg-black/30 dark:bg-black/60
          backdrop-blur-md
          transition-opacity duration-300
          ${open ? "opacity-100" : "opacity-0"}
        `}
            />

            {/* Modal */}
            <div
                className={`
          relative w-[92%] max-w-lg
          rounded-2xl p-6

          /* Glass surface */
          bg-white/90
          dark:bg-cardDark/80
          backdrop-blur-md

          /* Borders */
          border border-primary/20
          dark:border-primary/30

          /* Depth */
          shadow-xl
          dark:shadow-[0_30px_90px_rgba(0,0,0,0.7)]

          /* Purple ambient glow */
          before:absolute before:inset-0 before:rounded-2xl
          before:bg-gradient-to-br before:from-primary/10 before:to-transparent
          before:pointer-events-none

          /* Animation */
          transform transition-all duration-300 ease-out
          ${open ? "scale-100 opacity-100" : "scale-95 opacity-0"}
        `}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-textMainLight dark:text-textMainDark">
                        Create Bounty
                    </h2>

                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-primary transition"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    {/* Description */}
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What’s happening at this location?"
                        rows={3}
                        className="
              w-full p-3 rounded-lg
              bg-white dark:bg-neutralDark
              border border-borderLight dark:border-borderDark
              outline-none
              focus:ring-2 focus:ring-primary/40
              transition
            "
                    />

                    {/* Reward */}
                    <input
                        type="number"
                        placeholder="Reward (USDC)"
                        value={reward}
                        onChange={(e) => setReward(e.target.value)}
                        className="
              w-full p-3 rounded-lg
              bg-white dark:bg-neutralDark
              border border-borderLight dark:border-borderDark
              outline-none
              focus:ring-2 focus:ring-primary/40
            "
                    />

                    {/* Map Location Picker */}
                    {/* <div className="text-sm text-primary/70 space-y-2"> */}
                    <div className="mb-4">
                        <p className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
                            <img src="/pager-icon.png" width={20} />
                            Select Location
                        </p>

                        <MapPicker onLocationSelect={handleLocation} />

                        {lat && lng && (
                            <p className="text-xs text-primary/70 mt-2">
                                Selected: {lat.toFixed(4)}, {lng.toFixed(4)}
                            </p>
                        )}
                    </div>


                    <div>
                        <p className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
                            <IoImageSharp size={16} />
                            Choose Image (optional)
                        </p>

                        <ImageUploader onUpload={(url) => setImageUrl(url)} />
                    </div>

                    {/* </div> */}

                    {/* Submit */}
                    <button
                        onClick={createBounty}
                        disabled={loading}
                        className="
    w-full py-3 rounded-xl
    bg-primary text-white font-semibold
    shadow-glow
    hover:scale-[1.01]
    active:scale-95
    transition-all duration-200
  "
                    >
                        {loading ? "Processing..." : "Lock Funds & Post"}
                    </button>

                </div>
            </div>
        </div>
    );
}
