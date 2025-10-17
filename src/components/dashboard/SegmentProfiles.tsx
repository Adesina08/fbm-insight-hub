import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Plot from 'react-plotly.js';
import { Users, Lightbulb, ArrowRight } from "lucide-react";

const segments = [
  {
    id: "empowered",
    name: "Empowered Adopters",
    percentage: "42%",
    count: 524,
    color: "quadrant-high-m-high-a",
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
    color: "quadrant-high-m-low-a",
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
    color: "quadrant-low-m-high-a",
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
    color: "quadrant-low-m-low-a",
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
  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-chart-3 shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Behavioral Segments</CardTitle>
              <CardDescription className="text-base mt-1">
                Distinct groups based on clustering analysis of FBM components, norms, and system factors
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="empowered" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-auto p-1.5 bg-muted/50">
              {segments.map(segment => (
                <TabsTrigger 
                  key={segment.id} 
                  value={segment.id} 
                  className="text-sm py-3 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md font-medium"
                >
                  {segment.name.split(' ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {segments.map(segment => {
              const dimensions = Object.keys(segment.characteristics);
              const values = Object.values(segment.characteristics);
              
              return (
                <TabsContent key={segment.id} value={segment.id} className="space-y-6 mt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-3xl font-bold flex items-center gap-3 mb-2">
                        {segment.name}
                        <Badge className={`bg-${segment.color} text-white text-base px-3 py-1`}>
                          {segment.percentage}
                        </Badge>
                      </h3>
                      <p className="text-sm text-muted-foreground font-medium mb-3">
                        {segment.count} respondents
                      </p>
                      <p className="text-base text-foreground max-w-3xl leading-relaxed">
                        {segment.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-8 md:grid-cols-2">
                    {/* Radar Chart */}
                    <div>
                      <Plot
                        data={[{
                          type: 'scatterpolar',
                          r: values,
                          theta: dimensions.map(d => 
                            d.replace(/([A-Z])/g, ' $1')
                              .trim()
                              .split(' ')
                              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(' ')
                          ),
                          fill: 'toself',
                          fillcolor: `var(--${segment.color})`,
                          opacity: 0.3,
                          line: {
                            color: `var(--${segment.color})`,
                            width: 3
                          },
                          marker: {
                            size: 8,
                            color: `var(--${segment.color})`
                          }
                        }]}
                        layout={{
                          polar: {
                            radialaxis: {
                              visible: true,
                              range: [0, 5],
                              tickfont: { size: 10 }
                            },
                            angularaxis: {
                              tickfont: { size: 11, family: 'inherit' }
                            }
                          },
                          showlegend: false,
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          margin: { l: 80, r: 80, t: 40, b: 40 },
                          height: 400
                        }}
                        config={{ responsive: true, displayModeBar: false }}
                        style={{ width: '100%' }}
                      />
                    </div>

                    {/* Characteristics */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-bold text-base mb-4 flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full bg-${segment.color}`} />
                          Key Characteristics
                        </h4>
                        <div className="space-y-3">
                          {Object.entries(segment.characteristics).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                              <span className="text-sm font-medium text-foreground capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <div className="flex items-center gap-3">
                                <div className="w-32 h-2.5 bg-muted rounded-full overflow-hidden shadow-inner">
                                  <div 
                                    className={`h-full bg-${segment.color} transition-all duration-500`}
                                    style={{ width: `${(value as number / 5) * 100}%` }}
                                  />
                                </div>
                                <span className="text-base font-bold w-10 text-right">
                                  {(value as number).toFixed(1)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 mt-6">
                    <div className={`p-6 rounded-xl bg-gradient-to-br from-${segment.color}/10 to-${segment.color}/5 border-2 border-${segment.color}/30 shadow-lg`}>
                      <div className="flex items-center gap-2 mb-4">
                        <Lightbulb className={`w-5 h-5 text-${segment.color}`} />
                        <h4 className="font-bold text-base">Key Insights</h4>
                      </div>
                      <ul className="space-y-2.5">
                        {segment.insights.map((insight, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex gap-3 leading-relaxed">
                            <span className="text-primary font-bold mt-0.5">•</span>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 shadow-lg">
                      <div className="flex items-center gap-2 mb-4">
                        <ArrowRight className="w-5 h-5 text-primary" />
                        <h4 className="font-bold text-base">Recommendations</h4>
                      </div>
                      <ul className="space-y-2.5">
                        {segment.recommendations.map((rec, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex gap-3 leading-relaxed">
                            <span className="text-primary font-bold mt-0.5">→</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SegmentProfiles;