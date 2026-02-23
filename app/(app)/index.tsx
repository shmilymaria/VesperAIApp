import { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  ScrollView,
  useWindowDimensions,
  Pressable,
  Keyboard,
  Platform,
  Alert,
} from "react-native";
import { fetch as expoFetch } from "expo/fetch";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ChevronDown } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useMutation, useQuery } from "convex/react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "@/convex/_generated/api";
import { useAuth } from "@/context/auth";
import { DEFAULT_MODEL } from "@/convex/models";
import Colors from "@/constants/Colors";
import { convex } from "@/lib/convex";
import Header from "@/components/Header";
import EmptyState from "@/components/EmptyState";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import AppDrawer from "@/components/AppDrawer";
import TopToast from "@/components/TopToast";

import type { Id } from "@/convex/_generated/dataModel";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function resolveApiBaseUrl(): string | null {
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  return baseUrl ? baseUrl.replace(/\/+$/, "") : null;
}

const ANIM_CONFIG = {
  duration: 260,
  easing: Easing.out(Easing.cubic),
};

function createLocalMessageId(prefix: "user" | "assistant") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isInsufficientCreditsError(message: string) {
  return message.toLowerCase().includes("insufficient credits");
}

function getNextCreditResetLabel() {
  const now = new Date();
  const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return resetDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

export default function Index() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] =
    useState<Id<"conversations"> | null>(null);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState("");
  const [copyToastVisible, setCopyToastVisible] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const requestAbortRef = useRef<AbortController | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { user, session, signOut } = useAuth();
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;

  const deleteConversation = useMutation(api.chat.deleteConversation);

  // @note fetch conversations for the drawer
  const conversations = useQuery(
    api.chat.getConversations,
    user?.id ? { workosId: user.id } : "skip",
  );

  const drawerConversations = (conversations ?? []).map((c) => ({
    id: c._id,
    title: c.title,
    updatedAt: c.updatedAt,
  }));

  const drawerWidth = Math.min(Math.max(width * 0.78, 280), 320);

  // @note drawer animation
  const translateX = useSharedValue(-drawerWidth);
  const contextX = useSharedValue(0);
  const isOpen = useSharedValue(false);

  // @note keyboard offset — only moves the chat input
  const keyboardOffset = useSharedValue(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = Keyboard.addListener(showEvent, (e) => {
      keyboardOffset.value = withTiming(-e.endCoordinates.height, {
        duration: Platform.OS === "ios" ? e.duration || 250 : 200,
        easing: Easing.out(Easing.quad),
      });
    });

    const onHide = Keyboard.addListener(hideEvent, (e) => {
      keyboardOffset.value = withTiming(0, {
        duration: Platform.OS === "ios" ? (e.duration || 250) : 200,
        easing: Easing.out(Easing.quad),
      });
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [keyboardOffset]);

  const inputAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: keyboardOffset.value }],
  }));

  const openDrawer = useCallback(() => {
    "worklet";
    translateX.value = withTiming(0, ANIM_CONFIG);
    isOpen.value = true;
  }, [translateX, isOpen]);

  const closeDrawer = useCallback(() => {
    "worklet";
    translateX.value = withTiming(-drawerWidth, ANIM_CONFIG);
    isOpen.value = false;
  }, [translateX, isOpen, drawerWidth]);

  const handleOpenDrawer = useCallback(() => {
    openDrawer();
  }, [openDrawer]);

  const handleCloseDrawer = useCallback(() => {
    closeDrawer();
  }, [closeDrawer]);

  const cancelInFlightRequest = useCallback(() => {
    requestAbortRef.current?.abort();
    requestAbortRef.current = null;
    setIsLoading(false);
  }, []);

  const openGesture = Gesture.Pan()
    .activeOffsetX([15, 15])
    .failOffsetY([-10, 10])
    .onStart(() => {
      contextX.value = translateX.value;
    })
    .onUpdate((e) => {
      const next = contextX.value + e.translationX;
      translateX.value = Math.max(-drawerWidth, Math.min(next, 0));
    })
    .onEnd((e) => {
      const progress = (translateX.value + drawerWidth) / drawerWidth;
      if (e.velocityX > 400 || progress > 0.4) {
        openDrawer();
      } else {
        closeDrawer();
      }
    });

  const closeGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onStart(() => {
      contextX.value = translateX.value;
    })
    .onUpdate((e) => {
      const next = contextX.value + e.translationX;
      translateX.value = Math.max(-drawerWidth, Math.min(next, 0));
    })
    .onEnd((e) => {
      const progress = (translateX.value + drawerWidth) / drawerWidth;
      if (e.velocityX < -400 || progress < 0.6) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-drawerWidth, 0], [0, 0.4]),
    pointerEvents: translateX.value > -drawerWidth ? ("auto" as const) : ("none" as const),
  }));

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
      setIsAtBottom(true);
    }, 100);
  }, []);

  // @note track whether user has scrolled away from bottom
  const handleScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } } }) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
      setIsAtBottom(distanceFromBottom < 80);
    },
    [],
  );

  // @note stream response from backend api
  const streamResponse = useCallback(
    async (args: {
      content: string;
      conversationId: Id<"conversations"> | null;
      model: string;
      editLatestUser?: boolean;
    }) => {
      const siteUrl = resolveApiBaseUrl();
      if (!siteUrl || !user || !session) return;

      const assistantId = createLocalMessageId("assistant");
      const abortController = new AbortController();
      requestAbortRef.current = abortController;
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      try {
        const response = await expoFetch(`${siteUrl}/api/chat`, {
          method: "POST",
          signal: abortController.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session}`,
          },
          body: JSON.stringify({
            workosId: user.id,
            conversationId: args.conversationId ?? undefined,
            content: args.content,
            model: args.model,
            editLatestUser: args.editLatestUser ?? false,
          }),
        });

        if (!response.ok) {
          // @note read error body for better diagnostics
          let errorMessage = `http ${response.status}`;
          try {
            const errorBody = (await response.json()) as { error?: string };
            if (errorBody?.error) {
              errorMessage = errorBody.error;
            }
          } catch {
            // @note fallback if body isn't json
          }
          throw new Error(errorMessage);
        }

        const applySseData = (data: string) => {
          if (data === "[DONE]") {
            streamDidComplete = true;
            return;
          }

          let parsed: { content?: string; error?: string; conversationId?: string };
          try {
            parsed = JSON.parse(data);
          } catch {
            // @note skip malformed json chunks
            return;
          }

          if (parsed.error) {
            throw new Error(parsed.error);
          }
          if (parsed.conversationId) {
            setConversationId(parsed.conversationId as Id<"conversations">);
          }
          if (parsed.content) {
            hasAssistantContent = true;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? { ...msg, content: msg.content + parsed.content }
                  : msg,
              ),
            );
            scrollToBottom();
          }
        };

        let hasAssistantContent = false;
        let streamDidComplete = false;

        const reader = response.body?.getReader();
        if (!reader) {
          // @note fallback for runtimes that don't expose stream reader
          const bufferedText = await response.text();
          if (!bufferedText) {
            throw new Error("no response body");
          }

          for (const line of bufferedText.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            applySseData(line.slice(6));
          }

          if (!streamDidComplete && !hasAssistantContent) {
            throw new Error("empty response from server");
          }

          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            applySseData(data);
          }
        }

        if (!streamDidComplete && !hasAssistantContent) {
          throw new Error("empty response from server");
        }
      } catch (error: any) {
        const errorMsg = error?.message ?? "";

        if (error?.name === "AbortError") {
          setMessages((prev) => prev.filter((msg) => msg.id !== assistantId));
          return;
        }

        // @note surface insufficient credits as alert, remove empty assistant bubble
        if (isInsufficientCreditsError(errorMsg)) {
          setMessages((prev) => prev.filter((msg) => msg.id !== assistantId));
          Alert.alert(
            "No Credits",
            `You've used all your credits for this period. Please wait until ${getNextCreditResetLabel()} or upgrade to Pro for a higher limit.`,
          );
        } else if (errorMsg === "invalid session token") {
          setMessages((prev) => prev.filter((msg) => msg.id !== assistantId));
          await signOut();
          Alert.alert("Session Expired", "Please sign in again.");
        } else {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: "Sorry, something went wrong. Please try again." }
                : msg,
            ),
          );
        }
        console.error("stream error:", error);
      } finally {
        if (requestAbortRef.current === abortController) {
          requestAbortRef.current = null;
        }
      }
    },
    [user, session, scrollToBottom, signOut],
  );

  const handleSend = useCallback(async () => {
    if (!input.trim() || !user || isLoading) return;

    const content = input.trim();
    const userMessage: Message = {
      id: createLocalMessageId("user"),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);

    setInput("");
    setIsLoading(true);
    scrollToBottom();

    try {
      await streamResponse({
        content,
        conversationId,
        model: selectedModel,
        editLatestUser: false,
      });
    } catch (error: any) {
      const errorMessage = error?.message ?? "";
      if (isInsufficientCreditsError(errorMessage)) {
        Alert.alert(
          "No Credits",
          `You've used all your credits for this period. Please wait until ${getNextCreditResetLabel()} or upgrade to Pro for a higher limit.`,
        );
      } else {
        Alert.alert("Error", errorMessage || "Failed to send message");
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    input,
    user,
    isLoading,
    conversationId,
    selectedModel,
    scrollToBottom,
    streamResponse,
  ]);

  const handleSuggestion = useCallback((text: string) => {
    setInput(text);
  }, []);

  const handleNewChat = useCallback(() => {
    cancelInFlightRequest();
    setMessages([]);
    setInput("");
    setEditingMessageId(null);
    setEditingMessageText("");
    setConversationId(null);
    closeDrawer();
  }, [cancelInFlightRequest, closeDrawer]);

  // @note delete a conversation from the drawer
  const handleDeleteChat = useCallback(
    async (id: string) => {
      if (!user) return;

      try {
        await deleteConversation({
          conversationId: id as Id<"conversations">,
          workosId: user.id,
        });

        // @note if we deleted the active conversation, reset to empty state
        if (id === conversationId) {
          setMessages([]);
          setInput("");
          setConversationId(null);
        }
      } catch (error) {
        console.error("failed to delete conversation:", error);
      }
    },
    [user, deleteConversation, conversationId],
  );

  // @note load an existing conversation from the drawer
  const handleSelectChat = useCallback(
    async (id: string) => {
      cancelInFlightRequest();
      const convId = id as Id<"conversations">;
      setConversationId(convId);
      setInput("");
      setEditingMessageId(null);
      setEditingMessageText("");
      closeDrawer();

      // @note restore the model used in this conversation
      const conv = conversations?.find((c) => c._id === convId);
      if (conv?.model) {
        setSelectedModel(conv.model);
      }

      // @note fetch messages via the convex query directly
      try {
        const convexMessages = await convex.query(api.chat.getMessages, {
          conversationId: convId,
        });

        setMessages(
          convexMessages
            .filter(
              (m: { role: string }) =>
                m.role === "user" || m.role === "assistant",
            )
            .map((m: { _id: string; role: string; content: string }) => ({
              id: m._id,
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
        );
        scrollToBottom();
      } catch (error) {
        console.error("failed to load conversation:", error);
      }
    },
    [cancelInFlightRequest, closeDrawer, conversations, scrollToBottom],
  );

  const handleEditLatestUserMessage = useCallback((messageId: string, content: string) => {
    if (isLoading) return;
    setEditingMessageId(messageId);
    setEditingMessageText(content);
  }, [isLoading]);

  const handleCancelEditLatestUserMessage = useCallback(() => {
    setEditingMessageId(null);
    setEditingMessageText("");
  }, []);

  const handleSubmitEditLatestUserMessage = useCallback(async () => {
    if (!user || !conversationId || !editingMessageId || isLoading) return;

    const content = editingMessageText.trim();
    if (!content) return;

    setMessages((prev) => {
      const targetIndex = prev.findIndex((message) => message.id === editingMessageId);

      if (targetIndex === -1) {
        return prev;
      }

      const trimmed = prev.slice(0, targetIndex + 1);
      trimmed[targetIndex] = {
        ...trimmed[targetIndex],
        content,
      };
      return trimmed;
    });

    setIsLoading(true);
    setEditingMessageId(null);
    setEditingMessageText("");
    scrollToBottom();

    try {
      await streamResponse({
        content,
        conversationId,
        model: selectedModel,
        editLatestUser: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    user,
    conversationId,
    editingMessageId,
    editingMessageText,
    isLoading,
    scrollToBottom,
    streamResponse,
    selectedModel,
  ]);

  useEffect(() => {
    return () => {
      requestAbortRef.current?.abort();
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showCopyToast = useCallback(() => {
    setCopyToastVisible(true);

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setCopyToastVisible(false);
      toastTimerRef.current = null;
    }, 900);
  }, []);

  const isEmpty = messages.length === 0;
  const latestUserMessageId = [...messages]
    .reverse()
    .find((message) => message.role === "user")?.id ?? null;

  return (
    <View className="flex-1 bg-background">
      {/* main content */}
      <View className="flex-1">
        {isEmpty ? (
          <GestureDetector gesture={openGesture}>
            <Pressable className="flex-1" onPress={Keyboard.dismiss}>
              <Header onMenuPress={handleOpenDrawer} />
              <View className="flex-1">
                <EmptyState onSuggestion={handleSuggestion} />
              </View>
            </Pressable>
          </GestureDetector>
        ) : (
          <Pressable className="flex-1" onPress={Keyboard.dismiss}>
            <Header onMenuPress={handleOpenDrawer} />
            <View className="flex-1">
              <ScrollView
                ref={scrollViewRef}
                className="flex-1"
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingTop: 8,
                  paddingBottom: 16,
                }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                onScroll={handleScroll}
                scrollEventThrottle={100}
                onContentSizeChange={() => {
                  if (isAtBottom) {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }
                }}
              >
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    canEdit={
                      msg.role === "user" &&
                      msg.id === latestUserMessageId &&
                      !!conversationId &&
                      !isLoading
                    }
                    onEdit={() => handleEditLatestUserMessage(msg.id, msg.content)}
                    isEditing={msg.id === editingMessageId}
                    editValue={msg.id === editingMessageId ? editingMessageText : ""}
                    onChangeEditValue={setEditingMessageText}
                    onCancelEdit={handleCancelEditLatestUserMessage}
                    onSubmitEdit={handleSubmitEditLatestUserMessage}
                    onCopy={showCopyToast}
                  />
                ))}
              </ScrollView>

              {/* scroll-to-bottom fab */}
              {!isAtBottom && (
                <Pressable
                  onPress={scrollToBottom}
                  className="absolute bottom-4 right-4 h-9 w-9 items-center justify-center rounded-full bg-card shadow-md active:opacity-70"
                  style={{ borderWidth: 1, borderColor: theme.border }}
                >
                  <ChevronDown size={18} color={theme.foreground} strokeWidth={2} />
                </Pressable>
              )}
            </View>
          </Pressable>
        )}

        {/* chat input — only this moves with the keyboard */}
        <Animated.View style={inputAnimStyle}>
          <ChatInput
            value={input}
            onChangeText={setInput}
            onSend={handleSend}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            isLoading={isLoading}
          />
        </Animated.View>
      </View>

      {/* overlay */}
      <Animated.View
        className="absolute inset-0 bg-black"
        style={overlayStyle}
      >
        <Pressable className="flex-1" onPress={handleCloseDrawer} />
      </Animated.View>

      <TopToast
        visible={copyToastVisible}
        message="Copied to clipboard"
        top={insets.top + 56}
      />

      {/* floating drawer */}
      <GestureDetector gesture={closeGesture}>
        <Animated.View
          className="absolute bottom-0 left-0 top-0"
          style={[drawerStyle, { width: drawerWidth }]}
        >
          <AppDrawer
              onNewChat={handleNewChat}
              onSelectChat={handleSelectChat}
              onDeleteChat={handleDeleteChat}
              conversations={drawerConversations}
              activeConversationId={conversationId}
            />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
