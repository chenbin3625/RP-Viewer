import { Card, Typography, Tag } from 'antd';
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
    <Card
      hoverable
      onClick={onClick}
      style={{ height: 72 }}
      styles={{ body: { display: 'flex', alignItems: 'stretch', padding: 0, height: '100%', position: 'relative' } }}
    >
      {showBadge && (
        <Tag color="blue" style={{ position: 'absolute', top: 4, right: 4, margin: 0, fontSize: 11, lineHeight: '18px', padding: '0 6px' }}>
          {item.childCount} 项
        </Tag>
      )}
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
        padding: '8px 16px',
        paddingRight: showBadge ? 48 : 16,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: hasDesc ? 'center' : 'center',
        minWidth: 0,
      }}>
        <Text strong ellipsis style={{ fontSize: 14 }}>
          {item.name}
        </Text>
        {hasDesc && (
          <Paragraph
            type="secondary"
            ellipsis={{ rows: 1 }}
            style={{ marginBottom: 0, marginTop: 2, fontSize: 12 }}
          >
            {item.description}
          </Paragraph>
        )}
      </div>
    </Card>
  );
}
