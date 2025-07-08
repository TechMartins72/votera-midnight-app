// Create a new file: walletConnection.js
export const loadWalletConnection = async () => {
  try {
    // Dynamic import only loads when actually called
    const { deployVoteraContract } = await import("../logic");
    return deployVoteraContract;
  } catch (error) {
    console.error("Failed to load wallet connection:", error);
    throw new Error("Wallet connection not available in this environment");
  }
};
