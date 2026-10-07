import type { ReactElement, ReactNode } from 'react';

import Screen from '@/components/layout/Screen';

export interface TabScreenProps {
  children: ReactNode;
}

export function TabScreen({ children }: TabScreenProps): ReactElement {
  return <Screen showPlayer>{children}</Screen>;
}

export default TabScreen;