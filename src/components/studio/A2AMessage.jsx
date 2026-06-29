/** A2A pipeline message row in studio feed. */
export function A2AMessage({ msg }) {
  let json = null;
  if (msg.type === 'a2a') try { json = JSON.parse(msg.text); } catch {}
  return (
    <div className="a2a-row">
      <div className="a2a-meta">
        <span className="a2a-from mono">{msg.from}</span>
        {msg.to && <span> → {msg.to}</span>}
        <span className="a2a-type">{msg.type}</span>
      </div>
      {json ? <pre className="a2a-json">{json.message || JSON.stringify(json, null, 2)}</pre>
        : <div className="a2a-text">{msg.text}</div>}
    </div>
  );
}
