import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { ProblemSolution } from '@/components/solution/problem-solution';
import { Button } from '@/components/ui/primitives';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructive, notify } from '@/lib/dialogs';
import { deleteScan, formatSavedDate, useSavedScan } from '@/lib/saved-store';

export default function SavedScanScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status, scan } = useSavedScan(id);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!scan || deleting) return;
    const ok = await confirmDestructive(
      'Delete saved problem?',
      'The photo and its solution will be removed from this device.'
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteScan(scan.id);
      if (router.canGoBack()) router.back();
      else router.replace('/saved');
    } catch (e) {
      setDeleting(false);
      notify("Couldn't delete", e instanceof Error && e.message ? e.message : 'Please try again.');
    }
  }

  const header = (
    <Stack.Screen
      options={{
        headerRight: scan
          ? () => (
              <Pressable
                onPress={handleDelete}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Delete saved problem"
                style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.6 }]}>
                <Ionicons name="trash-outline" size={21} color={colors.danger} />
              </Pressable>
            )
          : undefined,
      }}
    />
  );

  if (status === 'loading' || deleting) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        {header}
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!scan) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        {header}
        <View style={styles.notFound}>
          <EmptyState
            icon="bookmark-outline"
            title="Not found"
            message="This saved problem may have been deleted.">
            <Button label="Go to Saved" onPress={() => router.replace('/saved')} />
          </EmptyState>
        </View>
      </View>
    );
  }

  const { result } = scan;
  const count = result.problems.length;

  return (
    <SafeAreaView edges={['bottom']} style={[styles.flex, { backgroundColor: colors.background }]}>
      {header}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.photoFrame, { backgroundColor: colors.surfaceAlt }]}>
          <Image
            source={{ uri: scan.imageUri }}
            style={styles.photo}
            contentFit="contain"
            accessibilityLabel="Scanned photo"
          />
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="bookmark" size={14} color={colors.primary} />
          <AppText variant="caption" muted>
            Saved {savedWhen(scan.savedAt)} · {count === 1 ? '1 problem' : `${count} problems`}
          </AppText>
        </View>

        {result.message ? (
          <View style={[styles.note, { backgroundColor: colors.warningSoft }]}>
            <Ionicons name="information-circle" size={18} color={colors.warning} />
            <AppText variant="caption" style={styles.flex}>
              {result.message}
            </AppText>
          </View>
        ) : null}

        <View style={styles.results}>
          {result.problems.map((p, i) => (
            <ProblemSolution key={i} problem={p} index={i} total={count} />
          ))}
        </View>

        <AppText variant="caption" muted style={styles.center}>
          AI solutions can make mistakes. Check the steps before submitting your homework.
        </AppText>

        <Button label="Delete from Saved" icon="trash-outline" variant="danger" onPress={handleDelete} />
      </ScrollView>
    </SafeAreaView>
  );
}

/** "today", "yesterday", or "on Nov 9". */
function savedWhen(ms: number) {
  const label = formatSavedDate(ms);
  return label === 'Today' || label === 'Yesterday' ? label.toLowerCase() : `on ${label}`;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  notFound: { width: '100%', maxWidth: 480 },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
    gap: Spacing.lg,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  headerButton: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  photoFrame: { width: '100%', height: 240, borderRadius: Radius.lg, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: -Spacing.sm },
  note: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'flex-start',
  },
  results: { gap: Spacing.xxl },
});
