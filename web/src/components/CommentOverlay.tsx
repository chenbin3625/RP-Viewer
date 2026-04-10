import { useRef, useState, useEffect, useCallback } from 'react';
import type { Comment, CreateCommentPayload } from '../api';
import CommentPin from './CommentPin';
import CommentPopover from './CommentPopover';

interface CommentOverlayProps {
  comments: Comment[];
  commentMode: boolean;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  currentPageId: string;
  nickname: string;
  onAddComment: (payload: CreateCommentPayload) => Promise<Comment>;
  onResolve: (id: string, resolved: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function CommentOverlay({
  comments,
  commentMode,
  iframeRef,
  currentPageId,
  nickname,
  onAddComment,
  onResolve,
  onDelete,
}: CommentOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [newCommentPos, setNewCommentPos] = useState<{ xPercent: number; yPercent: number; scrollTop: number } | null>(null);
  const [iframeScrollTop, setIframeScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  // Track iframe scroll position
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const doc = iframeRef.current?.contentWindow?.document;
        if (doc) {
          setIframeScrollTop(doc.documentElement.scrollTop || doc.body.scrollTop || 0);
          setViewportHeight(iframeRef.current?.clientHeight || 0);
        }
      } catch {}
    }, 200);
    return () => clearInterval(interval);
  }, [iframeRef]);

  // Close popovers when page changes or comment mode turns off
  useEffect(() => {
    setActiveCommentId(null);
    setNewCommentPos(null);
  }, [currentPageId]);

  useEffect(() => {
    if (!commentMode) {
      setNewCommentPos(null);
    }
  }, [commentMode]);

  // Listen for clicks inside the iframe (same-origin) to create comments.
  // This way the overlay stays pointer-events:none and doesn't block
  // scrolling, middle-click, or any other interaction.
  const handleIframeClick = useCallback((e: MouseEvent) => {
    if (!commentMode) return;
    // Only left click (button 0)
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    const overlay = overlayRef.current;
    if (!overlay) return;
    const rect = overlay.getBoundingClientRect();

    // The iframe fills the overlay area, so iframe viewport coords map directly
    const xPercent = (e.clientX / rect.width) * 100;
    const yPercent = (e.clientY / rect.height) * 100;

    let scrollTop = 0;
    try {
      const doc = iframeRef.current?.contentWindow?.document;
      scrollTop = doc?.documentElement.scrollTop || doc?.body.scrollTop || 0;
    } catch {}

    setActiveCommentId(null);
    setNewCommentPos({ xPercent, yPercent, scrollTop });
  }, [commentMode, iframeRef]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const attach = () => {
      try {
        const doc = iframe.contentWindow?.document;
        if (doc) {
          doc.addEventListener('click', handleIframeClick, true);
        }
      } catch {}
    };

    // Attach on load and re-attach when page changes
    iframe.addEventListener('load', attach);
    attach();

    return () => {
      iframe.removeEventListener('load', attach);
      try {
        iframe.contentWindow?.document?.removeEventListener('click', handleIframeClick, true);
      } catch {}
    };
  }, [iframeRef, handleIframeClick]);

  // Also update cursor inside iframe when comment mode changes
  useEffect(() => {
    try {
      const doc = iframeRef.current?.contentWindow?.document;
      if (doc) {
        doc.body.style.cursor = commentMode ? 'crosshair' : '';
      }
    } catch {}
  }, [commentMode, iframeRef, currentPageId]);

  const handleSubmitNew = async (content: string) => {
    if (!newCommentPos) return;
    await onAddComment({
      pageId: currentPageId,
      xPercent: newCommentPos.xPercent,
      yPercent: newCommentPos.yPercent,
      scrollTop: newCommentPos.scrollTop,
      content,
      author: nickname,
    });
    setNewCommentPos(null);
  };

  // Filter visible comments: only show if scroll position is close enough
  const visibleComments = comments.filter((c) => {
    if (viewportHeight === 0) return true;
    const scrollDiff = Math.abs(iframeScrollTop - c.scrollTop);
    return scrollDiff < viewportHeight;
  });

  // Compute pin position adjusted for scroll
  const getPinStyle = (c: Comment) => {
    const yOffset = viewportHeight > 0
      ? ((c.scrollTop - iframeScrollTop) / viewportHeight) * 100
      : 0;
    return {
      xPercent: c.xPercent,
      yPercent: c.yPercent + yOffset,
    };
  };

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      {visibleComments.map((comment, idx) => {
        const pos = getPinStyle(comment);
        return (
          <div key={comment.id} data-comment-pin>
            <CommentPin
              comment={{ ...comment, xPercent: pos.xPercent, yPercent: pos.yPercent }}
              index={idx + 1}
              isActive={activeCommentId === comment.id}
              onClick={() => {
                setNewCommentPos(null);
                setActiveCommentId(activeCommentId === comment.id ? null : comment.id);
              }}
            />
            {activeCommentId === comment.id && (
              <CommentPopover
                mode="view"
                comment={{ ...comment, xPercent: pos.xPercent, yPercent: pos.yPercent }}
                onResolve={() => onResolve(comment.id, !comment.resolved)}
                onDelete={async () => {
                  await onDelete(comment.id);
                  setActiveCommentId(null);
                }}
                onClose={() => setActiveCommentId(null)}
              />
            )}
          </div>
        );
      })}

      {newCommentPos && (
        <>
          <div
            style={{
              position: 'absolute',
              left: `${newCommentPos.xPercent}%`,
              top: `${newCommentPos.yPercent}%`,
              transform: 'translate(-50%, -50%)',
              width: 28,
              height: 28,
              borderRadius: '50%',
              backgroundColor: '#1890ff',
              opacity: 0.6,
              pointerEvents: 'none',
            }}
          />
          <CommentPopover
            mode="new"
            xPercent={newCommentPos.xPercent}
            yPercent={newCommentPos.yPercent}
            nickname={nickname}
            onSubmit={handleSubmitNew}
            onClose={() => setNewCommentPos(null)}
          />
        </>
      )}
    </div>
  );
}
