import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp } from "lucide-react";
import { formatAverage, formatNumber, formatPercentage } from "@/lib/dashboardFormatters";
import type { QuadrantInsight } from "@/lib/googleSheets";

interface FBMSegmentHighlightsProps {
  quadrants?: QuadrantInsight[];
}

const FBMSegmentHighlights = ({ quadrants }: FBMSegmentHighlightsProps) => {
  if (!quadrants || quadrants.length === 0) {
    return null;
  }

  const opportunityQuadrant =
    quadrants
      .filter((quadrant) => (quadrant.avgAbility ?? 0) < 3)
      .sort((a, b) => b.count - a.count)[0] ?? quadrants[0];

  const momentumQuadrant =
    quadrants
      .filter((quadrant) => (quadrant.avgMotivation ?? 0) >= 3 && (quadrant.avgAbility ?? 0) >= 3)
      .sort((a, b) => (b.currentUseRate ?? 0) - (a.currentUseRate ?? 0))[0] ?? quadrants[0];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm hover:shadow-2xl transition-all">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-chart-2 to-chart-2/70 shadow-md">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Opportunity Segment</CardTitle>
              <CardDescription>Largest group with ability barriers</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">{opportunityQuadrant.label}</span> accounts for {" "}
            {formatNumber(opportunityQuadrant.count)} respondents ({formatPercentage(opportunityQuadrant.percentage)}). Average
            ability is {formatAverage(opportunityQuadrant.avgAbility)} with a current use rate of {" "}
            {opportunityQuadrant.currentUseRate == null
              ? "n/a"
              : formatPercentage(opportunityQuadrant.currentUseRate * 100)}.
          </p>
          <p>
            Focus on facilitator prompts and system improvements to unlock this group. Remove logistical barriers while
            maintaining the motivation already present.
          </p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm hover:shadow-2xl transition-all">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-quadrant-high-m-high-a to-quadrant-high-m-high-a/70 shadow-md">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Momentum Segment</CardTitle>
              <CardDescription>Where prompts can reinforce success</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">{momentumQuadrant.label}</span> shows the highest current use rate at {" "}
            {momentumQuadrant.currentUseRate == null
              ? "n/a"
              : formatPercentage(momentumQuadrant.currentUseRate * 100)} with motivation averaging {" "}
            {formatAverage(momentumQuadrant.avgMotivation)}. Maintain behaviour with light-touch signal prompts and peer-led
            storytelling.
          </p>
          <p>
            Monitor this cohort as an early indicator of system performance—declines often appear here first when service
            quality dips.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FBMSegmentHighlights;
