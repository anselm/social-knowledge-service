import { Web3AuthNoModal } from "@web3auth/no-modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { CHAIN_NAMESPACES } from "@web3auth/base";

let w3a: Web3AuthNoModal | null = null;

export async function getWeb3Auth() {
  if (typeof window === "undefined") throw new Error("client only");
  if (w3a) return w3a;

  w3a = new Web3AuthNoModal({
    clientId: import.meta.env.VITE_WEB3AUTH_CLIENT_ID,
    web3AuthNetwork: "sapphire_mainnet", // or testnet per your setup
    chainConfig: {
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      chainId: "0x1", // or your chain
      rpcTarget: "https://rpc.ankr.com/eth", // or your RPC
    }
  });

  const openloginAdapter = new OpenloginAdapter({
    adapterSettings: {
      uxMode: "popup", // or "redirect"
      loginConfig: { /* optional customizations */ }
    }
  });
  w3a.configureAdapter(openloginAdapter);

  await w3a.init(); // important: must be awaited on client
  return w3a;
}
