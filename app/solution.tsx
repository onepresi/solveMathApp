import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProblemSolution } from '@/components/solution/problem-solution';
import { Button, Card } from '@/components/ui/primitives';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { notify } from '@/lib/dialogs';
import { deleteScan, newScanId, saveScan, useSavedScan } from '@/lib/saved-store';
import { getScanPhoto } from '@/lib/scan-session';
import { solvePhoto } from '@/lib/solve-client';
import type { SolveResult } from '@/types/solution';

type State =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'done'; result: SolveResult };

const LOADING_MESSAGES = [
  'Reading your problem…',
  'Working through each step…',
  'Double-checking the answer…',
  'Writing up the explanation…',
];

export default function SolutionScreen() {
  const { colors } = useTheme();
  const [photo] = useState(getScanPhoto);
  const [state, setState] = useState<State>({ phase: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [scanId] = useState(newScanId);
  const { scan: savedScan } = useSavedScan(scanId);
  const [saving, setSaving] = useState(false);

  const result = state.phase === 'done' ? state.result : null;
  const canSave = !!photo && !!result && result.status === 'solved' && result.problems.length > 0;
  const isSaved = !!savedScan;

  async function toggleSaved() {
    if (!photo || !result || saving) return;
    setSaving(true);
    try {
      if (isSaved) await deleteScan(scanId);
      else await saveScan(scanId, photo, result);
    } catch (e) {
      notify(
        isSaved ? "Couldn't remove" : "Couldn't save",
        e instanceof Error && e.message ? e.message : 'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!photo) return;
    const controller = new AbortController();
    setState({ phase: 'loading' });
    solvePhoto(photo, controller.signal)
      .then((result) => setState({ phase: 'done', result }))
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          phase: 'error',
          message: e instanceof Error && e.message ? e.message : 'Unexpected error while solving. Please try again.',
        });
      });
    return () => controller.abort();
  }, [photo, attempt]);

  if (!photo) {
    return (
      <Centered>
        <Ionicons name="image-outline" size={40} color={colors.textMuted} />
        <AppText variant="heading">No photo selected</AppText>
        <AppText variant="body" muted style={styles.center}>
          Take or upload a photo from the Dashboard to get a solution.
        </AppText>
        <Button label="Back to Dashboard" onPress={() => router.back()} />
      </Centered>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerRight: canSave
            ? () => <HeaderSaveButton saved={isSaved} busy={saving} onPress={toggleSaved} />
            : undefined,
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {/* The scanned photo */}
        <View style={[styles.photoFrame, { backgroundColor: colors.surfaceAlt }]}>
          <Image source={{ uri: photo.uri }} style={styles.photo} contentFit="contain" />
        </View>

        {canSave ? <SaveBar saved={isSaved} busy={saving} onToggle={toggleSaved} /> : null}

        {state.phase === 'loading' ? <LoadingCard /> : null}

        {state.phase === 'error' ? (
          <Card style={styles.messageCard}>
            <Ionicons name="cloud-offline-outline" size={32} color={colors.danger} />
            <AppText variant="heading">Couldn&apos;t solve this one</AppText>
            <AppText variant="body" muted style={styles.center}>
              {state.message}
            </AppText>
            <View style={styles.actions}>
              <Button label="Try again" icon="refresh" onPress={() => setAttempt((n) => n + 1)} style={styles.flex} />
            </View>
          </Card>
        ) : null}

        {state.phase === 'done' ? <Results result={state.result} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Results({ result }: { result: SolveResult }) {
  const { colors } = useTheme();

  if (result.status !== 'solved' || result.problems.length === 0) {
    const unreadable = result.status === 'unreadable';
    return (
      <Card style={styles.messageCard}>
        <Ionicons name={unreadable ? 'eye-off-outline' : 'help-circle-outline'} size={32} color={colors.warning} />
        <AppText variant="heading">{unreadable ? "Couldn't read the photo" : 'No math problem found'}</AppText>
        <AppText variant="body" muted style={styles.center}>
          {result.message ?? 'Try a clearer, closer photo of the problem.'}
        </AppText>
        <Button label="Take another photo" icon="camera" onPress={() => router.back()} />
      </Card>
    );
  }

  return (
    <View style={styles.results}>
      {result.message ? (
        <View style={[styles.note, { backgroundColor: colors.warningSoft }]}>
          <Ionicons name="information-circle" size={18} color={colors.warning} />
          <AppText variant="caption" style={styles.flex}>
            {result.message}
          </AppText>
        </View>
      ) : null}
      {result.problems.map((p, i) => (
        <ProblemSolution key={i} problem={p} index={i} total={result.problems.length} />
      ))}
      <AppText variant="caption" muted style={styles.center}>
        AI solutions can make mistakes. Check the steps before submitting your homework.
      </AppText>
    </View>
  );
}

function HeaderSaveButton({ saved, busy, onPress }: { saved: boolean; busy: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={saved ? 'Remove from Saved' : 'Save to Saved'}
      style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.6 }]}>
      <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={22} color={colors.primary} />
    </Pressable>
  );
}

/** Save the photo and solution to the Saved tab, or undo it. */
function SaveBar({ saved, busy, onToggle }: { saved: boolean; busy: boolean; onToggle: () => void }) {
  const { colors } = useTheme();

  if (!saved) {
    return <Button label={busy ? 'Saving…' : 'Save to Saved'} icon="bookmark-outline" loading={busy} onPress={onToggle} />;
  }

  return (
    <View style={[styles.savedBar, { backgroundColor: colors.successSoft }]}>
      <Ionicons name="bookmark" size={18} color={colors.success} />
      <AppText variant="subheading" style={styles.flex}>
        Saved with full solution
      </AppText>
      <Pressable onPress={() => router.navigate('/saved')} hitSlop={8} accessibilityRole="link">
        <AppText variant="subheading" color={colors.primary}>
          View
        </AppText>
      </Pressable>
      <Pressable onPress={onToggle} disabled={busy} hitSlop={8} accessibilityRole="button" accessibilityLabel="Undo save">
        <AppText variant="subheading" color={colors.textMuted}>
          Undo
        </AppText>
      </Pressable>
    </View>
  );
}

function LoadingCard() {
  const { colors } = useTheme();
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % LOADING_MESSAGES.length), 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <Card style={styles.messageCard}>
      <ActivityIndicator size="large" color={colors.primary} />
      <AppText variant="heading">{LOADING_MESSAGES[i]}</AppText>
      <AppText variant="caption" muted style={styles.center}>
        Detailed solutions can take up to a minute.
      </AppText>
    </Card>
  );
}

function Centered({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return <View style={[styles.centered, { backgroundColor: colors.background }]}>{children}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
    gap: Spacing.lg,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  photoFrame: { width: '100%', height: 180, borderRadius: Radius.lg, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  messageCard: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xxl },
  actions: { flexDirection: 'row', alignSelf: 'stretch' },
  results: { gap: Spacing.xxl },
  note: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'flex-start',
  },
  headerButton: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  savedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 48,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xxl },
});
