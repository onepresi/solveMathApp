import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'title' | 'heading' | 'subheading' | 'body' | 'caption' | 'label' | 'math';

export type AppTextProps = TextProps & {
  variant?: Variant;
  muted?: boolean;
  color?: string;
};

export function AppText({ variant = 'body', muted, color, style, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  return (
    <Text
      style={[
        styles[variant],
        { color: color ?? (muted ? colors.textMuted : colors.text) },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.5 },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  subheading: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 21 },
  caption: { fontSize: 13, lineHeight: 18 },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase' },
  math: { fontSize: 17, lineHeight: 24, fontFamily: Fonts.mono, fontWeight: '600' },
});
