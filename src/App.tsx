import { Suspense, useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useTheme } from './state/useTheme';
import { tools, type ToolId } from './tools';

function App() {
  const { pathname } = useLocation();
  const activeTool = tools.find((tool) => tool.path === pathname.replace(/\/+$/, ''));
  const [visitedTools, setVisitedTools] = useState<ToolId[]>([]);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!activeTool) return;
    setVisitedTools((visited) => visited.includes(activeTool.id) ? visited : [...visited, activeTool.id]);
  }, [activeTool]);

  if (!activeTool) return <Navigate to="/formatter" replace />;

  return (
    <div className="h-dvh bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img
                  src="/logo.png"
                  alt="Utility Hub"
                  className="h-8 w-8 object-contain"
                />
                <h1 className="text-xl font-semibold text-foreground">
                  Utility Hub
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                className="p-2 rounded-md bg-card border-[1.5px] border-border text-muted-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors cursor-pointer"
              >
                {theme === 'dark' ? (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex flex-1 overflow-hidden">
        <aside className="utility-sidebar">
          <nav aria-label="Utilities" className="flex flex-col gap-2">
            {tools.map((tool) => (
              <Link key={tool.id} to={tool.path} className={`utility-nav-button ${activeTool.id === tool.id ? 'active' : ''}`} aria-current={activeTool.id === tool.id ? 'page' : undefined} aria-controls={`tool-${tool.id}`} title={tool.label}>
                <span aria-hidden="true" className="utility-nav-icon">{tool.icon}</span>
                <span className="utility-nav-label">{tool.label}</span>
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-h-0 min-w-0 flex flex-1 flex-col overflow-hidden">
          {tools.map(({ id, label, component: Component }) => (
            <section key={id} id={`tool-${id}`} aria-label={label} hidden={id !== activeTool.id} className={id === activeTool.id ? 'min-h-0 flex flex-1 flex-col overflow-hidden' : undefined}>
              {(id === activeTool.id || visitedTools.includes(id)) && <Suspense fallback={<p role="status" className="p-6 text-sm text-muted-foreground">Loading {label}...</p>}><Component /></Suspense>}
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}

export default App;
