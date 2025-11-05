import { Magic } from "magic-sdk";

let magic: Magic | null = null;

export function getMagic(): Magic {
  if (typeof window === "undefined") {
    throw new Error("Magic can only be used in the browser");
  }
  
  if (magic) return magic;

  const publishableKey = import.meta.env.VITE_MAGIC_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error(
      "VITE_MAGIC_PUBLISHABLE_KEY is not set. Please add it to your .env file."
    );
  }  magic = new Magic(publishableKey, {
    extensions: [],
  });

  return magic;
}
