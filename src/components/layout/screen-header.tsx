import type { ReactNode } from "react";
import { Text, View, type ViewProps } from "react-native";

import { cn } from "../ui/cn";

export interface ScreenHeaderProps extends Omit<ViewProps, "children"> {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  eyebrow?: ReactNode;
  compact?: boolean;
  sticky?: boolean;
  className?: string;
  contentClassName?: string;
  testID?: string;
}

export function ScreenHeader({
  title,
  subtitle,
  leading,
  trailing,
  eyebrow,
  compact = false,
  sticky = true,
  className,
  contentClassName,
  testID,
  ...viewProps
}: ScreenHeaderProps) {
  return (
    <View
      testID={testID}
      className={cn(
        "border-b border-border/70 bg-background/90 px-4",
        sticky && "z-20 shadow-card",
        compact ? "py-2.5" : "py-3.5",
        className,
      )}
      {...viewProps}
    >
      <View className={cn("flex-row items-center gap-3", contentClassName)}>
        {leading ? <View className="shrink-0">{leading}</View> : null}
        <View className="min-w-0 flex-1">
          {eyebrow ? (
            <Text className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {eyebrow}
            </Text>
          ) : null}
          <Text className={cn("font-serif text-[18px] leading-6 text-foreground", compact && "text-[17px]",)}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="text-[12px] leading-4 text-muted-foreground">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {trailing ? <View className="shrink-0">{trailing}</View> : null}
      </View>
    </View>
  );
}
