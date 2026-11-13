import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavCtx, Screen } from "../src/nav";
import { StoreProvider } from "../src/store";
import { C } from "../src/theme";

export default function Layout() {
  const router = useRouter();
  const nav = {
    back: () => (router.canGoBack() ? router.back() : router.replace("/inicio")),
    go: (s: Screen) => { if (s === "inicio") { if (router.canDismiss()) router.dismissAll(); router.replace("/inicio"); } else router.push(`/${s}` as never); },
  };
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="light" />
      <StoreProvider>
        <NavCtx.Provider value={nav}>
          <Stack screenOptions={{ headerShown: false, animation: "fade", contentStyle: { backgroundColor: C.bg } }} />
        </NavCtx.Provider>
      </StoreProvider>
    </GestureHandlerRootView>
  );
}
