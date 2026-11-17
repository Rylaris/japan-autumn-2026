# 秋の旅｜东京・京都・奈良 2026

旅行网站：<https://japan2026.wenchanyuan.com/>

## 日常修改：本地预览后直接发布

本机目录：`/Users/wenchanyuan/Code/japan-autumn-2026`。网页源码为 `index.html`，导游卡在 `assets/`；无需安装依赖或构建。

```sh
cd /Users/wenchanyuan/Code/japan-autumn-2026
git pull --ff-only
npm run preview
```

打开 <http://127.0.0.1:8000/>，修改后刷新预览。检查城市主题、行程、照片和导游卡，确认效果后在另一个终端执行：

```sh
npm run check
git add <本次修改的文件>
git commit -m "说明本次修改"
git push origin main
```

`main` 的每次推送都会自动检查并发布到 GitHub Pages，无需 Pull Request 或网页合并。检查失败时不部署，线上保留上次成功发布的版本。本地检查与线上检查共用 `scripts/check-site.mjs`。Node.js 和 Python 3 为本地命令所需工具，无第三方依赖。

GitHub 认证只需首次完成 `gh auth login`，并让 Git 使用该登录凭据。若命令行连接 GitHub 超时，检查是否沿用了电脑现有的网络代理；本机仓库已单独配置现有代理，不影响其他仓库。

## 朋友协作

有仓库写入权限的成员也可以预览、检查后直接推送 `main`；开始修改前先拉取最新版本。多人同时修改或希望先讨论时可选用分支和 Pull Request，没有写入权限的朋友可以 Fork 后提交 Pull Request。网站公开，请只提交愿意公开的内容。

## 自动检查与发布

- 工作流：`.github/workflows/pages.yml`。
- Pull Request：检查首页、域名、引用的本地文件、内嵌 JavaScript 语法及 BOS 图片清单，不发布到正式网站。首页限 500 KB，禁止重新嵌入图片。
- 推送或合并到 `main`：检查通过后，自动部署到 GitHub Pages。
- 手动重新发布：Actions → Check and deploy travel site → Run workflow，选择 `main`。
- 发布文件仅包含 `index.html`、`CNAME`、`.nojekyll` 和可选的 `assets/`；协作文档和工作流不会作为网站内容发布。
- 新增 CSS 或 JS 文件请放在 `assets/`，并在 HTML 中使用相对路径；图片按下方流程上传 BOS。
- Pages 的发布来源使用 **GitHub Actions**。自定义域名保持 `japan2026.wenchanyuan.com`，不要改动主站域名设置。
- 不需要个人访问令牌或自建服务器密钥；工作流使用 GitHub 提供的临时发布凭证。

## 图片管理

- BOS Bucket：`wenchanyuan-travel`，华北北京，标准存储。图片通过百度云默认 HTTPS 域名 `https://wenchanyuan-travel.bj.bcebos.com/` 访问。
- `image-manifest.json` 记录景点名称、文件名、地址、大小、尺寸和 SHA-256。31 张照片及票据加上 2 个界面图片，共 33 个对象。
- 文件名采用景点或内容的英文名和内容哈希，例如 `kiyomizu-dera-7521cfad.webp`。替换图片时使用新文件名，避免旧缓存。
- 在百度云控制台上传新图片并验证地址可访问后，更新 `index.html` 中对应的 `DATA.assets` 地址及图片清单，检查和预览后直接推送 `main`。图片可使用 WebP；含文字的票据采用无损压缩，保留原始清晰度。
- 图片设置一年浏览器缓存，文件名中的内容哈希保证替换后使用新地址。首屏大图优先加载，其他图片按需加载。网站继续由 GitHub Pages 自动发布；修改已有文字或调整行程无需重新上传图片，也无需百度云密钥。
- Bucket 只用于公开展示图片，写入仍需账号授权。自动检查验证清单一致性，图片是否可访问及实际显示效果仍需在浏览器确认。

## 景点导游卡

- 打开景点照片，点击“景点导游卡”，即可在当前页面阅读；关闭后返回照片，行程位置保持不变。票据没有导游卡。
- 25 张卡片覆盖 26 张景观参考图片；山中湖两张照片共用一张卡。可在卡片内切换景点，图文随东京、京都、奈良的视觉主题变化。
- 文案、景点与图片对应关系、51 条资料来源存放于 `assets/guide-data.json`；界面逻辑与样式分别在 `assets/guides.js`、`assets/guides.css`。
- 修改史实或补充趣闻时，同时更新对应章节的 `sources`，优先采用寺社官方、政府文化资料与旅游机构来源，传说须明确标注为传说。
- 导游卡资料在首次打开景观照片时开始加载，不塞进首页。新增景观图片时需补齐卡片与图片清单；CI 会核对覆盖范围、BOS 地址、来源及外部 JavaScript 语法。

## 查看结果和恢复旧版本

在 Actions 查看运行结果。**Validate site** 和 **Deploy to GitHub Pages** 都显示成功后，网站已更新，浏览器可能还需要刷新缓存。

如果发布后发现问题，在本地执行 `git revert <commit>`，检查后推送 `main`；恢复提交同样会自动部署。

## 地名显示

- `index.html` 的 `DATA.places` 统一保存中文、日文、英文或罗马音、别名和名称来源；日程、路线、图片与地图复用同一套名称。
- 中日近似名称共用一组汉字，只补英文或罗马音；名称差异明显时分行显示三语。现有导游卡英文名称保留。城市切换和首屏已有的 Tokyo / Kyoto / Nara 保持原样。
- 导游卡通过 `placeId` 关联名称表。新增地点时补齐名称、别名、官方来源及 `same` 标记，检查会验证这些字段。
