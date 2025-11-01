/**
 * ENS (Ethereum Name Service) utilities
 * Resolves Ethereum addresses to ENS names using viem
 */

import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

// List of RPC endpoints to try in order
// Infura is prioritized when configured as it's the most reliable
const RPC_ENDPOINTS = [
  // Use Infura first if configured (recommended)
  ...(import.meta.env.VITE_ETHEREUM_RPC_URL ? [import.meta.env.VITE_ETHEREUM_RPC_URL] : []),
  // Fallback to public endpoints
  'https://cloudflare-eth.com',
  'https://eth.llamarpc.com',
  'https://rpc.ankr.com/eth'
];

/**
 * Lookup ENS name for an Ethereum address
 * Returns null if no ENS name is found or if lookup fails
 * 
 * Tries multiple RPC endpoints as fallbacks for reliability
 */
export async function lookupENSName(address: string): Promise<string | null> {
  if (!address || !address.startsWith('0x')) {
    return null;
  }

  console.log('Looking up ENS name for:', address);
  
  // Try each RPC endpoint in order
  for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
    const rpcUrl = RPC_ENDPOINTS[i];
    
    try {
      const rpcLabel = rpcUrl.includes('infura') ? 'Infura' : 
                       rpcUrl.includes('cloudflare') ? 'Cloudflare' :
                       rpcUrl.includes('llama') ? 'LlamaRPC' :
                       rpcUrl.includes('ankr') ? 'Ankr' : 'Custom RPC';
      
      console.log(`Trying ENS lookup with ${rpcLabel} (${i + 1}/${RPC_ENDPOINTS.length})`);
      
      // Create a client for this specific RPC
      const publicClient = createPublicClient({
        chain: mainnet,
        transport: http(rpcUrl, {
          timeout: 5000, // 5 second timeout
        }),
      });
      
      // Try the ENS lookup with a timeout
      const ensNamePromise = publicClient.getEnsName({
        address: address as `0x${string}`,
      });
      
      const timeoutPromise = new Promise<'timeout'>((resolve) => {
        setTimeout(() => {
          resolve('timeout');
        }, 5000);
      });
      
      const result = await Promise.race([ensNamePromise, timeoutPromise]);
      
      if (result === 'timeout') {
        console.warn(`ENS lookup timed out for ${rpcLabel}`);
        // Continue to next RPC
        continue;
      }
      
      if (result) {
        console.log('Found ENS name:', result);
        return result;
      }
      
      // If we got null from the first RPC, it might mean no ENS name exists
      // But let's try at least one more RPC to be sure
      if (i === 0) {
        console.log('First RPC returned no ENS name, trying backup RPC...');
        continue;
      }
      
      // If second RPC also returns null, there's probably no ENS name
      console.log('No ENS name found for:', address);
      return null;
      
    } catch (error: any) {
      console.warn(`ENS lookup failed with RPC ${i + 1}:`, error.message || error);
      // Continue to next RPC endpoint
      continue;
    }
  }

  // All RPC endpoints failed or timed out
  console.warn('ENS lookup failed with all RPC endpoints');
  return null;
}

/**
 * Format display name - use ENS if available, otherwise truncated address
 */
export function formatDisplayName(address: string, ensName: string | null): string {
  if (ensName) {
    return ensName;
  }
  
  if (!address || address.length < 10) {
    return address;
  }
  
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}
