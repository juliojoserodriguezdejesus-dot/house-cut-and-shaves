import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedProps, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { EASE_IN_OUT_WT } from "../anim";
import { C, F } from "../theme";

const AP = Animated.createAnimatedComponent(Path), AC = Animated.createAnimatedComponent(Circle);

/** Notificación que cae desde arriba con un check que se dibuja. */
export function SuccessToast({ title, subtitle }: { title: string; subtitle: string }) {
  const insets = useSafeAreaInsets(), c = useSharedValue(0);
  useEffect(() => { c.set(withDelay(300, withTiming(1, { duration: 700, easing: EASE_IN_OUT_WT }))); }, [c]);
  const ring = useAnimatedProps(() => ({ strokeDashoffset: 126 * (1 - Math.min(1, c.get() * 1.6)) }));
  const tick = useAnimatedProps(() => ({ strokeDashoffset: 30 * (1 - Math.max(0, c.get() * 2 - 1)) }));
  return (
    <Animated.View pointerEvents="none" style={[st.toast, { top: insets.top + 10, animationName: { from: { opacity: 0, transform: [{ translateY: -150 }, { scale: 0.92 }] },
      "55%": { opacity: 1, transform: [{ translateY: 10 }, { scale: 1 }] }, to: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] } },
      animationDuration: "0.7s", animationTimingFunction: "ease-out", animationFillMode: "both" }]}>
      <Svg width={44} height={44} viewBox="0 0 44 44" fill="none">
        <AC cx={22} cy={22} r={20} stroke={C.gold} strokeWidth={2.4} strokeDasharray={126} animatedProps={ring} strokeLinecap="round" />
        <AP d="M13 23 L19.5 29.5 L31 16" stroke={C.gold} strokeWidth={3} strokeDasharray={30} animatedProps={tick} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      <View style={{ flex: 1 }}><Text style={st.t}>{title}</Text><Text style={st.s}>{subtitle}</Text></View>
    </Animated.View>
  );
}
const st = StyleSheet.create({
  toast: { position: "absolute", left: 16, right: 16, zIndex: 50, flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 18,
    backgroundColor: "#16302D", borderWidth: 1.2, borderColor: C.gold },
  t: { fontFamily: F.uiBold, fontSize: 17, color: C.cream }, s: { fontFamily: F.ui, fontSize: 13.5, color: "rgba(243,230,204,0.75)", marginTop: 2 },
});
