import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Breadcrumb, Row, Col, Spin, Empty, Typography } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { browse, type BrowseResponse } from '../api';
import PrototypeCard from '../components/PrototypeCard';

const { Title } = Typography;

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract path from URL: /browse/ProjectA/Mobile -> "ProjectA/Mobile"
  const currentPath = decodeURIComponent(location.pathname.replace(/^\/browse\/?/, '').replace(/^\//, ''));

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
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 120 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px' }}>
      <Breadcrumb items={breadcrumbItems} style={{ marginBottom: 16 }} />
      <Title level={3} style={{ marginBottom: 24 }}>
        {data?.breadcrumbs?.length && data.breadcrumbs.length > 1
          ? data.breadcrumbs[data.breadcrumbs.length - 1].name
          : '全部原型'}
      </Title>
      {data?.items.length === 0 ? (
        <Empty description="此目录下没有原型或子文件夹" />
      ) : (
        <Row gutter={[24, 24]}>
          {data?.items.map((item) => (
            <Col key={item.path} xs={24} sm={12} md={8} lg={6}>
              <PrototypeCard item={item} onClick={() => handleItemClick(item)} />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
