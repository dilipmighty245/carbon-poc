`qrcodegen.ts` and `qrcodegen.LICENSE` are copied from the MIT-licensed Project Nayuki encoder bundled in qrcode.react v4.2.0:
https://github.com/zpao/qrcode.react/tree/v4.2.0/src/third-party/qrcodegen

The only source change is a `@ts-nocheck` directive: the upstream namespaces and parameter properties are compiled by Vite but are incompatible with this app’s `erasableSyntaxOnly` TypeScript setting.

The source is vendored because the environment's npm registry denied package access. Rendering is handled by `components/common/PassportQrCode.tsx`.
