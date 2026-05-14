import type { ReactNode } from "react";
import { Text, View, type ViewProps } from "react-native";

import { cn } from "./cn";

type BadgeVariant = "default" | "secondary" | "outline" | "subtle" | "success" | "warning" | "destructive";
type BadgeSize = "sm" | "md";

export interface BadgeProps extends Omit<ViewProps, "children" | "style" | "className"> {
  children: ReactNode;
  className?: string;
  textClassName?: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  testID?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "border-transparent bg-primary",
  secondary: "border-transparent bg-secondary",
  outline: "border-border bg-background",
  subtle: "border-transparent bg-muted",
  success: "border-transparent bg-emerald-100",
  warning: "border-transparent bg-amber-100",
  destructive: "border-transparent bg-destructive/10",
};

const textClasses: Record<BadgeVariant, string> = {
  default: "text-primary-foreground",
  secondary: "text-secondary-foreground",
  outline: "text-foreground",
  subtle: "text-foreground",
  success: "text-emerald-900",
  warning: "text-amber-900",
  destructive: "text-destructive",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2.5 py-1",
  md: "px-3 py-1.5",
};

export function Badge({
  children,
  className,
  textClassName,
  variant = "subtle",
  size = "sm",
  testID,
  ...viewProps
}: BadgeProps) {
  return (
    <View
      testID={testID}
      className={cn(
        "flex-row items-center self-start rounded-full border",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...viewProps}
    >
      <Text className={cn("text-[11px] font-medium tracking-[0.08em]", textClasses[variant], textClassName)}>
        {children}
      </Text>
    </View>
  );
}
