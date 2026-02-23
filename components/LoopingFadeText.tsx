import { useEffect, useMemo, useState } from "react";
import { TextStyle, View, ViewStyle } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

interface LoopingFadeTextProps {
  texts: string[];
  textStyle?: TextStyle;
  containerStyle?: ViewStyle;
  intervalMs?: number;
  staggerMs?: number;
  durationMs?: number;
}

export default function LoopingFadeText({
  texts,
  textStyle,
  containerStyle,
  intervalMs = 2600,
  staggerMs = 34,
  durationMs = 360,
}: LoopingFadeTextProps) {
  const safeTexts = useMemo(() => texts.filter((text) => text.trim().length > 0), [texts]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (safeTexts.length <= 1) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % safeTexts.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [safeTexts.length, intervalMs]);

  const currentText = safeTexts[index] ?? "";
  const words = currentText.split(" ").filter((word) => word.length > 0);
  let letterOffset = 0;

  return (
    <View
      style={[
        { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center" },
        containerStyle,
      ]}
    >
      {words.map((word, wordIndex) => {
        const startIndex = letterOffset;
        letterOffset += word.length;

        return (
          <View
            key={`${index}-word-${wordIndex}-${word}`}
            style={{ flexDirection: "row", marginRight: wordIndex < words.length - 1 ? 10 : 0 }}
          >
            {word.split("").map((char, charIndex) => (
              <Animated.Text
                key={`${index}-${wordIndex}-${charIndex}-${char}`}
                entering={FadeInUp.duration(durationMs).delay((startIndex + charIndex) * staggerMs)}
                style={textStyle}
              >
                {char}
              </Animated.Text>
            ))}
          </View>
        );
      })}
    </View>
  );
}
