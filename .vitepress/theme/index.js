// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import './style.css'




// 要加新组件就在这里导入
import WFDownloadBtn from '../theme/components/watchface_download_button.vue'
import Highlight from './components/format/highlight.vue'
import Color from './components/format/color.vue'




// 前面别动
/** @type {import('vitepress').Theme} */
export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    })
  },


  

  enhanceApp({ app, router, siteData }) {
    // 在这里导出
    app.component('WFDownloadBtn', WFDownloadBtn);
    app.component('Highlight', Highlight);
    app.component('Color', Color)
  }
}
