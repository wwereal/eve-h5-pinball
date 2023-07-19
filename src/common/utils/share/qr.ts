import QRCode from 'qrcode';
import { transViewValue } from '@pet/core.mobile';

/**
 * 生成文本的图片dataURL
 *
 * @param text 文本
 * @param width 尺寸
 */
function generateQRDataURL(text: string, width: number) {
    const opts = {
        errorCorrectionLevel: 'M', // 容错率(L=7%, M=15%, Q=25%, H=30%), 7%就够用
        margin: 0,
        width: transViewValue(width, Infinity), // 优先于 scales
        color: {
            dark: '#000000FF',
            light: '#FFFFFFFF',
        },
        type: 'image/jpeg',
        rendererOpts: {
            quality: 0.92,
        },
    } as const;

    return QRCode.toDataURL(text, opts);
}

export { generateQRDataURL };
