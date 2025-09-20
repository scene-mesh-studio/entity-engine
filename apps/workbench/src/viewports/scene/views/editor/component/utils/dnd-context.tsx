import type { Dispatch, SetStateAction, PropsWithChildren } from 'react';
import type { AllNodeData } from '../scene-flow-types';

import { useState, useContext, createContext } from 'react';

interface DnDState {
  nodeType: string;
  initParas: AllNodeData;
}

type FlowDnDContextType = [DnDState | null, Dispatch<SetStateAction<DnDState | null>>];

const FlowDnDContext = createContext<FlowDnDContextType | undefined>(undefined);

export const FlowDnDProvider = ({ children }: PropsWithChildren<{}>) => {
  const [type, setType] = useState<DnDState | null>(null);
  return <FlowDnDContext.Provider value={[type, setType]}>{children}</FlowDnDContext.Provider>;
};

export const useFlowDnD = (): FlowDnDContextType => {
  const context = useContext(FlowDnDContext);
  if (!context) {
    throw new Error('useDnD must be used within a DnDProvider');
  }
  return context;
};

export default FlowDnDContext;
