import "@/global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { ConvexProvider } from "convex/react";
import { AuthProvider } from "@/context/auth";
import { UserProvider } from "@/context/user";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { convex } from "@/lib/convex";

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ConvexProvider client={convex}>
        <AuthProvider>
          <UserProvider>
            <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(app)" />
            </Stack>
          </UserProvider>
        </AuthProvider>
      </ConvexProvider>
    </GestureHandlerRootView>
  );
}
