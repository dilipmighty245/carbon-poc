import { forwardRef, useMemo } from 'react';
import type { SVGProps } from 'react';
import qrcodegen from '../../vendor/qrcodegen';

/** Four light modules around the symbol keep the QR readable on screens and paper. */
export const PassportQrCode = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement> & { value: string; size?: number; title?: string }>(
  function PassportQrCode({ value, size = 256, title = 'Scan to view this passport', ...props }, ref) {
    const { dimension, path } = useMemo(() => {
      const qr = qrcodegen.QrCode.encodeText(value, qrcodegen.QrCode.Ecc.MEDIUM);
      const segments: string[] = [];
      for (let y = 0; y < qr.size; y++) {
        for (let x = 0; x < qr.size; x++) {
          if (qr.getModule(x, y)) segments.push(`M${x + 4},${y + 4}h1v1h-1z`);
        }
      }
      return { dimension: qr.size + 8, path: segments.join('') };
    }, [value]);
    return <svg {...props} ref={ref} xmlns="http://www.w3.org/2000/svg" width={size} height={size}
      viewBox={`0 0 ${dimension} ${dimension}`} role="img" aria-label={title} shapeRendering="crispEdges">
      <title>{title}</title>
      <rect width={dimension} height={dimension} fill="#ffffff" />
      <path d={path} fill="#000000" />
    </svg>;
  }
);
