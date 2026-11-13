import React from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { useAnimatedScrollHandler, useReducedMotion, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import { enter } from "../anim";
import { useNav } from "../nav";
import { C, F } from "../theme";
import { Motes } from "./Motes";
import { ScrollCtx } from "./Reveal";

const STEPS = ["Servicio", "Estilista", "Horario", "Pago"];

export function StepBar({ step }: { step: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
      {STEPS.map((l, i) => {
        const on = i + 1 <= step, cur = i + 1 === step;
        return (
          <View key={l} style={{ flexDirection: "row", alignItems: "flex-start" }}>
            {i > 0 && <View style={{ width: 22, height: 1.5, marginTop: 8, backgroundColor: on ? C.gold : "rgba(235,172,86,0.25)" }} />}
            <View style={{ alignItems: "center", width: 44 }}>
              <Animated.View style={[{ width: 13, height: 13, transform: [{ rotate: "45deg" }], borderWidth: 1.4, borderColor: C.gold, backgroundColor: on ? C.gold : "transparent", marginTop: 2 },
                cur ? { animationName: { from: { transform: [{ rotate: "45deg" }, { scale: 1 }] }, to: { transform: [{ rotate: "45deg" }, { scale: 1.35 }] } }, animationDuration: "0.9s", animationDirection: "alternate", animationIterationCount: "infinite", animationTimingFunction: "ease-in-out" } : undefined]} />
              <Text style={{ fontFamily: F.ui, fontSize: 10, marginTop: 6, color: on ? C.cream : "rgba(243,230,204,0.4)" }}>{l}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function Shell({ title, subtitle, step, children, footer }: { title: string; subtitle?: string; step?: number; children: React.ReactNode; footer?: React.ReactNode }) {
  const nav = useNav(), reduced = useReducedMotion(), insets = useSafeAreaInsets(), { height } = useWindowDimensions();
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => { y.set(e.contentOffset.y); });
  return (
    <ScrollCtx.Provider value={{ y, vh: height, offset: 0 }}>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <LinearGradient colors={[C.bg, C.bgGreen, "#0D1020"]} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
        {!reduced && <Motes count={9} startAt={0.3} />}
        <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); nav.back(); }} hitSlop={10} accessibilityRole="button" accessibilityLabel="Volver" style={st.back}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M19 12H5M11 6l-6 6 6 6" /></Svg>
          </Pressable>
          {step ? <StepBar step={step} /> : <View />}
        </View>
        <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: (footer ? 150 : 40) + insets.bottom }}>
          <View style={{ paddingHorizontal: 24, paddingTop: 18, width: "100%", maxWidth: 720, alignSelf: "center" }}>
            <Animated.Text style={[st.title, enter(reduced, 0.1, { y: 16, dur: 0.7 })]}>{title}</Animated.Text>
            {subtitle ? <Animated.Text style={[st.sub, enter(reduced, 0.25, { y: 10, dur: 0.7 })]}>{subtitle}</Animated.Text> : null}
            <Animated.View style={[st.rule, enter(reduced, 0.35, { y: 0, scale: 0.2, dur: 0.6 })]} />
            {children}
          </View>
        </Animated.ScrollView>
        {footer ? (
          <>
            <LinearGradient pointerEvents="none" colors={["rgba(13,16,32,0)", "#0D1020"]} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 140 + insets.bottom }} />
            <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center", paddingBottom: Math.max(insets.bottom, 14) + 8 }}>{footer}</View>
          </>
        ) : null}
      </View>
    </ScrollCtx.Provider>
  );
}
const st = StyleSheet.create({
  back: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(28,53,52,0.7)", borderWidth: 1, borderColor: "rgba(235,172,86,0.35)" },
  title: { fontFamily: F.displayItalic, fontSize: 32, lineHeight: 38, color: C.cream },
  sub: { fontFamily: F.ui, fontSize: 15, lineHeight: 22, color: "rgba(243,230,204,0.7)", marginTop: 6 },
  rule: { width: 48, height: 1.5, backgroundColor: C.gold, marginTop: 12, marginBottom: 22 },
});
