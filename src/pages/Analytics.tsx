import { useState, useEffect } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Lightbulb, 
  MessageSquare,
  PieChart,
  Calendar,
  Filter,
  Download,
  HelpCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { suggestionsDB, userDB } from "@/lib/database";
import {
  ResponsiveContainer,
  LineChart as RLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
  PieChart as RPieChart,
  Pie,
  Cell,
  BarChart as RBarChart,
  Bar,
} from "recharts";

const DEPARTMENTS = [
  "Quality Control",
  "Sales & Client Relations",
  "Logistics",
  "Marketing",
  "Manufacturing",
];

export default function Analytics() {
  const [timeFilter, setTimeFilter] = useState("30days");
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");
  const [teamFilter, setTeamFilter] = useState<string | "all">("all");
  const [analyticsData, setAnalyticsData] = useState({
    totalSuggestions: 0,
    activUsers: 0,
    implementationRate: 0,
    avgResponseTime: "0 days",
    sentimentBreakdown: {
      positive: 0,
      neutral: 0,
      negative: 0
    },
    categoryDistribution: [] as { category: string; count: number; percentage: number }[],
    topContributors: [] as { name: string; department: string; submissions: number; score: number }[]
  });
  const [seriesData, setSeriesData] = useState<{ date: string; submissions: number }[]>([]);
  const [statusFunnel, setStatusFunnel] = useState<{ stage: string; count: number }[]>([]);
  const [topTags, setTopTags] = useState<{ tag: string; count: number }[]>([]);
  const [deptEngagement, setDeptEngagement] = useState<{ department: string; participation: number; submissions: number }[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [timeFilter, categoryFilter, statusFilter, teamFilter]);

  const getFilteredSuggestions = () => {
    const allSuggestions = suggestionsDB.getAll();
    const now = Date.now();
    let daysAgo = 0;
    
    switch (timeFilter) {
      case "7days":
        daysAgo = 7;
        break;
      case "30days":
        daysAgo = 30;
        break;
      case "90days":
        daysAgo = 90;
        break;
      case "1year":
        daysAgo = 365;
        break;
      default:
        daysAgo = 30;
    }
    
    const cutoffDate = now - (daysAgo * 24 * 60 * 60 * 1000);
    let filtered = allSuggestions.filter(s => new Date(s.createdAt).getTime() >= cutoffDate);
    if (categoryFilter !== "all") filtered = filtered.filter(s => s.category === categoryFilter);
    if (statusFilter !== "all") filtered = filtered.filter(s => s.status === statusFilter);
    if (teamFilter !== "all") filtered = filtered.filter(s => s.author.department === teamFilter);
    return filtered;
  };

  const loadAnalytics = () => {
    const suggestions = getFilteredSuggestions();
    const users = userDB.getAllUsers();
    
    const totalSuggestions = suggestions.length;
    const activUsers = users.length;
    const implemented = suggestions.filter(s => s.status === "implemented").length;
    const implementationRate = totalSuggestions > 0 
      ? Math.round((implemented / totalSuggestions) * 100) 
      : 0;

    // Sentiment breakdown
    const sentimentCounts = {
      positive: suggestions.filter(s => s.sentiment === "positive").length,
      neutral: suggestions.filter(s => s.sentiment === "neutral").length,
      negative: suggestions.filter(s => s.sentiment === "negative").length,
    };
    const sentimentBreakdown = {
      positive: totalSuggestions > 0 ? Math.round((sentimentCounts.positive / totalSuggestions) * 100) : 0,
      neutral: totalSuggestions > 0 ? Math.round((sentimentCounts.neutral / totalSuggestions) * 100) : 0,
      negative: totalSuggestions > 0 ? Math.round((sentimentCounts.negative / totalSuggestions) * 100) : 0,
    };

    // Category distribution
    const categoryMap = new Map<string, number>();
    suggestions.forEach(s => {
      categoryMap.set(s.category, (categoryMap.get(s.category) || 0) + 1);
    });
    const categoryDistribution = Array.from(categoryMap.entries())
      .map(([category, count]) => ({
        category,
        count,
        percentage: totalSuggestions > 0 ? Math.round((count / totalSuggestions) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Time series (submissions per day)
    const byDay = new Map<string, number>();
    suggestions.forEach(s => {
      const d = new Date(s.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      byDay.set(key, (byDay.get(key) || 0) + 1);
    });
    const series = Array.from(byDay.entries())
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([date, submissions]) => ({ date, submissions }));

    // Funnel
    const submitted = suggestions.length;
    const reviewed = suggestions.filter(s => ["approved","rejected","implemented","review_pending"].includes(s.status)).length;
    const funnel = [
      { stage: "Submitted", count: submitted },
      { stage: "Reviewed", count: reviewed },
      { stage: "Implemented", count: implemented },
    ];

    // Top tags
    const tagMap = new Map<string, number>();
    suggestions.forEach(s => s.tags?.forEach(t => tagMap.set(t, (tagMap.get(t)||0)+1)));
    const tags = Array.from(tagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a,b) => b.count - a.count)
      .slice(0, 8);

    // Top contributors
    const topContributors = users
      .slice(0, 3)
      .map(user => ({
        name: user.name,
        department: user.department,
        submissions: user.suggestionsCount,
        score: user.implementationsCount > 0 
          ? Math.round((user.implementationsCount / user.suggestionsCount) * 100)
          : 0
      }));

    // Calculate average response time (simplified - using days since creation for pending)
    const pendingSuggestions = suggestions.filter(s => s.status === "pending");
    const avgDays = pendingSuggestions.length > 0
      ? pendingSuggestions.reduce((sum, s) => {
          const days = (Date.now() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / pendingSuggestions.length
      : 0;
    const avgResponseTime = `${avgDays.toFixed(1)} days`;

    // Department engagement (dynamic)
    const byDeptUsers = new Map<string, number>();
    const byDeptSubmitters = new Map<string, Set<string>>();
    const byDeptSubmissions = new Map<string, number>();
    users.forEach(u => {
      byDeptUsers.set(u.department, (byDeptUsers.get(u.department) || 0) + 1);
    });
    suggestions.forEach(s => {
      const dep = s.author.department;
      const submitters = byDeptSubmitters.get(dep) || new Set<string>();
      submitters.add(s.author.email);
      byDeptSubmitters.set(dep, submitters);
      byDeptSubmissions.set(dep, (byDeptSubmissions.get(dep) || 0) + 1);
    });
    const deptEng = DEPARTMENTS.map(dep => {
      const totalUsers = byDeptUsers.get(dep) || 0;
      const uniqueSubmitters = (byDeptSubmitters.get(dep) || new Set()).size;
      const participation = totalUsers > 0 ? Math.round((uniqueSubmitters / totalUsers) * 100) : 0;
      const submissions = byDeptSubmissions.get(dep) || 0;
      return { department: dep, participation, submissions };
    });

    setAnalyticsData({
      totalSuggestions,
      activUsers,
      implementationRate,
      avgResponseTime,
      sentimentBreakdown,
      categoryDistribution,
      topContributors,
    });
    setSeriesData(series);
    setStatusFunnel(funnel);
    setTopTags(tags);
    setDeptEngagement(deptEng);
  };

  // Export helpers
  const downloadCSV = (rows: Record<string, any>[], filename: string) => {
    const keys = rows.length ? Object.keys(rows[0]) : [];
    const csv = [keys.join(","), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadChartPNG = (containerId: string, filename: string) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    const svg = container.querySelector("svg");
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--background");
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataURL; a.download = filename; a.click();
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
  };

  return (
    <div className="page-grid">

      {/* Filters */}
      <Card className="panel bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-white" />
              <div className="w-full">
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="w-full bg-white text-foreground border-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="90days">Last 3 months</SelectItem>
                    <SelectItem value="1year">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as any)}>
                <SelectTrigger className="w-full bg-white text-foreground border-transparent">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {Array.from(new Set(suggestionsDB.getAll().map(s => s.category))).map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-full bg-white text-foreground border-transparent">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {[
                    "pending","review_pending","approved","rejected","implemented"
                  ].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={teamFilter} onValueChange={(v) => setTeamFilter(v as any)}>
                <SelectTrigger className="w-full bg-white text-foreground border-transparent">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {DEPARTMENTS.map(dep => (
                    <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="panel animate-scale-in">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Suggestions</p>
                <p className="text-2xl font-bold text-foreground">{analyticsData.totalSuggestions}</p>
                <Badge variant="secondary" className="mt-2 text-xs bg-primary/10 text-primary">
                  +23% this month
                </Badge>
              </div>
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <Lightbulb className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="panel animate-scale-in" style={{ animationDelay: "100ms" }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-foreground">{analyticsData.activUsers}</p>
                <Badge variant="secondary" className="mt-2 text-xs bg-success/10 text-success">
                  +12% this month
                </Badge>
              </div>
              <div className="rounded-xl bg-success/10 p-3 text-success">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="panel animate-scale-in" style={{ animationDelay: "200ms" }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Implementation Rate</p>
                <p className="text-2xl font-bold text-foreground">{analyticsData.implementationRate}%</p>
                <Badge variant="secondary" className="mt-2 text-xs bg-warning/10 text-warning">
                  +5% this month
                </Badge>
              </div>
              <div className="rounded-xl bg-warning/10 p-3 text-warning">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="panel animate-scale-in" style={{ animationDelay: "300ms" }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold text-foreground">{analyticsData.avgResponseTime}</p>
                <Badge variant="secondary" className="mt-2 text-xs bg-success/10 text-success">
                  -18% this month
                </Badge>
              </div>
              <div className="rounded-xl bg-muted/50 p-3 text-muted-foreground">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Analysis */}
        <Card className="panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Sentiment Analysis
              <span className="ml-1 text-muted-foreground" title="Share of sentiments across suggestions"><HelpCircle className="h-4 w-4" /></span>
              <div className="ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const { updated } = suggestionsDB.recomputeAllSentiments();
                    loadAnalytics();
                    window.alert(`Recomputed sentiments. Updated ${updated} record(s).`);
                  }}
                >
                  Recompute
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-success">Positive</span>
                <span className="text-sm font-semibold text-foreground">
                  {analyticsData.sentimentBreakdown.positive}%
                </span>
              </div>
              <Progress value={analyticsData.sentimentBreakdown.positive} className="h-3" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Neutral</span>
                <span className="text-sm font-semibold text-foreground">
                  {analyticsData.sentimentBreakdown.neutral}%
                </span>
              </div>
              <Progress value={analyticsData.sentimentBreakdown.neutral} className="h-3" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-destructive">Needs Attention</span>
                <span className="text-sm font-semibold text-foreground">
                  {analyticsData.sentimentBreakdown.negative}%
                </span>
              </div>
              <Progress value={analyticsData.sentimentBreakdown.negative} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="panel" id="chart-category">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Category Distribution
              <div className="ml-auto flex items-center gap-2">
                <button
                  aria-label="Export CSV"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => downloadCSV(analyticsData.categoryDistribution, "category_distribution.csv")}
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  aria-label="Export PNG"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => downloadChartPNG("chart-category", "category_distribution.png")}
                >
                  PNG
                </button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.categoryDistribution.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RPieChart>
                    <Pie data={analyticsData.categoryDistribution} dataKey="count" nameKey="category" outerRadius={90}>
                      {analyticsData.categoryDistribution.map((_, i) => (
                        <Cell key={i} fill={`hsl(var(--primary) / ${0.4 + (i%5)*0.12})`} />
                      ))}
                    </Pie>
                    <Legend />
                    <RTooltip />
                  </RPieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No category data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Time Series and Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="panel" id="chart-series">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Submissions over time
              <div className="ml-auto flex items-center gap-2">
                <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => downloadCSV(seriesData, "submissions_over_time.csv")}>
                  <Download className="h-4 w-4" />
                </button>
                <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => downloadChartPNG("chart-series", "submissions_over_time.png")}>PNG</button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RLineChart data={seriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" hide={false} />
                <YAxis allowDecimals={false} />
                <RTooltip />
                <Line type="monotone" dataKey="submissions" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </RLineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="panel" id="chart-funnel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Conversion funnel
              <div className="ml-auto flex items-center gap-2">
                <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => downloadCSV(statusFunnel, "funnel.csv")}> <Download className="h-4 w-4" /> </button>
                <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => downloadChartPNG("chart-funnel", "funnel.png")}>PNG</button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RBarChart data={statusFunnel} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="stage" />
                <RTooltip />
                <Bar dataKey="count" fill="hsl(var(--accent))" radius={[6,6,6,6]} />
              </RBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top tags */}
      <Card className="panel" id="chart-tags">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" /> Top Tags
            <div className="ml-auto flex items-center gap-2">
              <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => downloadCSV(topTags, "top_tags.csv")}> <Download className="h-4 w-4" /> </button>
              <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => downloadChartPNG("chart-tags", "top_tags.png")}>PNG</button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RBarChart data={topTags}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tag" />
              <YAxis allowDecimals={false} />
              <RTooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6,6,0,0]} />
            </RBarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Department Engagement */}
      <Card className="panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Department Engagement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deptEngagement.map((dept, index) => (
              <div 
                key={dept.department} 
                className="p-4 rounded-lg border border-border bg-muted/20 animate-fade-in"
                style={{animationDelay: `${index * 100}ms`}}
              >
                <h4 className="font-semibold text-foreground mb-3">{dept.department}</h4>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Participation</span>
                      <span className="font-medium text-foreground">{dept.participation}%</span>
                    </div>
                    <Progress value={dept.participation} className="h-2" />
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Submissions</span>
                    <span className="font-semibold text-primary">{dept.submissions}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Contributors This Month */}
      <Card className="panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Contributors This Month
          </CardTitle>
        </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.topContributors.length > 0 ? analyticsData.topContributors.map((contributor, index) => (
              <div 
                key={contributor.name}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/20 animate-slide-up"
                style={{animationDelay: `${index * 150}ms`}}
              >
                <div>
                  <h4 className="font-medium text-foreground">{contributor.name}</h4>
                  <p className="text-sm text-muted-foreground">{contributor.department}</p>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground">
                    {contributor.submissions} suggestions
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Quality Score: {contributor.score}%
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-4">No contributor data available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}