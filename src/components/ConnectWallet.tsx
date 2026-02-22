"use client";

import { useState } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { useUser } from "@/context/UserContext";

export default function ConnectWallet() {
    const [wallet, setWallet] = useState("");
    const [username, setUsername] = useState("");
    const [needsUsername, setNeedsUsername] = useState(false);
    const { setUser } = useUser();
    const { user } = useUser();

    const connectWallet = async () => {

        if (!(window as any).ethereum) {
            alert("Install MetaMask");
            return;
        }

        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const address = accounts[0];

        setWallet(address);

        const res = await axios.post("/api/user/connect", {
            walletAddress: address,
        });

        const userData = res.data.user;

        setUser(userData);

        if (!userData.username) {
            setNeedsUsername(true);
        } else {
            alert("Welcome " + userData.username);
        }
    };

    const saveUsername = async () => {
        const res = await axios.post("/api/user/set-username", {
            walletAddress: wallet,
            username,
        });

        setUser(res.data.user);

        alert("Username set!");
        setNeedsUsername(false);
    };

    return (
        <div className="p-4">
            {!user && (
                <button
                    onClick={connectWallet}
                    className="bg-black text-white px-4 py-2 rounded"
                >
                    Connect Wallet
                </button>
            )}

            {user && <p className="mb-4">Logged in as: {user.username || user.walletAddress}</p>}

            {needsUsername && (
                <div className="mt-4">
                    <input
                        placeholder="Choose username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="border p-2 mr-2"
                    />
                    <button
                        onClick={saveUsername}
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        Save
                    </button>
                </div>
            )}
        </div>
    );
}
