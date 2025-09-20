import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Mail | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <div>...</div>;
}
