import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { Card, SectionHeader, Tag } from '@/components/ui/primitives';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { TOPICS } from '@/constants/topics';
import { useSavedScans } from '@/lib/saved-store';
import type { SolutionTopic } from '@/types/solution';

const MAX_CONCEPTS = 24;

export default function LearnScreen() {
  const { scans } = useSavedScans();

  // Key concepts from saved solutions, most frequent first.
  const concepts = new Map<string, { label: string; topic: SolutionTopic; count: number }>();
  for (const problem of scans.flatMap((s) => s.result.problems)) {
    for (const raw of problem.keyConcepts) {
      const label = raw.trim();
      if (!label) continue;
      const key = label.toLowerCase();
      const entry = concepts.get(key);
      if (entry) entry.count += 1;
      else concepts.set(key, { label, topic: problem.topic, count: 1 });
    }
  }
  const topConcepts = [...concepts.values()].sort((a, b) => b.count - a.count).slice(0, MAX_CONCEPTS);

  return (
    <Screen title="Learn" subtitle="Build your skills, one concept at a time">
      <EmptyState
        icon="school-outline"
        title="Lessons are on the way"
        message="Guided lessons for each topic are coming soon. In the meantime, every solution you save includes a step-by-step explanation."
      />

      {topConcepts.length > 0 ? (
        <>
          <SectionHeader title="Concepts to review" action="Saved" onActionPress={() => router.navigate('/saved')} />
          <Card style={styles.concepts}>
            <AppText variant="caption" muted>
              From the solutions you&apos;ve saved
            </AppText>
            <View style={styles.tags}>
              {topConcepts.map((c) => (
                <Tag key={c.label} label={c.count > 1 ? `${c.label} ×${c.count}` : c.label} color={TOPICS[c.topic].color} />
              ))}
            </View>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  concepts: { gap: Spacing.md },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
