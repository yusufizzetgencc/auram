# Auram — pH Algoritması ve Öneri Motoru Düzeltme Raporu

**Tarih:** 5 Temmuz 2026
**Kapsam:** `context/AppContext.tsx` (pH hesaplama + öneri algoritması), `app/onboarding.tsx` (UI gösterimi)
**Amaç:** Mevcut kod tabanındaki matematiksel tutarsızlıkları ve kullanılmayan verileri düzeltmek

---

## 1. Tespit Edilen Sorunlar

### 🐛 Sorun 1 — `suTuketimi` düzeltmesi sıra-bağımlı çalışıyor
`hesaplaPHPure` fonksiyonunda faktörler sırayla toplanıyor. "Çok su içiyorum" cevabının getirdiği ×0.5 çarpanı, kod içinde **kendisinden önce yazılmış** faktörlere (cilt tipi, gümüş oksitlenmesi) uygulanıyor; **kendisinden sonra yazılmış** faktörlere (beslenme, terleme) hiç uygulanmıyor. Bu, kodun yazılış sırasına bağlı, matematiksel olarak yanlış bir sonuç üretiyor. "Su tüketimi teni nötrler" iddiası tutarlı şekilde uygulanmıyor.

**Etki:** Yüksek — pH tahmininin doğruluğunu doğrudan bozuyor.

### 🐛 Sorun 2 — `guvenilirlik` (güven skoru) hesaplanıyor ama hiç gösterilmiyor
Fonksiyon 50-100 arası bir güven skoru üretiyor ama `onboarding.tsx` sadece `tahminiPH` değerini gösteriyor. Ayrıca mantık hatalı: `gumusOksitlenme` alanı hangi değeri taşırsa taşısın (`asidik`, `notr_alkali`, hatta **`emin_degil`**) güven skoruna +10 ekliyor. "Emin değilim" cevabı belirsizlik demektir, güveni artırmamalı.

**Etki:** Orta-Yüksek — kullanıcıya yanlış kesinlik hissi veriyor; "gerçek matematik" iddiasını zayıflatıyor.

### 🐛 Sorun 3 — `faktorler` alanı placeholder değerler döndürüyor
```js
faktorler: {
  ciltTipiEtkisi: asidikEtki > alkaliEtki ? -0.1 : 0.1,
  terlemeEtkisi: 0,
  hassasiyetEtkisi: 0,
}
```
Bu alan gerçek katkı miktarlarını değil, sabit placeholder değerleri döndürüyor. "Neden bu pH?" açıklamasını otomatik ve doğru üretmek için kullanılamıyor.

**Etki:** Orta — açıklanabilirlik (explainability) özelliğinin temelini zayıflatıyor.

### 🐛 Sorun 4 — En kritik kayıp: `toplamPerformans` öneri skoruna hiç girmiyor
`hesaplaParfumPHSkoru` fonksiyonu üst/orta/alt nota performansını (`notaKalicilik` verisinden) cilt tipi ve pH'a göre ağırlıklı hesaplıyor (`toplamPerformans = ust*0.2 + orta*0.3 + alt*0.5`). Bu, veri modelindeki en özgün ve en sofistike hesaplama.

Ancak `getRecommendations` fonksiyonunda **sadece `phSkor.phUyumSkoru` kullanılıyor**, `toplamPerformans` hiçbir yerde `score`'a eklenmiyor, hiçbir `matchReasons` metnine yansımıyor. Yani parfüm verisindeki `notaKalicilik` alanı hesaplanıyor ama pratikte boşa gidiyor.

**Etki:** Çok Yüksek — uygulamanın "ten kimyasına göre nota performansı" iddiasının pratikte çalışmadığı anlamına geliyor.

### 🐛 Sorun 5 — `matchReasons.length >= 1` filtresi iyi eşleşmeleri gizleyebilir
```js
if (score > 10 && matchReasons.length >= 1) { results.push(...) }
```
`matchReasons` yalnızca belirli dallarda dolduruluyor (pH ≥70, koku ailesi tam uyum, aura uyumu, serin ten + yoğun parfüm). Bir parfüm cinsiyet + ortam + kıyafet uyumundan yüksek skor alsa bile, bu dallardan hiçbiri metne girmezse **yüksek skorlu bir öneri sessizce elenebiliyor**.

**Etki:** Orta — iyi eşleşmelerin kullanıcıya hiç gösterilmemesi riski.

### 🐛 Sorun 6 — Vücut ısısı × yoğunluk matrisi eksik
```js
if (preferences.vucutIsisi === 'sicak' && parfum.yogunluk === 'yogun') score += 2;
else if (preferences.vucutIsisi === 'serin' && parfum.yogunluk === 'yogun') score += 10;
else score += 8;
```
Sadece "yogun" yoğunluk ayırt ediliyor. "Sıcak ten + hafif parfüm" ile "serin ten + hafif parfüm" gibi anlamlı farklı kombinasyonlar aynı `else` dalına düşüp aynı puanı (8) alıyor.

**Etki:** Düşük-Orta — CLAUDE.md'de tarif edilen nüansı tam yansıtmıyor.

---

## 2. Yapılacaklar Listesi (Öncelik Sırasıyla)

- [ ] **P1 — pH formülünü sıra-bağımsız hale getir:** `suTuketimi` çarpanını tüm asidik/alkali etkiler toplandıktan sonra, en son adımda uygula.
- [ ] **P1 — `guvenilirlik` hesabını düzelt:** `emin_degil` / belirsiz cevaplar güveni artırmasın; sadece net, yön belirten cevaplar güven puanı eklesin.
- [ ] **P1 — `guvenilirlik`'i UI'da göster:** Onboarding ekranında tek bir sayı yerine "pH: 5.5 (Güven: %70)" gibi güven aralığıyla birlikte sun.
- [ ] **P1 — `faktorler` alanını gerçek katkılarla doldur:** Placeholder yerine her faktörün gerçek sayısal etkisini döndür; açıklama metni buradan otomatik üretilebilsin.
- [ ] **P1 — `toplamPerformans`'ı öneri skoruna dahil et:** Yeni bir puanlama kriteri olarak ekle (örn. %15 ağırlık), diğer kriterlerin ağırlıklarını buna göre yeniden dengele, `phSkor.aciklama` metnini `matchReasons`'a ekle.
- [ ] **P2 — `matchReasons` filtresini gevşet:** Sonuç filtrelemesini sadece `score` eşiğine göre yap; `matchReasons` boşsa genel bir fallback açıklaması üret.
- [ ] **P2 — Vücut ısısı × yoğunluk matrisini tamamla:** 3x3 (sıcak/serin/dengeli × hafif/orta/yoğun) lookup tablosu kur.
- [ ] **P3 — Ağırlıkları ve CLAUDE.md'yi güncelle:** Puanlama kriterleri değiştikçe CLAUDE.md'deki tabloyu senkron tut.
- [ ] **P3 — Birim testleri ekle:** `/src/engine` mantığı `AppContext.tsx` içine gömülüyse, mümkünse ayrı, test edilebilir pure fonksiyonlara taşı ve Jest testleri yaz (özellikle pH formülü ve puanlama için).

---

## 3. Antigravity İçin Uygulama Promptu

Aşağıdaki promptu doğrudan Antigravity'ye (veya kod ajanına) verebilirsin:

```
Auram adlı React Native projesinde context/AppContext.tsx dosyasındaki
hesaplaPHPure ve getRecommendations fonksiyonlarında aşağıdaki düzeltmeleri
yap. Mevcut tipleri (UserPreferences, PHHesapSonucu, ParfumPHSkor,
RecommendationResult) bozma, sadece iç mantığı düzelt.

1) hesaplaPHPure fonksiyonunda su tüketimi ("suTuketimi === 'cok'") çarpanı
   şu anda kod sırasına bağlı çalışıyor: sadece kendinden önce toplanan
   asidikEtki/alkaliEtki değerlerini yarıya indiriyor, sonradan eklenen
   beslenme ve terleme etkilerini indirmiyor. Bunu düzelt: tüm faktörleri
   (cilt tipi, gümüş oksitlenmesi, beslenme, terleme, parfüm reaksiyonu)
   önce tamamen topla, su tüketimi çarpanını EN SON, toplam asidikEtki ve
   alkaliEtki üzerine uygula.

2) guvenilirlik (confidence) hesabında "gumusOksitlenme" alanı hangi değeri
   taşırsa taşısın +10 puan veriyor, bu da "emin_degil" (belirsiz) cevabını
   da güven artırıcı sayıyor. Düzelt: sadece net yön belirten cevaplar
   ("asidik" veya "notr_alkali") güven puanı eklesin, "emin_degil" hiç
   eklemesin veya küçük bir belirsizlik cezası uygulasın.

3) PHHesapSonucu.faktorler alanı şu an placeholder sabit değerler
   döndürüyor (ciltTipiEtkisi: asidikEtki > alkaliEtki ? -0.1 : 0.1,
   terlemeEtkisi: 0, hassasiyetEtkisi: 0). Bunun yerine her faktörün
   hesaplamaya gerçekte kattığı sayısal değeri döndür (örn. ciltTipiEtkisi,
   terlemeEtkisi, beslenmeEtkisi, suTuketimiEtkisi, gumusEtkisi,
   reaksiyonEtkisi gibi ayrı alanlar olarak), böylece ileride "neden bu pH"
   açıklaması bu verilerden otomatik üretilebilsin.

4) getRecommendations fonksiyonunda hesaplaParfumPHSkoru çağrısından dönen
   phSkor.toplamPerformans değeri şu anda HİÇ kullanılmıyor — sadece
   phSkor.phUyumSkoru kullanılıyor. toplamPerformans'ı yeni bir puanlama
   kriteri olarak skora ekle (örn. maxScore'a +15 ekle, score'a
   (phSkor.toplamPerformans / 100) * 15 ekle). Diğer kriterlerin (pH uyumu,
   koku ailesi, aura, cinsiyet, vücut ısısı, ortam, kıyafet stili)
   ağırlıklarını toplam 100'e gelecek şekilde orantılı olarak yeniden ölçekle.
   toplamPerformans yüksekse (>=75) phSkor.aciklama metnini matchReasons
   dizisine ekle.

5) Sonuç filtreleme koşulu şu an "score > 10 && matchReasons.length >= 1"
   şeklinde — matchReasons dolu olmayan ama skoru yüksek parfümler sessizce
   eleniyor. Bunu "score > 10" tek koşuluna indir; eğer matchReasons boşsa
   genel bir fallback açıklama ekle (örn. "Genel profilinizle uyumlu bir
   seçim").

6) Vücut ısısı × yoğunluk puanlaması şu an sadece "yogun" yoğunluğu ayırt
   ediyor, hafif/orta yoğunluk için sıcak/serin ten arasında fark
   yapmıyor. Bunu 3x3'lük bir lookup tablosuna çevir:
   sicak: {hafif: 10, orta: 6, yogun: 2}
   serin: {hafif: 4, orta: 7, yogun: 10}
   dengeli: {hafif: 7, orta: 8, yogun: 7}
   ve mevcut if/else bloğu yerine bu tablodan puan çek.

Değişiklikleri yaptıktan sonra: hangi dosyada hangi fonksiyonları
değiştirdiğini ve toplam ağırlık dağılımının yeni halini özetle. Var olan
başka davranışı (favoriler, koleksiyonlar, SOTD, storage fonksiyonları)
değiştirme.
```

---

## 4. Not

Bu düzeltmeler tamamlandıktan sonra `CLAUDE.md` dosyasındaki **Bölüm 3.2 (Puanlama Sistemi)** tablosunu yeni ağırlık dağılımıyla güncellemen gerekecek — kod ile dokümantasyonun senkron kalması, projenin kendi kuralı (Bölüm 6: "Yeni özellik eklerken: Önce CLAUDE.md'yi güncel tut").
