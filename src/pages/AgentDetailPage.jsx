/** Agent detail page with full info + Run CTA. */
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAgents } from '../hooks/useAgents.js';
import { useReadme } from '../hooks/useReadme.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { CapTag } from '../components/ui/CapTag.jsx';
import { ModelTag } from '../components/ui/ModelTag.jsx';
import { PrimaryBtn } from '../components/ui/PrimaryBtn.jsx';
import { GhostBtn } from '../components/ui/GhostBtn.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { Breadcrumbs } from '../components/ui/Breadcrumbs.jsx';
import { AgentAvatar } from '../components/agents/AgentAvatar.jsx';
import { AgentStats } from '../components/browse/AgentStats.jsx';
import { useAuth } from '../context/AuthProvider.jsx';
import { useBoot } from '../context/BootProvider.jsx';

export function AgentDetailPage() {
  const { slug } = useParams();
  const { agents, loading } = useAgents();
  const a = agents.find((x) => x.slug === slug);
  const { summary, loading: lr } = useReadme(slug, a);
  usePageTitle(a?.name);
  const { requireAuth } = useAuth();
  const { openBoot } = useBoot();
  const nav = useNavigate();

  if (loading || lr) return <main className="page"><Skeleton lines={5} /></main>;
  if (!a) return <main className="page"><p className="muted">Agent not found.</p></main>;

  return (
    <main className="page">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: a.name }]} />
      <div className="detail-hero">
        <div className="detail-top">
          <AgentAvatar agent={a} />
          <div>
            <h1 className="page-title">{a.name}</h1>
            <p className="page-subtitle">by {a.author} · {a.category}</p>
          </div>
        </div>
        <AgentStats agent={a} />
        <p className="detail-desc">{summary || a.desc}</p>
        <div className="detail-tags">
          {a.caps.map((c) => <CapTag key={c} label={c} />)}
          {a.models.map((m) => <ModelTag key={m} label={m} />)}
        </div>
        <div className="flex-row">
          <PrimaryBtn onClick={() => requireAuth(() => openBoot(a))} disabled={!a.runnable}>Run agent</PrimaryBtn>
          <Link to={`/wiki/${slug}`}><GhostBtn>View wiki</GhostBtn></Link>
          <GhostBtn onClick={() => nav('/')}>← Back</GhostBtn>
        </div>
      </div>
    </main>
  );
}
