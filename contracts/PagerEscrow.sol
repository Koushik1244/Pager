// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract PagerEscrow {
    IERC20 public usdc;
    address public platform;

    uint256 public bountyCount;

    struct Bounty {
        address creator;
        uint256 amount;
        bool active;
    }

    mapping(uint256 => Bounty) public bounties;

    uint256 public constant PLATFORM_FEE = 2; // 2%

    constructor(address _usdc, address _platform) {
        usdc = IERC20(_usdc);
        platform = _platform;
    }

    function createBounty(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");

        usdc.transferFrom(msg.sender, address(this), amount);

        bountyCount++;

        bounties[bountyCount] = Bounty({
            creator: msg.sender,
            amount: amount,
            active: true
        });
    }

    function approveBounty(uint256 bountyId, address hunter) external {
        Bounty storage bounty = bounties[bountyId];

        require(bounty.active, "Inactive");
        require(bounty.creator == msg.sender, "Not creator");

        bounty.active = false;

        uint256 fee = (bounty.amount * PLATFORM_FEE) / 100;
        uint256 hunterAmount = bounty.amount - fee;

        usdc.transfer(hunter, hunterAmount);
        usdc.transfer(platform, fee);
    }
}
