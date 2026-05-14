import type { ReactNode } from "react";
import { ActivityIndicator, Text, View, type ViewProps } from "react-native";

import { theme } from "@/theme";
import { cn } from "./cn";

export interface LoadingStateProps extends Omit<ViewProps, "children" | "style" | "className"> {
  title?: ReactNode;
  description?: ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  size?: "sm" | "md" | "lg";
  testID?: string;
}

const sizeMap = {
  sm: "small",
  md: "small",
  lg: "large",
} as const;

export function LoadingState({
  title = "Loading",
  description,
  className,
  titleClassName,
  descriptionClassName,
  size = "md",
  testID,
  ...viewProps
}: LoadingStateProps) {
  return (
    <View testID={testID} className={cn("items-center justify-center gap-3 py-10", className)} {...viewProps}>
      <View className="items-center justify-center rounded-full bg-primary/10 px-4 py-4">
        <ActivityIndicator size={sizeMap[size]} color={theme.colors.primary} />
      </View>
      {title ? <Text className={cn("font-serif text-[18px] text-foreground", titleClassName)}>{title}</Text> : null}
      {description ? (
        <Text className={cn("max-w-[280px] text-center text-[13px] leading-5 text-muted-foreground", descriptionClassName)}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}
