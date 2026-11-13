"""Genera los sonidos de la barbería (sin muestras externas, todo sintetizado)."""
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile
import os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

SR = 44100
rng = np.random.default_rng(7)

def t_(d): return np.arange(int(SR * d)) / SR
def band(x, lo, hi, order=4):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)
def put(buf, sig, at, gain=1.0):
    i = int(at * SR); n = min(len(sig), len(buf) - i)
    if n > 0: buf[i:i + n] += sig[:n] * gain

def strop(d=0.42, lo=1200, hi=5200):
    """Navaja sobre la correa de cuero: ruido filtrado que sube y baja."""
    t = t_(d); n = rng.standard_normal(len(t))
    out = np.zeros_like(n); k = 6
    for i in range(k):
        a, b = lo * (1 + .5 * i / k), hi * (.55 + .45 * i / k)
        seg = band(n, a, b); out += seg * np.sin(np.pi * np.clip((t / d - i / k * .4), 0, 1)) ** 2
    env = np.sin(np.pi * t / d) ** 1.6
    return out / np.abs(out).max() * env

def shing(d=0.7, base=3100):
    """Brillo metálico de una hoja: parciales inarmónicos con caída rápida."""
    t = t_(d); sig = np.zeros_like(t)
    for r, a, dec in [(1, 1, 7), (1.52, .8, 8), (2.08, .6, 10), (2.71, .45, 13), (3.4, .3, 16)]:
        sig += a * np.sin(2 * np.pi * base * r * t) * np.exp(-dec * t)
    burst = band(rng.standard_normal(len(t)), 4000, 9000) * np.exp(-90 * t)
    return (sig / np.abs(sig).max() * .8 + burst * .6)

def snip(d=0.16):
    """Tijera: clic de cierre de hojas + anillo metálico breve."""
    t = t_(d)
    click = band(rng.standard_normal(len(t)), 2500, 8000) * np.exp(-260 * t)
    ring = (np.sin(2 * np.pi * 5200 * t) + .6 * np.sin(2 * np.pi * 7400 * t)) * np.exp(-70 * t)
    body = np.sin(2 * np.pi * 900 * t) * np.exp(-120 * t) * .5
    s = click + .5 * ring + body
    return s / np.abs(s).max()

def bell(d=1.6, f=1975):
    """Campanita de mostrador (ting) con decaimiento largo."""
    t = t_(d); s = np.zeros_like(t)
    for r, a, dec in [(1, 1, 2.6), (2.76, .5, 4.2), (5.4, .25, 7), (8.9, .1, 11)]:
        s += a * np.sin(2 * np.pi * f * r * t) * np.exp(-dec * t)
    return s / np.abs(s).max() * (1 - np.exp(-t * 900))

def sparkle(freqs=(2349, 2960, 3520, 4699), gap=0.055, d=0.5):
    out = np.zeros(int(SR * (d + gap * len(freqs))))
    for i, f in enumerate(freqs):
        t = t_(d); put(out, np.sin(2 * np.pi * f * t) * np.exp(-9 * t) * (1 - np.exp(-t * 1500)), i * gap, .5)
    return out / np.abs(out).max()

def pop(d=0.14):
    t = t_(d); f = 420 + 520 * (t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-26 * t) * (1 - np.exp(-t * 1200))

def save(name, x, peak=0.7):
    x = np.tanh(x * 1.1); x = x / np.abs(x).max() * peak
    fade = int(SR * .02); x[-fade:] *= np.linspace(1, 0, fade)
    wavfile.write(f"assets/sounds/{name}.wav", SR, (x * 32767).astype(np.int16))
    print(name, f"{len(x) / SR:.2f}s")

# ---- Línea de tiempo del intro (segundos) — debe coincidir con src/timeline.ts ----
buf = np.zeros(int(SR * 4.2))
put(buf, pop(.18), 0.02, .25)                          # entra el medallón
put(buf, strop(.55, 900, 4200), 0.35, .40)             # el rombo se dibuja
put(buf, strop(.30), 1.00, .55); put(buf, shing(), 1.30, .55)   # navaja izquierda cae
put(buf, strop(.30), 1.10, .55); put(buf, shing(base=3500), 1.40, .55)  # navaja derecha cae
put(buf, snip(), 1.65, .30)                            # la H aparece
for i in range(5): put(buf, snip(), 2.05 + i * .09, .22 + .03 * i)   # HOUSE: tic de tijera por letra
put(buf, snip(), 2.80, .35); put(buf, snip(), 2.93, .45)             # snip-snip antes del lema
put(buf, bell(), 3.05, .60); put(buf, sparkle(), 3.05, .35)          # ting final + destellos
save("intro", buf)

# ---- Toque del botón ----
tap = np.zeros(int(SR * .5))
put(tap, snip(), 0.00, .8); put(tap, snip(), 0.09, .9); put(tap, shing(.4, 4000), 0.09, .35)
save("tap", tap)


# ---- Sonidos del scroll (pantalla de Inicio) ----
def swish(d=0.4):
    """Roce suave de navaja sobre tela: ruido filtrado con swell."""
    t = t_(d); n = band(rng.standard_normal(len(t)), 1800, 6500)
    return n / np.abs(n).max() * np.sin(np.pi * t / d) ** 2.2

def whoosh(d=0.7):
    """Capas que entran: barrido de ruido de graves a agudos."""
    t = t_(d); n = rng.standard_normal(len(t)); out = np.zeros_like(n)
    for i, (lo, hi) in enumerate([(200, 700), (500, 1800), (1400, 4200), (3000, 7500)]):
        out += band(n, lo, hi) * np.exp(-((t / d - (.2 + i * .2)) ** 2) / .02)
    return out / np.abs(out).max() * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.3

def thud(d=0.3):
    """Golpe suave cuando algo 'aterriza'."""
    t = t_(d); f = 95 - 35 * (t / d)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-14 * t) + band(rng.standard_normal(len(t)), 150, 900) * np.exp(-60 * t) * .5) * (1 - np.exp(-t * 800))

def drop(d=0.4):
    """Pin que cae: glissando descendente + rebote."""
    t = t_(d); f = 1100 * np.exp(-6 * t) + 260
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-9 * t) * (1 - np.exp(-t * 1500))

def roll(d=0.75):
    """Contador que gira: ticks rápidos que se espacian."""
    out = np.zeros(int(SR * d)); at, gap, g = 0.0, 0.022, 1.0
    while at < d - 0.05:
        put(out, snip(0.05), at, .45 * g); at += gap; gap *= 1.07; g *= .96
    return out

save("swish", swish(), .5); save("whoosh", whoosh(), .6); save("ting", bell(1.0, 2349), .5)
save("thud", thud(), .6); save("drop", drop(), .55); save("shimmer", sparkle((3136, 3951, 4699, 5588, 6272), .05, .5), .45)
save("roll", roll(), .5); save("snip2", snip(), .5)
