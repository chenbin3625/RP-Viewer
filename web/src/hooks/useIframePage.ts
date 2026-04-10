import { useEffect, useState, type RefObject } from 'react';

export function useIframePage(iframeRef: RefObject<HTMLIFrameElement | null>, prototypePath: string) {
  const [pageId, setPageId] = useState<string>('index.html');

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Build decoded protoRoot for comparison with decoded pathname
    const protoRoot = '/prototypes/' + prototypePath + '/';

    const extractPageId = () => {
      try {
        const iframeHref = iframe.contentWindow?.location.href;
        if (!iframeHref) return;
        const url = new URL(iframeHref);
        const decodedPath = decodeURIComponent(url.pathname);
        let relative = decodedPath;
        // Strip the prototype root prefix
        const rootIdx = relative.indexOf(protoRoot);
        if (rootIdx !== -1) {
          relative = relative.substring(rootIdx + protoRoot.length);
        }
        relative = relative.replace(/^\//, '');
        if (!relative || relative === '') relative = 'index.html';
        // Append full query string and hash as page identifier
        if (url.search) relative += url.search;
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
