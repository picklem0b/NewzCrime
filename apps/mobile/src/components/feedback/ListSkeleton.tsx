/** Loading placeholder whose block sizes match the rows it stands in for. */

import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export interface ListSkeletonProps {
  rows?: number;
}

export function ListSkeleton({ rows = 6 }: ListSkeletonProps): ReactElement {
  const { colour, radius, spacingX, spacingY } = useTheme();

  return (
    <View
      style={{ paddingHorizontal: spacingX.lg, gap: spacingY.lg }}
      accessibilityLabel='Loading'
    >
      {Array.from({ length: rows }, (_unused, index) => (
        <View key={index} style={styles.row}>
          <View style={styles.text}>
            <View
              style={{
                height: 10,
                width: '40%',
                borderRadius: 4,
                backgroundColor: colour.surfaceRaised,
              }}
            />
            <View
              style={{
                height: 16,
                width: '95%',
                borderRadius: 4,
                backgroundColor: colour.surfaceRaised,
              }}
            />
            <View
              style={{
                height: 16,
                width: '70%',
                borderRadius: 4,
                backgroundColor: colour.surfaceRaised,
              }}
            />
          </View>

          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: radius.card,
              backgroundColor: colour.surfaceRaised,
            }}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  text: { flex: 1, gap: 8, justifyContent: 'center' },
});

export default ListSkeleton;
