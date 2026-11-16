# 秋の旅｜东京・京都・奈良 2026

旅行网站：<https://japan2026.wenchanyuan.com/>

## 一起修改旅行计划

网页源码是仓库根目录的 `index.html`，主页面样式和脚本包含在这个文件里，导游卡位于 `assets/`，不需要安装依赖或构建。图片独立存放在百度智能云 BOS，避免每次打开网页都下载全部图片。

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
- 在百度云控制台上传新图片并验证地址可访问后，更新 `index.html` 中对应的 `DATA.assets` 地址及图片清单，再通过 Pull Request 合并。图片可使用 WebP；含文字的票据采用无损压缩，保留原始清晰度。
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

如果发布后发现问题，在 GitHub 对引入问题的 Pull Request 使用 Revert，再合并恢复的 Pull Request；也可以在本地执行 `git revert <commit>` 并提交。恢复提交同样会自动部署。
