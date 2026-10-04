/** Horizontal topic filter. One selection at a time. */

import type { Topic } from '@newzcrime/shared';
import type { ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { feedTopics } from '@/feed/constants';
import { useTheme } from '@/hooks/useTheme';

export interface TopicChipsProps {
  value: Topic;
  onChange: (topic: Topic) => void;
}

export function TopicChips({
  value,
  onChange,
}: TopicChipsProps): ReactElement {
  const { colour, radius, spacingX, spacingY, typography } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: spacingX.lg,
        paddingVertical: spacingY.sm,
        gap: spacingX.sm,
      }}
    >
      {feedTopics.map((topic) => {
        const isActive = topic.id === value;

        return (
          <Pressable
            key={topic.id}
            accessibilityRole='button'
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(topic.id)}
            style={{
              paddingHorizontal: spacingX.lg,
              paddingVertical: spacingY.sm,
              borderRadius: radius.pill,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: isActive ? colour.accent : colour.border,
              backgroundColor: isActive ? colour.accent : 'transparent',
            }}
          >
            <Text
              style={{
                color: isActive ? colour.onAccent : colour.textMuted,
                fontSize: typography.size.small,
                fontWeight: isActive
                  ? typography.weight.semibold
                  : typography.weight.medium,
              }}
            >
              {topic.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export default TopicChips;
