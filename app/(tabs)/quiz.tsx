import { router } from 'expo-router';

import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/primitives';
import { Screen } from '@/components/ui/screen';

export default function QuizScreen() {
  return (
    <Screen title="Quiz" subtitle="Test what you know">
      <EmptyState
        icon="trophy-outline"
        title="Quizzes are on the way"
        message="Practice quizzes are coming soon. For now, scan a problem and save it to build your study list.">
        <Button label="Scan a problem" icon="camera-outline" onPress={() => router.navigate('/')} />
      </EmptyState>
    </Screen>
  );
}
