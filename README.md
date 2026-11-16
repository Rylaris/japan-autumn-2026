# 秋の旅｜东京・京都・奈良 2026

旅行网站：<https://japan2026.wenchanyuan.com/>

## 一起修改旅行计划

网页源码是仓库根目录的 `index.html`。目前图片、样式和脚本都包含在这个文件里，不需要安装依赖或构建。

1. 在 GitHub 打开 `index.html`，点击编辑按钮；也可以在本地编辑。
2. 有仓库写入权限的成员，请创建新分支并提交修改；没有写入权限的朋友，可以先 Fork 本仓库。
3. 向本仓库的 `main` 分支发起 Pull Request，说明改动内容。
4. 等待 **Validate site** 检查通过，并预览修改后的页面。仓库维护者确认后合并。
5. 合并到 `main` 后，GitHub Actions 自动检查并更新网站。检查失败时不会执行部署，线上保留上次成功发布的版本。

有写入权限的成员直接提交到 `main` 时，也会触发自动检查和发布。仓库目前没有强制的分支保护规则，因此建议团队遵循 Pull Request 流程。

网站是公开的，请只提交愿意公开的内容。需要直接写入权限时，由仓库所有者在 Settings → Collaborators 邀请指定 GitHub 用户；其他人可直接通过 Fork 和 Pull Request 协作。

## 本地预览

在仓库目录执行：

```sh
python3 -m http.server 8000
```

然后访问 <http://localhost:8000/>，检查城市、行程、图片和地图。自动检查主要覆盖文件完整性、静态文件路径和 JavaScript 语法，不能代替浏览器中的功能检查。

## 自动检查与发布

- 工作流：`.github/workflows/pages.yml`。
- Pull Request：检查首页、域名、引用的本地文件和内嵌 JavaScript 语法，不发布到正式网站。
- 推送或合并到 `main`：检查通过后，自动部署到 GitHub Pages。
- 手动重新发布：Actions → Check and deploy travel site → Run workflow，选择 `main`。
- 发布文件仅包含 `index.html`、`CNAME`、`.nojekyll` 和可选的 `assets/`；协作文档和工作流不会作为网站内容发布。
- 如需新增图片、CSS 或 JS 文件，请放在 `assets/`，并在 HTML 中使用相对路径。
- Pages 的发布来源使用 **GitHub Actions**。自定义域名保持 `japan2026.wenchanyuan.com`，不要改动主站域名设置。
- 不需要个人访问令牌或自建服务器密钥；工作流使用 GitHub 提供的临时发布凭证。

## 查看结果和恢复旧版本

在 Actions 查看运行结果。**Validate site** 和 **Deploy to GitHub Pages** 都显示成功后，网站已更新，浏览器可能还需要刷新缓存。

如果发布后发现问题，在 GitHub 对引入问题的 Pull Request 使用 Revert，再合并恢复的 Pull Request；也可以在本地执行 `git revert <commit>` 并提交。恢复提交同样会自动部署。
