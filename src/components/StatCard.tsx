export const StatCard = ({ label, value, hint }: { label: string; value: string | number; hint?: string }) => (
  <div className="stat-card">
    <span>{label}</span>
    <strong>{value}</strong>
    {hint && <small>{hint}</small>}
  </div>
);
