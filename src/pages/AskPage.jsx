/** Ask page — describe a task, get matched to an agent. */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { useAgents } from '../hooks/useAgents.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { PrimaryBtn } from '../components/ui/PrimaryBtn.jsx';

export function AskPage() {
  usePageTitle('Ask');
  const [prompt, setPrompt] = useState('');
  const { agents } = useAgents();
  const nav = useNavigate();

  const submit = () => {
    const q = prompt.trim().toLowerCase();
    if (!q) return;
    const match = agents.find((a) =>
      a.name.includes(q) || a.desc.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
    ) || agents[0];
    nav(match ? `/agents/${match.slug}` : '/');
  };

  return (
    <main className="page page-narrow ask-page">
      <PageHeader title="Ask" subtitle="Describe what you need — we'll point you to the right agent." />
      <textarea
        className="input textarea ask-input"
        rows={5}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g. Analyse my spending and suggest a monthly budget…"
        aria-label="Your question"
      />
      <PrimaryBtn onClick={submit} disabled={!prompt.trim()}>Find agent</PrimaryBtn>
    </main>
  );
}
