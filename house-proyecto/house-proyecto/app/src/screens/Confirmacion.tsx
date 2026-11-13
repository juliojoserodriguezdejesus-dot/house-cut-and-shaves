import React, { useEffect } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { useAnimatedProps, useReducedMotion, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Svg, { Circle, Path } from "react-native-svg";
import { EASE_IN_OUT_WT, enter } from "../anim";
import { BookButton } from "../components/BookButton";
import { Motes } from "../components/Motes";
import { Sparkle } from "../components/Sparkle";
import { dateLabel, money, timeLabel } from "../data";
import { useNav } from "../nav";
import { sfx } from "../sfx";
import { useStore } from "../store";
import { C, F } from "../theme";

const AC = Animated.createAnimatedComponent(Circle), AP = Animated.createAnimatedComponent(Path);

export default function Confirmacion() {
  const nav = useNav(), { draft, resetDraft } = useStore(), reduced = useReducedMotion(), insets = useSafeAreaInsets(), { width } = useWindowDimensions();
  const c = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (!reduced) c.set(withDelay(250, withTiming(1, { duration: 1000, easing: EASE_IN_OUT_WT })));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const t = [setTimeout(() => sfx("ting", 0.8, true), 700), setTimeout(() => sfx("shimmer", 0.7, true), 950), setTimeout(() => sfx("roll", 0.4, true), 1500)];
    return () => t.forEach(clearTimeout);
  }, [c, reduced]);
  const ring = useAnimatedProps(() => ({ strokeDashoffset: 264 * (1 - Math.min(1, c.get() * 1.5)) }));
  const tick = useAnimatedProps(() => ({ strokeDashoffset: 60 * (1 - Math.max(0, c.get() * 3 - 2)) }));
  const total = draft.service?.price ?? 0, paid = Math.round(total / 2);
  const rows: [string, string][] = [["Servicio", draft.service?.name ?? ""], ["Estilista", draft.stylist?.name ?? ""], ["Fecha", draft.date ? dateLabel(draft.date) : ""], ["Hora", draft.time ? timeLabel(draft.time) : ""],
    ["Adelanto pagado", money(paid)], ["Resto al llegar", money(total - paid)]];
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top + 36, alignItems: "center" }}>
      <LinearGradient colors={[C.bg, C.bgGreen, "#0D1020"]} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
      {!reduced && <Motes count={14} startAt={0.2} />}
      <View style={{ width: 120, height: 120 }}>
        <Svg width={120} height={120} viewBox="0 0 100 100" fill="none">
          <AC cx={50} cy={50} r={42} stroke={C.gold} strokeWidth={3} strokeDasharray={264} animatedProps={ring} strokeLinecap="round" rotation={-90} origin="50,50" />
          <AP d="M30 52 L44 66 L71 36" stroke={C.gold} strokeWidth={5} strokeDasharray={60} animatedProps={tick} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
        {!reduced && <><Sparkle left={8} top={14} size={16} delay={1.1} period={3.6} /><Sparkle left={112} top={28} size={13} delay={1.5} period={4.2} /><Sparkle left={100} top={108} size={12} delay={1.9} period={3.9} /></>}
      </View>
      <Animated.Text style={[st.t, enter(reduced, 0.9, { y: 18, dur: 0.7 })]}>¡Tu cita ha sido programada con éxito!</Animated.Text>
      <Animated.Text style={[st.s, enter(reduced, 1.1, { y: 12, dur: 0.7 })]}>Te esperamos en House Cuts & Shaves.</Animated.Text>
      <Animated.View style={[st.ticket, { width: width - 48 }, enter(reduced, 1.3, { y: 30, dur: 0.8 })]}>
        {rows.map(([a, b], i) => (
          <View key={a} style={[st.row, i === 4 && { borderTopWidth: 1, borderTopColor: "rgba(235,172,86,0.3)", marginTop: 8, paddingTop: 12 }]}>
            <Text style={st.a}>{a}</Text><Text style={[st.b, i === 4 && { color: C.gold }]}>{b}</Text>
          </View>
        ))}
      </Animated.View>
      <View style={{ position: "absolute", bottom: Math.max(insets.bottom, 14) + 22 }}>
        <BookButton label="Volver al inicio" onPress={() => { resetDraft(); nav.go("inicio"); }} reduced={reduced} width={Math.min(width - 56, 340)} delay={1.8} />
      </View>
    </View>
  );
}
const st = StyleSheet.create({
  t: { fontFamily: F.displayItalic, fontSize: 30, lineHeight: 36, color: C.cream, textAlign: "center", marginTop: 20, paddingHorizontal: 24 },
  s: { fontFamily: F.ui, fontSize: 15, color: "rgba(243,230,204,0.7)", marginTop: 8 },
  ticket: { marginTop: 26, padding: 20, borderRadius: 18, backgroundColor: "rgba(28,53,52,0.6)", borderWidth: 1.2, borderColor: "rgba(235,172,86,0.4)" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }, a: { fontFamily: F.ui, fontSize: 14, color: "rgba(243,230,204,0.65)" }, b: { fontFamily: F.uiBold, fontSize: 15, color: C.cream, flexShrink: 1, textAlign: "right", marginLeft: 12 },
});
