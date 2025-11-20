import { useState, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Clock,
  CheckCircle,
  XCircle,
  Tag,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { suggestionsDB, userDB, commentsDB, formatDate } from "@/lib/database";

interface SuggestionCardProps {
  id: string;
  title: string;
  problem: string;
  solution: string;
  author: {
    name: string;
    avatar?: string;
    department: string;
  };
  status: "pending" | "approved" | "rejected" | "implemented" | "review_pending";
  category: string;
  sentiment: "positive" | "neutral" | "negative";
  votes: number;
  comments: number;
  createdAt: string;
  tags: string[];
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: "pending",
    bg: "bg-pending/10",
    text: "text-pending",
    label: "Pending Review"
  },
  review_pending: {
    icon: Clock,
    color: "pending",
    bg: "bg-pending/10",
    text: "text-pending",
    label: "Review Pending"
  },
  approved: {
    icon: CheckCircle,
    color: "approved",
    bg: "bg-approved/10",
    text: "text-approved",
    label: "Approved"
  },
  rejected: {
    icon: XCircle,
    color: "rejected",
    bg: "bg-rejected/10",
    text: "text-rejected",
    label: "Rejected"
  },
  implemented: {
    icon: CheckCircle,
    color: "success",
    bg: "bg-success/10",
    text: "text-success",
    label: "Implemented"
  }
};

const sentimentConfig = {
  positive: { color: "bg-success/20 text-success", label: "Positive" },
  neutral: { color: "bg-muted text-muted-foreground", label: "Neutral" },
  negative: { color: "bg-destructive/20 text-destructive", label: "Needs Attention" }
};

export default function SuggestionCard({
  id,
  title,
  problem,
  solution,
  author,
  status,
  category,
  sentiment,
  votes: initialVotes,
  comments: initialComments,
  createdAt,
  tags,
}: SuggestionCardProps) {
  const [votes, setVotes] = useState(initialVotes);
  const [hasVoted, setHasVoted] = useState(false);
  const [commentCount, setCommentCount] = useState(initialComments);
  const [comments, setComments] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;

  useEffect(() => {
    // Check if current user has voted
    const suggestion = suggestionsDB.getById(id);
    const currentUser = userDB.getCurrentUser();
    if (suggestion && currentUser) {
      setHasVoted(suggestion.votedBy.includes(currentUser.email));
      setVotes(suggestion.votes);
      setCommentCount(suggestion.comments);
    }
    loadComments();
  }, [id]);

  const loadComments = () => {
    const suggestionComments = commentsDB.getBySuggestionId(id);
    setComments(suggestionComments);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    const currentUser = userDB.getCurrentUser();
    if (!currentUser) return;

    setIsSubmittingComment(true);
    try {
      commentsDB.create({
        suggestionId: id,
        author: {
          name: currentUser.name,
          email: currentUser.email,
          avatar: currentUser.avatar,
          department: currentUser.department,
        },
        content: newComment.trim(),
      });
      
      setNewComment("");
      loadComments();
      const suggestion = suggestionsDB.getById(id);
      if (suggestion) {
        setCommentCount(suggestion.comments);
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleVote = () => {
    const currentUser = userDB.getCurrentUser();
    if (!currentUser) return;

    const result = suggestionsDB.vote(id, currentUser.email);
    if (result.success) {
      setVotes(result.votes);
      setHasVoted(!hasVoted);
      
      // Update user points
      const user = userDB.getCurrentUser();
      if (user) {
        userDB.updateCurrentUser({
          points: hasVoted ? user.points - 5 : user.points + 5,
        });
      }
    }
  };

  return (
    <Card
      id={`suggestion-${id}`}
      className="panel relative overflow-hidden transition-smooth hover:-translate-y-0.5 hover:shadow-glow"
    >
      <div className="pointer-events-none absolute inset-y-2 right-4 w-40 rounded-full bg-primary/10 blur-3xl" />

      <CardHeader className="border-b border-white/20 pb-5 dark:border-white/5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11">
              <AvatarImage src={author.avatar} />
              <AvatarFallback>
                {author.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold leading-tight">{author.name}</p>
              <p className="text-xs text-muted-foreground">{author.department}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`${statusInfo.bg} ${statusInfo.text} border-0 rounded-full px-3 py-1 text-xs font-semibold`}>
              <StatusIcon className="mr-1 h-3.5 w-3.5" />
              {statusInfo.label}
            </Badge>
            <Badge variant="outline" className="rounded-full border-white/40 text-[11px] uppercase tracking-wide">
              <Tag className="mr-1 h-3 w-3" />
              {category}
            </Badge>
            <Badge className={`rounded-full text-[11px] ${sentimentConfig[sentiment].color}`}>
              {sentimentConfig[sentiment].label}
            </Badge>
            <span className="text-xs text-muted-foreground">{createdAt}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="space-y-3">
          <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-destructive/80">Problem</p>
              <p className="mt-2 text-sm text-muted-foreground">{problem}</p>
            </div>
            <div className="rounded-2xl border border-success/25 bg-success/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-success/80">Solution</p>
              <p className="mt-2 text-sm text-muted-foreground">{solution}</p>
            </div>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={`${id}-${tag}-${index}`}
                className="rounded-full border border-white/30 bg-white/60 px-3 py-1 text-xs font-semibold tracking-wide text-muted-foreground backdrop-blur dark:border-white/10 dark:bg-white/10"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVote}
              className={`rounded-full border border-transparent px-4 text-sm font-medium transition-spring hover:border-primary/30 hover:bg-primary/5 ${
                hasVoted ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Heart className={`mr-2 h-4 w-4 ${hasVoted ? "fill-current" : ""}`} />
              {votes} support
            </Button>

            <Collapsible open={showComments} onOpenChange={setShowComments}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full border border-transparent px-4 text-sm font-medium text-muted-foreground transition-spring hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {commentCount} comments
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>

          <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-primary">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        <Collapsible open={showComments} onOpenChange={setShowComments}>
          <CollapsibleContent className="space-y-4 border-t border-white/10 pt-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Add your perspective..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-24 rounded-2xl border-white/30 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-white/5"
              />
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmittingComment}
                size="sm"
                className="rounded-full px-4"
              >
                <Send className="mr-2 h-4 w-4" />
                {isSubmittingComment ? "Posting..." : "Post comment"}
              </Button>
            </div>

            <div className="space-y-3">
              {comments.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-white/30 px-4 py-6 text-center text-sm text-muted-foreground">
                  No comments yet. Spark the conversation!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 rounded-2xl border border-white/20 bg-white/60 p-4 backdrop-blur dark:border-white/5 dark:bg-white/5">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={comment.author.avatar} />
                      <AvatarFallback>
                        {comment.author.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{comment.author.name}</span>
                        <span>{comment.author.department}</span>
                        <span>•</span>
                        <span>{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-sm text-foreground">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}