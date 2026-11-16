import type { IconName } from '@/components/ui/primitives';
import { TopicColors } from '@/constants/theme';
import type { SolutionTopic } from '@/types/solution';

export type TopicInfo = { name: string; icon: IconName; color: string };

/** Display info for every topic the solver can assign. */
export const TOPICS: Record<SolutionTopic, TopicInfo> = {
  algebra: { name: 'Algebra', icon: 'git-branch-outline', color: TopicColors.algebra },
  geometry: { name: 'Geometry', icon: 'shapes-outline', color: TopicColors.geometry },
  calculus: { name: 'Calculus', icon: 'trending-up-outline', color: TopicColors.calculus },
  trigonometry: { name: 'Trigonometry', icon: 'triangle-outline', color: TopicColors.trigonometry },
  statistics: { name: 'Statistics', icon: 'bar-chart-outline', color: TopicColors.statistics },
  arithmetic: { name: 'Arithmetic', icon: 'calculator-outline', color: TopicColors.arithmetic },
  other: { name: 'Math', icon: 'infinite-outline', color: TopicColors.other },
};
