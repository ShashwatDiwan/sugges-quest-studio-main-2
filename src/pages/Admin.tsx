import { useState, useEffect } from "react";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Filter,
  Download,
  ShieldCheck,
  UserX,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { suggestionsDB, userDB, notificationsDB, formatDate, Suggestion } from "@/lib/database";

import SuggestionCard from "@/components/SuggestionCard";

const statusOptions = [
  { value: "review_pending", label: "Review Pending", icon: Clock, color: "pending" },
  { value: "approved", label: "Approved", icon: CheckCircle, color: "approved" },
  { value: "implemented", label: "Implemented", icon: CheckCircle, color: "success" },
  { value: "rejected", label: "Rejected", icon: XCircle, color: "rejected" },
];

export default function Admin() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [selectedStatuses, setSelectedStatuses] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const currentUser = userDB.getCurrentUser();

  useEffect(() => {
    loadSuggestions();
    const interval = setInterval(loadSuggestions, 2000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const loadSuggestions = () => {
    const allSuggestions = suggestionsDB.getAll();
    setSuggestions(allSuggestions);
  };

  const deleteSuggestion = (id: string) => {
    if (!window.confirm("Delete this suggestion? This cannot be undone.")) return;
    suggestionsDB.delete(id);
    loadSuggestions();
  };

  const deleteAllSuggestions = () => {
    if (!window.confirm("Delete ALL suggestions and reset leaderboard stats? This cannot be undone.")) return;
    const removed = suggestionsDB.deleteAll();
    userDB.resetStats();
    loadSuggestions();
    window.alert(`Deleted ${removed} suggestion(s) and reset user stats.`);
  };

  const clearAllUsers = () => {
    if (!window.confirm("Delete ALL users and sign out current session? This cannot be undone.")) return;
    const removed = userDB.deleteAll();
    window.alert(`Deleted ${removed} user(s). You may need to sign up again.`);
  };

  // Danger zone simplified per request


  const handleStatusChange = (suggestionId: string) => {
    const suggestion = suggestionsDB.getById(suggestionId);
    if (!suggestion) return;

    const newStatus = selectedStatuses[suggestionId] || "review_pending";
    const remarkText = remarks[suggestionId] || "";

    const oldStatus = suggestion.status;
    suggestionsDB.update(suggestionId, {
      status: newStatus as any,
      adminRemark: remarkText || undefined,
    });

    // Update user points based on status
    const authorEmail = suggestion.author.email;
    
    // Get stored users
    const storedUsers = JSON.parse(localStorage.getItem("users_db") || "[]");
    const userIndex = storedUsers.findIndex((u: any) => u.email === authorEmail);
    
    if (userIndex !== -1) {
      let pointsChange = 0;
      
      // Remove points from old status
      if (oldStatus === "implemented") pointsChange -= 60;
      else if (oldStatus === "approved") pointsChange -= 30;
      
      // Add points for new status
      if (newStatus === "implemented") pointsChange += 60;
      else if (newStatus === "approved") pointsChange += 30;
      // rejected gives 0 points
      
      storedUsers[userIndex].points = Math.max(0, (storedUsers[userIndex].points || 0) + pointsChange);
      localStorage.setItem("users_db", JSON.stringify(storedUsers));
    }

    // Create notification for suggestion author
    notificationsDB.create({
      userId: suggestion.author.email,
      type: "status_change",
      title: "Status Updated",
      message: `Your suggestion "${suggestion.title}" status has been changed to ${newStatus.replace("_", " ")}`,
      suggestionId: suggestionId,
    });

    // Clear remark and status for this suggestion
    setRemarks(prev => {
      const newRemarks = { ...prev };
      delete newRemarks[suggestionId];
      return newRemarks;
    });
    setSelectedStatuses(prev => {
      const newStatuses = { ...prev };
      delete newStatuses[suggestionId];
      return newStatuses;
    });
    
    loadSuggestions();
  };

  const filteredSuggestions = suggestions
    .filter(suggestion => {
      const matchesSearch = suggestion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           suggestion.problem.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || suggestion.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Stats for right KPIs
  const now = new Date();
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const reviewPendingCount = suggestions.filter(s => s.status === "review_pending").length;
  const approvedThisWeek = suggestions.filter(s => s.status === "approved" && new Date(s.createdAt) >= startOfWeek).length;
  const implementedThisMonth = suggestions.filter(s => s.status === "implemented" && new Date(s.createdAt) >= startOfMonth).length;
  const avgPendingAgeDays = (() => {
    const pendings = suggestions.filter(s => s.status === "review_pending" || s.status === "pending");
    if (pendings.length === 0) return 0;
    const sum = pendings.reduce((acc, s) => acc + ((now.getTime() - new Date(s.createdAt).getTime()) / (1000*60*60*24)), 0);
    return Math.round(sum / pendings.length);
  })();

  const toggleAllVisible = (checked: boolean) => {
    const upd: Record<string, boolean> = {};
    filteredSuggestions.forEach(s => upd[s.id] = checked);
    setSelectedIds(upd);
  };

  const bulkUpdate = (newStatus: Suggestion["status"]) => {
    const ids = Object.keys(selectedIds).filter(id => selectedIds[id]);
    ids.forEach(id => {
      const suggestion = suggestionsDB.getById(id);
      if (!suggestion) return;
      const oldStatus = suggestion.status;
      suggestionsDB.update(id, { status: newStatus });
      // adjust points similar to single update
      const storedUsers = JSON.parse(localStorage.getItem("users_db") || "[]");
      const idx = storedUsers.findIndex((u: any) => u.email === suggestion.author.email);
      if (idx !== -1) {
        let delta = 0;
        if (oldStatus === "implemented") delta -= 60; else if (oldStatus === "approved") delta -= 30;
        if (newStatus === "implemented") delta += 60; else if (newStatus === "approved") delta += 30;
        storedUsers[idx].points = Math.max(0, (storedUsers[idx].points || 0) + delta);
        localStorage.setItem("users_db", JSON.stringify(storedUsers));
      }
      notificationsDB.create({
        userId: suggestion.author.email,
        type: "status_change",
        title: "Status Updated",
        message: `Your suggestion "${suggestion.title}" status has been changed to ${newStatus.replace("_", " ")}`,
        suggestionId: id,
      });
    });
    setSelectedIds({});
    loadSuggestions();
  };

  const exportCSV = () => {
    const rows = filteredSuggestions.map(s => ({
      id: s.id,
      title: s.title,
      status: s.status,
      category: s.category,
      author: s.author?.name,
      department: s.author?.department,
      createdAt: formatDate(s.createdAt),
      votes: s.votes,
      comments: s.comments,
    }));
    const keys = rows.length ? Object.keys(rows[0]) : [];
    const csv = [keys.join(","), ...rows.map(r => keys.map(k => JSON.stringify((r as any)[k] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "admin_review_queue.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const setUserRole = (email: string, role: "admin" | "user") => {
    const storedUsers = JSON.parse(localStorage.getItem("users_db") || "[]");
    const idx = storedUsers.findIndex((u: any) => u.email === email);
    if (idx !== -1) {
      storedUsers[idx].role = role;
      localStorage.setItem("users_db", JSON.stringify(storedUsers));
    }
  };

  // Admin page now visible to all users (no role gate)

  return (
    <div className="page-grid">

      {/* Filters + Bulk actions (blue) */}
      <Card className="panel bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Filter className="h-5 w-5 text-white" />
            Filter & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white" />
              <Input
                placeholder="Search suggestions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 rounded-2xl bg-white text-foreground placeholder:text-muted-foreground border-transparent"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-52 rounded-2xl bg-white text-foreground border-transparent">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="review_pending">Review Pending</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="implemented">Implemented</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm opacity-90">
              <input type="checkbox" className="mr-2" onChange={(e)=>toggleAllVisible(e.target.checked)} />
              Select all
            </label>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={()=>bulkUpdate("approved")} disabled={!Object.values(selectedIds).some(Boolean)} className="bg-white text-foreground hover:bg-green-100">
                Approve
              </Button>
              <Button variant="outline" size="sm" onClick={()=>bulkUpdate("rejected")} disabled={!Object.values(selectedIds).some(Boolean)} className="bg-white text-foreground hover:bg-red-100">
                Reject
              </Button>
              <Button size="sm" onClick={()=>bulkUpdate("implemented")} disabled={!Object.values(selectedIds).some(Boolean)} className="bg-white text-foreground hover:bg-yellow-100">
                Implemented
              </Button>
              <Button variant="ghost" size="sm" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-1" /> Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-column: left list, right KPIs */}
      <section className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Suggestions to Review</h2>
            <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary text-sm">
              {filteredSuggestions.length} live
            </Badge>
          </div>

          <div className="grid gap-3">
            {filteredSuggestions.map((suggestion) => (
              <Card key={suggestion.id} className="rounded-2xl transition-smooth hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <label className="mt-1">
                      <input type="checkbox" checked={!!selectedIds[suggestion.id]} onChange={(e)=>setSelectedIds(prev=>({ ...prev, [suggestion.id]: e.target.checked }))} />
                    </label>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-foreground mb-1 line-clamp-1">{suggestion.title}</h3>
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <Badge variant="outline">{suggestion.category}</Badge>
                        <Badge className={`${
                          suggestion.status === "implemented" ? "bg-success/10 text-success" :
                          suggestion.status === "approved" ? "bg-approved/10 text-approved" :
                          suggestion.status === "rejected" ? "bg-rejected/10 text-rejected" :
                          suggestion.status === "review_pending" ? "bg-warning/10 text-warning" :
                          "bg-pending/10 text-pending"
                        }`}>
                          {suggestion.status.replace("_", " ").toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(suggestion.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={()=>deleteSuggestion(suggestion.id)} title="Delete suggestion">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="space-y-2">
                    <div className="rounded-xl border bg-white/70 p-3 dark:bg-white/5">
                      <h4 className="text-sm font-medium text-foreground mb-1">Problem</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{suggestion.problem}</p>
                    </div>
                    <div className="rounded-xl border bg-white/70 p-3 dark:bg-white/5">
                      <h4 className="text-sm font-medium text-foreground mb-1">Solution</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{suggestion.solution}</p>
                    </div>
                  </div>

                  {suggestion.adminRemark && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <h4 className="text-sm font-medium text-foreground mb-1">Admin Remark</h4>
                      <p className="text-sm text-muted-foreground">{suggestion.adminRemark}</p>
                    </div>
                  )}

                  <div className="pt-3 border-t border-border">
                    <div className="grid gap-3 md:grid-cols-[220px,1fr,140px] items-end">
                      <div>
                        <Label className="text-xs">Update Status</Label>
                        <Select 
                          value={selectedStatuses[suggestion.id] || suggestion.status} 
                          onValueChange={(value) => setSelectedStatuses(prev => ({ ...prev, [suggestion.id]: value }))}
                        >
                          <SelectTrigger className="mt-1 h-10 rounded-2xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <option.icon className="h-4 w-4" />
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor={`remark-${suggestion.id}`} className="text-xs">Remark (Optional)</Label>
                        <Textarea
                          id={`remark-${suggestion.id}`}
                          placeholder="Add a remark or feedback..."
                          value={remarks[suggestion.id] || ""}
                          onChange={(e) => setRemarks(prev => ({ ...prev, [suggestion.id]: e.target.value }))}
                          className="mt-1 h-10 min-h-10 resize-none"
                        />
                      </div>

                      <div className="flex items-end">
                        <Button onClick={() => handleStatusChange(suggestion.id)} className="h-10 w-full rounded-2xl">
                          Update
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredSuggestions.length === 0 && (
            <Card className="panel text-center py-12">
              <CardContent>
                <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No suggestions found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          <Card className="panel">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">At a glance</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 pt-0">
              <div className="rounded-2xl border bg-white/70 p-3 shadow-sm transition-smooth hover:-translate-y-0.5 hover:shadow-md dark:bg-white/5">
                <p className="text-xs text-muted-foreground">Review pending</p>
                <p className="text-2xl font-bold text-foreground">{reviewPendingCount}</p>
              </div>
              <div className="rounded-2xl border bg-white/70 p-3 shadow-sm transition-smooth hover:-translate-y-0.5 hover:shadow-md dark:bg-white/5">
                <p className="text-xs text-muted-foreground">Approved this week</p>
                <p className="text-2xl font-bold text-foreground">{approvedThisWeek}</p>
              </div>
              <div className="rounded-2xl border bg-white/70 p-3 shadow-sm transition-smooth hover:-translate-y-0.5 hover:shadow-md dark:bg-white/5">
                <p className="text-xs text-muted-foreground">Implemented this month</p>
                <p className="text-2xl font-bold text-foreground">{implementedThisMonth}</p>
              </div>
              <div className="rounded-2xl border bg-white/70 p-3 shadow-sm transition-smooth hover:-translate-y-0.5 hover:shadow-md dark:bg-white/5">
                <p className="text-xs text-muted-foreground">Avg pending age</p>
                <p className="text-2xl font-bold text-foreground">{avgPendingAgeDays}d</p>
              </div>
            </CardContent>
          </Card>

          <Card className="panel">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent approvals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm pt-0">
              {suggestions.filter(s=>s.status==="approved").slice(0,6).map(s => (
                <div key={s.id} className="flex items-center justify-between rounded-xl bg-white/60 px-3 py-2 dark:bg-white/5">
                  <span className="line-clamp-1">{s.title}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(s.createdAt)}</span>
                </div>
              ))}
              {suggestions.filter(s=>s.status==="approved").length === 0 && (
                <p className="text-sm text-muted-foreground">No approvals yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="panel border-destructive/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">Delete all suggestions and reset leaderboard stats</div>
                <Button variant="destructive" onClick={deleteAllSuggestions}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Suggestions
                </Button>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">Delete all users (will sign out)</div>
                <Button variant="destructive" onClick={clearAllUsers}>
                  <UserX className="h-4 w-4 mr-2" /> Delete Users
                </Button>
              </div>
            </CardContent>
          </Card>

          
        </div>
      </section>
    </div>
  );
}

