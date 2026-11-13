import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import { enter } from "../anim";
import { Shell } from "../components/Shell";
import { Service, SERVICES, money } from "../data";
import { useNav } from "../nav";
import { sfx } from "../sfx";
import { useStore } from "../store";
import { C, F } from "../theme";

const ICON: Record<Service["icon"], string[]> = {
  scissors: ["M6 3a3 3 0 100 6 3 3 0 000-6zM6 15a3 3 0 100 6 3 3 0 000-6zM20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12"],
  razor: ["M4 18L16 6l3 3L7 21H4z", "M14 8l3 3"], drop: ["M12 2.7s6 6.3 6 10.6a6 6 0 01-12 0c0-4.3 6-10.6 6-10.6z"],
  sparkle: ["M12 2l2 6.5L20.5 10 14 12l-2 6.5L10 12 3.5 10 10 8.5z", "M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"],
  leaf: ["M5 19C5 10 10 5 20 4c0 10-5 15-14 15", "M5 19c3-5 6-8 10-10"],
};
export const ServiceIcon = ({ kind, size = 28 }: { kind: Service["icon"]; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">{ICON[kind].map((d) => <Path key={d} d={d} />)}</Svg>
);

export default function Servicios() {
  const nav = useNav(), { setDraft } = useStore(), reduced = useReducedMotion(), { width } = useWindowDimensions();
  const [picked, setPicked] = useState<string | null>(null);
  const w = (Math.min(width, 720) - 48 - 14) / 2;
  const pick = (s: Service) => {
    if (picked) return; setPicked(s.id); setDraft({ service: s, stylist: undefined, date: undefined, time: undefined });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); sfx("snip", 0.8, true); setTimeout(() => sfx("ting", 0.5, true), 160); setTimeout(() => nav.go("estilistas"), 520);
  };
  return (
    <Shell step={1} title="Te ofrecemos estos servicios" subtitle="Toca el que necesitas y seguimos con tu estilista.">
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
        {SERVICES.map((s, i) => {
          const on = picked === s.id;
          return (
            <Animated.View key={s.id} style={[{ width: w }, enter(reduced, 0.35 + i * 0.07, { y: 24, scale: 0.92, dur: 0.55 })]}>
              <Pressable onPress={() => pick(s)} accessibilityRole="button" accessibilityLabel={`${s.name}, ${s.from ? "desde " : ""}${money(s.price)}`}>
                {({ pressed }) => (
                  <Animated.View style={[st.card, on && st.on, { transform: [{ scale: pressed ? 0.96 : on ? 1.03 : 1 }], transitionProperty: ["transform", "borderColor"], transitionDuration: 150 }]}>
                    <View style={st.diamondWrap}><View style={st.diamond} /><ServiceIcon kind={s.icon} /></View>
                    <Text style={st.name} numberOfLines={3}>{s.name}</Text>
                    {s.sub ? <Text style={st.sub}>{s.sub}</Text> : null}
                    <View style={{ flex: 1 }} />
                    <Text style={st.price}>{s.from ? <Text style={st.from}>desde </Text> : null}{money(s.price)}</Text>
                    {on && <Animated.View style={st.check}><Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round"><Path d="M5 12.5l5 5L20 7" /></Svg></Animated.View>}
                  </Animated.View>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </Shell>
  );
}
const st = StyleSheet.create({
  card: { minHeight: 176, padding: 14, borderRadius: 16, backgroundColor: "rgba(28,53,52,0.55)", borderWidth: 1.2, borderColor: "rgba(235,172,86,0.3)" },
  on: { borderColor: C.gold, backgroundColor: "rgba(235,172,86,0.14)" },
  diamondWrap: { width: 52, height: 52, alignItems: "center", justifyContent: "center", marginBottom: 8, marginLeft: -2 },
  diamond: { position: "absolute", width: 36, height: 36, borderRadius: 5, borderWidth: 1.2, borderColor: C.gold, transform: [{ rotate: "45deg" }] },
  name: { fontFamily: F.display, fontSize: 17, lineHeight: 21, color: C.cream },
  sub: { fontFamily: F.ui, fontSize: 12, color: "rgba(243,230,204,0.65)", marginTop: 2 },
  price: { fontFamily: F.uiBold, fontSize: 18, color: C.gold }, from: { fontFamily: F.ui, fontSize: 12, color: "rgba(235,172,86,0.8)" },
  check: { position: "absolute", top: 10, right: 10, width: 24, height: 24, borderRadius: 12, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" },
});
