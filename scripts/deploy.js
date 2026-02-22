// scripts\deploy.js

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying from:", deployer.address);

    const usdc = "0x534b2f3A21130d7a60830c2Df862319e593943A3"; // your USDC
    const platform = deployer.address;

    const Pager = await ethers.getContractFactory("PagerEscrow");
    const contract = await Pager.deploy(usdc, platform);

    await contract.waitForDeployment();

    console.log("PagerEscrow deployed at:", await contract.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
