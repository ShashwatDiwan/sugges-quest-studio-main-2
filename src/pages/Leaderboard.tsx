import { useState, useEffect } from "react";
import { Trophy, Medal, Star, TrendingUp, Users, Target, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { userDB, suggestionsDB } from "@/lib/database";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Contributor {
  id: string;
  name: string;
  avatar?: string;
  department: string;
  points: number;
  suggestions: number;
  implementations: number;
  rank: number;
  badges: string[];
}
const getBadges = (user: { points: number; suggestions: number; implementations: number }): string[] => {
  const badges: string[] = [];
  if (user.implementations >= 5) badges.push("Innovation Expert");
  if (user.suggestions >= 10) badges.push("Top Contributor");
  if (user.points >= 1000) badges.push("Problem Solver");
  if (user.implementations >= 3) badges.push("Efficiency Master");
  if (user.suggestions >= 5) badges.push("Team Player");
  return badges;
};

const getDepartmentStats = (users: ReturnType<typeof userDB.getAllUsers>) => {
  const deptMap = new Map<string, { points: number; contributors: number }>();
  
  users.forEach(user => {
    const existing = deptMap.get(user.department) || { points: 0, contributors: 0 };
    deptMap.set(user.department, {
      points: existing.points + user.points,
      contributors: existing.contributors + 1
    });
  });

  const colors = ["text-primary", "text-success", "text-warning", "text-gold", "text-purple-500"];
  return Array.from(deptMap.entries())
    .map(([department, data], index) => ({
      department,
      points: data.points,
      contributors: data.contributors,
      color: colors[index % colors.length]
    }))
    .sort((a, b) => b.points - a.points);
};

function getRankIcon(rank: number) {
  return (
    <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
      {rank}
    </div>
  );
}

function getRankBadge(rank: number) {
  switch (rank) {
    case 1:
      return <Badge className="bg-gold/10 text-gold border-gold/20">🥇 Champion</Badge>;
    case 2:
      return <Badge className="bg-silver/10 text-silver border-silver/20">🥈 Runner-up</Badge>;
    case 3:
      return <Badge className="bg-bronze/10 text-bronze border-bronze/20">🥉 Third Place</Badge>;
    default:
      return <Badge variant="outline">#{rank}</Badge>;
  }
}

export default function Leaderboard() {
  const [topContributors, setTopContributors] = useState<Contributor[]>([]);
  const [departmentStats, setDepartmentStats] = useState<ReturnType<typeof getDepartmentStats>>([]);
  const [achievements, setAchievements] = useState([
    {
      title: "First Suggestion",
      description: "Submit your first idea",
      icon: Star,
      color: "text-gold",
      progress: 0
    },
    {
      title: "Team Player",
      description: "Get 10 votes on your suggestions",
      icon: Users,
      color: "text-success", 
      progress: 0
    },
    {
      title: "Innovation Champion",
      description: "Have 5 suggestions implemented",
      icon: Target,
      color: "text-primary",
      progress: 0
    }
  ]);
  const [sortBy, setSortBy] = useState<"rank" | "ideas" | "implemented" | "points" | "name">("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [deptFilter, setDeptFilter] = useState<string | "all">("all");
  const [q, setQ] = useState("");

  const toggleSort = (key: "rank" | "ideas" | "implemented" | "points" | "name") => {
    if (sortBy === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
  };

  useEffect(() => {
    loadLeaderboard();
    const interval = setInterval(loadLeaderboard, 2000);
    return () => clearInterval(interval);
  }, []);

  // Recompute immediately when filters or sorting change
  useEffect(() => {
    loadLeaderboard();
  }, [sortBy, sortDir, deptFilter, q]);

  const loadLeaderboard = () => {
    const users = userDB.getAllUsers();
    const currentUser = userDB.getCurrentUser();
    const suggestions = suggestionsDB.getAll();
    
    // Get user's total votes received
    const userSuggestions = suggestions.filter(s => s.author.email === currentUser.email);
    const totalVotes = userSuggestions.reduce((sum, s) => sum + s.votes, 0);

    // Calculate achievements
    const newAchievements = achievements.map(achievement => {
      if (achievement.title === "First Suggestion") {
        return { ...achievement, progress: currentUser.suggestionsCount > 0 ? 100 : 0 };
      } else if (achievement.title === "Team Player") {
        return { ...achievement, progress: Math.min((totalVotes / 10) * 100, 100) };
      } else if (achievement.title === "Innovation Champion") {
        return { ...achievement, progress: Math.min((currentUser.implementationsCount / 5) * 100, 100) };
      }
      return achievement;
    });
    setAchievements(newAchievements);

    // Create contributors list
    let contributors: Contributor[] = users.map((user, index) => ({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      department: user.department,
      points: user.points,
      suggestions: user.suggestionsCount,
      implementations: user.implementationsCount,
      rank: index + 1,
      badges: getBadges({
        points: user.points,
        suggestions: user.suggestionsCount,
        implementations: user.implementationsCount
      })
    }));

    // Filter
    if (deptFilter !== "all") contributors = contributors.filter(c => c.department === deptFilter);
    if (q.trim()) {
      const qq = q.toLowerCase();
      contributors = contributors.filter(c => c.name.toLowerCase().includes(qq));
    }
    // Sorting
    contributors = contributors.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "rank") return dir * (a.rank - b.rank);
      if (sortBy === "ideas") return dir * (a.suggestions - b.suggestions);
      if (sortBy === "implemented") return dir * (a.implementations - b.implementations);
      if (sortBy === "points") return dir * (a.points - b.points);
      if (sortBy === "name") return dir * a.name.localeCompare(b.name);
      return 0;
    });

    setTopContributors(contributors);
    setDepartmentStats(getDepartmentStats(users));
  };

  const maxPoints = departmentStats.length > 0 ? Math.max(...departmentStats.map(d => d.points)) : 1;

  return (
    <div className="page-grid">
      {/* Simplified — removed page heading for a cleaner look */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Leaderboard */}
        <div className="lg:col-span-2">
          <Card className="panel">
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="relative sm:col-span-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search user" className="pl-9" />
                </div>
                <Select value={deptFilter} onValueChange={(v)=>setDeptFilter(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All departments</SelectItem>
                    {Array.from(new Set(userDB.getAllUsers().map(u=>u.department))).map(dep=> (
                      <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary/5">
                      <TableHead className="w-[60px] cursor-pointer" onClick={()=>toggleSort("rank")}>Rank</TableHead>
                      <TableHead className="cursor-pointer" onClick={()=>toggleSort("name")}>User</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="cursor-pointer" onClick={()=>toggleSort("ideas")}>Ideas</TableHead>
                      <TableHead className="cursor-pointer" onClick={()=>toggleSort("implemented")}>Implemented</TableHead>
                      <TableHead className="cursor-pointer" onClick={()=>toggleSort("points")}>Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topContributors.map((c, idx) => (
                      <TableRow key={c.id} className="transition-smooth odd:bg-white/60 hover:bg-primary/5 hover:shadow-sm dark:odd:bg-white/5">
                        <TableCell>{getRankIcon(c.rank)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={c.avatar} />
                              <AvatarFallback>{c.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate text-foreground">{c.name}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">{c.department}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{c.department}</TableCell>
                        <TableCell>{c.suggestions}</TableCell>
                        <TableCell className="text-success font-medium">{c.implementations}</TableCell>
                        <TableCell className="font-semibold">{c.points.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {topContributors.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">No contributors match the filters</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Department Engagement */}
          <Card className="panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Department Rankings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departmentStats.length > 0 ? departmentStats.map((dept, index) => (
                  <div key={dept.department} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-foreground">{dept.department}</span>
                      <span className={`text-sm font-semibold ${dept.color}`}>
                        {dept.points.toLocaleString()} pts
                      </span>
                    </div>
                    <Progress value={(dept.points / maxPoints) * 100} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {dept.contributors} contributors
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No department data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Your Achievements */}
          <Card className="panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {achievements.map((achievement, index) => (
                  <div key={achievement.title} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-muted/50 ${achievement.color}`}>
                        <achievement.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-foreground text-sm">{achievement.title}</div>
                        <div className="text-xs text-muted-foreground">{achievement.description}</div>
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {achievement.progress}%
                      </div>
                    </div>
                    <Progress value={achievement.progress} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}