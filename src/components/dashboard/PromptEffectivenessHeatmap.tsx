import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

const PromptEffectivenessHeatmap = () => {
  // Mock data - in production this would come from API
  const segments = [
    { name: "Empowered Adopters", facilitator: 8, spark: 2, signal: 9 },
    { name: "Willing but Hindered", facilitator: 9, spark: 5, signal: 3 },
    { name: "Passive Resisters", facilitator: 3, spark: 8, signal: 5 },
    { name: "Isolated Non-Users", facilitator: 2, spark: 4, signal: 2 },
  ];

  const getColorClass = (value: number) => {
    if (value >= 8) return "bg-chart-1";
    if (value >= 6) return "bg-chart-2";
    if (value >= 4) return "bg-chart-3";
    return "bg-chart-4";
  };

  const getTextColor = (value: number) => {
    return value >= 6 ? "text-white" : "text-foreground";
  };

  return (
    <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-chart-3 shadow-lg">
            <Info className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Prompt Effectiveness by Segment</CardTitle>
            <CardDescription className="text-base mt-1">
              How different prompt types (Facilitator, Spark, Signal) perform across behavioral segments
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Heatmap */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold">Segment</th>
                <th className="text-center p-3 font-semibold">Facilitator</th>
                <th className="text-center p-3 font-semibold">Spark</th>
                <th className="text-center p-3 font-semibold">Signal</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((segment, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-3 font-medium">{segment.name}</td>
                  <td className="p-3">
                    <div className={`${getColorClass(segment.facilitator)} ${getTextColor(segment.facilitator)} rounded py-2 px-4 text-center font-semibold`}>
                      {segment.facilitator}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className={`${getColorClass(segment.spark)} ${getTextColor(segment.spark)} rounded py-2 px-4 text-center font-semibold`}>
                      {segment.spark}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className={`${getColorClass(segment.signal)} ${getTextColor(segment.signal)} rounded py-2 px-4 text-center font-semibold`}>
                      {segment.signal}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-sm">
          <span className="font-medium">Effectiveness:</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-chart-1"></div>
            <span>High (8-10)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-chart-2"></div>
            <span>Medium (6-7)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-chart-3"></div>
            <span>Low (4-5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-chart-4"></div>
            <span>Very Low (1-3)</span>
          </div>
        </div>

        {/* Interpretation */}
        <div className="p-4 rounded-lg border bg-muted/50">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5" />
            <div className="flex-1 space-y-3">
              <div>
                <h4 className="font-semibold text-sm mb-1">Key Findings</h4>
                <p className="text-sm text-muted-foreground">
                  Prompt type effectiveness is context-dependent, aligned with FBM theory.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">Recommendations</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><strong>Facilitator prompts</strong> (helping when motivation is high but ability is low) are most effective in Willing but Hindered group.</li>
                  <li><strong>Spark prompts</strong> (boosting motivation) are more effective in Passive Resisters.</li>
                  <li><strong>Signal prompts</strong> (simple reminders) work best for Empowered Adopters to maintain use.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Prompt Type Matching */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-chart-1/10 border-chart-1/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Facilitator Prompts</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><strong>Best for:</strong> High M / Low A</p>
              <p className="text-muted-foreground">Example: "Free transport to clinic" SMS</p>
            </CardContent>
          </Card>

          <Card className="bg-chart-3/10 border-chart-3/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Spark Prompts</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><strong>Best for:</strong> Low M / High A</p>
              <p className="text-muted-foreground">Example: "Your health, your choice" campaign</p>
            </CardContent>
          </Card>

          <Card className="bg-chart-2/10 border-chart-2/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Signal Prompts</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><strong>Best for:</strong> High M / High A</p>
              <p className="text-muted-foreground">Example: Appointment reminders</p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default PromptEffectivenessHeatmap;
