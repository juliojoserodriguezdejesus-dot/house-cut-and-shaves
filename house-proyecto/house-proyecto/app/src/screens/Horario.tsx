import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { enter } from "../anim";
import { BookButton } from "../components/BookButton";
import { Shell } from "../components/Shell";
import { DOW, Day, MONTHS, dateLabel, nextDays, timeLabel } from "../data";
import { useNav } from "../nav";
import { sfx } from "../sfx";
import { useStore } from "../store";
import { useWindowDimensions } from "react-native";
import { C, F } from "../theme";

export default function Horario() {
  const nav = useNav(), { draft, setDraft, slots: loadSlots, nextFree } = useStore(), reduced = useReducedMotion(), { width } = useWindowDimensions();
  const days = useMemo(() => nextDays(14), []);
  const [day, setDay] = useState<Day>(days.find((d) => !d.disabled) ?? days[1]);
  const [time, setTime] = useState<string | null>(null);
  const st = draft.stylist?.id ?? "dayan";
  const [slots, setSlots] = useState<{ time: string; busy: boolean }[] | null>(null);
  useEffect(() => {
    let on = true; setSlots(null);
    const run = () => loadSlots(day, st).then((s) => { if (!on) return; setSlots(s); setTime((t) => (t && s.some((x) => x.time === t && x.busy) ? null : t)); }).catch(() => on && setSlots([]));
    run(); const id = setInterval(run, 15000); return () => { on = false; clearInterval(id); };
  }, [day, st, loadSlots]);
  const [first, setFirst] = useState<string | null>(null);
  useEffect(() => { let on = true; setFirst(null); nextFree(day, st, "00:00").then((t) => on && setFirst(t)).catch(() => {}); return () => { on = false; }; }, [day, st, nextFree, slots]);
  const list = slots ?? [];
  const groups = [{ t: "Mañana", s: list.filter((x) => +x.time.slice(0, 2) < 12) }, { t: "Tarde", s: list.filter((x) => +x.time.slice(0, 2) >= 12) }].filter((g) => g.s.length);
  const go = () => { setDraft({ date: day.iso, time: time! }); sfx("shimmer", 0.6, true); nav.go("pago"); };
  return (
    <Shell step={3} title="Elige día y hora" subtitle={`${draft.service?.name ?? "Tu servicio"} con ${draft.stylist?.name ?? "tu estilista"}`}
      footer={time ? <View style={{ alignItems: "center", gap: 10 }}>
        <Animated.Text style={[s.sum, enter(reduced, 0, { y: 8, dur: 0.35 })]}>{dateLabel(day.iso)} · {timeLabel(time)}</Animated.Text>
        <BookButton label="Continuar" onPress={go} reduced={reduced} width={Math.min(width - 56, 340)} delay={0} /></View> : null}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24 }} contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}>
        {days.map((d, i) => {
          const on = d.iso === day.iso;
          return (
            <Animated.View key={d.iso} style={enter(reduced, 0.3 + i * 0.04, { y: 14, dur: 0.4 })}>
              <Pressable disabled={d.disabled} onPress={() => { Haptics.selectionAsync(); sfx("swish", 0.4, true); setDay(d); setTime(null); }} accessibilityRole="button"
                accessibilityLabel={`${DOW[d.dow]} ${d.day} de ${MONTHS[d.month]}${d.disabled ? ", no disponible hoy" : ""}`}>
                <Animated.View style={[s.day, on && s.dayOn, d.disabled && { opacity: 0.3 }, { transform: [{ scale: on ? 1.06 : 1 }], transitionProperty: ["transform"], transitionDuration: 150 }]}>
                  <Text style={[s.dow, on && { color: C.ink }]}>{DOW[d.dow]}</Text>
                  <Text style={[s.num, on && { color: C.ink }]}>{d.day}</Text>
                  <Text style={[s.mon, on && { color: C.ink }]}>{MONTHS[d.month]}</Text>
                </Animated.View>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>
      {first && time !== first && (
        <Pressable onPress={() => { Haptics.selectionAsync(); sfx("ting", 0.5, true); setTime(first); }} accessibilityRole="button" accessibilityLabel={`Primera hora libre ${timeLabel(first)}`} style={{ marginTop: 18 }}>
          <Animated.View style={[s.fast, enter(reduced, 0.2, { y: 8, dur: 0.4 })]}><Text style={s.fastL}>Primera hora libre</Text><Text style={s.fastT}>{timeLabel(first)}</Text></Animated.View>
        </Pressable>
      )}
      {day.dow === 0 && <Text style={s.note}>Los domingos se agenda con un día de anticipación.</Text>}
      {slots === null && <Text style={s.note}>Cargando horas disponibles…</Text>}
      {slots !== null && slots.length === 0 && <Text style={s.note}>No hay horas disponibles este día. Prueba con otro.</Text>}
      {groups.map((g) => (
        <View key={day.iso + g.t} style={{ marginTop: 22 }}>
          <Text style={s.group}>{g.t}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {g.s.map((x, i) => {
              const on = time === x.time;
              return (
                <Animated.View key={x.time} style={[{ width: "31%" }, enter(reduced, i * 0.03, { y: 12, scale: 0.9, dur: 0.35 })]}>
                  <Pressable disabled={x.busy} onPress={() => { Haptics.selectionAsync(); sfx("snip", 0.5, true); setTime(x.time); }} accessibilityRole="button" accessibilityState={{ disabled: x.busy, selected: on }}
                    accessibilityLabel={`${timeLabel(x.time)}${x.busy ? ", ocupado" : ""}`}>
                    <Animated.View style={[s.slot, on && s.slotOn, x.busy && { opacity: 0.3 }, { transform: [{ scale: on ? 1.05 : 1 }], transitionProperty: "transform", transitionDuration: 140 }]}>
                      <Text style={[s.slotT, on && { color: C.ink }, x.busy && { textDecorationLine: "line-through" }]}>{timeLabel(x.time)}</Text>
                    </Animated.View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </View>
      ))}
    </Shell>
  );
}
const s = StyleSheet.create({
  day: { width: 62, paddingVertical: 12, alignItems: "center", borderRadius: 14, borderWidth: 1.2, borderColor: "rgba(235,172,86,0.3)", backgroundColor: "rgba(28,53,52,0.55)" },
  dayOn: { backgroundColor: C.gold, borderColor: C.goldLight },
  dow: { fontFamily: F.ui, fontSize: 12, color: "rgba(243,230,204,0.65)" }, num: { fontFamily: F.display, fontSize: 24, color: C.cream, marginVertical: 2 }, mon: { fontFamily: F.ui, fontSize: 12, color: C.gold },
  note: { fontFamily: F.ui, fontSize: 13, color: "rgba(243,230,204,0.6)", marginTop: 14 },
  group: { fontFamily: F.displayItalic, fontSize: 20, color: C.cream, marginBottom: 10 },
  slot: { paddingVertical: 12, alignItems: "center", borderRadius: 12, borderWidth: 1.2, borderColor: "rgba(235,172,86,0.3)", backgroundColor: "rgba(28,53,52,0.55)" },
  slotOn: { backgroundColor: C.gold, borderColor: C.goldLight }, slotT: { fontFamily: F.uiBold, fontSize: 13.5, color: C.cream },
  fast: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, paddingHorizontal: 18, borderRadius: 14, borderWidth: 1.4, borderColor: C.gold, backgroundColor: "rgba(235,172,86,0.12)" },
  fastL: { fontFamily: F.ui, fontSize: 14, color: C.cream }, fastT: { fontFamily: F.uiBold, fontSize: 17, color: C.gold },
  sum: { fontFamily: F.uiBold, fontSize: 15, color: C.cream },
});
