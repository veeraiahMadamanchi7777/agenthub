/** Application routes. */
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell.jsx';
import { BrowsePage } from '../pages/BrowsePage.jsx';
import { AgentDetailPage } from '../pages/AgentDetailPage.jsx';
import { WikiIndexPage } from '../pages/WikiIndexPage.jsx';
import { WikiEntryPage } from '../pages/WikiEntryPage.jsx';
import { SessionsPage } from '../pages/SessionsPage.jsx';
import { SessionPage } from '../pages/SessionPage.jsx';
import { EmbeddedSessionPage } from '../pages/EmbeddedSessionPage.jsx';
import { StudioPage } from '../pages/StudioPage.jsx';
import { AskPage } from '../pages/AskPage.jsx';
import { AuthModal } from '../components/auth/AuthModal.jsx';
import { RegisterModal } from '../components/auth/RegisterModal.jsx';
import { BootModal } from '../components/boot/BootModal.jsx';

export function AppRoutes() {
  return (
    <>
      <AppShell>
        <Routes>
          <Route path="/" element={<BrowsePage />} />
          <Route path="/browse" element={<Navigate to="/" replace />} />
          <Route path="/agents/:slug" element={<AgentDetailPage />} />
          <Route path="/wiki" element={<WikiIndexPage />} />
          <Route path="/wiki/:slug" element={<WikiEntryPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/sessions/:id" element={<SessionPage />} />
          <Route path="/sessions/embed/:slug" element={<EmbeddedSessionPage />} />
          <Route path="/ask" element={<AskPage />} />
          <Route path="/studio" element={<StudioPage />} />
        </Routes>
      </AppShell>
      <AuthModal /><RegisterModal /><BootModal />
    </>
  );
}
