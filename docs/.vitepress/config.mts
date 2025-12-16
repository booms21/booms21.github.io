import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  metaChunk: true,
  title: 'DAYU 探案社😛',
  description: 'DAYU探偵社です',

  // 在head中直接添加Phaser脚本
  // head: [
  //   ['script', {
  //     src: 'https://cdn.jsdelivr.net/npm/phaser@3.86.0/dist/phaser.js',
  //     async: false // 同步加载，确保在Vue组件执行前可用
  //   }]
  // ],

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
          { text: '瞅一眼我的 b 站', link: '/bili' },
          { text: '瞅一眼我的网易云音乐', link: '/wangyi' },
          { text: '关于我 dayu', link: '/me' },
          { text: '30杀', link: '/game1' },
          { text: '地牢', link: '/game2' },
        ],
      },
    ],
    editLink: {
      pattern: 'https://github.com/vuejs/vitepress/edit/main/docs/:path',
      text: '我要说点啥（github编辑',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/booms21' },
      { icon: 'github', link: 'https://github.com/booms21' },
      { icon: 'github', link: 'https://github.com/booms21' },
      { icon: 'github', link: 'https://github.com/booms21' },
      { icon: 'github', link: 'https://github.com/booms21' },
      { icon: 'github', link: 'https://github.com/booms21' },
      { icon: 'github', link: 'https://github.com/booms21' },
      { icon: 'github', link: 'https://github.com/booms21' },
      // 可以通过将 SVG 作为字符串传递来添加自定义图标：
    ],
  },
});
