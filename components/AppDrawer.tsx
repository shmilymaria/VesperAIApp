import { useState } from "react";
import { Text, View, Pressable, ScrollView, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SquarePen, Trash2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useColorScheme } from "nativewind";
import Colors from "@/constants/Colors";

interface Conversation {
  id: string;
  title: string;
  updatedAt: number;
}

interface AppDrawerProps {
  onNewChat: () => void;
  onSelectChat?: (id: string) => void;
  onDeleteChat?: (id: string) => void;
  conversations?: Conversation[];
  activeConversationId?: string | null;
}

// @note group conversations by relative date
function groupByDate(conversations: Conversation[]) {
  const dayMs = 1000 * 60 * 60 * 24;
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const yesterdayStart = todayStart - dayMs;
  const weekStart = todayStart - 7 * dayMs;

  const groups: { label: string; chats: Conversation[] }[] = [
    { label: "Today", chats: [] },
    { label: "Yesterday", chats: [] },
    { label: "Previous 7 Days", chats: [] },
    { label: "Older", chats: [] },
  ];

  for (const conv of conversations) {
    if (conv.updatedAt >= todayStart) {
      groups[0].chats.push(conv);
    } else if (conv.updatedAt >= yesterdayStart) {
      groups[1].chats.push(conv);
    } else if (conv.updatedAt >= weekStart) {
      groups[2].chats.push(conv);
    } else {
      groups[3].chats.push(conv);
    }
  }

  return groups.filter((g) => g.chats.length > 0);
}

export default function AppDrawer({
  onNewChat,
  onSelectChat,
  onDeleteChat,
  conversations = [],
  activeConversationId,
}: AppDrawerProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  const [chatToDelete, setChatToDelete] = useState<Conversation | null>(null);

  const sections = groupByDate(conversations);

  // @note open custom delete confirmation modal
  const openDeleteModal = (chat: Conversation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setChatToDelete(chat);
  };

  const closeDeleteModal = () => {
    setChatToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (!chatToDelete) return;
    onDeleteChat?.(chatToDelete.id);
    setChatToDelete(null);
  };

  const handleNewChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onNewChat();
  };

  return (
    <View
      className="flex-1 bg-card"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* top actions */}
      <View className="px-4 pb-3 pt-4">
        <Pressable
          onPress={handleNewChat}
          className="flex-row items-center gap-2.5 rounded-xl bg-secondary px-3.5 py-2.5 active:opacity-70"
        >
          <SquarePen size={16} color={theme.foreground} strokeWidth={2} />
          <Text className="text-[14px] font-medium text-foreground">
            New Chat
          </Text>
        </Pressable>
      </View>

      {/* chat history */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {sections.length === 0 ? (
          <Text className="px-3 pt-8 text-center text-sm text-muted-foreground">
            No conversations yet
          </Text>
        ) : (
          sections.map((section) => (
            <View key={section.label} className="mb-1">
              <Text className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </Text>

              {section.chats.map((chat) => (
                <View
                  key={chat.id}
                  className={`mb-0.5 flex-row items-center rounded-lg pr-1 ${
                    chat.id === activeConversationId ? "bg-muted" : ""
                  }`}
                >
                  <Pressable
                    onPress={() => onSelectChat?.(chat.id)}
                    onLongPress={() => openDeleteModal(chat)}
                    className="flex-1 px-3 py-2.5 active:bg-muted"
                  >
                    <Text
                      className="text-[14px] text-foreground"
                      numberOfLines={1}
                    >
                      {chat.title}
                    </Text>
                  </Pressable>

                  {onDeleteChat ? (
                    <Pressable
                      onPress={() => openDeleteModal(chat)}
                      className="h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary active:opacity-70"
                    >
                      <Trash2 size={14} color={theme.destructive} strokeWidth={2} />
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={!!chatToDelete}
        transparent
        animationType="fade"
        onRequestClose={closeDeleteModal}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-5">
          <View className="w-full max-w-[320px] rounded-3xl border border-border bg-card p-4">
            <Text className="text-[17px] font-semibold text-foreground">
              Delete conversation?
            </Text>
            <Text className="mt-2 text-sm text-muted-foreground" numberOfLines={2}>
              {chatToDelete?.title ?? "This conversation"}
            </Text>
            <Text className="mt-3 text-[13px] text-muted-foreground">
              This action cannot be undone. Deleted conversations cannot be recovered.
            </Text>

            <View className="mt-4 flex-row items-center justify-end gap-2">
              <Pressable
                onPress={closeDeleteModal}
                className="rounded-xl border border-border bg-secondary px-4 py-2 active:opacity-70"
              >
                <Text className="text-sm font-medium text-foreground">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmDelete}
                className="rounded-xl bg-destructive px-4 py-2 active:opacity-80"
              >
                <Text className="text-sm font-semibold text-white">Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
