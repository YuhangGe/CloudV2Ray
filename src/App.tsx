import { ConfigProvider, App as AntApp, theme as AntTheme } from 'antd';
import { useEffect, useState } from 'react';
import type { Locale as AntLocale } from 'antd/es/locale';
import { OverviewView } from './views/overview';
import { themeStore } from './store/theme';
import { loadAntdLocale, localeStore } from './store/locale';
import { cs, useQuery } from './service/util';
import { SettingsView } from './views/settings';
import { MessageWrapper } from './service/message';

const ViewItems = [
  {
    label: '概览',
    key: 'overview',
  },
  {
    label: '设置',
    key: 'settings',
  },
];
function App() {
  const [locale] = localeStore.useStore('currentLanguage');
  const [antdLocale, setAntdLocale] = useState<AntLocale>();
  const [theme] = themeStore.useStore('actualTheme');

  useEffect(() => {
    void loadAntdLocale(locale).then((res) => setAntdLocale(res));
  }, [locale]);

  const [view, setView] = useQuery('view', 'overview');

  return antdLocale ? (
    <ConfigProvider
      locale={antdLocale}
      theme={{
        algorithm: theme === 'dark' ? AntTheme.darkAlgorithm : AntTheme.defaultAlgorithm,
      }}
    >
      <AntApp className='flex size-full overflow-hidden bg-background'>
        <MessageWrapper />
        <div className='flex w-32 flex-shrink-0 flex-col border-r border-solid border-border'>
          <div className='pb-3 pl-4 pt-5 text-3xl'>V2RAY</div>
          {ViewItems.map((item) => (
            <div
              key={item.key}
              onClick={() => {
                setView(item.key);
              }}
              className={cs(
                'w-full cursor-pointer pl-5 py-4 text-lg hover:bg-hover hover:text-white',
                view === item.key && 'text-blue',
              )}
            >
              {item.label}
            </div>
          ))}
        </div>
        {view === 'overview' && <OverviewView />}
        {view === 'settings' && <SettingsView />}
      </AntApp>
    </ConfigProvider>
  ) : null;
}

export default App;
