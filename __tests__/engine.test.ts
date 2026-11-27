import parfumData from '../data/parfumler.json';
import {
  getEffectivePH,
  getRecommendationsPure,
  hesaplaDealbreakerCezasi,
  hesaplaNotaProfili,
  hesaplaParfumPHSkoruPure,
  hesaplaPHPure,
  notaEslesir,
  PH_BASE,
  skorlaParfum,
  zenginlestirParfum,
  AGIRLIKLAR,
  benzerlik,
  benzerParfumler,
  FIYAT_SIRA,
  zevkBaglami,
} from '../engine';
import { buildTemporaryProfile } from '../engine';
import { Parfum, UserPreferences } from '../types';

const katalog: Parfum[] = (parfumData.parfumler as unknown as Parfum[]).map(zenginlestirParfum);

const prefs = (over: Partial<UserPreferences> = {}): UserPreferences => ({
  ...buildTemporaryProfile(null, null, null),
  ...over,
});

const mockParfum = (over: Partial<Parfum> = {}): Parfum => zenginlestirParfum({
  id: 'test-1',
  isim: 'Test',
  notalar: { ust: ['bergamot'], orta: ['lavanta'], alt: ['sedir'] },
  tip: 'Ferah',
  mevsim: ['Yaz'],
  cinsiyet: 'unisex',
  yogunluk: 'orta',
  kalicilik: 'orta',
  kullanimAmaci: ['gunluk'],
  iklim: [],
  ortam: 'her_ikisi',
  aktivite: [],
  kiyafetStili: [],
  aciklama: '',
  etiketler: [],
  ...over,
});

describe('Ağırlıklar', () => {
  it('toplam 100 eder', () => {
    expect(Object.values(AGIRLIKLAR).reduce((a, b) => a + b, 0)).toBe(100);
  });
});

describe('hesaplaPHPure (Ten Profili)', () => {
  it('cevap yoksa başlangıç değeri 5.0 ve geniş bir aralık döner', () => {
    const r = hesaplaPHPure(prefs());
    expect(r.tahminiPH).toBe(PH_BASE);
    expect(r.aralikMax! - r.aralikMin!).toBeCloseTo(0.9, 2);
    expect(r.guvenilirlik).toBe(35);
  });

  it('kuru cilt pH tahminini YÜKSELTİR (atopik/kuru cilt literatürü)', () => {
    expect(hesaplaPHPure(prefs({ ciltTipi: 'kuru' })).tahminiPH).toBeGreaterThan(PH_BASE);
    expect(hesaplaPHPure(prefs({ ciltTipi: 'yagli' })).tahminiPH).toBeLessThan(PH_BASE);
  });

  it('su ve beslenme pH tahminini değiştirmez', () => {
    const a = hesaplaPHPure(prefs({ suTuketimi: 'cok', beslenmeAliskanligi: 'asidik' })).tahminiPH;
    expect(a).toBe(PH_BASE);
  });

  it('"emin değilim" güveni artırmaz', () => {
    const base = hesaplaPHPure(prefs()).guvenilirlik;
    expect(hesaplaPHPure(prefs({ gumusOksitlenme: 'emin_degil' })).guvenilirlik).toBe(base);
    expect(hesaplaPHPure(prefs({ gumusOksitlenme: 'asidik' })).guvenilirlik).toBeGreaterThan(base);
  });

  it('anket tahmini %75 güveni asla geçmez ve sonuç sağlıklı aralıkta kalır', () => {
    const r = hesaplaPHPure(prefs({ ciltTipi: 'kuru', terlemeOrani: 'cok', gumusOksitlenme: 'notr_alkali', parfumReaksiyonu: 'tatli_pudrali' }));
    expect(r.guvenilirlik).toBeLessThanOrEqual(75);
    expect(r.tahminiPH).toBeLessThanOrEqual(6.0);
    expect(r.tahminiPH).toBeGreaterThanOrEqual(4.3);
  });

  it('ten profili: yağlı + serin ten → yüksek kalıcılık endeksi', () => {
    const r = hesaplaPHPure(prefs({ ciltTipi: 'yagli', vucutIsisi: 'serin' }));
    expect(r.tenProfili!.kalicilikEndeksi).toBeGreaterThan(60);
  });
});

describe('getEffectivePH', () => {
  it('ölçülmüş değer varsa onu kullanır', () => {
    const p = prefs({ phInfo: { biliyorMu: 'biliyorum', deger: 4.6, tahminiDeger: null, aralik: null } });
    expect(getEffectivePH(p)).toBe(4.6);
  });

  it('kayıtlı eski tahminiDeger yerine cevaplardan yeniden hesaplar (ilk liste hatası)', () => {
    const p = prefs({ ciltTipi: 'kuru', phInfo: { biliyorMu: 'bilmiyorum', deger: null, tahminiDeger: null, aralik: null } });
    expect(getEffectivePH(p)).toBe(hesaplaPHPure(p).tahminiPH);
  });
});

describe('nota eşleştirme', () => {
  it('Türkçe ekleri yakalar, alakasız kelimeleri yakalamaz', () => {
    expect(notaEslesir('Madagaskar vanilyası', ['vanilya'])).toBe(true);
    expect(notaEslesir('Bulgar gülü', ['gül'])).toBe(true);
    expect(notaEslesir('iris kökü', ['isli', 'duman'])).toBe(false);
    expect(notaEslesir('biberiye', ['=biber'])).toBe(false);
    expect(notaEslesir('peru balsamı', ['=bal'])).toBe(false);
    expect(notaEslesir('bal', ['=bal'])).toBe(true);
  });

  it('nota profili narenciye ağırlıklı parfümü tanır', () => {
    const np = hesaplaNotaProfili({ notalar: { ust: ['limon', 'bergamot'], orta: ['neroli'], alt: ['misk'] } });
    expect(np.narenciye).toBeGreaterThan(0.5);
  });
});

describe('hesaplaParfumPHSkoruPure', () => {
  it('uyum eğrisi sürekli (eski modeldeki 80→50 sıçraması yok)', () => {
    const pf = mockParfum();
    const ideal = pf.phUyumu.idealPH;
    const a = hesaplaParfumPHSkoruPure(pf, ideal + 0.35, null).phUyumSkoru;
    const b = hesaplaParfumPHSkoruPure(pf, ideal + 0.36, null).phUyumSkoru;
    expect(Math.abs(a - b)).toBeLessThanOrEqual(1);
  });

  it('kalıcılık modifikasyonu cilt tipine göre', () => {
    expect(hesaplaParfumPHSkoruPure(mockParfum(), 5.0, 'kuru').kalicilikModifikasyonu).toBe(-0.2);
    expect(hesaplaParfumPHSkoruPure(mockParfum(), 5.0, 'yagli').kalicilikModifikasyonu).toBe(0.3);
  });

  it('yağlı ten üst nota performansını kuru tenden yüksek tutar', () => {
    const yagli = hesaplaParfumPHSkoruPure(mockParfum(), 5.0, 'yagli').ustNotaPerformansi;
    const kuru = hesaplaParfumPHSkoruPure(mockParfum(), 5.0, 'kuru').ustNotaPerformansi;
    expect(yagli).toBeGreaterThan(kuru);
  });
});

describe('kırmızı çizgiler', () => {
  it('alt notadaki ihlal üst notadakinden ağır cezalandırılır', () => {
    const alt = hesaplaDealbreakerCezasi(mockParfum({ notalar: { ust: [], orta: [], alt: ['vanilya'] } }), ['Aşırı şekerli']);
    const ust = hesaplaDealbreakerCezasi(mockParfum({ notalar: { ust: ['vanilya'], orta: [], alt: [] } }), ['Aşırı şekerli']);
    expect(alt.ceza).toBeGreaterThan(ust.ceza);
  });

  it('tonka gibi tatlı notaları da yakalar', () => {
    const r = hesaplaDealbreakerCezasi(mockParfum({ notalar: { ust: [], orta: [], alt: ['tonka fasulyesi'] } }), ['Aşırı şekerli']);
    expect(r.kirmiziCizgi).toBe(true);
  });

  it('"aşırı şekerli" diyen kullanıcıya vanilyalı parfüm önerilmez', () => {
    const recs = getRecommendationsPure(katalog, prefs({ kacinilacakNotalar: ['Aşırı şekerli'] }));
    recs.forEach(r => {
      expect(hesaplaDealbreakerCezasi(r.parfum, ['Aşırı şekerli']).kirmiziCizgi).toBe(false);
    });
  });
});

describe('getRecommendationsPure', () => {
  it('maskülen tercih eden kullanıcıya kadın parfümü önermez', () => {
    const recs = getRecommendationsPure(katalog, prefs({ cinsiyetAlgisi: 'maskulen' }));
    expect(recs).toHaveLength(5);
    recs.forEach(r => expect(r.parfum.cinsiyet).not.toBe('kadın'));
  });

  it('her öneri en az bir gerekçe ve 0-100 arası yüzde taşır', () => {
    const recs = getRecommendationsPure(katalog, prefs({ kokuTipleri: ['Odunsu'], aura: 'gizemli', vucutIsisi: 'serin' }));
    recs.forEach(r => {
      expect(r.matchReasons.length).toBeGreaterThan(0);
      expect(r.matchPercentage).toBeGreaterThanOrEqual(0);
      expect(r.matchPercentage).toBeLessThanOrEqual(100);
    });
  });

  it('pH cevapları öneri sırasını gerçekten etkiler (state gecikmesi hatasının regresyonu)', () => {
    const asidik = prefs({ ciltTipi: 'yagli', parfumReaksiyonu: 'eksi_uzaklasir', gumusOksitlenme: 'asidik' });
    const notre = prefs({ ciltTipi: 'yagli', parfumReaksiyonu: 'tatli_pudrali', gumusOksitlenme: 'notr_alkali' });
    const narenciye = katalog.find(p => p.isim === 'Lime Basil & Mandarin')!;
    const gurme = katalog.find(p => p.isim === 'Tobacco Vanille')!;
    const phA = getEffectivePH(asidik);
    const phN = getEffectivePH(notre);
    // Asidik tende narenciye > gurme; nötre yakın tende tersi
    expect(skorlaParfum(narenciye, asidik, phA).phSkor.phUyumSkoru)
      .toBeGreaterThan(skorlaParfum(gurme, asidik, phA).phSkor.phUyumSkoru);
    expect(skorlaParfum(gurme, notre, phN).phSkor.phUyumSkoru)
      .toBeGreaterThan(skorlaParfum(gurme, asidik, phA).phSkor.phUyumSkoru);
  });

  it('sadece kıyafete sıkan kullanıcıda pH kriteri tam puan verir', () => {
    const pf = mockParfum();
    const r = skorlaParfum(pf, prefs({ uygulamaYeri: 'sadece_kiyafet' }), 4.4);
    expect(r.uyumKategorileri.find(k => k.kategori === 'Ten Kimyası')?.uyum).toBe(true);
  });
});

describe('yeni sorular', () => {
  it('bütçe üstündeki parfüm, bütçe içindekine göre daha düşük puan alır', () => {
    const p = prefs({ butceTercihi: 'orta' });
    const ucuz = mockParfum({ fiyatAraligi: 'orta' });
    const pahali = mockParfum({ fiyatAraligi: 'luks' });
    expect(skorlaParfum(ucuz, p, 5.0).score).toBeGreaterThan(skorlaParfum(pahali, p, 5.0).score);
  });

  it('"parfümler bende çabuk uçar" gözlemi kalıcılık endeksini düşürür', () => {
    const kisa = hesaplaPHPure(prefs({ gozlenenKalicilik: 'lt2' })).tenProfili!.kalicilikEndeksi;
    const uzun = hesaplaPHPure(prefs({ gozlenenKalicilik: '6+' })).tenProfili!.kalicilikEndeksi;
    expect(uzun).toBeGreaterThan(kisa);
  });

  it('"hiç dikkat etmedim" cevabı güveni artırmaz', () => {
    expect(hesaplaPHPure(prefs({ parfumReaksiyonu: 'bilmiyorum' })).guvenilirlik).toBe(hesaplaPHPure(prefs()).guvenilirlik);
  });

  it('yoğun baharat ve oud kırmızı çizgileri çalışır', () => {
    const pf = mockParfum({ notalar: { ust: ['pembe biber'], orta: [], alt: ['ud ağacı'] } });
    const r = hesaplaDealbreakerCezasi(pf, ['Yoğun baharat', 'Oud ve reçine']);
    expect(r.ihlalEdilenler).toEqual(['Yoğun baharat', 'Oud ve reçine']);
  });

  it('"fark etmez" cinsiyet tercihi hiçbir parfümü elemez', () => {
    expect(getRecommendationsPure(katalog, prefs({ cinsiyetAlgisi: 'farketmez' }), undefined, katalog.length)).toHaveLength(katalog.length);
  });
});

describe('katmanlama', () => {
  const { LAYERING_RULES, getLayeringSuggestions } = require('../engine');
  it('12 koku ailesinin hepsi için kural vardır', () => {
    const families = Array.from(new Set(katalog.map(p => p.tip)));
    families.forEach(f => expect(LAYERING_RULES[f]).toBeDefined());
  });
  it('her aileden bir parfüm için en az bir öneri çıkar', () => {
    const families = Array.from(new Set(katalog.map(p => p.tip)));
    families.forEach(f => {
      const base = katalog.find(p => p.tip === f)!;
      expect(getLayeringSuggestions(base, katalog).length).toBeGreaterThan(0);
    });
  });
});

describe('katalog bütünlüğü', () => {
  const FAMILIES = ['Çiçeksi', 'Odunsu', 'Ferah', 'Amber', 'Baharatlı', 'Meyvemsi', 'Tatlı', 'Yeşil', 'Oryantal', 'Aquatik', 'Deri', 'Pudralı'];
  it('kimlikler ve marka+isim çiftleri tekildir', () => {
    expect(new Set(katalog.map(p => p.id)).size).toBe(katalog.length);
    expect(new Set(katalog.map(p => `${p.marka}|${p.isim}`)).size).toBe(katalog.length);
  });
  it('her parfümün markası, geçerli ailesi ve en az bir alt notası vardır', () => {
    katalog.forEach(p => {
      expect(p.marka).toBeTruthy();
      expect(FAMILIES).toContain(p.tip);
      expect(p.notalar.alt.length).toBeGreaterThan(0);
      expect(['erkek', 'kadın', 'unisex']).toContain(p.cinsiyet);
    });
  });
  it('doğrulandı olarak işaretlenen her kaydın kaynağı vardır', () => {
    katalog.filter(p => p.dogrulandi).forEach(p => expect(p.kaynak).toMatch(/^https?:\/\//));
  });
  it('her parfümün menşei ve niş bilgisi vardır; yerli ve niş filtreleri boş kalmaz', () => {
    katalog.forEach(p => {
      expect(p.mensei).toMatch(/^[A-Z]{2}$/);
      expect(typeof p.nis).toBe('boolean');
    });
    expect(katalog.filter(p => p.mensei === 'TR').length).toBeGreaterThanOrEqual(5);
    expect(katalog.filter(p => p.nis).length).toBeGreaterThanOrEqual(10);
  });
});

describe('benzerlik ve kişisel zevk', () => {
  const bul = (isim: string) => katalog.find(p => p.isim === isim)!;

  it('bir parfüm kendisine tam benzer; sonuçlar kendisini içermez ve sıralıdır', () => {
    const sauvage = bul('Sauvage');
    expect(benzerlik(sauvage, sauvage).skor).toBeCloseTo(1, 2);
    const list = benzerParfumler(sauvage, katalog, { limit: 8 });
    expect(list.find(s => s.parfum.id === sauvage.id)).toBeUndefined();
    for (let i = 1; i < list.length; i++) expect(list[i - 1].benzerlik).toBeGreaterThanOrEqual(list[i].benzerlik);
  });

  it('benzerlik simetriktir ve 0–1 aralığındadır', () => {
    const a = bul('Aventus');
    const b = bul('Club de Nuit Intense Man');
    expect(benzerlik(a, b).skor).toBeCloseTo(benzerlik(b, a).skor, 5);
    expect(benzerlik(a, b).skor).toBeGreaterThan(0);
    expect(benzerlik(a, b).skor).toBeLessThanOrEqual(1);
  });

  it('notaları neredeyse aynı olan parfümler, alakasızlardan daha benzer bulunur', () => {
    const aventus = bul('Aventus');
    expect(benzerlik(aventus, bul('Club de Nuit Intense Man')).skor).toBeGreaterThan(benzerlik(aventus, bul('Philosykos')).skor);
  });

  it('"daha uygun" yalnızca daha düşük fiyat kademesini döndürür', () => {
    const base = bul('Aventus'); // luks
    benzerParfumler(base, katalog, { dahaUygun: true }).forEach(s => {
      expect(FIYAT_SIRA[s.parfum.fiyatAraligi ?? 'orta']).toBeLessThan(FIYAT_SIRA[base.fiyatAraligi!]);
    });
  });

  it('sevilen parfüme benzeyenlerin puanı artar, sevilen parfümün kendisi tekrar önerilmez', () => {
    const aventus = bul('Aventus');
    const cdn = bul('Club de Nuit Intense Man');
    const temel = prefs({});
    const zevkli = prefs({ sevilenParfumler: [aventus.id] });
    const ph = getEffectivePH(temel);
    const once = skorlaParfum(cdn, temel, ph).matchPercentage;
    const sonra = skorlaParfum(cdn, zevkli, ph, zevkBaglami(katalog, zevkli));
    expect(sonra.matchPercentage).toBeGreaterThanOrEqual(once);
    expect(sonra.matchReasons.join(' ')).toContain('Aventus');
    const recs = getRecommendationsPure(katalog, zevkli, undefined, katalog.length);
    expect(recs.find(r => r.parfum.id === aventus.id)).toBeUndefined();
  });

  it('sevilmeyen parfüme benzeyenlerin puanı düşer ve uyarı eklenir', () => {
    const aventus = bul('Aventus');
    const cdn = bul('Club de Nuit Intense Man');
    const temel = prefs({});
    const zevksiz = prefs({ sevilmeyenParfumler: [aventus.id] });
    const ph = getEffectivePH(temel);
    const once = skorlaParfum(cdn, temel, ph).matchPercentage;
    const sonra = skorlaParfum(cdn, zevksiz, ph, zevkBaglami(katalog, zevksiz));
    expect(sonra.matchPercentage).toBeLessThan(once);
    expect(sonra.uyumKategorileri.some(k => k.kategori === 'Zevkiniz')).toBe(true);
  });
});

// ───────────── 2026-11: günlük alışkanlık motorları ─────────────
import { seriGuncelle, seriDurumu, haftaBasi, KORUMA_MAX } from '../engine/streak';
import { gununSecimi } from '../engine/daily';
import { kokuHafizasi, aylikRapor, zevkNetligi } from '../engine/insights';
import { dolapAnalizi } from '../engine/wardrobe';
import { soruyuAyristir, danismanCevabi, butceKademesi } from '../engine/advisor';
import { StreakData, PerformanceLog } from '../types';

const bosSeri: StreakData = { currentStreak: 0, longestStreak: 0, lastSOTDDate: null, totalSOTDs: 0, badges: [] };

describe('seri ve seri koruma', () => {
  it('ardışık günlerde artar, aynı gün değişmez', () => {
    let s = seriGuncelle(bosSeri, '2026-11-02').data;
    s = seriGuncelle(s, '2026-11-03').data;
    expect(s.currentStreak).toBe(2);
    expect(seriGuncelle(s, '2026-11-03').data.currentStreak).toBe(2);
  });
  it('tek gün atlanırsa koruma hakkı harcanır ve seri sürer; ikinci atlamada sıfırlanır', () => {
    let s = seriGuncelle(bosSeri, '2026-11-02').data; // pazartesi → hak 1
    s = seriGuncelle(s, '2026-11-03').data;
    const r = seriGuncelle(s, '2026-11-05'); // 4'ü atlandı
    expect(r.korumaKullanildi).toBe(true);
    expect(r.data.currentStreak).toBe(3);
    expect(r.data.korunanGunler).toContain('2026-11-04');
    expect(seriGuncelle(r.data, '2026-11-07').data.currentStreak).toBe(1); // hak bitti
  });
  it('hak her pazartesi yenilenir ve birikmez', () => {
    expect(haftaBasi('2026-11-08')).toBe('2026-11-02'); // pazar → o haftanın pazartesisi
    const s = seriGuncelle({ ...bosSeri, korumaHakki: 0, korumaYenilenme: '2026-10-26' }, '2026-11-03').data;
    expect(s.korumaHakki).toBe(KORUMA_MAX);
  });
  it('seriDurumu dünkü kayıtta riskte, iki gün önce + hak varsa kurtarılabilir', () => {
    const s = { ...bosSeri, currentStreak: 5, lastSOTDDate: '2026-11-03', korumaHakki: 1, korumaYenilenme: '2026-11-02' };
    expect(seriDurumu(s, '2026-11-04')).toMatchObject({ gunler: 5, riskte: true, kurtarilabilir: false });
    expect(seriDurumu(s, '2026-11-05')).toMatchObject({ riskte: true, kurtarilabilir: true });
    expect(seriDurumu(s, '2026-11-07').gunler).toBe(0);
  });
});

describe('günün seçimi', () => {
  const bul = (isim: string) => katalog.find(p => p.isim === isim)!;
  const dolap = ['Light Blue pour Homme', 'Tobacco Vanille', 'Acqua di Giò', 'Ombré Leather'].map(bul);
  const p0 = prefs({});
  const ph = getEffectivePH(p0);

  it('soğuk havada yoğun, sıcak havada hafif parfüm öne çıkar', () => {
    const soguk = gununSecimi({ adaylar: dolap, prefs: p0, ph, etkinlik: 'gunluk', hava: { sicaklik: 3, nem: 50 }, tarih: new Date(2026, 0, 10) });
    const sicak = gununSecimi({ adaylar: dolap, prefs: p0, ph, etkinlik: 'gunluk', hava: { sicaklik: 32, nem: 40 }, tarih: new Date(2026, 6, 10) });
    expect(soguk[0].parfum.yogunluk).not.toBe('hafif');
    expect(sicak[0].parfum.yogunluk).toBe('hafif');
  });
  it('spor için yoğun parfüm seçilmez', () => {
    const r = gununSecimi({ adaylar: dolap, prefs: p0, ph, etkinlik: 'spor', hava: { sicaklik: 18, nem: 50 } });
    expect(r[0].parfum.yogunluk).not.toBe('yogun');
  });
  it('dün sıkılan parfüm, eşdeğer bir alternatif varken geri planda kalır', () => {
    const tarih = new Date(2026, 10, 10);
    const ilk = gununSecimi({ adaylar: dolap, prefs: p0, ph, etkinlik: 'gunluk', tarih })[0].parfum;
    const sonra = gununSecimi({ adaylar: dolap, prefs: p0, ph, etkinlik: 'gunluk', tarih, gecmis: [{ parfumId: ilk.id, date: '2026-11-09' }] });
    expect(sonra[0].parfum.id).not.toBe(ilk.id);
  });
  it('puanlar 0–100 aralığında ve her seçimin en az bir gerekçesi var', () => {
    gununSecimi({ adaylar: dolap, prefs: p0, ph, etkinlik: 'is', hava: { sicaklik: 15, nem: 60 }, dolaptan: true }).forEach(s => {
      expect(s.puan).toBeGreaterThanOrEqual(0);
      expect(s.puan).toBeLessThanOrEqual(100);
      expect(s.gerekceler.length).toBeGreaterThan(0);
    });
  });
});

describe('koku hafızası ve rapor', () => {
  const a = katalog[0], b = katalog[1];
  const kayit = [
    { parfumId: a.id, date: '2026-11-02' }, { parfumId: a.id, date: '2026-11-03' }, { parfumId: b.id, date: '2026-11-04' },
    { parfumId: a.id, date: '2026-10-05' },
  ];
  const log = (id: string, date: string, longevity: number, compliment = false): PerformanceLog => ({ id: date, parfumId: id, date, longevity, compliment, personalRating: 7, createdAt: date });
  const loglar = [log(a.id, '2026-11-02', 5, true), log(a.id, '2026-11-03', 4), log(b.id, '2026-11-04', 2)];

  it('en çok kullanılanı ve en uzun kalanı bulur; yetersiz veride null döner', () => {
    const h = kokuHafizasi(kayit, loglar, katalog);
    expect(h.enCok[0].parfum.id).toBe(a.id);
    expect(h.enCok[0].deger).toBe(3);
    expect(h.enUzunKalan?.parfum.id).toBe(a.id); // b'nin tek değerlendirmesi var → dahil değil
    expect(h.iltifatSampiyonu?.deger).toBe(0.5);
    expect(kokuHafizasi([], [], katalog).enUzunKalan).toBeNull();
  });
  it('aylık rapor yalnız o ayı sayar ve önceki ayla kıyaslar', () => {
    const r = aylikRapor(2026, 11, kayit, loglar, katalog);
    expect(r.toplamGun).toBe(3);
    expect(r.oncekiAyFarki).toBe(2);
    expect(r.iltifatSayisi).toBe(1);
    expect(r.ortalamaKalicilik).toBeCloseTo(3.7, 1);
  });
  it('zevk netliği 0–100 ve geri bildirimle artar', () => {
    const az = zevkNetligi(prefs({}), 0).yuzde;
    const cok = zevkNetligi(prefs({ sevilenParfumler: katalog.slice(0, 6).map(p => p.id), sevilmeyenParfumler: katalog.slice(6, 10).map(p => p.id) }), 10).yuzde;
    expect(cok).toBeGreaterThan(az);
    expect(cok).toBeLessThanOrEqual(100);
  });
});

describe('dolap analizi', () => {
  it('eksik mevsimi bulur ve sıradaki alım onu kapatır, sahip olunanı önermez', () => {
    const yazlik = katalog.filter(p => (p.mevsim ?? []).length === 2 && p.mevsim!.includes('Yaz') && p.mevsim!.includes('İlkbahar')).slice(0, 2);
    const p0 = prefs({});
    const a = dolapAnalizi(yazlik, katalog, p0, getEffectivePH(p0));
    expect(a.eksikler.some(e => e.tur === 'mevsim')).toBe(true);
    const hedef = a.eksikler[0];
    a.siradakiAlim.forEach(s => {
      expect(yazlik.find(y => y.id === s.parfum.id)).toBeUndefined();
      if (hedef.tur === 'mevsim') expect(s.parfum.mevsim).toContain(hedef.anahtar);
    });
  });
});

describe('koku danışmanı', () => {
  it('hediye, cinsiyet ve bütçeyi anlar', () => {
    const n = soruyuAyristir("Anneme 3.000 TL'ye hediye ne alayım?", katalog);
    expect(n.tur).toBe('hediye');
    expect(n.hediyeProfil).toBe('kadın');
    expect(n.butceTL).toBe(3000);
    expect(n.butce).toBe('orta');
  });
  it('etkinliği ve dolap kaynağını anlar', () => {
    const n = soruyuAyristir('Cumartesi düğüne gidiyorum, dolabımdan ne sıkayım?', katalog);
    expect(n.tur).toBe('kendim');
    expect(n.etkinlik).toBe('ozel');
    expect(n.kaynak).toBe('dolap');
  });
  it('"X\'e benzer" isteğinde parfümü tanır ve benzerlerini bütçeye göre döner', () => {
    const n = soruyuAyristir("Aventus'a benzeyen daha uygun bir şey", katalog);
    expect(n.tur).toBe('benzer');
    expect(n.benzerine?.isim).toBe('Aventus');
    const p0 = prefs({});
    const c = danismanCevabi(n, { katalog, dolap: [], prefs: p0, ph: getEffectivePH(p0) });
    expect(c.oneriler.length).toBeGreaterThan(0);
    c.oneriler.forEach(o => expect(['ekonomik']).toContain(o.parfum.fiyatAraligi));
  });
  it('hediye önerileri alıcı profiline uyar (erkeğe feminen önermez)', () => {
    const n = soruyuAyristir('Babama doğum günü için parfüm hediye etmek istiyorum', katalog);
    const p0 = prefs({});
    const c = danismanCevabi(n, { katalog, dolap: [], prefs: p0, ph: getEffectivePH(p0) });
    expect(c.oneriler.length).toBeGreaterThan(0);
    c.oneriler.forEach(o => expect(o.parfum.cinsiyet).not.toBe('kadın'));
  });
  it('anlamadığı soruda örnek sorularla yardım eder', () => {
    const c = danismanCevabi(soruyuAyristir('merhaba', katalog), { katalog, dolap: [], prefs: prefs({}), ph: 5 });
    expect(c.oneriler).toHaveLength(0);
    expect(c.devam.length).toBeGreaterThan(0);
  });
  it('bütçe kademeleri', () => {
    expect(butceKademesi(1000)).toBe('ekonomik');
    expect(butceKademesi(6000)).toBe('premium');
    expect(butceKademesi(20000)).toBe('luks');
  });
});

// ───────────── Bildirim planı ─────────────
import { bildirimPlani, SESSIZ_BAS, SESSIZ_BIT } from '../services/notificationPlan';
import { NotificationPreferences } from '../types';

describe('bildirim planı', () => {
  const ayar: NotificationPreferences = { enabled: true, weatherSuggestions: true, specialDayReminders: true, dailyMoodCheck: false, discoveryTips: true, reminderTime: '09:00', sabah: true, aksam: true, seri: true, haftalik: true, aylik: true, azalan: true };
  const p0 = prefs({});
  const dolap = katalog.slice(0, 4);
  const temel = { prefs: p0, ph: getEffectivePH(p0), dolap, katalog, gecmis: [] as { parfumId: string; date: string }[], seri: 0, isim: 'Yusuf' };

  it('ana anahtar kapalıysa hiçbir şey planlanmaz', () => {
    expect(bildirimPlani({ ...temel, ayar: { ...ayar, enabled: false }, simdi: new Date(2026, 10, 10, 7, 0) })).toHaveLength(0);
  });

  it('sabah: 7 gün, dolaptan isimli öneri; aynı parfüm üst üste iki gün önerilmez', () => {
    const plan = bildirimPlani({ ...temel, ayar, simdi: new Date(2026, 10, 10, 7, 0) });
    const sabah = plan.filter(b => b.tur === 'sabah');
    expect(sabah).toHaveLength(7);
    expect(sabah[0].baslik).toMatch(/^Yusuf, bugün /);
    for (let i = 1; i < sabah.length; i++) expect(sabah[i].baslik).not.toBe(sabah[i - 1].baslik);
  });

  it('bugünün sabahı geçmişse veya bugün kayıt varsa bugüne sabah bildirimi yok', () => {
    const gec = bildirimPlani({ ...temel, ayar, simdi: new Date(2026, 10, 10, 11, 0) }).filter(b => b.tur === 'sabah');
    expect(gec).toHaveLength(6);
    const kayitli = bildirimPlani({ ...temel, ayar, simdi: new Date(2026, 10, 10, 7, 0), gecmis: [{ parfumId: dolap[0].id, date: '2026-11-10' }] }).filter(b => b.tur === 'sabah');
    expect(kayitli).toHaveLength(6);
  });

  it('akşam değerlendirmesi yalnızca bugün kayıt varsa; seri hatırlatması yalnızca kayıt yoksa ve seri ≥ 2', () => {
    const kayitli = bildirimPlani({ ...temel, ayar, simdi: new Date(2026, 10, 10, 12, 0), seri: 5, gecmis: [{ parfumId: dolap[0].id, date: '2026-11-10' }] });
    expect(kayitli.some(b => b.tur === 'aksam')).toBe(true);
    expect(kayitli.some(b => b.tur === 'seri')).toBe(false);
    const kayitsiz = bildirimPlani({ ...temel, ayar, simdi: new Date(2026, 10, 10, 12, 0), seri: 5 });
    expect(kayitsiz.some(b => b.tur === 'aksam')).toBe(false);
    expect(kayitsiz.find(b => b.tur === 'seri')?.baslik).toContain('5 günlük');
    expect(bildirimPlani({ ...temel, ayar, simdi: new Date(2026, 10, 10, 12, 0), seri: 1 }).some(b => b.tur === 'seri')).toBe(false);
  });

  it('haftalık pazar 19:00, aylık gelecek ayın 1i 10:00; tür kapatılınca planlanmaz', () => {
    const plan = bildirimPlani({ ...temel, ayar, simdi: new Date(2026, 10, 10, 12, 0) }); // 10 Kasım 2026 salı
    const h = plan.find(b => b.tur === 'haftalik')!;
    expect(h.tarih.getDay()).toBe(0);
    expect(h.tarih.getHours()).toBe(19);
    const a = plan.find(b => b.tur === 'aylik')!;
    expect([a.tarih.getMonth(), a.tarih.getDate(), a.tarih.getHours()]).toEqual([11, 1, 10]);
    expect(a.baslik).toContain('Kasım');
    expect(bildirimPlani({ ...temel, ayar: { ...ayar, haftalik: false }, simdi: new Date(2026, 10, 10, 12, 0) }).some(b => b.tur === 'haftalik')).toBe(false);
  });

  it('sessiz saatlere (22:00–08:00) hiçbir şey düşmez; erken sabah saati 08:00e çekilir', () => {
    const plan = bildirimPlani({ ...temel, ayar: { ...ayar, reminderTime: '06:00' }, simdi: new Date(2026, 10, 10, 5, 0) });
    plan.forEach(b => { expect(b.tarih.getHours()).toBeGreaterThanOrEqual(SESSIZ_BIT); expect(b.tarih.getHours()).toBeLessThan(SESSIZ_BAS); });
  });

  it('dolap yoksa sabah bildirimi genel metinle gelir', () => {
    const plan = bildirimPlani({ ...temel, dolap: [], ayar, simdi: new Date(2026, 10, 10, 7, 0) });
    expect(plan.find(b => b.tur === 'sabah')?.baslik).toBe('Günaydın');
  });
});

// ───────────── Arkadaş uyumu ─────────────
import { profilKodu, kodCoz, kokuUyumu } from '../engine/friend';

describe('arkadaş uyumu', () => {
  const ben = prefs({ userName: 'Yusuf İzzet', aura: 'gizemli', kokuTipleri: ['Odunsu', 'Amber'], sevilenParfumler: [katalog[0].id] });
  it('profil kodu Türkçe karakterlerle gidip gelir ve kişisel veri taşımaz', () => {
    const kod = profilKodu(ben, 4.9, true);
    expect(kod.startsWith('TEN1-')).toBe(true);
    const c = kodCoz(`  ${kod}\n`)!;
    expect(c.ad).toBe('Yusuf');
    expect(c.aileler).toEqual(['Odunsu', 'Amber']);
    expect(JSON.stringify(c)).not.toMatch(/ciltTipi|kacinilacak|butce/);
    expect(kodCoz(profilKodu(ben, 4.9, false))!.ad).toBeUndefined();
  });
  it('bozuk kodda null döner', () => {
    expect(kodCoz('merhaba')).toBeNull();
    expect(kodCoz('TEN1-!!!')).toBeNull();
  });
  it('aynı zevk yüksek, farklı zevk düşük uyum verir; hediye önerisi döner', () => {
    const ayni = kokuUyumu(ben, 4.9, kodCoz(profilKodu(ben, 4.9, false))!, katalog);
    const farkli = kokuUyumu(ben, 4.9, { v: 1, ph: 5.8, aura: 'dinamik', aileler: ['Ferah', 'Aquatik'], sevilen: [], cinsiyet: null }, katalog);
    expect(ayni.yuzde).toBeGreaterThan(farkli.yuzde);
    expect(ayni.yuzde).toBeGreaterThanOrEqual(75);
    expect(farkli.onaHediye.length).toBeGreaterThan(0);
    expect(ayni.ikiniziUyan.length).toBe(4);
  });
});

// ───────────── Widget verisi ─────────────
import { widgetVerisi } from '../services/widgetPlan';

describe('widget verisi', () => {
  const simdi = new Date(2026, 10, 27, 14, 0);
  const temel = { simdi, prefs: prefs({ userName: 'Yusuf İzzet' }), ph: 5.0, katalog, gecmis: [] as { parfumId: string; date: string }[], seri: 3, seriTarih: '2026-11-26' };
  it('dolap varsa 7 gün dolaptan, art arda aynı parfüm olmadan seçer', () => {
    const dolap = katalog.slice(0, 4);
    const v = widgetVerisi({ ...temel, dolap });
    expect(v.gunler).toHaveLength(7);
    expect(v.gunler[0].tarih).toBe('2026-11-27');
    expect(v.gunler.every(g => dolap.some(p => p.id === g.parfumId))).toBe(true);
    for (let i = 1; i < 7; i++) expect(v.gunler[i].parfumId).not.toBe(v.gunler[i - 1].parfumId);
    expect(v.ad).toBe('Yusuf');
    expect(v.dolaptan).toBe(true);
  });
  it('bugünün seçimi ekrandan gelenle ezilir; bugünkü kayıt yansır', () => {
    const p = katalog[10];
    const v = widgetVerisi({ ...temel, dolap: [], bugunSecim: { parfum: p, gerekce: 'Test gerekçesi' }, gecmis: [{ parfumId: katalog[3].id, date: '2026-11-27' }] });
    expect(v.gunler[0].parfumId).toBe(p.id);
    expect(v.gunler[0].gerekce).toBe('Test gerekçesi');
    expect(v.kayit?.parfumId).toBe(katalog[3].id);
    expect(v.dolaptan).toBe(false);
  });
});

describe('danışman hediye notu', () => {
  it('hediye kartları kullanıcının teninden söz etmez', () => {
    const { danismanCevabi, soruyuAyristir } = require('../engine/advisor');
    const c = danismanCevabi(soruyuAyristir("Anneme 3.000 TL'ye hediye ne alayım?", katalog), { katalog, dolap: [], prefs: prefs({}), ph: 5.0 });
    expect(c.oneriler.length).toBeGreaterThan(0);
    c.oneriler.forEach((o: { not: string }) => expect(o.not).not.toMatch(/ten/i));
  });
});

// ───────────── Öğrenen motor ─────────────
import { kisiselModel, ogrenmeDuzeltmesi, beklenenKalicilik, OGRENME_MAX, OgrenmeGirdisi } from '../engine/learning';
import { skorlaParfum as skorlaPF } from '../engine/scoring';
import { zevkBaglami as zevkB } from '../engine/similarity';

describe('öğrenen motor', () => {
  const odunsu = katalog.filter(p => p.tip === 'Odunsu');
  const ferah = katalog.filter(p => p.tip === 'Ferah');
  const temelPrefs = prefs({});
  const g = (over: Partial<OgrenmeGirdisi> = {}): OgrenmeGirdisi => ({
    bugun: '2026-11-27', katalog, prefs: temelPrefs, ph: 5.0, dolap: [], favoriler: [], gunluk: [], degerlendirmeler: [], gecilenler: [], reddedilen: [], ...over,
  });
  const log = (parfumId: string, longevity: number, extra: Partial<{ compliment: boolean; personalRating: number; date: string }> = {}) => ({
    id: parfumId + longevity + Math.random(), parfumId, date: extra.date ?? '2026-11-20', longevity, compliment: extra.compliment ?? false,
    personalRating: extra.personalRating ?? 6, createdAt: '2026-11-20',
  });

  it('veri yokken hiçbir şeyi değiştirmez', () => {
    const m = kisiselModel(g());
    expect(m.sinyalSayisi).toBe(0);
    expect(ogrenmeDuzeltmesi(odunsu[0], m).delta).toBe(0);
  });

  it('sık seçilen aileye yatkınlık öğrenir ve o aileyi öne alır', () => {
    const gunluk = odunsu.slice(0, 4).flatMap((p, i) => [{ parfumId: p.id, date: `2026-11-${10 + i}` }, { parfumId: p.id, date: `2026-11-${20 + i}` }]);
    const m = kisiselModel(g({ gunluk, dolap: [odunsu[0].id] }));
    expect(m.aileEgilim.Odunsu!).toBeGreaterThan(0.35);
    expect(m.tespitler.some(t => t.id === 'aile:Odunsu' && t.yon === 1)).toBe(true);
    const yeniOdunsu = odunsu[5];
    expect(ogrenmeDuzeltmesi(yeniOdunsu, m).delta).toBeGreaterThan(ogrenmeDuzeltmesi(ferah[0], m).delta);
  });

  it('ten kalibrasyonu: beklenenden uzun kalan aile puan ve ten gerekçesi kazanır', () => {
    const secilen = odunsu.slice(0, 3);
    secilen.forEach(p => expect(beklenenKalicilik(p, temelPrefs, 5.0)).toBeLessThan(5));
    const m = kisiselModel(g({ degerlendirmeler: secilen.map(p => log(p.id, 5)) }));
    expect(m.kalicilik.Odunsu!.sapma).toBeGreaterThan(0);
    expect(m.tespitler.find(t => t.id === 'kalicilik:Odunsu')!.metin).toMatch(/uzun kalıyor/);
    const e = ogrenmeDuzeltmesi(odunsu[4], m);
    expect(e.delta).toBeGreaterThan(0);
    expect(e.ten).toBe(true);
  });

  it('kısa kalan aile için uyarı verir', () => {
    const m = kisiselModel(g({ degerlendirmeler: ferah.slice(0, 3).map(p => log(p.id, 1)) }));
    const e = ogrenmeDuzeltmesi(ferah[4], m);
    expect(e.delta).toBeLessThan(0);
    expect(e.uyari).toMatch(/kısa kalıyor/);
  });

  it('"Bu doğru değil" denen tespitin etkisi kalkar', () => {
    const degerlendirmeler = odunsu.slice(0, 3).map(p => log(p.id, 5));
    const m = kisiselModel(g({ degerlendirmeler, reddedilen: ['kalicilik:Odunsu', 'kalicilik:genel'] }));
    expect(m.kalicilik.Odunsu).toBeUndefined();
    expect(m.tespitler.some(t => t.id === 'kalicilik:Odunsu')).toBe(false);
  });

  it('eski sinyal yenisinden zayıftır ve toplam etki sınırlıdır', () => {
    const yeni = kisiselModel(g({ gunluk: odunsu.slice(0, 3).map(p => ({ parfumId: p.id, date: '2026-11-25' })) }));
    const eski = kisiselModel(g({ gunluk: odunsu.slice(0, 3).map(p => ({ parfumId: p.id, date: '2026-03-01' })) }));
    expect(yeni.aileEgilim.Odunsu!).toBeGreaterThan(eski.aileEgilim.Odunsu ?? 0);
    const asiri = kisiselModel(g({
      dolap: odunsu.map(p => p.id), favoriler: odunsu.map(p => p.id),
      degerlendirmeler: odunsu.map(p => log(p.id, 5, { compliment: true, personalRating: 10 })),
    }));
    odunsu.forEach(p => expect(Math.abs(ogrenmeDuzeltmesi(p, asiri).delta)).toBeLessThanOrEqual(OGRENME_MAX));
  });

  it('etkinliğe göre aile tercihini öğrenir', () => {
    const gunluk = ferah.slice(0, 3).map((p, i) => ({ parfumId: p.id, date: `2026-11-2${i}`, etkinlik: 'is' as const }));
    const m = kisiselModel(g({ gunluk }));
    expect(m.baglam.is!.Ferah!).toBeGreaterThanOrEqual(0.5);
    expect(m.tespitler.some(t => t.tur === 'baglam')).toBe(true);
    expect(ogrenmeDuzeltmesi(ferah[4], m, 'is').delta).toBeGreaterThan(ogrenmeDuzeltmesi(ferah[4], m).delta);
  });

  it('iltifat aldığı parfüme benzeyenleri öne alır', () => {
    const m = kisiselModel(g({ degerlendirmeler: [log(odunsu[0].id, 3, { compliment: true, personalRating: 9 })] }));
    expect(m.iltifatli).toContain(odunsu[0].id);
    const adaylar = katalog.filter(p => p.id !== odunsu[0].id).map(p => ({ p, e: ogrenmeDuzeltmesi(p, m) }));
    expect(adaylar.some(x => /İltifat aldığınız/.test(x.e.gerekce ?? ''))).toBe(true);
  });

  it('puanlamaya bağlıdır: öğrenilen aile eşleşme yüzdesini yükseltir', () => {
    const gunluk = odunsu.slice(0, 4).flatMap((p, i) => [{ parfumId: p.id, date: `2026-11-1${i}` }, { parfumId: p.id, date: `2026-11-2${i}` }]);
    const m = kisiselModel(g({ gunluk, degerlendirmeler: odunsu.slice(0, 3).map(p => log(p.id, 5)) }));
    const hedef = odunsu[6];
    const once = skorlaPF(hedef, temelPrefs, 5.0).matchPercentage;
    const sonra = skorlaPF(hedef, temelPrefs, 5.0, zevkB(katalog, temelPrefs, m)).matchPercentage;
    expect(sonra).toBeGreaterThan(once);
  });
});

// ───────────── Kişisel danışman (sohbet hafızası, yeni soru türleri) ─────────────
import { danismanCevabi as dc, soruyuAyristir as sa } from '../engine/advisor';
import { kisiselModel as km } from '../engine/learning';

describe('kişisel koku danışmanı', () => {
  const p0 = prefs({ userName: 'Yusuf', ciltTipi: 'kuru' } as any);
  const ph = getEffectivePH(p0);
  const ctx = (over: any = {}) => ({ katalog, dolap: [], prefs: p0, ph, ...over });
  const sor = (metin: string, over: any = {}) => dc(sa(metin, katalog), ctx(over));
  const tamDao = katalog.find(p => p.isim === 'Tam Dao')!;
  const explorer = katalog.find(p => p.isim === 'Explorer')!;

  it('tek parfüm sorusuna teninize göre cevap verir', () => {
    const n = sa('Tam Dao bana uyar mı?', katalog);
    expect(n.tur).toBe('parfum');
    const c = dc(n, ctx());
    expect(c.metin).toMatch(/Tam Dao.*%\d+/);
    expect(c.oneriler[0].parfum.id).toBe(tamDao.id);
  });

  it('iki parfümü karşılaştırır', () => {
    const n = sa('Tam Dao mu Explorer mı, akşam için?', katalog);
    expect(n.tur).toBe('karsilastir');
    const c = dc(n, ctx());
    expect(c.oneriler.map(o => o.parfum.id).sort()).toEqual([tamDao.id, explorer.id].sort());
    expect(c.metin).toMatch(/daha iyi bir seçim/);
  });

  it('bilgi sorusunu ten profiline göre cevaplar', () => {
    const n = sa('Parfümün kalıcılığını nasıl artırırım?', katalog);
    expect(n.tur).toBe('bilgi');
    expect(dc(n, ctx()).metin).toMatch(/kuru/);
  });

  it('"başka" önceki önerileri tekrarlamaz ve bağlamı korur', () => {
    const ilk = sor('Yaz için ferah bir parfüm öner');
    expect(ilk.oneriler.length).toBeGreaterThan(0);
    const ikinci = sor('başka', { onceki: ilk.durum });
    expect(ikinci.oneriler.length).toBeGreaterThan(0);
    const once = new Set(ilk.oneriler.map(o => o.parfum.id));
    ikinci.oneriler.forEach(o => expect(once.has(o.parfum.id)).toBe(false));
    expect(ikinci.durum!.niyet.mevsim).toBe('Yaz');
  });

  it('hediye sohbetinde "daha uygun fiyatlı" hediye olarak kalır ve kademeyi düşürür', () => {
    const ilk = sor("Anneme 5.000 TL'ye hediye ne alayım?");
    const ikinci = sor('daha uygun fiyatlı', { onceki: ilk.durum });
    expect(ikinci.durum!.niyet.tur).toBe('hediye');
    const sira: Record<string, number> = { ekonomik: 0, orta: 1, premium: 2, luks: 3 };
    const ilkMaks = Math.max(...ilk.oneriler.map(o => sira[o.parfum.fiyatAraligi ?? 'orta']));
    ikinci.oneriler.forEach(o => expect(sira[o.parfum.fiyatAraligi ?? 'orta']).toBeLessThan(ilkMaks));
  });

  it('"bunlardan hangisi akşam için" önceki önerilerden seçer', () => {
    const ilk = sor('Sonbahar için odunsu bir parfüm öner');
    const ikinci = sor('Bunlardan hangisi akşam için?', { onceki: ilk.durum });
    const once = new Set(ilk.oneriler.map(o => o.parfum.id));
    expect(ikinci.oneriler.length).toBeGreaterThan(0);
    ikinci.oneriler.forEach(o => expect(once.has(o.parfum.id)).toBe(true));
    expect(ikinci.metin).toMatch(/akşam için en iyisi/);
  });

  it('öğrenilenleri cevaba yansıtır (iltifat aldığı parfüm, "beni tanıyor musun")', () => {
    const log = { id: 'x', parfumId: tamDao.id, date: '2026-11-20', longevity: 5, compliment: true, personalRating: 10, createdAt: '2026-11-20' };
    const model = km({ bugun: '2026-11-27', katalog, prefs: p0, ph, dolap: [tamDao.id], favoriler: [], gunluk: [], degerlendirmeler: [log], gecilenler: [], reddedilen: [] });
    const zevk = { sevilenler: [], sevilmeyenler: [], ogrenme: model };
    const c = sor('Bugün dolabımdan ne sıkayım?', { dolap: [tamDao], zevk, degerlendirmeler: [log], tarih: new Date(2026, 10, 27, 10) });
    expect(c.metin).toMatch(/iltifat/);
    const ben = sor('Beni ne kadar tanıyorsun?', { zevk, gecmis: [{ parfumId: tamDao.id, date: '2026-11-26' }] });
    expect(sa('Beni ne kadar tanıyorsun?', katalog).tur).toBe('ben');
    expect(ben.metin).toMatch(/Tam Dao/);
  });
});

describe('danışman: dolap bitince katalog', () => {
  it('"başka" denince dolaptaki her şey gösterildiyse katalogdan yeni öneri verir', () => {
    const p0 = prefs({});
    const dolap = katalog.slice(0, 2);
    const ctx = { katalog, dolap, prefs: p0, ph: getEffectivePH(p0) };
    const ilk = danismanCevabi(soruyuAyristir('Bu akşam buluşmam var, dolabımdan ne sıkayım?', katalog), ctx);
    const ikinci = danismanCevabi(soruyuAyristir('Başka', katalog), { ...ctx, onceki: ilk.durum });
    expect(ikinci.metin).toMatch(/katalogdan/);
    ikinci.oneriler.forEach(o => expect(dolap.some(d => d.id === o.parfum.id)).toBe(false));
  });
});

describe('kısa onboarding + profil tamamlama', () => {
  const { onboardingSorulari, profilDoluluk } = require('../constants/questions');
  it('kısa akış temel soruları sorar (mevsim hariç)', () => {
    const ids = onboardingSorulari(prefs(), 'kisa').map((q: any) => q.id);
    expect(ids).toEqual(['cilt', 'isi', 'hassasiyet', 'butce', 'aura', 'aileler', 'kacin', 'cinsiyet']);
  });
  it('tamamlama temel ve cevaplanmış soruları sormaz', () => {
    const ids = onboardingSorulari(prefs({ terlemeOrani: 'cok' }), 'tamamla').map((q: any) => q.id);
    expect(ids).not.toContain('terleme');
    expect(ids).not.toContain('cilt');
    expect(ids).toContain('gozlenen_kalicilik');
  });
  it('atlanan soru doluluğa sayılır ve tekrar sorulmaz', () => {
    const once = profilDoluluk(prefs());
    const sonra = profilDoluluk(prefs({ atlananSorular: ['gumus'] }));
    expect(sonra.yuzde).toBeGreaterThan(once.yuzde);
    expect(onboardingSorulari(prefs({ atlananSorular: ['gumus'] }), 'tamamla').map((q: any) => q.id)).not.toContain('gumus');
  });
});

describe('arama bağlamı: mevsim otomatik, durum tek dokunuşla', () => {
  const { etkinTercihler, baglamAktif } = require('../engine');
  const { onboardingSorulari } = require('../constants/questions');
  it('mevsim onboarding\'de sorulmaz', () => {
    expect(onboardingSorulari(prefs(), 'tam').map((q: any) => q.id)).not.toContain('mevsim');
  });
  it('mevsim seçilmediyse tarihten gelir (eski kayıtlı cevap yok sayılır)', () => {
    expect(etkinTercihler(prefs({ mevsim: 'Kış' }), {}, new Date(2026, 6, 10)).mevsim).toBe('Yaz');
    expect(etkinTercihler(prefs(), {}, new Date(2026, 11, 20)).mevsim).toBe('Kış');
  });
  it('bağlam profili ezer ama profili değiştirmez', () => {
    const p = prefs({ kullanimAmaci: ['is'], ortam: 'kapali' });
    const e = etkinTercihler(p, { kullanimAmaci: ['aksam'], mevsim: 'Yaz' });
    expect(e.kullanimAmaci).toEqual(['aksam']);
    expect(e.ortam).toBe('kapali');
    expect(e.mevsim).toBe('Yaz');
    expect(p.kullanimAmaci).toEqual(['is']);
    expect(baglamAktif({})).toBe(false);
    expect(baglamAktif({ ortam: 'acik' })).toBe(true);
  });
  it('mevsim bağlamı öneri sırasını değiştirir', () => {
    const yaz = getRecommendationsPure(katalog, etkinTercihler(prefs(), { mevsim: 'Yaz' }), undefined, 10).map((r: any) => r.parfum.id);
    const kis = getRecommendationsPure(katalog, etkinTercihler(prefs(), { mevsim: 'Kış' }), undefined, 10).map((r: any) => r.parfum.id);
    expect(yaz).not.toEqual(kis);
  });
});
