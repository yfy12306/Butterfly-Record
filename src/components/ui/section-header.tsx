import type { ReactNode } from "react";
import { Text, View, type ViewProps } from "react-native";

import { cn } from "./cn";

export interface SectionHeaderProps extends Omit<ViewProps, "children" | "style" | "className"> {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  action?: ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  testID?: string;
}

export function SectionHeader({
  title,
  description,
  eyebrow,
  action,
  className,
  titleClassName,
  descriptionClassName,
  testID,
  ...viewProps
}: SectionHeaderProps) {
  return (
    <View testID={testID} className={cn("flex-row items-end justify-between gap-4", className)} {...viewProps}>
      <View className="flex-1 gap-1.5">
        {eyebrow ? <Text className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</Text> : null}
        <Text className={cn("font-serif text-[20px] leading-6 text-foreground", titleClassName)}>{title}</Text>
        {description ? (
          <Text className={cn("text-[13px] leading-5 text-muted-foreground", descriptionClassName)}>
            {description}
          </Text>
        ) : null}
      </View>
      {action ? <View className="shrink-0">{action}</View> : null}
    </View>
  );
}
