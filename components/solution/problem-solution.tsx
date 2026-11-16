import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card, IconBadge, Tag, type IconName } from '@/components/ui/primitives';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { TOPICS } from '@/constants/topics';
import { useTheme } from '@/hooks/use-theme';
import type { SolvedProblem } from '@/types/solution';

type Props = {
  problem: SolvedProblem;
  index: number;
  total: number;
};

const DIFFICULTY_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' } as const;

/** Full breakdown of one solved problem: question, answer, steps, check, and tips. */
export function ProblemSolution({ problem, index, total }: Props) {
  const { colors } = useTheme();
  const topic = TOPICS[problem.topic] ?? TOPICS.other;
  const accent = topic.color;
  const difficultyColor = { easy: colors.success, medium: colors.warning, hard: colors.danger }[problem.difficulty];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <IconBadge icon={topic.icon} color={accent} size={36} />
        <AppText variant="heading" style={styles.flex}>
          {total > 1 ? `Problem ${index + 1} of ${total}` : 'Problem'}
        </AppText>
        <Tag label={topic.name} color={accent} />
        <Tag label={DIFFICULTY_LABEL[problem.difficulty]} color={difficultyColor} />
      </View>

      {/* Question */}
      <Card style={styles.gapSm}>
        <AppText variant="label" muted>
          Question
        </AppText>
        <AppText variant="math" selectable>
          {problem.question}
        </AppText>
      </Card>

      {/* Final answer */}
      <View style={[styles.answer, { backgroundColor: colors.successSoft, borderColor: colors.success }]}>
        <View style={styles.row}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <AppText variant="label" color={colors.success}>
            Answer
          </AppText>
        </View>
        <AppText variant="math" style={styles.answerText} selectable>
          {problem.finalAnswer}
        </AppText>
      </View>

      {/* Approach + givens */}
      <Section icon="compass-outline" title="Approach">
        <AppText variant="body" selectable>
          {problem.approach}
        </AppText>
        {problem.givens.length > 0 ? (
          <View style={styles.givens}>
            <AppText variant="label" muted>
              What we know
            </AppText>
            {problem.givens.map((g, i) => (
              <Bullet key={i} text={g} color={accent} />
            ))}
          </View>
        ) : null}
      </Section>

      {/* Steps */}
      <Section icon="footsteps-outline" title={`Step-by-step (${problem.steps.length})`}>
        <View>
          {problem.steps.map((step, i) => {
            const last = i === problem.steps.length - 1;
            return (
              <View key={i} style={styles.step}>
                <View style={styles.rail}>
                  <View style={[styles.stepDot, { backgroundColor: accent }]}>
                    <AppText variant="caption" style={styles.bold} color="#FFFFFF">
                      {i + 1}
                    </AppText>
                  </View>
                  {!last ? <View style={[styles.railLine, { backgroundColor: colors.border }]} /> : null}
                </View>
                <View style={[styles.stepBody, !last && styles.stepBodySpacing]}>
                  <AppText variant="subheading">{step.title}</AppText>
                  <AppText variant="body" muted selectable>
                    {step.explanation}
                  </AppText>
                  {step.work.trim() ? (
                    <View style={[styles.work, { backgroundColor: colors.surfaceAlt }]}>
                      <AppText variant="math" style={styles.workText} selectable>
                        {step.work.trim()}
                      </AppText>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      </Section>

      {/* Verification */}
      <Section icon="shield-checkmark-outline" title="Check the answer" iconColor={colors.success}>
        <AppText variant="body" selectable>
          {problem.verification}
        </AppText>
      </Section>

      {/* Concepts */}
      {problem.keyConcepts.length > 0 ? (
        <Section icon="bulb-outline" title="Key concepts" iconColor={colors.warning}>
          <View style={styles.tags}>
            {problem.keyConcepts.map((c, i) => (
              <Tag key={i} label={c} color={accent} />
            ))}
          </View>
        </Section>
      ) : null}

      {/* Common mistakes */}
      {problem.commonMistakes.length > 0 ? (
        <Section icon="alert-circle-outline" title="Watch out for" iconColor={colors.danger}>
          {problem.commonMistakes.map((m, i) => (
            <Bullet key={i} text={m} color={colors.danger} />
          ))}
        </Section>
      ) : null}
    </View>
  );
}

function Section({
  icon,
  title,
  iconColor,
  children,
}: {
  icon: IconName;
  title: string;
  iconColor?: string;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <Card style={styles.gapMd}>
      <View style={styles.row}>
        <Ionicons name={icon} size={18} color={iconColor ?? colors.primary} />
        <AppText variant="subheading">{title}</AppText>
      </View>
      {children}
    </Card>
  );
}

function Bullet({ text, color }: { text: string; color: string }) {
  return (
    <View style={styles.bullet}>
      <View style={[styles.bulletDot, { backgroundColor: color }]} />
      <AppText variant="body" style={styles.flex} selectable>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  gapSm: { gap: Spacing.sm },
  gapMd: { gap: Spacing.md },
  answer: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  answerText: { fontSize: 20, lineHeight: 28 },
  givens: { gap: Spacing.sm, marginTop: Spacing.xs },
  step: { flexDirection: 'row', gap: Spacing.md },
  rail: { alignItems: 'center', width: 28 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railLine: { width: 2, flex: 1, marginVertical: 4, borderRadius: 1 },
  stepBody: { flex: 1, gap: 6, paddingTop: 3 },
  stepBodySpacing: { paddingBottom: Spacing.xl },
  work: { borderRadius: Radius.md, padding: Spacing.md, marginTop: 2 },
  workText: { fontSize: 15, lineHeight: 24 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  bullet: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
});
