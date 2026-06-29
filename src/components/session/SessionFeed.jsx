/** Main session conversation stream. */
import { ChatMessage } from './ChatMessage.jsx';

export function SessionFeed({ msgs, thinking, agentName }) {
  return (
    <div className="session-feed" aria-label="Session activity">
      {msgs.map((m, i) => <ChatMessage key={i} msg={m} />)}
      {thinking && (
        <div className="thinking" aria-live="polite">
          <div className="thinking-dots"><span /><span /><span /></div>
          {agentName} is working…
        </div>
      )}
    </div>
  );
}
