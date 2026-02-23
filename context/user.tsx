import React, { createContext, useContext, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";

import { api } from "@/convex/_generated/api";
import { useAuth } from "@/context/auth";

type UserRole = "free" | "pro" | "admin";

interface UserProfile {
  id: string;
  workosId: string;
  email: string;
  firstName: string | undefined;
  lastName: string | undefined;
  profilePictureUrl: string | undefined;
  role: UserRole;
  credits: number;
}

interface UserContextType {
  profile: UserProfile | null;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType>({
  profile: null,
  isLoading: true,
});

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { session, user } = useAuth();
  const upsertUser = useMutation(api.users.upsert);
  const hasUpserted = useRef<string | null>(null);

  // @note upsert convex user record whenever auth user changes
  useEffect(() => {
    if (!user || !session) {
      hasUpserted.current = null;
      return;
    }

    // @note skip if we already upserted for this user id
    if (hasUpserted.current === user.id) {
      return;
    }

    hasUpserted.current = user.id;

    upsertUser({
      workosId: user.id,
      email: user.email,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      profilePictureUrl: user.profilePictureUrl ?? undefined,
    }).catch((error) => {
      console.error("failed to upsert user:", error);
      hasUpserted.current = null;
    });
  }, [user, session, upsertUser]);

  // @note reactively subscribe to user data from convex
  const convexUser = useQuery(
    api.users.getByWorkosId,
    user?.id ? { workosId: user.id } : "skip",
  );

  const isLoading = session !== null && user !== null && convexUser === undefined;

  const profile: UserProfile | null =
    convexUser && user
      ? {
          id: convexUser._id,
          workosId: convexUser.workosId,
          email: convexUser.email,
          firstName: convexUser.firstName,
          lastName: convexUser.lastName,
          profilePictureUrl: convexUser.profilePictureUrl,
          role: convexUser.role,
          credits: convexUser.credits,
        }
      : null;

  return (
    <UserContext.Provider value={{ profile, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}
