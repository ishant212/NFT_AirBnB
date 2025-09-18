import { useEffect, useState } from "react";
import { ethers } from "ethers";
import Nav from "@/components/Nav";
import { RENTAL_MARKETPLACE_ADDRESS } from "@/lib/constants";
import marketplaceArtifact from "../../../artifacts/contracts/RentalMarketplace.sol/RentalMarketplace.json";

export default function Listings() {
	const [items, setItems] = useState<any[]>([]);

	useEffect(() => {
		async function load() {
			if (!RENTAL_MARKETPLACE_ADDRESS) return;
			const provider = new ethers.BrowserProvider((window as any).ethereum);
			const contract = new ethers.Contract(RENTAL_MARKETPLACE_ADDRESS, marketplaceArtifact.abi, await provider.getSigner());
			const filter = contract.filters.Listed();
			const logs = await contract.queryFilter(filter, -50000, "latest");
			const parsed = logs.map((l)=>({
				nft: l.args?.nft,
				tokenId: l.args?.tokenId?.toString?.(),
				owner: l.args?.owner,
				paymentToken: l.args?.paymentToken,
				pricePerHour: l.args?.pricePerHour?.toString?.(),
				requireDeposit: l.args?.requireDeposit,
			}));
			setItems(parsed.reverse());
		}
		load();
	}, []);

	return (
		<div>
			<Nav />
			<main className="max-w-5xl mx-auto p-6 space-y-4">
				<h1 className="text-2xl font-semibold">Recent Listings</h1>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{items.map((it, idx)=> (
						<div key={idx} className="border rounded p-4">
							<div className="text-sm text-gray-500">{it.nft} #{it.tokenId}</div>
							<div className="text-sm">Owner: {it.owner}</div>
							<div className="text-sm">Price/hour: {it.pricePerHour}</div>
							<div className="text-sm">Token: {it.paymentToken === '0x0000000000000000000000000000000000000000' ? 'MATIC' : 'USDC'}</div>
							<div className="text-sm">Deposit required: {it.requireDeposit ? 'Yes' : 'No'}</div>
						</div>
					))}
				</div>
			</main>
		</div>
	);
}
