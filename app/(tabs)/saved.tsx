import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { SavedScanCard } from '@/components/saved-scan-card';
import { Button, Chip } from '@/components/ui/primitives';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { TOPICS } from '@/constants/topics';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructive, notify } from '@/lib/dialogs';
import { countProblems, deleteScan, searchableText, useSavedScans } from '@/lib/saved-store';
import type { SavedScan } from '@/types/saved';
import { SOLUTION_TOPICS, type SolutionTopic } from '@/types/solution';

type Filter = 'all' | SolutionTopic;

export default function SavedScreen() {
  const { colors } = useTheme();
  const { status, scans, error } = useSavedScans();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  // Only offer filters for topics the user has actually saved.
  const topicCounts = new Map<SolutionTopic, number>();
  for (const scan of scans) {
    for (const topic of new Set(scan.result.problems.map((p) => p.topic))) {
      topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
    }
  }
  const topics = SOLUTION_TOPICS.filter((t) => topicCounts.has(t));
  const activeFilter: Filter = filter !== 'all' && !topicCounts.has(filter) ? 'all' : filter;

  const needle = query.trim().toLowerCase();
  const visible = scans.filter(
    (s) =>
      (activeFilter === 'all' || s.result.problems.some((p) => p.topic === activeFilter)) &&
      (!needle || searchableText(s).includes(needle))
  );

  async function confirmDelete(scan: SavedScan) {
    const ok = await confirmDestructive(
      'Delete saved problem?',
      'The photo and its solution will be removed from this device.'
    );
    if (!ok) return;
    try {
      await deleteScan(scan.id);
    } catch (e) {
      notify("Couldn't delete", e instanceof Error && e.message ? e.message : 'Please try again.');
    }
  }

  const problemCount = countProblems(scans);
  const subtitle =
    status === 'ready' && scans.length > 0
      ? `${scans.length} ${scans.length === 1 ? 'scan' : 'scans'} · ${problemCount} ${problemCount === 1 ? 'problem' : 'problems'}`
      : 'Your scanned problems and solutions';

  return (
    <Screen title="Saved" subtitle={subtitle}>
      {status === 'loading' ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : status === 'error' ? (
        <EmptyState icon="warning-outline" color={colors.danger} title="Couldn't load saved problems" message={error ?? 'Please try again.'} />
      ) : scans.length === 0 ? (
        <EmptyState
          icon="bookmark-outline"
          title="No saved problems yet"
          message="Scan a math problem on the Dashboard, then tap Save to keep the photo and its full solution here.">
          <Button label="Scan a problem" icon="camera-outline" onPress={() => router.navigate('/')} />
        </EmptyState>
      ) : (
        <>
          {/* Search */}
          <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search questions, answers, concepts"
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.text }]}
              returnKeyType="search"
              autoCorrect={false}
              accessibilityLabel="Search saved problems"
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          {/* Topic filters */}
          {topics.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
              style={styles.chipScroll}>
              <Chip label={`All · ${scans.length}`} selected={activeFilter === 'all'} onPress={() => setFilter('all')} />
              {topics.map((t) => (
                <Chip
                  key={t}
                  label={`${TOPICS[t].name} · ${topicCounts.get(t)}`}
                  color={TOPICS[t].color}
                  selected={activeFilter === t}
                  onPress={() => setFilter(t)}
                />
              ))}
            </ScrollView>
          ) : null}

          {/* List */}
          {visible.length === 0 ? (
            <EmptyState
              icon="search-outline"
              title="No matches"
              message={needle ? `Nothing saved matches "${query.trim()}".` : 'No saved problems in this topic.'}>
              <Button
                label="Clear filters"
                variant="secondary"
                onPress={() => {
                  setQuery('');
                  setFilter('all');
                }}
              />
            </EmptyState>
          ) : (
            <View style={styles.list}>
              <AppText variant="label" muted>
                {needle || activeFilter !== 'all' ? `${visible.length} found` : 'Recently saved'}
              </AppText>
              {visible.map((scan) => (
                <SavedScanCard key={scan.id} scan={scan} onLongPress={() => confirmDelete(scan)} />
              ))}
              <AppText variant="caption" muted style={styles.hint}>
                Tip: press and hold a problem to delete it.
              </AppText>
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: Spacing.xxl * 2, alignItems: 'center' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    minHeight: 48,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: Spacing.md },
  chipScroll: { marginHorizontal: -Spacing.lg, marginTop: -Spacing.sm },
  chips: { gap: Spacing.sm, paddingHorizontal: Spacing.lg },
  list: { gap: Spacing.sm },
  hint: { textAlign: 'center', marginTop: Spacing.sm },
});
