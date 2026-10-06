import { useEffect, useState } from 'react';

export interface Tab {
  id: string;
  name: string;
  left: string;
  right: string;
}

interface PersistedState {
  version: number;
  tabs: Tab[];
  activeTabId: string | null;
}

// Keep the original storage namespace so existing Formatter tabs survive the Utility Hub rename.
const STORAGE_KEY = 'text-formatter:v2';
const LEGACY_STORAGE_KEY = 'text-formatter:v1';
const STATE_VERSION = 2;

const createId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const createTab = (name: string, left = '', right = ''): Tab => ({
  id: createId(),
  name,
  left,
  right,
});

interface LegacyTab {
  id?: unknown;
  name?: unknown;
  inputText?: unknown;
}

const sanitizeTab = (raw: unknown, index: number): Tab | null => {
  if (typeof raw !== 'object' || raw === null) return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.id !== 'string' || record.id.length === 0) return null;
  const name =
    typeof record.name === 'string' && record.name.trim() ? record.name : `Tab ${index + 1}`;
  return {
    id: record.id,
    name,
    left: typeof record.left === 'string' ? record.left : '',
    right: typeof record.right === 'string' ? record.right : '',
  };
};

const loadPersisted = (): PersistedState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      if (parsed.version !== STATE_VERSION || !Array.isArray(parsed.tabs)) return null;
      return {
        version: STATE_VERSION,
        tabs: parsed.tabs.map(sanitizeTab).filter((tab): tab is Tab => tab !== null),
        activeTabId: typeof parsed.activeTabId === 'string' ? parsed.activeTabId : null,
      };
    }

    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyRaw) return null;
    const legacy = JSON.parse(legacyRaw) as { version?: number; tabs?: LegacyTab[] };
    if (legacy.version !== 1 || !Array.isArray(legacy.tabs)) return null;
    const tabs = legacy.tabs
      .map((tab, index) =>
        sanitizeTab(
          { id: typeof tab.id === 'string' ? tab.id : null, name: tab.name, left: tab.inputText, right: '' },
          index,
        ),
      )
      .filter((tab): tab is Tab => tab !== null)
      .map((tab) => (tab.id ? tab : { ...tab, id: createId() }));
    if (tabs.length === 0) return null;
    return { version: STATE_VERSION, tabs, activeTabId: tabs[0].id };
  } catch {
    return null;
  }
};

export const useTabs = () => {
  const [initial] = useState(loadPersisted);

  const [tabs, setTabs] = useState<Tab[]>(() =>
    initial && initial.tabs.length > 0 ? initial.tabs : [createTab('Tab 1')],
  );
  const [activeTabId, setActiveTabId] = useState<string | null>(
    () => initial?.activeTabId ?? initial?.tabs[0]?.id ?? null,
  );

  useEffect(() => {
    if (tabs.some((tab) => tab.id === activeTabId)) return;
    setActiveTabId(tabs[0]?.id ?? null);
  }, [activeTabId, tabs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const state: PersistedState = { version: STATE_VERSION, tabs, activeTabId };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // storage full or unavailable: keep app usable without persistence
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [activeTabId, tabs]);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? null;

  const selectTab = (id: string) => setActiveTabId(id);

  const addTab = () => {
    const tab = createTab(`Tab ${tabs.length + 1}`);
    setTabs((prev) => [...prev, tab]);
    setActiveTabId(tab.id);
  };

  const closeTab = (id: string) => {
    const index = tabs.findIndex((tab) => tab.id === id);
    if (index === -1) return;
    const next = tabs.filter((tab) => tab.id !== id);
    if (next.length === 0) {
      const fresh = createTab('Tab 1');
      setTabs([fresh]);
      setActiveTabId(fresh.id);
      return;
    }
    setTabs(next);
    if (id === activeTabId) {
      setActiveTabId(next[Math.min(index, next.length - 1)].id);
    }
  };

  const renameTab = (id: string, name: string) => {
    setTabs((prev) => prev.map((tab) => (tab.id === id ? { ...tab, name } : tab)));
  };

  const updateTab = (id: string, patch: Partial<Pick<Tab, 'left' | 'right'>>) => {
    setTabs((prev) => prev.map((tab) => (tab.id === id ? { ...tab, ...patch } : tab)));
  };

  const clearAll = () => {
    const fresh = createTab('Tab 1');
    setTabs([fresh]);
    setActiveTabId(fresh.id);
  };

  return {
    tabs,
    activeTab,
    activeTabId,
    selectTab,
    addTab,
    closeTab,
    renameTab,
    updateTab,
    clearAll,
  };
};
