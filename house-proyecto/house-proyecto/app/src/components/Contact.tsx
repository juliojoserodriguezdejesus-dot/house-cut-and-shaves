import React, { useCallback, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedProps, useAnimatedStyle, useReducedMotion } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { BIZ } from "../data";
import { ICONS } from "../icons";
import { later } from "../sfx";
import { C, F } from "../theme";
import { ease, useReveal } from "./Reveal";

const AnimatedPath = Animated.createAnimatedComponent(Path);
export const openUrl = (url: string) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL(url).catch(() => {}); };
const backOut = (t: number) => { "worklet"; const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const win = (p: number, a: number, b: number) => { "worklet"; return Math.min(1, Math.max(0, (p - a) / (b - a))); };

function PressScale({ onPress, label, children, style }: { onPress: () => void; label: string; children: React.ReactNode; style?: object }) {
  const [d, setD] = useState(false);
  return (
    <Pressable onPress={onPress} onPressIn={() => setD(true)} onPressOut={() => setD(false)} hitSlop={8} accessibilityRole="link" accessibilityLabel={label}>
      <Animated.View style={[style, { transform: [{ scale: d ? 0.95 : 1 }], transitionProperty: "transform", transitionDuration: "120ms" }]}>{children}</Animated.View>
    </Pressable>
  );
}

/** Dirección: un mini plano ilustrado donde la ruta se dibuja, el pin cae, y la dirección entra línea por línea. */
export function LocationPanel({ width }: { width: number }) {
  const reduced = useReducedMotion();
  const onShow = useCallback(() => { later(150, "swish", 0.4); later(1250, "drop", 0.8); later(1900, "shimmer", 0.4); }, []);
  const { p, onLayout } = useReveal(2600, onShow);
  const mw = width - 36, mh = mw * (186 / 300), px = mw * (216 / 300), py = mh * (80 / 186);
  const ROUTE = "M18 178 L52 150 L140 122 L216 112 L216 80";
  const route = useAnimatedProps(() => ({ strokeDashoffset: 380 * (1 - ease(p.get(), 0.05, 0.5)) }));
  const pin = useAnimatedStyle(() => { const t = win(p.get(), 0.42, 0.62);
    return { opacity: Math.min(1, t * 4), transform: [{ translateY: -(1 - backOut(t)) * 90 }, { scaleY: 0.85 + 0.15 * backOut(t) }] }; });
  const mapO = useAnimatedStyle(() => ({ opacity: ease(p.get(), 0, 0.2) }));
  const line = (a: number) => useAnimatedStyle(() => { const e = ease(p.get(), a, a + 0.16); return { opacity: e, transform: [{ translateX: -(1 - e) * 26 }] }; });
  const l1 = line(0.6), l2 = line(0.67), l3 = line(0.74), l4 = line(0.82);
  const lines = BIZ.addressLines;
  return (
    <Animated.View onLayout={onLayout} style={[st.card, { width }]}>
      <Animated.View style={[{ width: mw, height: mh }, mapO]}>
        <Svg width={mw} height={mh} viewBox="0 0 300 186">
          {["M0 150 L300 150", "M0 110 L300 120", "M0 60 L300 52", "M60 0 L52 186", "M130 0 L140 186", "M215 0 L220 186", "M0 186 L120 80 L300 20"].map((d, i) => (
            <Path key={i} d={d} stroke={C.gold} strokeOpacity={0.16} strokeWidth={i === 6 ? 5 : 3} strokeLinecap="round" fill="none" />
          ))}
          <AnimatedPath d={ROUTE} stroke={C.gold} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray={380} animatedProps={route} />
          <Circle cx={18} cy={178} r={4} fill={C.gold} />
          <Path d="M276 14 L280 26 L276 23 L272 26 Z" fill={C.gold} /><Line x1={276} y1={28} x2={276} y2={28} stroke={C.gold} />
        </Svg>
        {!reduced && [0, 1, 2].map((i) => (
          <Animated.View key={i} pointerEvents="none" style={[st.ring, { left: px - 30, top: py - 18, animationName: { from: { opacity: 0, transform: [{ scaleX: 0.2 }, { scaleY: 0.1 }] }, "20%": { opacity: 0.6 }, to: { opacity: 0, transform: [{ scaleX: 1.6 }, { scaleY: 0.8 }] } },
            animationDuration: "3s", animationDelay: `${2.2 + i}s`, animationIterationCount: "infinite", animationTimingFunction: "ease-out", animationFillMode: "backwards" }]} />
        ))}
        <Animated.View style={[{ position: "absolute", left: px - 15, top: py - 38 }, pin]}>
          <Svg width={30} height={40} viewBox="0 0 44 56"><Path d="M22 2C11 2 3 10 3 21c0 14 19 33 19 33s19-19 19-33C41 10 33 2 22 2z" fill={C.gold} /><Circle cx={22} cy={21} r={7} fill={C.disc} /></Svg>
        </Animated.View>
      </Animated.View>
      <View style={{ marginTop: 16, alignSelf: "stretch" }}>
        <Animated.Text style={[st.a1, l1]}>{lines[0]}</Animated.Text>
        <Animated.Text style={[st.a2, l2]}>{lines[1]}</Animated.Text>
        <Animated.Text style={[st.a2, l3]}>{lines[2]}</Animated.Text>
        <Animated.View style={[{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 }, l4]}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M12 21s-7-6.2-7-11a7 7 0 1114 0c0 4.8-7 11-7 11z" /><Circle cx={12} cy={10} r={2.4} /></Svg>
          <Text style={st.code}>Código Plus  {BIZ.plusCode}</Text>
        </Animated.View>
      </View>
      <PressScale onPress={() => openUrl(BIZ.maps)} label="Cómo llegar" style={st.btn}>
        <Text style={st.btnText}>Cómo llegar</Text>
        <Animated.View style={reduced ? undefined : { animationName: { from: { transform: [{ translateX: 0 }] }, to: { transform: [{ translateX: 6 }] } }, animationDuration: "0.9s", animationDirection: "alternate", animationIterationCount: "infinite", animationTimingFunction: "ease-in-out" }}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><Path d="M5 12h14M13 6l6 6-6 6" /></Svg>
        </Animated.View>
      </PressScale>
    </Animated.View>
  );
}

const LOGOS: { key: keyof typeof ICONS; label: string; url: string }[] = [
  { key: "whatsapp", label: "WhatsApp", url: BIZ.whatsapp }, { key: "instagram", label: "Instagram", url: BIZ.instagram }, { key: "facebook", label: "Facebook", url: BIZ.facebook },
];
function LogoDiamond({ i, p, item }: { i: number; p: any; item: (typeof LOGOS)[number] }) {
  const reduced = useReducedMotion();
  const sty = useAnimatedStyle(() => { const t = win(p.get(), i * 0.16, i * 0.16 + 0.5);
    return { opacity: Math.min(1, t * 3), transform: [{ scale: 0.2 + 0.8 * backOut(t) }, { rotate: `${(1 - backOut(t)) * -120}deg` }] }; });
  return (
    <Animated.View style={sty}>
      <PressScale onPress={() => openUrl(item.url)} label={item.label} style={{ alignItems: "center", width: 96 }}>
        <View style={{ width: 84, height: 84, alignItems: "center", justifyContent: "center" }}>
          {!reduced && <Animated.View pointerEvents="none" style={[st.halo, { animationName: { from: { opacity: 0.5, transform: [{ rotate: "45deg" }, { scale: 1 }] }, to: { opacity: 0, transform: [{ rotate: "45deg" }, { scale: 1.45 }] } }, animationDuration: "2.8s", animationDelay: `${1.6 + i * 0.5}s`, animationIterationCount: "infinite", animationTimingFunction: "ease-out", animationFillMode: "backwards" }]} />}
          <View style={st.diamond} />
          <Svg width={28} height={28} viewBox="0 0 24 24"><Path d={ICONS[item.key]} fill={C.gold} /></Svg>
        </View>
        <Text style={st.dLabel}>{item.label}</Text>
      </PressScale>
    </Animated.View>
  );
}
export function Socials() {
  const onShow = useCallback(() => { later(100, "shimmer", 0.5); }, []);
  const { p, onLayout } = useReveal(1500, onShow);
  return <View onLayout={onLayout} style={{ flexDirection: "row", justifyContent: "space-around" }}>{LOGOS.map((it, i) => <LogoDiamond key={it.key} i={i} p={p} item={it} />)}</View>;
}

/** Placa de teléfono: los dígitos giran al entrar, el auricular suena y un brillo recorre la placa. */
export function PhonePlaque({ width }: { width: number }) {
  const reduced = useReducedMotion();
  const onShow = useCallback(() => { later(250, "roll", 0.6); later(1100, "ting", 0.45); }, []);
  const { p, onLayout } = useReveal(1800, onShow);
  const chars = BIZ.phone.split("");
  const box = useAnimatedStyle(() => { const e = ease(p.get(), 0, 0.3); return { opacity: e, transform: [{ scale: 0.92 + 0.08 * e }] }; });
  return (
    <Animated.View onLayout={onLayout} style={[{ alignSelf: "center", marginTop: 26, width: Math.min(width, 340) }, box]}>
      <PressScale onPress={() => openUrl(BIZ.tel)} label={`Llamar al ${BIZ.phone}`} style={st.plaque}>
        <Animated.View style={[st.handset, reduced ? undefined : { animationName: { from: { transform: [{ rotate: "0deg" }] }, "6%": { transform: [{ rotate: "-16deg" }] }, "12%": { transform: [{ rotate: "14deg" }] }, "18%": { transform: [{ rotate: "-12deg" }] }, "24%": { transform: [{ rotate: "10deg" }] }, "30%": { transform: [{ rotate: "0deg" }] }, to: { transform: [{ rotate: "0deg" }] } },
          animationDuration: "3.2s", animationDelay: "2.2s", animationIterationCount: "infinite" }]}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
          </Svg>
        </Animated.View>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={st.cc}>Nicaragua  +505</Text>
          <View style={{ flexDirection: "row" }}>{chars.map((ch, i) => <Digit key={i} ch={ch} i={i} p={p} />)}</View>
          <Text style={st.hint}>Toca para llamar</Text>
        </View>
        {!reduced && (
          <Animated.View pointerEvents="none" style={[st.shine, { animationName: { from: { transform: [{ translateX: -120 }, { skewX: "-20deg" }] }, "40%": { transform: [{ translateX: 420 }, { skewX: "-20deg" }] }, to: { transform: [{ translateX: 420 }, { skewX: "-20deg" }] } }, animationDuration: "4.5s", animationDelay: "2.4s", animationIterationCount: "infinite", animationTimingFunction: "ease-in-out" }]}>
            <LinearGradient colors={["rgba(255,255,255,0)", "rgba(255,236,200,0.22)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
        )}
      </PressScale>
    </Animated.View>
  );
}
function Digit({ ch, i, p }: { ch: string; i: number; p: any }) {
  const sty = useAnimatedStyle(() => { const t = ease(p.get(), 0.2 + i * 0.05, 0.5 + i * 0.05);
    return { opacity: t, transform: [{ translateY: (1 - t) * 26 }, { scale: 0.8 + 0.2 * t }] }; });
  return <Animated.Text allowFontScaling={false} style={[st.digit, sty]}>{ch === " " ? "  " : ch}</Animated.Text>;
}

const st = StyleSheet.create({
  card: { backgroundColor: "rgba(28,53,52,0.55)", borderRadius: 22, padding: 18, borderWidth: 1, borderColor: "rgba(235,172,86,0.28)", overflow: "hidden" },
  ring: { position: "absolute", width: 60, height: 60, borderRadius: 30, borderWidth: 1.5, borderColor: C.gold },
  a1: { fontFamily: F.display, fontSize: 24, color: C.cream },
  a2: { fontFamily: F.ui, fontSize: 16, lineHeight: 24, color: "rgba(243,230,204,0.8)" },
  code: { fontFamily: F.ui, fontSize: 13, color: "rgba(243,230,204,0.6)" },
  btn: { marginTop: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14, borderRadius: 28, backgroundColor: C.gold },
  btnText: { fontFamily: F.uiBold, fontSize: 16, color: C.ink, letterSpacing: 0.4 },
  diamond: { position: "absolute", width: 56, height: 56, borderRadius: 7, backgroundColor: C.disc, borderWidth: 1.3, borderColor: C.gold, transform: [{ rotate: "45deg" }] },
  halo: { position: "absolute", width: 56, height: 56, borderRadius: 7, borderWidth: 1.3, borderColor: C.gold },
  dLabel: { fontFamily: F.ui, fontSize: 13, color: C.cream, marginTop: 4 },
  plaque: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16, paddingHorizontal: 16, borderRadius: 20, backgroundColor: "rgba(28,53,52,0.6)", borderWidth: 1.2, borderColor: "rgba(235,172,86,0.55)", overflow: "hidden" },
  handset: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" },
  cc: { fontFamily: F.ui, fontSize: 12, letterSpacing: 2, color: "rgba(243,230,204,0.6)" },
  digit: { fontFamily: F.display, fontSize: 32, letterSpacing: 1.5, color: C.gold, minWidth: 14, textAlign: "center" },
  hint: { fontFamily: F.ui, fontSize: 12, color: "rgba(243,230,204,0.55)", marginTop: 2 },
  shine: { position: "absolute", top: 0, bottom: 0, width: 70 },
});
