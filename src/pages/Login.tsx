import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, User, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { userDB } from "@/lib/database";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = userDB.login(email, password);
      if (user) {
        toast({
          title: "Login Successful",
          description: `Welcome back, ${user.name}!`,
        });
        navigate("/");
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid email or password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-10">
      <div className="absolute inset-0 bg-app-grid opacity-50" />
      <div className="pointer-events-none absolute inset-x-0 top-[-220px] h-[420px] blur-3xl radial-highlight opacity-70" />
      <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
        <span className="pill">Access portal</span>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Shriram Industries</h1>
          <p className="text-muted-foreground">
            Align every contributor around the same workflow—from insight to implementation.
          </p>
        </div>
      </div>
      <div className="relative mt-8 flex items-center justify-center">
        <Card className="w-full max-w-md panel">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl primary-gradient shadow-glow">
              <LogIn className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="user" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="user">User</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>
            <TabsContent value="user" className="space-y-4 mt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 rounded-2xl border-white/40 bg-white/70 focus-visible:ring-primary dark:border-white/10 dark:bg-white/10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 rounded-2xl border-white/40 bg-white/70 focus-visible:ring-primary dark:border-white/10 dark:bg-white/10"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full primary-gradient" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                  <LogIn className="w-4 h-4 ml-2" />
                </Button>
              </form>
              <div className="text-center text-sm text-muted-foreground">
                <p>Don't have an account? <Link to="/signup" className="text-primary hover:underline">Sign up</Link></p>
                <p className="mt-2 text-xs">Demo: user123@company.com / user123</p>
              </div>
            </TabsContent>
            <TabsContent value="admin" className="space-y-4 mt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="admin@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 rounded-2xl border-white/40 bg-white/70 focus-visible:ring-primary dark:border-white/10 dark:bg-white/10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="admin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 rounded-2xl border-white/40 bg-white/70 focus-visible:ring-primary dark:border-white/10 dark:bg-white/10"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full primary-gradient" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In as Admin"}
                  <LogIn className="w-4 h-4 ml-2" />
                </Button>
              </form>
              <div className="text-center text-sm text-muted-foreground">
                <p>Don't have an account? <Link to="/signup?role=admin" className="text-primary hover:underline">Sign up</Link></p>
                <p className="mt-2 text-xs">Demo: admin@company.com / admin123</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

