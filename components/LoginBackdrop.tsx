import { View, useWindowDimensions } from "react-native";
import { BlurView } from "expo-blur";
import { useColorScheme } from "nativewind";

export default function LoginBackdrop() {
  const { width, height } = useWindowDimensions();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const purpleSize = width * 1.72;
  const purpleRadius = purpleSize / 2;
  const purpleCenterX = width * 0.4995;
  const purpleCenterY = height * 1.222;

  const pinkSize = width * 0.62;
  const pinkRadius = pinkSize / 2;
  const pinkCenterX = width * 1.039;
  const pinkCenterY = height * 0.121;

  const greenSize = width * 0.48;
  const greenRadius = greenSize / 2;
  const greenCenterX = width * 0.035;
  const greenCenterY = height * 0.4;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        backgroundColor: isDark ? "#1C1C1C" : "#F1F1F1",
      }}
    >
      <View
        style={{
          position: "absolute",
          width: purpleSize,
          height: purpleSize,
          borderRadius: purpleRadius,
          left: purpleCenterX - purpleRadius,
          top: purpleCenterY - purpleRadius,
          backgroundColor: "#8400FF",
          opacity: isDark ? 0.72 : 0.9,
        }}
      />

      <View
        style={{
          position: "absolute",
          width: pinkSize,
          height: pinkSize,
          borderRadius: pinkRadius,
          left: pinkCenterX - pinkRadius,
          top: pinkCenterY - pinkRadius,
          backgroundColor: "#E66DB8",
          opacity: isDark ? 0.52 : 0.72,
        }}
      />

      <View
        style={{
          position: "absolute",
          width: greenSize,
          height: greenSize,
          borderRadius: greenRadius,
          left: greenCenterX - greenRadius,
          top: greenCenterY - greenRadius,
          backgroundColor: "#D0FE8C",
          opacity: isDark ? 0.38 : 0.78,
        }}
      />

      <BlurView
        intensity={isDark ? 80 : 100}
        tint={isDark ? "dark" : "light"}
        experimentalBlurMethod="dimezisBlurView"
        style={{ position: "absolute", inset: 0 }}
      />
    </View>
  );
}
