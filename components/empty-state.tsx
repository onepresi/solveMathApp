import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card, IconBadge, type IconName } from '@/components/ui/primitives';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  icon: IconName;
  title: string;
  message: string;
  color?: string;
  children?: ReactNode;
};

/** Friendly placeholder for screens and sections with nothing to show yet. */
export function EmptyState({ icon, title, message, color, children }: Props) {
  const { colors } = useTheme();
  return (
    <Card style={styles.card}>
      <IconBadge icon={icon} color={color ?? colors.primary} size={56} />
      <AppText variant="heading" style={styles.center}>
        {title}
      </AppText>
      <AppText variant="body" muted style={styles.center}>
        {message}
      </AppText>
      {children ? <View style={styles.actions}>{children}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xxl },
  center: { textAlign: 'center', maxWidth: 360 },
  actions: { alignSelf: 'stretch', marginTop: Spacing.sm, gap: Spacing.sm },
});
