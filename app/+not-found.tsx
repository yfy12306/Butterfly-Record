import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "未找到页面" }} />
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="font-serif text-2xl text-foreground">页面不存在</Text>
        <Text className="mt-3 text-center text-base text-muted-foreground">
          这个页面可能已经被移动，或者链接本身有误。
        </Text>
        <Link href="/" className="mt-6 rounded-full bg-primary px-5 py-3">
          <Text className="font-sans text-base text-primary-foreground">返回首页</Text>
        </Link>
      </View>
    </>
  );
}
