import TabBar from './TabBar';
import TabView from './TabView';
import { useTabs } from '../state/useTabs';

export default function FormatterTool() {
  const { tabs, activeTab, activeTabId, selectTab, addTab, closeTab, renameTab, updateTab, clearAll } = useTabs();

  return (
    <>
      <TabBar tabs={tabs} activeTabId={activeTabId} onSelectTab={selectTab} onAddTab={addTab} onCloseTab={closeTab} onRenameTab={renameTab} />
      <div className="min-h-0 flex flex-1 overflow-hidden">
        {activeTab && (
          <TabView
            left={activeTab.left}
            right={activeTab.right}
            onLeftChange={(value) => updateTab(activeTab.id, { left: value })}
            onRightChange={(value) => updateTab(activeTab.id, { right: value })}
            onClearAll={clearAll}
          />
        )}
      </div>
    </>
  );
}
