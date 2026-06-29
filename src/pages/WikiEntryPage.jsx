/** Per-agent wiki — full-page README render. */
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAgents } from '../hooks/useAgents.js';
import { useReadme } from '../hooks/useReadme.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { PrimaryBtn } from '../components/ui/PrimaryBtn.jsx';
import { GhostBtn } from '../components/ui/GhostBtn.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { MarkdownBody } from '../components/session/MarkdownBody.jsx';
import { useAuth } from '../context/AuthProvider.jsx';
import { useBoot } from '../context/BootProvider.jsx';

export function WikiEntryPage() {
  const { slug } = useParams();
  const { agents, loading: la } = useAgents();
  const nav = useNavigate();
  const { requireAuth } = useAuth();
  const { openBoot } = useBoot();
  const a = agents.find((x) => x.slug === slug);
  const { content, loading: lr, missing } = useReadme(slug, a);
  usePageTitle(a ? `${a.name} — Wiki` : 'Wiki');

  if (la || lr) {
    return (
      <div className="wiki-page">
        <div className="wiki-doc-body"><div className="wiki-doc-inner"><Skeleton lines={8} /></div></div>
      </div>
    );
  }
  if (!a) {
    return (
      <div className="wiki-page">
        <div className="wiki-doc-body"><div className="wiki-doc-inner"><p className="muted">Not found.</p></div></div>
      </div>
    );
  }

  const run = () => requireAuth(() => openBoot(a));

  return (
    <div className="wiki-page">
      <header className="wiki-doc-header">
        <button className="wiki-doc-back" onClick={() => nav('/wiki')} aria-label="Back to wiki">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="wiki-doc-meta">
          <p className="wiki-doc-name">{a.name}</p>
          <p className="wiki-doc-sub">{a.category} · by {a.author}</p>
        </div>
        <div className="wiki-doc-actions">
          <Link to={`/agents/${slug}`}><GhostBtn small>Agent page</GhostBtn></Link>
          {a.runnable && <PrimaryBtn small onClick={run}>Run</PrimaryBtn>}
        </div>
      </header>

      <div className="wiki-doc-body">
        <div className="wiki-doc-inner">
          {missing ? (
            <div className="wiki-empty">
              <h1 className="page-title">{a.name}</h1>
              <p className="muted">No README at <code>public/readmes/{slug}/README.md</code></p>
              <p>{a.desc}</p>
            </div>
          ) : (
            <article className="wiki-readme">
              <MarkdownBody content={content} />
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
