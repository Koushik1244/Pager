// src/lib/contracts.ts

export const ESCROW_ADDRESS = "0x4eF5C864661aAEc8a374241bF80E0456b8F49f88";

export const USDC_ADDRESS = "0x534b2f3A21130d7a60830c2Df862319e593943A3";

export const ESCROW_ABI = [
    "function createBounty(uint256 amount, uint256 deadline) external",
    "function bountyCount() view returns (uint256)",
    "function approveBounty(uint256 bountyId, address hunter) external",
    "function refundExpired(uint256 bountyId) external"
];

export const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function decimals() view returns (uint8)"
];
