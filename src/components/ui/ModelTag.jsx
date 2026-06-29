/** Model tag pill. */
import { CapTag } from './CapTag.jsx';

export function ModelTag({ label, onClick }) {
  return <CapTag label={label} onClick={onClick} kind="model" />;
}
