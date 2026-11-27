/**
 * TENİNDE — Sizden öğrendiklerim
 * Öğrenen motorun (engine/learning.ts) bu kullanıcı hakkında çıkardığı tespitler, kanıtlarıyla.
 * Her tespit "Bu doğru değil" ile kaldırılabilir (etkisi önerilerden tamamen çıkar); gizlenenler geri getirilebilir.
 * Hepsi cihazda hesaplanır.
 */
import { Card, Divider, Header, IconName, ListRow, ProgressLine, Screen, Section, T, useTheme } from '@/components/kit';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { OGRENME_MAX, Tespit } from '@/engine';
import { track } from '@/services/analytics';
import { hapticLight } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

const GRUPLAR: { tur: Tespit['tur']; baslik: string; icon: IconName }[] = [
  { tur: 'kalicilik', baslik: 'Teniniz', icon: 'water-outline' },
  { tur: 'aile', baslik: 'Zevkiniz', icon: 'color-palette-outline' },
  { tur: 'baglam', baslik: 'Alışkanlıklarınız', icon: 'calendar-outline' },
  { tur: 'iltifat', baslik: 'Sizde iyi sonuç verenler', icon: 'sparkles-outline' },
];

export default function LearnedScreen() {
  const router = useRouter();
  const c = useTheme();
  const { ogrenme, performanceLogs, rejectInsight, resetRejectedInsights, reddedilenTespitler } = useApp();
  const guven = Math.round(ogrenme.guven * 100);
  const kalibre = Object.keys(ogrenme.kalicilik).length;

  const reddet = (t: Tespit) => {
    Alert.alert('Bu tespit kaldırılsın mı?', `“${t.metin}”\n\nÖnerileriniz artık bunu dikkate almaz. İsterseniz sonra geri getirebilirsiniz.`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Kaldır', style: 'destructive', onPress: () => { hapticLight(); rejectInsight(t.id); track('insight_rejected', { tur: t.tur }); } },
    ]);
  };

  return (
    <Screen>
      <Header title="Sizden öğrendiklerim" />
      <T variant="h1" style={{ marginTop: Spacing.lg }}>Teninde sizi tanıyor</T>
      <T variant="body" color="muted" style={{ marginTop: Spacing.sm }}>
        Seçtikleriniz, dolabınız ve akşam kayıtlarınızla önerileriniz size göre şekillenir. Hepsi bu cihazda hesaplanır.
      </T>

      <Card style={{ marginTop: Spacing.xl }}>
        <View style={styles.row}>
          <Ozet deger={String(ogrenme.sinyalSayisi)} etiket="etkileşim" />
          <Ozet deger={String(performanceLogs.length)} etiket="akşam kaydı" />
          <Ozet deger={String(kalibre)} etiket="ailede ten ayarı" />
        </View>
        <View style={{ marginTop: Spacing.lg }}>
          <View style={styles.between}>
            <T variant="smallStrong">Öğrenme düzeyi</T>
            <T variant="smallStrong" color="accent">{guven < 40 ? 'Başlangıç' : guven < 75 ? 'Gelişiyor' : 'Güçlü'}</T>
          </View>
          <View style={{ marginTop: Spacing.sm }}><ProgressLine value={guven} /></View>
          <T variant="small" color="muted" style={{ marginTop: Spacing.sm }}>
            {guven < 40 ? 'Henüz sizi tanımaya başlıyoruz; birkaç kayıt daha önerileri belirgin şekilde kişiselleştirir.' : guven < 75 ? 'Önerileriniz artık davranışınıza göre ayarlanıyor.' : 'Önerileriniz büyük ölçüde size göre şekillendi.'}
          </T>
        </View>
      </Card>

      {ogrenme.tespitler.length ? GRUPLAR.map(g => {
        const liste = ogrenme.tespitler.filter(t => t.tur === g.tur);
        if (!liste.length) return null;
        return (
          <Section key={g.tur} title={g.baslik}>
            <Card style={{ paddingVertical: Spacing.sm }}>
              {liste.map((t, i) => (
                <View key={t.id}>
                  {i ? <Divider /> : null}
                  <View style={styles.tespit}>
                    <View style={[styles.icon, { backgroundColor: t.yon > 0 ? c.accentSoft : c.surfaceAlt }]}>
                      <Ionicons name={g.icon} size={16} color={t.yon > 0 ? c.accent : c.inkMuted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <T variant="body">{t.metin}</T>
                      <View style={[styles.between, { marginTop: 4 }]}>
                        <T variant="small" color="subtle">{t.kanit} kayda dayanıyor</T>
                        <Pressable onPress={() => reddet(t)} hitSlop={8}><T variant="small" color="muted">Bu doğru değil</T></Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </Card>
          </Section>
        );
      }) : (
        <Card tone="alt" style={{ marginTop: Spacing.lg }}>
          <T variant="bodyStrong">Henüz bir tespit yok</T>
          <T variant="small" color="muted" style={{ marginTop: 4 }}>Aşağıdakilerden birkaçını yaptığınızda burada teninize ve zevkinize dair ilk tespitler görünür.</T>
        </Card>
      )}

      <Section title="Uygulamayı nasıl eğitirsiniz?">
        <Card style={{ paddingVertical: Spacing.sm }}>
          <ListRow icon="moon-outline" title="Akşam değerlendirmesi" subtitle="En değerlisi: teninizde kaç saat kaldığını öğrenir, ten tahminini düzeltir" onPress={() => router.push('/diary')} />
          <Divider />
          <ListRow icon="heart-outline" title="Sevdim / Sevmedim" subtitle="Denediğiniz parfümün sayfasında; benzerlerini öne alır ya da geri iter" onPress={() => router.push('/(tabs)/parfums')} />
          <Divider />
          <ListRow icon="file-tray-stacked-outline" title="Dolabınızı oluşturun" subtitle="Sahip olduklarınız zevkinizi en net gösteren sinyaldir" onPress={() => router.push('/(tabs)/favorites')} />
          <Divider />
          <ListRow icon="today-outline" title="Günün kokusunu kaydedin" subtitle="“Bugün ne var?” ile birlikte: hangi gün neyi sevdiğinizi öğrenir" onPress={() => router.push('/(tabs)')} />
        </Card>
      </Section>

      {reddedilenTespitler.length ? (
        <Pressable onPress={() => { hapticLight(); resetRejectedInsights(); }} style={[styles.geri, { borderColor: c.border }]}>
          <T variant="small" color="muted">{reddedilenTespitler.length} tespiti kaldırdınız · </T>
          <T variant="smallStrong" color="accent">Geri getir</T>
        </Pressable>
      ) : null}

      <T variant="small" color="subtle" style={{ marginTop: Spacing.lg }}>
        Öğrenilenler bir öneriyi en fazla {OGRENME_MAX} puan değiştirir; ten profiliniz her zaman belirleyicidir. Eski kayıtların etkisi zamanla azalır (yaklaşık 2 ayda yarıya iner).
      </T>
    </Screen>
  );
}

function Ozet({ deger, etiket }: { deger: string; etiket: string }) {
  return (
    <View style={{ flex: 1 }}>
      <T variant="h2">{deger}</T>
      <T variant="small" color="muted">{etiket}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.md },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tespit: { flexDirection: 'row', gap: Spacing.md, paddingVertical: Spacing.md, alignItems: 'flex-start' },
  icon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  geri: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.full, borderWidth: StyleSheet.hairlineWidth },
});
