/**
 * Ten Profili gösterimi (sonuç ve profil ekranlarında ortak).
 */
import { Spacing } from '@/constants/theme';
import { getPHAraligiEtiketi } from '@/engine';
import { PHHesapSonucu } from '@/types';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Divider, Stat, T, useTheme } from './index';

const seviye = (v: number) => (v >= 65 ? 'Yüksek' : v >= 40 ? 'Orta' : 'Düşük');

export function phText(ph: PHHesapSonucu, measured: boolean, measuredValue?: number | null) {
  if (measured && measuredValue) return measuredValue.toFixed(1);
  return `~${(ph.aralikMin ?? ph.tahminiPH).toFixed(1)}–${(ph.aralikMax ?? ph.tahminiPH).toFixed(1)}`;
}

export function SkinAxis({ label, value, left, right }: { label: string; value: number; left: string; right: string }) {
  const c = useTheme();
  return (
    <View style={{ marginTop: Spacing.lg }}>
      <T variant="smallStrong">{label}</T>
      <View style={[styles.track, { backgroundColor: c.border }]}>
        <View style={[styles.knob, { left: `${Math.max(3, Math.min(97, value))}%`, backgroundColor: c.accent }]} />
      </View>
      <View style={styles.ends}>
        <T variant="small" color="subtle">{left}</T>
        <T variant="small" color="subtle">{right}</T>
      </View>
    </View>
  );
}

export function SkinProfileCard({ ph, measured, measuredValue, showAxes = false, footer }: { ph: PHHesapSonucu; measured: boolean; measuredValue?: number | null; showAxes?: boolean; footer?: React.ReactNode }) {
  const tp = ph.tenProfili;
  return (
    <Card>
      <View style={{ flexDirection: 'row' }}>
        <Stat label={measured ? 'pH · ölçüm' : 'pH · tahmin'} value={phText(ph, measured, measuredValue)} hint={getPHAraligiEtiketi(ph.aralik)} />
        <Stat label="Kalıcılık" value={tp ? seviye(tp.kalicilikEndeksi) : '—'} hint="yağlılık × ısı" />
        <Stat label="Yayılım" value={tp ? seviye(tp.yayilimEndeksi) : '—'} hint="ten ısısı" />
      </View>
      <Divider style={{ marginVertical: Spacing.lg }} />
      <T variant="body" color="muted">{ph.aciklama}</T>
      {showAxes && tp ? (
        <>
          <SkinAxis label="Yağlılık" value={tp.yaglilik} left="kuru" right="yağlı" />
          <SkinAxis label="Ten ısısı" value={tp.isi} left="serin" right="sıcak" />
          <SkinAxis label="pH eğilimi" value={(tp.asiditeEgilimi + 1) * 50} left="asidik" right="nötre yakın" />
        </>
      ) : null}
      {!measured ? (
        <T variant="small" color="subtle" style={{ marginTop: Spacing.lg }}>
          pH değeri cevaplarınızdan yapılan bir tahmindir, tıbbi ölçüm değildir.
        </T>
      ) : null}
      {footer}
    </Card>
  );
}

const styles = StyleSheet.create({
  track: { height: 2, borderRadius: 1, marginTop: 10 },
  knob: { position: 'absolute', top: -5, width: 12, height: 12, borderRadius: 6, marginLeft: -6 },
  ends: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
});
