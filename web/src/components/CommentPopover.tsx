import { useState } from 'react';
import { Card, Input, Button, Typography, Space, Tag } from 'antd';
import { CheckOutlined, DeleteOutlined, CloseOutlined } from '@ant-design/icons';
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
  onResolve: () => void;
  onDelete: () => void;
  onClose: () => void;
}

type CommentPopoverProps = NewCommentProps | ViewCommentProps;

export default function CommentPopover(props: CommentPopoverProps) {
  const [content, setContent] = useState('');

  // Position the popover to the right of the pin, within viewport
  // pointerEvents: auto ensures the card is interactive even when the overlay is pointer-events: none
  const style: React.CSSProperties = {
    position: 'absolute',
    zIndex: 100,
    width: 280,
    pointerEvents: 'auto',
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

  if (props.mode === 'new') {
    return (
      <Card
        size="small"
        style={style}
        styles={{ body: { padding: 12 } }}
      >
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
            <Button
              type="primary"
              size="small"
              disabled={!content.trim()}
              onClick={() => props.onSubmit(content.trim())}
            >
              提交
            </Button>
            <Button size="small" onClick={props.onClose}>
              取消
            </Button>
            <Text type="secondary" style={{ fontSize: 11 }}>
              Ctrl+Enter 提交
            </Text>
          </Space>
        </Space>
      </Card>
    );
  }

  // View mode
  const { comment, onResolve, onDelete, onClose } = props;
  const time = new Date(comment.createdAt).toLocaleString('zh-CN');

  return (
    <Card
      size="small"
      style={style}
      styles={{ body: { padding: 12 } }}
      title={
        <Space>
          <Text strong>{comment.author}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{time}</Text>
          {comment.resolved && <Tag color="green">已解决</Tag>}
        </Space>
      }
      extra={
        <CloseOutlined onClick={onClose} style={{ cursor: 'pointer', fontSize: 12 }} />
      }
    >
      <Paragraph style={{ marginBottom: 8 }}>{comment.content}</Paragraph>
      <Space>
        <Button
          size="small"
          icon={<CheckOutlined />}
          onClick={onResolve}
        >
          {comment.resolved ? '标记未解决' : '标记已解决'}
        </Button>
        <Button
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={onDelete}
        >
          删除
        </Button>
      </Space>
    </Card>
  );
}
