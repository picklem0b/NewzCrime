import { useRouter } from 'expo-router';
import { CompassIcon } from 'phosphor-react-native';
import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import EmptyState from '@/components/feedback/EmptyState';
import Screen from '@/components/layout/Screen';
import PrimaryButton from '@/components/layout/PrimaryButton';
import { useTheme } from '@/hooks/useTheme';

/**
 * Catch-all route.
 *
 * Without this, a link the app does not know about leaves a reader on a blank
 * screen with no way back. The leading `+` is required by expo-router.
 */
export default function NotFoundScreen(): ReactElement {
  const router = useRouter();
  const { colour } = useTheme();

  return (
    <Screen>
      <View style={styles.fill}>
        <EmptyState
          icon={<CompassIcon size={36} color={colour.textFaint} weight='duotone' />}
          title='That page is not here'
          message='The link may be out of date. Everything current is on Home.'
          action={
            <PrimaryButton
              label='Go to Home'
              fullWidth={false}
              onPress={() => router.replace('/tabs/Home')}
            />
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'center' },
});
