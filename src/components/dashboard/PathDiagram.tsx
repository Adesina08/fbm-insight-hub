import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

const PathDiagram = () => {
  // Logistic regression coefficients
  const predictors = [
    { 
      variable: "Descriptive Norms", 
      beta: 1.8, 
      pValue: "<0.01",
      strength: "strong",
      interpretation: "Strong predictor of contraceptive use"
    },
    { 
      variable: "System Score", 
      beta: 1.5, 
      pValue: "<0.01",
      strength: "strong",
      interpretation: "Reliable services and supportive institutions substantially increase use"
    },
    { 
      variable: "Ability Score", 
      beta: 1.2, 
      pValue: "<0.05",
      strength: "moderate",
      interpretation: "Independently predictive after controlling for motivation"
    },
    { 
      variable: "Motivation Score", 
      beta: 0.6, 
      pValue: "<0.10",
      strength: "weak",
      interpretation: "Smaller effect when norms, ability, and system factors are included"
    },
    { 
      variable: "Prompts", 
      beta: 0.3, 
      pValue: "n.s.",
      strength: "indirect",
      interpretation: "Indirect effect via ability, norms, and system readiness"
    },
  ];

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case "strong": return "text-chart-1";
      case "moderate": return "text-chart-2";
      case "weak": return "text-chart-3";
      case "indirect": return "text-muted-foreground";
      default: return "text-foreground";
    }
  };

  const getBarWidth = (beta: number) => {
    const maxBeta = 2.0;
    return `${(Math.abs(beta) / maxBeta) * 100}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Path Diagram: Predictors of Contraceptive Use</CardTitle>
        <CardDescription>
          Logistic regression results showing adjusted odds ratios and significance levels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Path Diagram Visualization */}
        <div className="p-6 rounded-lg border bg-muted/30">
          <div className="space-y-4">
            {predictors.map((predictor, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{predictor.variable}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${getStrengthColor(predictor.strength)}`}>
                      β = {predictor.beta > 0 ? '+' : ''}{predictor.beta}
                    </span>
                    <span className="text-xs text-muted-foreground w-16">
                      {predictor.pValue}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full ${
                      predictor.strength === 'strong' ? 'bg-chart-1' :
                      predictor.strength === 'moderate' ? 'bg-chart-2' :
                      predictor.strength === 'weak' ? 'bg-chart-3' :
                      'bg-muted-foreground/50'
                    }`}
                    style={{ width: getBarWidth(predictor.beta) }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{predictor.interpretation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Model Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pseudo R²</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0.68</div>
              <p className="text-xs text-muted-foreground mt-1">Model fit</p>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">ROC AUC</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0.84</div>
              <p className="text-xs text-muted-foreground mt-1">Classification accuracy</p>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Likelihood Ratio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">χ² = 342.5</div>
              <p className="text-xs text-muted-foreground mt-1">p &lt; 0.001</p>
            </CardContent>
          </Card>
        </div>

        {/* Interaction Terms */}
        <div className="space-y-3">
          <h4 className="font-semibold">Interaction Effects</h4>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="p-3 rounded-lg border bg-muted/50">
              <div className="text-sm font-medium mb-1">Motivation × Ability</div>
              <div className="text-xs text-muted-foreground">β = +0.4, p &lt; 0.05</div>
            </div>
            <div className="p-3 rounded-lg border bg-muted/50">
              <div className="text-sm font-medium mb-1">Norms × Motivation</div>
              <div className="text-xs text-muted-foreground">β = +0.5, p &lt; 0.01</div>
            </div>
            <div className="p-3 rounded-lg border bg-muted/50">
              <div className="text-sm font-medium mb-1">System × Ability</div>
              <div className="text-xs text-muted-foreground">β = +0.6, p &lt; 0.01</div>
            </div>
          </div>
        </div>

        {/* Key Findings */}
        <div className="p-4 rounded-lg border bg-primary/5 border-primary/30">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5" />
            <div className="flex-1 space-y-3">
              <div>
                <h4 className="font-semibold text-sm mb-1">Key Findings</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Norms, ability, and system readiness are the most actionable levers</li>
                  <li>• Motivation alone does not guarantee behavior</li>
                  <li>• Strong systems amplify the effects of motivation and norms, while weak systems nullify them</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Recommendations</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Invest in community norm transformation and system strengthening</li>
                  <li>• Combine ability-focused interventions with system-level improvements</li>
                  <li>• Leverage prompts within supportive systems to maximize impact</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PathDiagram;
