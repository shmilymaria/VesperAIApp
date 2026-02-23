import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { useAuth } from "@/context/auth";
import { useUser } from "@/context/user";
import { useColorScheme } from "nativewind";
import { Sun, Moon, LogOut, User, Coins, Shield } from "lucide-react-native";
import Colors from "@/constants/Colors";

const ROLE_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  admin: "Admin",
};

const MONTHLY_CREDITS_BY_ROLE = {
  free: 2000,
  pro: 5000,
  admin: 100000,
} as const;

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export default function AccountScreen() {
  const { signOut, user } = useAuth();
  const { profile } = useUser();
  const { colorScheme, setColorScheme } = useColorScheme();
  const [imageError, setImageError] = useState(false);
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  const displayName = fullName || user?.email?.split("@")[0] || "Vesper User";
  const displayEmail = user?.email || "user@example.com";
  const profileImageUrl = user?.profilePictureUrl || null;
  const showProfileImage = !!profileImageUrl && !imageError;
  const allowance = profile
    ? MONTHLY_CREDITS_BY_ROLE[profile.role] ?? MONTHLY_CREDITS_BY_ROLE.free
    : MONTHLY_CREDITS_BY_ROLE.free;
  const usedPercentValue = profile
    ? Math.min(100, (Math.max(0, allowance - profile.credits) / allowance) * 100)
    : 0;
  const usagePercent = profile
    ? formatPercent(usedPercentValue)
    : "—";
  const remainingPercent = profile
    ? formatPercent(Math.max(0, 100 - usedPercentValue))
    : "—";

  useEffect(() => {
    setImageError(false);
  }, [profileImageUrl]);

  return (
    <View className="flex-1 bg-background px-5 pt-8">
      {/* profile info */}
      <View className="mb-10 items-center">
        <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-secondary">
          {showProfileImage ? (
            <Image
              source={{ uri: profileImageUrl }}
              onError={() => setImageError(true)}
              style={{ width: 96, height: 96, borderRadius: 999 }}
            />
          ) : (
            <User size={40} color={theme.secondaryForeground} strokeWidth={1.5} />
          )}
        </View>
        <Text className="text-2xl font-bold text-foreground">{displayName}</Text>
        <Text className="mt-1 text-base text-muted-foreground">{displayEmail}</Text>

        {/* role badge */}
        {profile ? (
          <View className="mt-3 rounded-full bg-primary/10 px-4 py-1">
            <Text className="text-sm font-semibold text-primary">
              {ROLE_LABELS[profile.role] ?? profile.role}
            </Text>
          </View>
        ) : null}
      </View>

      {/* settings list */}
      <View className="overflow-hidden rounded-3xl border border-border bg-card">
        {/* usage */}
        {profile ? (
          <View className="border-b border-border p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Coins size={22} color={theme.foreground} />
                <Text className="text-[17px] font-medium text-foreground">
                  Usage
                </Text>
              </View>
              <Text className="text-[17px] font-semibold text-foreground">
                {usagePercent}
              </Text>
            </View>

            <View className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              <View
                className="h-full rounded-full bg-primary"
                style={{ width: `${usedPercentValue}%` }}
              />
            </View>

            <Text className="mt-2 text-xs text-muted-foreground">
              {remainingPercent} remaining
            </Text>
          </View>
        ) : null}

        {/* role */}
        {profile ? (
          <View className="flex-row items-center justify-between border-b border-border p-4">
            <View className="flex-row items-center gap-3">
              <Shield size={22} color={theme.foreground} />
              <Text className="text-[17px] font-medium text-foreground">
                Plan
              </Text>
            </View>
            <Text className="text-[17px] font-semibold text-foreground">
              {ROLE_LABELS[profile.role] ?? profile.role}
            </Text>
          </View>
        ) : null}

        {/* theme setting */}
        <View className="flex-row items-center justify-between border-b border-border p-4">
          <View className="flex-row items-center gap-3">
            {colorScheme === "dark" ? (
              <Moon size={22} color={theme.foreground} />
            ) : (
              <Sun size={22} color={theme.foreground} />
            )}
            <Text className="text-[17px] font-medium text-foreground">
              Theme
            </Text>
          </View>

          {/* theme toggles */}
          <View className="flex-row overflow-hidden rounded-full bg-secondary p-1">
            <Pressable
              onPress={() => setColorScheme("light")}
              className={`rounded-full px-4 py-1.5 ${
                colorScheme === "light" ? "bg-background" : ""
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  colorScheme === "light"
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Light
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setColorScheme("dark")}
              className={`rounded-full px-4 py-1.5 ${
                colorScheme === "dark" ? "bg-card" : ""
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  colorScheme === "dark"
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Dark
              </Text>
            </Pressable>
          </View>
        </View>

        {/* sign out */}
        <Pressable
          onPress={signOut}
          className="flex-row items-center gap-3 p-4 active:bg-accent"
        >
          <LogOut size={22} color={theme.destructive} />
          <Text className="text-[17px] font-medium text-destructive">
            Sign Out
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
