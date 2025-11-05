import type { DashboardAnalytics } from "@/lib/googleSheets";
import type { DashboardOverviewMetadata } from "@/components/dashboard/DashboardOverview";
import { formatLastUpdated } from "@/lib/dashboardFormatters";

interface ExecutivePrintReportProps {
  analytics: DashboardAnalytics | null;
  metadata?: DashboardOverviewMetadata | null;
  isLoading: boolean;
  error?: string | null;
  dataMode: "live" | "upload" | null;
  syncStatus: string;
}

const numberFormatter = new Intl.NumberFormat();

const formatNumber = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) {
    return "n/a";
  }
  return numberFormatter.format(value);
};

const formatScore = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) {
    return "n/a";
  }
  return `${value.toFixed(2)} / 5.0`;
};

const formatPercentage = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) {
    return "n/a";
  }
  return `${value.toFixed(0)}%`;
};

const formatRate = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) {
    return "n/a";
  }
  return `${(value * 100).toFixed(0)}%`;
};

const STRENGTH_ORDER: Record<string, number> = {
  strong: 0,
  moderate: 1,
  weak: 2,
  indirect: 3,
};

const ExecutivePrintReport = ({
  analytics,
  metadata,
  isLoading,
  error,
  dataMode,
  syncStatus,
}: ExecutivePrintReportProps) => {
  if (!dataMode) {
    return (
      <div className="hidden print:block print-report">
        <section className="print-section">
          <div className="print-section-header">
            <div className="print-section-icon">!</div>
            <div className="flex-1">
              <h2>Report not ready</h2>
              <p>Select a data source to generate the executive summary.</p>
            </div>
          </div>
          <p className="print-caption">
            The executive PDF export is available once you connect to a live sheet or upload a dataset.
          </p>
        </section>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="hidden print:block print-report">
        <section className="print-section">
          <div className="print-section-header">
            <div className="print-section-icon">⏳</div>
            <div className="flex-1">
              <h2>Preparing report</h2>
              <p>We are processing the latest dataset. This view will refresh automatically.</p>
            </div>
          </div>
          <p className="print-caption">{syncStatus}</p>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hidden print:block print-report">
        <section className="print-section">
          <div className="print-section-header">
            <div className="print-section-icon">⚠️</div>
            <div className="flex-1">
              <h2>Unable to build report</h2>
              <p>The dashboard data could not be loaded for this export.</p>
            </div>
          </div>
          <p className="print-caption">{error}</p>
        </section>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const { stats, quadrants, segments, promptEffectiveness, regression, modelSummary, lastUpdated } = analytics;

  const contextMetadata: DashboardOverviewMetadata | null =
    metadata === undefined
      ? {
          primary: `Last data sync: ${formatLastUpdated(lastUpdated)}`,
          secondary: "Data refreshes automatically every minute.",
        }
      : metadata ?? null;

  const sortedQuadrants = [...quadrants].sort((a, b) => b.count - a.count);
  const largestQuadrant = sortedQuadrants[0];
  const opportunityQuadrant =
    quadrants
      .filter((quadrant) => (quadrant.avgAbility ?? 0) < 3)
      .sort((a, b) => (a.avgAbility ?? 0) - (b.avgAbility ?? 0))[0] ?? largestQuadrant;
  const momentumQuadrant =
    quadrants
      .filter((quadrant) => (quadrant.avgMotivation ?? 0) >= 3 && (quadrant.avgAbility ?? 0) >= 3)
      .sort((a, b) => (b.currentUseRate ?? 0) - (a.currentUseRate ?? 0))[0] ?? largestQuadrant;

  const summaryStatements = [
    `The current dataset covers ${formatNumber(stats.totalRespondents.value)} respondents, including ${formatNumber(
      stats.currentUsers.value,
    )} verified current contraceptive users.`,
    `Average motivation stands at ${formatScore(stats.averageMotivation.value)} and ability at ${formatScore(
      stats.averageAbility.value,
    )}, both on a five-point scale.`,
    largestQuadrant
      ? `Largest behavioural segment: ${largestQuadrant.label}, representing ${formatPercentage(
          largestQuadrant.percentage,
        )} of respondents (${formatNumber(largestQuadrant.count)} people).`
      : null,
    momentumQuadrant
      ? `Peak current-use rate observed in ${momentumQuadrant.label} at ${formatRate(
          momentumQuadrant.currentUseRate,
        )}.`
      : null,
  ].filter((statement): statement is string => Boolean(statement));

  const topSegments = [...segments]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3);

  const promptHighlights = promptEffectiveness
    .map((row) => {
      const entries = [
        { key: "facilitator", label: "Facilitator prompts", value: row.facilitator },
        { key: "spark", label: "Spark prompts", value: row.spark },
        { key: "signal", label: "Signal prompts", value: row.signal },
      ].filter((entry) => entry.value != null && !Number.isNaN(entry.value));

      if (entries.length === 0) {
        return null;
      }

      const best = entries.sort((a, b) => (b.value ?? 0) - (a.value ?? 0))[0];
      return {
        quadrant: row.name,
        prompt: best.label,
        score: best.value,
      };
    })
    .filter((item): item is { quadrant: string; prompt: string; score: number | null } => Boolean(item));

  const regressionHighlights = [...regression]
    .sort((a, b) => {
      const left = STRENGTH_ORDER[a.strength] ?? Number.MAX_SAFE_INTEGER;
      const right = STRENGTH_ORDER[b.strength] ?? Number.MAX_SAFE_INTEGER;
      if (left !== right) {
        return left - right;
      }
      const betaLeft = Math.abs(a.beta ?? 0);
      const betaRight = Math.abs(b.beta ?? 0);
      return betaRight - betaLeft;
    })
    .slice(0, 3);

  const sourceLabel = dataMode === "upload" ? "Uploaded dataset" : "Live data connection";

  return (
    <div className="hidden print:block print-report">
      <section className="print-section">
        <div className="print-section-header">
          <div className="print-section-icon">📊</div>
          <div className="flex-1">
            <h2>Executive Summary</h2>
            <p>Key adoption outcomes and behavioural intelligence for senior leaders.</p>
          </div>
          <span className="print-section-badge">Summary</span>
        </div>
        <p className="print-caption">Source: {sourceLabel}</p>
        {contextMetadata ? (
          <>
            <p className="print-caption">{contextMetadata.primary}</p>
            {contextMetadata.secondary ? <p className="print-caption">{contextMetadata.secondary}</p> : null}
          </>
        ) : null}
        <div className="print-metric-grid">
          <div className="print-metric-card">
            <h3>Total respondents</h3>
            <p>{formatNumber(stats.totalRespondents.value)}</p>
          </div>
          <div className="print-metric-card">
            <h3>Current contraceptive users</h3>
            <p>{formatNumber(stats.currentUsers.value)}</p>
          </div>
          <div className="print-metric-card">
            <h3>Average motivation</h3>
            <p>{formatScore(stats.averageMotivation.value)}</p>
          </div>
          <div className="print-metric-card">
            <h3>Average ability</h3>
            <p>{formatScore(stats.averageAbility.value)}</p>
          </div>
        </div>
        <ul className="print-insight-list">
          {summaryStatements.map((statement, index) => (
            <li key={index}>{statement}</li>
          ))}
        </ul>
      </section>

      <section className="print-section">
        <div className="print-section-header">
          <div className="print-section-icon">🧭</div>
          <div className="flex-1">
            <h2>Behavioural Segmentation</h2>
            <p>Segment distribution and personas that anchor strategic prioritisation.</p>
          </div>
          <span className="print-section-badge">Segments</span>
        </div>
        <div className="print-twocolumn">
          <div>
            <h3 className="print-subheading">Quadrant focus</h3>
            <ul className="print-insight-list">
              {largestQuadrant ? (
                <li>
                  <strong>{largestQuadrant.label}</strong> commands {formatPercentage(largestQuadrant.percentage)} of responses.
                  Sustain motivation levels while systematically managing emerging friction points.
                </li>
              ) : null}
              {opportunityQuadrant ? (
                <li>
                  <strong>{opportunityQuadrant.label}</strong> registers the lowest ability score at {formatScore(
                    opportunityQuadrant.avgAbility,
                  )}. Mobilise operational partners to remove structural barriers and reinforce enabling services.
                </li>
              ) : null}
              {momentumQuadrant ? (
                <li>
                  <strong>{momentumQuadrant.label}</strong> delivers the strongest current-use rate at {formatRate(
                    momentumQuadrant.currentUseRate,
                  )}. Maintain momentum with light-touch signal prompts and continued recognition.
                </li>
              ) : null}
            </ul>
          </div>
          <div>
            <h3 className="print-subheading">Priority segments</h3>
            <div className="print-segment-grid">
              {topSegments.map((segment) => (
                <div key={segment.id} className="print-segment-card">
                  <div className="print-segment-title">{segment.name}</div>
                  <div className="print-segment-meta">
                    {formatPercentage(segment.percentage)} of respondents • {formatNumber(segment.count)} people
                  </div>
                  <p>{segment.description}</p>
                  {segment.insights.length > 0 ? (
                    <ul>
                      {segment.insights.slice(0, 2).map((insight, index) => (
                        <li key={index}>{insight}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="print-section">
        <div className="print-section-header">
          <div className="print-section-icon">💡</div>
          <div className="flex-1">
            <h2>Prompt Strategy</h2>
            <p>Effectiveness of key prompts by quadrant to guide messaging and service cues.</p>
          </div>
          <span className="print-section-badge">Prompts</span>
        </div>
        {promptHighlights.length > 0 ? (
          <table className="print-table">
            <thead>
              <tr>
                <th>Quadrant</th>
                <th>Priority prompt</th>
                <th>Average effectiveness score (1–5)</th>
              </tr>
            </thead>
            <tbody>
              {promptHighlights.map((highlight, index) => (
                <tr key={index}>
                  <td>{highlight.quadrant}</td>
                  <td>{highlight.prompt}</td>
                  <td>{highlight.score == null ? "n/a" : highlight.score.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="print-caption">Prompt effectiveness insights will appear once scores are available.</p>
        )}
      </section>

      <section className="print-section">
        <div className="print-section-header">
          <div className="print-section-icon">🧠</div>
          <div className="flex-1">
            <h2>Behavioural Model</h2>
            <p>Regression highlights and diagnostics that evidence the FBM pathway.</p>
          </div>
          <span className="print-section-badge">Model</span>
        </div>
        {regressionHighlights.length > 0 ? (
          <ul className="print-insight-list">
            {regressionHighlights.map((item, index) => (
              <li key={index}>
                <strong>{item.variable}</strong> ({item.strength}) — {item.interpretation}
              </li>
            ))}
          </ul>
        ) : (
          <p className="print-caption">Regression highlights will populate once model coefficients are available.</p>
        )}
        {modelSummary.length > 0 ? (
          <table className="print-table">
            <tbody>
              {modelSummary.map((row, index) => (
                <tr key={index}>
                  <th>{row.label}</th>
                  <td>{row.value}</td>
                  <td>{row.helper}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>

      <section className="print-section">
        <div className="print-section-header">
          <div className="print-section-icon">📁</div>
          <div className="flex-1">
            <h2>Data &amp; Methodology Notes</h2>
            <p>Concise view of data provenance, refresh cadence, and analytical guardrails.</p>
          </div>
          <span className="print-section-badge">Data</span>
        </div>
        <p className="print-caption">Source: {sourceLabel}</p>
        {contextMetadata ? (
          <>
            <p className="print-caption">{contextMetadata.primary}</p>
            {contextMetadata.secondary ? <p className="print-caption">{contextMetadata.secondary}</p> : null}
          </>
        ) : null}
        <p className="print-caption">Status: {syncStatus}</p>
        <p className="print-caption">
          Metrics derive from Fogg Behavior Model scoring applied to submitted survey responses. Prompt scores capture average
          agreement with facilitator, spark, and signal constructs for each quadrant.
        </p>
      </section>
    </div>
  );
};

export default ExecutivePrintReport;
