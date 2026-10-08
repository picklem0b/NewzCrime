import type { ReactElement, ReactNode } from 'react';

import AppBar from '@/components/layout/AppBar';
import Screen from '@/components/layout/Screen';

export interface TabScreenProps {
  children: ReactNode;
}

export function TabScreen({ children }: TabScreenProps): ReactElement {
  return (
    <Screen showPlayer>
      <AppBar />
      {children}
    </Screen>
  );
}

export default TabScreen;
