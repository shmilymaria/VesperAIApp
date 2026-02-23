import { Stack, useRouter, useRootNavigationState } from "expo-router";
import { useEffect } from "react";
import { useColorScheme } from "nativewind";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/auth";
import { View, ActivityIndicator } from "react-native";

export default function AppLayout() {
  const { colorScheme } = useColorScheme();
  const { session, isLoading } = useAuth();
  const rootNavigationState = useRootNavigationState();
  const router = useRouter();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;

  useEffect(() => {
    if (!rootNavigationState?.key || isLoading) {
      return;
    }

    if (!session) {
      router.replace("/(auth)/login");
    }
  }, [isLoading, rootNavigationState?.key, router, session]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!rootNavigationState?.key) {
    return null;
  }

  if (!session) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        contentStyle: {
          backgroundColor: theme.background,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="account"
        options={{
          presentation: "modal",
          headerShown: true,
          title: "Account",
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.foreground,
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
