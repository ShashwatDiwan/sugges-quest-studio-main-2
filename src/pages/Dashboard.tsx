import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  Users,
  Lightbulb,
  Award,
  Filter,
  Search,
  Sparkles,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import SuggestionCard from "@/components/SuggestionCard";
import { suggestionsDB, userDB, formatDate, Suggestion } from "@/lib/database";

const getStatsCards = (statsData: { totalSuggestions: number; activeContributors: number; implementationRate: number; pointsEarned: number }) => [
  {
    title: "Total Suggestions",
    value: statsData.totalSuggestions.toString(),
    change: "+0%",
    icon: Lightbulb,
    color: "text-primary"
  },
  {
    title: "Active Contributors",
    value: statsData.activeContributors.toString(),
    change: "+0%",
    icon: Users,
    color: "text-success"
  },
  {
    title: "Implementation Rate",
    value: `${statsData.implementationRate}%`,
    change: "+0%",
    icon: TrendingUp,
    color: "text-warning"
  },
  {
    title: "Points Earned",
    value: statsData.pointsEarned.toLocaleString(),
    change: "+0%",
    icon: Award,
    color: "text-gold"
  }
];

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [stats, setStats] = useState({
    totalSuggestions: 0,
    activeContributors: 0,
    implementationRate: 0,
    pointsEarned: 0,
  });

  useEffect(() => {
    loadSuggestions();
    loadStats();
    
    // Refresh every 2 seconds to get latest data
    const interval = setInterval(() => {
      loadSuggestions();
      loadStats();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const loadSuggestions = () => {
    const allSuggestions = suggestionsDB.getAll();
    setSuggestions(allSuggestions);
  };

  const loadStats = () => {
    const allSuggestions = suggestionsDB.getAll();
    const users = userDB.getAllUsers();
    const currentUser = userDB.getCurrentUser();
    
    const implemented = allSuggestions.filter(s => s.status === "implemented").length;
    const implementationRate = allSuggestions.length > 0 
      ? Math.round((implemented / allSuggestions.length) * 100) 
      : 0;

    setStats({
      totalSuggestions: allSuggestions.length,
      activeContributors: users.length,
      implementationRate,
      pointsEarned: currentUser.points,
    });
  };

  const filteredSuggestions = suggestions
    .filter(suggestion => {
      const matchesSearch = suggestion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           suggestion.problem.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           suggestion.solution.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || suggestion.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || suggestion.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === "popular") {
        return b.votes - a.votes;
      } else if (sortBy === "commented") {
        return b.comments - a.comments;
      }
      return 0;
    });

  const currentUser = userDB.getCurrentUser();

  return (
    <div className="page-grid">
      {/* Filters at top */}
      <Card className="panel bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
            <Filter className="h-4 w-4 text-white" />
            Filter &amp; search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />
              <Input
                placeholder="Search by title, problem, or solution"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-2xl border-transparent bg-white pl-10 text-foreground placeholder:text-muted-foreground shadow-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="rounded-2xl border-transparent bg-white text-foreground shadow-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="implemented">Implemented</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="rounded-2xl border-transparent bg-white text-foreground shadow-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Process Improvement">Process Improvement</SelectItem>
                <SelectItem value="Customer Experience">Customer Experience</SelectItem>
                <SelectItem value="Environment">Environment</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="rounded-2xl border-transparent bg-white text-foreground shadow-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most recent</SelectItem>
                <SelectItem value="popular">Most popular</SelectItem>
                <SelectItem value="commented">Most commented</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {getStatsCards(stats).map((stat) => (
          <Card key={stat.title} className="rounded-2xl transition-smooth hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">{stat.title}</p>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div className={`rounded-xl bg-primary/10 p-2 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.5fr,0.9fr]">
        {/* Left: Recent submissions compact grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Pipeline</p>
              <h2 className="text-xl font-semibold tracking-tight">Recent submissions</h2>
            </div>
            <Badge variant="secondary" className="rounded-full border-0 bg-primary/10 text-primary">
              {filteredSuggestions.length} live
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filteredSuggestions.map((s) => (
              <Card key={s.id} className="rounded-2xl transition-smooth hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="h-6 rounded-full text-xs">
                          {s.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(s.createdAt)}</span>
                      </div>
                      <h3 className="mt-1 line-clamp-2 text-sm font-semibold">{s.title}</h3>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.problem}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="rounded-full text-[11px]">
                        {s.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>{s.author?.department}</span>
                      <span>•</span>
                      <span>{s.votes} votes</span>
                      <span>•</span>
                      <span>{s.comments} comments</span>
                    </div>
                    <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs">
                      <Link to="/submit">Improve</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right widgets */}
        <div className="space-y-6">
          {/* Top Categories */}
          <Card className="panel">
            <CardHeader>
              <CardTitle className="text-base">Top categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from(
                filteredSuggestions.reduce((m, s) => m.set(s.category, (m.get(s.category) || 0) + 1), new Map<string, number>())
              )
                .sort((a,b) => b[1]-a[1])
                .slice(0,5)
                .map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between rounded-xl border bg-white/60 px-3 py-2 text-sm transition-smooth hover:-translate-y-0.5 hover:shadow-sm dark:bg-white/5">
                    <span className="font-medium">{cat}</span>
                    <Badge variant="secondary" className="rounded-full">{count}</Badge>
                  </div>
                ))}
              {filteredSuggestions.length === 0 && (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </CardContent>
          </Card>

          
        </div>
      </section>

      {/* Filters were moved to the top */}

      {filteredSuggestions.length === 0 && (
        <Card className="panel text-center">
          <CardContent className="space-y-4 py-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-white/50">
              <Lightbulb className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">No matching suggestions</h3>
            <p className="text-muted-foreground">Adjust your filters or be the first to propose a new idea.</p>
            <Button asChild className="rounded-2xl">
              <Link to="/submit">
                Share an idea
                <Plus className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}