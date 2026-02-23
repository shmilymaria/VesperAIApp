import Colors from "@/constants/Colors";
import ModelSelector from "@/components/ModelSelector";
import * as Haptics from "expo-haptics";
import { Send } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  isLoading?: boolean;
}

export default function ChatInput({
  value,
  onChangeText,
  onSend,
  selectedModel,
  onSelectModel,
  isLoading = false,
}: ChatInputProps) {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const hasText = value.trim().length > 0;
  const canSend = hasText && !isLoading;
  const isLight = colorScheme === "light";

  const handleSend = useCallback(() => {
    if (!canSend) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    onSend();
  }, [canSend, onSend]);

  return (
    <View
      className="rounded-t-3xl border-t border-border bg-card"
      style={[
        Platform.OS === "ios" && {
          paddingBottom: Math.max(insets.bottom - 16, 4),
          paddingTop: 6,
        },
        Platform.OS === "android" && {
          paddingBottom: Math.max(insets.bottom + 2, 4),
        },
        isLight &&
          Platform.OS === "ios" && {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -15 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
          },
        isLight &&
          Platform.OS === "android" && {
            elevation: 12,
          },
      ]}
    >
      {/* text input */}
      <TextInput
        className="max-h-[120px] min-h-[55px] px-5 pt-4 text-[15px] leading-[20px] text-foreground"
        placeholder="Ask Vesper"
        placeholderTextColor={theme.mutedForeground}
        value={value}
        onChangeText={onChangeText}
        multiline
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
      />

      {/* action row */}
      <View className="flex-row items-center justify-end gap-2 px-4 pb-2 pt-1">
        <ModelSelector
          selectedModel={selectedModel}
          onSelectModel={onSelectModel}
          disabled={isLoading}
        />

        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          className="h-9 w-9 items-center justify-center rounded-xl bg-secondary"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.mutedForeground} />
          ) : (
            <Send
              size={16}
              strokeWidth={1.75}
              color={canSend ? theme.foreground : theme.mutedForeground}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}
