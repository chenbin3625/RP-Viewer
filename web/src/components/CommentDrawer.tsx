import { useEffect } from 'react';
import { Drawer, List, Typography, Tag, Space, Empty, Badge } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import type { Comment } from '../api';

const { Text, Paragraph } = Typography;

interface CommentDrawerProps {
  open: boolean;
  onClose: () => void;
  allComments: Comment[];
  onNavigate: (comment: Comment) => void;
  onRefresh: () => void;
}

interface PageGroup {
  pageId: string;
  comments: Comment[];
}

export default function CommentDrawer({ open, onClose, allComments, onNavigate, onRefresh }: CommentDrawerProps) {
  useEffect(() => {
    if (open) onRefresh();
  }, [open, onRefresh]);

  // Group by pageId
  const groups: PageGroup[] = [];
  const groupMap = new Map<string, Comment[]>();
  for (const c of allComments) {
    if (!groupMap.has(c.pageId)) groupMap.set(c.pageId, []);
    groupMap.get(c.pageId)!.push(c);
  }
  for (const [pageId, comments] of groupMap) {
    groups.push({ pageId, comments: comments.sort((a, b) => a.createdAt.localeCompare(b.createdAt)) });
  }
  groups.sort((a, b) => a.pageId.localeCompare(b.pageId));

  const unresolvedCount = allComments.filter((c) => !c.resolved).length;

  return (
    <Drawer
      title={
        <Space>
          <MessageOutlined />
          <span>所有评论</span>
          {unresolvedCount > 0 && (
            <Badge count={unresolvedCount} style={{ backgroundColor: '#1890ff' }} />
          )}
        </Space>
      }
      open={open}
      onClose={onClose}
      width={380}
    >
      {groups.length === 0 ? (
        <Empty description="暂无评论" />
      ) : (
        groups.map((group) => (
          <div key={group.pageId} style={{ marginBottom: 24 }}>
            <Text strong style={{ display: 'block', marginBottom: 8, color: '#8c8c8c', fontSize: 12 }}>
              {group.pageId}
            </Text>
            <List
              size="small"
              dataSource={group.comments}
              renderItem={(comment) => (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    padding: '8px 12px',
                    borderRadius: 6,
                    opacity: comment.resolved ? 0.5 : 1,
                  }}
                  onClick={() => {
                    onNavigate(comment);
                    onClose();
                  }}
                >
                  <List.Item.Meta
                    title={
                      <Space size={4}>
                        <Text strong style={{ fontSize: 13 }}>{comment.author}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {new Date(comment.createdAt).toLocaleString('zh-CN')}
                        </Text>
                        {comment.resolved && <Tag color="green" style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>已解决</Tag>}
                      </Space>
                    }
                    description={
                      <Paragraph
                        ellipsis={{ rows: 2 }}
                        style={{ marginBottom: 0, fontSize: 13 }}
                      >
                        {comment.content}
                      </Paragraph>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        ))
      )}
    </Drawer>
  );
}
