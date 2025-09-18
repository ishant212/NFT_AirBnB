require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

const POLYGON_AMOY_RPC_URL = process.env.POLYGON_AMOY_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";

const networks = {};
if (POLYGON_AMOY_RPC_URL) {
	networks.polygonAmoy = {
		url: POLYGON_AMOY_RPC_URL,
		accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
		chainId: 80002,
	};
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
	solidity: {
		version: "0.8.24",
		settings: { optimizer: { enabled: true, runs: 200 } },
	},
	networks,
	etherscan: {
		apiKey: POLYGONSCAN_API_KEY || undefined,
		customChains: [
			{
				network: "polygonAmoy",
				chainId: 80002,
				urls: {
					apiURL: "https://api-amoy.polygonscan.com/api",
					browserURL: "https://amoy.polygonscan.com",
				},
			},
		],
	},
	mocha: { timeout: 120000 },
};
