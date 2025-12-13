import "./StatsCard.css";

export default function StatsCard({ icon, label, value, trend, trendUp = true, variant = "default" }) {
  return (
    <div className={`stats-card stats-card-${variant}`}>
      <div className="stats-card-icon">
        {icon}
      </div>
      <div className="stats-card-content">
        <div className="stats-card-label">{label}</div>
        <div className="stats-card-value">{value}</div>
        {trend && (
          <div className={`stats-card-trend ${trendUp ? "trend-up" : "trend-down"}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              {trendUp ? (
                <polyline points="18 15 12 9 6 15"></polyline>
              ) : (
                <polyline points="6 9 12 15 18 9"></polyline>
              )}
            </svg>
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}
