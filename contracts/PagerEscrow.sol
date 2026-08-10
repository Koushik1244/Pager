// contracts\PagerEscrow.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract PagerEscrow {
    IERC20 public usdc;
    address public platform;

    event BountyCreated(uint256 indexed bountyId, address indexed creator, uint256 amount, uint256 deadline);
    event BountyApproved(uint256 indexed bountyId, address indexed hunter, uint256 amount);
    event BountyRefunded(uint256 indexed bountyId, address indexed creator, uint256 amount);
    event SubmissionRejected(uint256 indexed bountyId, address indexed hunter);

    uint256 public bountyCount;

    struct Bounty {
        address creator;
        uint256 amount;
        bool active;
        uint256 deadline;
    }

    mapping(uint256 => Bounty) public bounties;

    uint256 public constant PLATFORM_FEE = 2; // 2%

    constructor(address _usdc, address _platform) {
        usdc = IERC20(_usdc);
        platform = _platform;
    }

    function createBounty(uint256 amount, uint256 deadline) external {
        require(amount > 0, "Amount must be > 0");

        require(deadline >= block.timestamp + 1 hours, "Deadline too soon");
        require(deadline <= block.timestamp + 7 days, "Deadline too far");

        usdc.transferFrom(msg.sender, address(this), amount);

        bountyCount++;

        bounties[bountyCount] = Bounty({
            creator: msg.sender,
            amount: amount,
            active: true,
            deadline: deadline
        });

        emit BountyCreated(bountyCount, msg.sender, amount, deadline);
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

        emit BountyApproved(bountyId, hunter, bounty.amount);
    }

    function refundExpired(uint256 bountyId) external {
        Bounty storage bounty = bounties[bountyId];

        require(bounty.active, "Inactive");
        require(bounty.creator == msg.sender, "Not creator");
        require(block.timestamp > bounty.deadline, "Not expired");

        bounty.active = false;

        usdc.transfer(bounty.creator, bounty.amount);

        emit BountyRefunded(bountyId, bounty.creator, bounty.amount);
    }

    function reject(uint256 bountyId, address hunter) external {
        Bounty storage bounty = bounties[bountyId];

        require(bounty.active, "Inactive");
        require(bounty.creator == msg.sender, "Not creator");

        emit SubmissionRejected(bountyId, hunter);
    }
}
