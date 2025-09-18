const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Rental flow", function () {
	it("list -> rent native -> sets user", async function () {
		const [owner, renter, fee] = await ethers.getSigners();

		const RentalNFT = await ethers.getContractFactory("RentalNFT");
		const nft = await RentalNFT.deploy("RentNFT", "rNFT", owner.address);
		await nft.waitForDeployment();

		const Market = await ethers.getContractFactory("RentalMarketplace");
		const market = await Market.deploy(owner.address, 500, fee.address);
		await market.waitForDeployment();

		await nft.connect(owner).mint(owner.address);
		await nft.connect(owner).setApprovalForAll(await market.getAddress(), true);

		await market.connect(owner).listForRent(
			await nft.getAddress(),
			1,
			ethers.parseEther("0.01"),
			ethers.ZeroAddress,
			true,
			5000,
			20000
		);

		const total = ethers.parseEther("0.02");
		const deposit = total / 2n;
		await market.connect(renter).rentWithNative(await nft.getAddress(), 1, 2, { value: total + deposit });

		const erc4907 = await ethers.getContractAt("IERC4907", await nft.getAddress());
		expect(await erc4907.userOf(1)).to.eq(renter.address);
	});

	it("USDC: list -> rent with ERC20 -> refund deposit after expiry", async function () {
		const [owner, renter, fee] = await ethers.getSigners();

		const RentalNFT = await ethers.getContractFactory("RentalNFT");
		const nft = await RentalNFT.deploy("RentNFT", "rNFT", owner.address);
		await nft.waitForDeployment();

		const Market = await ethers.getContractFactory("RentalMarketplace");
		const market = await Market.deploy(owner.address, 500, fee.address);
		await market.waitForDeployment();

		const Mock = await ethers.getContractFactory("MockUSDC");
		const usdc = await Mock.deploy();
		await usdc.waitForDeployment();

		await nft.connect(owner).mint(owner.address);
		await nft.connect(owner).setApprovalForAll(await market.getAddress(), true);

		await market.connect(owner).listForRent(
			await nft.getAddress(),
			1,
			ethers.parseUnits("10", 18),
			await usdc.getAddress(),
			true,
			5000,
			20000
		);

		// fund renter and approve
		await usdc.mint(renter.address, ethers.parseUnits("1000", 18));
		await usdc.connect(renter).approve(await market.getAddress(), ethers.MaxUint256);

		const hoursToRent = 2n;
		const total = ethers.parseUnits("10", 18) * hoursToRent;
		const deposit = total / 2n;
		await market.connect(renter).rentWithToken(await nft.getAddress(), 1, Number(hoursToRent), total + deposit, await usdc.getAddress());

		const erc4907 = await ethers.getContractAt("IERC4907", await nft.getAddress());
		expect(await erc4907.userOf(1)).to.eq(renter.address);

		// fast-forward beyond expiry
		await ethers.provider.send("evm_increaseTime", [3 * 3600]);
		await ethers.provider.send("evm_mine", []);

		const before = await usdc.balanceOf(renter.address);
		await market.connect(owner).refundDeposit(await nft.getAddress(), 1);
		const after = await usdc.balanceOf(renter.address);
		expect(after - before).to.eq(deposit);
	});
});
