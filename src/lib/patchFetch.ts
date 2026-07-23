import { API_BASE_URL } from './api';

if (typeof window !== 'undefined' && !window.hasOwnProperty('__beats_fetch_patched__')) {
  (window as any).__beats_fetch_patched__ = true;
  
  const originalFetch = window.fetch;
  window.fetch = async function (input, init) {
    let urlStr = '';
    if (typeof input === 'string') {
      urlStr = input;
    } else if (input instanceof URL) {
      urlStr = input.toString();
    } else if (input && typeof input === 'object' && 'url' in input) {
      urlStr = (input as any).url;
    }

    const isCapacitor = (window as any).Capacitor;
    const isBrowser = !isCapacitor;

    const isYouTubeUrl = urlStr.includes('youtubei.googleapis.com') || 
                         urlStr.includes('googleapis.com/youtubei') ||
                         urlStr.includes('youtube.com') ||
                         urlStr.includes('ytimg.com');

    if (isBrowser && isYouTubeUrl && !urlStr.includes('/api/yt/proxy')) {
      try {
        const proxyUrl = `${API_BASE_URL}/api/yt/proxy`;
        
        // Resolve method
        const method = init?.method || (input instanceof Request ? input.method : 'GET');
        
        // Re-map request headers to a plain object
        const headers: Record<string, string> = {};
        
        // Extract headers from input if it is a Request object
        if (input instanceof Request) {
          input.headers.forEach((value, key) => {
            headers[key] = value;
          });
        }
        
        // Extract headers from init (takes precedence)
        if (init?.headers) {
          if (init.headers instanceof Headers) {
            init.headers.forEach((value, key) => {
              headers[key] = value;
            });
          } else if (Array.isArray(init.headers)) {
            init.headers.forEach(([key, value]) => {
              headers[key] = value;
            });
          } else {
            Object.assign(headers, init.headers);
          }
        }

        // Extract body if present
        let body: any = null;
        if (init?.body) {
          if (typeof init.body === 'string') {
            body = init.body;
          } else if (init.body instanceof URLSearchParams) {
            body = init.body.toString();
          } else {
            body = init.body;
          }
        } else if (input instanceof Request) {
          try {
            body = await input.clone().text();
          } catch (_) {}
        }

        const response = await originalFetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: urlStr,
            method: method,
            headers: headers,
            body: body,
          }),
        });

        return response;
      } catch (proxyErr) {
        console.error('Global CORS proxy fetch failed for:', urlStr, proxyErr);
      }
    }

    return originalFetch(input, init);
  };
}
