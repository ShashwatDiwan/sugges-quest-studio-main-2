import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-16">
      <div className="absolute inset-0 bg-app-grid opacity-50" />
      <div className="pointer-events-none absolute inset-x-0 top-[-200px] h-[420px] blur-3xl radial-highlight opacity-70" />
      <div className="panel relative max-w-lg text-center">
        <p className="pill mx-auto">404</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">This route drifted off-map</h1>
        <p className="mt-3 text-muted-foreground">
          We couldn&apos;t find <span className="font-mono text-foreground">{location.pathname}</span>. Let&apos;s guide you back to the workspace.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-lg transition-transform hover:-translate-y-0.5"
        >
          Return home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
