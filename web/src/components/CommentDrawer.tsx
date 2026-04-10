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
  label: string;
  comments: Comment[];
}

/** Turn a full iframe URL into a short readable label */
function formatPageLabel(pageId: string): string {
  try {
    const url = new URL(pageId);
    // Extract the filename from pathname (last segment)
    const segments = decodeURIComponent(url.pathname).split('/').filter(Boolean);
    const file = segments[segments.length - 1] || 'index.html';

    // Collect meaningful query params for display
    const parts: string[] = [];
    const viewMode = url.searchParams.get('view_mode');
    const screen = url.searchParams.get('screen');
    if (viewMode) parts.push(viewMode);
    if (screen) parts.push(screen);

    // If no known params, show any params briefly
    if (parts.length === 0 && url.search) {
      for (const [k, v] of url.searchParams) {
        parts.push(`${k}=${v.length > 8 ? v.slice(0, 8) + '…' : v}`);
        if (parts.length >= 2) break;
      }
    }

    const suffix = parts.length > 0 ? ` (${parts.join(', ')})` : '';
    return file + suffix;
  } catch {
    // Not a valid URL, return as-is
    return pageId;
  }
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
    groups.push({ pageId, label: formatPageLabel(pageId), comments: comments.sort((a, b) => a.createdAt.localeCompare(b.createdAt)) });
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
              {group.label}
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
