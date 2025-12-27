// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import './style.css'
import './custom-fonts.css'




// 要加新【全局】组件就在这里导入
import WFDownloadBtn from '../theme/components/WatchfaceDownloadButton.vue'
import Giscus from './components/Giscus.vue'
import ArticleCard from './components/ArticleCard.vue'
import CategoryEntry from './components/CategoryEntry.vue'




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
    // 全局组件在这里导出
    app.component('WFDownloadBtn', WFDownloadBtn);
    app.component('Giscus', Giscus);
    app.component('ArticleCard', ArticleCard);
    app.component('CategoryEntry', CategoryEntry);
  }
}
