import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'zh-CN',
  title: "Blog 74th",
  description: "hrsthrt74's Blog",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '搞机', link: '/docs/android' },
      { text: '设计', link: '/docs/design' },
      { text: '关于我', link: '/docs/about74'}
    ],

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/hrsthrt74' },
      { icon: 'bilibili', link: 'https://space.bilibili.com/12090372' },
      { icon: {svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0.4639 9.5222 39.0728 22.2568" width="38.0728px" height="20.2568px"><path fill="#98989f" fill-opacity="1.0" stroke="none" d="M 4.787 11.394 C 8.764 8.558 14.382 9.237 18.227 11.969 C 19.785 13.125 21.358 14.304 22.794 15.595 C 21.875 16.376 20.803 16.978 19.81 17.673 C 17.931 16.244 16.189 14.514 13.915 13.727 C 11.81 13.002 9.354 12.891 7.357 13.998 C 5.325 15.079 3.933 17.295 3.927 19.612 C 3.865 21.954 5.243 24.222 7.277 25.356 C 9.247 26.493 11.73 26.438 13.811 25.639 C 16.303 24.661 18.166 22.609 19.72 20.5 C 22.102 17.24 23.909 13.61 26.098 10.223 C 26.737 9.215 28.412 9.317 28.94 10.383 C 32.035 15.9 35.121 21.419 38.228 26.927 C 38.606 27.529 38.643 28.34 38.305 28.967 C 37.792 29.905 36.397 29.972 35.634 29.315 C 31.878 26.512 28.089 23.755 24.337 20.949 C 25.295 20.172 26.35 19.532 27.361 18.831 C 28.682 19.8 29.979 20.802 31.326 21.742 C 30.05 19.4 28.697 17.098 27.419 14.76 C 24.672 19.05 22.413 23.857 18.322 27.077 C 15.495 29.36 11.622 30.326 8.076 29.471 C 4.987 28.706 2.342 26.383 1.183 23.42 C -0.578 19.207 0.998 13.945 4.787 11.394 Z" stroke-width="1.0" fill-rule="0" style="" transform="matrix(1, 0, 0, 1, 0, 0)"/></svg>'}, link: 'https://www.coolapk.com/u/972147' },
    ],

    footer: {
      message: '根据 MIT 许可证发布',
      copyright: 'Copyright © 2023-present hrsthrt74'
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'medium'
      }
    },

    search: {
      provider: 'local'
    },

    docFooter: {
      prev: '← 上一页',
      next: '下一页 →'
    },

    darkModeSwitchLabel: '深色模式'
  }
})
