import React, { useRef, useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { BarberPole } from "../components/BarberPole";
import { BookButton } from "../components/BookButton";
import { Field } from "../components/Field";
import { Pressable } from "react-native";
import { Shell } from "../components/Shell";
import { SuccessToast } from "../components/SuccessToast";
import { enter } from "../anim";
import { digitsOf, passwordStrength, cleanName, validateConfirm, validateName, validatePassword, validatePhone } from "../validate";
import { sfx } from "../sfx";
import { useNav } from "../nav";
import { useStore } from "../store";
import { C, F } from "../theme";

const LEVELS = ["Muy débil", "Débil", "Aceptable", "Buena", "Excelente"], COLORS = ["#C0584A", "#D98A3D", "#D9B93D", "#8FB867", "#5FBF8A"];

export default function Registro() {
  const nav = useNav(), { register, mode } = useStore(), reduced = useReducedMotion(), { width } = useWindowDimensions();
  const [v, setV] = useState({ first: "", last: "", phone: "", pw: "", pw2: "" });
  const [err, setErr] = useState<Record<string, string | null>>({});
  const [shake, setShake] = useState(0), [done, setDone] = useState(false);
  const busy = useRef(false);
  const rules: Record<string, (x?: typeof v) => string | null> = {
    first: (x = v) => validateName(x.first, "nombre"), last: (x = v) => validateName(x.last, "apellido"), phone: (x = v) => validatePhone(x.phone),
    pw: (x = v) => validatePassword(x.pw, x.phone), pw2: (x = v) => validateConfirm(x.pw, x.pw2),
  };
  const set = (k: keyof typeof v) => (t: string) => {
    const nx = { ...v, [k]: k === "phone" ? t.replace(/[^\d+\s\-]/g, "") : t }; setV(nx);
    if (err[k] !== undefined) setErr((e) => ({ ...e, [k]: rules[k](nx), ...(k === "pw" && e.pw2 !== undefined ? { pw2: rules.pw2(nx) } : {}) }));
  };
  const blur = (k: string) => () => setErr((e) => ({ ...e, [k]: rules[k]() }));

  const submit = async () => {
    if (busy.current || done) return;
    const all = Object.fromEntries(Object.keys(rules).map((k) => [k, rules[k]()]));
    setErr(all);
    if (Object.values(all).some(Boolean)) { setShake((s) => s + 1); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); sfx("thud", 0.7, true); return; }
    busy.current = true;
    const e = await register({ first: cleanName(v.first), last: cleanName(v.last), phone: digitsOf(v.phone), password: v.pw });
    if (e) { busy.current = false; const k = e.field === "password" ? "pw" : e.field ?? "pw2"; setErr((x) => ({ ...x, [k]: e.message })); setShake((n) => n + 1); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); sfx("thud", 0.7, true); return; }
    setDone(true); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); sfx("shimmer", 0.8, true); setTimeout(() => sfx("ting", 0.7, true), 350);
    setTimeout(() => nav.go("servicios"), 1900);
  };
  const s = passwordStrength(v.pw);
  return (
    <>
      <Shell title="Crea tu cuenta" subtitle="Así guardamos tus citas y te avisamos cuando estén listas."
        footer={<BookButton label="Crear mi cuenta" onPress={submit} reduced={reduced} width={Math.min(width - 56, 340)} delay={0.6} />}>
        <Animated.View style={[st.card, enter(reduced, 0.4, { y: 24, dur: 0.7 })]}>
          <BarberPole width={20} style={{ alignSelf: "stretch", marginRight: 18 }} />
          <View style={{ flex: 1 }}>
            <Field label="Nombre" value={v.first} onChangeText={set("first")} onBlur={blur("first")} error={err.first} autoCapitalize="words" shake={shake} maxLength={30} autoComplete="given-name" />
            <Field label="Apellido" value={v.last} onChangeText={set("last")} onBlur={blur("last")} error={err.last} autoCapitalize="words" shake={shake} maxLength={30} autoComplete="family-name" />
            <Field label="Teléfono" prefix="+505" value={v.phone} onChangeText={set("phone")} onBlur={blur("phone")} error={err.phone} keyboardType="phone-pad" shake={shake} maxLength={14} autoComplete="tel" />
            <Field label="Contraseña" value={v.pw} onChangeText={set("pw")} onBlur={blur("pw")} error={err.pw} secure shake={shake} maxLength={64} autoComplete="new-password" />
            <View style={{ flexDirection: "row", gap: 5, marginBottom: 6, opacity: v.pw ? 1 : 0.35 }}>
              {[0, 1, 2, 3].map((i) => <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < s || (s === 4) ? COLORS[s] : "rgba(243,230,204,0.15)", transitionProperty: "backgroundColor", transitionDuration: 250 } as any} />)}
            </View>
            <Text style={st.hint}>{v.pw ? `Seguridad: ${LEVELS[s]}` : "8 caracteres o más, con letras y números"}</Text>
            <Field label="Repite la contraseña" value={v.pw2} onChangeText={set("pw2")} onBlur={blur("pw2")} error={err.pw2} secure shake={shake} maxLength={64} />
          </View>
        </Animated.View>
        <Text style={st.legal}>{mode === "api" ? "Guardamos tu contraseña cifrada; nadie, ni el personal, puede verla." : "Tu cuenta se guarda en este dispositivo. Nunca guardamos tu contraseña en texto."}</Text>
        {mode === "api" && <Pressable onPress={() => nav.go("entrar")} accessibilityRole="button" style={{ alignSelf: "center", padding: 12 }}><Text style={[st.legal, { color: C.gold, marginTop: 0, textDecorationLine: "underline" }]}>¿Ya tienes cuenta? Inicia sesión</Text></Pressable>}
      </Shell>
      {done && <SuccessToast title="¡Usuario creado con éxito!" subtitle="Ya puedes agendar tu cita." />}
    </>
  );
}
const st = StyleSheet.create({
  card: { flexDirection: "row", padding: 18, borderRadius: 20, backgroundColor: "rgba(28,53,52,0.55)", borderWidth: 1.2, borderColor: "rgba(235,172,86,0.35)" },
  hint: { fontFamily: F.ui, fontSize: 12.5, color: "rgba(243,230,204,0.6)", marginBottom: 6 },
  legal: { fontFamily: F.ui, fontSize: 12, color: "rgba(243,230,204,0.45)", textAlign: "center", marginTop: 16 },
});
