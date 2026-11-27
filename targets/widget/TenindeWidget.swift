//
//  Teninde — "Bugün için" widget'ı
//
//  Veri: uygulama App Group'a (group.com.teninde.app) "teninde_widget" anahtarıyla JSON yazar
//  (services/widgetPlan.ts → WidgetVerisi). Önümüzdeki 7 günün seçimi önceden hesaplandığı için
//  uygulama açılmasa da her gün doğru öneri görünür. Zaman çizelgesi her gece yarısı yeni güne geçer.
//
//  Boyutlar: küçük, orta (ana ekran) · dikdörtgen, satır içi (kilit ekranı).
//

import SwiftUI
import WidgetKit

private let APP_GROUP = "group.com.teninde.app"
private let VERI_ANAHTARI = "teninde_widget"

// MARK: - Veri

struct WGun: Codable { let tarih: String; let parfumId: String; let isim: String; let marka: String; let gerekce: String }
struct WKayit: Codable { let tarih: String; let parfumId: String; let isim: String; let marka: String }
struct WVeri: Codable {
  let v: Int
  let ad: String?
  let seri: Int
  let seriTarih: String?
  let kayit: WKayit?
  let gunler: [WGun]
  let dolaptan: Bool

  static let ornek = WVeri(
    v: 1, ad: nil, seri: 4, seriTarih: nil, kayit: nil,
    gunler: [WGun(tarih: "", parfumId: "", isim: "Terre d'Hermès", marka: "HERMÈS", gerekce: "Serin havada teninizde yumuşak ve sıcak açılır.")],
    dolaptan: true
  )
}

func gunAnahtari(_ d: Date) -> String {
  let c = Calendar.current.dateComponents([.year, .month, .day], from: d)
  return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
}

func veriOku() -> WVeri? {
  guard let s = UserDefaults(suiteName: APP_GROUP)?.string(forKey: VERI_ANAHTARI),
        let d = s.data(using: .utf8) else { return nil }
  return try? JSONDecoder().decode(WVeri.self, from: d)
}

// MARK: - Zaman çizelgesi

struct Giris: TimelineEntry {
  let date: Date
  let veri: WVeri?
  let onizleme: Bool

  /// Bu girişin gününe ait öneri
  var gun: WGun? {
    if onizleme { return veri?.gunler.first }
    let k = gunAnahtari(date)
    return veri?.gunler.first(where: { $0.tarih == k })
  }
  /// Bu gün parfüm kaydedildiyse
  var kayit: WKayit? {
    guard let k = veri?.kayit, k.tarih == gunAnahtari(date) else { return nil }
    return k
  }
  /// Seri yalnızca son kayıt bugün ya da dün ise sürer
  var seri: Int {
    guard let v = veri else { return 0 }
    if onizleme { return v.seri }
    guard let t = v.seriTarih else { return 0 }
    let bugun = gunAnahtari(date)
    let dun = gunAnahtari(Calendar.current.date(byAdding: .day, value: -1, to: date) ?? date)
    return (t == bugun || t == dun) ? v.seri : 0
  }
}

struct Saglayici: TimelineProvider {
  func placeholder(in context: Context) -> Giris { Giris(date: Date(), veri: .ornek, onizleme: true) }

  func getSnapshot(in context: Context, completion: @escaping (Giris) -> Void) {
    let v = veriOku()
    completion(Giris(date: Date(), veri: v ?? .ornek, onizleme: v == nil || context.isPreview))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<Giris>) -> Void) {
    let v = veriOku()
    let takvim = Calendar.current
    let simdi = Date()
    var girisler = [Giris(date: simdi, veri: v, onizleme: false)]
    let bugunBas = takvim.startOfDay(for: simdi)
    for i in 1...7 {
      if let d = takvim.date(byAdding: .day, value: i, to: bugunBas) {
        girisler.append(Giris(date: d, veri: v, onizleme: false))
      }
    }
    completion(Timeline(entries: girisler, policy: .atEnd))
  }
}

// MARK: - Görünümler

/// Uygulamanın tema token'ları (constants/theme.ts) — açık/koyu moda göre otomatik
private func renk(_ acik: UInt32, _ koyu: UInt32) -> Color {
  func ui(_ h: UInt32) -> UIColor {
    UIColor(red: CGFloat((h >> 16) & 0xFF) / 255, green: CGFloat((h >> 8) & 0xFF) / 255, blue: CGFloat(h & 0xFF) / 255, alpha: 1)
  }
  return Color(UIColor { $0.userInterfaceStyle == .dark ? ui(koyu) : ui(acik) })
}

private extension Color {
  static let zemin = renk(0xF7F3EE, 0x121010)
  static let murekkep = renk(0x1E1B18, 0xF2ECE4)
  static let soluk = renk(0x6F675F, 0xA89F95)
  static let vurgu = renk(0xA8642A, 0xD9955A)
  static let cizgi = renk(0xE4DCD2, 0x332C27)
}

private extension View {
  /// Ana ekranda krem zemin; kilit ekranında (accessory) sistem zemini — iOS 16'da kutu görünmesin
  @ViewBuilder func widgetZemini(kilitEkrani: Bool) -> some View {
    if #available(iOSApplicationExtension 17.0, *) {
      containerBackground(kilitEkrani ? Color.clear : Color.zemin, for: .widget)
    } else if kilitEkrani {
      self
    } else {
      padding(16).frame(maxWidth: .infinity, maxHeight: .infinity).background(Color.zemin)
    }
  }
}

struct Ust: View {
  let metin: String
  var body: some View {
    Text(metin)
      .font(.system(size: 10, weight: .semibold))
      .tracking(1.2)
      .foregroundColor(.vurgu)
      .lineLimit(1)
  }
}

struct SeriRozeti: View {
  let seri: Int
  var body: some View {
    HStack(spacing: 3) {
      Image(systemName: "flame")
        .font(.system(size: 10, weight: .semibold))
      Text("\(seri) gün")
        .font(.system(size: 11, weight: .semibold))
    }
    .foregroundColor(.soluk)
  }
}

struct KucukGorunum: View {
  let g: Giris
  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      if let k = g.kayit {
        Ust(metin: "BUGÜNÜN KOKUSU")
        Spacer(minLength: 6)
        Text(k.marka).font(.system(size: 10, weight: .medium)).tracking(0.8).foregroundColor(.soluk).lineLimit(1)
        Text(k.isim).font(.system(size: 17, weight: .semibold, design: .serif)).foregroundColor(.murekkep).lineLimit(3).minimumScaleFactor(0.8)
        Spacer(minLength: 6)
        Text("Akşam nasıldı?").font(.system(size: 11)).foregroundColor(.soluk)
      } else if let gun = g.gun {
        Ust(metin: "BUGÜN İÇİN")
        Spacer(minLength: 6)
        Text(gun.marka).font(.system(size: 10, weight: .medium)).tracking(0.8).foregroundColor(.soluk).lineLimit(1)
        Text(gun.isim).font(.system(size: 17, weight: .semibold, design: .serif)).foregroundColor(.murekkep).lineLimit(3).minimumScaleFactor(0.8)
        Spacer(minLength: 6)
        if g.seri >= 2 { SeriRozeti(seri: g.seri) } else { Text(g.veri?.dolaptan == true ? "Dolabınızdan" : "Teninize göre").font(.system(size: 11)).foregroundColor(.soluk) }
      } else {
        BosGorunum()
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

struct OrtaGorunum: View {
  let g: Giris
  var body: some View {
    HStack(alignment: .top, spacing: 14) {
      VStack(alignment: .leading, spacing: 0) {
        if let k = g.kayit {
          Ust(metin: "BUGÜNÜN KOKUSU")
          Spacer(minLength: 6)
          Text(k.marka).font(.system(size: 10, weight: .medium)).tracking(0.8).foregroundColor(.soluk).lineLimit(1)
          Text(k.isim).font(.system(size: 20, weight: .semibold, design: .serif)).foregroundColor(.murekkep).lineLimit(2).minimumScaleFactor(0.8)
          Spacer(minLength: 6)
          Text("Akşam teninizde ne kadar kaldığını kaydedin; öneriler buna göre gelişir.")
            .font(.system(size: 12)).foregroundColor(.soluk).lineLimit(2)
        } else if let gun = g.gun {
          Ust(metin: selamlama(g))
          Spacer(minLength: 6)
          Text(gun.marka).font(.system(size: 10, weight: .medium)).tracking(0.8).foregroundColor(.soluk).lineLimit(1)
          Text(gun.isim).font(.system(size: 20, weight: .semibold, design: .serif)).foregroundColor(.murekkep).lineLimit(2).minimumScaleFactor(0.8)
          Spacer(minLength: 6)
          Text(gun.gerekce).font(.system(size: 12)).foregroundColor(.soluk).lineLimit(3)
        } else {
          BosGorunum()
        }
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)

      if g.gun != nil || g.kayit != nil {
        VStack(alignment: .trailing) {
          MarkaIsareti()
          Spacer()
          if g.seri >= 2 { SeriRozeti(seri: g.seri) }
        }
      }
    }
  }

  func selamlama(_ g: Giris) -> String {
    if let ad = g.veri?.ad, !ad.isEmpty { return "\(ad.uppercased(with: Locale(identifier: "tr_TR"))), BUGÜN İÇİN" }
    return "BUGÜN İÇİN"
  }
}

/// Marka işareti: amber damla + ince ten çizgisi (uygulama simgesiyle aynı geometri, 100 birimlik ızgara;
/// kaynak: scripts/build_brand.py → ISARET). Izgaranın 17…83 x 15…81 bölümü kareye sığdırılır.
struct MarkaIsareti: View {
  var boyut: CGFloat = 34
  var body: some View {
    Canvas { ctx, size in
      let k = size.width / 66
      func p(_ x: CGFloat, _ y: CGFloat) -> CGPoint { CGPoint(x: (x - 17) * k, y: (y - 15) * k) }
      var damla = Path()
      damla.move(to: p(50, 19))
      damla.addCurve(to: p(34, 53), control1: p(46.5, 26), control2: p(34, 39.5))
      damla.addArc(center: p(50, 53), radius: 16 * k, startAngle: .degrees(180), endAngle: .degrees(0), clockwise: true)
      damla.addCurve(to: p(50, 19), control1: p(66, 39.5), control2: p(53.5, 26))
      damla.closeSubpath()
      ctx.fill(damla, with: .color(.vurgu))
      var ten = Path()
      ten.move(to: p(25, 76))
      ten.addQuadCurve(to: p(75, 76), control: p(50, 70))
      ctx.stroke(ten, with: .color(.murekkep), style: StrokeStyle(lineWidth: 5 * k, lineCap: .round))
    }
    .frame(width: boyut, height: boyut)
  }
}

struct BosGorunum: View {
  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      MarkaIsareti(boyut: 26)
      Text("Günün önerisi için uygulamayı bir kez açın.")
        .font(.system(size: 13, weight: .medium)).foregroundColor(.murekkep).lineLimit(3)
    }
  }
}

struct DikdortgenGorunum: View {
  let g: Giris
  var body: some View {
    VStack(alignment: .leading, spacing: 1) {
      if let k = g.kayit {
        Text("Bugünün kokusu").font(.system(size: 11, weight: .semibold)).widgetAccentable()
        Text(k.isim).font(.system(size: 15, weight: .semibold)).lineLimit(1)
        Text(k.marka).font(.system(size: 11)).lineLimit(1).opacity(0.75)
      } else if let gun = g.gun {
        Text(g.seri >= 2 ? "Bugün için · \(g.seri) gün" : "Bugün için").font(.system(size: 11, weight: .semibold)).widgetAccentable()
        Text(gun.isim).font(.system(size: 15, weight: .semibold)).lineLimit(1)
        Text(gun.marka).font(.system(size: 11)).lineLimit(1).opacity(0.75)
      } else {
        Text("Teninde").font(.system(size: 13, weight: .semibold))
        Text("Önerinizi görmek için açın").font(.system(size: 11)).opacity(0.75)
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}

struct TenindeWidgetGorunumu: View {
  @Environment(\.widgetFamily) var aile
  let g: Giris

  var body: some View {
    Group {
      switch aile {
      case .systemMedium: OrtaGorunum(g: g)
      case .accessoryRectangular: DikdortgenGorunum(g: g)
      case .accessoryInline:
        if let k = g.kayit { Text("Bugün: \(k.isim)") }
        else if let gun = g.gun { Text("Bugün için: \(gun.isim)") }
        else { Text("Teninde") }
      default: KucukGorunum(g: g)
      }
    }
    .widgetURL(URL(string: g.kayit != nil ? "teninde://diary" : "teninde://"))
    .widgetZemini(kilitEkrani: aile == .accessoryRectangular || aile == .accessoryInline)
  }
}

// MARK: - Widget

@main
struct TenindeWidget: Widget {
  let kind = "TenindeWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: Saglayici()) { giris in
      TenindeWidgetGorunumu(g: giris)
    }
    .configurationDisplayName("Bugün için")
    .description("Dolabınızdan ve teninize göre günün parfümü, seriniz ve bugünün kokusu.")
    .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline])
  }
}
