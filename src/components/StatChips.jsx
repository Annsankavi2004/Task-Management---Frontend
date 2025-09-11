export default function StatChips({ items }) {
  return (
    <div className="chips">
      {items.map((it, i) => (
        <div key={i} className="chip">
          <span className="chip-dot" style={{ background: it.color }} />
          <span className="chip-num">{it.value}</span>
          <span className="chip-label">{it.label}</span>
        </div>
      ))}
    </div>
  );
}
