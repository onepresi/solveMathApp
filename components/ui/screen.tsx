import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenProps = {
  title: string;
  subtitle?: string;
  headerRight?: ReactNode;
  children: ReactNode;
};

/** Standard tab screen: safe-area aware, scrollable, with a large title header. */
export function Screen({ title, subtitle, headerRight, children }: ScreenProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.headerText}>
            {subtitle ? (
              <AppText variant="caption" muted>
                {subtitle}
              </AppText>
            ) : null}
            <AppText variant="title">{title}</AppText>
          </View>
          {headerRight}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
    gap: Spacing.xl,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  headerText: { flex: 1, gap: 2 },
});
