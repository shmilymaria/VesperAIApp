import { useEffect, useState } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { Menu, User } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/Colors";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/auth";
import { useUser } from "@/context/user";

interface HeaderProps {
  onMenuPress: () => void;
}

export default function Header({ onMenuPress }: HeaderProps) {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useUser();
  const [imageError, setImageError] = useState(false);
  const profileImageUrl = user?.profilePictureUrl || null;
  const showProfileImage = !!profileImageUrl && !imageError;

  useEffect(() => {
    setImageError(false);
  }, [profileImageUrl]);

  return (
    <View
      className="flex-row items-center justify-between px-5 py-3"
      style={{ paddingTop: insets.top + 4 }}
    >
      <Pressable
        onPress={onMenuPress}
        className="h-9 w-9 items-center justify-center rounded-full active:opacity-60"
      >
        <Menu
          size={22}
          color={theme.mutedForeground}
          strokeWidth={1.75}
        />
      </Pressable>

      <View className="flex-row items-center gap-1.5">
        <Text className="text-xl font-bold text-foreground">
          Vesper AI
        </Text>
      </View>

      <View className="relative items-center justify-center pr-0.5">
        <Pressable
          onPress={() => router.push("/account")}
          className="h-11 w-11 items-center justify-center rounded-full bg-secondary active:opacity-60"
        >
          {showProfileImage ? (
            <Image
              source={{ uri: profileImageUrl }}
              onError={() => setImageError(true)}
              style={{ width: 44, height: 44, borderRadius: 999 }}
            />
          ) : (
            <User size={20} color={theme.secondaryForeground} strokeWidth={2} />
          )}
        </Pressable>

        {profile ? (
          <View className="absolute -bottom-2.5 min-w-[44px] items-center rounded-full border border-border bg-card px-2.5 py-0.5">
            <Text numberOfLines={1} className="text-[9px] font-extrabold uppercase text-foreground">
              {profile.role}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
