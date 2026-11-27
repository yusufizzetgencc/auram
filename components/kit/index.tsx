/**
 * TENİNDE — Ortak arayüz bileşenleri (kit)
 * Tüm ekranlar bu bileşenlerle kurulur; böylece tipografi, boşluk ve renk her yerde aynıdır.
 */
import { trUpper } from '@/utils/text';
import { BorderRadius, Colors, FontFamilies, ScentTypeColors, Shadows, Spacing, ThemeColors, Type } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { hapticLight } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type IconName = keyof typeof Ionicons.glyphMap;

export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return Colors[scheme ?? 'light'];
}

export function useFloatingShadow() {
  const scheme = useColorScheme();
  return Shadows[scheme ?? 'light'].lg;
}

// ---------------- Metin ----------------
type Variant = keyof typeof Type;
interface TProps extends TextProps {
  variant?: Variant;
  color?: 'ink' | 'muted' | 'subtle' | 'accent' | 'onAccent' | 'danger' | 'success';
  align?: TextStyle['textAlign'];
  /** overline büyük harf kuralı: 'tr' (varsayılan) veya 'latin' (marka gibi yabancı adlar) */
  caps?: 'tr' | 'latin';
  style?: StyleProp<TextStyle>;
}
const upperWith = (fn: (s: string) => string) => {
  const go = (node: React.ReactNode): React.ReactNode =>
    typeof node === 'string' ? fn(node) : Array.isArray(node) ? node.map(go) : node;
  return go;
};
// "pH" bir birim/semboldür; büyük harfe çevrilmez
const upperTr = upperWith(s => trUpper(s).replace(/\bPH\b/g, 'pH'));
/** Yabancı özel adlar (marka) için Latin büyük harf: "Maison" → "MAISON", "MAİSON" değil */
const upperLatin = upperWith(s => s.toUpperCase());

export function T({ variant = 'body', color = 'ink', align, style, children, caps = 'tr', ...rest }: TProps) {
  const c = useTheme();
  const map = { ink: c.ink, muted: c.inkMuted, subtle: c.inkSubtle, accent: c.accent, onAccent: c.onAccent, danger: c.danger, success: c.success };
  return (
    <Text {...rest} style={[Type[variant], { color: map[color] }, align ? { textAlign: align } : null, style]}>
      {variant === 'overline' ? (caps === 'latin' ? upperLatin(children) : upperTr(children)) : children}
    </Text>
  );
}

// ---------------- Ekran iskeleti ----------------
interface ScreenProps extends ScrollViewProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  footer?: React.ReactNode;
  edgesTop?: boolean;
}
export function Screen({ children, scroll = true, padded = true, footer, edgesTop = true, contentContainerStyle, ...rest }: ScreenProps) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const pad = padded ? { paddingHorizontal: Spacing.lg } : null;
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: edgesTop ? insets.top : 0 }}>
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[pad, { paddingBottom: footer ? Spacing.lg : insets.bottom + Spacing['3xl'] }, contentContainerStyle]}
          {...rest}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad]}>{children}</View>
      )}
      {footer ? (
        <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: insets.bottom + Spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border, backgroundColor: c.bg }}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}

/** Üst başlık: geri düğmesi + başlık + sağ eylem */
export function Header({ title, back = true, right, onBack, overline }: { title?: string; back?: boolean; right?: React.ReactNode; onBack?: () => void; overline?: string }) {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <View style={styles.headerSide}>
        {back ? <IconButton name="chevron-back" onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/(tabs)')))} accessibilityLabel="Geri" /> : null}
      </View>
      <View style={{ flex: 1, alignItems: 'center' }}>
        {overline ? <T variant="overline" color="subtle">{overline}</T> : null}
        {title ? <T variant="h3" numberOfLines={1}>{title}</T> : null}
      </View>
      <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>{right}</View>
    </View>
  );
}

/** Büyük sayfa başlığı (sekme ekranları için) */
export function PageTitle({ overline, title, subtitle, right }: { overline?: string; title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <View style={{ paddingTop: Spacing.lg, paddingBottom: Spacing.xl }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          {overline ? <T variant="overline" color="accent" style={{ marginBottom: Spacing.sm }}>{overline}</T> : null}
          <T variant="h1">{title}</T>
        </View>
        {right}
      </View>
      {subtitle ? <T variant="body" color="muted" style={{ marginTop: Spacing.sm }}>{subtitle}</T> : null}
    </View>
  );
}

// ---------------- Düğmeler ----------------
interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent';
  icon?: IconName;
  iconRight?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  size?: 'md' | 'sm';
}
export function Button({ label, onPress, variant = 'primary', icon, iconRight, disabled, loading, style, size = 'md' }: ButtonProps) {
  const c = useTheme();
  const bg = variant === 'primary' ? c.ink : variant === 'accent' ? c.accent : variant === 'secondary' ? c.surface : 'transparent';
  const fg = variant === 'primary' ? c.bg : variant === 'accent' ? c.onAccent : c.ink;
  const border = variant === 'secondary' ? c.border : 'transparent';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={() => { hapticLight(); onPress?.(); }}
      style={({ pressed }) => [
        styles.button,
        size === 'sm' && styles.buttonSm,
        { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : (
        <>
          {icon ? <Ionicons name={icon} size={size === 'sm' ? 16 : 18} color={fg} /> : null}
          <Text style={[size === 'sm' ? Type.smallStrong : Type.bodyStrong, { color: fg }]}>{label}</Text>
          {iconRight ? <Ionicons name={iconRight} size={size === 'sm' ? 16 : 18} color={fg} /> : null}
        </>
      )}
    </Pressable>
  );
}

export function IconButton({ name, onPress, size = 22, color, accessibilityLabel, filled }: { name: IconName; onPress?: () => void; size?: number; color?: string; accessibilityLabel?: string; filled?: boolean }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPress={() => { hapticLight(); onPress?.(); }}
      style={({ pressed }) => [styles.iconButton, filled && { backgroundColor: c.surface, borderColor: c.border, borderWidth: StyleSheet.hairlineWidth }, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Ionicons name={name} size={size} color={color ?? c.ink} />
    </Pressable>
  );
}

// ---------------- Yüzeyler ----------------
export function Card({ children, style, onPress, tone = 'surface' }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; tone?: 'surface' | 'alt' | 'accent' }) {
  const c = useTheme();
  const bg = tone === 'alt' ? c.surfaceAlt : tone === 'accent' ? c.accentSoft : c.surface;
  const base = [styles.card, { backgroundColor: bg, borderColor: tone === 'surface' ? c.border : 'transparent' }, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable onPress={() => { hapticLight(); onPress(); }} style={({ pressed }) => [base, { opacity: pressed ? 0.9 : 1 }]}>
      {children}
    </Pressable>
  );
}

export function Section({ title, action, onAction, children, style }: { title: string; action?: string; onAction?: () => void; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ marginTop: Spacing['2xl'] }, style]}>
      <View style={styles.sectionHead}>
        <T variant="h2" style={{ flex: 1 }}>{title}</T>
        {action ? (
          <Pressable onPress={onAction} hitSlop={8}>
            <T variant="smallStrong" color="accent">{action}</T>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const c = useTheme();
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: c.border }, style]} />;
}

// ---------------- Küçük öğeler ----------------
export function Chip({ label, selected, onPress, icon, color }: { label: string; selected?: boolean; onPress?: () => void; icon?: IconName; color?: string }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress ? () => { hapticLight(); onPress(); } : undefined}
      style={[styles.chip, { backgroundColor: selected ? c.ink : c.surface, borderColor: selected ? c.ink : c.border }]}
    >
      {color ? <View style={[styles.dot, { backgroundColor: color }]} /> : null}
      {icon ? <Ionicons name={icon} size={14} color={selected ? c.bg : c.inkMuted} /> : null}
      <Text style={[Type.smallStrong, { color: selected ? c.bg : c.ink }]}>{label}</Text>
    </Pressable>
  );
}

export function FamilyDot({ family, size = 8 }: { family: string; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: ScentTypeColors[family] ?? '#999' }} />;
}

export function Tag({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'accent' }) {
  const c = useTheme();
  return (
    <View style={[styles.tag, { backgroundColor: tone === 'accent' ? c.accentSoft : c.surfaceAlt }]}>
      <Text style={[Type.small, { color: tone === 'accent' ? c.accent : c.inkMuted, fontFamily: FontFamilies.medium }]}>{label}</Text>
    </View>
  );
}

export function ListRow({ icon, title, subtitle, right, onPress, danger }: { icon?: IconName; title: string; subtitle?: string; right?: React.ReactNode; onPress?: () => void; danger?: boolean }) {
  const c = useTheme();
  return (
    <Pressable onPress={onPress ? () => { hapticLight(); onPress(); } : undefined} style={({ pressed }) => [styles.row, { opacity: pressed && onPress ? 0.6 : 1 }]}>
      {icon ? (
        <View style={[styles.rowIcon, { backgroundColor: c.surfaceAlt }]}>
          <Ionicons name={icon} size={18} color={danger ? c.danger : c.ink} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <T variant="bodyStrong" color={danger ? 'danger' : 'ink'}>{title}</T>
        {subtitle ? <T variant="small" color="muted">{subtitle}</T> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={c.inkSubtle} /> : null)}
    </Pressable>
  );
}

export function ProgressLine({ value, height = 3 }: { value: number; height?: number }) {
  const c = useTheme();
  return (
    <View style={{ height, borderRadius: height, backgroundColor: c.border, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(100, value))}%`, height, backgroundColor: c.accent }} />
    </View>
  );
}

export function Stat({ label, value, hint, align = 'left' }: { label: string; value: string; hint?: string; align?: 'left' | 'center' }) {
  return (
    <View style={{ flex: 1, alignItems: align === 'center' ? 'center' : 'flex-start' }}>
      <T variant="overline" color="subtle">{label}</T>
      <T variant="h2" style={{ marginTop: 4 }}>{value}</T>
      {hint ? <T variant="small" color="muted">{hint}</T> : null}
    </View>
  );
}

export function EmptyState({ icon, title, body, actionLabel, onAction }: { icon: IconName; title: string; body?: string; actionLabel?: string; onAction?: () => void }) {
  const c = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { borderColor: c.accent }]}>
        <Ionicons name={icon} size={26} color={c.accent} />
      </View>
      <T variant="h3" align="center">{title}</T>
      {body ? <T variant="body" color="muted" align="center" style={{ marginTop: 6 }}>{body}</T> : null}
      {actionLabel ? <Button label={actionLabel} onPress={onAction} variant="secondary" size="sm" style={{ marginTop: Spacing.lg }} /> : null}
    </View>
  );
}

/** Seçilebilir cevap kartı (onboarding ve formlar) */
export function OptionCard({ title, subtitle, icon, selected, onPress, multi }: { title: string; subtitle?: string; icon?: IconName; selected?: boolean; onPress: () => void; multi?: boolean }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: !!selected }}
      onPress={() => { hapticLight(); onPress(); }}
      style={({ pressed }) => [
        styles.option,
        { backgroundColor: selected ? c.accentSoft : c.surface, borderColor: selected ? c.accent : c.border, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      {icon ? (
        <View style={[styles.optionIcon, { backgroundColor: selected ? c.surface : c.surfaceAlt }]}>
          <Ionicons name={icon} size={18} color={selected ? c.accent : c.ink} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <T variant="bodyStrong">{title}</T>
        {subtitle ? <T variant="small" color="muted" style={{ marginTop: 2 }}>{subtitle}</T> : null}
      </View>
      <View style={[multi ? styles.checkSquare : styles.checkCircle, { borderColor: selected ? c.accent : c.border, backgroundColor: selected ? c.accent : 'transparent' }]}>
        {selected ? <Ionicons name="checkmark" size={14} color={c.onAccent} /> : null}
      </View>
    </Pressable>
  );
}

/** Bölümlü seçici (sekme benzeri) */
export function Segmented<V extends string>({ value, options, onChange }: { value: V; options: { value: V; label: string }[]; onChange: (v: V) => void }) {
  const c = useTheme();
  return (
    <View style={[styles.segment, { backgroundColor: c.surfaceAlt }]}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => { hapticLight(); onChange(o.value); }} style={[styles.segmentItem, active && { backgroundColor: c.surface, borderColor: c.border, borderWidth: StyleSheet.hairlineWidth }]}>
            <Text style={[Type.smallStrong, { color: active ? c.ink : c.inkMuted }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', height: 52, paddingHorizontal: Spacing.sm },
  headerSide: { width: 56 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 52, paddingHorizontal: Spacing.xl, borderRadius: BorderRadius.full, borderWidth: StyleSheet.hairlineWidth },
  buttonSm: { height: 40, paddingHorizontal: Spacing.lg },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: BorderRadius.lg, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.lg },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', marginBottom: Spacing.md },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 14, borderRadius: BorderRadius.full, borderWidth: StyleSheet.hairlineWidth },
  dot: { width: 8, height: 8, borderRadius: 4 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full, alignSelf: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 56, paddingVertical: Spacing.sm },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: Spacing['3xl'], paddingHorizontal: Spacing.xl },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  option: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 1 },
  optionIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  checkCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  checkSquare: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  segment: { flexDirection: 'row', padding: 3, borderRadius: BorderRadius.full },
  segmentItem: { flex: 1, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: BorderRadius.full },
});
