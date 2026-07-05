import re

with open('engine/index.ts', 'r') as f:
    content = f.read()

old_ph_info = """    phInfo: {
      deger: 5.5,
      aralik: 'normal',
      sonGuncelleme: new Date().toISOString(),
      hesaplamaYontemi: 'test',
      guvenilirlik: 50,
      aciklama: '',
      faktorler: {
        ciltTipiEtkisi: 0,
        gumusEtkisi: 0,
        suTuketimiCarpani: 1,
        beslenmeEtkisi: 0,
        terlemeEtkisi: 0,
        reaksiyonEtkisi: 0
      }
    },"""

new_ph_info = """    phBilgisi: {
      biliyorMu: 'bilmiyorum',
      deger: null,
      tahminiDeger: 5.5,
      aralik: 'normal'
    },"""

content = content.replace(old_ph_info, new_ph_info)

with open('engine/index.ts', 'w') as f:
    f.write(content)

