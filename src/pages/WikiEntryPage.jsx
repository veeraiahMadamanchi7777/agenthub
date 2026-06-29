/** Per-agent wiki detail page. */
import { useParams, useNavigate } from 'react-router-dom';
import { useAgents } from '../hooks/useAgents.js';
import { useWiki } from '../hooks/useWiki.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { PrimaryBtn } from '../components/ui/PrimaryBtn.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { Breadcrumbs } from '../components/ui/Breadcrumbs.jsx';
import { WikiSection } from '../components/wiki/WikiSection.jsx';

export function WikiEntryPage() {
  const { slug } = useParams();
  const { agents, loading: la } = useAgents();
  const { wiki, loading: lw } = useWiki();
  const nav = useNavigate();
  const a = agents.find((x) => x.slug === slug);
  const w = wiki[slug];
  usePageTitle(a ? `${a.name} Wiki` : 'Wiki');
  if (la || lw) return <main className="page"><Skeleton lines={5} /></main>;
  if (!a || !w) return <main className="page"><p className="muted">Not found.</p></main>;
  return (
    <main className="page page-narrow">
      <Breadcrumbs items={[{ label: 'Wiki', to: '/wiki' }, { label: a.name }]} />
      <h1 className="page-title mono">{a.name}</h1>
      <WikiSection title="What it does"><p>{w.whatItDoes}</p></WikiSection>
      <WikiSection title="How it works"><ol>{w.howItWorks.map((s, i) => <li key={i}>{s}</li>)}</ol></WikiSection>
      <WikiSection title="Parameters">
        <table className="wiki-table">
          <tbody>
            <tr><th>Input</th><td>{w.inputFormat}</td></tr>
            <tr><th>Output</th><td>{w.outputFormat}</td></tr>
          </tbody>
        </table>
      </WikiSection>
      <WikiSection title="Example prompts"><ul>{w.examples.map((e, i) => <li key={i}>{e}</li>)}</ul></WikiSection>
      {w.limitations && <WikiSection title="Limitations"><ul>{w.limitations.map((l, i) => <li key={i}>{l}</li>)}</ul></WikiSection>}
      <PrimaryBtn onClick={() => nav(`/agents/${slug}`)}>View agent</PrimaryBtn>
    </main>
  );
}
