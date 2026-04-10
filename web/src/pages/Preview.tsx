import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Typography, Space, Breadcrumb } from 'antd';
import { ArrowLeftOutlined, HomeOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function Preview() {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract path: /preview/ProjectA/mobile-app -> "ProjectA/mobile-app"
  const currentPath = location.pathname.replace(/^\/preview\/?/, '').replace(/^\//, '');
  const parts = currentPath.split('/');
  const prototypeName = parts[parts.length - 1] || 'Preview';

  // Build parent browse path (go up one level)
  const parentPath = parts.slice(0, -1).join('/');

  const handleBack = () => {
    navigate(parentPath ? `/browse/${parentPath}` : '/');
  };

  const breadcrumbItems = [
    {
      key: 'home',
      title: (
        <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <HomeOutlined /> 全部原型
        </span>
      ),
    },
    ...parts.slice(0, -1).map((part, idx) => ({
      key: idx,
      title: (
        <span
          onClick={() => navigate(`/browse/${parts.slice(0, idx + 1).join('/')}`)}
          style={{ cursor: 'pointer' }}
        >
          {part}
        </span>
      ),
    })),
    {
      key: 'current',
      title: prototypeName,
    },
  ];

  const TOOLBAR_HEIGHT = 56;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          height: TOOLBAR_HEIGHT,
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0',
          background: '#fff',
          flexShrink: 0,
        }}
      >
        <Space size="middle">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
          >
            返回
          </Button>
          <Text strong>{prototypeName}</Text>
        </Space>
        <Breadcrumb items={breadcrumbItems} style={{ marginLeft: 'auto' }} />
      </div>
      <iframe
        src={`/prototypes/${currentPath}/index.html`}
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
        }}
        title={prototypeName}
      />
    </div>
  );
}
