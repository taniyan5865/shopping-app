// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/supabase', '@vite-pwa/nuxt', '@nuxt/ui'],
  css: ['~/assets/css/main.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'ja' },
      meta: [
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' }
      ],
      link: [{ rel: 'apple-touch-icon', href: '/icons/icon-192.png' }]
    }
  },

  runtimeConfig: {
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
    vapidSubject: process.env.VAPID_SUBJECT || 'mailto:example@example.com',
    cronSecret: process.env.CRON_SECRET,
    public: {
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY
    }
  },

  supabase: {
    redirect: true,
    redirectOptions: {
      login: '/join',
      callback: '/confirm',
      exclude: []
    }
  },

  pwa: {
    strategies: 'injectManifest',
    srcDir: 'service-worker',
    filename: 'sw.ts',
    injectManifest: {
      swSrc: 'service-worker/sw.ts'
    },
    registerType: 'autoUpdate',
    manifest: {
      name: '買い物管理アプリ',
      short_name: '買い物管理',
      description: '在庫・消費期限・購入リストを家族で共有管理',
      theme_color: '#16a34a',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
      ]
    },
    devOptions: {
      enabled: true,
      type: 'module'
    }
  }
})
