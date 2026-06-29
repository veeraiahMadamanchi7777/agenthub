/** Sessions list with search, filters, delete. */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessions } from '../hooks/useSessions.js';
import { useAgents } from '../hooks/useAgents.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { StatusDot } from '../components/ui/StatusDot.jsx';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';
import { GhostBtn } from '../components/ui/GhostBtn.jsx';
import { Pill } from '../components/ui/Pill.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useToast } from '../context/ToastProvider.jsx';

const FILTERS = ['all', 'running', 'stopped', 'failed'];

export function SessionsPage() {
  usePageTitle('Sessions');
  const { sessions: raw, loading } = useSessions();
  const { agents } = useAgents();
  const [sessions, setSessions] = useState([]);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const nav = useNavigate();
  const { show } = useToast();
  useEffect(() => { if (raw.length) setSessions(raw); }, [raw]);
  const list = sessions.filter((s) => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (!q) return true;
    const agent = agents.find((a) => a.slug === s.agentSlug);
    return (agent?.name || '').toLowerCase().includes(q.toLowerCase()) || s.lastMessage.toLowerCase().includes(q.toLowerCase());
  });
  const remove = (e, id) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== id));
    show('Session deleted', 'info');
  };
  if (loading) return <main className="page"><Skeleton lines={4} /></main>;
  return (
    <main className="page">
      <PageHeader title="Sessions" subtitle="Active and past agent sessions"
        action={<GhostBtn onClick={() => nav('/')}>+ New session</GhostBtn>} />
      <div className="search-box">
        <input className="search-input" style={{ paddingLeft: 16 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sessions…" aria-label="Search sessions" />
      </div>
      <div className="filter-pills" style={{ marginBottom: 16 }}>
        {FILTERS.map((f) => <Pill key={f} active={filter === f} onClick={() => setFilter(f)} aria-pressed={filter === f}>{f.charAt(0).toUpperCase() + f.slice(1)}</Pill>)}
      </div>
      <div className="panel">
        {list.map((s) => {
          const agent = agents.find((a) => a.slug === s.agentSlug);
          return (
            <div key={s.id} className="panel-row" tabIndex={0} role="link"
              onClick={() => nav(`/sessions/${s.id}`)} onKeyDown={(e) => e.key === 'Enter' && nav(`/sessions/${s.id}`)}>
              <StatusDot status={s.status} />
              <div className="panel-body">
                <div className="panel-title-row">{s.title || agent?.name} <StatusBadge status={s.status} /></div>
                <div className="session-row-meta">{s.lastMessage}</div>
              </div>
              <span className="session-row-time">{s.updatedAt}</span>
              <button type="button" className="row-action" onClick={(e) => remove(e, s.id)} aria-label="Delete session">Delete</button>
            </div>
          );
        })}
      </div>
    </main>
  );
}
