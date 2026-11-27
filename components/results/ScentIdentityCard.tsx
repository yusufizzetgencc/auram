/**
 * "Koku Kimliğim" — paylaşılabilir kart: gönderi (4:5) veya Instagram hikâyesi (9:16). react-native-view-shot ile görüntüye çevrilir.
 * Görüntü her iki temada da aynı görünsün diye sabit, sıcak koyu bir palet kullanır.
 */
import { trUpper } from '@/utils/text';
import { FontFamilies } from '@/constants/theme';
import { PHHesapSonucu, RecommendationResult } from '@/types';
import { Monogram, Wordmark } from '@/components/kit/brand';
import React, { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const BG = '#1C1917';
const INK = '#F2ECE4';
const MUTED = 'rgba(242,236,228,0.6)';
const ACCENT = '#D9955A';
const LINE = 'rgba(242,236,228,0.16)';

interface Props {
  auraBaslik: string;
  ph: PHHesapSonucu;
  olculmus: boolean;
  enIyi?: RecommendationResult;
  width: number;
  isim?: string | null;
  /** 'post' = 4:5, 'story' = 9:16 */
  format?: 'post' | 'story';
}

const Axis = ({ label, value, left, right, s }: { label: string; value: number; left: string; right: string; s: number }) => (
  <View>
    <Text style={[styles.axisLabel, { fontSize: 12 * s }]}>{label}</Text>
    <View style={[styles.track, { marginTop: 8 * s }]}>
      <View style={[styles.knob, { left: `${Math.max(3, Math.min(97, value))}%`, width: 10 * s, height: 10 * s, borderRadius: 5 * s, marginLeft: -5 * s, top: -4.5 * s }]} />
    </View>
    <View style={[styles.ends, { marginTop: 6 * s }]}>
      <Text style={[styles.end, { fontSize: 10 * s }]}>{left}</Text>
      <Text style={[styles.end, { fontSize: 10 * s }]}>{right}</Text>
    </View>
  </View>
);

export const ScentIdentityCard = forwardRef<View, Props>(({ auraBaslik, ph, olculmus, enIyi, width, isim, format = 'post' }, ref) => {
  const tp = ph.tenProfili;
  const s = width / 340;
  const phMetin = olculmus
    ? `pH ${ph.tahminiPH.toFixed(1)}`
    : `pH ~${(ph.aralikMin ?? ph.tahminiPH).toFixed(1)}–${(ph.aralikMax ?? ph.tahminiPH).toFixed(1)}`;

  return (
    <View ref={ref} collapsable={false} style={[styles.card, { width, height: Math.round(width * (format === 'story' ? 16 / 9 : 1.25)), padding: (format === 'story' ? 30 : 26) * s, paddingTop: (format === 'story' ? 56 : 26) * s, borderRadius: 24 * s }]}>
      <View style={styles.top}>
        <Monogram size={24 * s} color={ACCENT} ring={INK} />
        <Text style={[styles.kicker, { fontSize: 10 * s }]}>KOKU KİMLİĞİ{isim ? ` · ${trUpper(isim)}` : ''}</Text>
      </View>

      <Text style={[styles.title, { fontSize: 32 * s, lineHeight: 36 * s, marginTop: 22 * s }]}>{auraBaslik}</Text>
      <Text style={[styles.sub, { fontSize: 12 * s, marginTop: 8 * s }]}>{phMetin} · {ph.aralik === 'asidik' ? 'asidik eğilim' : ph.aralik === 'bazik' ? 'nötre yakın' : 'dengeli ten'}</Text>

      {tp ? (
        <View style={{ gap: 14 * s, marginTop: 24 * s }}>
          <Axis s={s} label="Kalıcılık" value={tp.kalicilikEndeksi} left="çabuk uçar" right="gün boyu" />
          <Axis s={s} label="Yayılım" value={tp.yayilimEndeksi} left="tene yakın" right="iz bırakır" />
          <Axis s={s} label="Ten kimyası" value={(tp.asiditeEgilimi + 1) * 50} left="asidik" right="nötr" />
        </View>
      ) : null}

      <View style={{ flex: 1 }} />

      {enIyi ? (
        <View style={[styles.match, { padding: 16 * s, borderRadius: 16 * s }]}>
          <Text style={[styles.kicker, { fontSize: 9 * s }]}>EN UYUMLU EŞLEŞMEM · %{enIyi.matchPercentage}</Text>
          <Text style={[styles.brand, { fontSize: 11 * s, marginTop: 8 * s }]}>{(enIyi.parfum.marka || '').toUpperCase()}</Text>
          <Text style={[styles.perfume, { fontSize: 22 * s }]} numberOfLines={1}>{enIyi.parfum.isim}</Text>
          <Text style={[styles.reason, { fontSize: 12 * s, lineHeight: 17 * s, marginTop: 6 * s }]} numberOfLines={2}>{enIyi.matchReasons[0]}</Text>
        </View>
      ) : null}

      <View style={{ alignItems: 'center', gap: 4 * s, marginTop: 14 * s, marginBottom: format === 'story' ? 30 * s : 0 }}>
        <Wordmark size={15 * s} color={INK} accent={ACCENT} />
        <Text style={[styles.footer, { fontSize: 9 * s }]}>ten profiline göre parfüm</Text>
      </View>
    </View>
  );
});
ScentIdentityCard.displayName = 'ScentIdentityCard';

const styles = StyleSheet.create({
  card: { backgroundColor: BG, overflow: 'hidden' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  kicker: { color: ACCENT, fontFamily: FontFamilies.semiBold, letterSpacing: 1.6 },
  title: { color: INK, fontFamily: FontFamilies.displayBold, letterSpacing: -0.6 },
  sub: { color: MUTED, fontFamily: FontFamilies.medium },
  axisLabel: { color: INK, fontFamily: FontFamilies.medium },
  track: { height: 1.5, backgroundColor: LINE },
  knob: { position: 'absolute', backgroundColor: ACCENT },
  ends: { flexDirection: 'row', justifyContent: 'space-between' },
  end: { color: MUTED, fontFamily: FontFamilies.regular },
  match: { backgroundColor: 'rgba(242,236,228,0.05)', borderWidth: StyleSheet.hairlineWidth, borderColor: LINE },
  brand: { color: MUTED, fontFamily: FontFamilies.semiBold, letterSpacing: 1.4 },
  perfume: { color: INK, fontFamily: FontFamilies.displayBold, letterSpacing: -0.4 },
  reason: { color: INK, fontFamily: FontFamilies.regular },
  footer: { color: MUTED, fontFamily: FontFamilies.regular, textAlign: 'center' },
});
