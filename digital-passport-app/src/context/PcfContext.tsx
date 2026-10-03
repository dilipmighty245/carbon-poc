import React, { createContext, useContext, useMemo, useState, useCallback, useEffect, ReactNode } from 'react';
import {
  PROJECT, ACTIVITIES, LOGISTICS_LEGS, ALLOCATION, BASELINE_VERSION,
} from '../data/pcfData';
import {
  STEEL_PROJECT, STEEL_ACTIVITIES, STEEL_LOGISTICS_LEGS,
} from '../data/steelData';
import { useScenario } from './ScenarioContext';
import type {
  PcfProject, ActivityRecord, LogisticsLeg, AllocationData, CalculationVersion, Scenario
} from '../types/pcf';

export const CATEGORY_SCOPE: Record<string, string> = {
  'Raw Materials': 'Scope 3',
  'Energy': 'Scope 2',
  'Fuel': 'Scope 1',
  'Process Emissions': 'Scope 1',
  'Packaging': 'Scope 3',
  'Waste': 'Scope 3',
  'Logistics': 'Scope 3',
};

interface PcfContextType {
  project: PcfProject;
  activities: ActivityRecord[];
  addActivity: (rec: ActivityRecord) => void;
  updateActivity: (rec: ActivityRecord) => void;
  legs: LogisticsLeg[];
  addLeg: (leg: LogisticsLeg) => void;
  allocation: AllocationData;
  allocationMethod: string;
  setAllocationMethod: (m: string) => void;
  boundaryType: string;
  setBoundaryType: (b: string) => void;
  boundaryApproved: boolean;
  setBoundaryApproved: (a: boolean) => void;
  logisticsInboundKg: number;
  categoryTotals: Record<string, number>;
  liveTotalKg: number;
  scopeTotals: Record<string, number>;
  officialVersion: CalculationVersion;
  officialTotalKg: number;
  officialIntensity: string;
  liveIntensity: string;
  recalcRequired: boolean;
  recalculate: () => CalculationVersion;
  versions: CalculationVersion[];
  reportStatus: string;
  lockedVersion: CalculationVersion | null;
  submitForVerification: () => void;
  scenarios: Scenario[];
  addScenario: (sc: Scenario) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  productionKg: number;
}

const PcfContext = createContext<PcfContextType | null>(null);

export function PcfProvider({ children }: { children: ReactNode }) {
  const { scenario } = useScenario();

  const [project, setProject] = useState<PcfProject>(scenario === 'steel' ? STEEL_PROJECT : PROJECT);
  const [activities, setActivities] = useState<ActivityRecord[]>(scenario === 'steel' ? STEEL_ACTIVITIES : ACTIVITIES);
  const [legs, setLegs] = useState<LogisticsLeg[]>(scenario === 'steel' ? STEEL_LOGISTICS_LEGS : LOGISTICS_LEGS);

  useEffect(() => {
    if (scenario === 'steel') {
      setProject(STEEL_PROJECT);
      setActivities(STEEL_ACTIVITIES);
      setLegs(STEEL_LOGISTICS_LEGS);
    } else {
      setProject(PROJECT);
      setActivities(ACTIVITIES);
      setLegs(LOGISTICS_LEGS);
    }
  }, [scenario]);
  const [allocationMethod, setAllocationMethod] = useState<string>('Physical / Mass');
  const [boundaryType, setBoundaryType] = useState<string>('Cradle-to-Gate');
  const [boundaryApproved, setBoundaryApproved] = useState<boolean>(true);
  const [versions, setVersions] = useState<CalculationVersion[]>([BASELINE_VERSION]);
  const [recalcRequired, setRecalcRequired] = useState<boolean>(false);
  const [reportStatus, setReportStatus] = useState<string>('READY');
  const [lockedVersion, setLockedVersion] = useState<CalculationVersion | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeTab, setActiveTabState] = useState<string>('projects');

  const productionKg = project.productionQuantity;

  const addActivity = useCallback((rec: ActivityRecord) => {
    setActivities((prev) => [rec, ...prev]);
    setRecalcRequired(true);
  }, []);

  const updateActivity = useCallback((rec: ActivityRecord) => {
    setActivities((prev) => prev.map((a) => (a.id === rec.id ? rec : a)));
    setRecalcRequired(true);
  }, []);

  const addLeg = useCallback((leg: LogisticsLeg) => {
    setLegs((prev) => [...prev, leg]);
    setRecalcRequired(true);
  }, []);

  const logisticsInboundKg = useMemo(
    () => legs.filter((l) => l.boundary === 'In').reduce((s, l) => s + l.co2e, 0),
    [legs]
  );

  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    activities.forEach((a) => {
      map[a.category] = (map[a.category] || 0) + a.co2e;
    });
    map['Logistics'] = logisticsInboundKg;
    return map;
  }, [activities, logisticsInboundKg]);

  const liveTotalKg = useMemo(
    () => Object.values(categoryTotals).reduce((s, v) => s + v, 0),
    [categoryTotals]
  );

  const scopeTotals = useMemo(() => {
    const map: Record<string, number> = { 'Scope 1': 0, 'Scope 2': 0, 'Scope 3': 0 };
    activities.forEach((a) => {
      if (map[a.scope] !== undefined) {
        map[a.scope] += a.co2e;
      }
    });
    map['Scope 3'] += logisticsInboundKg;
    return map;
  }, [activities, logisticsInboundKg]);

  const officialVersion = versions[0];
  const officialTotalKg = officialVersion.totalKg;
  const officialIntensity = (officialTotalKg / productionKg).toFixed(2);
  const liveIntensity = (liveTotalKg / productionKg).toFixed(2);

  const recalculate = useCallback(() => {
    const nextVerNum = (versions.length + 0).toFixed(1);
    const newVer: CalculationVersion = {
      version: `V1.${versions.length}`,
      totalKg: liveTotalKg,
      calculatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      calculatedBy: 'A. Boateng',
      note: `Recalculated with updated inventory (${activities.length} records)`,
    };
    setVersions((prev) => [newVer, ...prev]);
    setRecalcRequired(false);
    return newVer;
  }, [versions, liveTotalKg, activities]);

  const submitForVerification = useCallback(() => {
    setReportStatus('SUBMITTED');
    setLockedVersion(officialVersion);
  }, [officialVersion]);

  const addScenario = useCallback((sc: Scenario) => {
    setScenarios((prev) => [sc, ...prev]);
  }, []);

  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab);
  }, []);

  const value = useMemo(
    () => ({
      project,
      activities,
      addActivity,
      updateActivity,
      legs,
      addLeg,
      allocation: ALLOCATION,
      allocationMethod,
      setAllocationMethod,
      boundaryType,
      setBoundaryType,
      boundaryApproved,
      setBoundaryApproved,
      logisticsInboundKg,
      categoryTotals,
      liveTotalKg,
      scopeTotals,
      officialVersion,
      officialTotalKg,
      officialIntensity,
      liveIntensity,
      recalcRequired,
      recalculate,
      versions,
      reportStatus,
      lockedVersion,
      submitForVerification,
      scenarios,
      addScenario,
      activeTab,
      setActiveTab,
      productionKg,
    }),
    [
      project, activities, addActivity, updateActivity, legs, addLeg,
      allocationMethod, boundaryType, boundaryApproved, logisticsInboundKg,
      categoryTotals, liveTotalKg, scopeTotals, officialVersion, officialTotalKg,
      officialIntensity, liveIntensity, recalcRequired, recalculate, versions,
      reportStatus, lockedVersion, submitForVerification, scenarios, addScenario,
      activeTab, setActiveTab, productionKg,
    ]
  );

  return <PcfContext.Provider value={value}>{children}</PcfContext.Provider>;
}

export function usePcf() {
  const ctx = useContext(PcfContext);
  if (!ctx) {
    throw new Error('usePcf must be used within a PcfProvider');
  }
  return ctx;
}
