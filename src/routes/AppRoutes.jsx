/** Application routes. */
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell.jsx';
import { BrowsePage } from '../pages/BrowsePage.jsx';
import { AgentDetailPage } from '../pages/AgentDetailPage.jsx';
import { WikiIndexPage } from '../pages/WikiIndexPage.jsx';
import { WikiEntryPage } from '../pages/WikiEntryPage.jsx';
import { SessionsPage } from '../pages/SessionsPage.jsx';
import { SessionPage } from '../pages/SessionPage.jsx';
import { EmbeddedSessionPage } from '../pages/EmbeddedSessionPage.jsx';
import { RunSessionPage } from '../pages/RunSessionPage.jsx';
import { StudioPage } from '../pages/StudioPage.jsx';
import { AskPage } from '../pages/AskPage.jsx';
import { SetupPage } from '../pages/SetupPage.jsx';
import { SchedulePage } from '../pages/SchedulePage.jsx';
import { AccountPage } from '../pages/AccountPage.jsx';
import { MyAgentsPage } from '../pages/MyAgentsPage.jsx';
import { AuthModal } from '../components/auth/AuthModal.jsx';
import { RegisterModal } from '../components/auth/RegisterModal.jsx';
import { EditAgentModal } from '../components/auth/EditAgentModal.jsx';
import { BootModal } from '../components/boot/BootModal.jsx';

function LegacyLibraryRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/library/${slug}`} replace />;
}

function LegacyRunRedirect() {
  const { id } = useParams();
  return <Navigate to={`/runs/${id}`} replace />;
}

function LegacyEmbedRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/runs/embed/${slug}`} replace />;
}

function LegacyRunSessionRedirect() {
  const { sessionId } = useParams();
  return <Navigate to={`/runs/run/${sessionId}`} replace />;
}

export function AppRoutes() {
  return (
    <>
      <AppShell>
        <Routes>
          <Route path="/" element={<BrowsePage />} />
          <Route path="/browse" element={<Navigate to="/" replace />} />

          <Route path="/agents/:slug" element={<AgentDetailPage />} />

          <Route path="/library" element={<WikiIndexPage />} />
          <Route path="/library/:slug" element={<WikiEntryPage />} />
          <Route path="/wiki" element={<Navigate to="/library" replace />} />
          <Route path="/wiki/:slug" element={<LegacyLibraryRedirect />} />

          <Route path="/runs" element={<SessionsPage />} />
          <Route path="/runs/:id" element={<SessionPage />} />
          <Route path="/runs/embed/:slug" element={<EmbeddedSessionPage />} />
          <Route path="/runs/run/:sessionId" element={<RunSessionPage />} />
          <Route path="/sessions" element={<Navigate to="/runs" replace />} />
          <Route path="/sessions/:id" element={<LegacyRunRedirect />} />
          <Route path="/sessions/embed/:slug" element={<LegacyEmbedRedirect />} />
          <Route path="/sessions/run/:sessionId" element={<LegacyRunSessionRedirect />} />

          <Route path="/automate" element={<SchedulePage />} />
          <Route path="/schedule" element={<Navigate to="/automate" replace />} />

          <Route path="/discover" element={<AskPage />} />
          <Route path="/ask" element={<Navigate to="/discover" replace />} />

          <Route path="/workstation" element={<SetupPage />} />
          <Route path="/setup" element={<Navigate to="/workstation" replace />} />

          <Route path="/studio" element={<StudioPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/my-agents" element={<MyAgentsPage />} />
        </Routes>
      </AppShell>
      <AuthModal /><RegisterModal /><EditAgentModal /><BootModal />
    </>
  );
}
