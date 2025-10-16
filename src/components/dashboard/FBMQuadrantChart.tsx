import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>FBM Quadrant Analysis</CardTitle>
              <CardDescription>
                Motivation vs Ability scatter plot with behavior outcomes
              </CardDescription>
            </div>
            <Select value={overlayType} onValueChange={(val) => setOverlayType(val as "norms" | "system")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Overlay" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="norms">Social Norms</SelectItem>
                <SelectItem value="system">System Readiness</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative w-full aspect-square max-w-3xl mx-auto">
            {/* SVG Chart */}
            <svg viewBox="0 0 600 600" className="w-full h-full">
              {/* Background quadrants */}
              <rect x="0" y="0" width="300" height="300" fill="hsl(var(--destructive) / 0.05)" />
              <rect x="300" y="0" width="300" height="300" fill="hsl(var(--warning) / 0.05)" />
              <rect x="0" y="300" width="300" height="300" fill="hsl(var(--warning) / 0.05)" />
              <rect x="300" y="300" width="300" height="300" fill="hsl(var(--success) / 0.05)" />
              
              {/* Grid lines */}
              <line x1="0" y1="300" x2="600" y2="300" stroke="hsl(var(--border))" strokeWidth="2" />
              <line x1="300" y1="0" x2="300" y2="600" stroke="hsl(var(--border))" strokeWidth="2" />
              
              {/* Axis lines */}
              <line x1="50" y1="550" x2="550" y2="550" stroke="hsl(var(--foreground))" strokeWidth="2" />
              <line x1="50" y1="50" x2="50" y2="550" stroke="hsl(var(--foreground))" strokeWidth="2" />
              
              {/* Axis labels */}
              <text x="300" y="585" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="14" fontWeight="600">
                Ability Score
              </text>
              <text x="15" y="300" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="14" fontWeight="600" transform="rotate(-90 15 300)">
                Motivation Score
              </text>
              
              {/* Quadrant labels */}
              <text x="150" y="150" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="12" fontWeight="500">
                Low M / Low A
              </text>
              <text x="450" y="150" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="12" fontWeight="500">
                Low M / High A
              </text>
              <text x="150" y="450" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="12" fontWeight="500">
                High M / Low A
              </text>
              <text x="450" y="450" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="12" fontWeight="500">
                High M / High A
              </text>
              
              {/* Data points */}
              {data.map((point) => {
                const x = 50 + (point.ability / 5) * 500;
                const y = 550 - (point.motivation / 5) * 500;
                const size = overlayType === "norms" 
                  ? 2 + (point.norms / 5) * 6
                  : 2 + (point.system / 5) * 6;
                
                return (
                  <circle
                    key={point.id}
                    cx={x}
                    cy={y}
                    r={size}
                    fill={point.currentUse ? "hsl(var(--success))" : "hsl(var(--chart-2))"}
                    opacity="0.6"
                    className="transition-all hover:opacity-100"
                  >
                    <title>
                      {`Motivation: ${point.motivation.toFixed(1)}, Ability: ${point.ability.toFixed(1)}\nCurrent Use: ${point.currentUse ? "Yes" : "No"}\n${overlayType === "norms" ? "Norms" : "System"}: ${(overlayType === "norms" ? point.norms : point.system).toFixed(1)}`}
                    </title>
                  </circle>
                );
              })}
              
              {/* Legend */}
              <g transform="translate(430, 20)">
                <circle cx="10" cy="10" r="5" fill="hsl(var(--success))" opacity="0.7" />
                <text x="20" y="15" fill="hsl(var(--foreground))" fontSize="11">Current User</text>
                <circle cx="10" cy="30" r="5" fill="hsl(var(--chart-2))" opacity="0.7" />
                <text x="20" y="35" fill="hsl(var(--foreground))" fontSize="11">Non-User</text>
                <text x="10" y="55" fill="hsl(var(--muted-foreground))" fontSize="10">
                  Size = {overlayType === "norms" ? "Norms" : "System"}
                </text>
              </g>
            </svg>
          </div>
          
          {/* Insights */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-success/10 border border-success/30">
              <h4 className="font-semibold text-sm mb-2">Key Finding</h4>
              <p className="text-sm text-muted-foreground">
                {overlayType === "norms" 
                  ? "Strong positive social norms amplify behavior - individuals with higher norm scores are more likely to be above the action line even at moderate ability."
                  : "System readiness acts as a critical gatekeeper - reliable services and supportive providers significantly increase contraceptive uptake across all motivation levels."}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-chart-2/10 border border-chart-2/30">
              <h4 className="font-semibold text-sm mb-2">Recommended Action</h4>
              <p className="text-sm text-muted-foreground">
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
