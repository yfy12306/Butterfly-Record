import { NotoSerifSC_400Regular, NotoSerifSC_500Medium, useFonts as useSerifFonts } from "@expo-google-fonts/noto-serif-sc";
import {
  SourceSans3_400Regular,
  SourceSans3_500Medium,
  SourceSans3_600SemiBold,
  useFonts as useSansFonts,
} from "@expo-google-fonts/source-sans-3";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ButterflyDataProvider } from "@/state/butterfly-data";

void SplashScreen.preventAutoHideAsync();
void SystemUI.setBackgroundColorAsync("#f7f8f4");

export default function RootLayout() {
  const [serifLoaded] = useSerifFonts({
    NotoSerifSC_400Regular,
    NotoSerifSC_500Medium,
  });
  const [sansLoaded] = useSansFonts({
    SourceSans3_400Regular,
    SourceSans3_500Medium,
    SourceSans3_600SemiBold,
  });

  const isReady = serifLoaded && sansLoaded;

  useEffect(() => {
    if (isReady) {
      void SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return <View className="flex-1 bg-background" />;
  }

  return (
    <SafeAreaProvider>
      <ButterflyDataProvider>
        <StatusBar style="dark" />
        <Slot />
      </ButterflyDataProvider>
    </SafeAreaProvider>
  );
}
