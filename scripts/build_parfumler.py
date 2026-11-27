#!/usr/bin/env python3
"""
Gerçek parfüm kataloğunu üretir → data/parfumler.json içindeki "parfumler" dizisini yeniler
(diğer anahtarlar — kokuTipleri, notalar vb. — korunur).

Kaynak tablo aşağıdadır (elle küratörlü). Notalar markaların yayımladığı nota
piramitlerine göre Türkçeleştirilmiştir; YAYIN ÖNCESİ her satırı markanın resmi
sayfasıyla doğrulayın. Görsel / marka logosu KULLANILMAZ (telif).

pH uyumu ve nota kalıcılığı burada YAZILMAZ: uygulama açılışında
engine/perfume-chemistry.ts → zenginlestirParfum() notalardan hesaplar.

Kullanım:  python3 scripts/build_parfumler.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'data', 'parfumler.json')

S = {'I': 'İlkbahar', 'Y': 'Yaz', 'S': 'Sonbahar', 'K': 'Kış'}
G = {'K': 'kadın', 'E': 'erkek', 'U': 'unisex'}
D = {'h': 'hafif', 'o': 'orta', 'y': 'yogun'}
L = {'k': 'kisa', 'o': 'orta', 'u': 'uzun'}
C = {'edc': 'eau_de_cologne', 'edt': 'eau_de_toilette', 'edp': 'eau_de_parfum', 'p': 'parfum'}

# (isim, marka, cinsiyet, tip, ikincilTip, ust, orta, alt, mevsim, yoğunluk, kalıcılık,
#  konsantrasyon, kullanım, izlenim, kişilik, fiyat)
R = [
    # ---------- Erkek ----------
    ('Sauvage', 'Dior', 'E', 'Ferah', 'Baharatlı', 'bergamot, karabiber', 'Sichuan biberi, lavanta, pembe biber, vetiver, paçuli, sardunya', 'ambroksan, sedir, labdanum', 'IYS', 'o', 'u', 'edt', 'gunluk is aksam', 'taze enerjik cekici', 'dinamik cesur', 'premium'),
    ('Bleu de Chanel', 'Chanel', 'E', 'Odunsu', 'Ferah', 'greyfurt, limon, nane, pembe biber', 'zencefil, muskat, yasemin', 'tütsü, vetiver, sedir, sandal ağacı, paçuli, labdanum, beyaz misk', 'IYSK', 'o', 'u', 'edp', 'gunluk is aksam', 'profesyonel taze', 'sofistike', 'luks'),
    ('Acqua di Giò', 'Giorgio Armani', 'E', 'Aquatik', 'Ferah', 'limon, bergamot, neroli, mandalina, yeşil notalar', 'deniz notaları, yasemin, biberiye, frezya', 'beyaz misk, sedir, meşe yosunu, paçuli, amber', 'IY', 'h', 'o', 'edt', 'gunluk is spor', 'taze profesyonel', 'dogal', 'premium'),
    ('Aventus', 'Creed', 'E', 'Meyvemsi', 'Odunsu', 'ananas, bergamot, siyah frenk üzümü, elma', 'huş, paçuli, yasemin', 'misk, meşe yosunu, ambergris, vanilya', 'IYS', 'o', 'u', 'edp', 'is aksam ozel', 'cekici profesyonel', 'cesur sofistike', 'luks'),
    ("Terre d'Hermès", 'Hermès', 'E', 'Odunsu', 'Ferah', 'portakal, greyfurt', 'karabiber, sardunya, çakmaktaşı', 'vetiver, sedir, paçuli, benzoin', 'IS', 'o', 'u', 'edt', 'gunluk is', 'profesyonel', 'dogal sofistike', 'premium'),
    ('Dior Homme Intense', 'Dior', 'E', 'Pudralı', 'Odunsu', 'lavanta', 'iris, ambrette, armut', 'vetiver, sedir', 'SK', 'o', 'u', 'edp', 'aksam ozel romantik', 'gizemli cekici', 'sofistike romantik', 'luks'),
    ('Le Male', 'Jean Paul Gaultier', 'E', 'Oryantal', 'Tatlı', 'nane, kakule, bergamot, pelin otu', 'lavanta, tarçın, portakal çiçeği, kimyon', 'vanilya, tonka fasulyesi, amber, sandal ağacı, sedir', 'SK', 'y', 'u', 'edt', 'aksam ozel', 'cekici sicak', 'cesur', 'premium'),
    ('Eros', 'Versace', 'E', 'Tatlı', 'Ferah', 'nane, yeşil elma, limon', 'tonka fasulyesi, ambroksan, sardunya', 'vanilya, sedir, vetiver, meşe yosunu', 'ISK', 'y', 'u', 'edt', 'aksam ozel', 'cekici enerjik', 'cesur dinamik', 'orta'),
    ('1 Million', 'Paco Rabanne', 'E', 'Baharatlı', 'Tatlı', 'greyfurt, nane, kan portakalı', 'gül, tarçın, baharatlar', 'deri, amber, odunsu notalar, paçuli', 'SK', 'y', 'u', 'edt', 'aksam ozel', 'cekici sicak', 'cesur', 'orta'),
    ('Spicebomb', 'Viktor&Rolf', 'E', 'Baharatlı', 'Deri', 'pembe biber, elemi, bergamot, greyfurt', 'tarçın, safran, acı biber', 'tütün, deri, vetiver', 'SK', 'y', 'u', 'edt', 'aksam ozel', 'gizemli sicak', 'cesur', 'premium'),
    ('Y Eau de Parfum', 'Yves Saint Laurent', 'E', 'Ferah', 'Odunsu', 'elma, zencefil, bergamot', 'adaçayı, ardıç meyvesi, sardunya', 'amber, tonka fasulyesi, sedir, vetiver, tütsü', 'IYS', 'o', 'u', 'edp', 'gunluk is aksam', 'enerjik profesyonel', 'dinamik', 'premium'),
    ("L'Homme", 'Prada', 'E', 'Pudralı', 'Odunsu', 'neroli, karabiber', 'iris, menekşe, sardunya', 'amber, paçuli, sedir', 'IS', 'o', 'o', 'edt', 'is gunluk', 'profesyonel taze', 'sofistike', 'premium'),
    ('Allure Homme Sport', 'Chanel', 'E', 'Ferah', 'Aquatik', 'portakal, deniz notaları, aldehitler, mandalina', 'karabiber, neroli, sedir', 'tonka fasulyesi, vanilya, beyaz misk, vetiver, amber', 'IY', 'o', 'o', 'edt', 'spor gunluk', 'enerjik taze', 'dinamik', 'premium'),
    ('Invictus', 'Paco Rabanne', 'E', 'Aquatik', 'Odunsu', 'deniz notaları, greyfurt, mandalina', 'defne yaprağı, yasemin', 'guaiac ağacı, meşe yosunu, paçuli, ambergris', 'IY', 'o', 'o', 'edt', 'spor gunluk', 'enerjik', 'dinamik cesur', 'orta'),
    ('Explorer', 'Montblanc', 'E', 'Odunsu', 'Deri', 'bergamot, gül, adaçayı', 'vetiver, deri, sandal ağacı', 'paçuli, ambroksan, akigalawood', 'IS', 'o', 'u', 'edp', 'is gunluk', 'profesyonel', 'cesur', 'orta'),
    ('Boss Bottled', 'Hugo Boss', 'E', 'Odunsu', 'Baharatlı', 'elma, erik, bergamot, limon', 'tarçın, karanfil, sardunya', 'vanilya, sandal ağacı, sedir, vetiver', 'SK', 'o', 'o', 'edt', 'is gunluk aksam', 'profesyonel sicak', 'sofistike', 'orta'),
    ('Light Blue pour Homme', 'Dolce&Gabbana', 'E', 'Ferah', 'Aquatik', 'greyfurt, bergamot, mandalina, ardıç', 'biberiye, Sichuan biberi, gül ağacı', 'paçuli, misk, tütsü, meşe yosunu', 'Y', 'h', 'o', 'edt', 'gunluk spor', 'taze enerjik', 'dinamik', 'orta'),
    ('Ombré Leather', 'Tom Ford', 'E', 'Deri', 'Odunsu', 'kakule', 'deri, yasemin', 'amber, yosun, paçuli', 'SK', 'y', 'u', 'edp', 'aksam ozel', 'gizemli cekici', 'cesur', 'luks'),
    ('Armani Code', 'Giorgio Armani', 'E', 'Oryantal', 'Baharatlı', 'yeşil mandalina, bergamot', 'lavanta', 'tonka fasulyesi, sedir, deri', 'SK', 'o', 'u', 'edt', 'aksam romantik', 'cekici gizemli', 'romantik sofistike', 'premium'),
    ('Fahrenheit', 'Dior', 'E', 'Deri', 'Odunsu', 'lavanta, mandalina, bergamot, limon', 'menekşe yaprağı, muskat, sedir, yasemin', 'deri, vanilya, vetiver, misk, amber', 'SK', 'y', 'u', 'edt', 'aksam', 'gizemli', 'cesur sofistike', 'premium'),
    ('Luna Rossa Carbon', 'Prada', 'E', 'Ferah', 'Odunsu', 'bergamot, karabiber', 'lavanta, metalik notalar', 'ambroksan, paçuli', 'IYS', 'o', 'u', 'edt', 'gunluk spor is', 'enerjik taze', 'dinamik', 'premium'),
    ("L'Eau d'Issey pour Homme", 'Issey Miyake', 'E', 'Ferah', 'Odunsu', 'yuzu, mandalina, bergamot, limon, kişniş', 'nilüfer, muskat, sardunya, tarçın, safran', 'vetiver, sedir, misk, tütün, sandal ağacı, amber', 'IY', 'h', 'o', 'edt', 'gunluk is', 'taze', 'dogal', 'orta'),
    ('Layton', 'Parfums de Marly', 'E', 'Tatlı', 'Baharatlı', 'elma, lavanta, bergamot, mandalina', 'sardunya, menekşe, yasemin', 'vanilya, kakule, sandal ağacı, karabiber, paçuli, guaiac ağacı', 'SK', 'y', 'u', 'edp', 'aksam ozel', 'cekici sicak', 'sofistike cesur', 'luks'),
    ('Jazz Club', 'Maison Margiela', 'E', 'Oryantal', 'Tatlı', 'pembe biber, neroli, limon', 'rom, adaçayı', 'tütün yaprağı, vanilya, stiraks', 'SK', 'o', 'o', 'edt', 'aksam', 'sicak gizemli', 'sofistike', 'premium'),
    ('Legend', 'Montblanc', 'E', 'Ferah', 'Odunsu', 'lavanta, bergamot', 'sedir, gül, yasemin', 'meşe yosunu, sandal ağacı, tonka fasulyesi', 'IYS', 'o', 'o', 'edt', 'gunluk is', 'taze profesyonel', 'dinamik', 'orta'),
    ('Guilty pour Homme', 'Gucci', 'E', 'Odunsu', 'Ferah', 'lavanta, limon', 'portakal çiçeği', 'paçuli, sedir', 'IS', 'o', 'o', 'edt', 'is gunluk', 'profesyonel', 'sofistike', 'premium'),
    ('The One for Men', 'Dolce&Gabbana', 'E', 'Oryantal', 'Baharatlı', 'greyfurt, kişniş, fesleğen', 'zencefil, kakule, portakal çiçeği', 'tütün, amber, sedir', 'SK', 'o', 'u', 'edp', 'aksam romantik', 'cekici sicak', 'sofistike', 'premium'),
    ('Club de Nuit Intense Man', 'Armaf', 'E', 'Meyvemsi', 'Odunsu', 'limon, ananas, bergamot, siyah frenk üzümü, elma', 'huş, yasemin, gül', 'misk, ambergris, paçuli, vanilya', 'IYS', 'y', 'u', 'edt', 'aksam gunluk', 'cekici enerjik', 'cesur', 'ekonomik'),

    # ---------- Kadın ----------
    ('Coco Mademoiselle', 'Chanel', 'K', 'Çiçeksi', 'Odunsu', 'portakal, mandalina, bergamot, portakal çiçeği', 'gül, yasemin, mimoza, ylang-ylang', 'paçuli, beyaz misk, vanilya, vetiver, tonka fasulyesi, labdanum', 'ISK', 'o', 'u', 'edp', 'gunluk is aksam', 'cekici profesyonel', 'sofistike romantik', 'luks'),
    ('N°5', 'Chanel', 'K', 'Çiçeksi', 'Pudralı', 'aldehitler, ylang-ylang, neroli, bergamot, şeftali', 'iris, yasemin, gül, zambak', 'sandal ağacı, vanilya, vetiver, amber, misk, paçuli', 'ISK', 'o', 'u', 'edp', 'aksam ozel is', 'profesyonel gizemli', 'sofistike romantik', 'luks'),
    ('La Vie Est Belle', 'Lancôme', 'K', 'Tatlı', 'Çiçeksi', 'siyah frenk üzümü, armut', 'iris, yasemin, portakal çiçeği', 'pralin, vanilya, paçuli, tonka fasulyesi', 'SK', 'y', 'u', 'edp', 'gunluk aksam romantik', 'sicak cekici', 'romantik', 'premium'),
    ('Black Opium', 'Yves Saint Laurent', 'K', 'Oryantal', 'Tatlı', 'armut, mandalina, pembe biber', 'portakal çiçeği, yasemin, kahve, acı badem, meyan kökü', 'vanilya, paçuli, sedir, kaşmir ağacı', 'SK', 'y', 'u', 'edp', 'aksam ozel', 'cekici gizemli', 'cesur', 'premium'),
    ("J'adore", 'Dior', 'K', 'Çiçeksi', 'Meyvemsi', 'armut, kavun, manolya, şeftali, mandalina, bergamot', 'ylang-ylang, gül, yasemin, sambac yasemini, tuberoz, menekşe, inci çiçeği', 'misk, vanilya, sedir', 'IY', 'o', 'u', 'edp', 'gunluk is ozel', 'cekici profesyonel', 'romantik sofistike', 'luks'),
    ('Good Girl', 'Carolina Herrera', 'K', 'Oryantal', 'Tatlı', 'badem, kahve, bergamot, limon', 'tuberoz, yasemin, portakal çiçeği, gül', 'tonka fasulyesi, kakao, vanilya, pralin, sandal ağacı, misk, amber, tarçın', 'SK', 'y', 'u', 'edp', 'aksam ozel', 'cekici gizemli', 'cesur', 'premium'),
    ('Libre', 'Yves Saint Laurent', 'K', 'Çiçeksi', 'Amber', 'mandalina, lavanta, neroli', 'portakal çiçeği, sambac yasemini', 'misk, vanilya', 'ISK', 'o', 'u', 'edp', 'gunluk is aksam', 'profesyonel cekici', 'cesur sofistike', 'premium'),
    ('Flowerbomb', 'Viktor&Rolf', 'K', 'Çiçeksi', 'Tatlı', 'çay, bergamot, frezya', 'sambac yasemini, orkide, gül', 'paçuli, misk', 'ISK', 'y', 'u', 'edp', 'aksam romantik ozel', 'cekici sicak', 'romantik', 'premium'),
    ('Light Blue', 'Dolce&Gabbana', 'K', 'Ferah', 'Meyvemsi', 'limon, elma, sedir, çan çiçeği', 'bambu, yasemin, beyaz gül', 'sedir, misk, amber', 'IY', 'h', 'o', 'edt', 'gunluk spor', 'taze enerjik', 'dogal dinamik', 'orta'),
    ('Sì', 'Giorgio Armani', 'K', 'Meyvemsi', 'Tatlı', 'siyah frenk üzümü', 'gül, frezya', 'vanilya, paçuli, ambroksan', 'ISK', 'o', 'u', 'edp', 'gunluk aksam is', 'cekici profesyonel', 'sofistike', 'premium'),
    ('Alien', 'Mugler', 'K', 'Çiçeksi', 'Amber', 'yasemin', 'kaşmir ağacı', 'beyaz amber', 'SK', 'y', 'u', 'edp', 'aksam ozel', 'gizemli cekici', 'mistik', 'premium'),
    ('Daisy', 'Marc Jacobs', 'K', 'Çiçeksi', 'Meyvemsi', 'çilek, menekşe yaprağı, kırmızı greyfurt', 'gardenya, menekşe, yasemin', 'beyaz odunsu notalar, misk, vanilya', 'IY', 'h', 'o', 'edt', 'gunluk', 'taze enerjik', 'dogal romantik', 'orta'),
    ('Cloud', 'Ariana Grande', 'K', 'Tatlı', 'Pudralı', 'lavanta, armut, bergamot', 'krem şanti, pralin, hindistan cevizi, vanilya orkidesi', 'misk, odunsu notalar', 'SK', 'o', 'o', 'edp', 'gunluk aksam', 'sicak cekici', 'romantik', 'ekonomik'),
    ('Chloé', 'Chloé', 'K', 'Çiçeksi', 'Pudralı', 'şakayık, frezya, liçi', 'gül, manolya, inci çiçeği', 'sedir, ambergris', 'I', 'o', 'o', 'edp', 'gunluk is', 'profesyonel taze', 'romantik sofistike', 'premium'),
    ('Idôle', 'Lancôme', 'K', 'Çiçeksi', 'Odunsu', 'bergamot, armut, pembe biber', 'gül, yasemin', 'beyaz misk, vanilya, paçuli, sedir', 'IYS', 'h', 'o', 'edp', 'gunluk is', 'taze profesyonel', 'dinamik', 'premium'),
    ('Olympéa', 'Paco Rabanne', 'K', 'Tatlı', 'Amber', 'yeşil mandalina, su yasemini, zencefil çiçeği', 'tuzlu vanilya', 'kaşmir ağacı, ambergris, sandal ağacı', 'SK', 'o', 'u', 'edp', 'aksam', 'cekici sicak', 'cesur', 'orta'),
    ('Donna Born in Roma', 'Valentino', 'K', 'Oryantal', 'Çiçeksi', 'siyah frenk üzümü, pembe biber, bergamot', 'yasemin, yasemin çayı', 'vanilya, kaşmir ağacı, guaiac ağacı', 'SK', 'y', 'u', 'edp', 'aksam ozel', 'cekici', 'cesur', 'premium'),
    ('Shalimar', 'Guerlain', 'K', 'Oryantal', 'Pudralı', 'bergamot, limon, mandalina', 'iris, yasemin, gül', 'vanilya, tonka fasulyesi, tütsü, deri, opoponaks, sandal ağacı', 'SK', 'y', 'u', 'edp', 'aksam ozel', 'gizemli sicak', 'sofistike mistik', 'premium'),
    ('Chance Eau Tendre', 'Chanel', 'K', 'Çiçeksi', 'Meyvemsi', 'ayva, greyfurt', 'sümbül, yasemin', 'beyaz misk, iris, sedir, amber', 'IY', 'h', 'o', 'edt', 'gunluk is', 'taze enerjik', 'romantik dogal', 'luks'),
    ('Le Parfum', 'Elie Saab', 'K', 'Çiçeksi', 'Amber', 'portakal çiçeği', 'yasemin, gül', 'bal, paçuli, sedir', 'IS', 'o', 'u', 'edp', 'is aksam ozel', 'profesyonel cekici', 'sofistike romantik', 'premium'),
    ('Her', 'Burberry', 'K', 'Meyvemsi', 'Tatlı', 'çilek, ahududu, böğürtlen, vişne, mandalina, limon', 'menekşe, yasemin', 'misk, vanilya, kaşmir ağacı, amber, paçuli, meşe yosunu', 'IS', 'o', 'o', 'edp', 'gunluk', 'enerjik sicak', 'dinamik', 'premium'),
    ('Delina', 'Parfums de Marly', 'K', 'Çiçeksi', 'Meyvemsi', 'liçi, ravent, bergamot, muskat', 'Türk gülü, şakayık, misk, vanilya', 'kaşmir ağacı, sedir, vetiver, tütsü', 'IS', 'o', 'u', 'edp', 'aksam ozel romantik', 'cekici', 'romantik sofistike', 'luks'),
    ("L'Interdit", 'Givenchy', 'K', 'Çiçeksi', 'Odunsu', 'bergamot, zencefil', 'portakal çiçeği, sambac yasemini, tuberoz', 'paçuli, vetiver', 'ISK', 'o', 'u', 'edp', 'aksam ozel', 'cekici gizemli', 'cesur romantik', 'premium'),
    ('Flower by Kenzo', 'Kenzo', 'K', 'Pudralı', 'Çiçeksi', 'Bulgar gülü, siyah frenk üzümü, mandalina, bergamot', 'menekşe, gül, yasemin, opoponaks', 'vanilya, beyaz misk, tütsü', 'IS', 'o', 'u', 'edp', 'gunluk aksam', 'sicak cekici', 'romantik', 'orta'),
    ('Paradoxe', 'Prada', 'K', 'Çiçeksi', 'Tatlı', 'armut, bergamot, mandalina', 'neroli, yasemin, portakal çiçeği', 'vanilya, ambergris, beyaz misk, benzoin', 'ISK', 'o', 'u', 'edp', 'gunluk aksam', 'cekici profesyonel', 'sofistike', 'premium'),
    ('Bright Crystal', 'Versace', 'K', 'Meyvemsi', 'Çiçeksi', 'yuzu, nar, buz akoru', 'şakayık, manolya, nilüfer', 'misk, maun, amber', 'IY', 'h', 'o', 'edt', 'gunluk', 'taze enerjik', 'romantik dogal', 'orta'),

    # ---------- Unisex ----------
    ('Baccarat Rouge 540', 'Maison Francis Kurkdjian', 'U', 'Amber', 'Odunsu', 'safran, yasemin', 'amber ağacı, ambergris', 'köknar reçinesi, sedir', 'ISK', 'y', 'u', 'edp', 'aksam ozel', 'gizemli cekici', 'sofistike mistik', 'luks'),
    ('Santal 33', 'Le Labo', 'U', 'Odunsu', 'Deri', 'kakule, iris, menekşe', 'ambroksan', 'sandal ağacı, papirüs, sedir, deri', 'ISK', 'o', 'u', 'edp', 'gunluk is', 'gizemli', 'sofistike dogal', 'luks'),
    ('Another 13', 'Le Labo', 'U', 'Amber', 'Pudralı', 'ambrette', 'yasemin', 'ambroksan, misk, yosun', 'IYSK', 'h', 'u', 'edp', 'gunluk is', 'taze gizemli', 'sofistike', 'luks'),
    ('Tobacco Vanille', 'Tom Ford', 'U', 'Oryantal', 'Tatlı', 'tütün yaprağı, zencefil, baharatlar', 'vanilya, kakao, tonka fasulyesi, tütün çiçeği', 'kuru meyveler, odunsu notalar', 'SK', 'y', 'u', 'edp', 'aksam ozel', 'sicak gizemli', 'sofistike', 'luks'),
    ('Oud Wood', 'Tom Ford', 'U', 'Odunsu', 'Oryantal', 'gül ağacı, kakule, Çin biberi', 'ud ağacı, sandal ağacı, vetiver', 'tonka fasulyesi, vanilya, amber', 'SK', 'o', 'u', 'edp', 'is aksam', 'gizemli profesyonel', 'sofistike', 'luks'),
    ('Lost Cherry', 'Tom Ford', 'U', 'Tatlı', 'Meyvemsi', 'kiraz, acı badem, kiraz likörü', 'Türk gülü, yasemin, vişne', 'peru balsamı, tonka fasulyesi, sandal ağacı, vetiver, sedir', 'SK', 'y', 'u', 'edp', 'aksam ozel romantik', 'cekici sicak', 'cesur', 'luks'),
    ('Black Orchid', 'Tom Ford', 'U', 'Oryantal', 'Çiçeksi', 'trüf mantarı, gardenya, siyah frenk üzümü, ylang-ylang, bergamot', 'orkide, baharatlar, lotus', 'çikolata, paçuli, vanilya, tütsü, amber, sandal ağacı, vetiver', 'SK', 'y', 'u', 'edp', 'aksam ozel', 'gizemli cekici', 'mistik cesur', 'luks'),
    ('Gypsy Water', 'Byredo', 'U', 'Odunsu', 'Ferah', 'bergamot, limon, karabiber, ardıç meyvesi', 'tütsü, çam iğnesi, iris kökü', 'amber, vanilya, sandal ağacı', 'IYS', 'h', 'o', 'edp', 'gunluk', 'taze gizemli', 'dogal', 'luks'),
    ('Mojave Ghost', 'Byredo', 'U', 'Odunsu', 'Pudralı', 'ambrette', 'manolya, menekşe, sandal ağacı', 'amber, sedir, misk', 'IS', 'h', 'o', 'edp', 'gunluk', 'gizemli taze', 'sofistike', 'luks'),
    ('Wood Sage & Sea Salt', 'Jo Malone London', 'U', 'Aquatik', 'Ferah', 'ambrette', 'deniz tuzu, deniz yosunu', 'adaçayı', 'IY', 'h', 'k', 'edc', 'gunluk', 'taze', 'dogal', 'premium'),
    ('English Pear & Freesia', 'Jo Malone London', 'U', 'Meyvemsi', 'Çiçeksi', 'armut, kavun', 'frezya, gül', 'beyaz misk, paçuli, amber', 'IS', 'h', 'o', 'edc', 'gunluk is', 'taze', 'romantik', 'premium'),
    ('Lime Basil & Mandarin', 'Jo Malone London', 'U', 'Ferah', 'Yeşil', 'misket limonu, mandalina', 'fesleğen, kekik', 'amber ağacı', 'IY', 'h', 'k', 'edc', 'gunluk spor', 'taze enerjik', 'dogal', 'premium'),
    ('Lazy Sunday Morning', 'Maison Margiela', 'U', 'Pudralı', 'Ferah', 'armut, inci çiçeği, aldehitler', 'iris, gül, portakal çiçeği', 'beyaz misk, ambrette, paçuli', 'IY', 'h', 'o', 'edt', 'gunluk', 'taze', 'dogal romantik', 'premium'),
    ('By the Fireplace', 'Maison Margiela', 'U', 'Tatlı', 'Odunsu', 'pembe biber, portakal çiçeği, karanfil', 'kestane, guaiac ağacı, ardıç', 'vanilya, peru balsamı, kaşmir ağacı', 'SK', 'o', 'u', 'edt', 'aksam romantik', 'sicak', 'romantik', 'premium'),
    ('Philosykos', 'Diptyque', 'U', 'Yeşil', 'Odunsu', 'incir yaprağı', 'incir, yeşil notalar', 'incir ağacı, sedir', 'IY', 'h', 'o', 'edt', 'gunluk', 'taze', 'dogal', 'premium'),
    ('Tam Dao', 'Diptyque', 'U', 'Odunsu', 'Baharatlı', 'servi, mersin', 'sandal ağacı', 'sedir', 'ISK', 'o', 'u', 'edt', 'gunluk is', 'gizemli sicak', 'mistik dogal', 'premium'),
    ("Love, Don't Be Shy", 'Kilian', 'U', 'Tatlı', 'Çiçeksi', 'neroli, bergamot, pembe biber, kişniş', 'portakal çiçeği, yasemin, hanımeli, iris, gül', 'marshmallow, vanilya, karamel, misk, labdanum', 'SK', 'y', 'u', 'edp', 'aksam romantik', 'cekici sicak', 'romantik', 'luks'),
    ('Oud for Greatness', 'Initio', 'U', 'Odunsu', 'Oryantal', 'safran, muskat, lavanta', 'ud ağacı', 'paçuli, misk', 'SK', 'y', 'u', 'edp', 'aksam ozel', 'gizemli cekici', 'cesur mistik', 'luks'),
    ('Silver Mountain Water', 'Creed', 'U', 'Ferah', 'Yeşil', 'bergamot, mandalina', 'yeşil çay, siyah frenk üzümü', 'misk, petitgrain, sandal ağacı', 'IY', 'h', 'o', 'edp', 'gunluk is', 'taze profesyonel', 'dogal', 'luks'),
    ('Colonia', 'Acqua di Parma', 'U', 'Ferah', 'Çiçeksi', 'limon, tatlı portakal, bergamot', 'lavanta, biberiye, mine çiçeği, Bulgar gülü', 'vetiver, sandal ağacı, paçuli', 'IY', 'h', 'k', 'edc', 'gunluk is', 'taze profesyonel', 'sofistike dogal', 'premium'),
    ('CK One', 'Calvin Klein', 'U', 'Ferah', 'Meyvemsi', 'ananas, yeşil notalar, mandalina, papaya, bergamot, kakule, limon', 'yasemin, menekşe, gül, muskat, inci çiçeği', 'yeşil akor, misk, sedir, sandal ağacı, meşe yosunu, amber', 'IY', 'h', 'k', 'edt', 'gunluk spor', 'taze enerjik', 'dinamik dogal', 'ekonomik'),
    ('Molecule 01', 'Escentric Molecules', 'U', 'Odunsu', 'Pudralı', '', '', 'iso e super', 'IYSK', 'h', 'u', 'edt', 'gunluk is', 'gizemli', 'sofistike', 'premium'),
    ('Intense Cafe', 'Montale', 'U', 'Tatlı', 'Çiçeksi', 'çiçeksi notalar', 'gül, kahve', 'vanilya, amber, beyaz misk', 'SK', 'y', 'u', 'edp', 'aksam', 'sicak cekici', 'romantik', 'premium'),
    ('Naxos', 'Xerjoff', 'U', 'Tatlı', 'Oryantal', 'lavanta, bergamot, limon', 'bal, tarçın, kaşmir ağacı, yasemin', 'tütün yaprağı, tonka fasulyesi, vanilya', 'SK', 'y', 'u', 'edp', 'aksam ozel', 'sicak gizemli', 'sofistike', 'luks'),
    ('Cedrat Boisé', 'Mancera', 'U', 'Odunsu', 'Meyvemsi', 'ağaç kavunu, siyah frenk üzümü, baharatlar', 'yasemin, paçuli', 'deri, vanilya, meşe yosunu, odunsu notalar', 'IYS', 'o', 'u', 'edp', 'gunluk aksam', 'enerjik cekici', 'cesur', 'premium'),
    ('Khamrah', 'Lattafa', 'U', 'Tatlı', 'Baharatlı', 'tarçın, muskat, bergamot', 'hurma, pralin, tuberoz', 'vanilya, tonka fasulyesi, benzoin, amber ağacı', 'SK', 'y', 'u', 'edp', 'aksam', 'sicak cekici', 'cesur', 'ekonomik'),
    ('Hacivat', 'Nishane', 'U', 'Meyvemsi', 'Odunsu', 'ananas, greyfurt, bergamot', 'sedir, paçuli, yasemin', 'meşe yosunu, odunsu notalar', 'IYS', 'o', 'u', 'p', 'gunluk aksam', 'enerjik cekici', 'cesur', 'luks'),
    ('Ani', 'Nishane', 'U', 'Tatlı', 'Baharatlı', 'bergamot, yeşil notalar, zencefil, pembe biber', 'kakule, siyah frenk üzümü, Türk gülü', 'vanilya, sandal ağacı, benzoin, sedir, misk, paçuli', 'SK', 'y', 'u', 'p', 'aksam ozel', 'sicak cekici', 'sofistike', 'luks'),

    # ---------- Niş (2026-11 eklendi; notalar marka sayfası / perakendeci piramitlerinden) ----------
    ('Interlude Man', 'Amouage', 'E', 'Oryantal', 'Baharatlı', 'bergamot, kekik, yenibahar', 'amber, tütsü, labdanum, opoponaks', 'deri, ud ağacı, paçuli, sandal ağacı', 'SK', 'y', 'u', 'edp', 'aksam ozel', 'gizemli cekici', 'cesur mistik', 'luks'),
    ('Reflection Man', 'Amouage', 'E', 'Çiçeksi', 'Odunsu', 'biberiye, pembe biber, petitgrain', 'neroli, iris, yasemin, ylang-ylang', 'vetiver, paçuli, sandal ağacı, sedir', 'IYS', 'o', 'u', 'edp', 'is gunluk ozel', 'profesyonel taze', 'sofistike', 'luks'),
    ('Portrait of a Lady', 'Frédéric Malle', 'K', 'Çiçeksi', 'Oryantal', 'ahududu, siyah frenk üzümü, tarçın, karanfil', 'Türk gülü, paçuli', 'sandal ağacı, tütsü, benzoin, beyaz misk, ambroksan', 'SK', 'y', 'u', 'edp', 'aksam ozel', 'cekici gizemli', 'sofistike cesur', 'luks'),
    ('Musc Ravageur', 'Frédéric Malle', 'U', 'Oryantal', 'Tatlı', 'bergamot, mandalina, lavanta', 'amber, vanilya, misk', 'sandal ağacı, misk', 'SK', 'y', 'u', 'edp', 'aksam romantik', 'sicak cekici', 'romantik sofistike', 'luks'),
    ('Ambre Sultan', 'Serge Lutens', 'U', 'Amber', 'Baharatlı', 'kekik, defne yaprağı, kişniş, mersin', 'mür, benzoin, reçine', 'amber, sandal ağacı, paçuli, vanilya, labdanum', 'SK', 'y', 'u', 'edp', 'aksam', 'sicak gizemli', 'mistik', 'luks'),
    ('African Leather', 'Memo Paris', 'U', 'Deri', 'Baharatlı', 'kakule, sardunya, pembe biber', 'gül, paçuli, tarçın', 'deri, ud ağacı, amber', 'SK', 'y', 'u', 'edp', 'aksam ozel', 'gizemli cekici', 'cesur', 'luks'),
    ('Halfeti', "Penhaligon's", 'U', 'Odunsu', 'Baharatlı', 'greyfurt, bergamot, yeşil notalar, pelin otu, servi', 'muskat, safran, gül', 'deri, ud ağacı, sandal ağacı', 'SK', 'y', 'u', 'edp', 'aksam ozel', 'gizemli sicak', 'sofistike mistik', 'luks'),
    ('Not a Perfume', 'Juliette Has a Gun', 'U', 'Amber', 'Pudralı', '', '', 'cetalox', 'IYSK', 'h', 'o', 'edp', 'gunluk is', 'taze', 'dogal sofistike', 'premium'),
    ('Kirke', 'Tiziana Terenzi', 'U', 'Meyvemsi', 'Tatlı', 'çarkıfelek meyvesi, şeftali, armut, siyah frenk üzümü, ahududu', 'inci çiçeği', 'heliotrop, sandal ağacı, vanilya, paçuli, misk', 'IYS', 'y', 'u', 'p', 'gunluk aksam', 'enerjik cekici', 'cesur dinamik', 'luks'),

    # ---------- Yerli (Türkiye) ----------
    ('Hundred Silent Ways', 'Nishane', 'U', 'Çiçeksi', 'Tatlı', 'tuberoz, mandalina, şeftali', 'yasemin, gardenya, iris', 'vanilya, sandal ağacı, vetiver', 'ISK', 'o', 'u', 'p', 'aksam romantik ozel', 'cekici sicak', 'romantik sofistike', 'luks'),
    ('Wulong Cha', 'Nishane', 'U', 'Ferah', 'Yeşil', 'bergamot, portakal, mandalina', 'oolong çayı, muskat', 'incir, misk', 'IY', 'h', 'o', 'p', 'gunluk is', 'taze', 'dogal sofistike', 'luks'),
    ('Fan Your Flames', 'Nishane', 'U', 'Tatlı', 'Oryantal', 'hindistan cevizi, rom', 'tütün, tonka fasulyesi', 'sedir, meşe yosunu', 'SK', 'y', 'u', 'p', 'aksam ozel', 'sicak cekici', 'cesur', 'luks'),
    ('Istanbul', 'Atelier Rebul', 'U', 'Oryantal', 'Baharatlı', 'bergamot, tarçın, safran', 'yasemin, frangipani', 'vanilya, ud ağacı', 'SK', 'o', 'u', 'edp', 'aksam gunluk', 'sicak gizemli', 'sofistike', 'orta'),
    ('Istanbul Bosphorus', 'Atelier Rebul', 'U', 'Aquatik', 'Çiçeksi', 'deniz tuzu, yeşil notalar', 'Türk gülü, frezya', 'çam, odunsu notalar', 'IY', 'h', 'o', 'edp', 'gunluk', 'taze', 'dogal', 'orta'),
    ('Galata Tower', 'Eyüp Sabri Tuncer', 'U', 'Yeşil', 'Çiçeksi', 'mandalina, yeşil notalar', 'adaçayı, beyaz çiçekler, yasemin, gül', 'misk, amber', 'IY', 'h', 'k', 'edc', 'gunluk', 'taze', 'dogal', 'ekonomik'),

    # ---------- Popüler (2026-11 eklendi; notalar marka/perakendeci piramitlerinden) ----------
    ('Stronger With You', 'Giorgio Armani', 'E', 'Tatlı', 'Baharatlı', 'kakule, pembe biber, menekşe yaprağı', 'adaçayı', 'vanilya, kestane, amber ağacı, sedir', 'SK', 'o', 'u', 'edt', 'aksam gunluk', 'sicak cekici', 'cesur', 'premium'),
    ('Bad Boy', 'Carolina Herrera', 'E', 'Baharatlı', 'Tatlı', 'bergamot, beyaz biber, karabiber', 'sedir, adaçayı', 'tonka fasulyesi, kakao, amber ağacı', 'SK', 'o', 'u', 'edt', 'aksam gunluk', 'cekici sicak', 'cesur', 'premium'),
    ('212 VIP Men', 'Carolina Herrera', 'E', 'Ferah', 'Tatlı', 'misket limonu, nane', 'votka akoru, zencefil', 'amber, misk, odunsu notalar', 'ISK', 'o', 'o', 'edt', 'aksam ozel', 'enerjik cekici', 'cesur dinamik', 'premium'),
    ('The Most Wanted Intense', 'Azzaro', 'E', 'Tatlı', 'Baharatlı', 'kakule', 'karamel akoru', 'amber ağacı', 'SK', 'y', 'u', 'edp', 'aksam ozel', 'cekici sicak', 'cesur', 'premium'),
    ('Scandal pour Homme Le Parfum', 'Jean Paul Gaultier', 'E', 'Odunsu', 'Tatlı', 'sardunya', 'tonka fasulyesi', 'sandal ağacı', 'SK', 'o', 'u', 'edp', 'aksam gunluk', 'sicak cekici', 'sofistike', 'premium'),
    ('Le Male Le Parfum', 'Jean Paul Gaultier', 'E', 'Oryantal', 'Pudralı', 'kakule', 'lavanta, iris', 'vanilya', 'SK', 'y', 'u', 'edp', 'aksam ozel romantik', 'cekici sicak', 'sofistike', 'premium'),
    ('Miss Dior Eau de Parfum', 'Dior', 'K', 'Çiçeksi', 'Meyvemsi', 'iris, şakayık, inci çiçeği', 'gül, kayısı, şeftali', 'vanilya, misk, tonka fasulyesi, sandal ağacı, benzoin', 'IYS', 'o', 'u', 'edp', 'gunluk is romantik', 'cekici profesyonel', 'romantik sofistike', 'luks'),
    ('Angel', 'Mugler', 'K', 'Tatlı', 'Oryantal', 'bergamot', 'pralin', 'paçuli, vanilya', 'SK', 'y', 'u', 'edp', 'aksam ozel', 'cekici gizemli', 'cesur', 'premium'),
    ('Bloom', 'Gucci', 'K', 'Çiçeksi', 'Pudralı', 'Rangoon sarmaşığı', 'yasemin', 'tuberoz, misk', 'IYS', 'o', 'u', 'edp', 'gunluk is romantik', 'taze cekici', 'romantik', 'premium'),

    # ---------- Uygun fiyatlı yerli markalar (notalar perakende ürün açıklamalarından; resmi piramit yayımlanmıyor) ----------
    ('B103', 'MAD', 'K', 'Meyvemsi', 'Tatlı', 'ahududu, böğürtlen, siyah frenk üzümü, limon', 'yasemin, menekşe, kaşmir ağacı, paçuli', 'vanilya, amber, meşe yosunu, odunsu notalar, misk', 'IS', 'o', 'o', 'edp', 'gunluk', 'enerjik sicak', 'dinamik', 'ekonomik'),
    ('N101', 'MAD', 'K', 'Çiçeksi', 'Meyvemsi', 'erik, yeşil notalar, şeftali, frezya, şakayık', 'zambak, ylang-ylang, gül, çimen, yasemin', 'sandal ağacı, sedir, vanilya, tonka fasulyesi, kişniş', 'IY', 'h', 'o', 'edp', 'gunluk', 'taze', 'romantik dogal', 'ekonomik'),
    ('No. 122', 'Bargello', 'K', 'Oryantal', 'Çiçeksi', 'portakal çiçeği', 'vanilya, gül', 'sandal ağacı, amber, paçuli', 'SK', 'o', 'u', 'edp', 'aksam gunluk', 'sicak cekici', 'romantik', 'ekonomik'),
    ('No. 423', 'Bargello', 'K', 'Meyvemsi', 'Tatlı', 'limon, mandalina, çilek, ahududu, böğürtlen, vişne, siyah frenk üzümü', 'menekşe, yasemin', 'misk, amber, paçuli, vanilya, meşe yosunu, kaşmir ağacı', 'ISK', 'y', 'u', 'edp', 'aksam gunluk', 'cekici sicak', 'cesur', 'ekonomik'),
    ('No. 110', 'Bargello', 'K', 'Tatlı', 'Çiçeksi', 'böğürtlen, mandalina yaprağı', 'yasemin, portakal çiçeği', 'vanilya, tonka fasulyesi', 'SK', 'y', 'u', 'edp', 'aksam romantik', 'cekici sicak', 'romantik', 'ekonomik'),
    ('No. 711', 'Bargello', 'E', 'Ferah', 'Odunsu', 'narenciye, nane', 'sedir, sandal ağacı', 'misk, vetiver', 'IYS', 'o', 'o', 'edp', 'gunluk is', 'taze profesyonel', 'dinamik', 'ekonomik'),
    ('No. 575', 'Bargello', 'E', 'Oryantal', 'Baharatlı', 'bergamot, kişniş, fesleğen', 'kakule, zencefil', 'amber, tütün', 'SK', 'o', 'u', 'edp', 'aksam romantik', 'sicak cekici', 'sofistike', 'ekonomik'),
    ('No. 561', 'Bargello', 'E', 'Aquatik', 'Odunsu', 'greyfurt, deniz notaları', 'defne yaprağı, yasemin', 'amber, guaiac ağacı', 'IY', 'o', 'o', 'edp', 'spor gunluk', 'enerjik taze', 'dinamik', 'ekonomik'),

    # ---------- 2026-11 genişletme (sona eklenir: mevcut p001… kimlikleri değişmesin) ----------
    # Notalar markaların ve büyük perakendecilerin yayımladığı nota piramitlerinden Türkçeleştirildi; doğrulanmadı (dogrulandi: false).
    # Erkek
    ('Sauvage Elixir', 'Dior', 'E', 'Baharatlı', 'Odunsu', 'tarçın, muskat, kakule, greyfurt', 'lavanta', 'meyan kökü, sandal ağacı, amber, paçuli, vetiver', 'SK', 'y', 'u', 'p', 'aksam ozel', 'cekici sicak', 'cesur', 'luks'),
    ('Acqua di Giò Profumo', 'Giorgio Armani', 'E', 'Aquatik', 'Odunsu', 'deniz notaları, bergamot', 'biberiye, adaçayı, sardunya', 'tütsü, paçuli', 'IYS', 'o', 'u', 'edp', 'gunluk is aksam', 'taze profesyonel', 'sofistike', 'premium'),
    ("La Nuit de l'Homme", 'Yves Saint Laurent', 'E', 'Baharatlı', 'Odunsu', 'kakule, bergamot', 'lavanta, sedir', 'vetiver', 'SK', 'o', 'o', 'edt', 'aksam romantik', 'cekici gizemli', 'romantik sofistike', 'premium'),
    ('Dylan Blue pour Homme', 'Versace', 'E', 'Aquatik', 'Odunsu', 'bergamot, greyfurt, incir yaprağı, deniz notaları', 'menekşe yaprağı, karabiber, ambroksan, paçuli', 'misk, tonka fasulyesi, safran, tütsü', 'IYS', 'o', 'u', 'edt', 'gunluk is', 'taze enerjik', 'dinamik', 'orta'),
    ('Boss The Scent', 'Hugo Boss', 'E', 'Baharatlı', 'Deri', 'zencefil, bergamot', 'maninka meyvesi, lavanta', 'deri', 'SK', 'o', 'o', 'edt', 'aksam romantik', 'sicak cekici', 'sofistike', 'orta'),
    ('Chrome', 'Azzaro', 'E', 'Ferah', 'Aquatik', 'bergamot', 'misk', 'mate yaprağı, sandal ağacı, amber', 'IY', 'h', 'o', 'edt', 'gunluk spor is', 'taze enerjik', 'dinamik dogal', 'ekonomik'),
    ('Cool Water', 'Davidoff', 'E', 'Aquatik', 'Ferah', 'nane, lavanta, deniz notaları, kişniş, biberiye', 'sandal ağacı, neroli, yasemin, sardunya', 'misk, amber, sedir, meşe yosunu, tütün', 'IY', 'h', 'o', 'edt', 'gunluk spor', 'taze enerjik', 'dinamik', 'ekonomik'),
    ('Hero', 'Burberry', 'E', 'Odunsu', 'Ferah', 'bergamot', 'ardıç, karabiber', 'sedir', 'IYS', 'o', 'o', 'edt', 'gunluk is', 'taze profesyonel', 'dogal', 'premium'),
    ('H24', 'Hermès', 'E', 'Yeşil', 'Odunsu', 'adaçayı', 'nergis', 'gül ağacı, metalik notalar', 'IY', 'h', 'o', 'edt', 'gunluk is', 'taze profesyonel', 'sofistike dogal', 'premium'),
    ('Noir Extreme', 'Tom Ford', 'E', 'Oryantal', 'Tatlı', 'kakule, muskat, mandalina, safran', 'portakal çiçeği, gül, yasemin', 'vanilya, amber, sandal ağacı', 'SK', 'y', 'u', 'edp', 'aksam ozel romantik', 'sicak cekici', 'sofistike', 'luks'),
    ('Green Irish Tweed', 'Creed', 'E', 'Yeşil', 'Ferah', 'limon mine çiçeği, nane', 'menekşe yaprağı, sardunya, lavanta', 'sandal ağacı, ambergris, sedir, meşe yosunu', 'IY', 'o', 'u', 'edp', 'gunluk is', 'taze profesyonel', 'dogal sofistike', 'luks'),
    ('Herod', 'Parfums de Marly', 'E', 'Oryantal', 'Tatlı', 'tarçın, karabiber', 'tütün yaprağı, tütsü, labdanum, osmanthus', 'vanilya, sedir, vetiver, paçuli, misk', 'SK', 'y', 'u', 'edp', 'aksam ozel', 'sicak gizemli', 'sofistike', 'luks'),
    ('Pegasus', 'Parfums de Marly', 'E', 'Tatlı', 'Pudralı', 'servi, bergamot, heliotrop', 'yasemin, lavanta, acı badem', 'vanilya, amber, sandal ağacı', 'ISK', 'o', 'u', 'edp', 'aksam gunluk', 'sicak cekici', 'sofistike', 'luks'),
    ('L.12.12 Blanc', 'Lacoste', 'E', 'Ferah', 'Yeşil', 'greyfurt, kakule, biberiye', 'tuberoz, ylang-ylang', 'vetiver, sedir, süet', 'IY', 'h', 'k', 'edt', 'gunluk spor', 'taze', 'dinamik dogal', 'ekonomik'),

    # Kadın
    ('Hypnotic Poison', 'Dior', 'K', 'Oryantal', 'Tatlı', 'acı badem, hindistan cevizi, erik', 'sambac yasemini, gül ağacı, kimyon', 'vanilya, misk, sandal ağacı', 'SK', 'y', 'u', 'edt', 'aksam ozel romantik', 'gizemli cekici', 'mistik romantik', 'premium'),
    ('Flora Gorgeous Gardenia', 'Gucci', 'K', 'Çiçeksi', 'Tatlı', 'armut çiçeği', 'gardenya, yasemin', 'esmer şeker, paçuli', 'IY', 'o', 'o', 'edp', 'gunluk romantik', 'taze cekici', 'romantik', 'premium'),
    ('Mon Paris', 'Yves Saint Laurent', 'K', 'Meyvemsi', 'Çiçeksi', 'armut, çilek, ahududu', 'datura çiçeği, beyaz çiçekler', 'paçuli, beyaz misk', 'ISK', 'o', 'u', 'edp', 'gunluk aksam romantik', 'cekici enerjik', 'romantik', 'premium'),
    ('Trésor', 'Lancôme', 'K', 'Çiçeksi', 'Pudralı', 'gül, kayısı çiçeği, şeftali çiçeği', 'inci çiçeği, heliotrop, iris, vanilya', 'sandal ağacı, misk', 'SK', 'o', 'u', 'edp', 'aksam is', 'sicak cekici', 'romantik sofistike', 'premium'),
    ('Mon Guerlain', 'Guerlain', 'K', 'Oryantal', 'Pudralı', 'lavanta, bergamot', 'iris, sambac yasemini', 'vanilya, sandal ağacı, tonka fasulyesi', 'ISK', 'o', 'u', 'edp', 'gunluk aksam', 'sicak profesyonel', 'sofistike', 'premium'),
    ('Very Good Girl', 'Carolina Herrera', 'K', 'Çiçeksi', 'Meyvemsi', 'kırmızı frenk üzümü, liçi', 'gül', 'vanilya, vetiver', 'SK', 'o', 'u', 'edp', 'aksam romantik', 'cekici', 'cesur romantik', 'premium'),
    ('Lady Million', 'Paco Rabanne', 'K', 'Çiçeksi', 'Tatlı', 'ahududu, neroli, acı portakal', 'yasemin, portakal çiçeği, gardenya', 'bal, paçuli, amber', 'SK', 'y', 'u', 'edp', 'aksam ozel', 'cekici sicak', 'cesur', 'orta'),
    ("Twilly d'Hermès", 'Hermès', 'K', 'Çiçeksi', 'Baharatlı', 'zencefil', 'tuberoz', 'sandal ağacı', 'ISK', 'o', 'o', 'edp', 'gunluk is', 'enerjik cekici', 'dinamik', 'premium'),
    ('Nomade', 'Chloé', 'K', 'Meyvemsi', 'Odunsu', 'mirabel eriği', 'frezya', 'meşe yosunu', 'IS', 'o', 'u', 'edp', 'gunluk is', 'taze sicak', 'dogal sofistike', 'premium'),
    ('For Her', 'Narciso Rodriguez', 'K', 'Pudralı', 'Çiçeksi', 'gül, şeftali', 'misk', 'paçuli, amber', 'ISK', 'o', 'u', 'edp', 'gunluk is aksam', 'cekici profesyonel', 'sofistike', 'premium'),
    ('The One', 'Dolce&Gabbana', 'K', 'Çiçeksi', 'Amber', 'bergamot, mandalina, liçi, beyaz şeftali', 'zambak, yasemin, erik', 'vanilya, vetiver, amber, misk', 'SK', 'o', 'u', 'edp', 'aksam romantik', 'sicak cekici', 'romantik', 'premium'),
    ('Irresistible', 'Givenchy', 'K', 'Çiçeksi', 'Meyvemsi', 'armut, ambrette', 'gül, iris', 'sedir, sarışın odunlar', 'IY', 'h', 'o', 'edp', 'gunluk is', 'taze enerjik', 'romantik dinamik', 'premium'),
    ('My Way', 'Giorgio Armani', 'K', 'Çiçeksi', 'Tatlı', 'bergamot, portakal çiçeği', 'tuberoz, yasemin', 'vanilya, sedir, beyaz misk', 'ISK', 'o', 'u', 'edp', 'gunluk aksam', 'cekici sicak', 'romantik', 'premium'),
    ('Candy', 'Prada', 'K', 'Tatlı', 'Amber', 'karamel', 'pudra notaları, misk', 'benzoin, vanilya', 'SK', 'y', 'u', 'edp', 'aksam romantik', 'sicak cekici', 'cesur romantik', 'premium'),
    ('Blanche', 'Byredo', 'K', 'Pudralı', 'Çiçeksi', 'aldehitler, beyaz gül, pembe biber', 'menekşe, şakayık, neroli', 'sandal ağacı, misk, sarışın odunlar', 'IY', 'h', 'o', 'edp', 'gunluk is', 'taze', 'dogal sofistike', 'luks'),
    ('Good Girl Gone Bad', 'Kilian', 'K', 'Çiçeksi', 'Amber', 'osmanthus, gül, portakal çiçeği', 'yasemin, tuberoz, nergis', 'amber, sedir', 'IS', 'o', 'u', 'edp', 'aksam romantik ozel', 'cekici', 'romantik sofistike', 'luks'),
    ('Vanilla 28', 'Kayali', 'K', 'Tatlı', 'Amber', 'vanilya orkidesi, yasemin', 'tonka fasulyesi, vanilya', 'esmer şeker, amber ağacı, misk, paçuli', 'SK', 'y', 'u', 'edp', 'aksam gunluk', 'sicak cekici', 'romantik', 'orta'),

    # Unisex
    ("Angels' Share", 'Kilian', 'U', 'Tatlı', 'Baharatlı', 'konyak', 'meşe, tarçın', 'tonka fasulyesi, sandal ağacı, pralin, vanilya', 'SK', 'y', 'u', 'edp', 'aksam ozel', 'sicak cekici', 'sofistike', 'luks'),
    ('Grand Soir', 'Maison Francis Kurkdjian', 'U', 'Amber', 'Tatlı', 'labdanum', 'lavanta, tarçın', 'vanilya, amber, benzoin, tonka fasulyesi', 'SK', 'y', 'u', 'edp', 'aksam ozel', 'sicak gizemli', 'sofistike', 'luks'),
    ('Erba Pura', 'Xerjoff', 'U', 'Meyvemsi', 'Tatlı', 'portakal, limon, bergamot', 'meyve akoru', 'beyaz misk, vanilya, amber', 'IYS', 'y', 'u', 'edp', 'gunluk aksam', 'enerjik cekici', 'cesur dinamik', 'luks'),
    ("Bal d'Afrique", 'Byredo', 'U', 'Çiçeksi', 'Odunsu', 'bergamot, limon, neroli, kadife çiçeği', 'menekşe, yasemin, siklamen', 'vetiver, misk, amber, sedir', 'IYS', 'o', 'o', 'edp', 'gunluk is', 'sicak taze', 'dogal sofistike', 'luks'),
    ('Rose 31', 'Le Labo', 'U', 'Çiçeksi', 'Baharatlı', 'gül, kimyon', 'sedir, vetiver', 'ud ağacı, guaiac ağacı, misk, tütsü, labdanum', 'ISK', 'o', 'u', 'edp', 'gunluk aksam', 'gizemli sicak', 'sofistike', 'luks'),
    ('Thé Noir 29', 'Le Labo', 'U', 'Odunsu', 'Meyvemsi', 'incir, bergamot, defne yaprağı', 'siyah çay', 'sedir, vetiver, misk, tütün', 'SK', 'o', 'u', 'edp', 'gunluk aksam', 'gizemli sicak', 'sofistike dogal', 'luks'),
    ('Do Son', 'Diptyque', 'U', 'Çiçeksi', 'Aquatik', 'deniz notaları, pembe biber', 'tuberoz, portakal çiçeği, yasemin', 'misk, benzoin', 'IY', 'o', 'o', 'edt', 'gunluk', 'taze cekici', 'romantik dogal', 'premium'),
    ('Peony & Blush Suede', 'Jo Malone London', 'U', 'Çiçeksi', 'Meyvemsi', 'kırmızı elma', 'şakayık, yasemin, gül, karanfil', 'süet', 'IY', 'h', 'k', 'edc', 'gunluk', 'taze', 'romantik', 'premium'),
    ('Beach Walk', 'Maison Margiela', 'U', 'Ferah', 'Çiçeksi', 'bergamot, pembe biber, limon', 'ylang-ylang, hindistan cevizi sütü', 'misk, sedir', 'Y', 'h', 'o', 'edt', 'gunluk', 'taze enerjik', 'dogal', 'premium'),
    ('Coffee Break', 'Maison Margiela', 'U', 'Tatlı', 'Pudralı', 'kahve, kırmızı elma, limon', 'lavanta, nane, portakal çiçeği', 'süt köpüğü, sandal ağacı, sedir', 'SK', 'o', 'o', 'edt', 'gunluk', 'sicak', 'dogal', 'premium'),
    ('Soleil Blanc', 'Tom Ford', 'U', 'Amber', 'Çiçeksi', 'bergamot, kakule, pembe biber, antep fıstığı', 'ylang-ylang, tuberoz, yasemin', 'hindistan cevizi, benzoin, amber', 'IY', 'o', 'u', 'edp', 'gunluk aksam', 'sicak cekici', 'romantik', 'luks'),
    ('Side Effect', 'Initio', 'U', 'Oryantal', 'Tatlı', 'rom, tütün, tarçın', 'safran, sandal ağacı', 'vanilya', 'SK', 'y', 'u', 'edp', 'aksam ozel', 'sicak cekici', 'cesur', 'luks'),
    ('Un Jardin sur le Nil', 'Hermès', 'U', 'Yeşil', 'Meyvemsi', 'yeşil mango', 'lotus, eğir kökü', 'çınar ağacı, tütsü', 'IY', 'h', 'o', 'edt', 'gunluk is', 'taze', 'dogal', 'premium'),
    ('Fico di Amalfi', 'Acqua di Parma', 'U', 'Yeşil', 'Meyvemsi', 'bergamot, limon, greyfurt', 'incir, pembe biber, yasemin', 'incir ağacı, sedir, benzoin', 'IY', 'h', 'k', 'edt', 'gunluk', 'taze enerjik', 'dogal', 'premium'),

    # ---------- 2026-11 ikinci genişletme (sona eklenir) ----------
    # Notalar markanın resmi sayfasıyla karşılaştırıldı; resmi piramit yayımlanmayanlar tutarlı perakendeci listelerinden (doğrulanmadı).
    ('Dior Homme', 'Dior', 'E', 'Odunsu', 'Ferah', 'bergamot, pembe biber, elemi', 'kaşmir ağacı, sedir, paçuli', 'iso e super, vetiver, beyaz misk', 'ISK', 'o', 'u', 'edt', 'gunluk is', 'taze profesyonel', 'sofistike', 'premium'),
    ('MYSLF', 'Yves Saint Laurent', 'E', 'Çiçeksi', 'Odunsu', 'bergamot', 'portakal çiçeği', 'paçuli, ambroksan, odunsu notalar', 'ISK', 'o', 'u', 'edp', 'gunluk is aksam', 'taze profesyonel', 'sofistike', 'premium'),
    ('Uomo Born in Roma', 'Valentino', 'E', 'Odunsu', 'Baharatlı', 'menekşe yaprağı, zencefil, ağaç kavunu', 'mineral tuz, adaçayı', 'vetiver, guaiac ağacı', 'ISK', 'o', 'u', 'edt', 'gunluk aksam', 'taze cekici', 'dinamik sofistike', 'premium'),
    ('Le Beau', 'Jean Paul Gaultier', 'E', 'Odunsu', 'Tatlı', 'bergamot', 'hindistan cevizi ağacı', 'tonka fasulyesi', 'IY', 'o', 'o', 'edt', 'gunluk', 'taze cekici', 'dinamik', 'orta'),
    ('Gentleman Eau de Parfum', 'Givenchy', 'E', 'Pudralı', 'Odunsu', 'karabiber, lavanta', 'iris, tolu balsamı', 'paçuli, siyah vanilya', 'SK', 'o', 'u', 'edp', 'is aksam', 'sicak profesyonel', 'sofistike', 'premium'),
    ('Phantom', 'Paco Rabanne', 'E', 'Ferah', 'Tatlı', 'limon, lavanta', 'elma, paçuli', 'vanilya, vetiver', 'ISK', 'o', 'o', 'edt', 'gunluk spor aksam', 'taze enerjik', 'dinamik', 'orta'),
    ("L'Homme Idéal Eau de Parfum", 'Guerlain', 'E', 'Tatlı', 'Deri', 'bergamot, badem', 'gül, tütsü', 'deri, vanilya, tonka fasulyesi, sandal ağacı', 'SK', 'o', 'u', 'edp', 'aksam is', 'sicak cekici', 'sofistike', 'premium'),
    ('Man in Black', 'Bvlgari', 'E', 'Baharatlı', 'Deri', 'baharatlar, rom', 'tuberoz, deri, iris', 'benzoin, tonka fasulyesi, guaiac ağacı', 'SK', 'y', 'u', 'edp', 'aksam ozel', 'sicak gizemli', 'cesur sofistike', 'premium'),
    ('Aqva pour Homme', 'Bvlgari', 'E', 'Aquatik', 'Ferah', 'mandalina, portakal, petitgrain', 'santolina, deniz yosunu', 'amber, odunsu notalar, adaçayı', 'IY', 'o', 'o', 'edt', 'gunluk spor', 'taze enerjik', 'dinamik', 'premium'),
    ('Luna Rossa Black', 'Prada', 'E', 'Amber', 'Odunsu', 'bergamot, pembe biber, melek otu', 'paçuli, kumarin', 'misk, amber', 'SK', 'o', 'u', 'edp', 'aksam is', 'sicak cekici', 'sofistike', 'premium'),
    ('Coco Noir', 'Chanel', 'K', 'Amber', 'Çiçeksi', 'bergamot', 'gül, sardunya', 'paçuli, tonka fasulyesi', 'SK', 'y', 'u', 'edp', 'aksam ozel', 'gizemli cekici', 'sofistike', 'luks'),
    ('Miss Dior Blooming Bouquet', 'Dior', 'K', 'Çiçeksi', 'Ferah', 'bergamot', 'şakayık, gül', 'beyaz misk, sedir', 'IY', 'h', 'o', 'edt', 'gunluk is', 'taze', 'romantik', 'premium'),
    ('La Nuit Trésor', 'Lancôme', 'K', 'Tatlı', 'Çiçeksi', 'ahududu, liçi', 'gül, pralin', 'vanilya, tütsü, papirüs', 'SK', 'y', 'u', 'edp', 'aksam romantik', 'sicak cekici', 'romantik', 'premium'),
    ('La Petite Robe Noire', 'Guerlain', 'K', 'Tatlı', 'Çiçeksi', 'badem, kırmızı meyveler, bergamot', 'gül, kiraz', 'siyah çay, paçuli, tonka fasulyesi', 'ISK', 'o', 'u', 'edp', 'gunluk aksam romantik', 'cekici', 'romantik', 'premium'),
    ('Alien Goddess', 'Mugler', 'K', 'Tatlı', 'Çiçeksi', 'bergamot', 'yasemin, hindistan cevizi', 'benzoin, vanilya', 'SK', 'y', 'u', 'edp', 'aksam gunluk', 'sicak cekici', 'cesur', 'premium'),
    ('Scandal', 'Jean Paul Gaultier', 'K', 'Tatlı', 'Çiçeksi', 'kan portakalı, bal', 'gardenya', 'paçuli, vanilya', 'SK', 'y', 'u', 'edp', 'aksam ozel', 'cekici sicak', 'cesur', 'premium'),
    ('Goddess', 'Burberry', 'K', 'Tatlı', 'Pudralı', 'lavanta', 'vanilya', 'vanilya', 'SK', 'o', 'u', 'edp', 'gunluk aksam', 'sicak', 'romantik', 'premium'),
    ('Bonbon', 'Viktor&Rolf', 'K', 'Tatlı', 'Çiçeksi', 'mandalina', 'portakal çiçeği', 'karamel, sedir', 'SK', 'y', 'u', 'edp', 'aksam gunluk', 'sicak cekici', 'cesur romantik', 'premium'),
    ('Voce Viva', 'Valentino', 'K', 'Çiçeksi', 'Tatlı', 'bergamot, mandalina', 'portakal çiçeği, gardenya', 'yosun, vanilya, tonka fasulyesi', 'ISK', 'o', 'u', 'edp', 'gunluk aksam', 'cekici', 'romantik', 'premium'),
    ('Aqua Universalis', 'Maison Francis Kurkdjian', 'U', 'Ferah', 'Çiçeksi', 'bergamot, limon', 'inci çiçeği, beyaz çiçekler', 'misk, odunsu notalar', 'IY', 'h', 'o', 'edt', 'gunluk is', 'taze', 'dogal sofistike', 'luks'),
    ('Bergamote 22', 'Le Labo', 'U', 'Ferah', 'Odunsu', 'bergamot, greyfurt, petitgrain', 'portakal çiçeği', 'vetiver, sedir, amber, misk', 'IY', 'h', 'o', 'edp', 'gunluk is', 'taze', 'dogal', 'luks'),
    ('Orphéon', 'Diptyque', 'U', 'Odunsu', 'Tatlı', 'ardıç meyvesi', 'sedir, yasemin', 'tonka fasulyesi', 'ISK', 'o', 'o', 'edp', 'gunluk aksam', 'sicak', 'sofistike', 'premium'),
    ('Bubble Bath', 'Maison Margiela', 'U', 'Ferah', 'Çiçeksi', 'sabun köpüğü, pembe biber, bergamot', 'lavanta, gül, yasemin', 'paçuli, hindistan cevizi sütü, beyaz misk', 'IYSK', 'h', 'o', 'edt', 'gunluk', 'taze', 'dogal', 'premium'),
    ('Myrrh & Tonka', 'Jo Malone London', 'U', 'Amber', 'Tatlı', 'lavanta', 'mür', 'tonka fasulyesi', 'SK', 'y', 'u', 'edp', 'aksam', 'sicak gizemli', 'sofistike', 'premium'),
    ('Black Phantom', 'Kilian', 'U', 'Tatlı', 'Oryantal', 'rom', 'kahve, badem', 'sandal ağacı, karamel, vanilya', 'SK', 'y', 'u', 'edp', 'aksam ozel', 'sicak gizemli', 'cesur', 'luks'),
    ('Carnal Flower', 'Frédéric Malle', 'U', 'Çiçeksi', 'Yeşil', 'kavun, yeşil notalar', 'tuberoz', 'tuberoz, misk', 'IY', 'y', 'u', 'edp', 'gunluk aksam romantik', 'cekici', 'romantik', 'luks'),
    ("Eau d'Orange Verte", 'Hermès', 'U', 'Ferah', 'Yeşil', 'portakal, limon, mandalina', 'nane, siyah frenk üzümü', 'meşe yosunu, paçuli', 'IY', 'h', 'k', 'edc', 'gunluk spor', 'taze enerjik', 'dogal', 'premium'),
    ('Tuscan Leather', 'Tom Ford', 'U', 'Deri', 'Baharatlı', 'safran, ahududu, kekik', 'tütsü, yasemin', 'deri, süet, amber, odunsu notalar', 'SK', 'y', 'u', 'edp', 'aksam ozel', 'gizemli cekici', 'cesur sofistike', 'luks'),
    ('Percival', 'Parfums de Marly', 'E', 'Ferah', 'Odunsu', 'bergamot, mandalina, pembe biber', 'lavanta, iris, kakule', 'köknar reçinesi, tonka fasulyesi, ambroksan, beyaz misk', 'IYS', 'o', 'u', 'edp', 'gunluk is', 'taze profesyonel', 'dinamik sofistike', 'luks'),
    ('Gabrielle', 'Chanel', 'K', 'Çiçeksi', 'Pudralı', 'portakal çiçeği', 'yasemin, ylang-ylang', 'tuberoz', 'ISK', 'o', 'u', 'edp', 'gunluk is aksam', 'cekici profesyonel', 'sofistike romantik', 'luks'),
    ('Égoïste Platinum', 'Chanel', 'E', 'Ferah', 'Odunsu', 'lavanta, biberiye, petitgrain', 'adaçayı, sardunya', 'sedir, vetiver, amber', 'IYS', 'o', 'o', 'edt', 'gunluk is', 'taze profesyonel', 'sofistike', 'luks'),
    ('Guidance', 'Amouage', 'U', 'Tatlı', 'Amber', 'armut, tütsü, fındık', 'safran, gül, sambac yasemini, osmanthus', 'labdanum, sandal ağacı, akigalawood, ambergris, vanilya', 'SK', 'y', 'u', 'edp', 'aksam ozel', 'sicak cekici', 'sofistike', 'luks'),
    ('Greenley', 'Parfums de Marly', 'U', 'Ferah', 'Meyvemsi', 'yeşil elma, bergamot, mandalina, kaşmir ağacı', 'petitgrain, kaşmir ağacı', 'ambroksan, amber ağacı, kaşmir ağacı', 'IYS', 'o', 'u', 'edp', 'gunluk is', 'taze enerjik', 'dinamik dogal', 'luks'),
    ('Alexandria II', 'Xerjoff', 'U', 'Oryantal', 'Odunsu', 'elma, lavanta, gül ağacı, tarçın', 'sedir, inci çiçeği, gül', 'amber, sandal ağacı, ud ağacı', 'SK', 'y', 'u', 'p', 'aksam ozel', 'gizemli sicak', 'sofistike', 'luks'),
    ('Ege', 'Nishane', 'U', 'Yeşil', 'Ferah', 'yuzu, menekşe yaprağı, anason', 'fesleğen, kakule, nane', 'tütsü, meyan kökü', 'IY', 'o', 'u', 'p', 'gunluk is', 'taze', 'dogal sofistike', 'luks'),
    ('Bibliothèque', 'Byredo', 'U', 'Meyvemsi', 'Deri', 'şeftali, erik', 'menekşe, şakayık', 'deri, paçuli, vanilya', 'SK', 'o', 'u', 'edp', 'gunluk aksam', 'sicak gizemli', 'sofistike', 'luks'),
]

# Doğrulanmış kayıtlar: {isim: resmi ürün sayfası URL'si}. Doğruladıkça buraya ekleyin.
KAYNAK: dict = {
    'Interlude Man': 'https://www.amouage.com/interlude-man.html',
    'Musc Ravageur': 'https://www.fredericmalle.com/eu/perfumes/musc-ravageur',
    'African Leather': 'https://www.memoparis.com/products/african-leather-1',
    'Istanbul': 'https://atelierrebul.be/en/products/istanbul-eau-de-parfum-50ml',
    # 2026-11 doğrulaması: marka sayfasındaki notalar katalogla karşılaştırıldı (gerekenler düzeltildi)
    'Sauvage Elixir': 'https://www.dior.com/en_int/beauty/products/sauvage-elixir-Y0996460.html',
    "La Nuit de l'Homme": 'https://www.yslbeauty.com/int/fragrance/fragrance-for-him/la-nuit-de-l-homme/la-nuit-de-l-homme-eau-de-toilette/426YSL.html',
    'Dylan Blue pour Homme': 'https://www.versace.com/fi/en/dylan-blue-pour-homme-edt-50-ml/R721008-R050MLS.html',
    'Hero': 'https://be.burberry.com/c/burberry-hero',
    'H24': 'https://www.hermes.com/uk/en/product/h24-eau-de-toilette-V101561V0/',
    'Herod': 'https://parfums-de-marly.com/perfumes/men/herod',
    'Pegasus': 'https://ksa.parfums-de-marly.com/products/pegasus',
    'L.12.12 Blanc': 'https://www.lacoste.com/mx/lacoste/hombre/LC001A01.html',
    'Hypnotic Poison': 'https://www.dior.com/en_au/beauty/products/hypnotic-poison-eau-de-toilette-Y0063401.html',
    'Mon Paris': 'https://www.yslbeauty.co.uk/fragrances/fragrances-for-her/mon-paris/mon-paris-eau-de-parfum/WW-41800YSL.html',
    'Mon Guerlain': 'https://www.guerlain.com/sa/en-sa/p/mon-guerlain-eau-de-parfum---gold-bee-bottle-P013327.html',
    'Very Good Girl': 'https://www.carolinaherrera.com/fr/en/p-fragrance/very-good-girl',
    'Lady Million': 'https://rabanne.com/us/en_US/fragrance/p/lady-million--000000000065051781',
    "Twilly d'Hermès": 'https://www.hermes.com/us/en/product/twilly-d-hermes-eau-de-parfum-V107263V0/',
    'The One': 'https://dolcegabbana.com/en-gr/beauty/women/the-one-eau-de-parfum---VP7117VP1039V000.html',
    'Irresistible': 'https://www.givenchybeauty.com/int/en/p/irresistible-P000276.html',
    'My Way': 'https://www.armani.com/en/giorgio-armani/eau-de-parfum-my-way-90-ml-cod-LB402700-NLP-90ML/',
    "Angels' Share": 'https://www.bykilian.com/product/19797/82905/perfume/angels-share',
    'Do Son': 'https://uk.diptyqueparis.com/products/eau-de-toilette-do-son-doson50v2',
    'Peony & Blush Suede': 'https://www.jomalone.co.uk/our-stories/fleeting-beauty',
    'Un Jardin sur le Nil': 'https://www.hermes.com/us/en/product/un-jardin-sur-le-nil-eau-de-toilette-V20396',
    # 2026-11 doğrulaması (eski katalog p001–p114): marka sayfasındaki notalar karşılaştırıldı
    'Sauvage': 'https://www.dior.com/en_int/beauty/products/sauvage-eau-de-toilette-Y0685240.html',
    'Aventus': 'https://www.creedfragrance.com/fragrances/aventus-collection.list',
    'Dior Homme Intense': 'https://www.dior.com/en_gb/beauty/products/dior-homme-intense-Y0479201.html',
    'Le Male': 'https://www.jeanpaulgaultier.com/us/en_US/p/range-le-male/le-male-eau-de-toilette-000000000065120122',
    '1 Million': 'https://www.rabanne.com/us/en_US/fragrance/p/1-million--000000000065187136',
    'Spicebomb': 'https://viktor-rolf.com/products/spicebomb-eau-de-toilette-90ml',
    'Y Eau de Parfum': 'https://www.yslbeauty.com/int/fragrance/fragrance-for-him/y/y--eau-de-parfum/WW-50194YSL.html',
    "L'Homme": 'https://www.prada.com/ie/en/p/lhomme-prada-edt-150-ml/2A1251_2HC0_F0Z99_P_ML150',
    'Allure Homme Sport': 'https://www.chanel.com/gb/fragrance/p/123630/allure-homme-sport-eau-de-toilette-spray/',
    'Light Blue pour Homme': 'https://dolcegabbana.com/en/beauty/perfumes-for-him/light-blue-pour-homme/light-blue-pour-homme-eau-de-toilette---VP6846VP1059V000.html',
    'Fahrenheit': 'https://www.dior.com/en_gb/beauty/products/fahrenheit-eau-de-toilette-Y0066001.html',
    'Luna Rossa Carbon': 'https://www.prada.com/gb/en/p/luna-rossa-carbon-edt-100-ml/2A1154_2HC6_F0Z99_P_ML100',
    "L'Eau d'Issey pour Homme": 'https://us.isseymiyake.com/products/ip55-az103',
    'Layton': 'https://uk.parfums-de-marly.com/products/layton',
    'Jazz Club': 'https://www.maisonmargiela.com/en-gr/replica-jazz-club-eau-de-toilette-S33YX0016S10930.html',
    'Legend': 'https://www.montblanc.com/en-be/montblanc-legend-eau-de-toilette-100-ml-MB107460VG.html',
    'Coco Mademoiselle': 'https://www.chanel.com/ba/fragrance/coco-mademoiselle/univers-olfactif/',
    'N°5': 'https://www.chanel.com/us/fragrance/p/125530/n5-eau-de-parfum-spray/',
    'La Vie Est Belle': 'https://www.lancome.co.uk/discover-lancome/a-guide-to-la-vie-est-belle-fragrance.html',
    'Black Opium': 'https://www.yslbeauty.com.au/fragrance/womens-perfume/black-opium-eau-de-parfum/WW-40701YSL.html',
    "J'adore": 'https://www.dior.com/en_int/beauty/products/jadore-eau-de-parfum-Y0998031.html',
    'Good Girl': 'https://www.carolinaherrera.com/ww/en/p-fragrance/good-girl-edp-bowtastic',
    'Light Blue': 'https://www.dolcegabbana.com/en-au/collection/new-lb-edt-50ml---158057971188185.html',
    'Alien': 'https://www.mugler.com/fragrance/womens-fragrances/alien/alien/M010401002.html',
    'Chloé': 'https://www.chloe.com/en-pt/p/fragrances/eau-de-parfum/CHCA50133819.html',
    'Olympéa': 'https://rabanne.com/uk/en_GB/fragrance/p/olympea--000000000065137847',
    'Shalimar': 'https://www.guerlain.com/us/en-us/p/shalimar-eau-de-parfum-P011355.html',
    'Chance Eau Tendre': 'https://www.chanel.com/us/fragrance/p/126310/chance-eau-tendre-eau-de-toilette-spray/',
    'Her': 'https://int.burberry.com/burberry-her/',
    "L'Interdit": 'https://www.givenchybeauty.com/us/p/l-interdit-P069001.html',
    'Paradoxe': 'https://www.prada-beauty.com/fragrance/paradoxe-eau-de-parfum/MPL01610.html',
    'Oud Wood': 'https://www.tomfordbeauty.co.uk/product/oud-wood-eau-de-parfum',
    'Wood Sage & Sea Salt': 'https://www.jomalone.com/scents/woody/wood-sage-sea-salt',
    'English Pear & Freesia': 'https://www.jomalone.com/product/25946/12553/colognes/english-pear-freesia-cologne',
    'Lime Basil & Mandarin': 'https://jomalone.co.uk/product/25946/10101/colognes/lime-basil-mandarin-cologne',
    'By the Fireplace': 'https://www.maisonmargiela.com/en-us/replica-by-the-fireplace-eau-de-toilette-S33YX0024S11331.html',
    'Philosykos': 'https://emea.diptyqueparis.com/products/eau-de-toilette-philosykos-philo100v2',
    'Tam Dao': 'https://emea.diptyqueparis.com/products/eau-de-toilette-tam-dao-100ml-1',
    "Love, Don't Be Shy": 'https://www.bykilian.com/us/love-don-t-be-shy-11/',
    'Molecule 01': 'https://www.escentric.com/pages/molecule-01',
    'Intense Cafe': 'https://montaleparfums.com/en/gourmand/176-intense-cafe.html',
    'Ambre Sultan': 'https://www.sergelutens.com/gb/ambre-sultan.html',
    'Halfeti': 'https://penhaligons.com/uk/en/product/halfeti-000000000065190234',
    'Stronger With You': 'https://www.armani.com/en/emporio-armani/stronger-with-you-50-ml-eau-de-toilette-cod-L5615800-NLP-50ML/',
    '212 VIP Men': 'https://www.carolinaherrera.com/ww/en/p-fragrance/212-vip-men',
    'Scandal pour Homme Le Parfum': 'https://www.jeanpaulgaultier.com/ww/en/fragrances/range-scandal-pour-homme/scandal-pour-homme-le-parfum-eau-de-parfum-intense',
    'Le Male Le Parfum': 'https://www.jeanpaulgaultier.com/uk/en/p/range-le-male/le-male-le-parfum-eau-de-parfum-intense-000000000065156529',
    'Miss Dior Eau de Parfum': 'https://www.dior.com/en_int/beauty/products/miss-dior-eau-de-parfum-Y0996347.html',
    'Angel': 'https://www.mugler.co.uk/fragrance/women/angel/angel/M010101003.html',
    # 2026-11 ikinci genişletme: marka sayfasıyla doğrulananlar
    'MYSLF': 'https://www.yslbeautyus.com/fragrance/mens-fragrances/myslf/myslf-eau-de-parfum/WW-51115YSL.html',
    'Le Beau': 'https://www.jeanpaulgaultier.com/uk/en/fragrances/range-le-beau/le-beau-eau-de-toilette',
    'Gentleman Eau de Parfum': 'https://www.givenchybeauty.com/us/p/gentleman-givenchy-P011120.html',
    'Phantom': 'https://www.rabanne.com/us/en_US/fragrance/p/phantom--000000000065158923',
    'Man in Black': 'https://www.bulgari.com/en-au/product/41385',
    'Coco Noir': 'https://www.chanel.com/za/fragrance/p/113660/coco-noir-eau-de-parfum-spray/',
    'Miss Dior Blooming Bouquet': 'https://www.dior.com/en_ca/beauty/products/miss-dior-blooming-bouquet-Y0996612.html',
    'La Petite Robe Noire': 'https://www.guerlain.com/us/en-us/p/la-petite-robe-noire-eau-de-parfum-G018105.html',
    'Alien Goddess': 'https://www.mugler.com/fragrance/alien-goddess-eau-de-parfum/3439601204642.html',
    'Scandal': 'https://www.jeanpaulgaultier.com/uk/en/fragrances/range-scandal/scandal-eau-de-parfum',
    'Goddess': 'https://uk.burberry.com/c/burberry-goddess',
    'Bonbon': 'https://viktor-rolf.com/products/bonbon-eau-de-parfum',
    'Orphéon': 'https://uk.diptyqueparis.com/products/eau-de-parfum-orpheon-orphp75c',
    'Bubble Bath': 'https://www.maisonmargiela.com/replica-bubble-bath-eau-de-toilette-8051979195589.html',
    'Black Phantom': 'https://www.bykilian.com/product/19797/50809/perfume/black-phantom--memento-mori/the-cellars',
    'Carnal Flower': 'https://www.fredericmalle.com/product/19566/50210/perfumes/carnal-flower/dominique-ropion',
    "Eau d'Orange Verte": 'https://www.hermes.com/au/en/product/eau-d-orange-verte-eau-de-cologne-V101916V0/',
    'Percival': 'https://us.parfums-de-marly.com/products/percival',
    'Gabrielle': 'https://www.chanel.com/us/fragrance/p/120525/gabrielle-chanel-eau-de-parfum-spray/',
    'Égoïste Platinum': 'https://www.chanel.com/gb/fragrance/p/124460/platinum-egoiste-eau-de-toilette-spray/',
    'Guidance': 'https://amouage.com/pages/guidance',
    'Greenley': 'https://us.parfums-de-marly.com/collections/men/products/greenley',
    'Alexandria II': 'https://xerjoff.com/oud-stars/397-alexandria-iiparfum-100ml-8033488154967.html',
}

# Marka bilgisi: (menşei ülke kodu, niş mi). Keşfet'teki "Niş" ve "Yerli" filtreleri bunu kullanır.
NIS = {
    'Amouage', 'Atelier Rebul', 'Byredo', 'Creed', 'Diptyque', 'Escentric Molecules', 'Frédéric Malle', 'Initio',
    'Juliette Has a Gun', 'Kilian', 'Le Labo', 'Maison Francis Kurkdjian', 'Mancera', 'Memo Paris', 'Montale',
    'Nishane', 'Parfums de Marly', "Penhaligon's", 'Serge Lutens', 'Tiziana Terenzi', 'Xerjoff',
}
MENSEI = {
    'Nishane': 'TR', 'Atelier Rebul': 'TR', 'Eyüp Sabri Tuncer': 'TR', 'MAD': 'TR', 'Bargello': 'TR',
    'Amouage': 'OM', 'Lattafa': 'AE', 'Armaf': 'AE',
    'Byredo': 'SE', 'Escentric Molecules': 'DE', 'Hugo Boss': 'DE',
    'Acqua di Parma': 'IT', 'Dolce&Gabbana': 'IT', 'Giorgio Armani': 'IT', 'Gucci': 'IT', 'Prada': 'IT',
    'Valentino': 'IT', 'Versace': 'IT', 'Xerjoff': 'IT', 'Tiziana Terenzi': 'IT',
    'Burberry': 'GB', 'Jo Malone London': 'GB', "Penhaligon's": 'GB',
    'Calvin Klein': 'US', 'Marc Jacobs': 'US', 'Tom Ford': 'US', 'Le Labo': 'US', 'Ariana Grande': 'US',
    'Issey Miyake': 'JP', 'Elie Saab': 'LB', 'Carolina Herrera': 'US',
    'Davidoff': 'CH', 'Bvlgari': 'IT', 'Narciso Rodriguez': 'US', 'Kayali': 'US',
}  # listede olmayan markalar Fransız (FR) kabul edilir

TIP_SIFAT = {
    'Çiçeksi': 'çiçeksi', 'Odunsu': 'odunsu', 'Ferah': 'ferah', 'Amber': 'amber tonlu', 'Baharatlı': 'baharatlı',
    'Meyvemsi': 'meyvemsi', 'Tatlı': 'tatlı', 'Yeşil': 'yeşil', 'Oryantal': 'oryantal', 'Aquatik': 'aquatik',
    'Deri': 'deri karakterli', 'Pudralı': 'pudralı',
}


def split(s):
    return [x.strip() for x in s.split(',') if x.strip()]


def aciklama(tip, ust, alt):
    acilis = ' ve '.join(ust[:2]) if ust else (alt[0] if alt else '')
    iz = alt[0] if alt else ''
    if ust and iz:
        return f'{acilis.capitalize()} açılışıyla başlayıp {iz} ile {TIP_SIFAT[tip]} bir iz bırakır.'
    return f'{acilis.capitalize()} etrafında kurulu, tende kişiye göre değişen {TIP_SIFAT[tip]} bir koku.'


def build(i, row):
    (isim, marka, g, tip, tip2, ust, orta, alt, mev, yog, kal, kons, kul, izl, kis, fiyat) = row
    ust, orta, alt = split(ust), split(orta), split(alt)
    mevsim = [S[c] for c in mev]
    kullanim = kul.split()
    yogunluk = D[yog]

    iklim = set()
    if 'Yaz' in mevsim: iklim |= {'sicak', 'nemli'}
    if 'Kış' in mevsim: iklim |= {'soguk', 'kuru'}
    if 'İlkbahar' in mevsim or 'Sonbahar' in mevsim: iklim.add('iliman')

    if yogunluk == 'yogun':
        ortam = 'kapali' if ({'aksam', 'ozel'} & set(kullanim)) else 'acik'
    else:
        ortam = 'her_ikisi'

    stil = set()
    if 'spor' in kullanim: stil.add('sportif')
    if 'is' in kullanim: stil |= {'formal', 'minimalist'}
    if {'aksam', 'ozel'} & set(kullanim): stil |= {'gece', 'formal'}
    if 'gunluk' in kullanim: stil.add('casual')
    if 'cesur' in kis.split() or 'enerjik' in izl.split(): stil.add('trendy')
    if 'dogal' in kis.split(): stil.add('bohem')

    aktivite = set()
    if 'spor' in kullanim: aktivite.add('spor')
    if 'is' in kullanim: aktivite.add('ofis')
    if {'aksam', 'ozel', 'romantik'} & set(kullanim): aktivite.add('sosyal')
    if 'gunluk' in kullanim: aktivite |= {'ev', 'seyahat'}

    saat = set()
    if {'gunluk', 'is', 'spor'} & set(kullanim): saat |= {'sabah', 'oglen'}
    if {'aksam', 'romantik'} & set(kullanim): saat.add('aksam')
    if 'ozel' in kullanim or yogunluk == 'yogun': saat.add('gece')

    return {
        'id': f'p{i:03d}',
        'isim': isim,
        'marka': marka,
        'notalar': {'ust': ust, 'orta': orta, 'alt': alt},
        'tip': tip,
        'ikincilTip': tip2,
        'mevsim': mevsim,
        'cinsiyet': G[g],
        'yogunluk': yogunluk,
        'kalicilik': L[kal],
        'kullanimAmaci': kullanim,
        'iklim': sorted(iklim),
        'ortam': ortam,
        'aktivite': sorted(aktivite),
        'kiyafetStili': sorted(stil),
        'aciklama': aciklama(tip, ust, alt),
        'fiyatAraligi': fiyat,
        'konsantrasyon': C[kons],
        'kisilikTipi': kis.split(),
        'izlenim': izl.split(),
        'yasGrubu': ['18-24', '25-34', '35-44', '45-54', '55+'],
        'gununSaati': sorted(saat),
        'etiketler': [TIP_SIFAT[tip]] + izl.split(),
        # Doğrulama: notalar markanın resmi sayfasıyla karşılaştırılınca KAYNAK sözlüğüne URL eklenir
        'nis': marka in NIS,
        'mensei': MENSEI.get(marka, 'FR'),
        'dogrulandi': isim in KAYNAK,
        'kaynak': KAYNAK.get(isim),
    }


def main():
    with open(OUT, encoding='utf-8') as f:
        data = json.load(f)
    data['parfumler'] = [build(i + 1, r) for i, r in enumerate(R)]
    data.pop('phHesaplamaFormulu', None)  # eski modelin belgelenmiş formülü — artık geçersiz
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'{len(R)} parfüm yazıldı → {OUT}')


if __name__ == '__main__':
    main()
