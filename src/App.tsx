import { ConfigProvider, App as AntApp, theme as AntTheme } from 'antd';
import { useEffect, useState } from 'react';
import type { Locale as AntLocale } from 'antd/es/locale';
import { themeStore } from './store/theme';
import { loadAntdLocale, localeStore } from './store/locale';
import { MessageWrapper } from './service/message';
import { Layout } from './Layout';
import { ContextMenu } from './ContextMenu';

function App() {
  const [locale] = localeStore.useStore('currentLanguage');
  const [antdLocale, setAntdLocale] = useState<AntLocale>();
  const [theme] = themeStore.useStore('actualTheme');

  useEffect(() => {
    void loadAntdLocale(locale).then((res) => setAntdLocale(res));
  }, [locale]);

  return antdLocale ? (
    <ConfigProvider
      locale={antdLocale}
      theme={{
        algorithm: theme === 'dark' ? AntTheme.darkAlgorithm : AntTheme.defaultAlgorithm,
      }}
    >
      <AntApp className='flex size-full overflow-hidden bg-background'>
        <MessageWrapper />
        <Layout />
        <ContextMenu />
      </AntApp>
    </ConfigProvider>
  ) : null;
}

export default App;
