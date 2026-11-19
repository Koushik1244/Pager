// src\components\BountyModal.tsx

"use client";

import { useEffect, useState } from "react";
import MapPicker from "./ui/MapPicker";
import ImageUploader from "./ui/ImageUploader";
import axios from "axios";
import { useUser } from "@/context/UserContext";
import { ethers, type Log, type LogDescription } from "ethers";
import { ESCROW_ADDRESS, USDC_ADDRESS, ESCROW_ABI, ERC20_ABI } from "@/lib/contracts";
import { IoImageSharp } from "react-icons/io5";
import { signAction } from "@/lib/signAction";
import { useToast } from "@/components/ui/Toast";

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
    const showToast = useToast();
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
            showToast("Connect your wallet first.", "info");
            return;
        }

        if (!lat || !lng) {
            showToast("Please select a location.", "error");
            return;
        }

        const amount = Number(reward);

        if (!amount || amount <= 0) {
            showToast("Enter a valid reward amount.", "error");
            return;
        }

        try {
            setLoading(true);

            if (!(window as any).ethereum) {
                showToast("No browser wallet was found.", "error");
                return;
            }

            try {
                await (window as any).ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: "0x279F" }],
                });
            } catch (switchError: any) {
                if (switchError.code === 4902) {
                    await (window as any).ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [{
                            chainId: "0x279F",
                            chainName: "Monad Testnet",
                            rpcUrls: [process.env.NEXT_PUBLIC_MONAD_RPC],
                            nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
                            blockExplorerUrls: ["https://explorer.monad.xyz"],
                        }],
                    });
                } else {
                    throw switchError;
                }
            }

            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const network = await provider.getNetwork();
            if (network.chainId !== 10143n) {
                showToast("Please switch to Monad Testnet.", "error");
                return;
            }

            const signer = await provider.getSigner();

            const amountInUnits = ethers.parseUnits(amount.toString(), 6);
            const deadline = Math.floor(Date.now() / 1000) + 24 * 60 * 60;

            // Approve USDC
            const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
            console.log("[BountyModal] before approve", { usdc, ESCROW_ADDRESS, amountInUnits: amountInUnits.toString() });
            let approveTx;
            try {
                approveTx = await usdc.approve(ESCROW_ADDRESS, amountInUnits);
                console.log("[BountyModal] approve tx sent", approveTx);
            } catch (approveErr) {
                console.error("[BountyModal] approve call threw:", approveErr);
                throw approveErr;
            }
            await approveTx.wait();
            console.log("[BountyModal] approve confirmed");

            // Lock funds
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

            // Save in Mongo
            await axios.post("/api/bounty/create", {
                ...auth,
                description,
                reward: amount,
                deadline,
                lat,
                lng,
                mediaUrl: imageUrl,
                onChainId,
            });

            showToast("Bounty created.", "success");

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
            showToast("Transaction failed.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
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
          relative my-auto w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto
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
                <div className="sticky top-0 z-10 -mx-6 -mt-6 mb-4 flex items-center justify-between border-b border-primary/10 bg-white/90 px-6 py-4 backdrop-blur-md dark:bg-cardDark/95">
                    <h2 className="text-lg font-bold text-textMainLight dark:text-textMainDark">
                        Create Bounty
                    </h2>

                    <button
                        onClick={onClose}
                        aria-label="Close create bounty dialog"
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

                        <ImageUploader active={open} onUpload={(url) => setImageUrl(url)} />
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
