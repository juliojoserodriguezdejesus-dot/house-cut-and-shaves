import React, { useState } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import { Shell } from "../components/Shell";
import { StylistCard } from "../components/StylistCard";
import { STYLISTS, money } from "../data";
import { useNav } from "../nav";
import { sfx } from "../sfx";
import { useStore } from "../store";
import { C, F } from "../theme";

const CUTS: Record<string, any> = { dayan: require("../../assets/images/dayan_cut.webp"), lidia: require("../../assets/images/lidia_cut.webp") };

export default function Estilistas() {
  const nav = useNav(), { draft, setDraft } = useStore(), { width } = useWindowDimensions(), [lock, setLock] = useState(false);
  const pick = (s: (typeof STYLISTS)[number]) => { if (lock) return; setLock(true); setDraft({ stylist: s, date: undefined, time: undefined }); sfx("ting", 0.7, true); setTimeout(() => nav.go("horario"), 450); };
  return (
    <Shell step={2} title="Elige a tu estilista" subtitle="Toca su foto para reservar con él o con ella.">
      {draft.service && (
        <View style={{ alignSelf: "flex-start", flexDirection: "row", gap: 8, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: "rgba(235,172,86,0.1)", borderWidth: 1, borderColor: "rgba(235,172,86,0.3)", marginBottom: 22 }}>
          <Text style={{ fontFamily: F.uiBold, fontSize: 14, color: C.cream }}>{draft.service.name}</Text>
          <Text style={{ fontFamily: F.ui, fontSize: 14, color: C.gold }}>{draft.service.from ? "desde " : ""}{money(draft.service.price)}</Text>
        </View>
      )}
      <View style={{ gap: 30 }}>
        {STYLISTS.map((s, i) => <StylistCard key={s.id} name={s.name.toUpperCase()} cut={CUTS[s.id]} side={i % 2 ? 1 : -1} width={Math.min(width, 720) - 48} onPress={() => pick(s)} />)}
      </View>
    </Shell>
  );
}
