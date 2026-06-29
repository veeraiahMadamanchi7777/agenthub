/** Chat message with markdown, timestamp, copy. */
import { useState } from 'react';
import { MarkdownBody } from './MarkdownBody.jsx';
import { useToast } from '../../context/ToastProvider.jsx';

export function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  const { show } = useToast();
  const [copied, setCopied] = useState(false);
  const copy = async (e) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(msg.content);
    setCopied(true);
    show('Copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <section className={`chat-bubble ${isUser ? 'user' : 'agent'}`} aria-label={isUser ? 'Your message' : 'Agent message'}>
      <div className="chat-bubble-head">
        <span className="chat-bubble-role">{isUser ? 'You' : 'Agent'}</span>
        {msg.ts && <time className="chat-bubble-time">{msg.ts}</time>}
        {!isUser && (
          <button type="button" className="chat-copy" onClick={copy} aria-label="Copy message">
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
      <div className="chat-bubble-body">
        {isUser ? <p>{msg.content}</p> : <MarkdownBody content={msg.content} />}
      </div>
    </section>
  );
}
