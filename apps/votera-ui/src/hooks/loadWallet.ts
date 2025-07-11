export const loadWalletConnection = async () => {
  try {
    console.log("Load wallet connection block");
    const { deployOrJoinContract } = await import("../logic");
    return deployOrJoinContract;
  } catch (error) {
    console.log("Load wallet connection error block");
    console.error("Failed to load wallet connection:", error);
    throw new Error("Wallet connection not available in this environment");
  }
};
