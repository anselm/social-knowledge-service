<script lang="ts">

  import { getMagic } from "@/lib/magic";
  import { verifyMessage } from "@/lib/siweVerify";
  import { lookupENSName } from "@/lib/ens";
  import { authStore } from "@/stores/auth";
  import { authService } from "@/services/authService";

  import RouterLink from "./components/RouterLink.svelte";

  let error = $state("");
  let loading = $state(false);
  let lookingUpENS = $state(false);

  function getDisplayName(auth: any): string {
    if (!auth) return ''
    if (auth.type === 'siwe') {
      if (auth.ensName) {
        return auth.ensName;
      }
      if (auth.address) {
        return `${auth.address.substring(0, 6)}...${auth.address.substring(auth.address.length - 4)}`
      }
    }
    if (auth.type === 'magic' && auth.email) {
      return auth.email
    }
    return 'User'
  }

  async function connectMetamask() {
    error = "";
    loading = true;
    
    try {
      // @ts-ignore
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
      }

      // @ts-ignore
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const account = accounts?.[0];
      if (!account) throw new Error("No account found");

      // Get a nonce from the server
      const nonce = await authService.getNonce();
      const domain = window.location.host;
      const uri = window.location.origin;
      const statement = "Sign in with Ethereum to the app.";
      const version = "1";
      const chainId = 1;

      const message = [
        `${domain} wants you to sign in with your Ethereum account:`,
        account,
        "",
        statement,
        "",
        `URI: ${uri}`,
        `Version: ${version}`,
        `Chain ID: ${chainId}`,
        `Nonce: ${nonce}`,
        `Issued At: ${new Date().toISOString()}`,
      ].join("\n");

      // @ts-ignore
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, account],
      });

      // Verify the signature client-side
      const isValid = await verifyMessage(message, signature, account);
      
      if (!isValid) {
        throw new Error("Signature verification failed");
      }

      // Try to look up ENS name (optional, won't block login if it fails)
      let ensName: string | null = null;
      try {
        lookingUpENS = true;
        ensName = await lookupENSName(account);
      } catch (ensError: any) {
        // ENS lookup failed, but that's okay - just log it
        console.warn('ENS lookup failed, continuing without it:', ensError.message || ensError);
      } finally {
        lookingUpENS = false;
      }

      // Authenticate with the server using the new auth flow
      const result = await authStore.loginWithSiwe({
        message,
        signature,
        nonce,
        address: account
      });

      if (!result.success) {
        throw new Error(result.error || 'Authentication failed');
      }

      // Check if user needs to create a party
      if (result.needsParty) {
        // TODO: Show party creation UI or redirect to signup
        console.log('User needs to create a party');
        // For now, we'll still consider this a successful login
        // The app will handle the party creation requirement elsewhere
      }
      
      // Success - user can now click "Back to Home" button
      
    } catch (e: any) {
      console.error('MetaMask error:', e);
      error = e?.message || String(e);
      lookingUpENS = false;
    } finally {
      loading = false;
    }
  }

  async function loginWithMagic() {
    error = "";
    loading = true;
    
    try {
      const magic = getMagic();

      if (!import.meta.env.VITE_MAGIC_PUBLISHABLE_KEY) {
        throw new Error("Magic.link is not configured. Please set MAGIC_PUBLISHABLE_KEY.");
      }

      const userEmail = window.prompt("Enter your email for a login link / OTP:");
      if (!userEmail) {
        loading = false;
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userEmail)) {
        throw new Error("Please enter a valid email address");
      }

      const res = await magic.auth.loginWithEmailOTP({ email: userEmail });
      if (!res) throw new Error("Magic login canceled");

      // Get the DID token (we'll send this to server for verification)
      const didToken = await magic.user.getIdToken();
      
      // Authenticate with the server using the new auth flow
      const result = await authStore.loginWithMagic(didToken);

      if (!result.success) {
        throw new Error(result.error || 'Authentication failed');
      }

      // Check if user needs to create a party
      if (result.needsParty) {
        // TODO: Show party creation UI or redirect to signup
        console.log('User needs to create a party');
        // For now, we'll still consider this a successful login
        // The app will handle the party creation requirement elsewhere
      }
      
      // Success - user can now click "Back to Home" button
      
    } catch (e: any) {
      console.error('Magic error:', e);
      error = e?.message || String(e);
    } finally {
      loading = false;
    }
  }

  async function handleLogout() {
    if ($authStore?.type === 'magic') {
      try {
        const magic = getMagic();
        await magic.user.logout();
      } catch (e) {
        console.error('Magic logout error:', e);
      }
    }
    authStore.logout();
  }
</script>

<div class="max-w-2xl mx-auto">
  {#if $authStore}
    <!-- Already logged in -->
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold mb-2">You're Signed In</h1>
        <p class="text-white/60">You are currently authenticated</p>
      </div>

      <div class="p-6 bg-white/5 rounded-lg border border-white/10">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-white/60 mb-1">Signed in as</div>
            <div class="text-lg font-semibold">{getDisplayName($authStore)}</div>
            {#if $authStore.type === 'siwe' && $authStore.address && $authStore.ensName}
              <div class="text-xs text-white/40 mt-1">
                {$authStore.address.substring(0, 6)}...{$authStore.address.substring($authStore.address.length - 4)}
              </div>
            {/if}
            <div class="text-xs text-white/40 mt-1">
              {$authStore.type === 'siwe' ? 'MetaMask (SIWE)' : 'Magic.link Email'}
            </div>
          </div>
          <button
            onclick={handleLogout}
            class="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div class="flex gap-4">
        <RouterLink 
          to="/" 
          className="px-6 py-3 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors"
        >
          {#snippet children()}
            ← Back to Home
          {/snippet}
        </RouterLink>
      </div>
    </div>
  {:else}
    <!-- Not logged in -->
    <div>
      <h1 class="text-3xl font-bold mb-2">Sign In</h1>
      <p class="text-white/60 mb-8">Choose your preferred authentication method</p>

      <div class="space-y-4">
        <button 
          onclick={connectMetamask}
          disabled={loading}
          class="w-full px-6 py-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
        >
          {#if loading || lookingUpENS}
            <span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {lookingUpENS ? 'Looking up ENS name...' : 'Connecting...'}
          {:else}
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.05 11.52l-3.88-6.7c-.34-.59-.98-.95-1.67-.95H7.5c-.69 0-1.33.36-1.67.95l-3.88 6.7c-.34.59-.34 1.31 0 1.9l3.88 6.7c.34.59.98.95 1.67.95h9c.69 0 1.33-.36 1.67-.95l3.88-6.7c.34-.59.34-1.31 0-1.9zM12 16.5c-2.48 0-4.5-2.02-4.5-4.5S9.52 7.5 12 7.5s4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5z"/>
            </svg>
            Sign in with MetaMask
          {/if}
        </button>
        
        <button 
          onclick={loginWithMagic}
          disabled={loading}
          class="w-full px-6 py-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
        >
          {#if loading}
            <span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Connecting...
          {:else}
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            Continue with Email
          {/if}
        </button>

        {#if error}
          <div class="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p class="text-red-400 text-sm">⚠️ {error}</p>
          </div>
        {/if}
      </div>

      <div class="mt-12 p-6 bg-white/5 rounded-lg border border-white/10">
        <h2 class="text-lg font-semibold mb-3">About Authentication</h2>
        <div class="space-y-3 text-sm text-white/70">
          <div>
            <strong class="text-white/90">MetaMask (SIWE):</strong>
            <p class="mt-1">Sign in with your Ethereum wallet using the Sign-In with Ethereum standard. Your signature is verified client-side for instant authentication. ENS names are looked up automatically when available.</p>
          </div>
          <div>
            <strong class="text-white/90">Magic (Email):</strong>
            <p class="mt-1">Passwordless authentication via email. You'll receive a one-time code or magic link to sign in securely.</p>
          </div>
          <div class="pt-3 border-t border-white/10">
            <strong class="text-white/90">Privacy:</strong>
            <p class="mt-1">Your credentials are verified locally and only sent to the server when you perform authenticated operations.</p>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
