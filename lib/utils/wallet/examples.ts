/**
 * Petra Wallet Integration Examples
 * Comprehensive examples showing how to use all Petra wallet features
 */

import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { setupPetraEventListeners, Network as PetraNetwork } from "./petra-events";
import {
  signAndSubmitTransaction,
  createCoinTransferTransaction,
  waitForTransaction,
} from "./petra-transactions";
import {
  signMessage,
  verifySignedMessage,
  createSignMessagePayload,
  verifyWalletOwnership,
} from "./petra-signing";

/**
 * Example 1: Setup event listeners to track wallet state changes
 */
export function exampleSetupEventListeners() {
  const listeners = setupPetraEventListeners();

  if (!listeners) {
    console.error("Petra wallet not detected");
    return;
  }

  // Listen for account changes
  listeners.onAccountChange((newAccount) => {
    if (newAccount) {
      console.log("Account changed:", newAccount.address);
      // Update your app state with the new account
    } else {
      console.log("Account disconnected, need to reconnect");
      // Prompt user to reconnect
    }
  });

  // Listen for network changes
  listeners.onNetworkChange((newNetwork) => {
    console.log("Network changed to:", newNetwork);
    // Update your app to use the new network
    if (newNetwork === PetraNetwork.Mainnet) {
      // Switch to mainnet endpoints
    } else if (newNetwork === PetraNetwork.Testnet) {
      // Switch to testnet endpoints
    }
  });

  // Listen for disconnection
  listeners.onDisconnect(() => {
    console.log("Wallet disconnected");
    // Clear your app state
    // Show connect wallet button
  });

  // Get current network
  listeners.getCurrentNetwork().then((network) => {
    console.log("Current network:", network);
  });

  // Get current account
  listeners.getCurrentAccount().then((account) => {
    if (account) {
      console.log("Current account:", account.address);
    }
  });

  // Check if connected
  listeners.isConnected().then((connected) => {
    console.log("Is connected:", connected);
  });
}

/**
 * Example 2: Send APT tokens to another address
 */
export async function exampleSendAPT(recipientAddress: string, amountInOctas: number) {
  try {
    // Create the transaction payload
    const transaction = createCoinTransferTransaction(
      recipientAddress,
      amountInOctas,
      "0x1::aptos_coin::AptosCoin"
    );

    // Sign and submit the transaction
    const pendingTx = await signAndSubmitTransaction(transaction);

    console.log("Transaction submitted:", pendingTx.hash);

    // Wait for the transaction to be confirmed
    const config = new AptosConfig({ network: Network.MAINNET });
    const client = new Aptos(config);

    const result = await waitForTransaction(client, pendingTx.hash, {
      timeoutSecs: 30,
      checkSuccess: true,
    });

    console.log("Transaction confirmed:", result);
    return result;
  } catch (error) {
    console.error("Failed to send APT:", error);
    throw error;
  }
}

/**
 * Example 3: Interact with a custom smart contract
 */
export async function exampleCallSmartContract(
  contractAddress: string,
  moduleName: string,
  functionName: string,
  typeArguments: string[],
  args: (string | number | boolean)[]
) {
  try {
    const transaction = {
      function: `${contractAddress}::${moduleName}::${functionName}`,
      type_arguments: typeArguments,
      arguments: args,
      type: "entry_function_payload" as const,
    };

    const pendingTx = await signAndSubmitTransaction(transaction);

    console.log("Transaction submitted:", pendingTx.hash);

    // Wait for confirmation
    const config = new AptosConfig({ network: Network.MAINNET });
    const client = new Aptos(config);

    const result = await waitForTransaction(client, pendingTx.hash);

    console.log("Transaction confirmed:", result);
    return result;
  } catch (error) {
    console.error("Failed to call smart contract:", error);
    throw error;
  }
}

/**
 * Example 4: Sign a message for authentication
 */
export async function exampleSignForAuth() {
  try {
    const nonce = Math.random().toString(36).substring(7);
    const message = "Sign in to My dApp";

    const payload = createSignMessagePayload(message, nonce, {
      includeAddress: true,
      includeApplication: true,
      includeChainId: true,
    });

    const response = await signMessage(payload);

    console.log("Message signed:", response);
    console.log("Full message:", response.fullMessage);
    console.log("Signature:", response.signature);

    // Send the signature to your backend for verification
    return response;
  } catch (error) {
    console.error("Failed to sign message:", error);
    throw error;
  }
}

/**
 * Example 5: Verify a signed message
 */
export async function exampleVerifySignature() {
  try {
    const message = "Verify my wallet ownership";
    const nonce = Math.random().toString(36).substring(7);

    const { verified, response } = await verifySignedMessage(message, nonce);

    if (verified) {
      console.log("Signature is valid!");
      console.log("Signed by:", response?.address);
      return true;
    } else {
      console.log("Signature is invalid!");
      return false;
    }
  } catch (error) {
    console.error("Failed to verify signature:", error);
    return false;
  }
}

/**
 * Example 6: Verify wallet ownership (e.g., for access control)
 */
export async function exampleAccessControl(expectedAddress: string) {
  try {
    const isOwner = await verifyWalletOwnership(
      expectedAddress,
      "Verify ownership to access premium features"
    );

    if (isOwner) {
      console.log("Wallet ownership verified!");
      // Grant access to premium features
      return true;
    } else {
      console.log("Wallet ownership verification failed!");
      // Deny access
      return false;
    }
  } catch (error) {
    console.error("Failed to verify wallet ownership:", error);
    return false;
  }
}

/**
 * Example 7: React component with event listeners
 */
export function ExampleReactComponent() {
  // This is a conceptual example - adapt to your React setup
  /*
  import { useEffect, useState } from 'react';

  function WalletMonitor() {
    const [account, setAccount] = useState<string | null>(null);
    const [network, setNetwork] = useState<PetraNetwork | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
      const listeners = setupPetraEventListeners();

      if (!listeners) return;

      // Setup event listeners
      listeners.onAccountChange((newAccount) => {
        if (newAccount) {
          setAccount(newAccount.address);
          setConnected(true);
        } else {
          setAccount(null);
          setConnected(false);
        }
      });

      listeners.onNetworkChange((newNetwork) => {
        setNetwork(newNetwork);
      });

      listeners.onDisconnect(() => {
        setAccount(null);
        setConnected(false);
      });

      // Get initial state
      listeners.getCurrentAccount().then((acc) => {
        if (acc) setAccount(acc.address);
      });

      listeners.getCurrentNetwork().then((net) => {
        setNetwork(net);
      });

      listeners.isConnected().then((conn) => {
        setConnected(conn);
      });
    }, []);

    return (
      <div>
        <p>Connected: {connected ? 'Yes' : 'No'}</p>
        <p>Account: {account || 'None'}</p>
        <p>Network: {network || 'Unknown'}</p>
      </div>
    );
  }
  */
}

/**
 * Example 8: Send custom tokens (not APT)
 */
export async function exampleSendCustomToken(
  recipientAddress: string,
  amount: number,
  tokenType: string // e.g., '0x1234::my_token::MyToken'
) {
  try {
    const transaction = createCoinTransferTransaction(recipientAddress, amount, tokenType);

    const pendingTx = await signAndSubmitTransaction(transaction);

    console.log("Custom token transfer submitted:", pendingTx.hash);

    const config = new AptosConfig({ network: Network.MAINNET });
    const client = new Aptos(config);

    const result = await waitForTransaction(client, pendingTx.hash);

    console.log("Custom token transfer confirmed:", result);
    return result;
  } catch (error) {
    console.error("Failed to send custom token:", error);
    throw error;
  }
}
