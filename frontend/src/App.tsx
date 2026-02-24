import { Routes, Route } from 'react-router-dom';
import { Web3Provider } from '@/providers/Web3Provider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { Layout } from '@/components/layout';
import {
  LandingPage,
  DashboardPage,
  CreateBatchPage,
  CommitBatchPage,
  VerifyPage,
  EscrowPage,
  AgentPage,
  VaultPage,
  SettingsPage,
  DocsPage,
} from '@/pages';

export default function App() {
  return (
    <ThemeProvider>
      <Web3Provider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<LandingPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="create" element={<CreateBatchPage />} />
            <Route path="commit" element={<CommitBatchPage />} />
            <Route path="verify" element={<VerifyPage />} />
            <Route path="escrow" element={<EscrowPage />} />
            <Route path="agent" element={<AgentPage />} />
            <Route path="vault" element={<VaultPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="docs" element={<DocsPage />} />
          </Route>
        </Routes>
      </Web3Provider>
    </ThemeProvider>
  );
}
