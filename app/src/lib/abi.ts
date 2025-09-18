export const RENTAL_MARKETPLACE_ABI = [
	{
		"inputs": [
			{"internalType":"address","name":"nft","type":"address"},
			{"internalType":"uint256","name":"tokenId","type":"uint256"},
			{"internalType":"uint256","name":"pricePerHour","type":"uint256"},
			{"internalType":"address","name":"paymentToken","type":"address"},
			{"internalType":"bool","name":"requireDeposit","type":"bool"},
			{"internalType":"uint16","name":"depositBps","type":"uint16"},
			{"internalType":"uint16","name":"depositCapBps","type":"uint16"}
		],
		"name": "listForRent",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{"internalType":"address","name":"nft","type":"address"},
			{"internalType":"uint256","name":"tokenId","type":"uint256"},
			{"internalType":"uint64","name":"hoursToRent","type":"uint64"}
		],
		"name": "rentWithNative",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{"internalType":"address","name":"nft","type":"address"},
			{"internalType":"uint256","name":"tokenId","type":"uint256"},
			{"internalType":"uint64","name":"hoursToRent","type":"uint64"},
			{"internalType":"uint256","name":"amount","type":"uint256"},
			{"internalType":"address","name":"erc20","type":"address"}
		],
		"name": "rentWithToken",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
] as const;

export const ERC20_ABI = [
	{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"type":"function","stateMutability":"nonpayable"},
	{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"type":"function","stateMutability":"view"}
] as const;
