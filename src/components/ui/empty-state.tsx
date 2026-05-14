import type { ReactNode } from "react";
import { Text, View, type ViewProps } from "react-native";

import { cn } from "./cn";

export interface EmptyStateProps extends Omit<ViewProps, "children" | "style" | "className"> {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  testID?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  titleClassName,
  descriptionClassName,
  testID,
  ...viewProps
}: EmptyStateProps) {
  return (
    <View
      testID={testID}
      className={cn(
        "items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-muted/40 px-6 py-10",
        className,
      )}
      {...viewProps}
    >
      {icon ? <View className="items-center justify-center">{icon}</View> : null}
      <View className="items-center gap-2">
        <Text className={cn("text-center font-serif text-[18px] text-foreground", titleClassName)}>{title}</Text>
        {description ? (
          <Text className={cn("max-w-[280px] text-center text-[13px] leading-5 text-muted-foreground", descriptionClassName)}>
            {description}
          </Text>
        ) : null}
      </View>
      {action ? <View className="w-full items-center">{action}</View> : null}
    </View>
  );
}
