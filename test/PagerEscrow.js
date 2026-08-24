const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("PagerEscrow", function () {
  const AMOUNT = 1_000_000n;
  const ONE_HOUR = 60 * 60;
  const ONE_DAY = 24 * 60 * 60;

  async function deployFixture() {
    const [creator, hunter, platform, otherAccount] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("MockERC20");
    const token = await Token.deploy();
    const Escrow = await ethers.getContractFactory("PagerEscrow");
    const escrow = await Escrow.deploy(token.target, platform.address);

    await token.mint(creator.address, AMOUNT * 2n);
    await token.connect(creator).approve(escrow.target, AMOUNT * 2n);

    return { creator, hunter, platform, otherAccount, token, escrow };
  }

  async function createBounty(escrow, creator, amount = AMOUNT) {
    const deadline = (await time.latest()) + ONE_DAY;
    await escrow.connect(creator).createBounty(amount, deadline);
    return { deadline };
  }

  describe("creation", function () {
    it("locks funds and stores the creator, amount, active state, and deadline", async function () {
      const { creator, token, escrow } = await loadFixture(deployFixture);
      const { deadline } = await createBounty(escrow, creator);
      const bounty = await escrow.bounties(1);

      expect(bounty.creator).to.equal(creator.address);
      expect(bounty.amount).to.equal(AMOUNT);
      expect(bounty.active).to.equal(true);
      expect(bounty.deadline).to.equal(deadline);
      expect(await token.balanceOf(escrow.target)).to.equal(AMOUNT);
    });

    it("rejects deadlines outside the one-hour to seven-day window", async function () {
      const { creator, escrow } = await loadFixture(deployFixture);
      const now = await time.latest();

      await expect(escrow.connect(creator).createBounty(AMOUNT, now + ONE_HOUR - 1))
        .to.be.revertedWith("Deadline too soon");
      await expect(escrow.connect(creator).createBounty(AMOUNT, now + 7 * ONE_DAY + 10))
        .to.be.revertedWith("Deadline too far");
    });
  });

  describe("approval", function () {
    it("pays the hunter 98% and platform 2%, then deactivates the bounty", async function () {
      const { creator, hunter, platform, token, escrow } = await loadFixture(deployFixture);
      await createBounty(escrow, creator);

      await expect(escrow.connect(creator).approveBounty(1, hunter.address))
        .to.emit(escrow, "BountyApproved")
        .withArgs(1, hunter.address, AMOUNT);

      expect(await token.balanceOf(hunter.address)).to.equal(980_000n);
      expect(await token.balanceOf(platform.address)).to.equal(20_000n);
      expect((await escrow.bounties(1)).active).to.equal(false);
    });

    it("allows only the creator to approve and prevents a second approval", async function () {
      const { creator, hunter, otherAccount, escrow } = await loadFixture(deployFixture);
      await createBounty(escrow, creator);

      await expect(escrow.connect(otherAccount).approveBounty(1, hunter.address))
        .to.be.revertedWith("Not creator");
      await escrow.connect(creator).approveBounty(1, hunter.address);
      await expect(escrow.connect(creator).approveBounty(1, hunter.address))
        .to.be.revertedWith("Inactive");
    });
  });

  describe("refund and rejection", function () {
    it("rejects a submission without closing or moving bounty funds", async function () {
      const { creator, hunter, token, escrow } = await loadFixture(deployFixture);
      await createBounty(escrow, creator);

      await expect(escrow.connect(creator).reject(1, hunter.address))
        .to.emit(escrow, "SubmissionRejected")
        .withArgs(1, hunter.address);

      expect((await escrow.bounties(1)).active).to.equal(true);
      expect(await token.balanceOf(escrow.target)).to.equal(AMOUNT);
    });

    it("refunds only after expiry and only to the creator", async function () {
      const { creator, otherAccount, token, escrow } = await loadFixture(deployFixture);
      const { deadline } = await createBounty(escrow, creator);

      await expect(escrow.connect(creator).refundExpired(1))
        .to.be.revertedWith("Not expired");
      await time.increaseTo(deadline + 1);
      await expect(escrow.connect(otherAccount).refundExpired(1))
        .to.be.revertedWith("Not creator");

      await expect(escrow.connect(creator).refundExpired(1))
        .to.emit(escrow, "BountyRefunded")
        .withArgs(1, creator.address, AMOUNT);

      expect(await token.balanceOf(creator.address)).to.equal(AMOUNT * 2n);
      expect(await token.balanceOf(escrow.target)).to.equal(0n);
      expect((await escrow.bounties(1)).active).to.equal(false);
    });
  });
});