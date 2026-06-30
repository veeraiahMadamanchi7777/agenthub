/** Schedule page — plan recurring or one-off agent runs. */
import { useState } from 'react';
import { useAgents } from '../hooks/useAgents.js';
import { useSchedules } from '../hooks/useSchedules.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { useToast } from '../context/ToastProvider.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { PrimaryBtn } from '../components/ui/PrimaryBtn.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';

const REPEAT_OPTIONS = [
  { value: 'once', label: 'Once' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

function formatRunAt(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export function SchedulePage() {
  usePageTitle('Automate');
  const { agents, loading: agentsLoading } = useAgents();
  const { schedules, add, remove, toggle } = useSchedules();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [agentSlug, setAgentSlug] = useState('');
  const [note, setNote] = useState('');
  const [runAt, setRunAt] = useState('');
  const [repeat, setRepeat] = useState('once');

  const resetForm = () => {
    setAgentSlug('');
    setNote('');
    setRunAt('');
    setRepeat('once');
    setOpen(false);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!agentSlug || !runAt) return;
    add({ agentSlug, note: note.trim(), runAt, repeat });
    show('Automation saved', 'success');
    resetForm();
  };

  if (agentsLoading) {
    return (
      <main className="page page-narrow schedule-page">
        <Skeleton lines={5} />
      </main>
    );
  }

  return (
    <main className="page page-narrow schedule-page">
      <PageHeader
        title="Automate"
        subtitle="Run agents on a timer — one-off or recurring."
        action={
          <button type="button" className="schedule-new-btn" onClick={() => setOpen((o) => !o)}>
            {open ? 'Cancel' : '+ New automation'}
          </button>
        }
      />

      {open && (
        <form className="schedule-form" onSubmit={submit}>
          <label className="schedule-field">
            <span>Agent</span>
            <select className="input schedule-select" value={agentSlug} onChange={(e) => setAgentSlug(e.target.value)} required>
              <option value="">Select agent…</option>
              {agents.map((a) => (
                <option key={a.slug} value={a.slug}>{a.name}</option>
              ))}
            </select>
          </label>
          <label className="schedule-field">
            <span>When</span>
            <input
              className="input schedule-datetime"
              type="datetime-local"
              value={runAt}
              onChange={(e) => setRunAt(e.target.value)}
              required
            />
          </label>
          <label className="schedule-field">
            <span>Repeat</span>
            <select className="input schedule-select" value={repeat} onChange={(e) => setRepeat(e.target.value)}>
              {REPEAT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="schedule-field">
            <span>Note (optional)</span>
            <input
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What should this run do?"
            />
          </label>
          <PrimaryBtn type="submit" disabled={!agentSlug || !runAt}>Save automation</PrimaryBtn>
        </form>
      )}

      {schedules.length === 0 ? (
        <p className="schedule-empty">No automations yet. Create one to run agents on a cadence.</p>
      ) : (
        <ul className="schedule-list">
          {schedules.map((s) => {
            const agent = agents.find((a) => a.slug === s.agentSlug);
            return (
              <li key={s.id} className={`schedule-item${s.enabled ? '' : ' schedule-item--paused'}`}>
                <div className="schedule-item-main">
                  <div className="schedule-item-top">
                    <span className="schedule-item-agent">{agent?.name || s.agentSlug}</span>
                    <span className="schedule-item-repeat">{s.repeat}</span>
                  </div>
                  <p className="schedule-item-time">{formatRunAt(s.runAt)}</p>
                  {s.note && <p className="schedule-item-note">{s.note}</p>}
                </div>
                <div className="schedule-item-actions">
                  <button
                    type="button"
                    className="schedule-toggle"
                    onClick={() => toggle(s.id)}
                    aria-pressed={s.enabled}
                  >
                    {s.enabled ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    type="button"
                    className="schedule-delete"
                    onClick={() => { remove(s.id); show('Automation removed', 'info'); }}
                    aria-label="Delete schedule"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
