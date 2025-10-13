# ArticleCard 组件使用说明

**由 Claude Sonnet 4 编写**

这是一个用于展示文章入口的卡片组件，适用于首页推荐阅读等场景。

## 组件参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `image` | String | 是 | 头图链接，建议比例 3:2 |
| `link` | String | 是 | 文章链接 |
| `title` | String | 是 | 文章标题 |
| `description` | String | 是 | 文章描述 |

## 使用方法

### 1. 单个卡片使用

```vue
<ArticleCard
  image="/path/to/image.jpg"
  link="/docs/some-article"
  title="文章标题"
  description="这是一段文章描述，会显示在卡片底部，支持多行文本显示。"
/>
```

### 2. 多个卡片响应式布局

将多个 `ArticleCard` 组件放在一个带有 `article-cards-container` 类的容器中：

```vue
<div class="article-cards-container">
  <ArticleCard
    image="/images/article1.jpg"
    link="/docs/article-1"
    title="第一篇文章"
    description="这是第一篇文章的描述"
  />
  <ArticleCard
    image="/images/article2.jpg"
    link="/docs/article-2"
    title="第二篇文章"
    description="这是第二篇文章的描述"
  />
  <ArticleCard
    image="/images/article3.jpg"
    link="/docs/article-3"
    title="第三篇文章"
    description="这是第三篇文章的描述"
  />
</div>
```

## 响应式布局

组件内置了响应式布局支持：

- **移动设备** (≤640px)：1 列
- **平板设备** (641px - 1024px)：2 列  
- **桌面设备** (1025px - 1439px)：3 列
- **大屏设备** (≥1440px)：4 列

## 样式特性

- 使用 VitePress 的 CSS 变量，完美匹配主题
- 支持亮色/暗色模式自动切换
- 悬停动画效果
- 图片懒加载
- 文本溢出省略号处理

## 注意事项

1. 建议图片比例为 3:2，以获得最佳显示效果
2. 标题会在 2 行后截断
3. 描述会在 3 行后截断
4. 确保图片路径正确，支持相对路径和绝对路径