import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View, type PressableProps } from "react-native";

import { theme } from "@/theme";
import { cn } from "./cn";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "subtle" | "destructive";
type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm" | "icon-lg";

export interface ButtonProps extends Omit<PressableProps, "children" | "style" | "className"> {
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  textClassName?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  accessibilityLabel?: string;
  testID?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: "border-border bg-primary shadow-card",
  secondary: "border-border bg-secondary shadow-soft",
  outline: "border-border bg-background shadow-none",
  ghost: "border-transparent bg-transparent shadow-none",
  subtle: "border-transparent bg-muted shadow-none",
  destructive: "border-transparent bg-destructive shadow-card",
};

const textClasses: Record<ButtonVariant, string> = {
  default: "text-primary-foreground",
  secondary: "text-secondary-foreground",
  outline: "text-foreground",
  ghost: "text-foreground",
  subtle: "text-foreground",
  destructive: "text-destructive-foreground",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 py-2 rounded-xl",
  md: "min-h-11 px-4 py-3 rounded-2xl",
  lg: "min-h-12 px-5 py-3.5 rounded-2xl",
  icon: "h-11 w-11 rounded-2xl",
  "icon-sm": "h-9 w-9 rounded-xl",
  "icon-lg": "h-12 w-12 rounded-2xl",
};

export function Button({
  children,
  className,
  contentClassName,
  textClassName,
  variant = "default",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  startIcon,
  endIcon,
  accessibilityLabel,
  testID,
  ...pressableProps
}: ButtonProps) {
  const isIconOnly = size.startsWith("icon");
  const isDisabled = disabled || loading;
  const spinnerColor =
    variant === "default"
      ? theme.colors.primaryForeground
      : variant === "destructive"
        ? theme.colors.destructiveForeground
        : theme.colors.foreground;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      {...pressableProps}
      className={cn(
        "flex-row items-center justify-center border active:opacity-90",
        "disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        isIconOnly && "p-0",
        className,
      )}
    >
      <View
        className={cn(
          "flex-row items-center justify-center",
          isIconOnly ? "gap-0" : "gap-2",
          contentClassName,
        )}
      >
        {loading ? (
          <ActivityIndicator size="small" color={spinnerColor} />
        ) : (
          startIcon
        )}
        {typeof children === "string" || typeof children === "number" ? (
          <Text
            className={cn(
              "text-[15px] font-medium",
              textClasses[variant],
              textClassName,
            )}
          >
            {children}
          </Text>
        ) : (
          children
        )}
        {!loading && endIcon}
      </View>
    </Pressable>
  );
}
