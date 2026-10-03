import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  EngagementMeta,
  EvidenceItem,
  FindingItem,
  CorrectionItem,
  AuditLogItem,
} from '../types/mrv';
import {
  ENGAGEMENT_META,
  INITIAL_EVIDENCE,
  INITIAL_FINDINGS,
  INITIAL_CORRECTIONS,
  INITIAL_AUDIT,
} from '../data/mrvMockData';
import { STEEL_ENGAGEMENT_META } from '../data/steelData';
import { useScenario } from './ScenarioContext';

interface FreezeInfo {
  id: string;
  hash: string;
  ts: string;
  frozenBy: string;
}

interface EngagementState {
  freezeInfo: FreezeInfo;
  planApproved: boolean;
  siteVisitComplete: boolean;
  reportStatus: string;
  finalVersion: string;
}

interface PrimaryAction {
  label: string;
  fn: () => void;
}

interface MrvContextType {
  meta: EngagementMeta;
  engagement: EngagementState;
  evidence: EvidenceItem[];
  findings: FindingItem[];
  corrections: CorrectionItem[];
  audit: AuditLogItem[];
  freezeDataset: () => void;
  resolveFinding: (findingId: string) => void;
  addEvidence: (item: Partial<EvidenceItem>) => void;
  primaryAction: PrimaryAction;
  setPrimaryAction: (action: PrimaryAction) => void;
}

const defaultContextValue: MrvContextType = {
  meta: ENGAGEMENT_META,
  engagement: {
    freezeInfo: {
      id: 'FRZ-2026-026',
      hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      ts: '2026-04-18 14:00',
      frozenBy: 'K. Adjei',
    },
    planApproved: true,
    siteVisitComplete: true,
    reportStatus: 'In Review',
    finalVersion: 'V1.0-VERIFIED',
  },
  evidence: INITIAL_EVIDENCE,
  findings: INITIAL_FINDINGS,
  corrections: INITIAL_CORRECTIONS,
  audit: INITIAL_AUDIT,
  freezeDataset: () => {},
  resolveFinding: () => {},
  addEvidence: () => {},
  primaryAction: { label: 'Primary Action', fn: () => {} },
  setPrimaryAction: () => {},
};

const MrvContext = createContext<MrvContextType>(defaultContextValue);

export const MrvProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { scenario } = useScenario();
  const [meta, setMeta] = useState<EngagementMeta>(scenario === 'steel' ? STEEL_ENGAGEMENT_META : ENGAGEMENT_META);

  useEffect(() => {
    if (scenario === 'steel') {
      setMeta(STEEL_ENGAGEMENT_META);
    } else {
      setMeta(ENGAGEMENT_META);
    }
  }, [scenario]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>(INITIAL_EVIDENCE);
  const [findings, setFindings] = useState<FindingItem[]>(INITIAL_FINDINGS);
  const [corrections] = useState<CorrectionItem[]>(INITIAL_CORRECTIONS);
  const [audit, setAudit] = useState<AuditLogItem[]>(INITIAL_AUDIT);
  const [primaryAction, setPrimaryAction] = useState<PrimaryAction>({
    label: 'Primary Action',
    fn: () => alert('Action performed'),
  });

  const [engagement, setEngagement] = useState<EngagementState>({
    freezeInfo: {
      id: 'FRZ-2026-026',
      hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      ts: '2026-04-18 14:00',
      frozenBy: 'K. Adjei',
    },
    planApproved: true,
    siteVisitComplete: true,
    reportStatus: 'In Review',
    finalVersion: 'V1.0-VERIFIED',
  });

  const freezeDataset = () => {
    const stamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setEngagement((prev) => ({
      ...prev,
      freezeInfo: {
        id: `FRZ-${Date.now().toString(36).toUpperCase()}`,
        hash: `sha256-${Math.random().toString(36).substring(2)}`,
        ts: stamp,
        frozenBy: 'Current User',
      },
    }));
  };

  const resolveFinding = (findingId: string) => {
    setFindings((prev) =>
      prev.map((f) => (f.id === findingId ? { ...f, status: 'RESOLVED' as const } : f))
    );
  };

  const addEvidence = (item: Partial<EvidenceItem>) => {
    const newItem: EvidenceItem = {
      id: `EVD-00${Math.floor(100 + Math.random() * 900)}`,
      title: item.title || 'New Evidence',
      desc: item.desc || '',
      category: item.category || 'General',
      activity: item.activity || '—',
      calc: item.calc || '—',
      source: item.source || 'Manual Upload',
      sourceSystem: item.sourceSystem || 'Web Portal',
      period: 'FY 2026',
      uploadedBy: 'Current User',
      uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      hash: Math.random().toString(36).substring(2, 10),
      version: 'V1',
      status: 'PENDING',
      reviewer: '',
      reviewDate: '',
      comment: '',
      provenance: ['Web Portal', 'Evidence Object'],
    };
    setEvidence((prev) => [newItem, ...prev]);
  };

  return (
    <MrvContext.Provider
      value={{
        meta,
        engagement,
        evidence,
        findings,
        corrections,
        audit,
        freezeDataset,
        resolveFinding,
        addEvidence,
        primaryAction,
        setPrimaryAction,
      }}
    >
      {children}
    </MrvContext.Provider>
  );
};

export const useMrv = () => useContext(MrvContext);
