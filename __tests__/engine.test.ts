import { hesaplaPHPure, hesaplaParfumPHSkoruPure } from '../engine/index';
import { UserPreferences, Parfum, KokuTipi, Cinsiyet, KokuYogunlugu, KalicilikTercihi, Ortam } from '../types';

describe('Engine Logic Tests', () => {
  describe('hesaplaPHPure', () => {
    it('should correctly halve effects when suTuketimi is cok', () => {
      const mockPreferences: UserPreferences = {
        phInfo: { biliyorMu: 'bilmiyorum', deger: null, tahminiDeger: null, aralik: null },
        ciltTipi: 'kuru', // +0.2 asidik
        gumusOksitlenme: 'asidik', // +0.5 asidik
        beslenmeAliskanligi: 'asidik', // +0.4 asidik
        terlemeOrani: 'az', // 0
        parfumReaksiyonu: 'eksi_uzaklasir', // +0.4 asidik
        suTuketimi: 'cok', // halver
        vucutIsisi: 'sicak',
        uygulamaYeri: 'sadece_ten',
        kokuAlmaHassasiyeti: 'normal',
        aura: 'temiz',
        kokuTipleri: [],
        kacinilacakNotalar: [],
        cinsiyetAlgisi: 'unisex',
        ortam: 'her_ikisi',
        kiyafetStili: 'casual',
      };

      // Total asidik = 0.2 + 0.5 + 0.4 + 0.4 = 1.5
      // With suTuketimi = 'cok', it should be 1.5 * 0.5 = 0.75
      // Expected pH = 5.5 - 0.75 = 4.75
      const result = hesaplaPHPure(mockPreferences);
      expect(result.tahminiPH).toBeCloseTo(4.75, 2);
    });

    it('should correctly calculate guvenilirlik', () => {
      const mockPreferences: UserPreferences = {
        phInfo: { biliyorMu: 'bilmiyorum', deger: null, tahminiDeger: null, aralik: null },
        ciltTipi: null,
        gumusOksitlenme: 'emin_degil', // -5
        beslenmeAliskanligi: 'alkali', // +10
        terlemeOrani: 'normal', // +10
        parfumReaksiyonu: 'ayni_kalir', // +15
        suTuketimi: 'normal', // +5
        vucutIsisi: null,
        uygulamaYeri: null,
        kokuAlmaHassasiyeti: null,
        aura: null,
        kokuTipleri: [],
        kacinilacakNotalar: [],
        cinsiyetAlgisi: null,
        ortam: null,
        kiyafetStili: null,
      };

      // Base: 50. emin_degil: -5. beslenme: +10. terleme: +10. reaksiyon: +15. su: +5.
      // Total = 50 - 5 + 10 + 10 + 15 + 5 = 85
      const result = hesaplaPHPure(mockPreferences);
      expect(result.guvenilirlik).toBe(85);
    });
  });

  describe('hesaplaParfumPHSkoruPure', () => {
    const mockParfum: Parfum = {
      id: 'test-1',
      isim: 'Test Parfum',
      notalar: { ust: [], orta: [], alt: [] },
      tip: 'Ferah' as KokuTipi,
      mevsim: [],
      cinsiyet: 'unisex' as Cinsiyet,
      yogunluk: 'orta' as KokuYogunlugu,
      kalicilik: 'orta' as KalicilikTercihi,
      kullanimAmaci: [],
      iklim: [],
      ortam: 'her_ikisi' as Ortam,
      aktivite: [],
      kiyafetStili: [],
      aciklama: '',
      etiketler: [],
      phUyumu: {
        minPH: 4.5,
        maxPH: 6.5,
        idealPH: 5.5,
        asidikEtki: 'Asidik etki',
        bazikEtki: 'Bazik etki'
      },
      notaKalicilik: {
        ust: { asidikCilt: 0.1, bazikCilt: -0.1, kuruCilt: -0.2, yagliCilt: 0.2 },
        orta: { asidikCilt: 0.2, bazikCilt: 0, kuruCilt: -0.1, yagliCilt: 0.1 },
        alt: { asidikCilt: -0.1, bazikCilt: 0.3, kuruCilt: -0.1, yagliCilt: 0.3 },
      }
    };

    it('should calculate phUyumSkoru correctly for ideal pH', () => {
      const result = hesaplaParfumPHSkoruPure(mockParfum, 5.5, 'normal');
      expect(result.phUyumSkoru).toBe(100);
    });

    it('should calculate kalicilikModifikasyonu based on ciltTipi', () => {
      const resultKuru = hesaplaParfumPHSkoruPure(mockParfum, 5.5, 'kuru');
      expect(resultKuru.kalicilikModifikasyonu).toBe(-0.2);

      const resultYagli = hesaplaParfumPHSkoruPure(mockParfum, 5.5, 'yagli');
      expect(resultYagli.kalicilikModifikasyonu).toBe(0.3);
    });
  });
});
