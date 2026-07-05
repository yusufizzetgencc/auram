# CLAUDE.md — Auram (kod adı: Koku)

Bu dosya, Claude Code'un bu React Native projesinde çalışırken uyması gereken bağlamı, ürün mantığını ve mimari kararları içerir. Kod üzerinde çalışmaya başlamadan önce bu dosyanın tamamını dikkate al.

---

## 1. Proje Özeti

**Auram**, kullanıcının ten kimyasını (tahmini pH), yaşam tarzını ve koku tercihlerini analiz ederek kişiselleştirilmiş lüks parfüm önerileri sunan bir mobil uygulamadır. Rastgele popüler parfüm listeleyen bir uygulama değil; arka planda matematiksel bir pH tahmin motoru ve çok katmanlı bir puanlama algoritması çalıştıran, "parfümör seviyesinde" bir öneri asistanıdır.

- **Platform:** React Native
- **Ana değer önerisi:** Biyolojik/yaşamsal veriye dayalı, açıklanabilir (explainable) parfüm eşleştirme
- **Durum:** Geliştirme aşamasında, henüz yayınlanmadı

### Ürün Kişiliği
Uygulamanın tonu premium, bilimsel ama sıcak olmalı. Kullanıcıya sonuçlar sunulurken asla "işte parfümler" denmemeli; her öneri bir **gerekçeyle** (örn. "Serin ten yapınız bu yoğun parfümü nazikçe açacaktır") birlikte sunulmalı. Bu açıklanabilirlik, uygulamanın en kritik farklılaştırıcı özelliğidir ve UI/UX'te asla atlanmamalı.

---

## 2. Onboarding Akışı (Kullanıcı Profili Oluşturma)

Onboarding 4 ana kategoriden oluşur ve toplanan veriler kullanıcı profil objesinde saklanır. Her soru, algoritmadaki belirli bir hesaplamayı besler — bu yüzden soru metinleri ve seçenek yapıları değiştirilirken hangi hesaplamayı etkilediği göz önünde bulundurulmalı.

### A. Biyolojik İmza ve pH Analizi (Kritik Ten Kimyası)
| Soru | Seçenekler | Etkilediği Hesaplama |
|---|---|---|
| Cilt yapınız genellikle nasıldır? | Kuru / Karma-Normal / Yağlı | Kalıcılık (longevity) katsayısı |
| Gümüş takı kullandığınızda kararma olur mu? | Evet / Hayır / Emin değilim | Gizli pH testi — asidik/alkali eğilim |
| Günlük su tüketiminiz ne seviyede? | Az / Normal / Çok | pH dengeleyici faktör |
| Beslenme alışkanlığınızın temeli nedir? | Baharatlı-Kırmızı Et / Karbonhidrat-Hafif / Sebze-Meyve | pH eğilimi (asidik/bazik) |
| Aktivite ve terleme dengeniz nasıldır? | Hızlı-sık terleyen / Ortalama / Çok nadir-Kuru | Kalıcılık ve pH stabilitesi |
| Vücut ısınız genellikle nasıldır? | Sıcak / Serin / Dengeli | Sillage (yayılım gücü) belirleyici |

### B. Koku Reaksiyonu ve Uygulama Alışkanlığı
- Parfümler günün sonunda teninizde ne olur? (Tatlı/pudralı olur / Ekşir-başka kokuya dönüşür / Aynı kalır) — **doğrulayıcı pH sorusu**, A bölümündeki hesabı teyit eder veya düzeltir.
- Parfümü en çok nereye sıkarsınız? (Sadece tenime / Tenime ve kıyafetime / Sadece kıyafetime) — "Sadece kıyafetime" seçilirse pH uyumsuzluk riski algoritmadan **devre dışı bırakılmalı** (ten teması yok).
- Koku hassasiyetiniz ne durumda? (Çok hassasım / Normal / Düşük) — ağır kokulara ceza puanı uygulanır.

### C. Aura ve Karakter
- Arkanızda nasıl bir "iz" bırakmak istersiniz? → Temiz & Zarif / Gizemli & Derin / Çekici & Baştan Çıkarıcı / Dinamik & Enerjik / Otoriter & Saygın
- Hangi koku aileleri sizi mutlu eder? → Ferah / Çiçeksi / Tatlı / Odunsu / Aquatik / Baharatlı (çoklu seçim)
- "Kesinlikle olmasın" dediğiniz notalar? → Aşırı şekerli / Baskın çiçek / Deri-Tütün (çoklu seçim) — **kırmızı çizgi filtresi**, bu maddedeki bir eşleşme sert ceza puanı getirir.
- Parfümünüzün cinsiyet algısı önemli mi? → Feminen / Maskülen / Unisex

### D. Yaşam Dinamikleri
- Yaşamınızın büyük kısmı nerede geçiyor? → Kapalı-Ofis-Ev / Açık-Saha / Dengeli
- Giyim tarzınızı en iyi hangisi özetler? → Minimalist-Rahat / Şık-Resmi / Trendy-İddialı / Sportif

**Not:** Onboarding UI'ı adım adım (stepper/wizard) olmalı, geri dönülebilir olmalı ve ilerleme çubuğu göstermeli. Her adımda kullanıcıya neden bu soruyu sorduğumuza dair kısa bir mikro-açıklama (tooltip) gösterilmesi önerilir (örn. "Bu soru, ten pH dengenizi anlamamıza yardımcı olur").

---

## 3. Öneri Algoritması

Bu, uygulamanın çekirdek iş mantığıdır. Ayrı ve iyi test edilmiş bir modül olarak (`/src/engine` veya benzeri) izole edilmeli; UI kodundan bağımsız, saf fonksiyonlarla yazılmalı ki kolayca birim testi yazılabilsin.

### 3.1 Biyolojik pH Hesabı
Onboarding'deki A ve B bölümü cevaplarına göre tahmini bir ten pH değeri hesaplanır (örnek çıktı: `5.5`). Bu hesap kural tabanlı bir ağırlıklı puanlama olabilir (her cevap seçeneğine ±pH etkisi atanır, sonra normalize edilir 4.5–7.0 aralığına).

Sonuç yorumlaması:
- **Asidik ten (düşük pH):** Narenciye (citrus) notaları çok iyi açılır; tatlı notalar (vanilya, karamel gibi) "ekşiyebilir" / bozulabilir.
- **Bazik ten (yüksek pH):** Odunsu ve amber notalar daha sıcak ve kalıcı olur.

### 3.2 Puanlama Sistemi (100 üzerinden)
| Ağırlık | Kriter |
|---|---|
| %20 | Parfümün ten pH'ı ile kimyasal uyumu |
| %15 | Toplam Performans (Üst, Orta, Alt notaların pH ve cilt tipine göre kalıcılığı/yayılımı) |
| %15 | Seçilen koku ailesi ile eşleşme |
| %15 | Hedeflenen "Aura" etkisi ile eşleşme |
| %10 | Cinsiyet algısı tercihi |
| %10 | Vücut ısısı × yoğunluk kombinasyonu (örn. serin ten + yoğun parfüm = nazikçe açılır) |
| %10 | Yaşam/çalışma ortamı uyumu (kapalı ofis + ağır parfüm = ceza puanı) |
| %5  | Kıyafet stili uyumu |

### 3.3 Kırmızı Çizgiler (Ceza Puanları)
- Kullanıcı "aşırı şekerli olmasın" dediyse ve parfümde vanilya/karamel notası varsa → **-40 puan**, öneri listesinden pratik olarak elenir.
- Koku hassasiyeti "Çok hassasım" ise ve parfüm yoğun/ağır kategorideyse → **-15 puan**.
- Kullanıcının "kesinlikle olmasın" dediği herhangi bir nota kategorisi parfümde varsa, o kategoriye özel ceza uygulanmalı (deri/tütün, baskın çiçek vb. için de benzer mantık, şiddeti nota profiline göre ayarlanabilir).

### 3.4 Sonuç Sunumu
Sonuç ekranı sadece parfüm adı+görsel göstermemeli. Her öneri için:
1. **Eşleşme Yüzdesi** (0–100 arası, yukarıdaki puanlamadan normalize edilmiş)
2. **"Neden bu parfümü önerdik?"** açıklaması — puanlamayı besleyen 1-2 en güçlü faktörden otomatik üretilen doğal dilli bir cümle (örn. "Serin ten yapınız bu yoğun parfümü nazikçe açacaktır")

### Mimari Öneri
Algoritmayı şu şekilde modülerize et:
```
/src/engine
  ph-calculator.ts       // Onboarding cevaplarından pH tahmini
  scoring.ts             // 100 puanlık ağırlıklı skor hesabı
  penalties.ts           // Kırmızı çizgi / ceza mantığı
  explanation-generator.ts // "Neden bu parfüm" metin üretimi
  types.ts               // UserProfile, Perfume, ScoreResult tipleri
```
Bu modüller pure function olmalı (yan etkisiz), böylece Jest ile kolayca test edilebilir. Yeni bir puanlama kriteri eklerken veya ağırlıkları değiştirirken bu dosyalar dışında hiçbir yeri değiştirmeye gerek kalmamalı.

---

## 4. Diğer Özellikler (Modüller)

Her biri ayrı bir feature modülü olarak düşünülmeli (`/src/features/<modül-adı>`).

### 4.1 SOTD (Scent of the Day) & Takvim
- Günlük hangi parfümün sıkıldığını kaydetme
- Takvim görünümünde geçmiş
- Streak (seri) mantığı ve rozet/başarı sistemi

### 4.2 Layering (Katmanlama) Atölyesi
- Kullanıcının sahip olduğu parfümleri birbirine önerme
- Nota uyum kurallarına dayalı öneri mantığı (örn. hangi nota aileleri birbirini tamamlar)
- Bu da ayrı, kural tabanlı küçük bir motor olarak düşünülebilir

### 4.3 Koleksiyonlar (Collections)
- Sanal parfüm dolabı, favoriler, istek listesi
- Kullanıcı tanımlı özel klasörler (örn. "Yazlık", "Gece Kokuları")

### 4.4 Parfüm Karşılaştırma (Compare)
- İki parfümü yan yana kıyaslama: kalıcılık, sillage, pH uyumu, notalar

### 4.5 Ruh Hali (Mood) Motoru
- Anlık duygu durumuna göre öneri (Enerjik / Sakin / Odaklanmak istiyorum vb.)
- Ana öneri algoritmasının basitleştirilmiş, hızlı bir versiyonu olarak düşünülebilir

### 4.6 Hediye Asistanı (Gift)
- Başkası için parfüm bulma modu: yaş, tarz, karakter girilerek öneri
- Ana kullanıcı profili yerine geçici bir "üçüncü şahıs profili" oluşturup aynı motor üzerinden çalıştırılabilir

### 4.7 Performans Logları
- Kullanıcının satın aldığı parfümün kendisindeki gerçek performansı (kaç saat kalıcı, kaç saat yayılım) not etmesi
- Uzun vadeli istatistik takibi — bu veriler ileride algoritmayı kişiselleştirmek için geri besleme (feedback loop) olarak da kullanılabilir

### 4.8 Şans Çarkı (Spin)
- Eğlence amaçlı rastgele parfüm seçme çarkı (koleksiyondan veya öneri listesinden rastgele seçim)

---

## 5. Veri Modeli (Öneri)

```typescript
interface UserProfile {
  id: string;
  skinType: 'dry' | 'combination' | 'oily';
  silverTarnish: 'yes' | 'no' | 'unsure';
  waterIntake: 'low' | 'normal' | 'high';
  dietBase: 'spicy_red_meat' | 'carb_light' | 'veggie_fruit';
  sweatLevel: 'high' | 'average' | 'low';
  bodyTemp: 'warm' | 'cool' | 'balanced';
  scentEndOfDay: 'sweet_powdery' | 'sour_transforms' | 'unchanged';
  applicationSpot: 'skin_only' | 'skin_and_clothes' | 'clothes_only';
  sensitivity: 'high' | 'normal' | 'low';
  desiredAura: 'clean_elegant' | 'mysterious_deep' | 'seductive' | 'dynamic_energetic' | 'authoritative';
  preferredFamilies: ScentFamily[]; // çoklu seçim
  dealBreakers: DealBreaker[]; // çoklu seçim
  genderPreference: 'feminine' | 'masculine' | 'unisex';
  lifestyleEnvironment: 'indoor' | 'outdoor' | 'balanced';
  styleType: 'minimalist' | 'formal' | 'trendy' | 'sporty';

  // hesaplanan alanlar
  estimatedPh: number; // örn. 5.5
}

interface Perfume {
  id: string;
  name: string;
  brand: string;
  notes: { top: string[]; heart: string[]; base: string[] };
  family: ScentFamily[];
  intensity: 'light' | 'moderate' | 'heavy';
  sillage: 'intimate' | 'moderate' | 'strong' | 'enormous';
  longevity: 'weak' | 'moderate' | 'long_lasting' | 'eternal';
  genderProfile: 'feminine' | 'masculine' | 'unisex';
  phAffinity: 'acidic' | 'neutral' | 'alkaline'; // hangi ten pH'ında iyi açılır
}

interface ScoreResult {
  perfumeId: string;
  matchPercentage: number; // 0-100
  breakdown: {
    phCompatibility: number;
    familyMatch: number;
    auraMatch: number;
    tempGenderMatch: number;
    lifestyleMatch: number;
    penalties: number;
  };
  explanation: string; // "Neden bu parfümü önerdik?"
}
```

Bu tipleri `/src/engine/types.ts` içinde merkezi olarak tanımla; tüm feature modülleri buradan import etsin, tip tekrarından kaçın.

---

## 6. Genel Geliştirme Kuralları (Claude Code için)

- **Dil:** Kullanıcıya gösterilen tüm metinler Türkçe olmalı. Kod içi değişken/fonksiyon isimleri İngilizce kalabilir (proje genelinde tutarlı olmak kaydıyla).
- **Algoritma değişiklikleri:** `/src/engine` içindeki ağırlıklar veya ceza puanları değiştirilecekse, bunu açıkça belirt ve mümkünse ilgili birim testini de güncelle.
- **State management:** Kullanıcı profili ve koleksiyon verisi kalıcı olmalı (öneri: AsyncStorage + gerekirse ileride bir backend senkronizasyonu). Bu proje henüz backend'e bağlanmamışsa, yerel depolama katmanını soyutlayarak (`/src/storage`) ileride API'ye geçişi kolaylaştır.
- **Test:** Öneri motoru (`/src/engine`) için Jest testleri yazılması önceliklidir — bu proje puanlama mantığına dayalı olduğu için sessiz hatalar (silent bugs) kullanıcı deneyimini doğrudan bozar.
- **Yeni özellik eklerken:** Önce bu dosyayı (CLAUDE.md) güncel tut, sonra kodu yaz. Özellik listesi ile kod tabanının senkron kalması önemli.
- **UI/UX tonu:** Premium, sakin, bilgilendirici. Aşırı oyunlaştırma (gamification) sadece SOTD/streak ve Şans Çarkı gibi eğlence odaklı modüllerde kullanılmalı; öneri sonuçları ciddi ve güven verici bir dille sunulmalı.

---

## 7. Henüz Netleşmemiş / Karar Bekleyen Noktalar

Bu bölümü proje ilerledikçe güncelle. Şu an için:
- Parfüm veritabanı kaynağı (manuel curation mı, dış API mi?) belirlenmedi.
- Backend/senkronizasyon planı yok (şu an local-first görünüyor).
- Görsel/marka varlıkları (parfüm fotoğrafları) için telif durumu netleştirilmeli.



## 8.Reklam Admob
Apple id:
ca-app-pub-1731461024871182~9770094099 

Andorid id:
ca-app-pub-1731461024871182~1620940090

Rewarded Ad Unit ID (Reklam Birimi Kimliği) kodundur.
ca-app-pub-1731461024871182/1891604076

