import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Children, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Switch, View, type SwitchProps } from 'react-native';

import { Card, IconBadge, type IconName } from '@/components/ui/primitives';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { Spacing, TopicColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructive, notify } from '@/lib/dialogs';
import { countProblems, deleteAllScans, useSavedScans } from '@/lib/saved-store';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { status, scans } = useSavedScans();
  const [clearing, setClearing] = useState(false);

  // Local UI-only toggle state. Nothing is persisted yet.
  const [notifications, setNotifications] = useState(true);
  const [stepByStep, setStepByStep] = useState(true);
  const [haptics, setHaptics] = useState(false);

  const problems = countProblems(scans);
  const savedSummary =
    status === 'loading' ? '…' : `${scans.length} ${scans.length === 1 ? 'scan' : 'scans'} · ${problems} ${problems === 1 ? 'problem' : 'problems'}`;

  async function clearSaved() {
    if (clearing || scans.length === 0) return;
    const ok = await confirmDestructive(
      'Delete all saved problems?',
      `This removes ${scans.length === 1 ? 'your saved scan' : `all ${scans.length} saved scans`} and their solutions from this device. This can't be undone.`,
      'Delete all'
    );
    if (!ok) return;
    setClearing(true);
    try {
      await deleteAllScans();
    } catch (e) {
      notify("Couldn't delete", e instanceof Error && e.message ? e.message : 'Please try again.');
    } finally {
      setClearing(false);
    }
  }

  return (
    <Screen title="Settings">
      <Group title="Saved problems">
        <Row
          icon="bookmark-outline"
          color={TopicColors.algebra}
          label="On this device"
          value={savedSummary}
          onPress={() => router.navigate('/saved')}
        />
        <Row
          icon="trash-outline"
          color={colors.danger}
          label={clearing ? 'Deleting…' : 'Delete all saved problems'}
          labelColor={scans.length > 0 ? colors.danger : colors.textMuted}
          onPress={scans.length > 0 ? clearSaved : undefined}
          hideChevron
        />
      </Group>

      <Group title="Preferences">
        <Row icon="notifications-outline" color={TopicColors.trigonometry} label="Homework reminders">
          <Toggle value={notifications} onValueChange={setNotifications} />
        </Row>
        <Row icon="list-outline" color={TopicColors.algebra} label="Always show steps">
          <Toggle value={stepByStep} onValueChange={setStepByStep} />
        </Row>
        <Row icon="phone-portrait-outline" color={TopicColors.geometry} label="Haptic feedback">
          <Toggle value={haptics} onValueChange={setHaptics} />
        </Row>
        <Row icon="calculator-outline" color={TopicColors.arithmetic} label="Angle units" value="Degrees" />
      </Group>

      <Group title="App">
        <Row icon="color-palette-outline" color={TopicColors.calculus} label="Appearance" value="System" />
        <Row icon="language-outline" color={TopicColors.statistics} label="Language" value="English" />
      </Group>

      <Group title="Support">
        <Row icon="help-buoy-outline" color={TopicColors.algebra} label="Help center" />
        <Row icon="chatbubble-ellipses-outline" color={TopicColors.arithmetic} label="Send feedback" />
        <Row icon="shield-checkmark-outline" color={colors.textMuted} label="Privacy policy" />
        <Row icon="document-text-outline" color={colors.textMuted} label="Terms of service" />
      </Group>

      <View style={styles.footer}>
        <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} />
        <AppText variant="caption" muted style={styles.footerText}>
          Saved problems are stored only on this device.
        </AppText>
      </View>
      <AppText variant="caption" muted style={styles.version}>
        Version {Constants.expoConfig?.version ?? '1.0.0'}
      </AppText>
    </Screen>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme();
  const items = Children.toArray(children);
  return (
    <View style={styles.group}>
      <AppText variant="label" muted style={styles.groupTitle}>
        {title}
      </AppText>
      <Card style={styles.groupCard}>
        {items.map((child, i) => (
          <View key={i}>
            {i > 0 ? <View style={[styles.divider, { backgroundColor: colors.border }]} /> : null}
            {child}
          </View>
        ))}
      </Card>
    </View>
  );
}

type RowProps = {
  icon: IconName;
  color: string;
  label: string;
  labelColor?: string;
  value?: string;
  onPress?: () => void;
  hideChevron?: boolean;
  children?: ReactNode;
};

function Row({ icon, color, label, labelColor, value, onPress, hideChevron, children }: RowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress && !!children}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={value ? `${label}, ${value}` : label}
      style={({ pressed }) => [styles.row, pressed && !children && { opacity: 0.6 }]}>
      <IconBadge icon={icon} color={color} size={32} />
      <AppText variant="body" style={styles.flex} numberOfLines={1} color={labelColor}>
        {label}
      </AppText>
      {children ?? (
        <View style={styles.rowRight}>
          {value ? (
            <AppText variant="caption" muted>
              {value}
            </AppText>
          ) : null}
          {hideChevron ? null : <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  group: { gap: Spacing.sm },
  groupTitle: { marginLeft: Spacing.xs },
  groupCard: { paddingVertical: 0, paddingHorizontal: 0 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 64 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 54,
    paddingHorizontal: Spacing.lg,
  },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs },
  footerText: { textAlign: 'center' },
  version: { textAlign: 'center', marginTop: -Spacing.md },
});

/** Themed switch. `activeThumbColor` is a react-native-web-only prop (defaults to teal there). */
function Toggle(props: Pick<SwitchProps, 'value' | 'onValueChange'>) {
  const { colors } = useTheme();
  const webOnly = Platform.OS === 'web' ? ({ activeThumbColor: '#FFFFFF' } as object) : {};
  return (
    <Switch
      {...props}
      {...webOnly}
      trackColor={{ false: colors.border, true: colors.primary }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={colors.border}
    />
  );
}
