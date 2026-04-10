import { useEffect, useState, type RefObject } from 'react';

export function useIframePage(iframeRef: RefObject<HTMLIFrameElement | null>, prototypePath: string) {
  const [pageId, setPageId] = useState<string>('index.html');

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const protoRoot = '/prototypes/' + prototypePath.split('/').map(encodeURIComponent).join('/') + '/';

    const extractPageId = () => {
      try {
        const iframeHref = iframe.contentWindow?.location.href;
        if (!iframeHref) return;
        const url = new URL(iframeHref);
        let relative = decodeURIComponent(url.pathname).replace(protoRoot, '').replace(/^\//, '');
        if (!relative || relative === '' || relative === '/') relative = 'index.html';
        if (url.hash) relative += url.hash;
        setPageId((prev) => (prev !== relative ? relative : prev));
      } catch {
        // Cross-origin or not loaded yet
      }
    };

    iframe.addEventListener('load', extractPageId);
    const interval = setInterval(extractPageId, 500);

    return () => {
      iframe.removeEventListener('load', extractPageId);
      clearInterval(interval);
    };
  }, [iframeRef, prototypePath]);

  return pageId;
}
