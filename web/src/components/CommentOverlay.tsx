import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
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
  onEditComment: (id: string, content: string) => Promise<void>;
  onResolve: (id: string, resolved: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReply: (parentId: string, content: string, author: string) => Promise<void>;
}

export default function CommentOverlay({
  comments,
  commentMode,
  iframeRef,
  currentPageId,
  nickname,
  onAddComment,
  onEditComment,
  onResolve,
  onDelete,
  onReply,
}: CommentOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [newCommentPos, setNewCommentPos] = useState<{ xPercent: number; yPercent: number; scrollTop: number } | null>(null);
  const [iframeScrollTop, setIframeScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  // Track iframe scroll position. The functional updates only commit state when
  // the value actually changes, so the 200ms poll no longer forces a re-render
  // on every tick when the viewport is idle.
  const updateScrollInfo = useCallback(() => {
    try {
      const doc = iframeRef.current?.contentWindow?.document;
      if (!doc) return;
      const st = doc.documentElement.scrollTop || doc.body.scrollTop || 0;
      const vh = iframeRef.current?.clientHeight || 0;
      setIframeScrollTop((prev) => (prev !== st ? st : prev));
      setViewportHeight((prev) => (prev !== vh ? vh : prev));
    } catch {}
  }, [iframeRef]);

  useEffect(() => {
    updateScrollInfo();
    const interval = setInterval(updateScrollInfo, 200);

    // React to scroll events inside the iframe for immediate pin updates,
    // without waiting for the next poll tick.
    const attachScroll = () => {
      try {
        iframeRef.current?.contentWindow?.document?.addEventListener('scroll', updateScrollInfo, { passive: true });
      } catch {}
    };
    const iframe = iframeRef.current;
    iframe?.addEventListener('load', attachScroll);
    attachScroll();

    return () => {
      clearInterval(interval);
      iframe?.removeEventListener('load', attachScroll);
      try {
        iframe?.contentWindow?.document?.removeEventListener('scroll', updateScrollInfo);
      } catch {}
    };
  }, [iframeRef, updateScrollInfo]);

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
        // Mutating the iframe's document body (an external system, not React
        // state) to show a crosshair cursor in comment mode. The immutability
        // rule can't distinguish this from ref mutation, hence the disable.
        // eslint-disable-next-line react-hooks/immutability
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

  // Memoized: only recompute when scroll position, viewport, or comments
  // actually change. Keeps pin positions stable across unrelated renders.
  const visiblePins = useMemo(() => {
    return comments
      .filter((c) => {
        if (viewportHeight === 0) return true;
        const scrollDiff = Math.abs(iframeScrollTop - c.scrollTop);
        return scrollDiff < viewportHeight;
      })
      .map((c) => {
        const yOffset = viewportHeight > 0
          ? ((c.scrollTop - iframeScrollTop) / viewportHeight) * 100
          : 0;
        return { comment: c, xPercent: c.xPercent, yPercent: c.yPercent + yOffset };
      });
  }, [comments, iframeScrollTop, viewportHeight]);

  // Stable callback so memoized CommentPin children don't re-render on every
  // overlay state change.
  const handleActivate = useCallback((id: string) => {
    setNewCommentPos(null);
    setActiveCommentId((prev) => (prev === id ? null : id));
  }, []);

  const activePin = activeCommentId
    ? visiblePins.find((p) => p.comment.id === activeCommentId)
    : undefined;

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
      {visiblePins.map((pin, idx) => (
        <div key={pin.comment.id} data-comment-pin>
          <CommentPin
            comment={pin.comment}
            xPercent={pin.xPercent}
            yPercent={pin.yPercent}
            index={idx + 1}
            isActive={activeCommentId === pin.comment.id}
            onActivate={handleActivate}
          />
          {activeCommentId === pin.comment.id && activePin && (
            <CommentPopover
              mode="view"
              comment={pin.comment}
              xPercent={activePin.xPercent}
              yPercent={activePin.yPercent}
              nickname={nickname}
              onEdit={(content) => onEditComment(pin.comment.id, content)}
              onResolve={() => onResolve(pin.comment.id, !pin.comment.resolved)}
              onDelete={async () => {
                await onDelete(pin.comment.id);
                setActiveCommentId(null);
              }}
              onReply={(content, author) => onReply(pin.comment.id, content, author)}
              onClose={() => setActiveCommentId(null)}
            />
          )}
        </div>
      ))}

      {newCommentPos && (
        <>
          <div
            className="rp-new-marker"
            style={{
              position: 'absolute',
              left: `${newCommentPos.xPercent}%`,
              top: `${newCommentPos.yPercent}%`,
              transform: 'translate(-50%, -50%)',
              width: 28,
              height: 28,
              borderRadius: '50%',
              backgroundColor: 'var(--rp-primary)',
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
