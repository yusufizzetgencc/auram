/**
 * TENİNDE — Koku Danışmanı servisi
 *
 * Varsayılan: cihazda çalışan kural tabanlı danışman (engine/advisor.ts). İnternet gerektirmez.
 *
 * İsteğe bağlı dil modeli: EXPO_PUBLIC_ADVISOR_URL tanımlıysa soru, KİŞİSEL VERİ İÇERMEYEN kısa bir bağlamla
 * (ten eğilimi etiketi, dolaptaki parfüm kimlikleri, etkinlik) bu uç noktaya gönderilir. Uç nokta
 * { metin: string, parfumIds: string[] } döndürmelidir. API anahtarı uygulamaya GÖMÜLMEZ; anahtar sunucuda durur
 * (ör. küçük bir Cloudflare Worker / Vercel fonksiyonu). Yanıt gelmezse veya hatalıysa yerel danışmana düşülür.
 * Modelin önerdiği kimlikler katalogla süzülür; katalogda olmayan parfüm gösterilmez.
 */
import { danismanCevabi, DanismanBaglami, DanismanCevabi, soruyuAyristir } from '@/engine';

const URL_ = process.env.EXPO_PUBLIC_ADVISOR_URL ?? '';
const ZAMAN_ASIMI = 12_000;

export async function askAdvisor(soru: string, ctx: DanismanBaglami): Promise<DanismanCevabi & { kaynak: 'yerel' | 'model' }> {
  const yerel = () => ({ ...danismanCevabi(soruyuAyristir(soru, ctx.katalog), ctx), kaynak: 'yerel' as const });
  if (!URL_) return yerel();

  const kontrol = new AbortController();
  const t = setTimeout(() => kontrol.abort(), ZAMAN_ASIMI);
  try {
    const res = await fetch(URL_, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: kontrol.signal,
      body: JSON.stringify({
        soru,
        baglam: {
          dolap: ctx.dolap.map(p => p.id),
          aileler: ctx.prefs.kokuTipleri ?? [],
          aura: ctx.prefs.aura,
          cinsiyet: ctx.prefs.cinsiyetAlgisi,
          ph: Math.round(ctx.ph * 10) / 10,
        },
      }),
    });
    if (!res.ok) return yerel();
    const json = (await res.json()) as { metin?: string; parfumIds?: string[] };
    const byId = new Map(ctx.katalog.map(p => [p.id, p]));
    const oneriler = (json.parfumIds ?? []).map(id => byId.get(id)).filter(Boolean).slice(0, 4).map(p => ({ parfum: p!, not: `${p!.tip} ailesinden` }));
    if (!json.metin) return yerel();
    return { metin: json.metin, oneriler, devam: [], kaynak: 'model' };
  } catch {
    return yerel();
  } finally {
    clearTimeout(t);
  }
}
