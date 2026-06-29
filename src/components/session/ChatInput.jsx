/** Session chat input with attach + keyboard hint. */
import { useState } from 'react';
import { useToast } from '../../context/ToastProvider.jsx';

export function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const { show } = useToast();
  const send = () => { if (text.trim()) { onSend(text); setText(''); } };
  const attach = () => show('File upload coming soon', 'info');
  return (
    <div className="chat-input-wrap">
      <textarea className="chat-textarea" value={text} onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
        placeholder="Message agent..." rows={3} aria-label="Message agent" />
      <div className="chat-input-bar">
        <button type="button" className="chat-attach" onClick={attach} aria-label="Attach file">📎</button>
        <span className="chat-hint">Enter to send · Shift+Enter for newline</span>
        <button type="button" className="chat-send" onClick={send} disabled={disabled || !text.trim()}>Send ↵</button>
      </div>
    </div>
  );
}
