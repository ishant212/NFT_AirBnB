import Nav from "@/components/Nav";
import Link from "next/link";

export default function Home() {
	return (
		<div>
			<Nav />
			<main className="max-w-5xl mx-auto p-6 space-y-6">
				<h1 className="text-3xl font-semibold">Welcome to NFT Rental</h1>
				<p className="text-gray-600">List your ERC-4907 NFTs and let renters use them temporarily without transferring ownership.</p>
				<div className="flex gap-4">
					<Link href="/list" className="bg-blue-600 text-white px-4 py-2 rounded">List an NFT</Link>
					<Link href="/rent" className="bg-gray-800 text-white px-4 py-2 rounded">Rent an NFT</Link>
				</div>
			</main>
		</div>
	);
}
