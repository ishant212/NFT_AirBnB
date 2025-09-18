import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Nav() {
	return (
		<nav className="w-full border-b bg-white/60 backdrop-blur sticky top-0 z-10">
			<div className="max-w-5xl mx-auto flex items-center justify-between p-3">
				<div className="flex items-center gap-4 text-sm">
					<Link href="/" className="font-semibold">NFT Rental</Link>
					<Link href="/list">List</Link>
					<Link href="/rent">Rent</Link>
					<Link href="/listings">Listings</Link>
				</div>
				<ConnectButton />
			</div>
		</nav>
	);
}
