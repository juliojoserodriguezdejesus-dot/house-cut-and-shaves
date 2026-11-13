import React, { useRef, useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import { enter } from "../anim";
import { BarberPole } from "../components/BarberPole";
import { BookButton } from "../components/BookButton";
import { Field } from "../components/Field";
import { Reveal } from "../components/Reveal";
import { Shell } from "../components/Shell";
import { DEMO_PAYMENTS, dateLabel, money, timeLabel } from "../data";
import { useNav } from "../nav";
import { sfx } from "../sfx";
import { useStore } from "../store";
import { validateCard, validateCvv, validateExpiry, validateName } from "../validate";
import { C, F } from "../theme";

export default function Pago() {
  const nav = useNav(), { draft, book } = useStore(), reduced = useReducedMotion(), { width } = useWindowDimensions();
  const [v, setV] = useState({ name: "", num: "", exp: "", cvv: "" });
  const [err, setErr] = useState<Record<string, string | null>>({}), [shake, setShake] = useState(0), [busy, setBusy] = useState(false), [bookErr, setBookErr] = useState<string | null>(null);
  const lock = useRef(false);
  const total = draft.service?.price ?? 0, deposit = Math.round(total / 2);
  const rules: Record<string, (x?: typeof v) => string | null> = { name: (x = v) => validateName(x.name, "nombre del titular"), num: (x = v) => validateCard(x.num), exp: (x = v) => validateExpiry(x.exp), cvv: (x = v) => validateCvv(x.cvv) };
  const fmt: Record<string, (t: string) => string> = {
    num: (t) => t.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 "),
    exp: (t) => { const d = t.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d; }, cvv: (t) => t.replace(/\D/g, "").slice(0, 4), name: (t) => t,
  };
  const set = (k: keyof typeof v) => (t: string) => { const nx = { ...v, [k]: fmt[k](t) }; setV(nx); if (err[k] !== undefined) setErr((e) => ({ ...e, [k]: rules[k](nx) })); };
  const blur = (k: string) => () => setErr((e) => ({ ...e, [k]: rules[k]() }));
  const pay = () => {
    if (lock.current || !draft.service) return;
    const all = Object.fromEntries(Object.keys(rules).map((k) => [k, rules[k]()])); setErr(all);
    if (Object.values(all).some(Boolean)) { setShake((s) => s + 1); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); sfx("thud", 0.7, true); return; }
    lock.current = true; setBusy(true); setBookErr(null); sfx("roll", 0.6, true);
    Promise.all([book(deposit, total), new Promise((r) => setTimeout(r, 1900))]).then(([r]) => {
      if (r.ok) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); nav.go("confirmacion"); }
      else { setBusy(false); lock.current = false; setBookErr(r.error); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); sfx("thud", 0.7, true); }
    });
  };
  const Row = ({ a, b, bold }: { a: string; b: string; bold?: boolean }) => (<View style={st.row}><Text style={[st.a, bold && { color: C.cream }]}>{a}</Text><Text style={[st.b, bold && { color: C.gold, fontSize: 20 }]}>{b}</Text></View>);
  return (
    <>
      <Shell step={4} title="Confirma tu reserva" subtitle="Un último paso para asegurar tu lugar."
        footer={<BookButton label={`Pagar ${money(deposit)}`} onPress={pay} reduced={reduced} width={Math.min(width - 56, 340)} delay={0.6} />}>
        <Animated.View style={[st.ticket, enter(reduced, 0.4, { y: 22, dur: 0.7 })]}>
          <Text style={st.svc}>{draft.service?.name}</Text>
          <Text style={st.meta}>con {draft.stylist?.name} · {draft.date ? dateLabel(draft.date) : ""} · {draft.time ? timeLabel(draft.time) : ""}</Text>
          <View style={st.dash} />
          <Row a={draft.service?.from ? "Precio desde" : "Precio"} b={money(total)} />
          <Row a="Adelanto del 50 % (hoy)" b={money(deposit)} bold />
          <Row a="Resto al llegar" b={money(total - deposit)} />
        </Animated.View>
        <Reveal sfx="swish" style={{ marginTop: 18 }}>
          <View style={st.why}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" /><Path d="M8.5 12l2.5 2.5L16 9.5" /></Svg>
            <View style={{ flex: 1 }}>
              <Text style={st.whyT}>¿Por qué pagar el 50 %?</Text>
              <Text style={st.whyP}>El adelanto es un requisito para poder agendar tu cita: reserva tu espacio con tu estilista. Se descuenta del total y el resto lo pagas al llegar.</Text>
            </View>
          </View>
        </Reveal>
        <Reveal style={{ marginTop: 26 }}>
          <Text style={st.h}>Pago con tarjeta</Text>
          <Field label="Nombre del titular" value={v.name} onChangeText={set("name")} onBlur={blur("name")} error={err.name} autoCapitalize="words" shake={shake} maxLength={40} autoComplete="cc-name" />
          <Field label="Número de tarjeta" value={v.num} onChangeText={set("num")} onBlur={blur("num")} error={err.num} keyboardType="number-pad" shake={shake} maxLength={23} autoComplete="cc-number" />
          <View style={{ flexDirection: "row", gap: 18 }}>
            <View style={{ flex: 1 }}><Field label="Vence (MM/AA)" value={v.exp} onChangeText={set("exp")} onBlur={blur("exp")} error={err.exp} keyboardType="number-pad" shake={shake} maxLength={5} autoComplete="cc-exp" /></View>
            <View style={{ flex: 1 }}><Field label="CVV" value={v.cvv} onChangeText={set("cvv")} onBlur={blur("cvv")} error={err.cvv} keyboardType="number-pad" secure shake={shake} maxLength={4} autoComplete="cc-csc" /></View>
          </View>
          {bookErr && <View style={[st.why, { marginTop: 14, borderColor: "#D4604F" }]}><View style={{ flex: 1 }}><Text style={st.whyP}>{bookErr}</Text><Text onPress={() => nav.back()} style={[st.whyT, { color: C.gold, marginTop: 8, textDecorationLine: "underline" }]}>Elegir otra hora</Text></View></View>}
          {DEMO_PAYMENTS && <Text style={st.demo}>Pago de demostración: no se realiza ningún cobro real ni se guardan datos de tu tarjeta.</Text>}
        </Reveal>
      </Shell>
      {busy && (
        <View style={st.overlay}>
          <BarberPole width={26} style={{ height: 150 }} />
          <Animated.Text style={[st.proc, { animationName: { from: { opacity: 0.5 }, to: { opacity: 1 } }, animationDuration: "0.8s", animationDirection: "alternate", animationIterationCount: "infinite" }]}>Procesando tu pago…</Animated.Text>
        </View>
      )}
    </>
  );
}
const st = StyleSheet.create({
  ticket: { padding: 20, borderRadius: 18, backgroundColor: "rgba(28,53,52,0.6)", borderWidth: 1.2, borderColor: "rgba(235,172,86,0.4)" },
  svc: { fontFamily: F.display, fontSize: 24, color: C.cream }, meta: { fontFamily: F.ui, fontSize: 14, lineHeight: 20, color: "rgba(243,230,204,0.75)", marginTop: 4 },
  dash: { height: 1, marginVertical: 14, borderTopWidth: 1, borderTopColor: "rgba(235,172,86,0.35)" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  a: { fontFamily: F.ui, fontSize: 15, color: "rgba(243,230,204,0.7)" }, b: { fontFamily: F.uiBold, fontSize: 16, color: C.cream },
  why: { flexDirection: "row", gap: 12, padding: 16, borderRadius: 16, backgroundColor: "rgba(235,172,86,0.1)", borderWidth: 1, borderColor: "rgba(235,172,86,0.35)" },
  whyT: { fontFamily: F.uiBold, fontSize: 15, color: C.cream }, whyP: { fontFamily: F.ui, fontSize: 14, lineHeight: 21, color: "rgba(243,230,204,0.8)", marginTop: 3 },
  h: { fontFamily: F.displayItalic, fontSize: 24, color: C.cream, marginBottom: 4 },
  demo: { fontFamily: F.ui, fontSize: 12, color: "rgba(243,230,204,0.5)", marginTop: 8, lineHeight: 17 },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 60, alignItems: "center", justifyContent: "center", gap: 24, backgroundColor: "rgba(10,13,15,0.94)" },
  proc: { fontFamily: F.displayItalic, fontSize: 24, color: C.cream },
});
