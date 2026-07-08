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
    <FolderOutlined style={{ fontSize: 34, color: '#1677ff' }} />
  ) : (
    <FileOutlined style={{ fontSize: 34, color: '#52c41a' }} />
  );

  const hasDesc = !!item.description;
  const showBadge = item.type === 'folder' && item.childCount !== undefined;

  return (
    <Card
      hoverable
      onClick={onClick}
      className="rp-card"
      style={{ height: 76 }}
      styles={{ body: { display: 'flex', alignItems: 'stretch', padding: 0, height: '100%', position: 'relative' } }}
    >
      {showBadge && (
        <Tag
          color="blue"
          style={{
            position: 'absolute',
            top: 6,
            right: 8,
            margin: 0,
            fontSize: 11,
            lineHeight: '18px',
            padding: '0 6px',
            borderRadius: 6,
            zIndex: 1,
          }}
        >
          {item.childCount} 项
        </Tag>
      )}
      <div
        className="rp-card-icon"
        style={{
          width: 76,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <div
        style={{
          flex: 1,
          padding: '10px 16px',
          paddingRight: showBadge ? 52 : 16,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minWidth: 0,
        }}
      >
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
