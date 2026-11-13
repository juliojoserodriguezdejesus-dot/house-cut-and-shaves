# House Cuts & Shaves — pantalla de bienvenida (Expo / React Native)

## Cómo correrla
```bash
npm install
npx expo start        # abre con Expo Go (Android/iOS) o un dev build
```
Para juzgar la fluidez usa un build de release en un celular real:
`npx expo run:android --variant release` (o `npx expo run:ios --configuration Release`).

## Estructura
- `app/index.tsx` — pantalla de bienvenida (orquesta audio + animación)
- `app/agendar.tsx` — placeholder de la siguiente pantalla
- `src/timeline.ts` — tiempos de la animación (calzan con el audio)
- `src/components/` — Emblem (logo vectorial animado), Wordmark, Sparkle, Motes, BookButton
- `src/theme.ts` — colores muestreados del logo real y nombre de la marca (`BRAND`)
- `tools/make_sounds.py` — genera los sonidos (`python tools/make_sounds.py`)

## Si cambias la animación
Los sonidos de `assets/sounds/intro.wav` están sincronizados con `src/timeline.ts`.
Si mueves un tiempo en uno, ajústalo en el otro y vuelve a generar el audio.
