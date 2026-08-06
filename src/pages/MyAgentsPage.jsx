import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider.jsx';
import { useAgents } from '../hooks/useAgents.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { GhostBtn } from '../components/ui/GhostBtn.jsx';
import { PrimaryBtn } from '../components/ui/PrimaryBtn.jsx';
import { AgentAvatar } from '../components/agents/AgentAvatar.jsx';

export function MyAgentsPage() {
  const { user, setEditAgent, setRegisterOpen } = useAuth();
  const { agents, loading } = useAgents();
  const nav = useNavigate();
  usePageTitle('My Agents');

  if (!user) { nav('/'); return null; }

  const myAgents = agents.filter((a) => a.authorId === user.id);

  return (
    <main className="page account-page">
      <div className="my-agents-header">
        <h1 className="page-title">My Agents</h1>
        <PrimaryBtn onClick={() => setRegisterOpen(true)}>+ Register agent</PrimaryBtn>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : myAgents.length === 0 ? (
        <div className="my-agents-empty">
          <p className="muted">You haven't registered any agents yet.</p>
          <PrimaryBtn onClick={() => setRegisterOpen(true)}>Register your first agent</PrimaryBtn>
        </div>
      ) : (
        <div className="account-agents-list">
          {myAgents.map((a) => (
            <div key={a.slug} className="account-agent-row">
              <AgentAvatar agent={a} size={36} />
              <div className="account-agent-info">
                <span className="account-agent-name">{a.name}</span>
                <span className="muted account-agent-slug">/{a.slug} · {a.category}</span>
              </div>
              <div className="account-agent-actions">
                <GhostBtn onClick={() => nav(`/agents/${a.slug}`)}>View</GhostBtn>
                <GhostBtn onClick={() => setEditAgent(a)}>Edit</GhostBtn>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
