import { useState } from 'react';
import { Card, Input, Button, Typography, Space, Tag, Divider } from 'antd';
import { CheckOutlined, DeleteOutlined, CloseOutlined, EditOutlined, SendOutlined } from '@ant-design/icons';
import type { Comment } from '../api';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface NewCommentProps {
  mode: 'new';
  xPercent: number;
  yPercent: number;
  nickname: string;
  onSubmit: (content: string) => void;
  onClose: () => void;
}

interface ViewCommentProps {
  mode: 'view';
  comment: Comment;
  nickname: string;
  onEdit: (content: string) => void;
  onResolve: () => void;
  onDelete: () => void;
  onReply: (content: string, author: string) => void;
  onClose: () => void;
}

type CommentPopoverProps = NewCommentProps | ViewCommentProps;

export default function CommentPopover(props: CommentPopoverProps) {
  const [content, setContent] = useState('');
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [replyContent, setReplyContent] = useState('');

  const style: React.CSSProperties = {
    position: 'absolute',
    zIndex: 100,
    width: 320,
    pointerEvents: 'auto',
    maxHeight: '70vh',
    overflow: 'auto',
  };

  if (props.mode === 'new') {
    const left = props.xPercent > 70 ? `${props.xPercent - 2}%` : `${props.xPercent + 2}%`;
    const translateX = props.xPercent > 70 ? 'calc(-100%)' : '0';
    style.left = left;
    style.top = `${props.yPercent}%`;
    style.transform = `translate(${translateX}, -50%)`;
  } else {
    const left = props.comment.xPercent > 70 ? `${props.comment.xPercent - 2}%` : `${props.comment.xPercent + 2}%`;
    const translateX = props.comment.xPercent > 70 ? 'calc(-100%)' : '0';
    style.left = left;
    style.top = `${props.comment.yPercent}%`;
    style.transform = `translate(${translateX}, -50%)`;
  }

  // --- New comment mode ---
  if (props.mode === 'new') {
    return (
      <Card size="small" style={style} styles={{ body: { padding: 12 } }}>
        <Space direction="vertical" style={{ width: '100%' }} size={8}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            以 {props.nickname} 身份评论
          </Text>
          <TextArea
            autoFocus
            rows={3}
            placeholder="输入评论..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && content.trim()) {
                props.onSubmit(content.trim());
              }
            }}
          />
          <Space>
            <Button type="primary" size="small" disabled={!content.trim()} onClick={() => props.onSubmit(content.trim())}>
              提交
            </Button>
            <Button size="small" onClick={props.onClose}>取消</Button>
            <Text type="secondary" style={{ fontSize: 11 }}>Ctrl+Enter</Text>
          </Space>
        </Space>
      </Card>
    );
  }

  // --- View mode ---
  const { comment, nickname, onEdit, onResolve, onDelete, onReply, onClose } = props;
  const time = new Date(comment.createdAt).toLocaleString('zh-CN');
  const replies = comment.replies || [];

  return (
    <Card
      size="small"
      style={style}
      styles={{ body: { padding: 12 } }}
      title={
        <Space size={4} style={{ fontSize: 13 }}>
          <Text strong>{comment.author}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{time}</Text>
          {comment.resolved && <Tag color="green" style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>已解决</Tag>}
        </Space>
      }
      extra={<CloseOutlined onClick={onClose} style={{ cursor: 'pointer', fontSize: 12 }} />}
    >
      {/* Main comment content — editable */}
      {editing ? (
        <Space direction="vertical" style={{ width: '100%', marginBottom: 8 }} size={4}>
          <TextArea
            autoFocus
            rows={3}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && editContent.trim()) {
                onEdit(editContent.trim());
                setEditing(false);
              }
              if (e.key === 'Escape') setEditing(false);
            }}
          />
          <Space>
            <Button type="primary" size="small" disabled={!editContent.trim()} onClick={() => { onEdit(editContent.trim()); setEditing(false); }}>
              保存
            </Button>
            <Button size="small" onClick={() => setEditing(false)}>取消</Button>
          </Space>
        </Space>
      ) : (
        <div style={{ marginBottom: 8, position: 'relative', paddingRight: 24 }}>
          <Paragraph style={{ marginBottom: 0 }}>{comment.content}</Paragraph>
          <EditOutlined
            onClick={() => { setEditContent(comment.content); setEditing(true); }}
            style={{ position: 'absolute', top: 0, right: 0, cursor: 'pointer', fontSize: 12, color: '#8c8c8c' }}
          />
        </div>
      )}

      {/* Action buttons */}
      <Space size={4} style={{ marginBottom: replies.length > 0 ? 0 : 8 }}>
        <Button size="small" icon={<CheckOutlined />} onClick={onResolve}>
          {comment.resolved ? '未解决' : '已解决'}
        </Button>
        <Button size="small" danger icon={<DeleteOutlined />} onClick={onDelete}>
          删除
        </Button>
      </Space>

      {/* Replies */}
      {replies.length > 0 && (
        <>
          <Divider style={{ margin: '8px 0' }} />
          {replies.map((r) => (
            <div key={r.id} style={{ marginBottom: 8, padding: '4px 0', borderBottom: '1px solid #f5f5f5' }}>
              <Space size={4} style={{ marginBottom: 2 }}>
                <Text strong style={{ fontSize: 12 }}>{r.author}</Text>
                <Text type="secondary" style={{ fontSize: 10 }}>{new Date(r.createdAt).toLocaleString('zh-CN')}</Text>
              </Space>
              <Paragraph style={{ marginBottom: 0, fontSize: 13 }}>{r.content}</Paragraph>
            </div>
          ))}
        </>
      )}

      {/* Reply input */}
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <TextArea
          rows={1}
          autoSize={{ minRows: 1, maxRows: 3 }}
          placeholder="回复..."
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && replyContent.trim()) {
              onReply(replyContent.trim(), nickname);
              setReplyContent('');
            }
          }}
          style={{ flex: 1 }}
        />
        <Button
          type="primary"
          size="small"
          icon={<SendOutlined />}
          disabled={!replyContent.trim()}
          onClick={() => { onReply(replyContent.trim(), nickname); setReplyContent(''); }}
          style={{ alignSelf: 'flex-end' }}
        />
      </div>
    </Card>
  );
}
