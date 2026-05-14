import type { ReactNode } from "react";
import { ScrollView, View, type ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { layout, theme } from "@/theme";
import { cn } from "../ui/cn";

export interface ScreenProps extends Omit<ViewProps, "children"> {
  children?: ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  className?: string;
  contentClassName?: string;
  contentContainerClassName?: string;
  testID?: string;
}

export function Screen({
  children,
  scrollable = false,
  padded = true,
  className,
  contentClassName,
  contentContainerClassName,
  testID,
  ...viewProps
}: ScreenProps) {
  const contentPaddingClassName = padded ? "px-4" : undefined;

  return (
    <SafeAreaView testID={testID} className={cn("flex-1 bg-background", className)} {...viewProps}>
      <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
        <View className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10" />
        <View className="absolute left-[-72px] top-32 h-44 w-44 rounded-full bg-accent/40" />
        <View className="absolute -bottom-16 right-6 h-56 w-56 rounded-full bg-secondary/70" />
      </View>

      {scrollable ? (
        <ScrollView
          className={cn("flex-1", contentClassName)}
          contentContainerClassName={cn(
            "flex-grow",
            contentPaddingClassName,
            "pt-4 pb-6",
            contentContainerClassName,
          )}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View
            className="mx-auto w-full"
            style={{ maxWidth: layout.contentMaxWidth, gap: theme.layout.blockGap }}
          >
            {children}
          </View>
        </ScrollView>
      ) : (
        <View
          className={cn("flex-1", contentClassName, contentPaddingClassName, "pt-4 pb-6")}
          style={{ maxWidth: layout.contentMaxWidth, alignSelf: "center", width: "100%" }}
        >
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}
