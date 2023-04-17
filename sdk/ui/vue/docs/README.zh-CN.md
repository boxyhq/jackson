<h1 align="center"><a href="https://github.com/ElanYoung/vite-vue-js-starter-template" target="_blank">Vite 4 🚀 - Vue 3  Starter Template</a></h1>

<p align="center">
  <a href="https://nodejs.org/en/about/releases/">
    <img src="https://img.shields.io/node/v/vite.svg" alt="node compatility" />
  </a>
  <a href="https://cn.vitejs.dev" rel="nofollow">
    <img src="https://img.shields.io/badge/vite-4.1.2-3963bc.svg" alt="vite" style="max-width:100%;" />
  </a>
  <a href="https://github.com/vuejs/core">
    <img src="https://img.shields.io/badge/vue-3.2.47-brightgreen.svg" alt="vue" />
  </a>
  <a href="https://github.com/vuejs/router">
    <img src="https://img.shields.io/badge/vue--router-4.1.6-brightgreen.svg" alt="vue-router" />
  </a>
  <a href="https://github.com/vuejs/pinia">
    <img src="https://img.shields.io/badge/pinia-2.0.33-brightgreen.svg" alt="pinia" />
  </a>
  <a href="https://doc.starimmortal.com">
    <img alt="author" src="https://img.shields.io/badge/author-ElanYoung-blue.svg" />
  </a>
  <a href="https://github.com/ElanYoung/vite-vue-js-starter-template/blob/master/LICENSE">
    <img alt="LICENSE" src="https://img.shields.io/github/license/ElanYoung/vite-vue-js-starter-template.svg" />
  </a>
</p>

<p align='center'>
  <b>Vite4</b> + <b>Vue3</b> + <b>JavaScript</b> + <b>Vue Router</b> + <b>Pinia</b> + <b>TDesign</b> + <b>Less</b> + <b>Axios</b> + <b>ESLint + Stylelint + Prettier</b>
</p>

<p align='center'>
  <a href="https://elanyoung.github.io/vite-vue-js-starter-template">在线 Demo</a>
</p>

<p align="center">
  <span><a href="./README.md">English</a> | 简体中文</span>
</p>

## 特性

+ ⚡️ [Vite 4](https://cn.vitejs.dev) - 构建工具（就是快！）
+ 🖖 [Vue 3](https://cn.vuejs.org) - 渐进式 JavaScript 框架
+ 🚦 [Vue Router](https://router.vuejs.org/zh) - 官方路由管理器
+ 📦 [Pinia](https://pinia.vuejs.org/zh) - 值得你喜欢的 Vue Store
+ 💻 [TDesign](https://tdesign.tencent.com/vue-next/getting-started) - TDesign 适配桌面端的组件库
+ 🎨 [Less](https://less.bootcss.com/) - CSS 预处理器
+ 🔗 [Axios](https://axios-http.com/zh/) - 一个基于 promise 的网络请求库，可以用于浏览器和 node.js
+ 🧰 [Husky](https://typicode.github.io/husky/#/) + [Lint-Staged](https://github.com/okonet/lint-staged) - Git Hook 工具
+ 🛡️ [EditorConfig](http://editorconfig.org) + [ESLint](http://eslint.cn) + [Prettier](https://prettier.cn) + [Stylelint](https://stylelint.cn) + [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript#translation) - 代码规范
+ 🔨 [Commitizen](https://cz-git.qbb.sh/zh) + [Commitlint](https://commitlint.js.org) - 提交规范


## 编码风格

+ [ESLint](https://eslint.org/) 配置为 [eslint-config-airbnb-base](https://github.com/airbnb/javascript/tree/master/packages/eslint-config-airbnb-base)
+ [Prettier](https://prettier.io) 配置为  [eslint-config-prettier](https://github.com/prettier/eslint-config-prettier)
+ [Stylelint](https://stylelint.io) 配置为  [stylelint-config-standard](https://github.com/stylelint/stylelint-config-standard)

## 开发工具

+ [npm](https://www.npmjs.com) - 包管理器
+ [Visual Stuido Code 扩展](./.vscode/extensions.json)
  + [Vite](https://marketplace.visualstudio.com/items?itemName=antfu.vite) - 自动启动 Vite 服务器
  + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) - Vue 3 `<script setup>` IDE 支持
  + [EditorConfig for VS Code](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig) - 一套用于统一代码格式的解决方案
  + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) - 可组装的JavaScript和JSX检查工具
  + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) - 代码格式化工具
  + [StyleLint](https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint) - CSS 代码规范工具

## 现在可以试试！

> Vite3 Vue3 JavaScript Starter Template 需要 Node 版本 >= 14.18

### GitHub 模板

[使用这个模板创建仓库](https://github.com/ElanYoung/vite-vue-js-starter-template/generate).

### 克隆到本地

如果您更喜欢使用更干净的 git 历史记录手动执行此操作

```bash
# [可选] 如果您使用的是 windows 系统，需要关闭换行符自动转换
git config --global core.autocrlf input

# 克隆
git clone https://github.com/ElanYoung/vite-vue-js-starter-template

# 打开文件夹
cd vite-vue-js-starter-template

# 安装依赖
npm i
```

## 清单

使用此模板时，请尝试按照清单正确更新您自己的信息

- [ ] 在 `LICENSE` 中改变作者名
- [ ] 在 `App.vue` 中改变标题
- [ ] 在 `vite.config.js` 更改主机名
- [ ] 在 `public` 目录下改变favicon
- [ ] 移除 `.github` 文件夹中包含资助的信息
- [ ] 整理 README 并删除路由

## 使用

### 开发

> 只需要执行以下命令就可以在 http://localhost:3000 中看到

```bash
## 安装依赖
npm install

## 运行
npm run dev
```

### 构建

```bash
## 构建
npm run build
```

## 成就

🎉 被 [Awesome Vite.Js](https://github.com/vitejs/awesome-vite#vue-3) 社区收录啦~

## 开源协议

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2022 ElanYoung
