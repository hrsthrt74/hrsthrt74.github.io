// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import './style.css'




// 要加新组件就在这里导入
import WFDownloadBtn from '../theme/components/WatchfaceDownloadButton.vue'
import Giscus from './components/Giscus.vue'
import ArticleCard from './components/ArticleCard.vue'




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
    app.component('Giscus', Giscus);
    app.component('ArticleCard', ArticleCard);
  }
}
