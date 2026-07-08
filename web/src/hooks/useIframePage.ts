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

    // Attach hashchange/popstate listeners so SPA navigations inside the
    // iframe (Axure/Mockplus) are picked up immediately instead of waiting
    // for the next poll. Re-attached on each load because cross-document
    // navigation swaps the iframe's Window.
    const attach = () => {
      extractPageId();
      try {
        const win = iframe.contentWindow;
        win?.addEventListener('hashchange', extractPageId);
        win?.addEventListener('popstate', extractPageId);
      } catch {}
    };

    iframe.addEventListener('load', attach);
    attach();

    // Fallback poll (guard: no re-render when href is unchanged) for any
    // navigation the events above miss.
    const interval = setInterval(extractPageId, 1500);

    return () => {
      iframe.removeEventListener('load', attach);
      clearInterval(interval);
      try {
        iframe.contentWindow?.removeEventListener('hashchange', extractPageId);
        iframe.contentWindow?.removeEventListener('popstate', extractPageId);
      } catch {}
    };
  }, [iframeRef]);

  return pageId;
}
