import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Users, TrendingUp, Activity, Target } from "lucide-react";

const DashboardOverview = () => {
  const stats = [
    {
      title: "Total Respondents",
      value: "1,247",
      change: "+12.3%",
      trend: "up",
      icon: Users,
      gradient: "from-chart-1 to-chart-1/70"
    },
    {
      title: "Contraceptive Users",
      value: "658",
      change: "+8.7%",
      trend: "up",
      icon: Target,
      gradient: "from-quadrant-high-m-high-a to-quadrant-high-m-high-a/70"
    },
    {
      title: "Avg Motivation Score",
      value: "3.8/5.0",
      change: "+0.3",
      trend: "up",
      icon: TrendingUp,
      gradient: "from-chart-3 to-chart-3/70"
    },
    {
      title: "Avg Ability Score",
      value: "3.2/5.0",
      change: "-0.1",
      trend: "down",
      icon: Activity,
      gradient: "from-warning to-warning/70"
    }
  ];

  const insights = [
    {
      quadrant: "High Motivation / High Ability",
      percentage: "42%",
      count: 524,
      description: "Ready to act when prompted - focus on simple reminders and reinforcement",
      color: "border-quadrant-high-m-high-a bg-quadrant-high-m-high-a/5",
      barColor: "bg-quadrant-high-m-high-a"
    },
    {
      quadrant: "High Motivation / Low Ability",
      percentage: "28%",
      count: 349,
      description: "Want to use contraception but face barriers - reduce logistical and financial obstacles",
      color: "border-quadrant-high-m-low-a bg-quadrant-high-m-low-a/5",
      barColor: "bg-quadrant-high-m-low-a"
    },
    {
      quadrant: "Low Motivation / High Ability",
      percentage: "18%",
      count: 224,
      description: "Services accessible but lack motivation - deploy norm-based campaigns",
      color: "border-quadrant-low-m-high-a bg-quadrant-low-m-high-a/5",
      barColor: "bg-quadrant-low-m-high-a"
    },
    {
      quadrant: "Low Motivation / Low Ability",
      percentage: "12%",
      count: 150,
      description: "Need integrated approach with strong prompts and barrier removal",
      color: "border-quadrant-low-m-low-a bg-quadrant-low-m-low-a/5",
      barColor: "bg-quadrant-low-m-low-a"
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{stat.value}</div>
                <div className="flex items-center gap-1.5 text-sm">
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="h-4 w-4 text-quadrant-high-m-high-a" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-destructive" />
                  )}
                  <span className={stat.trend === "up" ? "text-quadrant-high-m-high-a font-semibold" : "text-destructive font-semibold"}>
                    {stat.change}
                  </span>
                  <span className="text-muted-foreground">from last survey</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FBM Quadrant Distribution */}
      <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-6">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-chart-3 shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">FBM Quadrant Distribution</CardTitle>
              <CardDescription className="text-base mt-1">
                Respondent distribution across Fogg Behavior Model quadrants
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {insights.map((insight) => (
              <div
                key={insight.quadrant}
                className={`group p-5 rounded-xl border-2 transition-all hover:shadow-lg hover:scale-[1.02] duration-300 ${insight.color}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-foreground mb-2">{insight.quadrant}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                  <div className="text-right ml-6">
                    <div className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                      {insight.percentage}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 font-medium">{insight.count} users</div>
                  </div>
                </div>
                <div className="w-full bg-muted/50 rounded-full h-3 mt-4 overflow-hidden shadow-inner">
                  <div
                    className={`h-3 rounded-full ${insight.barColor} transition-all duration-500 shadow-sm`}
                    style={{ width: insight.percentage }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Findings */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm hover:shadow-2xl transition-all">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-chart-2 to-chart-2/70 shadow-md">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Social Norms Impact</CardTitle>
                <CardDescription>Influence of norms on behavior</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Descriptive Norms</span>
                <span className="font-bold text-chart-2 text-base">Strong Predictor (β=+1.8)</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Injunctive Norms</span>
                <span className="font-bold text-chart-2 text-base">Moderate Effect</span>
              </div>
              <div className="mt-5 pt-5 border-t">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Positive descriptive norms act as an amplifier, pushing individuals above the action threshold even at moderate ability levels.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm hover:shadow-2xl transition-all">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-warning to-warning/70 shadow-md">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">System Readiness</CardTitle>
                <CardDescription>Health system enablers impact</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Service Reliability</span>
                <span className="font-bold text-quadrant-high-m-high-a text-base">3.6/5.0</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Provider Respect</span>
                <span className="font-bold text-quadrant-high-m-high-a text-base">4.1/5.0</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Access & Infrastructure</span>
                <span className="font-bold text-warning text-base">2.8/5.0</span>
              </div>
              <div className="mt-5 pt-5 border-t">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  System score (β=+1.5) is a strong predictor - reliable services amplify motivation and norms effects.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;