/**
 * Aylık koku raporu paylaşım kartı — Instagram hikâyesi oranında (9:16).
 * Görüntü her iki temada aynı görünsün diye Koku Kimliği kartıyla aynı sabit koyu paleti kullanır.
 */
import { FontFamilies } from '@/constants/theme';
import { AY_ADLARI, AylikRapor } from '@/engine';
import { trUpper } from '@/utils/text';
import { Monogram, Wordmark } from '@/components/kit/brand';
import React, { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const BG = '#1C1917';
const INK = '#F2ECE4';
const MUTED = 'rgba(242,236,228,0.6)';
const ACCENT = '#D9955A';
const LINE = 'rgba(242,236,228,0.16)';

export const ReportCard = forwardRef<View, { rapor: AylikRapor; width: number; isim?: string | null }>(({ rapor, width, isim }, ref) => {
  const s = width / 340;
  const Stat = ({ v, l }: { v: string; l: string }) => (
    <View style={{ flex: 1 }}>
      <Text style={[styles.statV, { fontSize: 30 * s }]}>{v}</Text>
      <Text style={[styles.statL, { fontSize: 10.5 * s }]}>{l}</Text>
    </View>
  );
  return (
    <View ref={ref} collapsable={false} style={[styles.card, { width, height: Math.round((width * 16) / 9), padding: 30 * s, paddingTop: 56 * s, borderRadius: 24 * s }]}>
      <View style={styles.top}>
        <Monogram size={24 * s} color={ACCENT} ring={INK} />
        <Text style={[styles.kicker, { fontSize: 10 * s }]}>KOKU RAPORU{isim ? ` · ${trUpper(isim)}` : ''}</Text>
      </View>
      <Text style={[styles.title, { fontSize: 40 * s, lineHeight: 44 * s, marginTop: 26 * s }]}>{AY_ADLARI[rapor.ay - 1]}{'\n'}{rapor.yil}</Text>

      <View style={[styles.row, { marginTop: 30 * s }]}>
        <Stat v={String(rapor.toplamGun)} l="GÜN PARFÜM" />
        <Stat v={String(rapor.farkliParfum)} l="FARKLI KOKU" />
        <Stat v={String(rapor.iltifatSayisi)} l="İLTİFAT" />
      </View>

      {rapor.enCok[0] ? (
        <View style={[styles.box, { padding: 16 * s, borderRadius: 16 * s, marginTop: 26 * s }]}>
          <Text style={[styles.kicker, { fontSize: 9 * s }]}>AYIN KOKUSU · {rapor.enCok[0].deger} GÜN</Text>
          <Text style={[styles.brand, { fontSize: 11 * s, marginTop: 8 * s }]}>{(rapor.enCok[0].parfum.marka || '').toUpperCase()}</Text>
          <Text style={[styles.perfume, { fontSize: 24 * s }]} numberOfLines={1}>{rapor.enCok[0].parfum.isim}</Text>
        </View>
      ) : null}

      {rapor.enUzunKalan ? (
        <Text style={[styles.line, { fontSize: 13 * s, marginTop: 16 * s }]}>Teninde en uzun kalan: <Text style={{ color: INK, fontFamily: FontFamilies.semiBold }}>{rapor.enUzunKalan.parfum.isim}</Text></Text>
      ) : null}

      {rapor.aileDagilimi.length ? (
        <View style={{ marginTop: 22 * s, gap: 10 * s }}>
          {rapor.aileDagilimi.slice(0, 3).map(a => (
            <View key={a.aile}>
              <View style={styles.rowBetween}>
                <Text style={[styles.line, { fontSize: 12 * s, color: INK }]}>{a.aile}</Text>
                <Text style={[styles.line, { fontSize: 12 * s }]}>%{a.yuzde}</Text>
              </View>
              <View style={[styles.track, { marginTop: 6 * s }]}><View style={[styles.fill, { width: `${a.yuzde}%` }]} /></View>
            </View>
          ))}
        </View>
      ) : null}

      <View style={{ flex: 1 }} />
      <View style={{ alignItems: 'center', gap: 4 * s, marginBottom: 30 * s }}>
        <Wordmark size={15 * s} color={INK} accent={ACCENT} />
        <Text style={[styles.footer, { fontSize: 9 * s }]}>ten profiline göre parfüm</Text>
      </View>
    </View>
  );
});
ReportCard.displayName = 'ReportCard';

const styles = StyleSheet.create({
  card: { backgroundColor: BG, overflow: 'hidden' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  kicker: { color: ACCENT, fontFamily: FontFamilies.semiBold, letterSpacing: 1.6 },
  title: { color: INK, fontFamily: FontFamilies.displayBold, letterSpacing: -0.8 },
  row: { flexDirection: 'row' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  statV: { color: INK, fontFamily: FontFamilies.displayBold },
  statL: { color: MUTED, fontFamily: FontFamilies.semiBold, letterSpacing: 1.2 },
  box: { backgroundColor: 'rgba(242,236,228,0.05)', borderWidth: StyleSheet.hairlineWidth, borderColor: LINE },
  brand: { color: MUTED, fontFamily: FontFamilies.semiBold, letterSpacing: 1.4 },
  perfume: { color: INK, fontFamily: FontFamilies.displayBold, letterSpacing: -0.4 },
  line: { color: MUTED, fontFamily: FontFamilies.regular },
  track: { height: 3, backgroundColor: LINE, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 3, backgroundColor: ACCENT },
  footer: { color: MUTED, fontFamily: FontFamilies.regular, textAlign: 'center' },
});
