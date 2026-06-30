/** Ask page — question search + multiple wiki context, matched to an agent. */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { useAgents } from '../hooks/useAgents.js';
import { matchAgentFromAsk } from '../utils/matchAgentFromAsk.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { PrimaryBtn } from '../components/ui/PrimaryBtn.jsx';
import { AskWikiChip } from '../components/ask/AskWikiChip.jsx';
import { WikiPicker } from '../components/ask/WikiPicker.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';

export function AskPage() {
  usePageTitle('Discover');
  const { agents, loading } = useAgents();
  const nav = useNavigate();
  const [question, setQuestion] = useState('');
  const [wikiSlugs, setWikiSlugs] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const selectedAgents = useMemo(
    () => wikiSlugs.map((slug) => agents.find((a) => a.slug === slug)).filter(Boolean),
    [wikiSlugs, agents]
  );

  const addWiki = (agent) => {
    setWikiSlugs((prev) => (prev.includes(agent.slug) ? prev : [...prev, agent.slug]));
    setPickerOpen(true);
  };

  const removeWiki = (slug) => {
    setWikiSlugs((prev) => prev.filter((s) => s !== slug));
  };

  const submit = () => {
    const q = question.trim();
    if (!q && !wikiSlugs.length) return;
    const match = matchAgentFromAsk(agents, { question: q, wikiSlugs });
    if (match) nav(`/agents/${match.slug}`);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  if (loading) {
    return (
      <main className="page page-narrow ask-page">
        <Skeleton lines={6} />
      </main>
    );
  }

  return (
    <main className="page page-narrow ask-page">
      <PageHeader
        title="Discover"
        subtitle="Search for what you need and attach library docs — we'll route you to the best agent."
      />

      <div className="ask-search-wrap">
        <svg className="ask-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          className="ask-search-input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Describe what you need…"
          aria-label="Your question"
        />
      </div>

      <section className="ask-wiki-section" aria-label="Library context">
        <div className="ask-wiki-toolbar">
          <span className="ask-wiki-label">Library context</span>
          <button
            type="button"
            className="ask-wiki-add"
            onClick={() => setPickerOpen((o) => !o)}
            aria-expanded={pickerOpen}
          >
            + Add doc
          </button>
        </div>

        {selectedAgents.length > 0 && (
          <div className="ask-wiki-selected">
            {selectedAgents.map((a) => (
              <AskWikiChip key={a.slug} agent={a} onRemove={() => removeWiki(a.slug)} />
            ))}
          </div>
        )}

        {pickerOpen && (
          <WikiPicker
            agents={agents}
            selected={wikiSlugs}
            onAdd={addWiki}
            onClose={() => setPickerOpen(false)}
          />
        )}

        {!selectedAgents.length && !pickerOpen && (
          <p className="ask-wiki-hint">Attach one or more library docs to ground your search.</p>
        )}
      </section>

      <PrimaryBtn onClick={submit} disabled={!question.trim() && !wikiSlugs.length}>
        Find agent
      </PrimaryBtn>
    </main>
  );
}
