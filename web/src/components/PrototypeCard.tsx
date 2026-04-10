import { Card, Typography, Badge } from 'antd';
import { FolderOutlined, FileOutlined } from '@ant-design/icons';
import type { BrowseItem } from '../api';

const { Text, Paragraph } = Typography;

interface Props {
  item: BrowseItem;
  onClick: () => void;
}

export default function PrototypeCard({ item, onClick }: Props) {
  const icon = item.hasCustomIcon ? (
    <img
      src={item.icon}
      alt={item.name}
      style={{ width: 48, height: 48, objectFit: 'contain' }}
    />
  ) : item.type === 'folder' ? (
    <FolderOutlined style={{ fontSize: 48, color: '#1890ff' }} />
  ) : (
    <FileOutlined style={{ fontSize: 48, color: '#52c41a' }} />
  );

  return (
    <Card
      hoverable
      onClick={onClick}
      style={{ height: '100%' }}
      styles={{ body: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24, gap: 12 } }}
    >
      {icon}
      <Text strong style={{ fontSize: 16, textAlign: 'center' }}>
        {item.name}
      </Text>
      {item.description && (
        <Paragraph
          type="secondary"
          ellipsis={{ rows: 2 }}
          style={{ textAlign: 'center', marginBottom: 0 }}
        >
          {item.description}
        </Paragraph>
      )}
      {item.type === 'folder' && item.childCount !== undefined && (
        <Badge count={`${item.childCount} 项`} style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }} />
      )}
    </Card>
  );
}
