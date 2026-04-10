import { useState, useCallback } from 'react';

const STORAGE_KEY = 'proto-viewer-nickname';

export function useNickname() {
  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || '';
  });

  const updateNickname = useCallback((name: string) => {
    localStorage.setItem(STORAGE_KEY, name);
    setNickname(name);
  }, []);

  const displayName = nickname || '匿名';

  return { nickname, displayName, updateNickname };
}
