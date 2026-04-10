import { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Typography, Space, Breadcrumb, Tooltip, Badge, Input, Modal } from 'antd';
import { ArrowLeftOutlined, HomeOutlined, MessageOutlined, UnorderedListOutlined, UserOutlined } from '@ant-design/icons';
import { useIframePage } from '../hooks/useIframePage';
import { useComments } from '../hooks/useComments';
import { useNickname } from '../hooks/useNickname';
import CommentOverlay from '../components/CommentOverlay';
import CommentDrawer from '../components/CommentDrawer';
import type { Comment } from '../api';

const { Text } = Typography;

export default function Preview() {
  const navigate = useNavigate();
  const location = useLocation();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Path extraction
  const currentPath = decodeURIComponent(location.pathname.replace(/^\/preview\/?/, '').replace(/^\//, ''));
  const parts = currentPath.split('/');
  const prototypeName = parts[parts.length - 1] || 'Preview';
  const iframeSrc = '/prototypes/' + parts.map(encodeURIComponent).join('/') + '/';
  const parentPath = parts.slice(0, -1).join('/');

  // Hooks
  const pageId = useIframePage(iframeRef);
  const {
    pageComments,
    allComments,
    addComment,
    toggleResolved,
    removeComment,
    refreshAllComments,
  } = useComments(currentPath, pageId);
  const { nickname, displayName, updateNickname } = useNickname();

  // UI state
  const [commentMode, setCommentMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [nicknameModalOpen, setNicknameModalOpen] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(nickname);

  const handleBack = () => {
    navigate(parentPath ? `/browse/${parentPath}` : '/');
  };

  const handleNavigateToComment = (comment: Comment) => {
    try {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.location.href = comment.pageId;
      }
    } catch (e) {
      console.error('Failed to navigate to comment:', e);
    }
  };

  const breadcrumbItems = [
    {
      key: 'home',
      title: (
        <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <HomeOutlined /> 全部原型
        </span>
      ),
    },
    ...parts.slice(0, -1).map((part, idx) => ({
      key: idx,
      title: (
        <span
          onClick={() => navigate(`/browse/${parts.slice(0, idx + 1).join('/')}`)}
          style={{ cursor: 'pointer' }}
        >
          {part}
        </span>
      ),
    })),
    {
      key: 'current',
      title: prototypeName,
    },
  ];

  const TOOLBAR_HEIGHT = 40;
  const unresolvedCount = pageComments.filter((c) => !c.resolved).length;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div
        style={{
          height: TOOLBAR_HEIGHT,
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0',
          background: '#fff',
          flexShrink: 0,
          gap: 8,
        }}
      >
        <Space size="middle">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack}>
            返回
          </Button>
          <Text strong>{prototypeName}</Text>
        </Space>

        <div style={{ flex: 1 }} />

        {/* Comment toolbar buttons */}
        <Tooltip title={`当前身份: ${displayName}`}>
          <Button
            type="text"
            icon={<UserOutlined />}
            onClick={() => {
              setNicknameInput(nickname);
              setNicknameModalOpen(true);
            }}
            size="small"
          >
            {displayName}
          </Button>
        </Tooltip>

        <Tooltip title={commentMode ? '关闭评论模式' : '开启评论模式 (点击页面添加评论)'}>
          <Badge count={unresolvedCount} size="small" offset={[-4, 4]}>
            <Button
              type={commentMode ? 'primary' : 'default'}
              icon={<MessageOutlined />}
              onClick={() => setCommentMode(!commentMode)}
              size="small"
            >
              {commentMode ? '退出评论' : '评论'}
            </Button>
          </Badge>
        </Tooltip>

        <Tooltip title="查看所有评论">
          <Button
            type="text"
            icon={<UnorderedListOutlined />}
            onClick={() => setDrawerOpen(true)}
            size="small"
          >
            全部评论
          </Button>
        </Tooltip>

        <Breadcrumb items={breadcrumbItems} style={{ marginLeft: 8 }} />
      </div>

      {/* Iframe container with comment overlay */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          title={prototypeName}
        />
        <CommentOverlay
          comments={pageComments}
          commentMode={commentMode}
          iframeRef={iframeRef}
          currentPageId={pageId}
          nickname={displayName}
          onAddComment={addComment}
          onResolve={toggleResolved}
          onDelete={removeComment}
        />
      </div>

      {/* Comment drawer */}
      <CommentDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        allComments={allComments}
        onNavigate={handleNavigateToComment}
        onRefresh={refreshAllComments}
      />

      {/* Nickname modal */}
      <Modal
        title="设置昵称"
        open={nicknameModalOpen}
        onOk={() => {
          updateNickname(nicknameInput);
          setNicknameModalOpen(false);
        }}
        onCancel={() => setNicknameModalOpen(false)}
        okText="确认"
        cancelText="取消"
      >
        <Input
          value={nicknameInput}
          onChange={(e) => setNicknameInput(e.target.value)}
          placeholder="输入昵称 (留空则为匿名)"
          prefix={<UserOutlined />}
        />
      </Modal>
    </div>
  );
}
