import { Icon } from "./Icon";

export function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button className="btn ghost small" onClick={onBack} style={{ marginBottom: 4 }}>
      <Icon name="back" size={16} /> Back
    </button>
  );
}
