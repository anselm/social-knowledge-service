export async function fetchNonce(): Promise<string> {
  const baseURL = import.meta.env.API_BASE_URL || '';
  const r = await fetch(baseURL + "/api/nonce", { credentials: "include" });
  if (!r.ok) throw new Error(`Failed to fetch nonce: ${r.status}`);
  const { nonce } = await r.json();
  return nonce;
}

export function buildSiweMessage(address: string, nonce: string): string {
  const domain = window.location.host;
  const uri = window.location.origin;
  const statement = "Sign in with Ethereum to the app.";
  const version = "1";
  const chainId = 1;

  return [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    "",
    statement,
    "",
    `URI: ${uri}`,
    `Version: ${version}`,
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${new Date().toISOString()}`,
  ].join("\n");
}
