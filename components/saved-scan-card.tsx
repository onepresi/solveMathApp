import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Tag } from '@/components/ui/primitives';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { TOPICS } from '@/constants/topics';
import { useTheme } from '@/hooks/use-theme';
import { formatSavedDate } from '@/lib/saved-store';
import type { SavedScan } from '@/types/saved';

type Props = {
  scan: SavedScan;
  onLongPress?: () => void;
};

/** One saved scan: photo thumbnail, first question, answer, topic, and date. */
export function SavedScanCard({ scan, onLongPress }: Props) {
  const { colors } = useTheme();
  const [first, ...rest] = scan.result.problems;
  const topic = TOPICS[first?.topic ?? 'other'];
  const steps = scan.result.problems.reduce((n, p) => n + p.steps.length, 0);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/saved/[id]', params: { id: scan.id } })}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`Saved problem: ${first?.question ?? 'Scan'}`}
      accessibilityHint="Opens the full solution"
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}>
      <Image
        source={{ uri: scan.imageUri }}
        style={[styles.thumb, { backgroundColor: colors.surfaceAlt }]}
        contentFit="cover"
        transition={150}
        accessibilityIgnoresInvertColors
      />
      <View style={styles.body}>
        <AppText variant="math" numberOfLines={2} style={styles.question}>
          {first?.question ?? 'Saved scan'}
        </AppText>
        {first ? (
          <AppText variant="caption" muted numberOfLines={1}>
            Answer:{' '}
            <AppText variant="caption" style={styles.answer}>
              {first.finalAnswer}
            </AppText>
          </AppText>
        ) : null}
        <View style={styles.meta}>
          <Tag label={topic.name} color={topic.color} />
          {rest.length > 0 ? <Tag label={`+${rest.length} more`} color={colors.textMuted} /> : null}
          <AppText variant="caption" muted numberOfLines={1} style={styles.flex}>
            {steps} steps · {formatSavedDate(scan.savedAt)}
          </AppText>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: { opacity: 0.75 },
  thumb: { width: 72, height: 72, borderRadius: Radius.md },
  body: { flex: 1, gap: 4 },
  question: { fontSize: 15, lineHeight: 21 },
  answer: { fontWeight: '700' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 2 },
  flex: { flexShrink: 1 },
});
