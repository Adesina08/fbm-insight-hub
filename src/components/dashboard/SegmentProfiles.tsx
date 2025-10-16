import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const segments = [
  {
    id: "empowered",
    name: "Empowered Adopters",
    percentage: "42%",
    count: 524,
    color: "success",
    description: "High motivation, high ability, strong positive norms, supportive system environment",
    characteristics: {
      motivation: 4.2,
      ability: 4.0,
      descriptiveNorms: 4.1,
      injunctiveNorms: 3.9,
      systemReadiness: 3.8,
      promptReceptivity: 4.3
    },
    insights: [
      "Already using contraception - maintain engagement",
      "Strong candidates for peer advocacy programs",
      "Respond well to simple reminder prompts (Signals)",
      "Can provide valuable feedback on system gaps"
    ],
    recommendations: [
      "Encourage peer-to-peer promotion within community",
      "Use as champions for service quality feedback",
      "Simple reminder systems to maintain behavior",
      "Leverage for testimonials in campaigns"
    ]
  },
  {
    id: "willing",
    name: "Willing but Hindered",
    percentage: "28%",
    count: 349,
    color: "chart-2",
    description: "High motivation, low ability, moderate norms, weak system support",
    characteristics: {
      motivation: 4.1,
      ability: 2.3,
      descriptiveNorms: 2.8,
      injunctiveNorms: 2.6,
      systemReadiness: 2.2,
      promptReceptivity: 3.9
    },
    insights: [
      "Want to use contraception but face significant barriers",
      "Constraints: cost, access, time, provider stigma",
      "System bottlenecks prevent action despite high motivation",
      "Most responsive to Facilitator prompts (barrier removal)"
    ],
    recommendations: [
      "Reduce logistical and financial barriers to access",
      "Strengthen service reliability and supply chains",
      "Improve provider training on respect and support",
      "Implement transportation or mobile service solutions"
    ]
  },
  {
    id: "passive",
    name: "Passive Resisters",
    percentage: "18%",
    count: 224,
    color: "warning",
    description: "Low motivation, high ability, weak norms, mixed system readiness",
    characteristics: {
      motivation: 2.1,
      ability: 3.8,
      descriptiveNorms: 2.2,
      injunctiveNorms: 1.9,
      systemReadiness: 3.1,
      promptReceptivity: 2.4
    },
    insights: [
      "Services accessible but personal beliefs block uptake",
      "Social disapproval or conservative norms dominant",
      "Need motivational intervention despite high ability",
      "Most responsive to Spark prompts (motivation boosters)"
    ],
    recommendations: [
      "Deploy norm-shifting campaigns using trusted messengers",
      "Share success stories from similar peer groups",
      "Address misconceptions through community dialogue",
      "Engage religious and community leaders as advocates"
    ]
  },
  {
    id: "isolated",
    name: "Isolated Non-Users",
    percentage: "12%",
    count: 150,
    color: "destructive",
    description: "Low motivation, low ability, weak norms, minimal system support",
    characteristics: {
      motivation: 1.8,
      ability: 1.9,
      descriptiveNorms: 1.6,
      injunctiveNorms: 1.5,
      systemReadiness: 1.7,
      promptReceptivity: 1.8
    },
    insights: [
      "Socially disconnected or in conservative environments",
      "Both norms and systems fail to enable uptake",
      "Require comprehensive, multi-level interventions",
      "Hardest to reach but critical for equity"
    ],
    recommendations: [
      "Integrated community dialogue and norm change efforts",
      "Build basic access pathways (outreach, mobile services)",
      "Policy interventions to create enabling environment",
      "Long-term engagement with community structures"
    ]
  }
];

const SegmentProfiles = () => {
  const RadarChart = ({ data }: { data: any }) => {
    const dimensions = [
      { key: "motivation", label: "Motivation", angle: 0 },
      { key: "ability", label: "Ability", angle: 60 },
      { key: "descriptiveNorms", label: "Desc. Norms", angle: 120 },
      { key: "injunctiveNorms", label: "Inj. Norms", angle: 180 },
      { key: "systemReadiness", label: "System", angle: 240 },
      { key: "promptReceptivity", label: "Prompts", angle: 300 }
    ];

    const centerX = 100;
    const centerY = 100;
    const maxRadius = 80;

    const points = dimensions.map(dim => {
      const value = data[dim.key] / 5;
      const angle = (dim.angle - 90) * (Math.PI / 180);
      const radius = value * maxRadius;
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        label: dim.label,
        value: data[dim.key]
      };
    });

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

    return (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Background circles */}
        {[0.2, 0.4, 0.6, 0.8, 1].map(scale => (
          <circle
            key={scale}
            cx={centerX}
            cy={centerY}
            r={maxRadius * scale}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            opacity="0.3"
          />
        ))}
        
        {/* Axis lines */}
        {dimensions.map(dim => {
          const angle = (dim.angle - 90) * (Math.PI / 180);
          const endX = centerX + maxRadius * Math.cos(angle);
          const endY = centerY + maxRadius * Math.sin(angle);
          return (
            <line
              key={dim.key}
              x1={centerX}
              y1={centerY}
              x2={endX}
              y2={endY}
              stroke="hsl(var(--border))"
              strokeWidth="1"
            />
          );
        })}
        
        {/* Data polygon */}
        <path
          d={pathData}
          fill="hsl(var(--primary) / 0.2)"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
        />
        
        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="hsl(var(--primary))"
          >
            <title>{`${p.label}: ${p.value.toFixed(1)}`}</title>
          </circle>
        ))}
        
        {/* Labels */}
        {dimensions.map(dim => {
          const angle = (dim.angle - 90) * (Math.PI / 180);
          const labelRadius = maxRadius + 15;
          const x = centerX + labelRadius * Math.cos(angle);
          const y = centerY + labelRadius * Math.sin(angle);
          return (
            <text
              key={dim.key}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="hsl(var(--foreground))"
              fontSize="8"
              fontWeight="500"
            >
              {dim.label}
            </text>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Behavioral Segments</CardTitle>
          <CardDescription>
            Distinct groups based on clustering analysis of FBM components, norms, and system factors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="empowered" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {segments.map(segment => (
                <TabsTrigger key={segment.id} value={segment.id} className="text-xs">
                  {segment.name.split(' ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {segments.map(segment => (
              <TabsContent key={segment.id} value={segment.id} className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      {segment.name}
                      <Badge variant="outline" className={`bg-${segment.color}/10`}>
                        {segment.percentage}
                      </Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {segment.count} respondents
                    </p>
                    <p className="text-sm text-foreground mt-2">
                      {segment.description}
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Radar Chart */}
                  <div className="aspect-square">
                    <RadarChart data={segment.characteristics} />
                  </div>

                  {/* Characteristics */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-3">Key Characteristics</h4>
                      <div className="space-y-2">
                        {Object.entries(segment.characteristics).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary"
                                  style={{ width: `${(value as number / 5) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold w-8">
                                {(value as number).toFixed(1)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 mt-4">
                  <div className={`p-4 rounded-lg bg-${segment.color}/10 border border-${segment.color}/30`}>
                    <h4 className="font-semibold text-sm mb-2">Key Insights</h4>
                    <ul className="space-y-1">
                      {segment.insights.map((insight, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                          <span className="text-primary">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                    <h4 className="font-semibold text-sm mb-2">Recommendations</h4>
                    <ul className="space-y-1">
                      {segment.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                          <span className="text-primary">→</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SegmentProfiles;
