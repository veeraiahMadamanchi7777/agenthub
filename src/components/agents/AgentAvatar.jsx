/** Neutral avatar initials — no agent color. */
export function AgentAvatar({ agent }) {
  const initial = (agent.name?.[0] || '?').toUpperCase();
  return (
    <div className="agent-avatar" aria-hidden="true">
      {initial}
    </div>
  );
}
