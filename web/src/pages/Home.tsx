import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Breadcrumb, Row, Col, Spin, Empty, Typography } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { browse, type BrowseResponse } from '../api';
import PrototypeCard from '../components/PrototypeCard';

const { Title, Text } = Typography;

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = decodeURIComponent(location.pathname.replace(/^\/browse\/?/, '').replace(/^\//, ''));
  const isRoot = !currentPath;

  const [data, setData] = useState<BrowseResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    browse(currentPath)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentPath]);

  const handleItemClick = (item: BrowseResponse['items'][0]) => {
    if (item.type === 'folder') {
      navigate(`/browse/${item.path}`);
    } else {
      navigate(`/preview/${item.path}`);
    }
  };

  const breadcrumbItems = (data?.breadcrumbs ?? []).map((crumb, idx) => ({
    key: idx,
    title: idx === 0 ? (
      <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <HomeOutlined /> {crumb.name}
      </span>
    ) : (
      <span
        onClick={() => navigate(crumb.path ? `/browse/${crumb.path}` : '/')}
        style={{ cursor: 'pointer' }}
      >
        {crumb.name}
      </span>
    ),
  }));

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 200 }}>
        <Spin size="large" />
      </div>
    );
  }

  const pageTitle = data?.breadcrumbs?.length && data.breadcrumbs.length > 1
    ? data.breadcrumbs[data.breadcrumbs.length - 1].name
    : null;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      {/* Header area */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: isRoot ? '48px 24px 40px' : '24px 24px 20px',
        transition: 'padding 0.3s',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {isRoot ? (
            <>
              <Title level={2} style={{ color: '#fff', marginBottom: 4, fontWeight: 700, letterSpacing: 1 }}>
                Seclead-RP
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                本地原型在线查看及评论
              </Text>
            </>
          ) : (
            <>
              <Breadcrumb items={breadcrumbItems} style={{ marginBottom: 8 }}
                separator={<span style={{ color: 'rgba(255,255,255,0.4)' }}>/</span>}
              />
              <Title level={4} style={{ color: '#fff', marginBottom: 0 }}>
                {pageTitle}
              </Title>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 48px' }}>
        {data?.items.length === 0 ? (
          <Empty description="此目录下没有原型或子文件夹" style={{ paddingTop: 80 }} />
        ) : (
          <Row gutter={[16, 16]}>
            {data?.items.map((item) => (
              <Col key={item.path} xs={24} sm={12} lg={8}>
                <PrototypeCard item={item} onClick={() => handleItemClick(item)} />
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
}
