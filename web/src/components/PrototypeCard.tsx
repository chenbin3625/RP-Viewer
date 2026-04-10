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
      style={{ width: 40, height: 40, objectFit: 'contain' }}
    />
  ) : item.type === 'folder' ? (
    <FolderOutlined style={{ fontSize: 36, color: '#1890ff' }} />
  ) : (
    <FileOutlined style={{ fontSize: 36, color: '#52c41a' }} />
  );

  const hasDesc = !!item.description;
  const showBadge = item.type === 'folder' && item.childCount !== undefined;

  return (
    <Badge count={showBadge ? `${item.childCount} 项` : 0} size="small" offset={[-8, 8]} style={{ backgroundColor: '#1890ff' }}>
      <Card
        hoverable
        onClick={onClick}
        style={{ height: '100%' }}
        styles={{ body: { display: 'flex', alignItems: 'stretch', padding: 0, height: '100%' } }}
      >
        <div style={{
          width: 72,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRight: '1px solid #f0f0f0',
          background: '#fafafa',
        }}>
          {icon}
        </div>
        <div style={{
          flex: 1,
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: hasDesc ? 'flex-start' : 'center',
          minWidth: 0,
        }}>
          <Text strong ellipsis style={{ fontSize: 14 }}>
            {item.name}
          </Text>
          {hasDesc && (
            <Paragraph
              type="secondary"
              ellipsis={{ rows: 2 }}
              style={{ marginBottom: 0, marginTop: 4, fontSize: 12 }}
            >
              {item.description}
            </Paragraph>
          )}
        </div>
      </Card>
    </Badge>
  );
}
