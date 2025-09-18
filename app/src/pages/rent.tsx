import { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { RENTAL_MARKETPLACE_ABI, ERC20_ABI } from "@/lib/abi";
import { RENTAL_MARKETPLACE_ADDRESS, USDC_ADDRESS } from "@/lib/constants";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function RentPage() {
	const { address, isConnected } = useAccount();
	const [nft, setNft] = useState("");
	const [tokenId, setTokenId] = useState("");
	const [hours, setHours] = useState("1");
	const [pricePerHour, setPricePerHour] = useState("");
	const [useUSDC, setUseUSDC] = useState(false);

	const total = useMemo(()=>{
		try { return (BigInt(pricePerHour||"0") * BigInt(hours||"0")); } catch { return 0n; }
	}, [pricePerHour, hours]);
	const deposit = useMemo(()=> total / 2n, [total]);

	const { data: writeHash, isPending, writeContract } = useWriteContract();
	const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: writeHash });

	const { data: allowance } = useReadContract({
		abi: ERC20_ABI,
		address: (USDC_ADDRESS as `0x${string}`),
		functionName: "allowance",
		args: [address ?? "0x0000000000000000000000000000000000000000", RENTAL_MARKETPLACE_ADDRESS as `0x${string}`],
		enabled: Boolean(address && useUSDC),
	});

	const needsApprove = useUSDC && (allowance ? (allowance as bigint) < (total + deposit) : true);

	const onApprove = async () => {
		await writeContract({
			abi: ERC20_ABI,
			address: USDC_ADDRESS as `0x${string}`,
			functionName: "approve",
			args: [RENTAL_MARKETPLACE_ADDRESS as `0x${string}`, total + deposit],
		});
	};

	const onRent = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!RENTAL_MARKETPLACE_ADDRESS) return alert("Marketplace address missing");
		if (useUSDC) {
			await writeContract({
				abi: RENTAL_MARKETPLACE_ABI,
				address: RENTAL_MARKETPLACE_ADDRESS,
				functionName: "rentWithToken",
				args: [nft, BigInt(tokenId), Number(hours), total + deposit, USDC_ADDRESS as `0x${string}`],
			});
		} else {
			await writeContract({
				abi: RENTAL_MARKETPLACE_ABI,
				address: RENTAL_MARKETPLACE_ADDRESS,
				functionName: "rentWithNative",
				args: [nft, BigInt(tokenId), Number(hours)],
				value: total + deposit,
			});
		}
	};

	return (
		<div className="max-w-xl mx-auto p-6 space-y-4">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-semibold">Rent NFT</h1>
				<ConnectButton />
			</div>
			<form onSubmit={onRent} className="space-y-3">
				<input className="w-full border p-2" placeholder="NFT address" value={nft} onChange={(e)=>setNft(e.target.value)} required />
				<input className="w-full border p-2" placeholder="Token ID" value={tokenId} onChange={(e)=>setTokenId(e.target.value)} required />
				<input className="w-full border p-2" placeholder="Price per hour (wei)" value={pricePerHour} onChange={(e)=>setPricePerHour(e.target.value)} required />
				<input className="w-full border p-2" placeholder="Hours" value={hours} onChange={(e)=>setHours(e.target.value)} required />
				<label className="flex items-center gap-2">
					<input type="checkbox" checked={useUSDC} onChange={(e)=>setUseUSDC(e.target.checked)} />
					<span>Pay with USDC</span>
				</label>
				<div className="text-sm">Total: {total.toString()} | Deposit: {deposit.toString()}</div>
				<div className="flex gap-3">
					{useUSDC && needsApprove && (
						<button type="button" onClick={onApprove} disabled={!isConnected || isPending} className="bg-gray-700 text-white px-3 py-2 rounded">Approve</button>
					)}
					<button disabled={!isConnected || isPending} className="bg-blue-600 text-white px-3 py-2 rounded">
						{isPending ? 'Confirm in wallet...' : 'Rent'}
					</button>
				</div>
			</form>
			{writeHash && <p className="text-sm">Tx: {writeHash}</p>}
			{isConfirming && <p>Waiting for confirmation...</p>}
			{isConfirmed && <p className="text-green-700">Rent confirmed.</p>}
		</div>
	);
}
