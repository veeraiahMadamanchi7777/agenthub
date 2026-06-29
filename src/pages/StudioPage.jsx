/** Studio page. */
import { useState, useEffect } from 'react';
import { usePresets } from '../hooks/usePresets.js';
import { useStudioFeed } from '../hooks/useStudioFeed.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { PresetGrid } from '../components/studio/PresetGrid.jsx';
import { A2AMessage } from '../components/studio/A2AMessage.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';

export function StudioPage() {
  usePageTitle('Studio');
  const { presets, loading } = usePresets();
  const [active, setActive] = useState(null);
  const [pendingRun, setPendingRun] = useState(null);
  const feed = useStudioFeed(active);
  useEffect(() => {
    if (pendingRun && active === pendingRun && feed.convoLen > 0) {
      feed.run();
      setPendingRun(null);
    }
  }, [active, pendingRun, feed.convoLen]);
  const run = (id) => { feed.reset(); setActive(id); setPendingRun(id); };
  if (loading) return <main className="page"><Skeleton lines={3} /></main>;
  return (
    <main className="page">
      <PageHeader title="Studio" subtitle="Multi-agent pipelines with live A2A feed" />
      <PresetGrid presets={presets} active={active} onSelect={setActive} onRun={run} running={feed.running} />
      {feed.running && <p className="live-indicator" aria-live="polite">● Live A2A feed</p>}
      {feed.messages.length > 0 && (
        <div className="a2a-feed">{feed.messages.map((m, i) => <A2AMessage key={i} msg={m} />)}</div>
      )}
    </main>
  );
}
