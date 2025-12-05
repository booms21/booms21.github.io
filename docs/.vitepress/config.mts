import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'DAYU 探案社😛',
  description: 'DAYU探偵社です',
  themeConfig: {
    search: {
      provider: 'local',
    },
    siteTitle: 'DAYU 探案社😈',
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '我想去主页！！', link: '/' },
      { text: '某个页面？', link: '/das' },
    ],

    sidebar: [
      {
        text: '5星级菜单',
        items: [
          { text: '网络齐涛', link: '/das' },
          { text: 'ARC Raiders', link: '/day1' },
          { text: '80年代楼下大爷直接编辑处', link: '/api-examples' },
        ],
      },
    ],
    editLink: {
      pattern: 'https://github.com/vuejs/vitepress/edit/main/docs/:path',
      text: '我要说点啥（github编辑',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' },
      { icon: 'twitter', link: '...' },
      // 可以通过将 SVG 作为字符串传递来添加自定义图标：
      {
        icon: {
          svg: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Dribbble</title><path d="M12...6.38z"/></svg>',
        },
        link: '...',
        // 也可以为无障碍添加一个自定义标签 (可选但推荐):
        ariaLabel: 'cool link',
      },
    ],
  },
});
