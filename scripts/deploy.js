const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
	const [deployer] = await ethers.getSigners();
	console.log("Deployer:", deployer.address);

	const feeBps = Number(process.env.PLATFORM_FEE_BPS || 500);
	const feeRecipient = process.env.FEE_RECEIVER || deployer.address;

	const RentalNFT = await ethers.getContractFactory("RentalNFT");
	const nft = await RentalNFT.deploy("RentNFT", "rNFT", deployer.address);
	await nft.waitForDeployment();
	const nftAddress = await nft.getAddress();
	console.log("RentalNFT:", nftAddress);

	const Market = await ethers.getContractFactory("RentalMarketplace");
	const market = await Market.deploy(deployer.address, feeBps, feeRecipient);
	await market.waitForDeployment();
	const marketAddress = await market.getAddress();
	console.log("Marketplace:", marketAddress);

	const outDir = path.join(__dirname, "..", "deployments");
	if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
	const outFile = path.join(outDir, `${network.name}.json`);
	fs.writeFileSync(outFile, JSON.stringify({ RentalNFT: nftAddress, RentalMarketplace: marketAddress }, null, 2));
	console.log("Saved addresses to:", outFile);
}

main().catch((e) => { console.error(e); process.exit(1); });
