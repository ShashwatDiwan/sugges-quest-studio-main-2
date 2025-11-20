import { useState } from "react";
import { Plus, Upload, Mic, Video, Globe, ArrowRight, Sparkles, Shield, Info, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { suggestionsDB, userDB, formatDate, analyzeSentiment } from "@/lib/database";
import { useNavigate } from "react-router-dom";
import { Slider } from "@/components/ui/slider";

const steps = [
  { id: "problem", title: "Identify Problem", description: "What issue did you observe?" },
  { id: "cause", title: "Root Cause", description: "Why do you think this happens?" },
  { id: "solution", title: "Propose Solution", description: "How would you solve it?" },
  { id: "benefit", title: "Expected Benefit", description: "What positive impact will this have?" }
];

const categories = [
  "Process Improvement",
  "Technology",
  "Customer Experience",
  "Cost Reduction",
  "Safety",
  "Environment",
  "Communication",
  "Training",
  "Other"
];

const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" }
];

export default function SubmissionForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    title: "",
    problem: "",
    cause: "",
    solution: "",
    benefit: "",
    category: "",
    language: "en",
    tags: [] as string[],
    attachments: [] as File[],
    privacy: "public" as "public" | "internal",
    expectedBenefit: "" as "Cost Reduction" | "Quality" | "Throughput" | "Safety" | "Sustainability" | "Other" | "",
    effort: 2 as number, // 1 low - 5 high
  });
  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFormData({
      ...formData,
      attachments: [...formData.attachments, ...files]
    });
  };

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) {
      setFormData((prev) => ({ ...prev, attachments: [...prev.attachments, ...files] }));
    }
  };

  const handleDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave: React.DragEventHandler<HTMLDivElement> = () => setIsDragging(false);

  const saveDraft = () => {
    const key = "submission_draft";
    localStorage.setItem(key, JSON.stringify(formData));
    toast({ title: "Draft saved", description: "You can come back and continue later." });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.problem || !formData.solution || !formData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Title, Problem, Solution, and Category).",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const currentUser = userDB.getCurrentUser();
      
      // Determine sentiment (centralized)
      const sentiment = analyzeSentiment(
        formData.problem,
        formData.solution,
        formData.benefit || ""
      );

      // Create suggestion
      const newSuggestion = suggestionsDB.create({
        title: formData.title,
        problem: formData.problem,
        cause: formData.cause || undefined,
        solution: formData.solution,
        benefit: formData.benefit || undefined,
        category: formData.category,
        language: formData.language,
        tags: formData.tags,
        author: {
          name: currentUser.name,
          email: currentUser.email,
          avatar: currentUser.avatar,
          department: currentUser.department,
        },
        status: "pending",
        sentiment,
      });

      // Update user stats
      userDB.updateCurrentUser({
        suggestionsCount: currentUser.suggestionsCount + 1,
      });

      toast({
        title: "Suggestion Submitted!",
        description: "Your idea has been submitted and will be reviewed by our team.",
      });

      // Reset form
      setFormData({
        title: "",
        problem: "",
        cause: "",
        solution: "",
        benefit: "",
        category: "",
        language: "en",
        tags: [],
        attachments: [],
        privacy: "public",
        expectedBenefit: "",
        effort: 2,
      });
      setCurrentStep(0);
      
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit suggestion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="page-grid mx-auto max-w-5xl">

      <Card className="panel">
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="font-medium text-primary">{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2 rounded-full" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`rounded-2xl border px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide ${
                  index <= currentStep ? "border-primary/30 bg-primary/5 text-primary" : "border-white/40 text-muted-foreground"
                }`}
              >
                <div className="text-lg font-bold">{index + 1}</div>
                {step.title}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        <Card className="panel">
          <CardHeader className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="rounded-full border-0 bg-primary/10 text-primary">
                Step {currentStep + 1}
              </Badge>
              <span>{currentStepData.description}</span>
            </div>
            <CardTitle>{currentStepData.title}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {currentStep === 0 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Suggestion Title</Label>
                  <Input
                    id="title"
                    placeholder="Give your idea a title..."
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className={`mt-2 rounded-2xl focus-visible:ring-0 ${formData.title.trim().length > 0 ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'border-white/40 bg-white/70 dark:border-white/10 dark:bg-white/10'}`}
                  />
                  
                </div>
                <div>
                  <Label htmlFor="problem">Problem Description</Label>
                  <Textarea
                    id="problem"
                    placeholder="Describe the problem or opportunity you've identified..."
                    value={formData.problem}
                    onChange={(e) => setFormData({...formData, problem: e.target.value})}
                    className={`mt-2 min-h-32 rounded-2xl focus-visible:ring-0 ${formData.problem.trim().length > 0 ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'border-white/40 bg-white/70 dark:border-white/10 dark:bg-white/10'}`}
                  />

                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div>
                <Label htmlFor="cause">Root Cause Analysis</Label>
                <Textarea
                  id="cause"
                  placeholder="What do you think causes this problem? Share your analysis..."
                  value={formData.cause}
                  onChange={(e) => setFormData({...formData, cause: e.target.value})}
                  className={`mt-2 min-h-32 rounded-2xl focus-visible:ring-0 ${formData.cause.trim().length > 0 ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'border-white/40 bg-white/70 dark:border-white/10 dark:bg-white/10'}`}
                />
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <Label htmlFor="solution">Proposed Solution</Label>
                <Textarea
                  id="solution"
                  placeholder="Describe your solution in detail. How would you implement it?"
                  value={formData.solution}
                  onChange={(e) => setFormData({...formData, solution: e.target.value})}
                  className={`mt-2 min-h-32 rounded-2xl focus-visible:ring-0 ${formData.solution.trim().length > 0 ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'border-white/40 bg-white/70 dark:border-white/10 dark:bg-white/10'}`}
                />
                <p className="mt-1 text-xs text-muted-foreground">What’s the smallest version we can try within one sprint?</p>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="benefit">Expected Benefits</Label>
                  <Textarea
                    id="benefit"
                    placeholder="What positive impact will this solution have? Include metrics if possible..."
                    value={formData.benefit}
                    onChange={(e) => setFormData({...formData, benefit: e.target.value})}
                    className={`mt-2 min-h-32 rounded-2xl focus-visible:ring-0 ${formData.benefit.trim().length > 0 ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'border-white/40 bg-white/70 dark:border-white/10 dark:bg-white/10'}`}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">E.g., reduce rework by 10%, save 4 hours/week, improve quality checks.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger className="mt-2 rounded-2xl border-white/40 bg-white/70 dark:border-white/10 dark:bg-white/10">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select value={formData.language} onValueChange={(value) => setFormData({...formData, language: value})}>
                      <SelectTrigger className="mt-2 rounded-2xl border-white/40 bg-white/70 dark:border-white/10 dark:bg-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            <Globe className="w-4 h-4 mr-2" />
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Privacy & Expected benefit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Privacy</Label>
                    <Select value={formData.privacy} onValueChange={(v) => setFormData({ ...formData, privacy: v as any })}>
                      <SelectTrigger className="mt-2 rounded-2xl border-white/40 bg-white/70 dark:border-white/10 dark:bg-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public"><Shield className="h-4 w-4 mr-2" />Public</SelectItem>
                        <SelectItem value="internal"><Shield className="h-4 w-4 mr-2" />Internal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Expected Benefit</Label>
                    <Select value={formData.expectedBenefit} onValueChange={(v) => setFormData({ ...formData, expectedBenefit: v as any })}>
                      <SelectTrigger className="mt-2 rounded-2xl border-white/40 bg-white/70 dark:border-white/10 dark:bg-white/10">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Cost Reduction","Quality","Throughput","Safety","Sustainability","Other"].map(opt => (
                          <SelectItem key={opt} value={opt as any}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Effort */}
                <div>
                  <Label>Estimated Effort</Label>
                  <div className="mt-2">
                    <Slider value={[formData.effort]} min={1} max={5} step={1} onValueChange={(v) => setFormData({ ...formData, effort: v[0] })} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{formData.effort === 1 ? "Very Low" : formData.effort === 5 ? "Very High" : `Level ${formData.effort}`}</p>
                </div>

                {/* Tags */}
                <div>
                  <Label>Tags</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="Add tags..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className="rounded-2xl border-white/40 bg-white/70 focus-visible:ring-primary dark:border-white/10 dark:bg-white/10"
                    />
                    <Button type="button" onClick={handleAddTag} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer rounded-full bg-primary/10 text-primary"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* File Upload with Drag/Drop */}
                <div>
                  <Label>Attachments</Label>
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`mt-2 rounded-2xl border-2 border-dashed p-6 text-center ${isDragging ? 'border-primary bg-primary/5' : 'border-white/40 bg-white/60 dark:border-white/10 dark:bg-white/10'}`}
                  >
                    <Input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    />
                    <p className="text-sm text-muted-foreground">Drag & drop files here, or</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Browse Files
                    </Button>
                  </div>
                  {formData.attachments.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {formData.attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Upload className="w-3 h-3" />
                            {file.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/20 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="rounded-full"
              >
                Previous
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button type="button" onClick={handleNext} className="rounded-full">
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" className="rounded-full" onClick={saveDraft}>
                    <Save className="h-4 w-4 mr-2" /> Save Draft
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="primary-gradient rounded-full px-8 shadow-glow"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Suggestion"}
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}