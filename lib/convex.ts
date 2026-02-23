import { ConvexReactClient } from "convex/react";

// @note singleton convex client — unsavedChangesWarning disabled for react native
export const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL!,
  { unsavedChangesWarning: false },
);
