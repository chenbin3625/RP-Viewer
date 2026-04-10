import { useEffect, useState, type RefObject } from 'react';

export function useIframePage(iframeRef: RefObject<HTMLIFrameElement | null>) {
  const [pageId, setPageId] = useState<string>('');

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const extractPageId = () => {
      try {
        const href = iframe.contentWindow?.location.href;
        if (href) setPageId((prev) => (prev !== href ? href : prev));
      } catch {}
    };

    iframe.addEventListener('load', extractPageId);
    const interval = setInterval(extractPageId, 500);

    return () => {
      iframe.removeEventListener('load', extractPageId);
      clearInterval(interval);
    };
  }, [iframeRef]);

  return pageId;
}
