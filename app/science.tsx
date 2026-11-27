/**
 * TENİNDE — Bilim ve yöntem
 * Önerilerin nasıl hesaplandığını, pH tahmininin sınırlarını ve kaynakları açıkça anlatır.
 */
import { Card, Divider, Header, Screen, T, useTheme } from '@/components/kit';
import { Spacing } from '@/constants/theme';
import { AGIRLIKLAR } from '@/engine';
import React from 'react';
import { Linking, View } from 'react-native';

const FACTORS: { title: string; body: string }[] = [
  { title: 'Ten yağı (sebum)', body: 'Koku moleküllerinin çoğu yağda çözünür. Yağlı ten parfümü daha uzun tutar, kuru ten daha çabuk uçurur. Bu yüzden kalıcılık tahmininin ana girdisidir.' },
  { title: 'Ten ısısı', body: 'Sıcaklık buharlaşmayı hızlandırır: sıcak ten kokuyu daha çok yayar ama daha çabuk tüketir. Serin ten yoğun parfümleri yavaş açar.' },
  { title: 'Kendi gözleminiz', body: '"Parfümler bende ne kadar kalıyor?" ve "akşama nasıl kokuyor?" cevaplarınız, tahmindeki en doğrudan bilgilerdir.' },
  { title: 'pH eğilimi', body: 'Sağlıklı ten yüzeyi pH\'ı dar bir aralıktadır (çoğunlukla 4.5–6.0, doğal ortalama ~4.7). pH\'ın parfüme etkisi tartışmalı ve küçüktür; bu yüzden puanın yalnızca %10\'unu oluşturur.' },
];

const SOURCES: { label: string; url: string }[] = [
  { label: 'Lambers ve ark. (2006) — Doğal ten yüzeyi pH\'ı ortalama 5\'in altındadır', url: 'https://pubmed.ncbi.nlm.nih.gov/18489300/' },
  { label: 'Ali & Yosipovitch (2013) — Ten pH\'ı ve bariyer fonksiyonu', url: 'https://medicaljournals.se/acta/content/html/10.2340/00015555-1531' },
  { label: 'Man ve ark. — Yaş, cinsiyet ve bölgeye göre sebum, nem ve pH', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2836947' },
  { label: 'Meyer ve ark. (2007) — Terleme hızı ve ter bileşimi', url: 'https://scielo.br/j/bjmbr/a/Ts34TMxdTPXGTr3y4G8jXxd/?lang=en' },
];

const WEIGHT_LABELS: Record<string, string> = {
  tenPerformansi: 'Ten performansı (kalıcılık/yayılım)',
  phUyumu: 'pH eğilimi × nota yapısı',
  kokuAilesi: 'Sevdiğiniz koku aileleri',
  aura: 'İstediğiniz iz (aura)',
  mevsim: 'Mevsim',
  isiYogunluk: 'Ten ısısı × yoğunluk',
  konsantrasyon: 'Güç tercihi',
  kullanimAmaci: 'Kullanım amacı',
  ortam: 'Yaşam ortamı',
  cinsiyet: 'Profil tercihi',
  butce: 'Bütçe',
};

export default function ScienceScreen() {
  const c = useTheme();
  return (
    <Screen>
      <Header title="Bilim ve yöntem" />
      <T variant="h1" style={{ marginTop: Spacing.lg }}>Neye bakıyoruz, neye bakmıyoruz?</T>
      <T variant="body" color="muted" style={{ marginTop: Spacing.sm }}>
        Teninde pH ölçmez; cevaplarınızdan bir eğilim tahmin eder ve bunu her zaman bir aralık olarak gösterir. Bir test şeridiyle ölçtüyseniz kendi değerinizi girebilirsiniz.
      </T>

      <View style={{ marginTop: Spacing.xl, gap: Spacing.sm }}>
        {FACTORS.map(f => (
          <Card key={f.title}>
            <T variant="h3">{f.title}</T>
            <T variant="body" color="muted" style={{ marginTop: 4 }}>{f.body}</T>
          </Card>
        ))}
      </View>

      <T variant="h2" style={{ marginTop: Spacing['2xl'] }}>Puan nasıl oluşuyor?</T>
      <Card style={{ marginTop: Spacing.md }}>
        {Object.entries(AGIRLIKLAR).sort((a, b) => b[1] - a[1]).map(([k, v], i) => (
          <View key={k}>
            {i > 0 ? <Divider style={{ marginVertical: Spacing.sm }} /> : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <T variant="body" style={{ flex: 1 }}>{WEIGHT_LABELS[k] ?? k}</T>
              <View style={{ width: 60, height: 3, backgroundColor: c.border }}>
                <View style={{ width: `${v * 5}%`, height: 3, backgroundColor: c.accent }} />
              </View>
              <T variant="smallStrong" style={{ width: 36, textAlign: 'right' }}>%{v}</T>
            </View>
          </View>
        ))}
      </Card>
      <T variant="small" color="muted" style={{ marginTop: Spacing.sm }}>
        Ayrıca kırmızı çizgileriniz (ör. “aşırı şekerli olmasın”) sert ceza uygular; bu notaları içeren parfümler listeden çıkarılır.
      </T>

      <T variant="h2" style={{ marginTop: Spacing['2xl'] }}>Ne yapmıyoruz?</T>
      <T variant="body" color="muted" style={{ marginTop: Spacing.sm }}>
        Tıbbi teşhis veya tavsiye vermeyiz. Beslenme, hormon ve ilaçların parfüme etkisi için güvenilir kanıt olmadığından bunları sormayız. Yeni bir parfümü önce küçük bir alanda deneyin; şikâyetiniz olursa bir dermatoloğa danışın.
      </T>

      <T variant="h2" style={{ marginTop: Spacing['2xl'] }}>Kaynaklar</T>
      <View style={{ marginTop: Spacing.md, gap: Spacing.md }}>
        {SOURCES.map(s => (
          <T key={s.url} variant="small" color="accent" onPress={() => Linking.openURL(s.url)}>{s.label}</T>
        ))}
      </View>
    </Screen>
  );
}
