/**
 * Nota sözlüğü — "Bu nota nasıl kokar?" sorusuna kısa, sade Türkçe cevaplar.
 * Anahtarlar küçük harfli nota adlarıdır (katalogdaki yazımla aynı). Detay sayfasında notaya dokununca gösterilir.
 * Sık bilinen notalar (limon, gül, vanilya…) bilerek kısa tutuldu; asıl amaç tanıdık olmayanları açıklamak.
 */
import { trLower } from '@/utils/text';

const SOZLUK: Record<string, string> = {
  // Moleküller ve teknik notalar
  'ambroksan': 'Temiz, hafif tuzlu, ten gibi kokan bir molekül. Ambergrisin modern karşılığı; parfüme uzun kalıcılık ve "sıcak ten" hissi verir.',
  'iso e super': 'Kadifemsi, hafif odunsu bir molekül. Kendi başına çok belirgin değildir; tende "sizin kokunuz" gibi duyulur.',
  'cetalox': 'Ambergrisi taklit eden temiz, kremsi bir molekül. Tene yakın ve sabun-misk arası kokar.',
  'aldehitler': 'Köpüklü, sabunsu, "temiz çamaşır" parlaklığı veren bileşenler. Klasik Chanel N°5 açılışını hatırlatır.',
  'ambrette': 'Bamya tohumundan elde edilen, hafif meyvemsi ve tensi bir misk.',
  'beyaz misk': 'Temiz çarşaf ve yıkanmış ten gibi kokan yumuşak misk.',
  'misk': 'Teni saran, yumuşak ve hafif tatlımsı bir iz. Parfümü "tende" tutar.',
  'akigalawood': 'Paçuliden elde edilen, baharatlı ve kuru odunsu bir nota.',
  'metalik notalar': 'Soğuk, mineral, "çelik" hissi veren modern bir akor.',
  'çakmaktaşı': 'Mineral, hafif dumanlı, ıslak taş hissi.',
  'buz akoru': 'Serin, su gibi berrak bir ferahlık efekti.',
  'votka akoru': 'Keskin, temiz, hafif alkollü bir ferahlık.',

  // Amber, reçine ve balsamlar
  'amber': 'Parfümcülükte sıcak, reçineli ve hafif tatlı bir akor (taş olan kehribar değil). Kış kokularının temelidir.',
  'amber ağacı': 'Kuru, güçlü ve sıcak odunsu-amber bir molekül; uzun süre kalır.',
  'ambergris': 'Denizden gelen, tuzlu-tatlı ve hayvansı sıcak bir nota. Bugün çoğunlukla sentetik karşılığı kullanılır.',
  'labdanum': 'Kaya gülü reçinesi: koyu, balsamik, hafif deri ve bal tonları.',
  'opoponaks': 'Tatlı mür de denir; balsamik, hafif tozlu ve sıcak.',
  'benzoin': 'Vanilyaya yakın, tatlı ve reçineli bir balsam.',
  'tütsü': 'Kilise tütsüsü gibi dumanlı, reçineli ve hafif limonsu.',
  'mür': 'Acımsı, reçineli ve hafif mantarsı; tütsünün kardeşi.',
  'stiraks': 'Deri ve balzam arası, dumanlı-tatlı bir reçine.',
  'peru balsamı': 'Vanilya ve tarçın arası, sıcak ve likörsü bir balsam.',
  'elemi': 'Limonlu, biberli ve taze reçine.',
  'köknar reçinesi': 'Çam ormanı gibi reçineli ve hafif tatlı.',
  'reçine': 'Ağaç özünden gelen yapışkan-sıcak, balsamik kokular.',

  // Odunlar ve kökler
  'ud ağacı': 'Oud: koyu, dumanlı, hafif hayvansı ve çok yoğun bir odun. Ortadoğu parfümlerinin imzası.',
  'vetiver': 'Kök kokusu: topraksı, dumanlı, hafif greyfurt tonlu ve çok "temiz erkek" hissi.',
  'paçuli': 'Toprak, ıslak orman zemini ve hafif çikolata arası; parfümün tabanını koyulaştırır.',
  'sandal ağacı': 'Kremsi, sütlü ve yumuşak odun.',
  'sedir': 'Kalem talaşı gibi kuru ve düz odunsu.',
  'guaiac ağacı': 'Dumanlı, hafif tatlı ve yanık odunsu.',
  'kaşmir ağacı': 'Yumuşak, kadifemsi, hafif misk ve odun karışımı modern bir akor.',
  'meşe yosunu': 'Yosunlu, topraksı ve hafif tuzlu; klasik "şipre" parfümlerin tabanı.',
  'huş': 'Huş katranı: dumanlı, deri ve isli bir nota.',
  'papirüs': 'Kuru, hafif dumanlı ve kağıdımsı odunsu.',
  'iris': 'Pudralı, havuç ve kozmetik kokulu; zarif ve pahalı his veren bir kök.',
  'iris kökü': 'Pudralı, hafif toprak ve menekşe tonlu; çok değerli bir hammadde.',

  // Çiçekler
  'tuberoz': 'Yoğun, kremsi ve neredeyse sarhoş edici beyaz çiçek.',
  'ylang-ylang': 'Muz ve krema tonlu, egzotik ve tatlı bir çiçek.',
  'neroli': 'Turunç çiçeğinin damıtılmış hali: ferah, hafif yeşil ve sabunsu.',
  'portakal çiçeği': 'Bal tonlu, tatlı ve aydınlık beyaz çiçek.',
  'frangipani': 'Tropik, kremsi ve meyvemsi bir beyaz çiçek.',
  'heliotrop': 'Badem, vanilya ve pudra karışımı; "oyun hamuru" hissi verebilir.',
  'osmanthus': 'Kayısı ve deri tonlu Uzak Doğu çiçeği.',
  'mimoza': 'Pudralı, ballı ve tüylü yumuşak bir çiçek.',
  'sardunya': 'Gül ile nane arası, yeşil ve hafif metalik çiçek.',
  'inci çiçeği': 'Çok taze, yeşil ve çan gibi berrak bahar çiçeği.',
  'rangoon sarmaşığı': 'Hafif meyvemsi, tatlı ve pudralı tropik bir çiçek.',

  // Baharatlar ve aromatikler
  'kakule': 'Ferah, hafif okaliptüs ve limon tonlu tatlı bir baharat.',
  'pembe biber': 'Tatlı, meyvemsi ve hafif acı bir parlaklık; gerçek biber kadar sert değil.',
  'yenibahar': 'Karanfil, tarçın ve muskat karışımı gibi sıcak bir baharat.',
  'safran': 'Deri, bal ve hafif metalik tonlu sıcak bir baharat.',
  'muskat': 'Tatlı, odunsu ve sıcak baharat.',
  'kekik': 'Otsu, sıcak ve hafif ilaçsı bir aromatik.',
  'pelin otu': 'Acı, otsu ve yeşil; hafif absinthe hissi.',
  'petitgrain': 'Turunç yapraklarından: yeşil, odunsu ve ferah narenciye.',
  'davana': 'Meyvemsi ve likörsü bir ot.',
  'tonka fasulyesi': 'Vanilya, badem ve taze kesilmiş saman karışımı; tatlı ama gurme değil.',
  'pralin': 'Karamelize fındık ve şeker: çok tatlı, gurme bir nota.',
  'ravent': 'Ekşimsi, yeşil ve sulu; meyveye canlılık katar.',
  'yuzu': 'Mandalina ile greyfurt arası Japon narenciyesi.',
  'liçi': 'Gül tonlu, sulu ve tatlı tropik meyve.',
  'çarkıfelek meyvesi': 'Ekşi-tatlı, egzotik ve çok sulu bir meyve.',
  'oolong çayı': 'Kavrulmuş, hafif çiçeksi ve sütlü çay kokusu.',
  'kum akoru': 'Güneşte ısınmış kum gibi sıcak, mineral bir efekt.',

  // 2026-11 katalog genişlemesiyle gelenler
  'datura çiçeği': 'Boru çiçeği de denir; kremsi, hafif bal tonlu ve sarhoş edici beyaz çiçek kokusu.',
  'kadife çiçeği': 'Yeşil, hafif acımsı ve meyvemsi bir çiçek; parfüme kuru, güneşli bir canlılık verir.',
  'konyak': 'Meşe fıçıda yıllanmış brendi: sıcak, tatlımsı, hafif odunsu ve likörsü.',
  'limon mine çiçeği': 'Limonotu gibi; limondan daha yeşil ve otsu, keskin bir ferahlık.',
  'maninka meyvesi': 'Afrika kökenli, sıcak ve hafif ekşi-tatlı bir meyve akoru; deriyle iyi eşleşir.',
  'meyve akoru': 'Tek bir meyve değil, birkaç meyvenin birleşiminden oluşan sulu ve tatlı bir izlenim.',
  'mirabel eriği': 'Küçük sarı erik; olgun, sulu ve hafif bal tonlu bir meyvemsilik.',
  'nergis': 'Yeşil, hafif hayvansı ve bal tonlu, karakterli bir bahar çiçeği.',
  'pudra notaları': 'Makyaj pudrası ya da bebek pudrası gibi yumuşak, kuru ve kadifemsi bir his.',
  'sarışın odunlar': 'Açık renkli, kremsi ve yumuşak odunsu notalar; sert değil, teni saran bir sıcaklık.',
  'siklamen': 'Hafif, sulu ve temiz bir çiçek; parfüme şeffaf bir pembe ferahlık katar.',
  'süet': 'Yumuşak, kadifemsi deri; sert deriye göre daha pudralı ve hafif.',
  'süt köpüğü': 'Kremsi, sütlü ve hafif tatlı bir akor; kahve notalarını yumuşatır.',
  'leylak': 'Pudralı, hafif tatlı ve baharın ilk günlerini hatırlatan mor çiçek.',
  'meşe': 'Kuru, hafif dumanlı ve tanenli odunsu nota; fıçı ve konyak hissini destekler.',
  'siyah çay': 'Kuru, hafif dumanlı ve tanenli çay yaprağı; derin ve sakin bir iz bırakır.',
  'esmer şeker': 'Pekmez ve karamel arası koyu, sıcak bir tatlılık.',
  'eğir kökü': 'Calamus da denir; yeşil, hafif baharatlı ve sulu bitki kökü. Nehir kıyısı ferahlığı verir.',
  'çınar ağacı': 'Hafif, kuru ve açık renkli odunsu nota; yeşil kokulara sakin bir taban kurar.',
  'mate yaprağı': 'Yerba mate çayı: yeşil, hafif dumanlı ve otsu bir yaprak kokusu.',
  'sambac yasemini': 'Daha meyvemsi ve çay tonlu bir yasemin türü; klasik yaseminden daha yumuşak.',
  // 2026-11 ikinci genişletme
  'kumarin': 'Tonka fasulyesinde bulunan, kuru ot ve badem arası tatlımsı bir molekül; klasik erkek parfümlerinin "berber" sıcaklığı.',
  'melek otu': 'Angelika kökü: yeşil, topraksı ve hafif misk benzeri, otsu bir ferahlık.',
  'mineral tuz': 'Islak taş ve deniz kenarı havası gibi serin, tuzlu-mineral bir akor.',
  'sabun köpüğü': 'Temiz köpük ve yeni yıkanmış ten hissi veren, aldehitli parlak bir akor.',
  'santolina': 'Lavanta pamuğu da denir; gümüşi yapraklı, papatya ile lavanta arası otsu bir bitki.',
  'siyah vanilya': 'Daha dumanlı ve odunsu tonlu, az şekerli koyu bir vanilya yorumu.',
  'tolu balsamı': 'Güney Amerika ağacından reçine; vanilya ve tarçını hatırlatan sıcak, balsamik bir tatlılık.',
  'hindistan cevizi ağacı': 'Hindistan cevizinin kremsi tatlılığını odunsu, kuru bir yapıyla birleştiren akor.',
  'anason': 'Meyan köküne yakın, tatlımsı ve serinletici baharat (rakının kokusu).',
  'fındık': 'Kavrulmuş, kremsi ve hafif tatlı kuruyemiş notası.',
  'kırmızı meyveler': 'Ahududu, çilek ve frenk üzümü karışımı; sulu, hafif ekşimsi bir tatlılık.',
  'çiçeksi notalar': 'Tek bir çiçeğe bağlı olmayan, yumuşak ve genel bir çiçek buketi.',
};

/** Notanın kısa açıklaması; sözlükte yoksa null */
export function notaAciklamasi(nota: string): string | null {
  return SOZLUK[trLower(nota).trim()] ?? null;
}
