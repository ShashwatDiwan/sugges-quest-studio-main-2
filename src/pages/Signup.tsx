import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { UserPlus, User, Lock, Mail, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { userDB } from "@/lib/database";

const departments = [
  "Quality Control",
  "Sales & Client Relations",
  "Logistics",
  "Marketing",
  "Manufacturing",
];

export default function Signup() {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
    role: roleParam === "admin" ? "admin" : "user",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // If admin, ensure department isn't required and store a default label
      const departmentToUse = formData.role === "admin" ? "Manufacturing" : formData.department;

      const newUser = userDB.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        department: departmentToUse,
        role: formData.role as "user" | "admin",
      });

      toast({
        title: "Account Created",
        description: "Your account has been created successfully!",
      });

      // Auto login
      const user = userDB.login(formData.email, formData.password);
      if (user) {
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-10">
      <div className="absolute inset-0 bg-app-grid opacity-50" />
      <div className="pointer-events-none absolute inset-x-0 top-[-180px] h-[400px] blur-3xl radial-highlight opacity-70" />
      <div className="relative mx-auto max-w-4xl text-center">
        <span className="pill mx-auto">Create account</span>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Join IdeaForge</h1>
        <p className="mt-2 text-muted-foreground">
          Invite-only workspace for teams who ship bold improvements together.
        </p>
      </div>
      <div className="relative mt-8 flex items-center justify-center">
        <Card className="w-full max-w-md panel">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl primary-gradient shadow-glow">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>
            Sign up to start sharing your ideas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="pl-10 rounded-2xl border-white/40 bg-white/70 focus-visible:ring-primary dark:border-white/10 dark:bg-white/10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="pl-10 rounded-2xl border-white/40 bg-white/70 focus-visible:ring-primary dark:border-white/10 dark:bg-white/10"
                  required
                />
              </div>
            </div>

            {formData.role !== "admin" && (
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select 
                  value={formData.department} 
                  onValueChange={(value) => setFormData({...formData, department: value})}
                  required={formData.role !== "admin"}
                >
                  <SelectTrigger className="rounded-2xl border-white/40 bg-white/70 focus:ring-primary dark:border-white/10 dark:bg-white/10">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {dept}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="role">Account Type</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData({...formData, role: value as "user" | "admin"})}
                required
              >
                <SelectTrigger className="rounded-2xl border-white/40 bg-white/70 focus:ring-primary dark:border-white/10 dark:bg-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="pl-10 rounded-2xl border-white/40 bg-white/70 focus-visible:ring-primary dark:border-white/10 dark:bg-white/10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="pl-10 rounded-2xl border-white/40 bg-white/70 focus-visible:ring-primary dark:border-white/10 dark:bg-white/10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" className="w-full primary-gradient rounded-full shadow-glow" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
              <UserPlus className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground mt-4">
            <p>Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link></p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

