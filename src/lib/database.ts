// Database service using localStorage for persistence

export interface Author {
  name: string;
  avatar?: string;
  department: string;
  email: string;
}

// Full reset utility to clear all app data
export function fullReset(): void {
  localStorage.removeItem(STORAGE_KEYS.SUGGESTIONS);
  localStorage.removeItem(STORAGE_KEYS.USERS);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.VOTES);
  localStorage.removeItem(STORAGE_KEYS.COMMENTS);
  localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
}

// Centralized sentiment analysis used on submit and backfill
export function analyzeSentiment(
  problem: string,
  solution: string,
  benefit?: string
): "positive" | "neutral" | "negative" {
  const positiveWords = [
    "improve", "better", "efficient", "increase", "enhance", "optimize", "boost", "upgrade",
    "streamline", "accelerate", "maximize", "minimize", "reduce", "save", "benefit", "advantage",
    "success", "excellent", "great", "outstanding", "effective", "productive", "innovative",
    "solution", "solve", "resolve", "fix", "repair", "help", "support", "enable", "facilitate",
    "empower", "transform", "revolutionize", "advance", "progress", "growth", "profit", "gain",
    "quality", "excellence", "superior", "optimal", "best", "top", "leading", "cutting-edge"
  ];

  const negativeWords = [
    "problem", "issue", "issues", "fail", "error", "errors", "broken", "slow", "difficult", "challenge", "barrier",
    "obstacle", "bottleneck", "inefficient", "waste", "loss", "decline", "decrease", "deteriorate",
    "worse", "worst", "poor", "bad", "terrible", "awful", "horrible", "unacceptable", "bug", "bugs",
    "critical", "urgent", "emergency", "crisis", "risk", "danger",
    "threat", "concern", "worry", "frustration", "complaint", "dissatisfaction", "disappointment",
    "failure", "breakdown", "malfunction", "defect", "flaw", "weakness", "vulnerability",
    "inadequate", "insufficient", "lack", "shortage", "deficit", "gap", "delay", "wait", "poorly"
  ];

  const negationPhrases = [
    "not good", "not great", "not working", "not work", "not acceptable", "no improvement",
    "doesn't work", "dont work", "don't work", "isn't working", "isnt working",
    "cannot", "can't", "cant", "never works", "fails to"
  ];

  const text = `${problem} ${solution} ${benefit || ""}`.toLowerCase();

  let positiveScore = 0;
  let negativeScore = 0;

  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\w*\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) positiveScore += matches.length;
  });

  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\w*\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) negativeScore += matches.length;
  });

  negationPhrases.forEach(phrase => {
    const regex = new RegExp(`\\b${phrase.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) negativeScore += matches.length;
  });

  if (solution.length > 50) positiveScore += 1;
  if (benefit && benefit.length > 30) positiveScore += 1;

  const strongNegatives = ["worst", "terrible", "awful", "horrible", "crisis", "emergency", "critical", "unacceptable"];
  const hasStrongNegative = strongNegatives.some(w => new RegExp(`\\b${w}\\b`, 'i').test(text));

  const scoreDifference = positiveScore - negativeScore;
  if (hasStrongNegative && negativeScore >= 1 && scoreDifference < 2) return "negative";
  if (scoreDifference >= 2) return "positive";
  if (scoreDifference <= -1) return "negative";
  return "neutral";
}
export interface Comment {
  id: string;
  suggestionId: string;
  author: {
    name: string;
    email: string;
    avatar?: string;
    department: string;
  };
  content: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "status_change" | "comment" | "vote" | "mention";
  title: string;
  message: string;
  suggestionId?: string;
  read: boolean;
  createdAt: string;
}

export interface Suggestion {
  id: string;
  title: string;
  problem: string;
  cause?: string;
  solution: string;
  benefit?: string;
  author: Author;
  status: "pending" | "approved" | "rejected" | "implemented" | "review_pending";
  category: string;
  sentiment: "positive" | "neutral" | "negative";
  votes: number;
  votedBy: string[]; // Array of user IDs who voted
  comments: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  language: string;
  adminRemark?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  department: string;
  points: number;
  suggestionsCount: number;
  implementationsCount: number;
  role?: "user" | "admin";
  password?: string; // For authentication
}

export interface Settings {
  theme: "light" | "dark" | "system";
  notifications: boolean;
  emailNotifications: boolean;
  language: string;
}

const STORAGE_KEYS = {
  SUGGESTIONS: "suggestions_db",
  USERS: "users_db",
  CURRENT_USER: "current_user",
  SETTINGS: "user_settings",
  VOTES: "user_votes",
  COMMENTS: "comments_db",
  NOTIFICATIONS: "notifications_db",
};

// Initialize with default data if empty
function initializeDatabase() {
  if (!localStorage.getItem(STORAGE_KEYS.SUGGESTIONS)) {
    const defaultSuggestions: Suggestion[] = [
      {
        id: "1",
        title: "Automated Customer Feedback System",
        problem: "Customer feedback is currently collected manually through forms, leading to delays and inconsistent data collection.",
        solution: "Implement an AI-powered chatbot that can collect, categorize, and analyze customer feedback in real-time.",
        author: {
          name: "Aarav Sharma",
          avatar: "/placeholder-avatar-1.jpg",
          department: "Sales & Client Relations",
          email: "aarav@company.com",
        },
        status: "approved",
        category: "Customer Experience",
        sentiment: "positive",
        votes: 24,
        votedBy: [],
        comments: 8,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ["AI", "Automation", "Customer Service"],
        language: "en",
      },
      {
        id: "2",
        title: "Green Office Initiative",
        problem: "High energy consumption and waste in office operations are increasing operational costs and environmental impact.",
        solution: "Introduce smart lighting systems, paperless workflows, and recycling programs to reduce our carbon footprint.",
        author: {
          name: "Priya Patel",
          avatar: "/placeholder-avatar-2.jpg",
          department: "Manufacturing",
          email: "priya@company.com",
        },
        status: "pending",
        category: "Environment",
        sentiment: "positive",
        votes: 18,
        votedBy: [],
        comments: 5,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ["Sustainability", "Cost Reduction", "Environment"],
        language: "en",
      },
      {
        id: "3",
        title: "Remote Work Productivity Tools",
        problem: "Remote team members struggle with collaboration and maintaining productivity without proper digital tools.",
        solution: "Deploy integrated project management and communication platforms with AI-powered productivity insights.",
        author: {
          name: "Rohan Gupta",
          avatar: "/placeholder-avatar-3.jpg",
          department: "Quality Control",
          email: "rohan@company.com",
        },
        status: "implemented",
        category: "Technology",
        sentiment: "positive",
        votes: 32,
        votedBy: [],
        comments: 12,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ["Remote Work", "Productivity", "Communication"],
        language: "en",
      },
    ];
    localStorage.setItem(STORAGE_KEYS.SUGGESTIONS, JSON.stringify(defaultSuggestions));
  }

  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const defaultUsers: User[] = [
      {
        id: "admin_1",
        name: "Admin User",
        email: "admin@company.com",
        department: "Manufacturing",
        points: 0,
        suggestionsCount: 0,
        implementationsCount: 0,
        role: "admin",
        password: "admin123",
      },
      {
        id: "user_1",
        name: "John Doe",
        email: "john.doe@company.com",
        department: "Quality Control",
        points: 0,
        suggestionsCount: 0,
        implementationsCount: 0,
        role: "user",
        password: "user123",
      },
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  }

  if (!localStorage.getItem(STORAGE_KEYS.COMMENTS)) {
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    const defaultSettings: Settings = {
      theme: "system",
      notifications: true,
      emailNotifications: true,
      language: "en",
    };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
  }
}

// Initialize on import
initializeDatabase();

// Suggestions CRUD
export const suggestionsDB = {
  getAll: (): Suggestion[] => {
    const data = localStorage.getItem(STORAGE_KEYS.SUGGESTIONS);
    return data ? JSON.parse(data) : [];
  },

  getById: (id: string): Suggestion | undefined => {
    const suggestions = suggestionsDB.getAll();
    return suggestions.find((s) => s.id === id);
  },

  create: (suggestion: Omit<Suggestion, "id" | "createdAt" | "updatedAt" | "votes" | "votedBy" | "comments">): Suggestion => {
    const suggestions = suggestionsDB.getAll();
    const newSuggestion: Suggestion = {
      ...suggestion,
      id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      votes: 0,
      votedBy: [],
      comments: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    suggestions.push(newSuggestion);
    localStorage.setItem(STORAGE_KEYS.SUGGESTIONS, JSON.stringify(suggestions));
    return newSuggestion;
  },

  update: (id: string, updates: Partial<Suggestion>): Suggestion | null => {
    const suggestions = suggestionsDB.getAll();
    const index = suggestions.findIndex((s) => s.id === id);
    if (index === -1) return null;

    suggestions[index] = {
      ...suggestions[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.SUGGESTIONS, JSON.stringify(suggestions));
    return suggestions[index];
  },

  recomputeAllSentiments: (): { updated: number } => {
    const suggestions = suggestionsDB.getAll();
    let updated = 0;
    const newSuggestions = suggestions.map(s => {
      const computed = analyzeSentiment(s.problem, s.solution, s.benefit);
      if (computed !== s.sentiment) {
        updated += 1;
        return { ...s, sentiment: computed, updatedAt: new Date().toISOString() };
      }
      return s;
    });
    localStorage.setItem(STORAGE_KEYS.SUGGESTIONS, JSON.stringify(newSuggestions));
    return { updated };
  },

  deleteAll: (): number => {
    const count = suggestionsDB.getAll().length;
    localStorage.setItem(STORAGE_KEYS.SUGGESTIONS, JSON.stringify([]));
    return count;
  },

  delete: (id: string): boolean => {
    const suggestions = suggestionsDB.getAll();
    const filtered = suggestions.filter((s) => s.id !== id);
    if (filtered.length === suggestions.length) return false;
    localStorage.setItem(STORAGE_KEYS.SUGGESTIONS, JSON.stringify(filtered));
    return true;
  },

  vote: (suggestionId: string, userId: string): { success: boolean; votes: number } => {
    const suggestion = suggestionsDB.getById(suggestionId);
    if (!suggestion) return { success: false, votes: 0 };

    const hasVoted = suggestion.votedBy.includes(userId);
    let newVotedBy: string[];
    let newVotes: number;

    if (hasVoted) {
      newVotedBy = suggestion.votedBy.filter((id) => id !== userId);
      newVotes = suggestion.votes - 1;
    } else {
      newVotedBy = [...suggestion.votedBy, userId];
      newVotes = suggestion.votes + 1;
    }

    suggestionsDB.update(suggestionId, {
      votes: newVotes,
      votedBy: newVotedBy,
    });

    // Create notification for suggestion author
    if (!hasVoted && suggestion.author.email !== userId) {
      notificationsDB.create({
        userId: suggestion.author.email,
        type: "vote",
        title: "New Vote",
        message: `Someone voted on your suggestion: "${suggestion.title}"`,
        suggestionId: suggestionId,
      });
    }

    return { success: true, votes: newVotes };
  },

  seedDemo: (count: number = 60): number => {
    const categories = [
      "Process Improvement",
      "Technology",
      "Customer Experience",
      "Cost Reduction",
      "Safety",
      "Environment",
      "Communication",
      "Training",
      "Other",
    ];
    const departments = [
      "Quality Control",
      "Sales & Client Relations",
      "Logistics",
      "Marketing",
      "Manufacturing",
    ];

    const existing = suggestionsDB.getAll();
    const now = Date.now();
    const newOnes: Suggestion[] = [];

    for (let i = 0; i < count; i++) {
      const dep = departments[i % departments.length];
      const cat = categories[i % categories.length];
      const daysAgo = Math.floor(Math.random() * 90); // within last 90 days
      const created = new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();
      const title = `Demo Suggestion #${existing.length + newOnes.length + 1}`;
      const problemBase = i % 5 === 0
        ? "Process is slow and causes delay and waste. Worst cases seen in peak hours."
        : "Opportunity to improve efficiency and reduce cost with better workflow.";
      const solutionBase = i % 3 === 0
        ? "Implement automation to streamline steps and reduce wait time."
        : "Introduce checklists and training to improve quality and reduce errors.";
      const benefitBase = i % 2 === 0
        ? "Expect to save 10% time and improve quality."
        : "Better customer experience with faster response.";

      const sentiment = analyzeSentiment(problemBase, solutionBase, benefitBase);

      const authorName = ["Aarav Sharma","Priya Patel","Rohan Gupta","Neha Verma","Vikram Singh"][i % 5];
      const authorEmail = `user${i % 7}@company.com`;

      const newSuggestion: Suggestion = {
        id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        problem: problemBase,
        cause: undefined,
        solution: solutionBase,
        benefit: benefitBase,
        author: { name: authorName, email: authorEmail, department: dep },
        status: ["pending","review_pending","approved","implemented","rejected"][i % 5] as Suggestion["status"],
        category: cat,
        sentiment,
        votes: Math.floor(Math.random() * 25),
        votedBy: [],
        comments: Math.floor(Math.random() * 6),
        createdAt: created,
        updatedAt: created,
        tags: ["demo", dep.toLowerCase().split(" ")[0], cat.toLowerCase().split(" ")[0]],
        language: "en",
      };
      newOnes.push(newSuggestion);
    }

    const merged = [...existing, ...newOnes];
    localStorage.setItem(STORAGE_KEYS.SUGGESTIONS, JSON.stringify(merged));
    return newOnes.length;
  },
};

// User management
export const userDB = {
  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  setCurrentUser: (user: User): void => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },

  updateCurrentUser: (updates: Partial<User>): User => {
    const user = userDB.getCurrentUser();
    if (!user) throw new Error("No current user");
    const updated = { ...user, ...updates };
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
    return updated;
  },

  getAllUsers: (): User[] => {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    const storedUsers: User[] = data ? JSON.parse(data) : [];
    
    // Generate users from suggestions and merge with stored users
    const suggestions = suggestionsDB.getAll();
    const userMap = new Map<string, User>();

    // Add stored users first
    storedUsers.forEach(user => {
      userMap.set(user.email, { ...user });
    });

    // Add users from suggestions
    suggestions.forEach((suggestion) => {
      const authorId = suggestion.author.email;
      if (!userMap.has(authorId)) {
        userMap.set(authorId, {
          id: authorId,
          name: suggestion.author.name,
          email: suggestion.author.email,
          avatar: suggestion.author.avatar,
          department: suggestion.author.department,
          points: 0,
          suggestionsCount: 0,
          implementationsCount: 0,
          role: "user",
        });
      }

      const user = userMap.get(authorId)!;
      user.suggestionsCount += 1;
      if (suggestion.status === "implemented") {
        user.implementationsCount += 1;
        user.points += 60; // Points for implementation
      }
      if (suggestion.status === "approved") {
        user.points += 30; // Points for approval
      }
      if (suggestion.status === "rejected") {
        user.points += 0; // No points for rejected
      }
      user.points += suggestion.votes * 5; // Points for votes
    });

    return Array.from(userMap.values()).sort((a, b) => b.points - a.points);
  },

  register: (userData: Omit<User, "id" | "points" | "suggestionsCount" | "implementationsCount">): User => {
    // Check only stored users (exclude suggestion authors) and compare case-insensitively
    const stored = localStorage.getItem(STORAGE_KEYS.USERS);
    const storedUsers: User[] = stored ? JSON.parse(stored) : [];
    const exists = storedUsers.some(u => (u.email || "").toLowerCase() === (userData.email || "").toLowerCase());
    if (exists) {
      throw new Error("User already exists");
    }

    const newUser: User = {
      ...userData,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      points: 0,
      suggestionsCount: 0,
      implementationsCount: 0,
      role: userData.role || "user",
    };

    const usersList: User[] = storedUsers;
    usersList.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersList));

    return newUser;
  },

  login: (email: string, password: string): User | null => {
    const users = userDB.getAllUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      // Remove password before storing as current user
      const { password: _, ...userWithoutPassword } = user;
      userDB.setCurrentUser(userWithoutPassword as User);
      return userWithoutPassword as User;
    }
    return null;
  },

  resetStats: (): void => {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    const storedUsers: User[] = data ? JSON.parse(data) : [];
    const reset = storedUsers.map(u => ({
      ...u,
      points: 0,
      suggestionsCount: 0,
      implementationsCount: 0,
    }));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(reset));
  },

  deleteAll: (): number => {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    const storedUsers: User[] = data ? JSON.parse(data) : [];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    return storedUsers.length;
  },
};

// Comments management
export const commentsDB = {
  getAll: (): Comment[] => {
    const data = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    return data ? JSON.parse(data) : [];
  },

  getBySuggestionId: (suggestionId: string): Comment[] => {
    return commentsDB.getAll().filter(c => c.suggestionId === suggestionId);
  },

  create: (comment: Omit<Comment, "id" | "createdAt">): Comment => {
    const comments = commentsDB.getAll();
    const newComment: Comment = {
      ...comment,
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    comments.push(newComment);
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
    
    // Update suggestion comment count
    const suggestion = suggestionsDB.getById(comment.suggestionId);
    if (suggestion) {
      const commentCount = commentsDB.getBySuggestionId(comment.suggestionId).length;
      suggestionsDB.update(comment.suggestionId, {
        comments: commentCount,
      });
      
      // Create notification for suggestion author if commenter is not the author
      if (suggestion.author.email !== comment.author.email) {
        notificationsDB.create({
          userId: suggestion.author.email,
          type: "comment",
          title: "New Comment",
          message: `${comment.author.name} commented on your suggestion: "${suggestion.title}"`,
          suggestionId: suggestion.id,
        });
      }
    }
    
    return newComment;
  },

  delete: (id: string): boolean => {
    const comments = commentsDB.getAll();
    const filtered = comments.filter(c => c.id !== id);
    if (filtered.length === comments.length) return false;
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(filtered));
    return true;
  },
};

// Notifications management
export const notificationsDB = {
  getAll: (): Notification[] => {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return data ? JSON.parse(data) : [];
  },

  getByUserId: (userId: string): Notification[] => {
    return notificationsDB.getAll()
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getUnreadCount: (userId: string): number => {
    return notificationsDB.getByUserId(userId).filter(n => !n.read).length;
  },

  create: (notification: Omit<Notification, "id" | "createdAt" | "read">): Notification => {
    const notifications = notificationsDB.getAll();
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    notifications.push(newNotification);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    return newNotification;
  },

  markAsRead: (id: string): boolean => {
    const notifications = notificationsDB.getAll();
    const index = notifications.findIndex(n => n.id === id);
    if (index === -1) return false;
    notifications[index].read = true;
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    return true;
  },

  markAllAsRead: (userId: string): void => {
    const notifications = notificationsDB.getAll();
    notifications.forEach(n => {
      if (n.userId === userId && !n.read) {
        n.read = true;
      }
    });
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  },
};

// Settings management
export const settingsDB = {
  get: (): Settings => {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : { theme: "system", notifications: true, emailNotifications: true, language: "en" };
  },

  update: (updates: Partial<Settings>): Settings => {
    const current = settingsDB.get();
    const updated = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  },
};

// Helper function to format date
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  return `${Math.floor(diffInSeconds / 2592000)} months ago`;
}

