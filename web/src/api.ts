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
