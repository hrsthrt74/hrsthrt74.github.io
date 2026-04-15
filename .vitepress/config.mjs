import { defineConfig } from 'vitepress'
import container from 'markdown-it-container'
import { fileURLToPath, URL } from 'node:url'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  vite: {
    resolve: {
      alias: [
        {
          // 配置 @theme 别名，指向 .vitepress/theme 目录，方便在 markdown 中引用自定义组件
          find: /^@theme\/(.*)/,
          replacement: fileURLToPath(new URL('./theme/$1', import.meta.url))
        }
      ]
    }
  },

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

  markdown: {
    config: (md) => {
      // 2. 直接使用导入的 container
      md.use(container, 'ai', {
        validate(params) {
          return params.trim().match(/^ai\s*(.*)$/);
        },
        render(tokens, idx) {
          const m = tokens[idx].info.trim().match(/^ai\s*(.*)$/);
          if (tokens[idx].nesting === 1) {
            const title = m && m[1] ? m[1] : 'AI 总结';
            // 加上 VitePress 官方的 custom-block 类名可以获得基础样式
            return `<details class="details ai-container custom-block">
        <summary class="custom-block-title">${title}</summary>\n`;
          } else {
            return '</details>\n';
          }
        }
      })
    }
  },

  // 自定义主题
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config

    // 左上角那个 logo
    // logo: '../public/dai_ding.svg',

    // 顶部导航栏
    nav: [
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
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索',
            buttonAriaLabel: '搜索'
          },
          modal: {
            searchBoxPlaceholder: '搜索...',
            resetButtonTitle: '清除查询条件',
            closeButtonAriaLabel: '关闭搜索',
            noResultsText: '无法找到相关结果：',
            footer: {
              selectText: '跳转到结果',
              selectTextAriaLabel: '跳转到结果',
              navigateText: '导航',
              navigateTextAriaLabel: '导航到结果',
              closeText: '关闭',
              closeTextAriaLabel: '关闭搜索对话框'
            }
          }
        }
      }
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
      pattern: 'https://github.com/hrsthrt74/hrsthrt74.github.io/edit/main/:path',
      text: '编辑此页'
    }

  }
})
