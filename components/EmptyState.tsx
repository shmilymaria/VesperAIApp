import { View, Text, Pressable } from "react-native";
import VesperLogo from "@/components/VesperLogo";

const suggestions = [
  { label: "Help me write", detail: "an email or essay" },
  { label: "Brainstorm", detail: "ideas for a project" },
  { label: "Write code", detail: "for a specific task" },
  { label: "Summarize", detail: "text or an article" },
];

interface EmptyStateProps {
  onSuggestion: (text: string) => void;
}

export default function EmptyState({ onSuggestion }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-6 pb-20">
      <View className="mb-6">
        <VesperLogo width={160} height={160} />
      </View>

      <Text className="mb-2 text-center text-2xl font-semibold text-foreground">
        What can I help with?
      </Text>

      <View className="mt-6 w-full flex-row flex-wrap justify-center gap-2.5">
        {suggestions.map((item) => (
          <Pressable
            key={item.label}
            onPress={() => onSuggestion(`${item.label} ${item.detail}`)}
            className="rounded-2xl border border-border px-4 py-3 active:bg-accent"
          >
            <Text className="text-sm font-medium text-foreground">
              {item.label}
            </Text>
            <Text className="text-xs text-muted-foreground">
              {item.detail}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
