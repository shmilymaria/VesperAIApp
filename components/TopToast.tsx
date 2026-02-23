import { useEffect } from "react";
import { View, Text } from "react-native";
import { BlurView } from "expo-blur";
import { useColorScheme } from "nativewind";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface TopToastProps {
  visible: boolean;
  message: string;
  top: number;
}

export default function TopToast({ visible, message, top }: TopToastProps) {
  const progress = useSharedValue(0);
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, {
      duration: visible ? 180 : 220,
    });
  }, [visible, progress]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [-8, 0]) }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      className="absolute left-0 right-0 items-center"
      style={[animStyle, { top }]}
    >
      <View
        className="overflow-hidden rounded-full px-4 py-2"
        style={{
          backgroundColor:
            colorScheme === "dark"
              ? "rgba(255,255,255,0.8)"
              : "rgba(0,0,0,0.8)",
        }}
      >
        <BlurView
          intensity={32}
          tint={colorScheme === "dark" ? "dark" : "light"}
          className="absolute inset-0"
        />
        <Text className={`text-sm font-medium ${colorScheme === "dark" ? "text-black" : "text-white"}`}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}
