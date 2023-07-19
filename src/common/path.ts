export const resolvePublicPath = (path: string) =>
    new window.URL(`${import.meta.env.VITE_CDN_BASE.replace(/\/$/u, '')}${path}`, import.meta.url).href;
