# CLAUDE.md — Teninde

> Kullanıcıya dönük özellik listesi: **`OZELLIKLER.md`** (yeni özellik eklendiğinde orayı da güncelle).

Bu dosya, Claude Code'un bu React Native projesinde çalışırken uyması gereken bağlamı, ürün mantığını ve mimari kararları içerir. Kod üzerinde çalışmaya başlamadan önce bu dosyanın tamamını dikkate al.

---

## 1. Proje Özeti

> Uygulama 2026-11'de **Auram**'dan **Teninde**'ye yeniden adlandırıldı. Bundle ID `com.teninde.app`; eski `com.auram.app` mağaza kaydı ve `auram_*` abonelik ürünleri artık kullanılmıyor.

**Teninde**, kullanıcının ten kimyasını (tahmini pH), yaşam tarzını ve koku tercihlerini analiz ederek kişiselleştirilmiş lüks parfüm önerileri sunan bir mobil uygulamadır. Rastgele popüler parfüm listeleyen bir uygulama değil; arka planda matematiksel bir pH tahmin motoru ve çok katmanlı bir puanlama algoritması çalıştıran, "parfümör seviyesinde" bir öneri asistanıdır.

- **Platform:** React Native
- **Ana değer önerisi:** Biyolojik/yaşamsal veriye dayalı, açıklanabilir (explainable) parfüm eşleştirme
- **Durum:** Geliştirme aşamasında, henüz yayınlanmadı

### Ürün Kişiliği
Uygulamanın tonu premium, bilimsel ama sıcak olmalı. Kullanıcıya sonuçlar sunulurken asla "işte parfümler" denmemeli; her öneri bir **gerekçeyle** (örn. "Serin ten yapınız bu yoğun parfümü nazikçe açacaktır") birlikte sunulmalı. Bu açıklanabilirlik, uygulamanın en kritik farklılaştırıcı özelliğidir ve UI/UX'te asla atlanmamalı.

---

## 2. Onboarding Akışı (Kullanıcı Profili Oluşturma)

Sorular **`constants/questions.ts`** içinde tek yerde tanımlıdır (`QUESTIONS`); `app/onboarding.tsx` yalnızca akışı yönetir. Her sorunun `why` alanı kullanıcıya "Neden soruyoruz?" olarak gösterilir. Otomatik ilerleme yoktur: seçenek yalnızca işaretlenir, kullanıcı alttaki **Devam** butonuyla ilerler (cevaplanmadan pasif; isteğe bağlı sorularda "Atla" da görünür). Profil → "Güncelle" testi önceki cevaplar dolu olarak yeniden açar.

**Kalıcı profil + arama bağlamı (2026-11):** Profil iki katmandır. *Kalıcı profil* (ten, zevk, kırmızı çizgiler, bütçe, hassasiyet, cinsiyet) onboarding'de bir kez sorulur ve öğrenen motorla keskinleşir. *Arama bağlamı* (mevsim, kullanım amacı, ortam, yoğunluk) duruma göre değişir: **mevsim sorulmaz**, bugünün tarihinden gelir (`mevsimOf`; eski kayıtlı `preferences.mevsim` yok sayılır); amaç/ortam/yoğunluk onboarding'de varsayılan olarak sorulur ama `SearchContextBar` ("Şu an ne arıyorsunuz?", Sonuç ekranı + Keşfet'te "Size göre" sıralamada) ile oturumluk değiştirilir, "Varsayılanım yap" ile profile yazılır, "Profilime dön" ile sıfırlanır. **Puanlama yapan her ekran `useApp().etkinPrefs` kullanır** (`etkinTercihler(preferences, aramaBaglami)`), `preferences`'ı doğrudan skorlamaya verme; pH ve zevk `preferences`'tan hesaplanmaya devam eder. Profil → Tercihleriniz satırları `QuestionSheet` ile tek soruyu düzenler (testi baştan yapmadan). Günün seçimi/widget/bildirim kendi tarih bağlamını kullanır.

**Tek seferde tam akış (2026-11 kararı):** 9 soruluk kısa akış denendi (`temel: true` soruları; simülasyonda tam anketin ilk 5 önerisinin %77'sini koruyordu) ama ürün sahibi uygulamayı "eksik" hissettirdiği için geri alındı: ilk açılışta tüm sorular tek seferde sorulur (`onboardingSorulari(p, 'tam')`). Kalanlar: `?mod=tamamla` yalnızca boş alanları sorar (eski sürümden gelen kullanıcı); `ProfileCompletionCard` yalnızca Profil'de ve yalnızca eksik alan varsa görünür; `ContextQuestion` (Bugün "nereye sıkıyorsunuz", Günlük "ne kadar kalıyor") yalnızca alan boşsa çıkar. "Atla" denen isteğe bağlı sorular `atlananSorular`'a yazılır. Analitik: `onboarding_step` (yalnızca soru kimliği + sıra). Öneri listesi canlıdır: `AppContext` tercih veya öğrenen motor (`zevk`) değişince `recommendations`'ı yeniden hesaplar. 4 bölüm:

| Bölüm | Soru (id) | Alan | Etkisi |
|---|---|---|---|
| Tanışalım | isim (isteğe bağlı) | `userName` | Kişisel hitap |
| Teniniz | ph_bilgi / ph_deger (koşullu) | `phInfo` | Ölçülmüş pH tahminin yerine geçer |
| | cilt — "Sabah yüzünüzü yıkadıktan sonra öğlene kadar alnınız nasıl olur?" | `ciltTipi` | Yağlılık ekseni → kalıcılık; pH ±0.1–0.15 |
| | gozlenen_kalicilik — "Parfümler sizde ne kadar kalıyor?" | `gozlenenKalicilik` | Kalıcılık endeksine −18…+16 |
| | reaksiyon — "Akşama doğru teninizde nasıl kokuyor?" (+ "Hiç dikkat etmedim") | `parfumReaksiyonu` | pH −0.15/+0.10, güven |
| | terleme | `terlemeOrani` | Isı ekseni, pH +0.1 |
| | isi | `vucutIsisi` | Isı × yoğunluk (%10) |
| | gumus (isteğe bağlı) | `gumusOksitlenme` | pH ±0.05 |
| Kullanımınız | uygulama | `uygulamaYeri` | "Sadece kıyafet" → pH kriteri devre dışı |
| | amac (çoklu, isteğe bağlı) | `kullanimAmaci` | %5 |
| | ortam | `ortam` | %5 |
| | ~~mevsim~~ (sorulmaz) | `mevsim` | %10 — bugünün tarihinden otomatik; "Şu an ne arıyorsunuz?" ile değiştirilir |
| | yogunluk (tene yakın / dengeli / güçlü / fark etmez) | `konsantrasyonTercihi` | %5 (EdC/EdT/Fraîche tek grup) |
| | hassasiyet | `kokuAlmaHassasiyeti` | Yoğun parfüme −7/−15 |
| | butce | `butceTercihi` | %2 + her kademe aşım için −6 |
| Zevkiniz | aura | `aura` | %15 |
| | aileler (en fazla 4, 12 aile) | `kokuTipleri` | %15 |
| | sevilenler (isteğe bağlı, en fazla 5 parfüm, `PerfumePicker`) | `sevilenParfumler` | Kişisel zevk düzeltmesi (+10'a kadar); bunlar tekrar önerilmez |
| | kacin (çoklu) — şekerli, baskın çiçek, deri/tütün, yoğun baharat, oud/reçine | `kacinilacakNotalar` | Kırmızı çizgi (listeden çıkarır) |
| | cinsiyet (feminen/maskülen/unisex/fark etmez) | `cinsiyetAlgisi` | Filtre + %3 |

> Kaldırılanlar: su tüketimi, beslenme (kanıt yok), giyim tarzı (etkisi %2'den azdı; yerine bütçe geldi). Tipler geriye dönük uyumluluk için duruyor.

---

## 3. Öneri Algoritması

Bu, uygulamanın çekirdek iş mantığıdır. Ayrı ve iyi test edilmiş bir modül olarak (`/src/engine` veya benzeri) izole edilmeli; UI kodundan bağımsız, saf fonksiyonlarla yazılmalı ki kolayca birim testi yazılabilsin.

### 3.1 Ten Profili ve pH Eğilimi (`engine/ph-calculator.ts`)
**Uygulama pH ÖLÇMEZ; tahmin eder.** UI'da asla tek ondalıklı kesin değer gibi sunulmaz, aralık olarak gösterilir (`~4.8–5.3`) ve "tahmin" ibaresi taşır. Kullanıcı test şeridiyle ölçtüyse girilen değer kullanılır.

- Başlangıç **5.0** (günlük yıkama sonrası tipik ölçüm; doğal değer ortalama ~4.7 — Lambers ve ark. 2006). Sınırlar 4.3–6.0.
- Katsayılar küçük ve literatür yönündedir: kuru +0.15, yağlı −0.10, çok terleme +0.10, gümüş ±0.05, parfüm gözlemi (ekşir −0.15 / tatlanır +0.10).
- Belirsizlik: ±0.45'ten başlar, bilgi veren her cevap 0.05 daraltır (min ±0.25). Güven skoru anket için en fazla %75.
- Eşikler: `< 4.85` asidik eğilim, `> 5.25` "nötre yakın" (kullanıcıya "bazik ten" denmez).
- Çıktıda ayrıca `tenProfili` döner: yağlılık, ısı, asidite eğilimi (−1…+1), kalıcılık ve yayılım endeksleri. Parfüm performansını asıl belirleyen eksenler yağlılık ve ısıdır.
- `getEffectivePH(preferences)` pH'ı her çağrıda cevaplardan yeniden hesaplar; kayıtlı `tahminiDeger`'e güvenilmez (ilk öneri listesinin pH'ı yok sayması hatası buradan çıkmıştı).

Parfüm tarafı (`engine/perfume-chemistry.ts`): parfüm başına elle pH yazılmaz. Notalar gruplara ayrılır (narenciye, tatlı, odunsu/amber, çiçek, ferah, baharat, misk; katman ağırlığı üst 0.6 / orta 0.8 / alt 1.0) ve `idealPH` bunlardan türetilir. `zenginlestirParfum()` uygulama açılışında `phUyumu` ve `notaKalicilik` alanlarını doldurur.
- **Asidik eğilim:** Narenciye notaları canlı açılır; yoğun tatlılar keskinleşebilir.
- **Nötre yakın:** Odunsu ve amber alt notalar sıcak ve dolgun kalır.

### 3.2 Puanlama Sistemi (100 üzerinden — `engine/scoring.ts` → `AGIRLIKLAR`)
| Ağırlık | Kriter |
|---|---|
| %20 | Ten performansı (yağlılık/ısı × üst-orta-alt nota kalıcılığı) |
| %10 | pH / asidite eğilimi × nota yapısı (kanıtı zayıf olduğu için düşürüldü) |
| %15 | Seçilen koku ailesi ile eşleşme |
| %15 | Hedeflenen "Aura" etkisi ile eşleşme |
| %10 | Mevsim uyumu |
| %10 | Vücut ısısı × yoğunluk (örn. serin ten + yoğun parfüm = nazikçe açılır) |
| %5  | Konsantrasyon uyumu |
| %5  | Kullanım amacı uyumu |
| %5  | Yaşam/çalışma ortamı (kapalı ortam + yoğun parfüm = 0 puan) |
| %3  | Cinsiyet algısı (maskülen/feminen tercihi ayrıca **filtredir**: karşı profil önerilmez) |
| %2  | Bütçe (bütçe üstü her kademe için ayrıca −6) |

Kullanıcının boş bıraktığı kriterler tüm parfümlere aynı nötr krediyi verir (`NOTR_KREDI = 0.6`), böylece yüzdeler şişmez/çökmez.

**Kişisel zevk düzeltmesi (`engine/similarity.ts`)** — AGIRLIKLAR'ın dışında, üstüne eklenir:
- `preferences.sevilenParfumler` / `sevilmeyenParfumler` (onboarding "sevilenler" sorusu, detay sayfasındaki "Sevdim/Sevmedim", Mağaza modu).
- Benzerlik = %50 katman ağırlıklı ortak nota (Jaccard) + %30 aile + %10 yoğunluk + %10 profil (0–1).
- En yakın sevilen ≥0.35 benzerse +10'a kadar puan ve "Sevdiğiniz X ile benzer…" gerekçesi; en yakın sevilmeyen ≥0.35 benzerse −12'ye kadar ve "Zevkiniz" uyarısı.
- `getRecommendationsPure` denenmiş (sevilen/sevilmeyen) parfümleri yeni öneri olarak göstermez.
- `skorlaParfum(p, prefs, ph, zevk?)` dördüncü parametreyi alan her ekran (Keşfet, detay, karşılaştır) zevki yansıtır.
- Benzerlik bir "muadil" iddiası değildir; arayüzde böyle sunulmaz.

**Öğrenen motor (`engine/learning.ts`)** — uygulama her kullanıcının kendi davranışından öğrenir; AGIRLIKLAR'ın dışında, üstüne eklenir:
- Sinyaller (yarı ömür 60 gün): Sevdim +2.5 / Sevmedim −2.5, dolapta +2, favori +1, günün kokusu +1 (etkinlikle), akşam puanı −2…+2, iltifat +1, "Başka" ile geçme −0.4 (`LEARNING` deposu).
- Öğrenilenler: aile ve nota yatkınlığı, **ten kalibrasyonu** (akşam kalıcılık kaydı − motorun tahmini, aile başına en az 2 kayıt, az kayıtta sıfıra çekilir), etkinliğe göre aile tercihi, iltifat/yüksek puan alan parfümler.
- Etki (`ogrenmeDuzeltmesi`): zevk ±9, ten ±5, bağlam ±3, iltifat benzerliği +3; toplam **±15** (`OGRENME_MAX`). Güven n/(n+10) ile ölçeklenir. Ten kalibrasyonu gerekçesi `ten: true` olarak ilk sıraya çıkabilir; kısa kalma "Kayıtlarınız" uyarısıdır.
- Model `AppContext` içinde kurulur ve `zevk` (ZevkBaglami.ogrenme) ile tüm ekranlara geçer; ekranlarda `zevkBaglami(...)` yeniden kurma, `useApp().zevk` kullan. `gununSecimi` etkinliği bağlama ekler.
- `/learned` "Sizden öğrendiklerim": tespitler (en az 3 kayıt) + "Bu doğru değil" (reddedilen kimlikler etkiyi tamamen kaldırır) + "Geri getir".

### 3.3 Kırmızı Çizgiler (`engine/penalties.ts`)
- Kategoriler: Aşırı şekerli (vanilya, karamel, pralin, tonka, bal…), Baskın çiçek, Deri veya tütün, Yoğun baharat, Oud ve reçine.
- Ceza notanın katmanına göre: üst **-20**, orta **-28**, alt **-35**; her ek kategori **-10**, en fazla **-50**.
- Kırmızı çizgiye takılan parfüm, en az 5 temiz alternatif varsa **listeden tamamen çıkarılır**.
- Koku hassasiyeti + yoğun parfüm: "Çok hassasım" **-15**, "Hassasım" **-7**.
- Nota eşleşmesi kelime başıyla yapılır (Türkçe ekler: "vanilyası", "gülü"); `=` önekli anahtar tam kelime ister (`=bal` → "balsam"ı yakalamaz).

### 3.4 Sonuç Sunumu
Sonuç ekranı sadece parfüm adı+görsel göstermemeli. Her öneri için:
1. **Eşleşme Yüzdesi** (0–100 arası, yukarıdaki puanlamadan normalize edilmiş)
2. **"Neden bu parfümü önerdik?"** açıklaması — puanlamayı besleyen 1-2 en güçlü faktörden otomatik üretilen doğal dilli bir cümle (örn. "Serin ten yapınız bu yoğun parfümü nazikçe açacaktır"). İlk gerekçe, varsa, her zaman **ten kaynaklı** olandır (uygulamanın asıl farkı).
3. **Koku Kimliği kartı** (`components/results/ScentIdentityCard.tsx`): aura + ten profili + en iyi eşleşme, 4:5 oranında görüntü olarak paylaşılır (`react-native-view-shot` + `expo-sharing`).

### Mimari
```
/engine
  index.ts               // Tek giriş noktası (re-export) + buildTemporaryProfile
  ph-calculator.ts       // Ten profili & pH eğilimi tahmini
  perfume-chemistry.ts   // Nota grupları, idealPH, ten performansı, zenginlestirParfum
  penalties.ts           // Kırmızı çizgi / hassasiyet cezaları
  scoring.ts             // AGIRLIKLAR, skorlaParfum, getRecommendationsPure, gerekçeler
  layering.ts            // Katmanlama: 12 ailenin tamamı için uyum tablosu + puan
  similarity.ts          // benzerlik(), benzerParfumler() ("benzerleri", "daha uygun benzerleri"), zevkBaglami/zevkDuzeltmesi
  streak.ts              // seriGuncelle (haftada 1 koruma hakkı, pazartesi yenilenir), seriDurumu
  daily.ts               // gununSecimi: GUNLUK_AGIRLIK ten .40 / etkinlik .25 / hava .20 / çeşitlilik .15; ETKINLIK_ETIKET
  insights.ts            // kokuHafizasi, aylikRapor, zevkNetligi (koku hafızası / aylık rapor)
  wardrobe.ts            // dolapAnalizi: mevsim, gündüz/akşam, eksikler, siradakiAlim
  advisor.ts             // Koku Danışmanı: soruyuAyristir (Türkçe niyet: kendim/hediye/benzer/parfum/karsilastir/bilgi/ben) + danismanCevabi; sohbet hafızası (durum → onceki, niyetiBirlestir), kişisel cümleler (öğrenen motor, dolap, son kullanım, hava), kart notları birbirini tekrarlamaz
  friend.ts              // Arkadaş uyumu: profilKodu/kodCoz ("TEN1-"+base64url), kokuUyumu
  context.ts             // Arama bağlamı: etkinTercihler(profil, bağlam, tarih) — mevsim otomatik, amaç/ortam/yoğunluk geçici
/types/index.ts          // Tüm tipler (Parfum, UserPreferences, TenProfili…)
/__tests__/engine.test.ts
```
`AppContext.getRecommendations` yalnızca `getRecommendationsPure`'u çağırır; puanlama mantığı context'e yazılmaz.
Bu modüller pure function olmalı (yan etkisiz), böylece Jest ile kolayca test edilebilir. Yeni bir puanlama kriteri eklerken veya ağırlıkları değiştirirken bu dosyalar dışında hiçbir yeri değiştirmeye gerek kalmamalı.

---

## 4. Ekranlar ve Arayüz

### 4.1 Tasarım sistemi (`constants/theme.ts` + `components/kit`)
- Krem zemin `#F7F3EE`, mürekkep metin `#1E1B18`, **tek vurgu** amber `#A8642A` (koyu temada karşılıkları var). Gölge yok, ince kenarlık; kart yarıçapı 20; 8 pt ızgara.
- Tipografi: başlıklar **Manrope** (700/600), metin **Inter**. Tip ölçeği `Type` (hero, h1, h2, h3, body, small, overline…). Ekranlarda serbest `fontSize`/hex renk yazma.
- Ortak bileşenler `components/kit`: `T`, `Screen`, `Header`, `PageTitle`, `Button`, `IconButton`, `Card`, `Section`, `Chip`, `Tag`, `ListRow`, `OptionCard`, `Segmented`, `Stat`, `EmptyState`, `ProgressLine`; parfüm: `Bottle` (fotoğraf yerine SVG soyut şişe — telif; gövde şekli aileden, kapak/oran kimlikten, sıvı rengi ailelerden, koyuluğu konsantrasyondan; niş markalarda yassı kapak), `PerfumeRow`, `PerfumeTile`, `MatchBadge`; `PerfumePicker` (aranabilir seçici); `SkinProfileCard`; marka: `Monogram`, `Wordmark`.
- Emoji kullanılmaz; ince çizgi ikon (Ionicons outline).
- **Logo (2026-11):** işaret = amber damla + altında hafif kemerli ince "ten" çizgisi (uygulama simgesi); yazı = Manrope SemiBold "teninde", noktasız ı'nın noktası işaretin küçüğü. Tek kaynak `scripts/build_brand.py`: simge/Android katmanları/açılış/favicon PNG'leri, `assets/brand/*.svg` ve `constants/brandPaths.ts` (Monogram ve Wordmark bunu kullanır; elle düzenlenmez). Değiştirirsen scripti çalıştır, ardından `npx expo prebuild --clean` (simge ve açılış yerel projeye o zaman girer). Widget'taki işaret `MarkaIsareti` (SwiftUI) aynı geometriyi çizer. Önceki konseptler `assets/brand/concepts/`.

### 4.2 Ekran haritası
| Rota | Ekran |
|---|---|
| `/welcome` | 3 sayfalık tanıtım |
| `/onboarding` | Profil soruları (Bölüm 2) |
| `/ad-loading` | Analiz adımları + ödüllü reklam (premium atlar) |
| `/results` | Ten profili, en iyi eşleşme vitrini, diğer 4 öneri (ücretsizde kilitli), koku kimliği paylaşımı |
| `(tabs)/index` **Bugün** | Sade akış, ilk ekranda tek karar: "Bugün ne var?" çipleri (yalnızca bugün kayıt yokken), dolabınızdan günün seçimi (`gununSecimi`; "Başka" geçilenleri kimlikle tutar ve öğrenen motora bildirir) ya da "Bugünün kokusu" kartı, tek kartta seri + koruma hakkı + bu ayın özeti, keşfetmeye değer, bağlama göre en fazla 4 araç (`onerilenAraclar`) + "Tümü", son bakılanlar |
| `(tabs)/parfums` **Keşfet** | Arama + filtre düğmesi, tek satır aile çipleri, 2 sütunlu ızgara; alttan açılan panelde sıralama (Size göre/A–Z/Fiyat), marka (aranabilir, çoklu), aile, profil, yoğunluk, fiyat |
| `(tabs)/favorites` **Koleksiyon** | Dolabım (varsayılan) / Favori / Listeler (`?sekme=`); her sekmede vitrin (`components/collection/Showcase`: raf + aile dağılımı + özet) ve 2 sütunlu ızgara, listeler albüm kapağı, kesik çizgili "ekle" kutusu |
| `(tabs)/profile` **Profil** | Yalnızca "siz": ten profili, zevkiniz (netlik, sevdikleriniz, Sizden öğrendiklerim), tercihler, kısa istatistik. Sağ üstteki dişli → `/settings` |
| `/parfum/[id]` | Sabit üst bar (geri · kaydırınca parfüm adı · favori · "⋯" menüsü) · uyum + en güçlü 2 gerekçe + TEK ana eylem (dolapta değilse "Dolabıma ekle", dolaptaysa "Bugün bunu sıktım") ve "⋯" menüsü (karşılaştır, mağaza listesi, koleksiyon, paylaş, dolap ayrıntısı), "Denediniz mi?" tek satır, nota piramidi tek kart, "Karakter ve performans" ile "Nereden alınır?" açılır-kapanır, benzerleri sekmeli tek liste (En benzer / Daha uygun fiyatlı) |
| `/compare` | Seçim + karşılaştırma tek ekranda (`?a=` ile ön seçim) |
| `/diary` | **Koku Günlüğü** — eski Takvim + Günlük + Performans birleşti: bugün, akşam değerlendirmesi, takvim, ay özeti, "sizde en uzun kalanlar" |
| `/layering`, `/gift`, `/mood`, `/spin` | Araçlar; hepsi ana motoru kullanır |
| `/science` | Bilim ve yöntem: pH tahmininin sınırları, ağırlıklar, kaynaklar |
| `/similar` | **Benzerini bul**: bir parfüm seç → en benzerleri + daha uygun benzerleri (ilk `FREE_SIMILAR_COUNT` ücretsiz) |
| `/store` | **Mağaza modu**: denenecekler listesi (`TRY_LIST`), denendi işareti, sevdim/sevmedim, deneme rehberi |
| `/advisor` | **Koku Danışmanı**: sohbet; yerel kural tabanlı motor, `EXPO_PUBLIC_ADVISOR_URL` tanımlıysa sunucu modeli (anahtar sunucuda kalır, katalog dışı id süzülür, hata olursa yerele düşer). İlk `FREE_ADVISOR_COUNT` soru ücretsiz |
| `/report` | **Koku hafızası / aylık rapor** (`?yil=&ay=`); Premium ayrıntılar + 9:16 hikâye kartı (`components/report/ReportCard.tsx`) |
| `/friend` | **Arkadaşımla koku uyumu** (`?kod=` ile bağlantıdan açılır); kodlar cihazda (`FRIENDS`) |
| `/tools` | Tüm araçlar, gruplu (Her gün / Keşfet ve karşılaştır / Alışveriş, hediye, arkadaşlar) |
| `/settings` | Ayarlar: bildirimler, üyelik, bilim ve yöntem, destek ve yasal, veri (anonim analitik, yedek, geri yükleme, silme), geliştirici |
| `/learned` | **Sizden öğrendiklerim**: öğrenme düzeyi, tespitler (ten / zevk / alışkanlık / iyi sonuç verenler), "Bu doğru değil", nasıl eğitilir |
| `/notifications` | Bildirim ayarları: ana anahtar, tür anahtarları, sabah saati, planlananlar, deneme bildirimi |

Araç listesi `constants/tools.ts` içinde tek yerde tanımlı (`grup` alanıyla). Bugün ekranı `onerilenAraclar()` ile bağlama göre en fazla 4 araç gösterir; hepsi `/tools` ekranında gruplu. Yeni ekranlarda kalabalıktan kaçın: bir ekranda tek ana eylem, ikincil eylemler "⋯" menüsünde, ayrıntılar açılır-kapanır.

### 4.3 Servisler
- `services/weather.ts`: Open-Meteo (anahtarsız). Veri alınamazsa **null** — uydurma hava verisi gösterilmez. Ticari yayında ücretli plana geçilmeli.
- `services/dailyRecommendation.ts`: ana motoru bugünün mevsimi ve saatiyle çalıştırır, tarih tohumlu döndürme yapar.
- `services/notifications.ts`: sabah hatırlatıcısı (profilden açılır) + günün kokusu seçilince o akşam 20:00 tek seferlik değerlendirme.
- `constants/legal.ts`: gizlilik/koşullar/destek bağlantıları tek noktada.
- `constants/shopping.ts`: mağaza arama bağlantıları (`STORES`, satış ortaklığı parametresi `affiliate` alanına), numune araması, **yaklaşık** fiyat kademeleri (`FIYAT_KADEMESI`). Ürün URL'si tutulmaz (kırık bağlantı olmaz).
- `constants/noteGlossary.ts`: nota sözlüğü (`notaAciklamasi`). Katalogda yeni, tanıdık olmayan bir nota eklenirse buraya da açıklama ekle.
- `services/notificationPlan.ts` (SAF, test edilir) + `services/notifications.ts` + `components/NotificationSync.tsx`: **yerel bildirim sistemi** (push/sunucu yok). Plan her açılışta ve veri değişince baştan kurulur; tüm kimlikler `teninde_` önekli (yalnızca onlar silinip yeniden kurulur). Türler: sabah (7 gün, saat 08–21 arasına sıkıştırılır, dolaptan isimli seçim), akşam 20:00, seri 21:00, haftalık pazar 19:00, aylık ayın 1'i 10:00, azalan (şişe ≤%15, anında, bir kez — `azalanBildirildi`). Sessiz saat 22–08. Dokununca `data.url` ile ekran açılır. Ücretsiz deneme hatırlatması `abonelik_deneme_hatirlatma` kimliğiyle ayrıdır (plan yenilenirken silinmez).
- `services/analytics.ts`: anonim PostHog (`EXPO_PUBLIC_POSTHOG_KEY`, isteğe bağlı `EXPO_PUBLIC_POSTHOG_HOST`). Anahtar yoksa hiçbir şey gönderilmez; anonim id, `$process_person_profile:false`, kullanıcı Profil → Veri'den kapatabilir. Olaylara isim, cevap ya da parfüm listesi KOYMA; yalnızca sayım/kategori.
- `services/widgetPlan.ts` (SAF) + `services/widget.ts` + `targets/widget/` (SwiftUI, `@bacons/apple-targets`): iOS widget. Veri App Group `group.com.teninde.app` içine `teninde_widget` JSON'u olarak yazılır (7 günün seçimi önceden); Bugün ekranı gösterdiği öneriyi `setWidgetTodayPick` ile bildirir. `targets/widget/expo-target.config.js` veya `app.json` değişirse `npx expo prebuild --clean` gerekir (CocoaPods için `LANG=en_US.UTF-8`). Widget renkleri Swift içinde tanımlı (`renk(açık, koyu)`); bu eklenti sürümünde `colors` ile üretilen colorset'ler boş çıktığı için asset kataloğu kullanılmaz. Bildirim verisinde `zaman` (ms) tutulur; planlananlar listesi tarihi buradan okur.
- `services/storage.ts`: `getTryList/saveTryList` (Mağaza modu), `loadWardrobe/saveWardrobe` (Dolabım), `loadTodayPlan/saveTodayPlan`, `loadFriends/saveFriends`, `exportBackup/importBackup` (yedek metni; abonelik önbelleği ve ücretsiz sayaçlar dahil edilmez). Geri yüklemeden sonra `AppContext.reloadFromStorage()` çağrılır.

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
- Parfüm veritabanı: 195 gerçek parfümlük elle küratörlü katalog (2026-11'de iki genişletme: önce 45 — Sauvage Elixir, Hypnotic Poison, Angels' Share…; sonra 36 — MYSLF, Le Beau, Man in Black, Coco Noir, Gabrielle, La Petite Robe Noire, Alien Goddess, Bubble Bath, Carnal Flower, Guidance, Greenley, Alexandria II, Ege…) (niş ve yerli markalar dahil: Amouage, Frédéric Malle, Serge Lutens, Memo, Penhaligon's, Tiziana Terenzi, Nishane, Atelier Rebul, Eyüp Sabri Tuncer…) `scripts/build_parfumler.py` içinde; marka bazında `nis` (NIS kümesi) ve `mensei` (MENSEI sözlüğü, varsayılan FR) alanları üretilir, `mensei: 'TR'` markalarda marka adı Türkçe büyük harfle yazılır (`brandCaps`). Bargello ve MAD ürünleri kendi kodlarıyla ("No. 122", "B103") eklendi; notaları perakende açıklamalarından alındı, resmi piramit yayımlanmadığı için doğrulanmamış kalır. Bu ürünler için arayüzde başka bir parfümün "muadili" olduğu YAZILMAZ (marka hakkı riski); `python3 scripts/build_parfumler.py` ile `data/parfumler.json` yeniden üretilir. **Doğrulama (2026-11):** 195 parfümün tamamı tarandı; 97'sinin notaları markanın kendi ürün sayfasıyla teyit edilip `KAYNAK`'a işlendi (gerekenler düzeltildi, örn. Le Male, Fahrenheit, J'adore, L'Interdit, Montblanc Legend, Tam Dao). Kalan kayıtlarda marka sayfası nota yayımlamıyor veya bulunamadı (Bleu de Chanel, Creed çoğu, Tom Ford, Byredo, Le Labo, Nishane, Xerjoff, Bargello, MAD…); bunlar tutarlı perakendeci listesine göre kontrol edildi. Kural: yalnızca markanın kendi sayfası notaları teyit ediyorsa "doğrulandı"; perakendeci listeleri (Sephora, Harrods…) doğrulama sayılmaz, bu kayıtlar tutarlı perakendeci listesine göre düzeltilir ama `dogrulandi: false` kalır. Bazı markalar (Hugo Boss, Davidoff, Gucci, Tom Ford EDP, Byredo, Le Labo, Xerjoff…) sayfalarında nota yayımlamıyor. Formül değişen parfümlerde güncel formül esas alınır (ör. Azzaro Chrome 3 notalı yeni sürüm). Diğer kayıtlar doğrulanan kaydın resmi URL'si scriptteki `KAYNAK` sözlüğüne eklenir, arayüz buna göre "doğrulandı" der. Katalog bütünlüğü Jest ile test edilir. Kimlikler `p001…` biçiminde ve **sıradan** üretilir: yeni parfümler listenin SONUNA eklenir, araya ekleme/silme yapılmaz (favori, dolap, günlük kayıtları kimliğe bağlı). Yeni ve tanıdık olmayan notalar `constants/noteGlossary.ts`'e eklenir; eski kurgusal kataloğa (`1`–`200`) ait favori/SOTD kayıtları eşleşmez ve sessizce atlanır.
- `app/_layout.tsx` yazı tipleri yüklenmeden navigasyonu çizmez (splash açık kalır). Kaldırma: metinler yedek fontla ölçülüp önbelleğe alınıyor, font gelince son harfler kırpılıyordu (bildirim/bağlantıyla soğuk açılışta).
- Tarih anahtarları `utils/date.ts → toLocalDateKey()` ile yerel saatle üretilir (UTC kullanma — Türkiye'de gece yarısı kayıtları önceki güne düşüyordu).
- Tasarım: başlıklar Manrope, gövde Inter (`constants/theme.ts → FontFamilies`, `interFor`). Yeni ekranlarda sabit hex renk yerine tema token'ı kullan; emoji yerine ince çizgi ikon.
- Backend/senkronizasyon planı yok (şu an local-first görünüyor).
- Görsel/marka varlıkları (parfüm fotoğrafları) için telif durumu netleştirilmeli.
- Yeni bundle ID (`com.teninde.app`) için: App Store Connect'te yeni uygulama kaydı, `eas init` (eski EAS projectId ve ascAppId kaldırıldı), RevenueCat'te yeni iOS app + yeni API key (`.env`), yeni abonelik ürünleri. Bkz. Bölüm 9.5.
- Gizlilik/destek sayfaları GitHub Pages adresi (`constants/legal.ts`) depo adına bağlıdır; depo yeniden adlandırılırsa güncelle.



## 8.Reklam Admob
Apple id:
ca-app-pub-1731461024871182~9770094099 

Andorid id:
ca-app-pub-1731461024871182~1620940090

Rewarded Ad Unit ID (Reklam Birimi Kimliği) kodundur.
ca-app-pub-1731461024871182/1891604076

---

## 9. Abonelik Sistemi (RevenueCat + Paywall)

Uygulamada AdMob rewarded reklamın yanında ikinci bir gelir kanalı olarak **RevenueCat üzerinden StoreKit/Google Play Billing aboneliği** entegre edilmiştir. Fiyatlandırma (haftalık/aylık/yıllık, deneme süresi) App Store Connect / Play Console tarafında yönetilir; kodda hiçbir fiyat sabitlenmez.

**Kritik kural:** Uygulama içi dijital özellik satışı yalnızca Apple/Google'ın kendi ödeme sistemleri üzerinden yapılabilir (App Store Review politikası). Başka bir ödeme sağlayıcısı (örn. Param, Iyzico) bu amaçla **asla kullanılamaz** — App Store'dan ret/kaldırılma riski taşır.

### 9.1 Mimari
```
services/subscriptionService.ts   // RevenueCat SDK sarmalayıcı (Expo Go'da güvenli no-op fallback)
context/SubscriptionContext.tsx   // isPremium state, offline cache, satın alma/restore
hooks/use-premium-gate.ts         // requirePremium() + paywallVisible state yönetimi
components/paywall/
  PaywallScreen.tsx                // Paket seçimi + avantaj listesi + satın alma UI
  LockedFeatureOverlay.tsx         // Bulanıklaştırılmış içerik + kilit CTA'sı
constants/premiumLimits.ts        // Tüm ücretsiz kullanım limitleri tek noktadan
```
- `SubscriptionProvider`, `app/_layout.tsx` içinde `AppProvider`'ın içine sarılıdır; `AppContext` kasıtlı olarak abonelik durumundan habersizdir (ayrım korunmalı — yeni bir feature eklerken `AppContext`'e `isPremium` sızdırma, gating her zaman ekran/component seviyesinde `usePremiumGate()` ile yapılmalı).
- RevenueCat API key'leri `services/subscriptionService.ts` içinde yer tutucudur (`REVENUECAT_API_KEYS`). Gerçek key'ler girilmeden abonelik özellikleri sessizce devre dışı kalır (uygulama çökmez, `isPremium` her zaman `false` döner).

### 9.2 Ücretsiz Kullanım Limitleri (`constants/premiumLimits.ts`)
| Sabit | Değer | Anlamı |
|---|---|---|
| `FREE_RESULT_COUNT` | 1 | Onboarding sonrası ilk öneri ücretsiz açık, 2.-5. öneri (isim + gerekçe) bulanık/kilitli |
| `FREE_COMPARE_COUNT` | 1 | Ömür boyu 1 kerelik ücretsiz karşılaştırma, sonrası kilitli |
| `FREE_PARFUM_DETAIL_LIMIT` | 15 | Farklı 15 parfümün detay sayfası ücretsiz; bu id'ler cihazda kalıcı tutulur, tekrar ziyaret her zaman ücretsizdir |
| `FREE_FAVORITE_LIMIT` | 5 | En fazla 5 favori parfüm |
| `FREE_COLLECTION_LIMIT` | 5 | En fazla 5 koleksiyon oluşturulabilir |
| `FREE_COLLECTION_PARFUM_LIMIT` | 3 | Koleksiyon başına en fazla 3 parfüm |
| `FREE_JOURNAL_COUNT` | 3 | En fazla 3 günlük (journal) kaydı |
| `FREE_SIMILAR_COUNT` | 3 | "Benzerini bul" ekranında ilk 3 sonuç açık, gerisi kilitli |
| `FREE_ADVISOR_COUNT` | 3 | Koku Danışmanı'na ömür boyu 3 ücretsiz soru |

Premium'a ayrıca kilitli: dolap analizi + sıradaki alım (`WardrobeTab`, `LockedFeatureOverlay`), aylık raporun ayrıntıları ve hikâye kartı. Ücretsiz: Dolabım, günün seçimi, seri koruma, bildirimler, widget, arkadaş uyumu.

**Ödeme ekranı:** `product.introPrice.price === 0` olan pakette deneme süresi gösterilir ("N gün ücretsiz dene", deneme takvimi, deneme sonrası fiyat), deneme ≥3 gün ise bitişe 2 gün kala yerel hatırlatma planlanır. Deneme süresi App Store Connect'te "Introductory Offer → Free" olarak tanımlanır; kodda gün sayısı sabitlenmez.

Limitlerin sayaç/hafıza verisi `services/storage.ts` üzerinden AsyncStorage'da tutulur (`@teninde_compare_count`, `@teninde_free_viewed_parfums` vb.) — bu yüzden kullanıcı o an abone olmasa bile kilitli öğeler (örn. sonuç listesi, görüntülenen parfüm detayları) kalıcıdır; sonradan abone olduğunda profil sayfasından ("Önerilerimi Gör") aynı listeye erişip kilidi açık görebilir.

### 9.3 Tamamen Premium'a Kilitli Modüller
Premium araçlar (Koku Günlüğü, Mood, Katmanlama, Hediye Asistanı, Şans Çarkı vb.; liste `constants/tools.ts`) abone olmadan **açılmaz** — Bugün ve `/tools` ekranında karta dokunmak doğrudan paywall'ı tetikler (`requirePremium`). Bu ekranların kendi içinde de (örn. `layering.tsx` içindeki teaser+kilit mantığı) ayrıca bir gating katmanı vardır; bu, ekrana başka bir yoldan (deep link vb.) ulaşılırsa diye ikinci bir savunma hattıdır, kaldırılmamalı.

Reklamla ilişkisi: Ücretsiz kullanıcı onboarding sonrası `ad-loading.tsx`'te rewarded reklamı görmeye devam eder; premium kullanıcı bu ekranı tamamen atlayıp doğrudan sonuçlara gider.

### 9.4 Yeni Bir Özelliği Kilitlemek İstersen
1. Sınırı `constants/premiumLimits.ts`'e ekle (magic number'ı ilgili ekrana gömme).
2. Ekranda `const { isPremium, paywallVisible, setPaywallVisible } = usePremiumGate();` çağır.
3. Kilit tetiklenecek aksiyonun başında `if (!isPremium && <limit koşulu>) { setPaywallVisible(true); return; }` guard'ı koy.
4. Kısmi/bulanık gösterim gerekiyorsa `components/paywall/LockedFeatureOverlay.tsx`'i kullan; tam ekran kilit gerekiyorsa teaser içerik + overlay + `<PaywallScreen visible={paywallVisible} onClose={...} .../>` render et.
5. `PaywallScreen`'in avantaj listesi (`PREMIUM_BENEFITS`) tüm tetikleyicilerde ortak gösterilir — yeni kilitlenen özellik önemliyse bu listeye de bir madde ekle.

### 9.5 Kalan Kurulum (kod dışı)
- App Store Connect: Abonelik grubu + haftalık/aylık/yıllık ürünler (fiyat/deneme dahil).
- Play Console: Aynı yapı (base plan + offer).
- RevenueCat Dashboard: iOS/Android app tanımı, tek "premium" entitlement, tüm ürünlerin buna bağlanması, gerçek API key'lerin `services/subscriptionService.ts`'e girilmesi.
- Gerçek cihazda satın alma testi (StoreKit Configuration / Play License Testers) — Expo Go'da bu SDK çalışmaz, development build gerekir.
- **"None of the products could be fetched" hatası:** kod hatası değildir. Simülatörde Xcode şemasına bir StoreKit Configuration dosyası bağlanmalı; gerçek cihazda ürünler App Store Connect'te "Ready to Submit" olmalı, Paid Apps sözleşmesi + vergi/banka bilgisi tamamlanmalı ve RevenueCat'teki ürün kimlikleri birebir eşleşmeli. Uygulama bu durumda ödeme ekranında "paketler yüklenemedi / tekrar dene" gösterir; SDK hataları geliştirmede uyarı (sarı) olarak loglanır.

### 9.6 Premium özellikleri test etmek
1. **Geliştirme anahtarı (en hızlı):** Metro'ya bağlı geliştirme sürümünde Profil → Geliştirici → "Premium'u test et". `SubscriptionContext` bunu `isPremium || (__DEV__ && devPremium)` olarak uygular; değer `@teninde_dev_premium` anahtarında tutulur. `__DEV__` false olan (App Store/TestFlight) derlemelerde ne görünür ne çalışır — kaldırmaya gerek yok, ama başka yerde `isPremium`'u taklit eden kod YAZMA.
2. **Gerçek satın alma akışı (simülatör):** Xcode → File → New → StoreKit Configuration File; ürün kimliklerini RevenueCat/App Store Connect'tekiyle birebir aynı gir; Scheme → Run → Options → StoreKit Configuration olarak seç; uygulamayı Xcode'dan çalıştır. Satın alma sahte kartla tamamlanır.
3. **Gerçek cihaz (sandbox):** App Store Connect → Users and Access → Sandbox Testers ile test hesabı aç; cihazda Ayarlar → App Store → Sandbox Hesabı ile giriş yap. Ürünler "Ready to Submit", Paid Apps sözleşmesi imzalı ve RevenueCat'te yeni `com.teninde.app` uygulaması + API anahtarı (`.env`) tanımlı olmalı.

