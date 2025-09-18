import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { RENTAL_MARKETPLACE_ABI } from "@/lib/abi";
import { RENTAL_MARKETPLACE_ADDRESS, USDC_ADDRESS } from "@/lib/constants";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function ListPage() {
	const { address, isConnected } = useAccount();
	const [nft, setNft] = useState("");
	const [tokenId, setTokenId] = useState("");
	const [pricePerHour, setPricePerHour] = useState("");
	const [paymentToken, setPaymentToken] = useState<"native"|"usdc">("native");
	const [requireDeposit, setRequireDeposit] = useState(true);
	const [depositBps, setDepositBps] = useState(5000);
	const [depositCapBps, setDepositCapBps] = useState(20000);

	const { data: hash, isPending, writeContract } = useWriteContract();
	const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!RENTAL_MARKETPLACE_ADDRESS) return alert("Marketplace address missing");
		await writeContract({
			abi: RENTAL_MARKETPLACE_ABI,
			address: RENTAL_MARKETPLACE_ADDRESS,
			functionName: "listForRent",
			args: [
				nft,
				BigInt(tokenId),
				BigInt(pricePerHour),
				paymentToken === "native" ? "0x0000000000000000000000000000000000000000" : (USDC_ADDRESS as `0x${string}`),
				requireDeposit,
				depositBps,
				depositCapBps,
			],
		});
	};

	return (
		<div className="max-w-xl mx-auto p-6 space-y-4">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-semibold">List NFT for Rent</h1>
				<ConnectButton />
			</div>
			<form onSubmit={onSubmit} className="space-y-3">
				<input className="w-full border p-2" placeholder="NFT address" value={nft} onChange={(e)=>setNft(e.target.value)} required />
				<input className="w-full border p-2" placeholder="Token ID" value={tokenId} onChange={(e)=>setTokenId(e.target.value)} required />
				<input className="w-full border p-2" placeholder="Price per hour (wei)" value={pricePerHour} onChange={(e)=>setPricePerHour(e.target.value)} required />
				<div className="flex gap-4">
					<label className="flex items-center gap-2">
						<input type="radio" checked={paymentToken==='native'} onChange={()=>setPaymentToken('native')} />
						<span>Native (MATIC)</span>
					</label>
					<label className="flex items-center gap-2">
						<input type="radio" checked={paymentToken==='usdc'} onChange={()=>setPaymentToken('usdc')} />
						<span>USDC</span>
					</label>
				</div>
				<label className="flex items-center gap-2">
					<input type="checkbox" checked={requireDeposit} onChange={(e)=>setRequireDeposit(e.target.checked)} />
					<span>Require deposit</span>
				</label>
				<div className="grid grid-cols-2 gap-3">
					<input className="border p-2" placeholder="Deposit Bps (default 5000)" value={depositBps} onChange={(e)=>setDepositBps(Number(e.target.value||0))} />
					<input className="border p-2" placeholder="Deposit Cap Bps (default 20000)" value={depositCapBps} onChange={(e)=>setDepositCapBps(Number(e.target.value||0))} />
				</div>
				<button disabled={!isConnected || isPending} className="w-full bg-blue-600 text-white p-2 rounded">
					{isPending ? 'Confirm in wallet...' : 'List'}
				</button>
			</form>
			{hash && <p className="text-sm">Tx: {hash}</p>}
			{isConfirming && <p>Waiting for confirmation...</p>}
			{isConfirmed && <p className="text-green-700">Listing confirmed.</p>}
		</div>
	);
}
