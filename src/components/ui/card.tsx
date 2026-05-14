import type { ReactNode } from "react";
import { Text, View, type ViewProps } from "react-native";

import { cn } from "./cn";

export interface CardProps extends Omit<ViewProps, "children" | "style" | "className"> {
  children?: ReactNode;
  className?: string;
  testID?: string;
}

export function Card({ children, className, testID, ...viewProps }: CardProps) {
  return (
    <View
      testID={testID}
      className={cn("overflow-hidden rounded-3xl border border-border bg-card shadow-card", className)}
      {...viewProps}
    >
      {children}
    </View>
  );
}

export function CardHeader({ children, className, testID, ...viewProps }: CardProps) {
  return (
    <View testID={testID} className={cn("gap-2 px-5 pt-5 pb-3", className)} {...viewProps}>
      {children}
    </View>
  );
}

export function CardContent({ children, className, testID, ...viewProps }: CardProps) {
  return (
    <View testID={testID} className={cn("px-5 pb-5", className)} {...viewProps}>
      {children}
    </View>
  );
}

export function CardFooter({ children, className, testID, ...viewProps }: CardProps) {
  return (
    <View testID={testID} className={cn("px-5 pb-5 pt-1", className)} {...viewProps}>
      {children}
    </View>
  );
}

export function CardTitle({
  children,
  className,
  testID,
  ...textProps
}: CardProps) {
  return (
    <Text testID={testID} className={cn("font-serif text-[18px] leading-6 text-foreground", className)} {...textProps}>
      {children}
    </Text>
  );
}

export function CardDescription({
  children,
  className,
  testID,
  ...textProps
}: CardProps) {
  return (
    <Text testID={testID} className={cn("text-[13px] leading-5 text-muted-foreground", className)} {...textProps}>
      {children}
    </Text>
  );
}
