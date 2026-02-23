import { memo, useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { useColorScheme } from "nativewind";

import Colors from "@/constants/Colors";

const DOT_SIZE = 6;
const ANIM_DURATION = 400;

function TypingDot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: ANIM_DURATION }),
          withTiming(0.3, { duration: ANIM_DURATION }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;

  return (
    <Animated.View
      style={[
        animStyle,
        {
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: DOT_SIZE / 2,
          backgroundColor: theme.mutedForeground,
        },
      ]}
    />
  );
}

function TypingIndicator() {
  return (
    <View className="flex-row items-center gap-1.5 py-1 mt-1">
      <TypingDot delay={0} />
      <TypingDot delay={150} />
      <TypingDot delay={300} />
    </View>
  );
}

export default memo(TypingIndicator);
