/**
 * TENİNDE — Arkadaşımla koku uyumu (ücretsiz)
 *  1. "Profil kodum": koku zevkinin özeti (engine/friend.ts → profilKodu). Paylaş menüsüyle gönderilir;
 *     içinde uygulamayı doğrudan bu ekranda açan teninde://friend?kod=… bağlantısı da vardır.
 *  2. Arkadaşın kodu yapıştırılır (ya da bağlantıyla gelir) → uyum yüzdesi, ortak yönler,
 *     ikinize de uyan parfümler ve ona hediye fikirleri.
 *  Kodlar yalnızca cihazda saklanır (services/storage → FRIENDS); sunucuya hiçbir şey gönderilmez.
 */
import { Button, Card, Chip, Divider, EmptyState, Header, ListRow, Screen, Section, Segmented, T, useTheme } from '@/components/kit';
import { PerfumeRow } from '@/components/kit/perfume';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { ArkadasProfili, AURA_BASLIK, getEffectivePH, kodCoz, kokuUyumu, profilKodu } from '@/engine';
import { track } from '@/services/analytics';
import { loadFriends, SavedFriend, saveFriends } from '@/services/storage';
import { hapticLight, hapticSuccess } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Share, StyleSheet, Switch, TextInput, View } from 'react-native';

type Sekme = 'uyum' | 'kodum';

export default function FriendScreen() {
  const router = useRouter();
  const c = useTheme();
  const params = useLocalSearchParams<{ kod?: string }>();
  const { parfumler, preferences } = useApp();
  const ph = useMemo(() => getEffectivePH(preferences), [preferences]);

  const [sekme, setSekme] = useState<Sekme>('uyum');
  const [metin, setMetin] = useState('');
  const [arkadas, setArkadas] = useState<ArkadasProfili | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [kayitli, setKayitli] = useState<SavedFriend[]>([]);
  const [adPaylas, setAdPaylas] = useState(true);
  const [aktifKod, setAktifKod] = useState<string | null>(null);

  useEffect(() => { loadFriends().then(setKayitli); }, []);

  const benimKod = useMemo(() => profilKodu(preferences, ph, adPaylas), [preferences, ph, adPaylas]);
  const eksikProfil = !(preferences.kokuTipleri?.length) && !preferences.aura;

  const coz = (kod: string, kaydet = true) => {
    const a = kodCoz(kod);
    if (!a) { setHata('Bu kod okunamadı. Kodun tamamını, "TEN1-" ile başlayan kısımla birlikte yapıştırın.'); setArkadas(null); return; }
    const ben = kodCoz(profilKodu(preferences, ph, false));
    if (ben && JSON.stringify({ ...a, ad: undefined }) === JSON.stringify({ ...ben, ad: undefined }) && (!a.ad || a.ad === preferences.userName?.trim().split(/\s+/)[0])) { setHata('Bu sizin kendi kodunuz. Arkadaşınızın kodunu yapıştırın.'); setArkadas(null); return; }
    setHata(null);
    setArkadas(a);
    setAktifKod(kod.trim().replace(/\s+/g, ''));
    hapticSuccess();
    track('friend_compared', {});
    if (kaydet) {
      const temiz = kod.trim().replace(/\s+/g, '');
      const k = temiz.slice(temiz.indexOf('TEN1-'));
      const yeni: SavedFriend = { kod: k, ad: a.ad ?? 'Arkadaşım', eklendi: new Date().toISOString() };
      const liste = [yeni, ...kayitli.filter(f => f.kod !== k)];
      setKayitli(liste);
      saveFriends(liste);
    }
  };

  // Bağlantıyla gelen kod
  useEffect(() => {
    if (params.kod) { setMetin(params.kod); coz(params.kod); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.kod]);

  const sonuc = useMemo(() => (arkadas ? kokuUyumu(preferences, ph, arkadas, parfumler) : null), [arkadas, preferences, ph, parfumler]);

  const paylas = async () => {
    hapticLight();
    const link = `teninde://friend?kod=${encodeURIComponent(benimKod)}`;
    try {
      const r = await Share.share({
        message: `Teninde'de koku uyumumuza bakalım. Uygulamada Profil → Arkadaşımla koku uyumu → "Kodu yapıştır" bölümüne bu kodu ekle:\n\n${benimKod}\n\nUygulama yüklüyse doğrudan aç: ${link}`,
      });
      if (r.action === Share.sharedAction) track('friend_code_shared', {});
    } catch {}
  };

  const sil = (f: SavedFriend) => {
    Alert.alert(`${f.ad} silinsin mi?`, 'Kod yalnızca bu cihazdan silinir.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => { const l = kayitli.filter(x => x.kod !== f.kod); setKayitli(l); saveFriends(l); if (aktifKod?.endsWith(f.kod)) { setArkadas(null); setMetin(''); } } },
    ]);
  };

  const kim = arkadas?.ad ?? 'Arkadaşınız';

  return (
    <Screen>
      <Header title="Koku uyumu" />
      <T variant="h1" style={{ marginTop: Spacing.lg }}>Arkadaşınızla koku uyumunuz</T>
      <T variant="body" color="muted" style={{ marginTop: Spacing.sm }}>
        Kodlarınızı paylaşın; zevklerinizin ne kadar örtüştüğünü, ikinize de uyan parfümleri ve ona ne hediye edebileceğinizi görün.
      </T>

      <View style={{ marginTop: Spacing.xl }}>
        <Segmented value={sekme} onChange={setSekme} options={[{ value: 'uyum', label: 'Uyuma bak' }, { value: 'kodum', label: 'Profil kodum' }]} />
      </View>

      {sekme === 'kodum' ? (
        <>
          {eksikProfil ? (
            <Card tone="alt" style={{ marginTop: Spacing.lg }}>
              <T variant="bodyStrong">Profiliniz eksik</T>
              <T variant="small" color="muted" style={{ marginTop: 4 }}>Koku aileleri ve aura seçmediğiniz için kodunuz zevkinizi tam yansıtmaz. Profil → Güncelle ile tamamlayabilirsiniz.</T>
            </Card>
          ) : null}
          <Card style={{ marginTop: Spacing.lg }}>
            <T variant="overline" color="subtle">Kodunuz neyi içerir?</T>
            <View style={styles.tags}>
              {(preferences.kokuTipleri ?? []).slice(0, 4).map(a => <Chip key={a} label={a} />)}
              {preferences.aura ? <Chip label={AURA_BASLIK[preferences.aura]} /> : null}
              <Chip label={`pH ~${ph.toFixed(1)}`} />
              {preferences.sevilenParfumler?.length ? <Chip label={`${Math.min(5, preferences.sevilenParfumler.length)} sevdiğiniz parfüm`} /> : null}
            </View>
            <T variant="small" color="muted" style={{ marginTop: Spacing.md }}>
              Ten cevaplarınız, kaçındığınız notalar, bütçeniz ve günlüğünüz koda girmez.
            </T>
            <Divider style={{ marginVertical: Spacing.md }} />
            <ListRow icon="person-outline" title="Adımı göster" subtitle={preferences.userName ? `Arkadaşınız sizi “${preferences.userName.trim().split(/\s+/)[0]}” olarak görür` : 'Profilde adınız yok'} right={<Switch value={adPaylas && !!preferences.userName} disabled={!preferences.userName} onValueChange={setAdPaylas} trackColor={{ true: c.accent, false: c.border }} />} />
            <View style={[styles.codeBox, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
              <T variant="small" color="muted" selectable numberOfLines={3} style={{ fontFamily: undefined }}>{benimKod}</T>
            </View>
            <Button label="Kodumu paylaş" icon="share-outline" onPress={paylas} style={{ marginTop: Spacing.md }} />
          </Card>
          <T variant="small" color="subtle" style={{ marginTop: Spacing.md }}>
            Arkadaşınız bağlantıya dokunursa Teninde bu ekranda açılır ve uyumunuz hemen hesaplanır.
          </T>
        </>
      ) : (
        <>
          <Card style={{ marginTop: Spacing.lg }}>
            <T variant="bodyStrong">Arkadaşınızın kodu</T>
            <TextInput
              value={metin}
              onChangeText={t => { setMetin(t); setHata(null); }}
              placeholder="TEN1-… ile başlayan kodu yapıştırın"
              placeholderTextColor={c.inkSubtle}
              autoCapitalize="none"
              autoCorrect={false}
              multiline
              style={[styles.input, { color: c.ink, borderColor: hata ? c.danger : c.border, backgroundColor: c.surfaceAlt }]}
            />
            {hata ? <T variant="small" color="danger" style={{ marginTop: Spacing.sm }}>{hata}</T> : null}
            <Button label="Uyumu hesapla" icon="sparkles-outline" disabled={!metin.trim()} onPress={() => coz(metin)} style={{ marginTop: Spacing.md }} />
          </Card>

          {kayitli.length && !sonuc ? (
            <Section title="Kayıtlı arkadaşlar">
              <Card style={{ paddingVertical: Spacing.sm }}>
                {kayitli.map((f, i) => (
                  <View key={f.kod}>
                    {i ? <Divider /> : null}
                    <ListRow icon="people-outline" title={f.ad} subtitle={`Eklendi ${new Date(f.eklendi).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}`} onPress={() => { setMetin(f.kod); coz(f.kod, false); }} right={<Ionicons name="trash-outline" size={18} color={c.inkSubtle} onPress={() => sil(f)} />} />
                  </View>
                ))}
              </Card>
            </Section>
          ) : null}

          {!sonuc && !kayitli.length ? (
            <View style={{ marginTop: Spacing.xl }}>
              <EmptyState icon="people-outline" title="Henüz bir kod eklemediniz" body="Önce “Profil kodum” sekmesinden kodunuzu arkadaşınıza gönderin; o da size kendi kodunu göndersin." actionLabel="Profil kodum" onAction={() => setSekme('kodum')} />
            </View>
          ) : null}

          {sonuc && arkadas ? (
            <>
              <Card tone="accent" style={{ marginTop: Spacing.lg, alignItems: 'center', paddingVertical: Spacing.xl }}>
                <T variant="overline" color="accent">{kim} ile uyumunuz</T>
                <T variant="hero" style={{ marginTop: Spacing.sm }}>%{sonuc.yuzde}</T>
                <T variant="body" color="muted" align="center" style={{ marginTop: Spacing.sm }}>{sonuc.ozet}</T>
              </Card>

              <Section title="Nerede buluşuyorsunuz?">
                <Card style={{ gap: Spacing.md }}>
                  <Satir icon="color-palette-outline" baslik="Koku aileleri" deger={sonuc.ortakAileler.length ? `Ortak: ${sonuc.ortakAileler.join(', ')}` : `Ortak aile yok · ${kim}: ${arkadas.aileler.join(', ') || 'belirtilmemiş'}`} />
                  <Satir icon="sparkles-outline" baslik="Aura" deger={sonuc.auraAyni ? `İkiniz de ${AURA_BASLIK[arkadas.aura!]}` : `Siz: ${preferences.aura ? AURA_BASLIK[preferences.aura] : '—'} · ${kim}: ${arkadas.aura ? AURA_BASLIK[arkadas.aura] : '—'}`} />
                  <Satir icon="water-outline" baslik="Ten eğilimi" deger={sonuc.phYakinlik >= 0.75 ? 'Benzer: aynı parfüm ikinizde de yakın açılır' : sonuc.phYakinlik >= 0.4 ? 'Biraz farklı: aynı parfüm sizde farklı açılabilir' : 'Farklı: aynı parfüm ikinizde belirgin farklı kokabilir'} />
                  {sonuc.ortakSevilen.length ? <Satir icon="heart-outline" baslik="İkinizin de sevdiği" deger={sonuc.ortakSevilen.map(p => p.isim).join(', ')} /> : null}
                </Card>
              </Section>

              <Section title="İkinize de uyanlar">
                <Card style={{ paddingVertical: 0 }}>
                  {sonuc.ikiniziUyan.map(x => (
                    <PerfumeRow key={x.parfum.id} parfum={x.parfum} subtitle={`Siz %${x.ben} · ${kim} %${x.o}`} onPress={() => router.push(`/parfum/${x.parfum.id}`)} />
                  ))}
                </Card>
                <T variant="small" color="subtle" style={{ marginTop: Spacing.sm }}>Birlikte gidilecek bir akşam ya da ortak kullanılacak bir şişe için.</T>
              </Section>

              <Section title={`${kim} için hediye fikirleri`}>
                <Card style={{ paddingVertical: 0 }}>
                  {sonuc.onaHediye.map(p => (
                    <PerfumeRow key={p.id} parfum={p} subtitle={p.tip + (p.ikincilTip ? ` · ${p.ikincilTip}` : '')} onPress={() => router.push(`/parfum/${p.id}`)} />
                  ))}
                </Card>
                <T variant="small" color="subtle" style={{ marginTop: Spacing.sm }}>
                  Arkadaşınızın ten cevaplarını bilmediğimiz için bu öneriler zevkine ve pH eğilimine dayanır.
                </T>
              </Section>

              <Button label="Başka bir arkadaş" variant="secondary" icon="refresh-outline" onPress={() => { setArkadas(null); setMetin(''); }} style={{ marginTop: Spacing.xl }} />
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

function Satir({ icon, baslik, deger }: { icon: React.ComponentProps<typeof Ionicons>['name']; baslik: string; deger: string }) {
  const c = useTheme();
  return (
    <View style={styles.satir}>
      <Ionicons name={icon} size={18} color={c.accent} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <T variant="smallStrong">{baslik}</T>
        <T variant="small" color="muted">{deger}</T>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  codeBox: { marginTop: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: StyleSheet.hairlineWidth },
  input: { marginTop: Spacing.sm, minHeight: 72, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: StyleSheet.hairlineWidth, fontSize: 14, textAlignVertical: 'top' },
  satir: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
});
