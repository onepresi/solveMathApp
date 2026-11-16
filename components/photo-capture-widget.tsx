import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, type IconName } from '@/components/ui/primitives';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import type { PickedPhoto } from '@/hooks/use-photo-picker';
import { useTheme, withAlpha } from '@/hooks/use-theme';

type PhotoCaptureWidgetProps = {
  photo: PickedPhoto | null;
  busy?: boolean;
  onTakePhoto: () => void;
  onPickPhoto: () => void;
  onClear: () => void;
  onSolve: () => void;
};

/** Dashboard widget: take or upload a photo of a problem, then preview it. */
export function PhotoCaptureWidget(props: PhotoCaptureWidgetProps) {
  return props.photo ? <PreviewState {...props} photo={props.photo} /> : <EmptyState {...props} />;
}

// ---------------------------------------------------------------------------
// Empty state: hero card with two capture actions
// ---------------------------------------------------------------------------

function EmptyState({ busy, onTakePhoto, onPickPhoto }: PhotoCaptureWidgetProps) {
  const { colors } = useTheme();
  const subtle = withAlpha(colors.onPrimary, 0.18);

  return (
    <View style={[styles.hero, { backgroundColor: colors.primary }]}>
      <View style={styles.heroTop}>
        <View style={styles.heroText}>
          <AppText variant="heading" color={colors.onPrimary}>
            Snap a problem
          </AppText>
          <AppText variant="caption" color={withAlpha(colors.onPrimary, 0.85)}>
            Take a photo or upload one from your library to get step-by-step help.
          </AppText>
        </View>
        <View style={[styles.heroIcon, { backgroundColor: subtle }]}>
          {busy ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Ionicons name="scan" size={32} color={colors.onPrimary} />
          )}
        </View>
      </View>

      <View style={styles.heroActions}>
        <HeroButton
          label="Take photo"
          icon="camera"
          filled
          disabled={busy}
          onPress={onTakePhoto}
        />
        <HeroButton label="Upload" icon="images" disabled={busy} onPress={onPickPhoto} />
      </View>
    </View>
  );
}

type HeroButtonProps = {
  label: string;
  icon: IconName;
  filled?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

function HeroButton({ label, icon, filled, disabled, onPress }: HeroButtonProps) {
  const { colors } = useTheme();
  const fg = filled ? colors.primary : colors.onPrimary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.heroButton,
        { backgroundColor: filled ? colors.onPrimary : withAlpha(colors.onPrimary, 0.18) },
        (pressed || disabled) && { opacity: 0.7 },
      ]}>
      <Ionicons name={icon} size={18} color={fg} />
      <AppText variant="subheading" color={fg}>
        {label}
      </AppText>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Preview state: show the photo with follow-up actions
// ---------------------------------------------------------------------------

function PreviewState({
  photo,
  busy,
  onTakePhoto,
  onPickPhoto,
  onClear,
  onSolve,
}: PhotoCaptureWidgetProps & { photo: PickedPhoto }) {
  const { colors } = useTheme();
  const fromCamera = photo.source === 'camera';

  return (
    <Card style={styles.previewCard}>
      <View style={styles.previewHeader}>
        <View style={[styles.sourceBadge, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name={fromCamera ? 'camera' : 'images'} size={13} color={colors.primary} />
          <AppText variant="caption" style={styles.bold} color={colors.primary}>
            {fromCamera ? 'From camera' : 'From library'}
          </AppText>
        </View>
        <AppText variant="caption" muted>
          {photo.width} × {photo.height}
        </AppText>
      </View>

      <View style={[styles.imageFrame, { backgroundColor: colors.surfaceAlt }]}>
        <Image
          source={{ uri: photo.uri }}
          style={styles.image}
          contentFit="contain"
          transition={200}
          accessibilityLabel="Preview of your math problem photo"
        />
        <Pressable
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel="Remove photo"
          hitSlop={8}
          style={styles.removeButton}>
          <Ionicons name="close" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.previewActions}>
        <Button
          label={fromCamera ? 'Retake' : 'Replace'}
          icon={fromCamera ? 'camera-reverse-outline' : 'images-outline'}
          variant="secondary"
          onPress={fromCamera ? onTakePhoto : onPickPhoto}
          style={styles.flex}
        />
        <Button label="Solve" icon="sparkles" style={styles.flex} onPress={onSolve} />
      </View>
      {busy ? <ActivityIndicator color={colors.primary} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: '700' },
  flex: { flex: 1 },

  hero: { borderRadius: Radius.lg, padding: Spacing.xl, gap: Spacing.lg },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  heroText: { flex: 1, gap: Spacing.sm },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroActions: { flexDirection: 'row', gap: Spacing.sm },
  heroButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: 46,
    borderRadius: Radius.md,
  },

  previewCard: { gap: Spacing.md },
  previewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  imageFrame: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  removeButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewActions: { flexDirection: 'row', gap: Spacing.sm },
});
