import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Shell } from './components/layout/Shell';

import { LoginView } from './components/views/LoginView';
import { RegistrationView } from './components/views/RegistrationView';
import { ExecutiveDashboard } from './components/views/ExecutiveDashboard';
import { CompanyDashboardView } from './components/views/CompanyDashboardView';
import { ProductSetup } from './components/views/ProductSetup';
import { MRVWorkflow } from './components/views/MRVWorkflow';
import { EvidenceVerification } from './components/views/EvidenceVerification';
import { EmissionsCalculation } from './components/views/EmissionsCalculation';
import { DigitalPassportOutput } from './components/views/DigitalPassportOutput';
import { OrganisationView } from './components/views/OrganisationView';
import { IntegrationHubView } from './components/views/IntegrationHubView';
import { GHGInventoryView } from './components/views/GHGInventoryView';
import { PCFView } from './components/views/PCFView';
import { SuppliersView } from './components/views/SuppliersView';
import { CBAMView } from './components/views/CBAMView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { ParisAlignmentView } from './components/views/ParisAlignmentView';
import { AdminView } from './components/views/AdminView';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Full screen auth & onboarding starting entry points */}
        <Route path="/" element={<LoginView />} />
        <Route path="/login" element={<LoginView />} />
        <Route path="/registration" element={<RegistrationView />} />

        {/* Views wrapped in main layout shell */}
        <Route path="/dashboard" element={<Shell><CompanyDashboardView /></Shell>} />
        <Route path="/company-dashboard" element={<Shell><CompanyDashboardView /></Shell>} />
        <Route path="/executive-dashboard" element={<Shell><ExecutiveDashboard /></Shell>} />
        <Route path="/products/new" element={<Shell><ProductSetup /></Shell>} />
        <Route path="/mrv" element={<Shell><MRVWorkflow /></Shell>} />
        <Route path="/evidence" element={<Shell><EvidenceVerification /></Shell>} />
        <Route path="/emissions" element={<Shell><EmissionsCalculation /></Shell>} />
        <Route path="/passport/:id" element={<Shell><DigitalPassportOutput /></Shell>} />
        <Route path="/passport" element={<Shell><DigitalPassportOutput /></Shell>} />

        {/* Modules & Reports */}
        <Route path="/organisation" element={<Shell><OrganisationView /></Shell>} />
        <Route path="/data" element={<Shell><IntegrationHubView /></Shell>} />
        
        {/* Carbon Accounting tab -> Product Carbon Footprint (07_pcf.png) */}
        <Route path="/carbon-accounting" element={<Shell><PCFView /></Shell>} />
        <Route path="/pcf" element={<Shell><PCFView /></Shell>} />
        <Route path="/ghg" element={<Shell><GHGInventoryView /></Shell>} />

        {/* Value Chain tab -> Supplier & Customer Network (08_suppliers.png) */}
        <Route path="/value-chain" element={<Shell><SuppliersView /></Shell>} />
        <Route path="/suppliers" element={<Shell><SuppliersView /></Shell>} />

        <Route path="/cbam" element={<Shell><CBAMView /></Shell>} />
        <Route path="/analytics" element={<Shell><AnalyticsView /></Shell>} />
        <Route path="/paris-alignment" element={<Shell><ParisAlignmentView /></Shell>} />
        <Route path="/admin" element={<Shell><AdminView /></Shell>} />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
