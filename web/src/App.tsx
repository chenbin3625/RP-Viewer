import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Spin, ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Home from './pages/Home';

// Preview (and its comment components) is split into a separate chunk so the
// initial Home load is lighter.
const Preview = lazy(() => import('./pages/Preview'));

const fallback = (
  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 200 }}>
    <Spin size="large" />
  </div>
);

// Theme tokens - kept in sync with the CSS variables in index.css.
const theme = {
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 10,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
  },
  components: {
    Card: {
      borderRadiusLG: 12,
    },
    Button: {
      borderRadius: 8,
    },
  },
};

export default function App() {
  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <AntdApp>
        <HashRouter>
          <Suspense fallback={fallback}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/browse/*" element={<Home />} />
              <Route path="/preview/*" element={<Preview />} />
            </Routes>
          </Suspense>
        </HashRouter>
      </AntdApp>
    </ConfigProvider>
  );
}
