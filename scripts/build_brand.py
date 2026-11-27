#!/usr/bin/env python3
"""
Teninde marka varlıklarını tek kaynaktan üretir:  python3 scripts/build_brand.py

İşaret (A · "Tende damla"): amber bir damla, altında hafif kemerli ince ten çizgisi. 100 birimlik ızgarada:
  damla  M50 19 C46.5 26 34 39.5 34 53 A16 16 0 0 0 66 53 C66 39.5 53.5 26 50 19 Z
  ten    M25 76 Q50 70 75 76  (yuvarlak uçlu çizgi)
Yazı ("teninde"): Manrope SemiBold harfleri vektöre çevrilir; Türkçe noktasız ı'nın noktası işaretin küçüğüdür
(damla biraz yukarı alınır ki küçük boyutta çizgiye yapışmasın).

Üretilenler:
  assets/images/icon.png (1024, krem zemin)         iOS uygulama simgesi
  assets/images/android-icon-foreground.png (512)  Android uyarlanabilir simge ön katmanı (güvenli alan içinde)
  assets/images/android-icon-background.png (512)  krem zemin
  assets/images/android-icon-monochrome.png (432)  tek renk (Android 13 temalı simge)
  assets/images/splash-icon.png / splash-icon-dark.png (1024, saydam)
  assets/images/favicon.png (48)
  assets/brand/teninde-icon.svg, teninde-wordmark.svg, teninde-wordmark-dark.svg
  constants/brandPaths.ts  (uygulama içindeki Monogram ve Wordmark bileşenleri bunu kullanır)
"""
import math
import os
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KREM, MUREKKEP, AMBER = '#F7F3EE', '#1E1B18', '#A8642A'
KOYU_ZEMIN, KREM_ACIK, AMBER_ACIK = '#1E1B18', '#F2ECE4', '#D9955A'

DAMLA = 'M50 19 C46.5 26 34 39.5 34 53 A16 16 0 0 0 66 53 C66 39.5 53.5 26 50 19 Z'
TEN = 'M25 76 Q50 70 75 76'


# ───────── Geometri (100 birimlik ızgara) ─────────
def cubic(p0, p1, p2, p3, n=60):
    return [(
        (1 - t) ** 3 * p0[0] + 3 * (1 - t) ** 2 * t * p1[0] + 3 * (1 - t) * t ** 2 * p2[0] + t ** 3 * p3[0],
        (1 - t) ** 3 * p0[1] + 3 * (1 - t) ** 2 * t * p1[1] + 3 * (1 - t) * t ** 2 * p2[1] + t ** 3 * p3[1],
    ) for t in (i / n for i in range(n + 1))]


def damla_noktalari(dy=0.0):
    sol = cubic((50, 19), (46.5, 26), (34, 39.5), (34, 53))
    alt = [(50 + 16 * math.cos(a), 53 + 16 * math.sin(a)) for a in (math.pi - math.pi * i / 80 for i in range(81))]
    # açı π → 0 azalırken sin pozitif: (34,53) → alttan (50,69) → (66,53)
    alt = [(x, y) for x, y in alt]
    sag = cubic((66, 53), (66, 39.5), (53.5, 26), (50, 19))
    return [(x, y + dy) for x, y in sol + alt + sag]


def ten_noktalari(n=120):
    p0, p1, p2 = (25, 76), (50, 70), (75, 76)
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0],
             (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1]) for t in (i / n for i in range(n + 1))]


def isaret_ciz(boyut, zemin, damla_renk, ten_renk, olcek=1.0, kalinlik=4.5, dy=0.0, ss=4):
    """İşareti boyut×boyut tuvale çizer (ss kat süper örnekleme). olcek: işaretin tuvaldeki büyüklüğü."""
    N = boyut * ss
    img = Image.new('RGBA', (N, N), zemin if zemin else (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    k = N / 100 * olcek
    ox = N / 2 - 50 * k
    oy = N / 2 - (48.5 - dy) * k  # işaretin dikey merkezi ~48.5
    tr = lambda p: (ox + p[0] * k, oy + p[1] * k)
    d.polygon([tr(p) for p in damla_noktalari()], fill=damla_renk)
    r = kalinlik / 2 * k
    for p in ten_noktalari(240):
        x, y = tr(p)
        d.ellipse((x - r, y - r, x + r, y + r), fill=ten_renk)
    return img.resize((boyut, boyut), Image.LANCZOS)


def kaydet(img, yol):
    tam = os.path.join(KOK, yol)
    os.makedirs(os.path.dirname(tam), exist_ok=True)
    img.save(tam)
    print('yazıldı', yol, img.size)


# ───────── Yazı: Manrope SemiBold → vektör; ı'nın noktası işaret ─────────
def yazi():
    font = TTFont(os.path.join(KOK, 'node_modules/@expo-google-fonts/manrope/600SemiBold/Manrope_600SemiBold.ttf'))
    gs = font.getGlyphSet()
    hmtx = font['hmtx']
    cmap = font.getBestCmap()
    upm = font['head'].unitsPerEm  # 2000
    xh = font['OS/2'].sxHeight      # 1080
    takip = -0.025 * upm            # hafif sıkı harf aralığı
    ust = 1440 + 120                # SVG'de y'yi çevirmek için üst referans (büyük harf yüksekliği + pay)

    harfler = 'tenınde'
    x = 0.0
    yollar = []
    i_merkez = None
    i_ust = xh
    for ch in harfler:
        g = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, (1, 0, 0, -1, x, ust)))
        yollar.append(pen.getCommands())
        if ch == 'ı':
            # ı gövdesinin gerçek sınırları: x 160..369 (birim) → merkez
            i_merkez = x + (160 + 369) / 2
        x += hmtx[g][0] + takip
    genislik = x - takip

    # İşaret: ızgaradaki 50 birim kemer genişliği = 2.05 × gövde (209) ≈ 428 birim
    k = 480 / 50  # kemer genişliği ≈ 2.3 × gövde
    bosluk = 0.14 * xh  # gövde üstü ile ten çizgisi arasındaki boşluk
    damla_yukari = 4    # yazıda damla çizgiden biraz uzak (ızgara birimi)
    # Izgarada ten çizgisinin en alt noktası y=76 (+ kalınlık/2). Bunu gövde üstü + boşluk'a oturt.
    taban_font = i_ust + bosluk
    def tr(px, py):
        fy = taban_font + (77 - py) * k           # font koordinatı (yukarı pozitif)
        return (i_merkez + (px - 50) * k, ust - fy)  # SVG koordinatı
    damla_d = 'M' + ' L'.join(f'{a:.1f} {b:.1f}' for a, b in (tr(px, py - damla_yukari) for px, py in damla_noktalari()[::2])) + ' Z'
    p0, p1, p2 = tr(25, 76), tr(50, 70), tr(75, 76)
    ten_d = f'M{p0[0]:.1f} {p0[1]:.1f} Q{p1[0]:.1f} {p1[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}'
    ten_kalinlik = 0.36 * 209  # gövdenin ~üçte biri: harf ağırlığıyla dengeli, küçük boyutta kaybolmaz

    # Görünüm kutusu: harflerin üstü (t ~1380) ve işaretin tepesi; alt: taban çizgisi (descender yok)
    damla_tepe = tr(50, 19 - damla_yukari)[1]
    vb_ust = min(ust - 1400, damla_tepe) - 40
    vb_alt = ust + 40
    return {
        'harfler': ' '.join(yollar),
        'damla': damla_d,
        'ten': ten_d,
        'tenKalinlik': round(ten_kalinlik, 1),
        'viewBox': (-40, round(vb_ust, 1), round(genislik + 80, 1), round(vb_alt - vb_ust, 1)),
    }


def main():
    # PNG simgeler
    kaydet(isaret_ciz(1024, KREM, AMBER, MUREKKEP, olcek=0.9, kalinlik=4.2).convert('RGB'), 'assets/images/icon.png')
    kaydet(isaret_ciz(512, None, AMBER, MUREKKEP, olcek=0.62, kalinlik=5), 'assets/images/android-icon-foreground.png')
    kaydet(Image.new('RGB', (512, 512), KREM), 'assets/images/android-icon-background.png')
    kaydet(isaret_ciz(432, None, '#000000', '#000000', olcek=0.62, kalinlik=5), 'assets/images/android-icon-monochrome.png')
    kaydet(isaret_ciz(1024, None, AMBER, MUREKKEP, olcek=0.9, kalinlik=4.5), 'assets/images/splash-icon.png')
    kaydet(isaret_ciz(1024, None, AMBER_ACIK, KREM_ACIK, olcek=0.9, kalinlik=4.5), 'assets/images/splash-icon-dark.png')
    kaydet(isaret_ciz(48, KREM, AMBER, MUREKKEP, olcek=1.05, kalinlik=6).convert('RGB'), 'assets/images/favicon.png')

    # SVG'ler
    os.makedirs(os.path.join(KOK, 'assets/brand'), exist_ok=True)
    with open(os.path.join(KOK, 'assets/brand/teninde-icon.svg'), 'w') as f:
        f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="{KREM}"/>'
                f'<path d="{DAMLA}" fill="{AMBER}"/><path d="{TEN}" fill="none" stroke="{MUREKKEP}" stroke-width="4.2" stroke-linecap="round"/></svg>\n')
    w = yazi()
    vb = ' '.join(str(v) for v in w['viewBox'])
    for ad, harf, damla, ten in [('teninde-wordmark.svg', MUREKKEP, AMBER, MUREKKEP), ('teninde-wordmark-dark.svg', KREM_ACIK, AMBER_ACIK, KREM_ACIK)]:
        with open(os.path.join(KOK, 'assets/brand', ad), 'w') as f:
            f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}"><path d="{w["harfler"]}" fill="{harf}"/>'
                    f'<path d="{w["ten"]}" fill="none" stroke="{ten}" stroke-width="{w["tenKalinlik"]}" stroke-linecap="round"/>'
                    f'<path d="{w["damla"]}" fill="{damla}"/></svg>\n')
        print('yazıldı assets/brand/' + ad)

    ts = f"""/**
 * Teninde marka yolları — OTOMATİK ÜRETİLİR: python3 scripts/build_brand.py
 * Elle düzenleme; işaret geometrisi veya yazı değişecekse scripti değiştirip yeniden çalıştırın.
 */

/** İşaret (100 birimlik ızgara): damla + ten çizgisi */
export const ISARET = {{
  viewBox: '0 0 100 100',
  damla: '{DAMLA}',
  ten: '{TEN}',
}} as const;

/** Yazı: Manrope SemiBold harfleri vektör; noktasız ı'nın noktası işaretin küçüğü */
export const YAZI = {{
  viewBox: '{vb}',
  /** genişlik / yükseklik */
  oran: {w['viewBox'][2] / w['viewBox'][3]:.4f},
  harfler: '{w['harfler']}',
  damla: '{w['damla']}',
  ten: '{w['ten']}',
  tenKalinlik: {w['tenKalinlik']},
}} as const;
"""
    with open(os.path.join(KOK, 'constants/brandPaths.ts'), 'w') as f:
        f.write(ts)
    print('yazıldı constants/brandPaths.ts')


if __name__ == '__main__':
    main()
