import "@/styles/globals.css";
import type { AppProps } from "next/app";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { polygonAmoy } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const config = getDefaultConfig({
	appName: "NFT Rental",
	projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID || "demo",
	chains: [polygonAmoy],
	syncConnectedChain: true,
});

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
	return (
		<WagmiProvider config={config}>
			<QueryClientProvider client={queryClient}>
				<RainbowKitProvider>
					<Component {...pageProps} />
				</RainbowKitProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
}
