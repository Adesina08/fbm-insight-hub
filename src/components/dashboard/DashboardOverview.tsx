import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Users, TrendingUp, Activity, Target } from "lucide-react";

const DashboardOverview = () => {
  const stats = [
    {
      title: "Total Respondents",
      value: "1,247",
      change: "+12.3%",
      trend: "up",
      icon: Users,
      color: "text-chart-1"
    },
    {
      title: "Contraceptive Users",
      value: "658",
      change: "+8.7%",
      trend: "up",
      icon: Target,
      color: "text-success"
    },
    {
      title: "Avg Motivation Score",
      value: "3.8",
      change: "+0.3",
      trend: "up",
      icon: TrendingUp,
      color: "text-chart-2"
    },
    {
      title: "Avg Ability Score",
      value: "3.2",
      change: "-0.1",
      trend: "down",
      icon: Activity,
      color: "text-warning"
    }
  ];

  const insights = [
    {
      quadrant: "High Motivation / High Ability",
      percentage: "42%",
      count: 524,
      description: "Ready to act when prompted - focus on simple reminders and reinforcement",
      color: "bg-success/10 border-success/30"
    },
    {
      quadrant: "High Motivation / Low Ability",
      percentage: "28%",
      count: 349,
      description: "Want to use contraception but face barriers - reduce logistical and financial obstacles",
      color: "bg-chart-2/10 border-chart-2/30"
    },
    {
      quadrant: "Low Motivation / High Ability",
      percentage: "18%",
      count: 224,
      description: "Services accessible but lack motivation - deploy norm-based campaigns",
      color: "bg-warning/10 border-warning/30"
    },
    {
      quadrant: "Low Motivation / Low Ability",
      percentage: "12%",
      count: 150,
      description: "Need integrated approach with strong prompts and barrier removal",
      color: "bg-destructive/10 border-destructive/30"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className={`text-xs flex items-center gap-1 mt-1 ${
                  stat.trend === "up" ? "text-success" : "text-destructive"
                }`}>
                  {stat.trend === "up" ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FBM Quadrant Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>FBM Quadrant Distribution</CardTitle>
          <CardDescription>
            Respondent distribution across Fogg Behavior Model quadrants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.map((insight) => (
              <div
                key={insight.quadrant}
                className={`p-4 rounded-lg border-2 transition-all hover:shadow-sm ${insight.color}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-foreground">{insight.quadrant}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {insight.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground">{insight.percentage}</div>
                    <div className="text-xs text-muted-foreground">{insight.count} respondents</div>
                  </div>
                </div>
                <div className="w-full bg-muted/50 rounded-full h-2 mt-3">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: insight.percentage }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Findings */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Social Norms Impact</CardTitle>
            <CardDescription>Influence of norms on behavior</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Descriptive Norms</span>
                <span className="font-semibold text-chart-2">Strong Predictor (β=+1.8)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Injunctive Norms</span>
                <span className="font-semibold text-chart-2">Moderate Effect</span>
              </div>
              <p className="text-sm text-muted-foreground mt-4 pt-4 border-t">
                Positive descriptive norms act as an amplifier, pushing individuals above the action threshold even at moderate ability levels.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Readiness</CardTitle>
            <CardDescription>Health system enablers impact</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Service Reliability</span>
                <span className="font-semibold text-success">3.6/5.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Provider Respect</span>
                <span className="font-semibold text-success">4.1/5.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Access & Infrastructure</span>
                <span className="font-semibold text-warning">2.8/5.0</span>
              </div>
              <p className="text-sm text-muted-foreground mt-4 pt-4 border-t">
                System score (β=+1.5) is a strong predictor - reliable services amplify motivation and norms effects.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
