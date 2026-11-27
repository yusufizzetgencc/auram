/**
 * Parfüm gösterim bileşenleri.
 * Fotoğraf yok (telif) — her parfüm, koku ailesi renginden üretilen soyut bir şişe silüetiyle temsil edilir.
 */
import { BorderRadius, ScentTypeColors, Spacing } from '@/constants/theme';
import { Parfum } from '@/types';
import { hapticLight } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, LinearGradient as SvgLinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { FamilyDot, T, useTheme } from './index';

/** Marka adı büyük harfle yazılırken hangi kuralın kullanılacağı */
export const brandCaps = (p?: Pick<Parfum, 'mensei' | 'marka'> | null): 'tr' | 'latin' =>
  // Yalnızca Türkçe harf içeren Türk marka adlarında (ör. "Eyüp Sabri" → SABRİ); "Nishane" markanın kendi yazımıyla NISHANE kalır
  p?.mensei === 'TR' && /[çğıöşüÇĞİÖŞÜ]/.test(p.marka ?? '') ? 'tr' : 'latin';

export const familyColor = (tip?: string) => ScentTypeColors[tip ?? ''] ?? '#B9A99A';

// ---------- Şişe ----------
// Her parfüm kendine özgü ama tutarlı bir şişeyle çizilir (fotoğraf yok — telif):
//  • gövde şekli koku ailesinden gelir (karakteri ilk bakışta sezdirir),
//  • kapak, oran ve kapak rengi parfüm kimliğinden türetilir (her açılışta aynı, aynı ailede bile farklı),
//  • sıvı rengi ana/ikincil aileden, koyuluğu konsantrasyondan gelir (Cologne açık, Parfum koyu).
type Shape = 'round' | 'tall' | 'square' | 'apothecary' | 'faceted' | 'drop';
const SHAPE_BY_FAMILY: Record<string, Shape> = {
  'Amber': 'round', 'Oryantal': 'round',
  'Çiçeksi': 'tall', 'Pudralı': 'tall',
  'Ferah': 'square', 'Aquatik': 'square', 'Yeşil': 'square',
  'Deri': 'apothecary',
  'Baharatlı': 'faceted', 'Odunsu': 'faceted',
  'Meyvemsi': 'drop', 'Tatlı': 'drop',
};
/** Gövde yolu (100×115 tuval) ve gövdenin üst kenarı */
const BODY: Record<Shape, { d: string; top: number; label: [number, number, number, number] }> = {
  round: { d: 'M50 44 A34 34 0 1 1 49.9 44 Z', top: 44, label: [36, 74, 28, 16] },
  tall: { d: 'M34 36 H66 Q70 36 70 42 V106 Q70 112 64 112 H36 Q30 112 30 106 V42 Q30 36 34 36 Z', top: 36, label: [37, 70, 26, 18] },
  square: { d: 'M26 46 H74 Q79 46 79 51 V107 Q79 112 74 112 H26 Q21 112 21 107 V51 Q21 46 26 46 Z', top: 46, label: [34, 72, 32, 18] },
  apothecary: { d: 'M38 44 H62 L78 58 V107 Q78 112 73 112 H27 Q22 112 22 107 V58 Z', top: 44, label: [32, 74, 36, 20] },
  faceted: { d: 'M50 42 L81 59 V95 L50 112 L19 95 V59 Z', top: 42, label: [36, 70, 28, 16] },
  drop: { d: 'M50 44 C27 68 21 84 24 97 Q29 112 50 112 Q71 112 76 97 C79 84 73 68 50 44 Z', top: 44, label: [38, 84, 24, 14] },
};
const CAP_COLORS = ['#2A2522', '#A8642A', '#8C857C'];
const CONC_OPACITY: Record<string, number> = { eau_fraiche: 0.5, eau_de_cologne: 0.55, eau_de_toilette: 0.7, eau_de_parfum: 0.85, parfum: 1, extrait: 1 };

const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

type BottleInput = Pick<Parfum, 'tip' | 'ikincilTip' | 'isim'> & Partial<Pick<Parfum, 'id' | 'konsantrasyon' | 'nis' | 'marka'>>;

/** Soyut şişe: aileye göre gövde, kimliğe göre kapak, notalara göre sıvı */
export function Bottle({ parfum, size = 56 }: { parfum: BottleInput; size?: number }) {
  const hidden = parfum.isim === 'Gizli eşleşme';
  const seed = hash(hidden ? `gizli-${parfum.tip}` : parfum.id ?? `${parfum.marka}|${parfum.isim}`);
  const shape = SHAPE_BY_FAMILY[parfum.tip] ?? 'tall';
  const body = BODY[shape];
  const a = familyColor(parfum.tip);
  const b = familyColor(parfum.ikincilTip ?? parfum.tip);
  const liquidOpacity = CONC_OPACITY[parfum.konsantrasyon ?? 'eau_de_parfum'] ?? 0.8;
  const widthScale = 0.92 + ((seed % 7) / 6) * 0.14; // 0.92–1.06
  const capColor = hidden ? '#8C857C' : CAP_COLORS[(seed >> 3) % CAP_COLORS.length];
  const capKind = parfum.nis ? 'slab' : (['cube', 'column', 'sphere'] as const)[(seed >> 5) % 3];
  const neckH = 5 + ((seed >> 7) % 3);
  const neckTop = body.top - neckH;
  const fillTop = body.top + (112 - body.top) * 0.2; // sıvı gövdenin ~%80'i
  const [lx, ly, lw, lh] = body.label;
  const showLabel = size >= 36;
  const showInitials = size >= 64; // küçük boyutlarda harfler okunmaz; sade etiket kalır
  const code = /^No\.?\s*(\d+)/i.exec(parfum.isim); // "No. 122" gibi kodlu ürünlerde numarayı yaz
  const initials = hidden ? '' : code ? code[1].slice(0, 3) : parfum.isim.replace(/[^A-Za-zÀ-ÿ0-9 ]/g, '').trim().slice(0, 2).toUpperCase();
  const k = `b${seed}`;

  const cap = () => {
    switch (capKind) {
      case 'slab': return <Rect x={35} y={neckTop - 12} width={30} height={12} rx={2} fill={capColor} />;
      case 'column': return <Rect x={42} y={neckTop - 22} width={16} height={22} rx={3} fill={capColor} />;
      case 'sphere': return <Circle cx={50} cy={neckTop - 10} r={10} fill={capColor} />;
      default: return <Rect x={39} y={neckTop - 16} width={22} height={16} rx={2.5} fill={capColor} />;
    }
  };

  return (
    <View style={{ width: size, height: size * 1.15 }}>
      <Svg width={size} height={size * 1.15} viewBox="0 0 100 115">
        <Defs>
          <SvgLinearGradient id={`${k}l`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={a} stopOpacity={liquidOpacity} />
            <Stop offset="1" stopColor={b} stopOpacity={liquidOpacity} />
          </SvgLinearGradient>
          <ClipPath id={`${k}c`}>
            <Path d={body.d} />
          </ClipPath>
        </Defs>
        <G transform={`translate(50 0) scale(${widthScale} 1) translate(-50 0)`}>
          {/* boyun + kapak */}
          <Rect x={44} y={neckTop} width={12} height={neckH + 1} fill="#B9B2A9" />
          {cap()}
          {/* cam gövde */}
          <Path d={body.d} fill="#FFFFFF" fillOpacity={0.45} />
          {/* sıvı (gövdeye kırpılmış) */}
          <G clipPath={`url(#${k}c)`}>
            <Rect x={0} y={fillTop} width={100} height={115 - fillTop} fill={`url(#${k}l)`} />
            <Rect x={0} y={fillTop} width={100} height={1.2} fill="#FFFFFF" fillOpacity={0.5} />
          </G>
          <Path d={body.d} fill="none" stroke={a} strokeOpacity={0.55} strokeWidth={1.4} />
          {/* ışık yansıması */}
          <G clipPath={`url(#${k}c)`}>
            <Rect x={body.label[0] - 8} y={body.top + 6} width={3.5} height={(112 - body.top) * 0.62} rx={1.75} fill="#FFFFFF" fillOpacity={0.55} />
          </G>
          {/* etiket */}
          {showLabel ? (
            <>
              <Rect x={lx} y={ly} width={lw} height={lh} rx={1.5} fill="#FBF8F4" fillOpacity={0.9} />
              {hidden ? (
                <Rect x={lx + lw * 0.25} y={ly + lh / 2 - 0.75} width={lw * 0.5} height={1.5} fill="#1E1B18" fillOpacity={0.5} />
              ) : !showInitials ? null : (
                <SvgText x={lx + lw / 2} y={ly + lh / 2 + 3.4} fontSize={9.5} fontFamily="Manrope_700Bold" fill="#1E1B18" textAnchor="middle" letterSpacing={0.6}>{initials}</SvgText>
              )}
            </>
          ) : null}
        </G>
      </Svg>
    </View>
  );
}

/** Liste satırı: şişe + marka/isim + aile + sağ öğe */
export function PerfumeRow({ parfum, onPress, right, subtitle }: { parfum: Parfum; onPress?: () => void; right?: React.ReactNode; subtitle?: string }) {
  const c = useTheme();
  return (
    <Pressable onPress={onPress ? () => { hapticLight(); onPress(); } : undefined} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1, borderBottomColor: c.border }]}>
      <View style={[styles.bottleBox, { backgroundColor: c.surfaceAlt }]}>
        <Bottle parfum={parfum} size={46} />
      </View>
      <View style={{ flex: 1 }}>
        <T variant="overline" caps={brandCaps(parfum)} color="subtle" numberOfLines={1}>{parfum.marka ?? ''}</T>
        <T variant="h3" numberOfLines={1}>{parfum.isim}</T>
        <View style={styles.meta}>
          <FamilyDot family={parfum.tip} />
          <T variant="small" color="muted" numberOfLines={1}>{subtitle ?? `${parfum.tip}${parfum.ikincilTip ? ' · ' + parfum.ikincilTip : ''}`}</T>
        </View>
      </View>
      {right ?? <Ionicons name="chevron-forward" size={18} color={c.inkSubtle} />}
    </Pressable>
  );
}

/** Yatay kaydırma kartı */
export function PerfumeTile({ parfum, onPress, badge, width = 150 }: { parfum: Parfum; onPress?: () => void; badge?: string; width?: number }) {
  const c = useTheme();
  return (
    <Pressable onPress={onPress ? () => { hapticLight(); onPress(); } : undefined} style={({ pressed }) => [{ width, opacity: pressed ? 0.8 : 1 }]}>
      <View style={[styles.tileArt, { backgroundColor: c.surfaceAlt, height: width * 1.1 }]}>
        <Bottle parfum={parfum} size={width * 0.6} />
        {badge ? (
          <View style={[styles.badge, { backgroundColor: c.surface, borderColor: c.border }]}>
            <T variant="smallStrong">{badge}</T>
          </View>
        ) : null}
      </View>
      <T variant="overline" caps={brandCaps(parfum)} color="subtle" numberOfLines={1} style={{ marginTop: Spacing.sm }}>{parfum.marka ?? ''}</T>
      <T variant="bodyStrong" numberOfLines={1}>{parfum.isim}</T>
    </Pressable>
  );
}

/** Eşleşme yüzdesi rozeti */
export function MatchBadge({ value }: { value: number }) {
  const c = useTheme();
  return (
    <View style={[styles.match, { borderColor: c.accent }]}>
      <T variant="smallStrong" color="accent">%{Math.round(value)}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  bottleBox: { width: 60, height: 68, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  tileArt: { borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 8, right: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full, borderWidth: StyleSheet.hairlineWidth },
  match: { borderWidth: 1, borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
});
