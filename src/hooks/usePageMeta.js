import { useEffect } from 'react';

function setTag(tag, key, value, attr, content) {
  let el = document.head.querySelector(`${tag}[${key}="${value}"]`);
  if (!el) {
    el = document.createElement(tag);
    el.setAttribute(key, value);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, content);
}

export function usePageMeta({ title, description, path = '/', noindex = false }) {
  useEffect(() => {
    const base = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/+$/, '');
    const url = base + path;
    document.title = title;
    setTag('meta', 'name', 'description', 'content', description);
    setTag('link', 'rel', 'canonical', 'href', url);
    setTag('meta', 'name', 'robots', 'content', noindex ? 'noindex,follow' : 'index,follow');
    setTag('meta', 'property', 'og:title', 'content', title);
    setTag('meta', 'property', 'og:description', 'content', description);
    setTag('meta', 'property', 'og:url', 'content', url);
  }, [title, description, path, noindex]);
}
