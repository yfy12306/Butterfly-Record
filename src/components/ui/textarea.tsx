import type { ReactNode } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";

import { theme } from "@/theme";
import { cn } from "./cn";

export interface TextareaProps extends Omit<TextInputProps, "children" | "style" | "className"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  inputClassName?: string;
  testID?: string;
}

export function Textarea({
  label,
  hint,
  error,
  className,
  inputClassName,
  testID,
  numberOfLines = 4,
  ...textInputProps
}: TextareaProps) {
  const hasError = Boolean(error);

  return (
    <View className="gap-2">
      {label ? (
        <Text className="text-[13px] font-medium tracking-[0.02em] text-foreground">{label}</Text>
      ) : null}
      <View
        testID={testID}
        className={cn(
          "rounded-2xl border bg-background px-4 py-3",
          hasError ? "border-destructive" : "border-border",
          className,
        )}
      >
        <TextInput
          multiline
          numberOfLines={numberOfLines}
          textAlignVertical="top"
          placeholderTextColor={theme.colors.mutedForeground}
          cursorColor={theme.colors.primary}
          selectionColor={theme.colors.primary}
          className={cn("min-h-24 text-[15px] leading-5 text-foreground placeholder:text-muted-foreground", inputClassName)}
          {...textInputProps}
        />
      </View>
      {error ? (
        <Text className="text-[12px] leading-4 text-destructive">{error}</Text>
      ) : hint ? (
        <Text className="text-[12px] leading-4 text-muted-foreground">{hint}</Text>
      ) : null}
    </View>
  );
}
