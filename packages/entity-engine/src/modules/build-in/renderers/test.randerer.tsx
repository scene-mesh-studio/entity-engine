import type { IEntityNamedRenderer } from 'src/components';

import { TestComp } from './test-comp';

const test: IEntityNamedRenderer = {
    name: 'test',
    slotName: 'view-tool',
    renderer: (props) => <TestComp {...props} />,
};

export default test;
