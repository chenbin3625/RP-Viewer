import { useState, useEffect, useCallback } from 'react';
import { getComments, createComment, updateComment, deleteComment, addReply, type Comment, type CreateCommentPayload } from '../api';

export function useComments(prototypePath: string, currentPageId: string) {
  const [pageComments, setPageComments] = useState<Comment[]>([]);
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshPageComments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getComments(prototypePath, currentPageId);
      setPageComments(res.comments || []);
    } catch (e) {
      console.error('Failed to load page comments:', e);
    } finally {
      setLoading(false);
    }
  }, [prototypePath, currentPageId]);

  const refreshAllComments = useCallback(async () => {
    try {
      const res = await getComments(prototypePath);
      setAllComments(res.comments || []);
    } catch (e) {
      console.error('Failed to load all comments:', e);
    }
  }, [prototypePath]);

  useEffect(() => {
    refreshPageComments();
  }, [refreshPageComments]);

  const addComment = useCallback(async (payload: CreateCommentPayload) => {
    const comment = await createComment(prototypePath, payload);
    setPageComments((prev) => [...prev, comment]);
    return comment;
  }, [prototypePath]);

  const editComment = useCallback(async (id: string, content: string) => {
    const updated = await updateComment(prototypePath, id, { content });
    setPageComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, content: updated.content } : c))
    );
  }, [prototypePath]);

  const toggleResolved = useCallback(async (id: string, resolved: boolean) => {
    await updateComment(prototypePath, id, { resolved });
    setPageComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, resolved } : c))
    );
  }, [prototypePath]);

  const removeComment = useCallback(async (id: string) => {
    await deleteComment(prototypePath, id);
    setPageComments((prev) => prev.filter((c) => c.id !== id));
  }, [prototypePath]);

  const replyToComment = useCallback(async (parentId: string, content: string, author: string) => {
    const updated = await addReply(prototypePath, parentId, content, author);
    setPageComments((prev) =>
      prev.map((c) => (c.id === parentId ? updated : c))
    );
  }, [prototypePath]);

  return {
    pageComments,
    allComments,
    loading,
    addComment,
    editComment,
    toggleResolved,
    removeComment,
    replyToComment,
    refreshPageComments,
    refreshAllComments,
  };
}
