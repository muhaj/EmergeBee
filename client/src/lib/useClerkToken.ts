import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";

// Store the token globally for the query client to access
export function useClerkToken() {
  const { getToken, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    // Update the token whenever it changes
    const updateToken = async () => {
      try {
        const token = await getToken();
        if (typeof window !== 'undefined') {
          (window as any).__clerk_session_token = token;
        }
      } catch (error) {
        if (typeof window !== 'undefined') {
          (window as any).__clerk_session_token = null;
        }
      }
    };

    updateToken();

    // Update token every 30 seconds to keep it fresh
    const interval = setInterval(updateToken, 30000);

    return () => clearInterval(interval);
  }, [getToken, isLoaded]);
}
