import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({

  // 站点语言
  lang: 'zh-CN',

  // 标题
  title: "Blog 74th",

  // 描述
  description: "hrsthrt74's Blog",

  // HTML head 插入
  head: [
      // favicon
      [
        'link',
        { rel: 'icon', href: '/favicon.svg' }
      ],
      [
      'script',
      { type: 'text/javascript' },
      ` (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "t0p5gq619a");`
      ]
    ],

  // 自定义主题
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config

    // 左上角那个 logo
    // logo: '../public/dai_ding.svg',

    // 顶部导航栏
    nav: [
      { text: '🤔 杂谈', link: '/docs/misc_talk' },
      { text: '✍️ 作品', link: '/docs/creation' },
      { text: '🛠️ 技术', link: '/docs/technical' },
      { text: '🏄 关于我', link: '/docs/about74'},
      { text: '*️⃣ 传送门', link: '/docs/portal'}
    ],

/*  侧边栏

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      }
    ],

*/

    // 右上角社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/hrsthrt74' },
      { icon: 'bilibili', link: 'https://space.bilibili.com/12090372' },
    ],

    // 页脚
    footer: {
      message: '除非另有说明，本站内容采用 CC BY-NC-SA 4.0 许可协议发布',
      copyright: 'Copyright © 2023-present hrsthrt74 / Powered by VitePress'
    },

    // 最后更新于 自定义
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'medium'
      }
    },

    // 搜索
    search: {
      provider: 'local'
    },

    // 翻页 自定义文字
    docFooter: {
      prev: '← 上一页',
      next: '下一页 →'
    },

    // 深色模式 标签
    darkModeSwitchLabel: '深色模式',

    outline: {
      label: '本页目录'
    },

    returnToTopLabel: '↑ 回到顶部',

    externalLinkIcon: true,

    editLink: {
      pattern: 'https://github.com/hrsthrt74/hrsthrt74.github.io/edit/main/docs/:path',
      text: '编辑此页'
    }

  }
})
