import type { ReactNode } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";

import { theme } from "@/theme";
import { cn } from "./cn";

export interface InputProps extends Omit<TextInputProps, "children" | "style" | "className"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  className?: string;
  inputClassName?: string;
  testID?: string;
}

const baseInputClassName =
  "min-h-12 flex-1 text-[15px] leading-5 text-foreground placeholder:text-muted-foreground";

export function Input({
  label,
  hint,
  error,
  startAdornment,
  endAdornment,
  className,
  inputClassName,
  testID,
  ...textInputProps
}: InputProps) {
  const hasError = Boolean(error);

  return (
    <View className="gap-2">
      {label ? (
        <Text className="text-[13px] font-medium tracking-[0.02em] text-foreground">{label}</Text>
      ) : null}
      <View
        testID={testID}
        className={cn(
          "flex-row items-center gap-3 rounded-2xl border bg-background px-4",
          hasError ? "border-destructive" : "border-border",
          className,
        )}
      >
        {startAdornment}
        <TextInput
          placeholderTextColor={theme.colors.mutedForeground}
          cursorColor={theme.colors.primary}
          selectionColor={theme.colors.primary}
          className={cn(baseInputClassName, inputClassName)}
          {...textInputProps}
        />
        {endAdornment}
      </View>
      {error ? (
        <Text className="text-[12px] leading-4 text-destructive">{error}</Text>
      ) : hint ? (
        <Text className="text-[12px] leading-4 text-muted-foreground">{hint}</Text>
      ) : null}
    </View>
  );
}
