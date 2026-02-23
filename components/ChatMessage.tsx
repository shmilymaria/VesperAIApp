import { memo, useCallback, useMemo } from "react";
import { Platform, Pressable, TextInput, View, Text } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Copy, Pencil } from "lucide-react-native";
import Markdown from "react-native-markdown-display";
import { useColorScheme } from "nativewind";

import Colors from "@/constants/Colors";
import VesperLogo from "@/components/VesperLogo";
import TypingIndicator from "@/components/TypingIndicator";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  canEdit?: boolean;
  onEdit?: () => void;
  isEditing?: boolean;
  editValue?: string;
  onChangeEditValue?: (value: string) => void;
  onCancelEdit?: () => void;
  onSubmitEdit?: () => void;
  onCopy?: () => void;
}

function ChatMessage({
  role,
  content,
  canEdit = false,
  onEdit,
  isEditing = false,
  editValue = "",
  onChangeEditValue,
  onCancelEdit,
  onSubmitEdit,
  onCopy,
}: ChatMessageProps) {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;

  // @note theme-aware markdown styles for assistant messages
  const markdownStyles = useMemo(
    () => ({
      body: {
        color: theme.foreground,
        fontSize: 15,
        lineHeight: 22,
        fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
      },
      paragraph: {
        marginTop: 0,
        marginBottom: 8,
      },
      heading1: {
        color: theme.foreground,
        fontSize: 22,
        fontWeight: "700" as const,
        marginTop: 16,
        marginBottom: 8,
      },
      heading2: {
        color: theme.foreground,
        fontSize: 19,
        fontWeight: "700" as const,
        marginTop: 14,
        marginBottom: 6,
      },
      heading3: {
        color: theme.foreground,
        fontSize: 17,
        fontWeight: "600" as const,
        marginTop: 12,
        marginBottom: 4,
      },
      strong: {
        fontWeight: "600" as const,
        color: theme.foreground,
      },
      em: {
        fontStyle: "italic" as const,
        color: theme.foreground,
      },
      code_inline: {
        backgroundColor: colorScheme === "dark" ? "#2d2d2d" : "#f0f0f0",
        color: colorScheme === "dark" ? "#e6e6e6" : "#1a1a1a",
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
        fontSize: 13,
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 4,
      },
      fence: {
        backgroundColor: colorScheme === "dark" ? "#1e1e1e" : "#f5f5f5",
        borderColor: theme.border,
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginVertical: 8,
      },
      code_block: {
        backgroundColor: colorScheme === "dark" ? "#1e1e1e" : "#f5f5f5",
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
        fontSize: 13,
        color: theme.foreground,
        lineHeight: 20,
      },
      blockquote: {
        borderLeftWidth: 3,
        borderLeftColor: theme.border,
        paddingLeft: 12,
        marginVertical: 8,
        backgroundColor: "transparent",
      },
      bullet_list: {
        marginVertical: 4,
      },
      ordered_list: {
        marginVertical: 4,
      },
      list_item: {
        marginVertical: 2,
      },
      hr: {
        backgroundColor: theme.border,
        height: 1,
        marginVertical: 12,
      },
      link: {
        color: colorScheme === "dark" ? "#60a5fa" : "#2563eb",
        textDecorationLine: "underline" as const,
      },
    }),
    [theme, colorScheme],
  );

  const handleCopy = useCallback(() => {
    if (!content) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Clipboard.setStringAsync(content);
    onCopy?.();
  }, [content, onCopy]);

  if (role === "user") {
    if (isEditing) {
      return (
        <View className="mb-4 items-end">
          <View className="w-full max-w-[85%] rounded-3xl bg-secondary px-4 py-3">
            <TextInput
              className="min-h-[44px] text-[15px] leading-[22px] text-secondary-foreground"
              value={editValue}
              onChangeText={onChangeEditValue}
              multiline
              autoFocus
              placeholder="Edit your message"
              placeholderTextColor={theme.mutedForeground}
            />
          </View>
          <View className="mt-2 flex-row items-center gap-2">
            <Pressable
              onPress={onCancelEdit}
              className="rounded-lg border border-border bg-card px-3 py-1.5 active:opacity-70"
            >
              <Text className="text-xs font-medium text-foreground">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onSubmitEdit}
              className="rounded-lg bg-foreground px-3 py-1.5 active:opacity-80"
            >
              <Text className="text-xs font-semibold text-background">Resend</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return (
      <View className="mb-4 items-end">
        <View className="max-w-[85%] rounded-3xl bg-secondary px-4 py-3">
          <Text className="text-[15px] leading-[22px] text-secondary-foreground">
            {content}
          </Text>
        </View>
        <View className="mt-2 flex-row items-center gap-2">
          <Pressable
            onPress={handleCopy}
            disabled={!content}
            className="h-7 w-7 items-center justify-center rounded-md bg-card active:opacity-70"
          >
            <Copy size={16} color={theme.mutedForeground} strokeWidth={2.4} />
          </Pressable>
          {canEdit ? (
            <Pressable
              onPress={onEdit}
              className="h-7 w-7 items-center justify-center rounded-md bg-card active:opacity-70"
            >
              <Pencil size={16} color={theme.mutedForeground} strokeWidth={2.4} />
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <Pressable onLongPress={handleCopy} className="mb-4 flex-row items-start gap-2">
      <View className="-mt-1">
        <VesperLogo width={32} height={32} />
      </View>
      <View className="max-w-[85%] flex-1 pt-0.5">
        {content ? (
          <>
            <Markdown style={markdownStyles}>{content}</Markdown>
            <Pressable
              onPress={handleCopy}
              className="mt-1 h-7 w-7 items-center justify-center rounded-md bg-card active:opacity-70"
            >
              <Copy size={16} color={theme.mutedForeground} strokeWidth={2.4} />
            </Pressable>
          </>
        ) : (
          <TypingIndicator />
        )}
      </View>
    </Pressable>
  );
}

export default memo(ChatMessage);
