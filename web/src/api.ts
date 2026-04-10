export interface Breadcrumb {
  name: string;
  path: string;
}

export interface BrowseItem {
  name: string;
  type: 'prototype' | 'folder';
  path: string;
  icon: string;
  description: string;
  hasCustomIcon: boolean;
  childCount?: number;
}

export interface BrowseResponse {
  path: string;
  breadcrumbs: Breadcrumb[];
  items: BrowseItem[];
}

export async function browse(path: string = ''): Promise<BrowseResponse> {
  const params = path ? `?path=${encodeURIComponent(path)}` : '';
  const res = await fetch(`/api/browse${params}`);
  if (!res.ok) throw new Error(`Browse failed: ${res.statusText}`);
  return res.json();
}

// --- Comment types ---

export interface Comment {
  id: string;
  pageId: string;
  xPercent: number;
  yPercent: number;
  scrollTop: number;
  content: string;
  author: string;
  createdAt: string;
  resolved: boolean;
}

export interface CommentsResponse {
  prototype: string;
  comments: Comment[];
}

export interface CreateCommentPayload {
  pageId: string;
  xPercent: number;
  yPercent: number;
  scrollTop: number;
  content: string;
  author: string;
}

export async function getComments(prototype: string, page?: string): Promise<CommentsResponse> {
  const params = new URLSearchParams({ prototype });
  if (page) params.set('page', page);
  const res = await fetch(`/api/comments?${params}`);
  if (!res.ok) throw new Error(`Get comments failed: ${res.statusText}`);
  return res.json();
}

export async function createComment(prototype: string, payload: CreateCommentPayload): Promise<Comment> {
  const params = new URLSearchParams({ prototype });
  const res = await fetch(`/api/comments?${params}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Create comment failed: ${res.statusText}`);
  return res.json();
}

export async function updateComment(prototype: string, id: string, updates: Partial<Pick<Comment, 'content' | 'resolved'>>): Promise<Comment> {
  const params = new URLSearchParams({ prototype, id });
  const res = await fetch(`/api/comments?${params}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Update comment failed: ${res.statusText}`);
  return res.json();
}

export async function deleteComment(prototype: string, id: string): Promise<void> {
  const params = new URLSearchParams({ prototype, id });
  const res = await fetch(`/api/comments?${params}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Delete comment failed: ${res.statusText}`);
}
