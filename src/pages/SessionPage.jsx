/** Active session — conversation + context panel. */
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getSession } from '../api/sessionsApi.js';
import { useAgents } from '../hooks/useAgents.js';
import { useSessionChat } from '../hooks/useSessionChat.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { SessionContextPanel } from '../components/session/SessionContextPanel.jsx';
import { SessionFeed } from '../components/session/SessionFeed.jsx';
import { Breadcrumbs } from '../components/ui/Breadcrumbs.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useToast } from '../context/ToastProvider.jsx';

export function SessionPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { show } = useToast();
  const { agents } = useAgents();
  const [session, setSession] = useState(null);
  const [elapsed, setElapsed] = useState('0:00');
  useEffect(() => { getSession(id).then(setSession); }, [id]);
  useEffect(() => {
    if (!session || session.status !== 'running') return;
    const start = Date.now();
    const t = setInterval(() => {
      const s = Math.floor((Date.now() - start) / 1000);
      setElapsed(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(t);
  }, [session?.status, session?.id]);
  const agent = agents.find((a) => a.slug === session?.agentSlug);
  const { msgs, thinking, send } = useSessionChat(session?.messages, session?.agentSlug);
  usePageTitle(session?.title || agent?.name);
  const stop = () => { setSession((s) => ({ ...s, status: 'stopped' })); show('Agent stopped', 'info'); };
  const rename = () => {
    const title = prompt('Rename session', session?.title || agent?.name);
    if (title) { setSession((s) => ({ ...s, title })); show('Session renamed', 'success'); }
  };
  if (!session) return <main className="page"><Skeleton lines={4} /></main>;
  return (
    <div className="session-layout">
      <div className="session-main">
        <Breadcrumbs items={[{ label: 'Runs', to: '/runs' }, { label: session.title || agent?.name }]} />
        <div className="session-header">
          <button type="button" className="session-title-btn" onClick={rename}>{session.title || agent?.name}</button>
        </div>
        <SessionFeed msgs={msgs} thinking={thinking} agentName={agent?.name} />
      </div>
      <SessionContextPanel agent={agent} session={session} thinking={thinking} onSend={send} onStop={stop} elapsed={elapsed} msgCount={msgs.length} />
    </div>
  );
}
