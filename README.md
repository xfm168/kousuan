# 口算闯关营 · 学前班核心版

这是一个**纯静态网页**（HTML+CSS+JS），不需要npm install、不需要任何构建工具，双击 `index.html` 就能在浏览器里直接跑起来。

## 目前已实现（学前班12关）

- ✅ 12关完整关卡（含30以内过渡关，难度平滑递进）
- ✅ 答题页固定视口布局（不滚动）
- ✅ 自定义数字键盘
- ✅ 正确/错误计数精确同步
- ✅ 错题重答（每题仅1次机会）
- ✅ 10分钟倒计时与超时处理
- ✅ 题目自动语音朗读 + 手动🔊按钮
- ✅ 连击称号系统（三连决胜→五连绝世→常胜将军→收割战神→MVP连胜王），随机鼓励语，播报完才切题
- ✅ 结算类称号（最强王者/暴击王者/疾行王者/闪电王者/绝世无双王者）
- ✅ 关卡解锁进度（本地保存，刷新页面不丢失）
- ✅ 地图页

## 还没做（后续再补）

- 一至六年级题库与关卡
- 每日排位大赛、段位系统
- 打卡、成就勋章墙
- 错题本、学习记录页
- 更精细的视觉设计与动画

---

## 部署到GitHub + Vercel（两步）

### 第一步：上传到GitHub

1. 打开 github.com，登录后点右上角 "+" → "New repository"
2. 起个名字（比如 `kousuan-app`），选择 Public，点 "Create repository"
3. 新建好的空仓库页面里会有 "uploading an existing file" 的链接，点它
4. 把这个文件夹里的所有文件（`index.html`、`style.css`、`app.js`、`data.js`、`speech.js`、`titles.js`）一次性拖进去
5. 点 "Commit changes" 完成上传

### 第二步：在Vercel导入

1. 打开 vercel.com，登录你之前已经连好GitHub的账号
2. 点 "Add New Project" → "Import Git Repository"
3. 选中刚才建的 `kousuan-app` 仓库
4. **重要**：Vercel默认会以为这是一个框架项目，如果它自动检测"Framework Preset"，选择 **"Other"**（因为这是纯静态HTML，不需要构建命令）
5. 直接点 "Deploy"，1分钟内会给你一个 `xxx.vercel.app` 的链接

拿到链接后，任何人打开浏览器直接能玩，不需要装任何App。
