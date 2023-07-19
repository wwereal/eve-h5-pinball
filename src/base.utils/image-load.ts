const MAX_RETRY_COUNT = 3;
const RETRY_DELAY = 500;

function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            resolve(img);
        };
        img.onerror = () => {
            console.log('=== load img error ===', img.src);
            reject({ img, url, maxErrorCount: MAX_RETRY_COUNT });
        };
        img.src = url;
    });
}

