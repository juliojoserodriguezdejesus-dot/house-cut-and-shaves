import React, { useEffect, useState } from "react";
import { Image, Linking, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { interpolate, useAnimatedScrollHandler, useAnimatedStyle, useReducedMotion, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useFonts } from "expo-font";
import { BodoniModa_400Regular_Italic, BodoniModa_600SemiBold } from "@expo-google-fonts/bodoni-moda";
import { Jost_500Medium, Jost_600SemiBold } from "@expo-google-fonts/jost";
import Svg, { Circle, Path } from "react-native-svg";
import { enter } from "./anim";
import { BookButton } from "./components/BookButton";
import { LOGO_RATIO, ReliefLogo } from "./components/ReliefLogo";
import { LocalCard } from "./components/LocalCard";
import { Reveal, ScrollCtx } from "./components/Reveal";
import { useNav } from "./nav";
import { useStore } from "./store";
import { dateLabel, money, timeLabel } from "./data";
import { LocationPanel, PhonePlaque, Socials } from "./components/Contact";
import { SoundToggle } from "./components/SoundToggle";
import { StylistCard } from "./components/StylistCard";
import { preloadSfx } from "./sfx";
import { BIZ, HOURS, statusNow } from "./data";
import { C, F } from "./theme";

const go = (url: string) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL(url).catch(() => {}); };
const STAR = "M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z";

function Title({ children }: { children: string }) {
  return (
    <Reveal style={{ marginBottom: 16 }} sfx="swish">
      <Text style={s.h2}>{children}</Text>
      <View style={s.rule} />
    </Reveal>
  );
}

/** Botón en forma de rombo (eco del logo). */
function Diamond({ label, url, icon }: { label: string; url: string; icon: React.ReactNode }) {
  const [p, setP] = useState(false);
  return (
    <Pressable onPress={() => go(url)} onPressIn={() => setP(true)} onPressOut={() => setP(false)} hitSlop={8}
      accessibilityRole="link" accessibilityLabel={label} style={{ alignItems: "center", width: 96 }}>
      <Animated.View style={{ width: 80, height: 80, alignItems: "center", justifyContent: "center",
        transform: [{ scale: p ? 0.93 : 1 }], transitionProperty: "transform", transitionDuration: "120ms" }}>
        <View style={s.diamond} />
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">{icon}</Svg>
      </Animated.View>
      <Text style={s.dLabel}>{label}</Text>
    </Pressable>
  );
}

export function HomeScreen() {
  const nav = useNav(), { account, appts, refreshMine, logout, mode } = useStore();
  useEffect(() => { refreshMine(); }, [refreshMine]);
  const reduced = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [fontsOk] = useFonts({ BodoniModa_600SemiBold, BodoniModa_400Regular_Italic, Jost_500Medium, Jost_600SemiBold });
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => { y.set(e.contentOffset.y); });
  const [status, setStatus] = useState(statusNow());
  useEffect(() => { preloadSfx(); }, []);
  useEffect(() => { const id = setInterval(() => setStatus(statusNow()), 60000); return () => clearInterval(id); }, []);

  const heroH = Math.min(height * 0.52, 440), pad = 24;
  const LW = Math.min(width * 0.7, (heroH - insets.top - 30) / LOGO_RATIO);
  const heroStyle = useAnimatedStyle(() => ({
    opacity: interpolate(y.get(), [0, heroH * 0.8], [1, 0.1], "clamp"),
    transform: [{ translateY: y.get() * 0.4 }, { scale: interpolate(y.get(), [-160, 0, heroH], [1.15, 1, 0.88], "clamp") }],
  }));
  if (!fontsOk) return <View style={s.root} />;
  const cardW = Math.min(width, 560) - pad * 2;

  return (
    <ScrollCtx.Provider value={{ y, vh: height, offset: heroH }}>
      <View style={s.root}>
        <LinearGradient colors={[C.bg, C.bgGreen, "#0D1020"]} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
        <SoundToggle top={insets.top + 6} />
        <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 150 + insets.bottom }}>
          {/* HERO: logo vivo */}
          <Animated.View style={[{ height: heroH, paddingTop: insets.top + 20, alignItems: "center", justifyContent: "center" }, heroStyle]}>
            <ReliefLogo width={LW} reduced={reduced} />
          </Animated.View>

          {/* Quiénes somos */}
          <View style={{ paddingHorizontal: pad, width: "100%", maxWidth: 560, alignSelf: "center" }}>
            <Reveal>
              <Text style={s.lead}>{account ? `Hola, ${account.first}.` : "Cortes clásicos, bien hechos."}</Text>
              <Text style={s.p}>{BIZ.about}</Text>
              <View style={s.stars}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <Animated.View key={i} style={enter(reduced, 0.5 + i * 0.1, { y: 0, scale: 0.4, dur: 0.4 })}>
                    <Svg width={18} height={18} viewBox="0 0 24 24"><Path d={STAR} fill={C.gold} /></Svg>
                  </Animated.View>
                ))}
                <Text style={s.small}>{BIZ.rating} · {BIZ.reviews} opiniones en Google</Text>
              </View>
            </Reveal>

            {account && appts.length > 0 && (
              <>
                <View style={{ height: 40 }} />
                <Title>Tus citas</Title>
                <View style={{ gap: 12 }}>
                  {appts.map((a, i) => (
                    <Reveal key={a.id} delay={i * 0.08} sfx={i === 0 ? "ting" : undefined}>
                      <View style={s.appt}>
                        <View style={s.apptBar} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.apptT}>{a.serviceName}</Text>
                          <Text style={s.apptM}>con {a.stylistName}</Text>
                          <Text style={s.apptM}>{dateLabel(a.date)} · {timeLabel(a.time)}</Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}><Text style={s.apptP}>{money(a.paid)}</Text><Text style={s.apptL}>adelanto pagado</Text></View>
                      </View>
                    </Reveal>
                  ))}
                </View>
              </>
            )}

            <View style={{ height: 40 }} />
            <Title>Nuestro local</Title>
            <LocalCard width={cardW} />

            <View style={{ height: 44 }} />
            <Title>Tu equipo</Title>
            <View style={{ gap: 30 }}>
              <StylistCard name="DAYAN" side={-1} width={cardW} cut={require("../assets/images/dayan_cut.webp")} />
              <StylistCard name="LIDIA" side={1} width={cardW} cut={require("../assets/images/lidia_cut.webp")} />
              <StylistCard name="CARLA" role="RECEPCIONISTA" side={-1} width={cardW} cut={require("../assets/images/carla_cut.webp")} />
            </View>

            <View style={{ height: 44 }} />
            <Title>Horarios</Title>
            <Reveal>
              <View style={s.pill}>
                <Animated.View style={[s.dot, { backgroundColor: status.open === false ? "#C96A5A" : status.open ? "#6FCF97" : C.gold },
                  reduced ? {} : { animationName: { from: { opacity: 1, transform: [{ scale: 1 }] }, to: { opacity: 0.35, transform: [{ scale: 1.5 }] } },
                    animationDuration: "1.2s", animationDirection: "alternate", animationIterationCount: "infinite", animationTimingFunction: "ease-in-out" }]} />
                <Text style={s.pillText}>{status.text}</Text>
              </View>
              {HOURS.map((h) => {
                const today = h.dows.includes(status.dow);
                return (
                  <View key={h.days} style={[s.hRow, today && s.hToday]}>
                    <View style={[s.marker, { opacity: today ? 1 : 0 }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.hDays, today && { color: C.gold }]}>{h.days}</Text>
                      <Text style={s.hText}>{h.text}</Text>
                    </View>
                  </View>
                );
              })}
            </Reveal>

            <View style={{ height: 44 }} />
            <Title>Dónde estamos</Title>
            <LocationPanel width={cardW} />

            <View style={{ height: 44 }} />
            <Title>Escríbenos</Title>
            <Socials />
            <PhonePlaque width={cardW} />
            {account && mode === "api" && <Pressable onPress={logout} hitSlop={12} accessibilityRole="button" style={{ alignSelf: "center", marginTop: 34, padding: 8 }}><Text style={s.admin}>Cerrar sesión</Text></Pressable>}
            <Pressable onPress={() => nav.go("admin")} hitSlop={12} accessibilityRole="button" accessibilityLabel="Acceso administradores" style={{ alignSelf: "center", marginTop: 40, padding: 10 }}>
              <Text style={s.admin}>Acceso administradores</Text>
            </Pressable>
          </View>
        </Animated.ScrollView>

        {/* Botón fijo */}
        <LinearGradient pointerEvents="none" colors={["rgba(13,16,32,0)", "#0D1020"]} style={[s.fade, { height: 130 + insets.bottom }]} />
        <View style={[s.sticky, { paddingBottom: Math.max(insets.bottom, 14) + 8 }]}>
          <BookButton onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); nav.go(account ? "servicios" : "registro"); }} reduced={reduced} width={Math.min(width - 56, 340)} delay={0.8} />
        </View>
      </View>
    </ScrollCtx.Provider>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  admin: { fontFamily: F.ui, fontSize: 12.5, letterSpacing: 0.6, color: "rgba(243,230,204,0.38)", textDecorationLine: "underline" },
  appt: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, backgroundColor: "rgba(28,53,52,0.6)", borderWidth: 1.2, borderColor: "rgba(235,172,86,0.35)" },
  apptBar: { width: 4, alignSelf: "stretch", borderRadius: 2, backgroundColor: C.gold },
  apptT: { fontFamily: F.display, fontSize: 18, color: C.cream }, apptM: { fontFamily: F.ui, fontSize: 13.5, color: "rgba(243,230,204,0.7)", marginTop: 2 },
  apptP: { fontFamily: F.uiBold, fontSize: 16, color: C.gold }, apptL: { fontFamily: F.ui, fontSize: 11, color: "rgba(243,230,204,0.55)" },
  word: { flexDirection: "row", justifyContent: "center", gap: 2, marginTop: 4 },
  letter: { fontFamily: F.display, color: C.gold },
  tag: { textAlign: "center", fontFamily: F.ui, fontSize: 12, letterSpacing: 4, color: C.gold, opacity: 0.9, marginTop: 4 },
  lead: { fontFamily: F.displayItalic, fontSize: 30, lineHeight: 36, color: C.cream, marginBottom: 10 },
  p: { fontFamily: F.ui, fontSize: 16, lineHeight: 25, color: "rgba(243,230,204,0.78)" },
  stars: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 16 },
  small: { fontFamily: F.ui, fontSize: 13, color: "rgba(243,230,204,0.6)", marginLeft: 8 },
  h2: { fontFamily: F.displayItalic, fontSize: 27, color: C.cream },
  rule: { width: 44, height: 1.5, backgroundColor: C.gold, marginTop: 8 },
  photoWrap: { borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "rgba(235,172,86,0.3)" },
  photoFade: { position: "absolute", left: 0, right: 0, bottom: 0, height: 110 },
  caption: { position: "absolute", left: 16, bottom: 14, fontFamily: F.displayItalic, fontSize: 20, color: C.cream },
  pill: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 9, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: "rgba(235,172,86,0.1)", borderWidth: 1, borderColor: "rgba(235,172,86,0.3)", marginBottom: 14 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  pillText: { fontFamily: F.uiBold, fontSize: 14, color: C.cream },
  hRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingLeft: 4, borderBottomWidth: 1, borderBottomColor: "rgba(235,172,86,0.16)" },
  hToday: { backgroundColor: "rgba(235,172,86,0.06)" },
  marker: { width: 8, height: 8, backgroundColor: C.gold, transform: [{ rotate: "45deg" }], marginRight: 14, marginLeft: 6 },
  hDays: { fontFamily: F.uiBold, fontSize: 16, color: C.cream },
  hText: { fontFamily: F.ui, fontSize: 14, color: "rgba(243,230,204,0.65)", marginTop: 2 },
  loc: { backgroundColor: "rgba(28,53,52,0.55)", borderRadius: 22, padding: 20, alignItems: "center", borderWidth: 1, borderColor: "rgba(235,172,86,0.25)", overflow: "hidden" },
  ring: { position: "absolute", width: 130, height: 130, borderRadius: 65, borderWidth: 1.5, borderColor: C.gold },
  addr: { fontFamily: F.uiBold, fontSize: 16, lineHeight: 23, color: C.cream, textAlign: "center" },
  ghost: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 26, borderWidth: 1.5, borderColor: C.gold },
  ghostText: { fontFamily: F.uiBold, fontSize: 15, color: C.gold, letterSpacing: 0.5 },
  diamond: { position: "absolute", width: 52, height: 52, borderRadius: 6, backgroundColor: C.disc, borderWidth: 1.3, borderColor: C.gold, transform: [{ rotate: "45deg" }] },
  dLabel: { fontFamily: F.ui, fontSize: 13, color: C.cream, marginTop: 4 },
  phone: { fontFamily: F.display, fontSize: 30, letterSpacing: 2, color: C.gold },
  fade: { position: "absolute", left: 0, right: 0, bottom: 0 },
  sticky: { position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center" },
});
