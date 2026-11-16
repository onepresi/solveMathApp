import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme, withAlpha } from '@/hooks/use-theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

export function Card({ children, style, onPress }: CardProps) {
  const { colors } = useTheme();
  const base = [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style];

  if (!onPress) return <View style={base}>{children}</View>;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

type SectionHeaderProps = {
  title: string;
  action?: string;
  onActionPress?: () => void;
};

export function SectionHeader({ title, action, onActionPress }: SectionHeaderProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="heading">{title}</AppText>
      {action ? (
        <Pressable onPress={onActionPress} hitSlop={8}>
          <AppText variant="subheading" color={colors.primary}>
            {action}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Icon badge — tinted rounded square with an icon
// ---------------------------------------------------------------------------

type IconBadgeProps = {
  icon: IconName;
  color: string;
  size?: number;
};

export function IconBadge({ icon, color, size = 40 }: IconBadgeProps) {
  return (
    <View
      style={[
        styles.iconBadge,
        { width: size, height: size, borderRadius: size * 0.3, backgroundColor: withAlpha(color, 0.15) },
      ]}>
      <Ionicons name={icon} size={size * 0.5} color={color} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Chip / pill
// ---------------------------------------------------------------------------

type ChipProps = {
  label: string;
  selected?: boolean;
  color?: string;
  onPress?: () => void;
};

export function Chip({ label, selected, color, onPress }: ChipProps) {
  const { colors } = useTheme();
  const accent = color ?? colors.primary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
      style={[
        styles.chip,
        selected
          ? { backgroundColor: accent, borderColor: accent }
          : { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      <AppText variant="caption" style={styles.chipText} color={selected ? colors.onPrimary : colors.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** Small non-interactive tag, e.g. a topic label. */
export function Tag({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: withAlpha(color, 0.14) }]}>
      <AppText variant="caption" style={styles.tagText} color={color}>
        {label}
      </AppText>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

type ProgressBarProps = {
  value: number; // 0..1
  color?: string;
  trackColor?: string;
  height?: number;
};

export function ProgressBar({ value, color, trackColor, height = 6 }: ProgressBarProps) {
  const { colors } = useTheme();
  const pct = `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` as const;
  return (
    <View style={[styles.track, { height, backgroundColor: trackColor ?? colors.surfaceAlt }]}>
      <View style={[styles.fill, { width: pct, backgroundColor: color ?? colors.primary }]} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

type ButtonProps = {
  label: string;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'danger';
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, icon, variant = 'primary', onPress, loading, disabled, style }: ButtonProps) {
  const { colors } = useTheme();
  const fg = { primary: colors.onPrimary, secondary: colors.primary, danger: colors.danger }[variant];
  const bg = { primary: colors.primary, secondary: colors.primarySoft, danger: colors.dangerSoft }[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : icon ? (
        <Ionicons name={icon} size={18} color={fg} />
      ) : null}
      <AppText variant="subheading" color={fg}>
        {label}
      </AppText>
    </Pressable>
  );
}

type IconButtonProps = {
  icon: IconName;
  onPress?: () => void;
  accessibilityLabel: string;
};

export function IconButton({ icon, onPress, accessibilityLabel }: IconButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}>
      <Ionicons name={icon} size={20} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
  },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.5 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: -Spacing.sm,
  },
  iconBadge: { alignItems: 'center', justifyContent: 'center' },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  chipText: { fontWeight: '600' },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  tagText: { fontSize: 12, fontWeight: '700' },
  track: { width: '100%', borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: 48,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
