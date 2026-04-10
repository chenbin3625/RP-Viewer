import type { Comment } from '../api';

interface CommentPinProps {
  comment: Comment;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

export default function CommentPin({ comment, index, isActive, onClick }: CommentPinProps) {
  const bgColor = comment.resolved ? '#d9d9d9' : '#1890ff';
  const borderColor = isActive ? '#000' : 'transparent';

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        position: 'absolute',
        left: `${comment.xPercent}%`,
        top: `${comment.yPercent}%`,
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
        border: `2px solid ${borderColor}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 10,
        transition: 'transform 0.15s',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translate(-50%, -50%) scale(1.2)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translate(-50%, -50%)'; }}
    >
      {index}
    </div>
  );
}
