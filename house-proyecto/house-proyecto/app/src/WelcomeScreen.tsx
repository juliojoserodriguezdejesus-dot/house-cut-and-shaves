import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as Haptics from "expo-haptics";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { BodoniModa_400Regular_Italic, BodoniModa_600SemiBold } from "@expo-google-fonts/bodoni-moda";
import { Jost_500Medium, Jost_600SemiBold } from "@expo-google-fonts/jost";
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from "react-native-svg";
import { enter } from "./anim";
import { BookButton } from "./components/BookButton";
import { Emblem } from "./components/Emblem";
import { Motes } from "./components/Motes";
import { Sparkle } from "./components/Sparkle";
import { BRAND, C, F } from "./theme";
import { T } from "./timeline";
import { setMuted } from "./sfx";

SplashScreen.preventAutoHideAsync();

function SoundToggle({ muted, onPress }: { muted: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button"
      accessibilityLabel={muted ? "Activar sonido" : "Silenciar"} style={styles.mute}>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M4 9v6h4l5 4V5L8 9H4z" />
        {muted ? <Path d="M17 9l5 6M22 9l-5 6" /> : <><Path d="M16.5 8.5a5 5 0 010 7" /><Path d="M19 6a8.5 8.5 0 010 12" /></>}
      </Svg>
    </Pressable>
  );
}

export function WelcomeScreen({ onNavigate }: { onNavigate: () => void }) {
  const reduced = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [fontsLoaded] = useFonts({ BodoniModa_600SemiBold, BodoniModa_400Regular_Italic, Jost_500Medium, Jost_600SemiBold });
  const intro = useAudioPlayer(require("../assets/sounds/intro.wav"));
  const tap = useAudioPlayer(require("../assets/sounds/tap.wav"));
  const introStatus = useAudioPlayerStatus(intro);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const launched = useRef(false);
  // En navegador el audio exige un toque del usuario; en el celular arranca solo.
  const [ready, setReady] = useState(Platform.OS !== "web");

  // Arranca animación y audio en el mismo instante para que el sonido calce con la línea de tiempo.
  const launch = useCallback(() => {
    if (launched.current) return;
    launched.current = true;
    setStarted(true);
    SplashScreen.hideAsync();
    try { intro.play(); } catch {}
  }, [intro]);

  useEffect(() => {
    if (!fontsLoaded || !ready || launched.current) return;
    if (introStatus.isLoaded) { launch(); return; }
    const id = setTimeout(launch, 1500); // si el audio tarda, igual se muestra la animación
    return () => clearTimeout(id);
  }, [fontsLoaded, ready, introStatus.isLoaded, launch]);

  useEffect(() => { intro.muted = muted; tap.muted = muted; setMuted(muted); }, [muted, intro, tap]);

  const onBook = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try { tap.seekTo(0); tap.play(); } catch {}
    onNavigate();
  }, [onNavigate, tap]);

  if (fontsLoaded && !ready) {
    return (
      <Pressable style={[styles.root, { alignItems: "center", justifyContent: "center" }]} onPress={() => setReady(true)}>
        <Text style={{ fontFamily: F.displayItalic, fontSize: 22, color: C.cream }}>Toca para comenzar</Text>
      </Pressable>
    );
  }
  if (!fontsLoaded || !started) return <View style={styles.root} />;

  const D = Math.min(width * 0.82, 340);
  const emblemW = D * 0.58, sc = emblemW / 200, eL = D * 0.21, eT = D * 0.07;
  const letters = "HOUSE".split("");
  const btnW = Math.min(width - 56, 340);

  return (
    <View style={styles.root}>
      <LinearGradient colors={[C.bg, C.bgGreen, "#0D1020"]} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />

      {!reduced && <Motes startAt={T.welcome} />}

      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <SoundToggle muted={muted} onPress={() => setMuted((m) => !m)} />
      </View>

      <View style={styles.center}>
        <Animated.Text style={[styles.welcome, enter(reduced, T.welcome, { y: 10, dur: 0.7 })]}>{BRAND.greeting}</Animated.Text>

        <View style={{ width: D, height: D, marginTop: 18 }} accessible accessibilityLabel={BRAND.name}>
          {/* Resplandor que respira */}
          <Animated.View pointerEvents="none" style={[styles.glow, {
            width: D * 1.9, height: D * 1.9, left: -D * 0.45, top: -D * 0.45,
            ...(reduced ? {} : {
              animationName: { from: { opacity: 0.55, transform: [{ scale: 0.96 }] }, to: { opacity: 1, transform: [{ scale: 1.06 }] } },
              animationDuration: "3.2s", animationDirection: "alternate", animationIterationCount: "infinite",
              animationTimingFunction: "ease-in-out", animationDelay: `${T.disc + 0.4}s`, animationFillMode: "backwards",
            }),
          }]}>
            <Svg width="100%" height="100%">
              <Defs>
                <RadialGradient id="g" cx="50%" cy="50%" r="50%">
                  <Stop offset="0.3" stopColor={C.gold} stopOpacity={0.22} />
                  <Stop offset="1" stopColor={C.gold} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx="50%" cy="50%" r="50%" fill="url(#g)" />
            </Svg>
          </Animated.View>

          {/* Anillo punteado que gira muy despacio */}
          {!reduced && (
            <Animated.View pointerEvents="none" style={{
              position: "absolute", width: D + 30, height: D + 30, left: -15, top: -15,
              animationName: { from: { opacity: 0, transform: [{ rotate: "0deg" }] }, "6%": { opacity: 0.55 }, to: { opacity: 0.55, transform: [{ rotate: "360deg" }] } },
              animationDuration: "90s", animationDelay: `${T.disc + 0.3}s`, animationIterationCount: "infinite",
              animationTimingFunction: "linear", animationFillMode: "backwards",
            }}>
              <Svg width="100%" height="100%">
                <Circle cx="50%" cy="50%" r={(D + 26) / 2} fill="none" stroke={C.gold} strokeWidth={1} strokeDasharray="1.5 9" strokeLinecap="round" />
              </Svg>
            </Animated.View>
          )}

          {/* Medallón verde */}
          <Animated.View style={[styles.disc, { borderRadius: D / 2 }, enter(reduced, T.disc, { y: 0, scale: 0.86, dur: 0.6 })]}>
            <View style={{ position: "absolute", left: eL, top: eT, width: emblemW, height: emblemW * 0.9 }}>
              <Emblem reduced={reduced} />
            </View>

            <View style={[styles.wordRow, { top: D * 0.62 }]}>
              {letters.map((ch, i) => (
                <Animated.Text key={i} allowFontScaling={false}
                  style={[styles.letter, { fontSize: D * 0.155, lineHeight: D * 0.19 },
                    enter(reduced, T.house + i * T.houseStep, { y: 22, scale: 0.94, dur: 0.5 })]}>{ch}</Animated.Text>
              ))}
            </View>

            <Animated.Text allowFontScaling={false}
              style={[styles.tagline, { top: D * 0.82, fontSize: D * 0.038 }, enter(reduced, T.tagline, { y: 8, dur: 0.6 })]}>
              CUTS & SHAVES
            </Animated.Text>
          </Animated.View>

          {!reduced && (
            <>
              <Sparkle left={eL + 43 * sc} top={eT + 6 * sc} size={D * 0.07} delay={T.ting} period={4.6} />
              <Sparkle left={eL + 157 * sc} top={eT + 6 * sc} size={D * 0.06} delay={T.ting + 0.15} period={5.2} />
              <Sparkle left={eL + 100 * sc} top={eT + 38 * sc} size={D * 0.05} delay={T.ting + 0.3} period={4.2} />
              <Sparkle left={D * 0.84} top={D * 0.66} size={D * 0.06} delay={T.ting + 0.45} period={5.6} />
            </>
          )}
        </View>
      </View>

      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 16) + 22 }]}>
        <BookButton onPress={onBook} reduced={reduced} width={btnW} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  top: { position: "absolute", top: 0, right: 12, zIndex: 5 },
  mute: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 40 },
  welcome: { fontFamily: F.displayItalic, fontSize: 24, color: C.cream, letterSpacing: 1 },
  glow: { position: "absolute" },
  disc: { ...StyleSheet.absoluteFill, backgroundColor: C.disc, overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(235,172,86,0.25)" },
  wordRow: { position: "absolute", left: 0, right: 0, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 2 },
  letter: { fontFamily: F.display, color: C.gold },
  tagline: { position: "absolute", left: 0, right: 0, textAlign: "center", fontFamily: F.ui, letterSpacing: 4, color: C.gold, opacity: 0.9 },
  bottom: { alignItems: "center" },
});
