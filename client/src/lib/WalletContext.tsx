import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { PeraWalletConnect } from "@perawallet/connect";

interface WalletContextType {
  accountAddress: string | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  peraWallet: PeraWalletConnect;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Create PeraWallet instance outside component to persist across renders
const peraWallet = new PeraWalletConnect({
  chainId: 416002, // TestNet
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [accountAddress, setAccountAddress] = useState<string | null>(null);

  useEffect(() => {
    // Reconnect to existing session on mount
    peraWallet
      .reconnectSession()
      .then((accounts) => {
        if (accounts.length) {
          setAccountAddress(accounts[0]);
          peraWallet.connector?.on("disconnect", handleDisconnect);
        }
      })
      .catch((error) => {
        console.error("Failed to reconnect session:", error);
      });
  }, []);

  const handleDisconnect = () => {
    setAccountAddress(null);
  };

  const connectWallet = async () => {
    try {
      const newAccounts = await peraWallet.connect();
      peraWallet.connector?.on("disconnect", handleDisconnect);
      setAccountAddress(newAccounts[0]);
    } catch (error: any) {
      // User closed the modal
      if (error?.data?.type !== "CONNECT_MODAL_CLOSED") {
        console.error("Failed to connect wallet:", error);
      }
    }
  };

  const disconnectWallet = () => {
    peraWallet.disconnect();
    setAccountAddress(null);
  };

  return (
    <WalletContext.Provider
      value={{
        accountAddress,
        isConnected: !!accountAddress,
        connectWallet,
        disconnectWallet,
        peraWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
