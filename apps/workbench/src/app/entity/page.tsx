import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { EntityShellView } from './shell';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Blank | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <EntityShellView />;
}
