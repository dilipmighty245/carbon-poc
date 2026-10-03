import React, { createContext, useContext, useState } from 'react';

export type ScenarioType = 'steel' | 'cocoa';

interface ScenarioContextType {
  scenario: ScenarioType;
  setScenario: (scenario: ScenarioType) => void;
}

const ScenarioContext = createContext<ScenarioContextType>({
  scenario: 'steel',
  setScenario: () => {},
});

export const ScenarioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scenario, setScenario] = useState<ScenarioType>('steel');

  return (
    <ScenarioContext.Provider value={{ scenario, setScenario }}>
      {children}
    </ScenarioContext.Provider>
  );
};

export const useScenario = () => useContext(ScenarioContext);
