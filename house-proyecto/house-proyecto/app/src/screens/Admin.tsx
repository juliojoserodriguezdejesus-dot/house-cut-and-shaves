import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { enter } from "../anim";
import { BookButton } from "../components/BookButton";
import { Field } from "../components/Field";
import { Shell } from "../components/Shell";
import { ADMIN_SETUP_CODE, DOW, MONTHS, STAFF, STYLISTS, allSlots, money, nextDays, timeLabel } from "../data";
import { sfx } from "../sfx";
import { Appt, useStore } from "../store";
import { validateConfirm, validatePassword } from "../validate";
import { C, F } from "../theme";

const BUSY = "#D4604F";
const buzz = (ok: boolean) => { Haptics.notificationAsync(ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error); sfx(ok ? "ting" : "thud", 0.7, true); };

function Login() {
  const { mode, hasStaff, createStaffLocal, staffLogin } = useStore(), reduced = useReducedMotion(), { width } = useWindowDimensions();
  const [sid, setSid] = useState(STAFF[0].id), [v, setV] = useState({ code: "", pw: "", pw2: "" }), [err, setErr] = useState<Record<string, string | null>>({}), [shake, setShake] = useState(0);
  const setup = mode === "local" && !hasStaff(sid);
  const fail = (e: Record<string, string | null>) => { setErr(e); setShake((n) => n + 1); buzz(false); };
  const go = async () => {
    if (setup) {
      const e = { code: v.code.trim() === ADMIN_SETUP_CODE ? null : "Código de administrador incorrecto", pw: validatePassword(v.pw, ""), pw2: validateConfirm(v.pw, v.pw2) };
      if (Object.values(e).some(Boolean)) return fail(e); await createStaffLocal(sid, v.pw); buzz(true);
    } else { const e = await staffLogin(sid, v.pw); if (e) return fail({ pw: e.message }); buzz(true); }
  };
  return (
    <Shell title="Acceso del personal" subtitle="Cada persona ve solo lo que le corresponde: los estilistas su agenda y recepción la de todos."
      footer={<BookButton label={setup ? "Crear mi acceso" : "Entrar"} onPress={go} reduced={reduced} width={Math.min(width - 56, 340)} delay={0.5} />}>
      <Text style={st.lbl}>¿Quién eres?</Text>
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 22 }}>
        {STAFF.map((s) => (
          <Pressable key={s.id} onPress={() => { setSid(s.id); setErr({}); setV({ code: "", pw: "", pw2: "" }); sfx("swish", 0.4, true); }} style={{ flex: 1 }} accessibilityRole="button">
            <Animated.View style={[st.chip, sid === s.id && st.chipOn, { transform: [{ scale: sid === s.id ? 1.03 : 1 }], transitionProperty: "transform", transitionDuration: 150 }]}>
              <Text style={[st.chipT, sid === s.id && { color: C.ink }]}>{s.name}</Text>
              {s.role === "reception" && <Text style={[st.chipS, sid === s.id && { color: C.ink }]}>Recepción</Text>}
            </Animated.View>
          </Pressable>
        ))}
      </View>
      <Animated.View key={sid + setup} style={[st.card, enter(reduced, 0, { y: 16, dur: 0.5 })]}>
        {setup && <Text style={st.hint}>Primera vez en este dispositivo (demostración): crea tu acceso con el código de administrador.</Text>}
        {setup && <Field label="Código de administrador" value={v.code} onChangeText={(t) => setV({ ...v, code: t })} error={err.code} secure shake={shake} />}
        <Field label="Contraseña" value={v.pw} onChangeText={(t) => setV({ ...v, pw: t })} error={err.pw} secure shake={shake} maxLength={64} />
        {setup && <Field label="Repite la contraseña" value={v.pw2} onChangeText={(t) => setV({ ...v, pw2: t })} error={err.pw2} secure shake={shake} maxLength={64} />}
      </Animated.View>
    </Shell>
  );
}

function ApptCard({ a, showStylist, onCancel }: { a: Appt; showStylist: boolean; onCancel: () => void }) {
  const reduced = useReducedMotion(), [ask, setAsk] = useState(false);
  const open = (u: string) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL(u).catch(() => {}); };
  return (
    <View style={st.busy}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={st.pill}>
          <Animated.View style={[st.dot, reduced ? undefined : { animationName: { from: { opacity: 1, transform: [{ scale: 1 }] }, to: { opacity: 0.35, transform: [{ scale: 1.5 }] } }, animationDuration: "1.1s", animationDirection: "alternate", animationIterationCount: "infinite" }]} />
          <Text style={st.pillT}>OCUPADO</Text>
        </View>
        {showStylist && <Text style={st.tag}>{a.stylistName}</Text>}
      </View>
      <Text style={st.cn}>{a.client?.name ?? "Cliente"}</Text>
      <Text style={st.cs}>{a.serviceName} · adelanto {money(a.paid)}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
        {a.client && <Pressable onPress={() => open(`tel:+505${a.client!.phone}`)} style={st.act} accessibilityRole="link"><Text style={st.actT}>Llamar</Text></Pressable>}
        {a.client && <Pressable onPress={() => open(`https://wa.me/505${a.client!.phone}`)} style={st.act} accessibilityRole="link"><Text style={st.actT}>WhatsApp</Text></Pressable>}
        <Pressable onPress={() => (ask ? onCancel() : setAsk(true))} style={[st.act, { borderColor: BUSY }]} accessibilityRole="button"><Text style={[st.actT, { color: BUSY }]}>{ask ? "¿Seguro? Sí, cancelar" : "Cancelar cita"}</Text></Pressable>
      </View>
    </View>
  );
}

function PasswordCard({ title, hint, targets, onSubmit, needCurrent }: { title: string; hint: string; targets?: { id: string; name: string }[]; needCurrent?: boolean; onSubmit: (t: string, cur: string, next: string) => Promise<string | null | undefined> }) {
  const [t, setT] = useState(targets?.[0]?.id ?? ""), [v, setV] = useState({ cur: "", n: "", n2: "" }), [err, setErr] = useState<Record<string, string | null>>({}), [ok, setOk] = useState(false), [shake, setShake] = useState(0);
  const go = async () => {
    const e = { cur: needCurrent && !v.cur ? "Escribe tu contraseña actual" : null, n: validatePassword(v.n, ""), n2: validateConfirm(v.n, v.n2) };
    if (Object.values(e).some(Boolean)) { setErr(e); setShake((s) => s + 1); setOk(false); return buzz(false); }
    const m = await onSubmit(t, v.cur, v.n);
    if (m) { setErr({ cur: m.startsWith("La contraseña actual") ? m : null, n: m.startsWith("La contraseña actual") ? null : m }); setShake((s) => s + 1); setOk(false); return buzz(false); }
    setErr({}); setV({ cur: "", n: "", n2: "" }); setOk(true); buzz(true);
  };
  return (
    <View style={[st.card, { marginTop: 26 }]}>
      <Text style={st.lbl}>{title}</Text><Text style={st.hint}>{hint}</Text>
      {targets && <View style={{ flexDirection: "row", gap: 10, marginVertical: 8 }}>{targets.map((x) => (
        <Pressable key={x.id} onPress={() => setT(x.id)} style={{ flex: 1 }}><View style={[st.chip, { paddingVertical: 10 }, t === x.id && st.chipOn]}><Text style={[st.chipT, { fontSize: 16 }, t === x.id && { color: C.ink }]}>{x.name}</Text></View></Pressable>))}</View>}
      {needCurrent && <Field label="Contraseña actual" value={v.cur} onChangeText={(x) => setV({ ...v, cur: x })} error={err.cur} secure shake={shake} />}
      <Field label="Contraseña nueva" value={v.n} onChangeText={(x) => setV({ ...v, n: x })} error={err.n} secure shake={shake} maxLength={64} />
      <Field label="Repite la contraseña nueva" value={v.n2} onChangeText={(x) => setV({ ...v, n2: x })} error={err.n2} secure shake={shake} maxLength={64} />
      <Pressable onPress={go} style={[st.act, { alignSelf: "flex-start", marginTop: 6, paddingVertical: 11, paddingHorizontal: 20, backgroundColor: C.gold }]} accessibilityRole="button"><Text style={[st.actT, { color: C.ink }]}>Guardar contraseña</Text></Pressable>
      {ok && <Text style={[st.hint, { color: "#8FD6A8", marginTop: 10 }]}>Contraseña actualizada correctamente.</Text>}
    </View>
  );
}

function Panel() {
  const { staff, agenda, staffLogout, pushOn, mode, appts, cancelAppt, changePassword, resetPassword } = useStore(), reduced = useReducedMotion();
  const reception = staff!.role === "reception";
  const days = useMemo(() => nextDays(14), []);
  const [day, setDay] = useState(days[0]), [filter, setFilter] = useState(reception ? "all" : staff!.id), [items, setItems] = useState<Appt[]>([]), [warn, setWarn] = useState(false);
  const load = useCallback(async () => { try { setItems(await agenda(days[0].iso, days[days.length - 1].iso)); setWarn(false); } catch { setWarn(true); } }, [agenda, days]);
  useEffect(() => { load(); if (mode !== "api") return; const id = setInterval(load, 8000); return () => clearInterval(id); }, [load, mode]);
  const mine = items.filter((a) => filter === "all" || a.stylistId === filter);
  const today = mine.filter((a) => a.date === day.iso).sort((a, b) => a.time.localeCompare(b.time));
  const timeline = filter !== "all", slots = allSlots(day.dow);
  const cancel = async (id: string) => { const e = await cancelAppt(id); if (!e) { sfx("swish", 0.5, true); load(); } };
  return (
    <Shell title={`Hola, ${staff!.name}`} subtitle={reception ? "Control de recepción: las citas de todo el equipo, en tiempo real." : "Tu agenda en tiempo real. Las horas con cita aparecen como ocupadas."}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: -8, marginBottom: 12 }}>
        <Text style={[st.hint, { flex: 1 }]}>{warn ? "No se pudo actualizar. Reintentando…" : mode === "api" ? (pushOn ? "Avisos de citas nuevas: activados · " : "") + "Se actualiza sola cada 8 segundos" : "Modo demostración (datos de este dispositivo)"}</Text>
        <Pressable onPress={() => { staffLogout(); sfx("swish", 0.4, true); }} accessibilityRole="button" style={st.out}><Text style={st.outT}>Cerrar sesión</Text></Pressable>
      </View>
      {reception && (
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          {[{ id: "all", name: "Todos" }, ...STYLISTS].map((s) => (
            <Pressable key={s.id} onPress={() => { setFilter(s.id); sfx("swish", 0.3, true); }} style={{ flex: 1 }}><View style={[st.chip, { paddingVertical: 10 }, filter === s.id && st.chipOn]}><Text style={[st.chipT, { fontSize: 16 }, filter === s.id && { color: C.ink }]}>{s.name}</Text></View></Pressable>
          ))}
        </View>
      )}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 18 }}>
        {[["Citas del día", String(today.length)], [timeline ? "Horas libres" : "Estilistas", timeline ? String(Math.max(0, slots.length - today.length)) : String(new Set(today.map((a) => a.stylistId)).size)], ["Adelantos", money(today.reduce((s, a) => s + a.paid, 0))]].map(([a, b], i) => (
          <Animated.View key={a} style={[st.stat, enter(reduced, 0.3 + i * 0.08, { y: 14, dur: 0.5 })]}><Text style={st.sv}>{b}</Text><Text style={st.sl}>{a}</Text></Animated.View>
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24 }} contentContainerStyle={{ paddingHorizontal: 24, gap: 10, paddingBottom: 6 }}>
        {days.map((d) => { const on = d.iso === day.iso, n = mine.filter((a) => a.date === d.iso).length;
          return (
            <Pressable key={d.iso} onPress={() => { Haptics.selectionAsync(); setDay(d); }} accessibilityRole="button">
              <Animated.View style={[st.day, on && st.dayOn, { transform: [{ scale: on ? 1.06 : 1 }], transitionProperty: "transform", transitionDuration: 150 }]}>
                <Text style={[st.dw, on && { color: C.ink }]}>{DOW[d.dow]}</Text><Text style={[st.dn, on && { color: C.ink }]}>{d.day}</Text>
                <Text style={[st.dm, on && { color: C.ink }]}>{n ? `${n} cita${n > 1 ? "s" : ""}` : MONTHS[d.month]}</Text>
              </Animated.View>
            </Pressable>
          ); })}
      </ScrollView>
      <View style={{ marginTop: 18 }}>
        {timeline ? slots.map((t, i) => { const a = today.find((x) => x.time === t);
          return (
            <Animated.View key={day.iso + t} style={[{ flexDirection: "row", gap: 12, marginBottom: 10 }, enter(reduced, Math.min(i, 12) * 0.04, { y: 12, dur: 0.4 })]}>
              <Text style={[st.time, a && { color: C.gold }]}>{timeLabel(t)}</Text>
              {a ? <View style={{ flex: 1 }}><ApptCard a={a} showStylist={false} onCancel={() => cancel(a.id)} /></View> : <View style={st.free}><Text style={st.freeT}>Libre</Text></View>}
            </Animated.View>); })
        : today.length === 0 ? <Text style={st.hint}>No hay citas programadas este día.</Text>
        : today.map((a, i) => (
            <Animated.View key={a.id} style={[{ flexDirection: "row", gap: 12, marginBottom: 10 }, enter(reduced, Math.min(i, 10) * 0.05, { y: 12, dur: 0.4 })]}>
              <Text style={[st.time, { color: C.gold }]}>{timeLabel(a.time)}</Text><View style={{ flex: 1 }}><ApptCard a={a} showStylist onCancel={() => cancel(a.id)} /></View>
            </Animated.View>))}
      </View>
      <PasswordCard title="Cambiar mi contraseña" hint="Usa 8 caracteres o más, con letras y números." needCurrent onSubmit={async (_t, cur, n) => (await changePassword(cur, n))?.message} />
      {reception && <PasswordCard title="Restablecer contraseña de un estilista" hint="Si un estilista la olvidó, créale una nueva aquí y compártesela en persona." targets={STYLISTS} onSubmit={async (t, _c, n) => (await resetPassword(t, n))?.message} />}
    </Shell>
  );
}
export default function Admin() { return useStore().staff ? <Panel /> : <Login />; }

const st = StyleSheet.create({
  lbl: { fontFamily: F.displayItalic, fontSize: 20, color: C.cream, marginBottom: 6 },
  chip: { paddingVertical: 12, alignItems: "center", borderRadius: 14, borderWidth: 1.2, borderColor: "rgba(235,172,86,0.35)", backgroundColor: "rgba(28,53,52,0.55)" }, chipOn: { backgroundColor: C.gold, borderColor: C.goldLight },
  chipT: { fontFamily: F.display, fontSize: 18, color: C.cream }, chipS: { fontFamily: F.ui, fontSize: 10.5, color: "rgba(243,230,204,0.65)" },
  card: { padding: 18, borderRadius: 18, backgroundColor: "rgba(28,53,52,0.55)", borderWidth: 1.2, borderColor: "rgba(235,172,86,0.35)" }, hint: { fontFamily: F.ui, fontSize: 13.5, lineHeight: 20, color: "rgba(243,230,204,0.7)", marginBottom: 4 },
  out: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: "rgba(235,172,86,0.4)" }, outT: { fontFamily: F.ui, fontSize: 13, color: C.gold },
  stat: { flex: 1, padding: 12, borderRadius: 14, backgroundColor: "rgba(28,53,52,0.6)", borderWidth: 1.2, borderColor: "rgba(235,172,86,0.3)" }, sv: { fontFamily: F.display, fontSize: 22, color: C.gold }, sl: { fontFamily: F.ui, fontSize: 11.5, color: "rgba(243,230,204,0.65)", marginTop: 2 },
  day: { width: 66, paddingVertical: 11, alignItems: "center", borderRadius: 14, borderWidth: 1.2, borderColor: "rgba(235,172,86,0.3)", backgroundColor: "rgba(28,53,52,0.55)" }, dayOn: { backgroundColor: C.gold, borderColor: C.goldLight },
  dw: { fontFamily: F.ui, fontSize: 12, color: "rgba(243,230,204,0.65)" }, dn: { fontFamily: F.display, fontSize: 22, color: C.cream }, dm: { fontFamily: F.ui, fontSize: 11, color: C.gold },
  time: { width: 76, fontFamily: F.uiBold, fontSize: 13, color: "rgba(243,230,204,0.55)", paddingTop: 14 },
  free: { flex: 1, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(235,172,86,0.2)" }, freeT: { fontFamily: F.ui, fontSize: 13.5, color: "rgba(243,230,204,0.35)" },
  busy: { padding: 14, borderRadius: 14, backgroundColor: "rgba(235,172,86,0.1)", borderWidth: 1.2, borderColor: C.gold },
  pill: { flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, backgroundColor: "rgba(212,96,79,0.18)", borderWidth: 1, borderColor: BUSY, marginBottom: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: BUSY }, pillT: { fontFamily: F.uiBold, fontSize: 11, letterSpacing: 1.2, color: BUSY }, tag: { fontFamily: F.display, fontSize: 15, color: C.gold },
  cn: { fontFamily: F.display, fontSize: 19, color: C.cream }, cs: { fontFamily: F.ui, fontSize: 13.5, color: "rgba(243,230,204,0.75)", marginTop: 2 },
  act: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: C.gold }, actT: { fontFamily: F.uiBold, fontSize: 12.5, color: C.gold },
});
