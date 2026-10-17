const fs = require("node:fs");
const path = require("node:path");
const { Contract, JsonRpcProvider, formatUnits } = require("ethers");

const projectRoot = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(projectRoot, ".env") });

function readExportedAddress(source, name) {
    const match = source.match(
        new RegExp(`export\\s+const\\s+${name}\\s*=\\s*["']([^"']+)["']`)
    );

    if (!match) {
        throw new Error(`Could not find ${name} in src/lib/contracts.ts`);
    }

    return match[1];
}

async function main() {
    const hardhatConfigPath = path.join(projectRoot, "hardhat.config.js");
    const hardhatConfigSource = fs.readFileSync(hardhatConfigPath, "utf8");
    const rpcEnvMatch = hardhatConfigSource.match(
        /monadTestnet\s*:\s*\{[\s\S]*?url\s*:\s*process\.env\.([A-Z0-9_]+)/
    );

    if (!rpcEnvMatch) {
        throw new Error("Could not find the Monad testnet RPC setting in hardhat.config.js");
    }

    const rpcUrl = process.env[rpcEnvMatch[1]];
    if (!rpcUrl) {
        throw new Error(`Set ${rpcEnvMatch[1]} in .env before running this script`);
    }

    const contractsPath = path.join(projectRoot, "src/lib/contracts.ts");
    const contractsSource = fs.readFileSync(contractsPath, "utf8");
    const escrowAddress = readExportedAddress(contractsSource, "ESCROW_ADDRESS");
    const usdcAddress = readExportedAddress(contractsSource, "USDC_ADDRESS");
    const escrowAbiMatch = contractsSource.match(
        /export\s+const\s+ESCROW_ABI\s*=\s*\[([\s\S]*?)\]\s*;/
    );

    if (!escrowAbiMatch) {
        throw new Error("Could not find ESCROW_ABI in src/lib/contracts.ts");
    }

    const escrowAbi = Array.from(
        escrowAbiMatch[1].matchAll(/["']([^"']+)["']/g),
        (match) => match[1]
    );

    // bounties is a public Solidity mapping but its getter is not in the app ABI.
    // This read-only fragment adds the getter needed to inspect each bounty.
    escrowAbi.push(
        "function bounties(uint256 bountyId) view returns (address creator, uint256 amount, bool active, uint256 deadline)"
    );

    const usdcAbi = [
        "function balanceOf(address account) view returns (uint256)",
        "function decimals() view returns (uint8)",
    ];
    const provider = new JsonRpcProvider(rpcUrl);
    const escrow = new Contract(escrowAddress, escrowAbi, provider);
    const usdc = new Contract(usdcAddress, usdcAbi, provider);

    const platformWallet = "0xF7F552596B8E7Ea937C4BbD2AF6D9a6D3Ff59949";
    const [bountyCount, escrowBalance, tokenDecimals, platformBalance] = await Promise.all([
        escrow.bountyCount(),
        usdc.balanceOf(escrowAddress),
        usdc.decimals(),
        usdc.balanceOf(platformWallet),
    ]);

    console.log(`Escrow USDC balance: ${formatUnits(escrowBalance, tokenDecimals)} USDC`);
    console.log(`bountyCount: ${bountyCount.toString()}`);

    let activeAmountSum = 0n;
    for (let id = 0n; id <= bountyCount; id++) {
        const bounty = await escrow.bounties(id);
        const amount = BigInt(bounty.amount);
        const active = Boolean(bounty.active);

        if (active) activeAmountSum += amount;

        const deadline = BigInt(bounty.deadline);
        const deadlineText = deadline === 0n
            ? "0 (no deadline)"
            : `${deadline.toString()} (${new Date(Number(deadline) * 1000).toISOString()})`;

        console.log(
            `Bounty ${id.toString()}: creator=${bounty.creator}, amount=${formatUnits(amount, tokenDecimals)} USDC, deadline=${deadlineText}, active=${active}`
        );
    }

    console.log(`Active bounty amount sum: ${formatUnits(activeAmountSum, tokenDecimals)} USDC`);
    console.log(
        `Escrow balance equals active bounty amount sum: ${escrowBalance === activeAmountSum ? "YES" : "NO"}`
    );
    console.log(
        `USDC balance of ${platformWallet}: ${formatUnits(platformBalance, tokenDecimals)} USDC`
    );
}

main().catch((error) => {
    console.error("Inspection failed:", error.shortMessage || error.message || error);
    process.exitCode = 1;
});
