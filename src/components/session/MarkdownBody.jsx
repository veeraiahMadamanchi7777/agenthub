/** Renders agent markdown responses. */
import Markdown from 'react-markdown';

export function MarkdownBody({ content }) {
  return <div className="markdown-body"><Markdown>{content}</Markdown></div>;
}
