import { networkInterfaces } from 'node:os'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import type { ViteDevServer } from 'vite'

// Prefer physical Wi-Fi interfaces over VPN, container, and VM adapters.
function getLanHost(): string {
  const candidates = Object.entries(networkInterfaces()).flatMap(([name, addresses]) =>
    (addresses || [])
      .filter(address => address.family === 'IPv4' && !address.internal)
      .filter(address => /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(address.address))
      .map(address => ({ name, address: address.address }))
  ).filter(({ name }) => !/^(utun|tun|tap|docker|veth|virbr|vmnet|bridge|vbox|tailscale|wg|awdl|llw)/i.test(name))

  const priority = (name: string) => /wi-?fi|wlan|^wl/i.test(name) ? 0 : /^en0$/i.test(name) ? 1 : /^(en|eth)/i.test(name) ? 2 : 3
  candidates.sort((a, b) => priority(a.name) - priority(b.name))
  return candidates[0]?.address || ''
}

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const lanHost = command === 'serve' ? getLanHost() : ''
  let devServer: ViteDevServer | undefined
  const proxy = {
    '/api': { target: env.VITE_API_PROXY_TARGET || 'http://localhost:8080', changeOrigin: true },
  }
  return {
    plugins: [react(), {
      name: 'passport-lan-origin',
      apply: 'serve',
      configureServer(server) { devServer = server },
      transformIndexHtml() {
        const address = devServer?.httpServer?.address()
        if (!lanHost || !address || typeof address === 'string') return []
        return [{ tag: 'meta', attrs: {
          name: 'passport-dev-origin',
          content: `http://${lanHost}:${address.port}`,
        }, injectTo: 'head' }]
      },
    }],
    define: {
      // Development only: production QR codes continue to use the deployed origin.
      'import.meta.env.VITE_DEV_LAN_HOST': JSON.stringify(lanHost),
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts: ['carbon-passport-dev'],
      proxy,
    },
    preview: { proxy },
  }
})
