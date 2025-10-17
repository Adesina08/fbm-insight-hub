import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Plot from 'react-plotly.js';
import { Target, Info } from "lucide-react";

// Sample data representing respondents in FBM quadrants
const generateSampleData = () => {
  const data = [];
  const rand = () => Math.random();
  
  // High Motivation / High Ability (524 respondents)
  for (let i = 0; i < 100; i++) {
    data.push({
      id: `hm-ha-${i}`,
      motivation: 3.5 + rand() * 1.5,
      ability: 3.5 + rand() * 1.5,
      currentUse: rand() > 0.2,
      norms: 3 + rand() * 2,
      system: 3 + rand() * 2,
      quadrant: "High M / High A"
    });
  }
  
  // High Motivation / Low Ability (349 respondents)
  for (let i = 0; i < 65; i++) {
    data.push({
      id: `hm-la-${i}`,
      motivation: 3.5 + rand() * 1.5,
      ability: 1 + rand() * 2,
      currentUse: rand() > 0.6,
      norms: 2 + rand() * 2,
      system: 1.5 + rand() * 1.5,
      quadrant: "High M / Low A"
    });
  }
  
  // Low Motivation / High Ability (224 respondents)
  for (let i = 0; i < 45; i++) {
    data.push({
      id: `lm-ha-${i}`,
      motivation: 1 + rand() * 2,
      ability: 3.5 + rand() * 1.5,
      currentUse: rand() > 0.7,
      norms: 1.5 + rand() * 2,
      system: 2.5 + rand() * 2,
      quadrant: "Low M / High A"
    });
  }
  
  // Low Motivation / Low Ability (150 respondents)
  for (let i = 0; i < 35; i++) {
    data.push({
      id: `lm-la-${i}`,
      motivation: 1 + rand() * 2,
      ability: 1 + rand() * 2,
      currentUse: rand() > 0.85,
      norms: 1 + rand() * 1.5,
      system: 1 + rand() * 1.5,
      quadrant: "Low M / Low A"
    });
  }
  
  return data;
};

const FBMQuadrantChart = () => {
  const [overlayType, setOverlayType] = useState<"norms" | "system">("norms");
  const data = generateSampleData();

  const users = data.filter(d => d.currentUse);
  const nonUsers = data.filter(d => !d.currentUse);

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-chart-3 shadow-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">FBM Quadrant Analysis</CardTitle>
                <CardDescription className="text-base mt-1">
                  Motivation vs Ability scatter plot with behavior outcomes
                </CardDescription>
              </div>
            </div>
            <Select value={overlayType} onValueChange={(val) => setOverlayType(val as "norms" | "system")}>
              <SelectTrigger className="w-[200px] bg-background/50">
                <SelectValue placeholder="Overlay" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="norms">Social Norms Overlay</SelectItem>
                <SelectItem value="system">System Readiness Overlay</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full">
            <Plot
              data={[
                {
                  x: users.map(d => d.ability),
                  y: users.map(d => d.motivation),
                  mode: 'markers',
                  type: 'scatter',
                  name: 'Current Users',
                  marker: {
                    size: overlayType === "norms" 
                      ? users.map(d => 6 + d.norms * 3)
                      : users.map(d => 6 + d.system * 3),
                    color: '#22c55e',
                    opacity: 0.7,
                    line: { color: '#16a34a', width: 1 }
                  },
                  hovertemplate: '<b>Current User</b><br>' +
                    'Ability: %{x:.1f}<br>' +
                    'Motivation: %{y:.1f}<br>' +
                    (overlayType === 'norms' ? 'Norms: %{marker.size}' : 'System: %{marker.size}') +
                    '<extra></extra>'
                },
                {
                  x: nonUsers.map(d => d.ability),
                  y: nonUsers.map(d => d.motivation),
                  mode: 'markers',
                  type: 'scatter',
                  name: 'Non-Users',
                  marker: {
                    size: overlayType === "norms" 
                      ? nonUsers.map(d => 6 + d.norms * 3)
                      : nonUsers.map(d => 6 + d.system * 3),
                    color: '#a855f7',
                    opacity: 0.6,
                    line: { color: '#9333ea', width: 1 }
                  },
                  hovertemplate: '<b>Non-User</b><br>' +
                    'Ability: %{x:.1f}<br>' +
                    'Motivation: %{y:.1f}<br>' +
                    (overlayType === 'norms' ? 'Norms: %{marker.size}' : 'System: %{marker.size}') +
                    '<extra></extra>'
                }
              ]}
              layout={{
                width: undefined,
                height: 600,
                autosize: true,
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                xaxis: {
                  title: { text: 'Ability Score', font: { size: 16, family: 'inherit' } },
                  range: [0, 5.5],
                  gridcolor: '#e5e7eb',
                  zeroline: true,
                  zerolinecolor: '#9ca3af'
                },
                yaxis: {
                  title: { text: 'Motivation Score', font: { size: 16, family: 'inherit' } },
                  range: [0, 5.5],
                  gridcolor: '#e5e7eb',
                  zeroline: true,
                  zerolinecolor: '#9ca3af'
                },
                shapes: [
                  // Vertical line at x=3
                  {
                    type: 'line',
                    x0: 3, x1: 3,
                    y0: 0, y1: 5.5,
                    line: { color: '#6b7280', width: 2, dash: 'dash' }
                  },
                  // Horizontal line at y=3
                  {
                    type: 'line',
                    x0: 0, x1: 5.5,
                    y0: 3, y1: 3,
                    line: { color: '#6b7280', width: 2, dash: 'dash' }
                  },
                  // Quadrant backgrounds
                  {
                    type: 'rect',
                    x0: 0, x1: 3, y0: 0, y1: 3,
                    fillcolor: '#ef4444',
                    opacity: 0.05,
                    layer: 'below',
                    line: { width: 0 }
                  },
                  {
                    type: 'rect',
                    x0: 3, x1: 5.5, y0: 0, y1: 3,
                    fillcolor: '#a855f7',
                    opacity: 0.05,
                    layer: 'below',
                    line: { width: 0 }
                  },
                  {
                    type: 'rect',
                    x0: 0, x1: 3, y0: 3, y1: 5.5,
                    fillcolor: '#f59e0b',
                    opacity: 0.05,
                    layer: 'below',
                    line: { width: 0 }
                  },
                  {
                    type: 'rect',
                    x0: 3, x1: 5.5, y0: 3, y1: 5.5,
                    fillcolor: '#22c55e',
                    opacity: 0.05,
                    layer: 'below',
                    line: { width: 0 }
                  }
                ],
                annotations: [
                  { x: 1.5, y: 1.5, text: 'Low M / Low A', showarrow: false, font: { size: 11, color: '#9ca3af' } },
                  { x: 4.25, y: 1.5, text: 'Low M / High A', showarrow: false, font: { size: 11, color: '#9ca3af' } },
                  { x: 1.5, y: 4.25, text: 'High M / Low A', showarrow: false, font: { size: 11, color: '#9ca3af' } },
                  { x: 4.25, y: 4.25, text: 'High M / High A', showarrow: false, font: { size: 11, color: '#9ca3af' } }
                ],
                legend: {
                  x: 1,
                  xanchor: 'right',
                  y: 1,
                  bgcolor: 'rgba(255,255,255,0.9)',
                  bordercolor: '#e5e7eb',
                  borderwidth: 1
                },
                margin: { l: 60, r: 20, t: 20, b: 60 }
              }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%' }}
            />
          </div>
          
          {/* Insights */}
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="p-5 rounded-xl bg-gradient-to-br from-quadrant-high-m-high-a/10 to-quadrant-high-m-high-a/5 border-2 border-quadrant-high-m-high-a/30 shadow-lg">
              <div className="flex items-start gap-3 mb-3">
                <Info className="w-5 h-5 text-quadrant-high-m-high-a mt-0.5" />
                <h4 className="font-bold text-base">Key Finding</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {overlayType === "norms" 
                  ? "Strong positive social norms amplify behavior - individuals with higher norm scores (larger bubbles) are more likely to be above the action line even at moderate ability."
                  : "System readiness acts as a critical gatekeeper - reliable services and supportive providers (larger bubbles) significantly increase contraceptive uptake across all motivation levels."}
              </p>
            </div>
            <div className="p-5 rounded-xl bg-gradient-to-br from-chart-3/10 to-chart-3/5 border-2 border-chart-3/30 shadow-lg">
              <div className="flex items-start gap-3 mb-3">
                <Target className="w-5 h-5 text-chart-3 mt-0.5" />
                <h4 className="font-bold text-base">Recommended Action</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {overlayType === "norms"
                  ? "Deploy norm-based campaigns targeting the Low Motivation / High Ability quadrant, emphasizing peer adoption and community acceptance."
                  : "Strengthen health system infrastructure in the High Motivation / Low Ability quadrant by reducing costs, ensuring supply reliability, and improving provider respect."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FBMQuadrantChart;