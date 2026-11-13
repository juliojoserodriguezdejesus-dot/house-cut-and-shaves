import React, { useState } from "react";
import { useWindowDimensions } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { BookButton } from "../components/BookButton";
import { Field } from "../components/Field";
import { Shell } from "../components/Shell";
import { sfx } from "../sfx";
import { useNav } from "../nav";
import { useStore } from "../store";
import { digitsOf, validatePhone } from "../validate";

export default function Entrar() {
  const nav = useNav(), { login } = useStore(), reduced = useReducedMotion(), { width } = useWindowDimensions();
  const [v, setV] = useState({ phone: "", pw: "" }), [err, setErr] = useState<Record<string, string | null>>({}), [shake, setShake] = useState(0);
  const go = async () => {
    const e = { phone: validatePhone(v.phone), pw: v.pw ? null : "Escribe tu contraseña" };
    if (!e.phone && !e.pw) { const r = await login(digitsOf(v.phone), v.pw); if (!r) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); sfx("ting", 0.8, true); return nav.go("servicios"); } e.pw = r.message; }
    setErr(e); setShake((s) => s + 1); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); sfx("thud", 0.7, true);
  };
  return (
    <Shell title="Bienvenido de vuelta" subtitle="Entra con tu teléfono y tu contraseña para ver y agendar tus citas."
      footer={<BookButton label="Entrar" onPress={go} reduced={reduced} width={Math.min(width - 56, 340)} delay={0.5} />}>
      <Field label="Teléfono" prefix="+505" value={v.phone} onChangeText={(t) => setV({ ...v, phone: t.replace(/[^\d+\s\-]/g, "") })} error={err.phone} keyboardType="phone-pad" shake={shake} maxLength={14} />
      <Field label="Contraseña" value={v.pw} onChangeText={(t) => setV({ ...v, pw: t })} error={err.pw} secure shake={shake} maxLength={64} />
    </Shell>
  );
}
