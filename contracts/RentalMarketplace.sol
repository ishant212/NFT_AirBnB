// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC4907} from "./IERC4907.sol";

contract RentalMarketplace is ReentrancyGuard, Pausable, Ownable {
	struct Listing {
		address owner;
		address paymentToken; // address(0) native
		uint256 pricePerHour;
		bool requireDeposit;
		uint16 depositBps; // default 5000
		uint16 depositCapBps; // default 20000
		bool active;
	}

	struct HeldDeposit {
		address renter;
		address token; // address(0) native
		uint256 amount;
	}

	uint16 public platformFeeBps; // 5% = 500
	address public feeRecipient;
	uint64 public minHours = 1;
	uint64 public maxHours = 720;

	mapping(bytes32 => Listing) public listings;
	mapping(bytes32 => HeldDeposit) public deposits;

	event Listed(address indexed nft, uint256 indexed tokenId, address indexed owner, address paymentToken, uint256 pricePerHour, bool requireDeposit);
	event Delisted(address indexed nft, uint256 indexed tokenId, address indexed owner);
	event Rented(address indexed nft, uint256 indexed tokenId, address indexed renter, uint64 hoursRented, uint256 totalPaid, address paymentToken, uint256 depositAmount);
	event DepositRefunded(address indexed nft, uint256 indexed tokenId, address indexed renter, address token, uint256 amount);
	event DepositClaimed(address indexed nft, uint256 indexed tokenId, address indexed owner, address token, uint256 amount);
	event FeeParamsUpdated(uint16 feeBps, address feeRecipient);
	event LimitsUpdated(uint64 minHours, uint64 maxHours);

	constructor(address owner_, uint16 platformFeeBps_, address feeRecipient_) Ownable(owner_) {
		require(feeRecipient_ != address(0), "fee recipient zero");
		require(platformFeeBps_ <= 2000, "fee too high");
		platformFeeBps = platformFeeBps_;
		feeRecipient = feeRecipient_;
	}

	function _key(address nft, uint256 tokenId) internal pure returns (bytes32) { return keccak256(abi.encodePacked(nft, tokenId)); }

	function listForRent(address nft, uint256 tokenId, uint256 pricePerHour, address paymentToken, bool requireDeposit, uint16 depositBps, uint16 depositCapBps) external whenNotPaused {
		require(pricePerHour > 0, "price=0");
		require(IERC721(nft).ownerOf(tokenId) == msg.sender, "not owner");
		require(IERC721(nft).isApprovedForAll(msg.sender, address(this)) || IERC721(nft).getApproved(tokenId) == address(this), "approve marketplace");
		bytes32 k = _key(nft, tokenId);
		listings[k] = Listing({
			owner: msg.sender,
			paymentToken: paymentToken,
			pricePerHour: pricePerHour,
			requireDeposit: requireDeposit,
			depositBps: depositBps == 0 ? 5000 : depositBps,
			depositCapBps: depositCapBps == 0 ? 20000 : depositCapBps,
			active: true
		});
		emit Listed(nft, tokenId, msg.sender, paymentToken, pricePerHour, requireDeposit);
	}

	function delist(address nft, uint256 tokenId) external {
		bytes32 k = _key(nft, tokenId);
		Listing memory l = listings[k];
		require(l.active, "not listed");
		require(l.owner == msg.sender, "not owner");
		require(deposits[k].amount == 0, "active deposit");
		delete listings[k];
		emit Delisted(nft, tokenId, msg.sender);
	}

	function setFeeParams(uint16 feeBps, address recipient) external onlyOwner {
		require(feeBps <= 2000, "fee too high");
		require(recipient != address(0), "zero recipient");
		platformFeeBps = feeBps;
		feeRecipient = recipient;
		emit FeeParamsUpdated(feeBps, recipient);
	}

	function setHourLimits(uint64 minH, uint64 maxH) external onlyOwner {
		require(minH >= 1 && maxH >= minH, "invalid limits");
		minHours = minH;
		maxHours = maxH;
		emit LimitsUpdated(minH, maxH);
	}

	function pause() external onlyOwner { _pause(); }
	function unpause() external onlyOwner { _unpause(); }

	function _calcDeposit(Listing memory l, uint256 total) internal pure returns (uint256) {
		if (!l.requireDeposit) return 0;
		uint256 byBps = (total * l.depositBps) / 10000;
		uint256 cap = (total * l.depositCapBps) / 10000;
		return byBps < cap ? byBps : cap;
	}

	function rentWithNative(address nft, uint256 tokenId, uint64 hoursToRent) external payable nonReentrant whenNotPaused {
		require(hoursToRent >= minHours && hoursToRent <= maxHours, "hours out of range");
		bytes32 k = _key(nft, tokenId);
		Listing memory l = listings[k];
		require(l.active, "not listed");
		require(l.paymentToken == address(0), "use token method");
		require(deposits[k].amount == 0, "already rented");
		uint256 total = l.pricePerHour * hoursToRent;
		uint256 depositAmt = _calcDeposit(l, total);
		require(msg.value == total + depositAmt, "bad msg.value");

		uint256 fee = (total * platformFeeBps) / 10000;
		uint256 toOwner = total - fee;

		uint64 expires = uint64(block.timestamp + hoursToRent * 1 hours);
		IERC4907(nft).setUser(tokenId, msg.sender, expires);

		(bool s1, ) = feeRecipient.call{value: fee}(""); require(s1, "fee xfer");
		(bool s2, ) = l.owner.call{value: toOwner}(""); require(s2, "owner xfer");

		if (depositAmt > 0) {
			deposits[k] = HeldDeposit({ renter: msg.sender, token: address(0), amount: depositAmt });
		}

		emit Rented(nft, tokenId, msg.sender, hoursToRent, total, address(0), depositAmt);
	}

	function rentWithToken(address nft, uint256 tokenId, uint64 hoursToRent, uint256 amount, address erc20) external nonReentrant whenNotPaused {
		require(hoursToRent >= minHours && hoursToRent <= maxHours, "hours out of range");
		bytes32 k = _key(nft, tokenId);
		Listing memory l = listings[k];
		require(l.active, "not listed");
		require(l.paymentToken == erc20, "wrong token");
		require(deposits[k].amount == 0, "already rented");
		uint256 total = l.pricePerHour * hoursToRent;
		uint256 depositAmt = _calcDeposit(l, total);
		require(amount == total + depositAmt, "bad amount");

		uint256 fee = (total * platformFeeBps) / 10000;
		uint256 toOwner = total - fee;

		IERC20 token = IERC20(erc20);
		require(token.transferFrom(msg.sender, feeRecipient, fee), "fee xfer");
		require(token.transferFrom(msg.sender, l.owner, toOwner), "owner xfer");
		if (depositAmt > 0) {
			require(token.transferFrom(msg.sender, address(this), depositAmt), "deposit xfer");
			deposits[k] = HeldDeposit({ renter: msg.sender, token: erc20, amount: depositAmt });
		}

		uint64 expires = uint64(block.timestamp + hoursToRent * 1 hours);
		IERC4907(nft).setUser(tokenId, msg.sender, expires);

		emit Rented(nft, tokenId, msg.sender, hoursToRent, total, erc20, depositAmt);
	}

	function refundDeposit(address nft, uint256 tokenId) external nonReentrant {
		bytes32 k = _key(nft, tokenId);
		Listing memory l = listings[k];
		require(l.active, "not listed");
		require(l.owner == msg.sender, "not owner");
		HeldDeposit memory hd = deposits[k];
		require(hd.amount > 0, "no deposit");
		require(IERC4907(nft).userOf(tokenId) == address(0), "not expired");

		delete deposits[k];
		if (hd.token == address(0)) {
			(bool s, ) = hd.renter.call{value: hd.amount}(""); require(s, "refund failed");
		} else {
			require(IERC20(hd.token).transfer(hd.renter, hd.amount), "refund failed");
		}
		emit DepositRefunded(nft, tokenId, hd.renter, hd.token, hd.amount);
	}

	function claimDeposit(address nft, uint256 tokenId) external nonReentrant {
		bytes32 k = _key(nft, tokenId);
		Listing memory l = listings[k];
		require(l.active, "not listed");
		require(l.owner == msg.sender, "not owner");
		HeldDeposit memory hd = deposits[k];
		require(hd.amount > 0, "no deposit");
		require(IERC4907(nft).userOf(tokenId) == address(0), "not expired");

		delete deposits[k];
		if (hd.token == address(0)) {
			(bool s, ) = l.owner.call{value: hd.amount}(""); require(s, "claim failed");
		} else {
			require(IERC20(hd.token).transfer(l.owner, hd.amount), "claim failed");
		}
		emit DepositClaimed(nft, tokenId, l.owner, hd.token, hd.amount);
	}
}
