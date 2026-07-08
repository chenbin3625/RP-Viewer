import { memo } from 'react';
import { theme } from 'antd';
import type { Comment } from '../api';

interface CommentPinProps {
  comment: Comment;
  xPercent: number;
  yPercent: number;
  index: number;
  isActive: boolean;
  onActivate: (id: string) => void;
}

function CommentPinBase({ comment, xPercent, yPercent, index, isActive, onActivate }: CommentPinProps) {
  const { token } = theme.useToken();
  const bgColor = comment.resolved ? '#bfbfbf' : token.colorPrimary;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onActivate(comment.id);
      }}
      className={`rp-pin${isActive ? ' rp-pin-active' : ''}`}
      style={{
        position: 'absolute',
        left: `${xPercent}%`,
        top: `${yPercent}%`,
        transform: 'translate(-50%, -50%)',
        width: 28,
        height: 28,
        borderRadius: '50%',
        backgroundColor: bgColor,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 'bold',
        cursor: 'pointer',
        pointerEvents: 'auto',
        border: isActive ? `2px solid ${token.colorPrimaryActive}` : '2px solid #fff',
        boxShadow: isActive
          ? '0 2px 8px rgba(0,0,0,0.25), 0 0 0 2px rgba(255,255,255,0.9)'
          : '0 2px 8px rgba(0,0,0,0.25)',
        zIndex: isActive ? 11 : 10,
        userSelect: 'none',
      }}
    >
      {index}
    </div>
  );
}

// memoized: props are stable (original comment ref + primitive x/y + stable
// onActivate callback), so pins skip re-rendering on unrelated overlay updates.
const CommentPin = memo(CommentPinBase);
export default CommentPin;
