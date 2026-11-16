import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { PhotoCaptureWidget } from '@/components/photo-capture-widget';
import { SavedScanCard } from '@/components/saved-scan-card';
import { Card, IconBadge, ProgressBar, SectionHeader, type IconName } from '@/components/ui/primitives';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { TOPICS } from '@/constants/topics';
import { usePhotoPicker } from '@/hooks/use-photo-picker';
import { useTheme } from '@/hooks/use-theme';
import { countProblems, useSavedScans } from '@/lib/saved-store';
import { setScanPhoto } from '@/lib/scan-session';
import { SOLUTION_TOPICS } from '@/types/solution';

const QUICK_ACTIONS: { label: string; icon: IconName }[] = [
  { label: 'Type it', icon: 'create-outline' },
  { label: 'Draw it', icon: 'brush-outline' },
  { label: 'Graph it', icon: 'stats-chart-outline' },
  { label: 'Calculator', icon: 'calculator-outline' },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { photo, busy, takePhoto, pickPhoto, clear } = usePhotoPicker();
  const { status, scans } = useSavedScans();

  const problems = scans.flatMap((s) => s.result.problems);
  const topicStats = SOLUTION_TOPICS.map((key) => ({
    key,
    count: problems.filter((p) => p.topic === key).length,
  }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);

  return (
    <Screen title={greeting()} subtitle="Ready to crack some math?">
      {/* Photo capture widget: take or upload a problem photo, then preview it */}
      <PhotoCaptureWidget
        photo={photo}
        busy={busy}
        onTakePhoto={takePhoto}
        onPickPhoto={pickPhoto}
        onClear={clear}
        onSolve={() => {
          if (!photo) return;
          setScanPhoto(photo);
          router.push('/solution');
        }}
      />

      {/* Quick actions */}
      <View style={styles.quickRow}>
        {QUICK_ACTIONS.map((a) => (
          <Pressable key={a.label} style={styles.quickItem}>
            <View style={[styles.quickIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name={a.icon} size={22} color={colors.primary} />
            </View>
            <AppText variant="caption" muted numberOfLines={1}>
              {a.label}
            </AppText>
          </Pressable>
        ))}
      </View>

      {/* Stats from saved problems */}
      <View style={styles.statsRow}>
        <StatTile icon="bookmark" color={colors.primary} value={`${scans.length}`} label="Saved scans" />
        <StatTile icon="checkmark-done" color={colors.success} value={`${countProblems(scans)}`} label="Problems" />
        <StatTile icon="layers" color={colors.warning} value={`${topicStats.length}`} label="Topics" />
      </View>

      {/* Recently saved */}
      <SectionHeader
        title="Recently saved"
        action={scans.length > 0 ? 'See all' : undefined}
        onActionPress={() => router.navigate('/saved')}
      />
      {status === 'ready' && scans.length === 0 ? (
        <Card style={styles.emptyRow}>
          <IconBadge icon="bookmark-outline" color={colors.primary} size={40} />
          <AppText variant="caption" muted style={styles.flex}>
            Solve a problem and tap Save. Your photo and full solution will show up here.
          </AppText>
        </Card>
      ) : (
        <View style={styles.list}>
          {scans.slice(0, 3).map((scan) => (
            <SavedScanCard key={scan.id} scan={scan} />
          ))}
        </View>
      )}

      {/* Topic mix of saved problems */}
      {topicStats.length > 0 ? (
        <>
          <SectionHeader title="Your topics" />
          <Card style={styles.progressCard}>
            {topicStats.map((t) => {
              const topic = TOPICS[t.key];
              return (
                <View key={t.key} style={styles.progressRow}>
                  <IconBadge icon={topic.icon} color={topic.color} size={34} />
                  <View style={styles.progressBody}>
                    <View style={styles.progressLabel}>
                      <AppText variant="subheading">{topic.name}</AppText>
                      <AppText variant="caption" muted>
                        {t.count} {t.count === 1 ? 'problem' : 'problems'}
                      </AppText>
                    </View>
                    <ProgressBar value={t.count / problems.length} color={topic.color} />
                  </View>
                </View>
              );
            })}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function StatTile({ icon, color, value, label }: { icon: IconName; color: string; value: string; label: string }) {
  return (
    <Card style={styles.statTile}>
      <Ionicons name={icon} size={20} color={color} />
      <AppText variant="heading">{value}</AppText>
      <AppText variant="caption" muted numberOfLines={1}>
        {label}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  quickItem: { flex: 1, alignItems: 'center', gap: 6 },
  quickIcon: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 64,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statTile: { flex: 1, gap: 4, padding: Spacing.md },
  list: { gap: Spacing.sm },
  flex: { flex: 1 },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  progressCard: { gap: Spacing.lg },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  progressBody: { flex: 1, gap: 6 },
  progressLabel: { flexDirection: 'row', justifyContent: 'space-between' },
});
