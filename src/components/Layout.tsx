import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Home,
  Plus,
  BarChart3,
  Trophy,
  Settings,
  User,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { userDB, notificationsDB, formatDate } from "@/lib/database";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import companyLogo from "../../logos/Blue-and-White-Modern-Plumbing-Repair-Service-Logo-633-x-155-px-4.png";

const getNavigation = (isAdmin: boolean) => {
  // Remove Submit from main nav to avoid redundancy; keep it as a right-side CTA only
  const baseNav = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { name: "Admin", href: "/admin", icon: User },
  ];
  if (isAdmin) {
    return [
      ...baseNav,
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
    ];
  }
  return baseNav;
};

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = userDB.getCurrentUser();

  useEffect(() => {
    if (currentUser) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 2000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const loadNotifications = () => {
    if (!currentUser) return;
    const userNotifications = notificationsDB.getByUserId(currentUser.email);
    setNotifications(userNotifications);
    setUnreadCount(notificationsDB.getUnreadCount(currentUser.email));
  };

  const handleNotificationClick = (notification: any) => {
    notificationsDB.markAsRead(notification.id);
    loadNotifications();
    if (notification.suggestionId) {
      navigate("/");
      // Scroll to suggestion if needed
      setTimeout(() => {
        const element = document.getElementById(`suggestion-${notification.suggestionId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  };

  const handleMarkAllAsRead = () => {
    if (currentUser) {
      notificationsDB.markAllAsRead(currentUser.email);
      loadNotifications();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("current_user");
    navigate("/login");
  };
  
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-[-220px] h-[400px] blur-3xl radial-highlight opacity-70" />
      <div className="pointer-events-none absolute inset-y-0 right-[-240px] hidden h-[520px] w-[520px] rounded-full bg-primary/10 blur-[180px] md:block" />

      <div className="relative flex min-h-screen flex-col">
            {/* Solid brand strip at the very top */}
            <div className="sticky top-0 z-50 h-1.5 w-full bg-[hsl(var(--primary))]" />
            <header className="sticky top-1.5 z-50 border-b border-white/40 bg-white/90 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/70">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-10">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-3">
                <img
                  src={companyLogo}
                  alt="Company Logo"
                  className="h-10 w-auto object-contain"
                />
                <span className="sr-only">Shriram Industries</span>
              </Link>
            </div>

            <div className="flex flex-1 items-center justify-end gap-3 lg:justify-between">
              {/* Labeled nav with active underline */}
              <nav className="hidden lg:flex items-center gap-2 rounded-full border border-white/40 bg-white/70 p-1 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                {getNavigation(currentUser?.role === "admin").map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-smooth",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground hover:bg-white/80 hover:text-foreground dark:hover:bg-white/10",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                        <span
                          aria-hidden
                          className={cn(
                            "pointer-events-none absolute -bottom-1 left-3 right-3 h-0.5 rounded-full bg-[hsl(var(--primary))] transition-transform",
                            isActive ? "scale-x-100" : "scale-x-0",
                          )}
                        />
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>

              <div className="flex items-center gap-2 lg:hidden">
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen((prev) => !prev)}>
                  {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </Button>
              </div>

              <div className="hidden md:flex items-center gap-3">
                <Button
                  size="sm"
                  asChild
                  className="rounded-full bg-[hsl(var(--accent))] px-5 font-semibold text-[hsl(var(--accent-foreground))] shadow-lg shadow-primary/20 transition-spring hover:scale-[1.02]"
                >
                  <Link to="/submit">
                    Submit idea
                    <Plus className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative rounded-2xl border border-white/30 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-white/10" aria-label="Notifications">
                      <Bell className="h-4 w-4" />
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full border border-white text-[10px]">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 border-none bg-transparent p-0 shadow-none">
                    <div className="panel p-0">
                      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                        <h3 className="text-sm font-semibold tracking-tight">Notifications</h3>
                        {unreadCount > 0 && (
                          <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="rounded-full text-xs text-primary hover:bg-primary/10">
                            Mark all
                          </Button>
                        )}
                      </div>
                      <ScrollArea className="h-96">
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center px-6 py-12 text-center text-muted-foreground">
                            <Bell className="mb-4 h-8 w-8 opacity-40" />
                            <p>No notifications yet</p>
                          </div>
                        ) : (
                          <div>
                            {notifications.map((notification) => (
                              <button
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={cn(
                                  "flex w-full flex-col gap-1 px-5 py-4 text-left transition-smooth hover:bg-white/60 dark:hover:bg-white/5",
                                  !notification.read && "bg-primary/5",
                                )}
                              >
                                <span className="text-sm font-semibold text-foreground">{notification.title}</span>
                                <span className="text-xs text-muted-foreground">{notification.message}</span>
                                <span className="text-[11px] text-muted-foreground">{formatDate(notification.createdAt)}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </PopoverContent>
                </Popover>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 rounded-full border border-white/40 bg-white/70 px-2 py-1 pr-3 text-left shadow-sm backdrop-blur-lg transition-smooth hover:shadow-md dark:border-white/10 dark:bg-white/5">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={currentUser?.avatar} />
                        <AvatarFallback>{currentUser?.name.split(" ").map((n) => n[0]).join("") || "JD"}</AvatarFallback>
                      </Avatar>
                      <div className="hidden sm:block">
                        <p className="text-sm font-semibold text-foreground">{currentUser?.name || "John Doe"}</p>
                        <p className="text-xs text-muted-foreground">{currentUser?.email || "john.doe@company.com"}</p>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 rounded-3xl border-none bg-transparent p-0 shadow-none">
                    <div className="panel">
                      <DropdownMenuLabel>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold leading-none">{currentUser?.name || "User"}</p>
                          <p className="text-xs text-muted-foreground">{currentUser?.email || "email@company.com"}</p>
                          {currentUser?.role === "admin" && (
                            <Badge variant="secondary" className="mt-2 w-fit rounded-full border border-white/40 bg-white/70 text-[11px] uppercase tracking-wide">
                              Admin
                            </Badge>
                          )}
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/settings")} className="rounded-2xl text-sm font-medium">
                        <Settings className="mr-2 h-4 w-4" />
                        Preferences
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="rounded-2xl text-sm font-medium text-destructive focus:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="border-t border-white/30 bg-white/80 px-4 pb-4 pt-2 backdrop-blur dark:border-white/5 dark:bg-slate-950/80 lg:hidden">
              <nav className="grid gap-2">
                {getNavigation(currentUser?.role === "admin").map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-smooth",
                        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-white/70 hover:text-foreground",
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </NavLink>
                ))}
                <Button asChild className="mt-2 w-full rounded-2xl bg-foreground text-background">
                  <Link to="/submit">
                    Submit idea
                    <Plus className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </nav>
            </div>
          )}
        </header>

        <main className="relative flex-1">
          <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}