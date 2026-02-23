import { memo, useCallback, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { ChevronDown, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/Colors";
import { MODELS } from "@/convex/models";

import type { ModelConfig } from "@/convex/models";

const MODEL_LIST: ModelConfig[] = Object.values(MODELS);

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  disabled?: boolean;
}

function ModelSelector({
  selectedModel,
  onSelectModel,
  disabled = false,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const currentModel = MODELS[selectedModel];

  const handleSelect = useCallback(
    (modelId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelectModel(modelId);
      setIsOpen(false);
    },
    [onSelectModel],
  );

  return (
    <>
      {/* trigger button */}
      <Pressable
        onPress={() => setIsOpen(true)}
        disabled={disabled}
        className="h-9 flex-row items-center gap-1 rounded-xl bg-secondary px-3 active:opacity-60"
      >
        <Text className="text-[13px] font-semibold text-foreground">
          {currentModel?.label ?? selectedModel}
        </Text>
        <ChevronDown size={14} color={theme.mutedForeground} strokeWidth={2} />
      </Pressable>

      {/* model picker modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <View className="flex-1">
          <Pressable className="absolute inset-0 bg-black/25" onPress={() => setIsOpen(false)} />

          <View
            className="absolute right-4 w-[270px] overflow-hidden rounded-2xl border border-border bg-card"
            style={{ bottom: Math.max(insets.bottom + 54, 64) }}
          >
            <View className="border-b border-border px-3 py-2.5">
              <Text className="text-sm font-bold text-foreground">Choose Model</Text>
            </View>

            {MODEL_LIST.map((model, index) => {
              const isSelected = model.id === selectedModel;
              const isLast = index === MODEL_LIST.length - 1;

              return (
                <Pressable
                  key={model.id}
                  onPress={() => handleSelect(model.id)}
                  className={`flex-row items-center px-3 py-2.5 active:bg-accent ${
                    !isLast ? "border-b border-border" : ""
                  }`}
                >
                  <View className="flex-1">
                    <Text className="text-[13px] font-semibold text-foreground">{model.label}</Text>
                    <Text className="mt-0.5 text-[11px] text-muted-foreground">{model.description}</Text>
                  </View>

                  {isSelected ? (
                    <Check size={16} color={theme.foreground} strokeWidth={2.5} />
                  ) : (
                    <View style={{ width: 16 }} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );
}

export default memo(ModelSelector);
