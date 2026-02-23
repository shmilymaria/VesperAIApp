import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profilePictureUrl: string | null;
}

interface AuthContextType {
  signIn: (token: string, user?: AuthUser | null) => Promise<void>;
  signOut: () => Promise<void>;
  session: string | null;
  user: AuthUser | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  signIn: async () => {},
  signOut: async () => {},
  session: null,
  user: null,
  isLoading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Attempt to read the session from secure storage on mount
    SecureStore.getItemAsync("vesper_session")
      .then((token) => {
        if (token) {
          setSession(token);
        }
      })
      .then(async () => {
        const storedUser = await SecureStore.getItemAsync("vesper_user");
        if (storedUser) {
          setUser(JSON.parse(storedUser) as AuthUser);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const signIn = async (token: string, nextUser: AuthUser | null = null) => {
    setSession(token);
    setUser(nextUser);
    await SecureStore.setItemAsync("vesper_session", token);

    if (nextUser) {
      await SecureStore.setItemAsync("vesper_user", JSON.stringify(nextUser));
    } else {
      await SecureStore.deleteItemAsync("vesper_user");
    }
  };

  const signOut = async () => {
    setSession(null);
    setUser(null);
    await SecureStore.deleteItemAsync("vesper_session");
    await SecureStore.deleteItemAsync("vesper_user");
  };

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signOut,
        session,
        user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
