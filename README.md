# 小芽 · Sprout Studio

用中文对话制作可交互的微信小程序。桌面工作台使用 Electron，实际制作由开源 PI Coding Agent SDK 执行；Taro 同时生成网页交互预览和微信 JS / JSON / WXML / WXSS 文件。

## 启动

Windows 桌面包：打开发布目录中的 `win-unpacked/Sprout Studio.exe`。需要保留整个 `win-unpacked` 文件夹，不能只复制 exe。

源码运行（Node.js 22 或更新版本）：

```powershell
npm ci
npm run dev
```

`npm run dev` 先构建工作台界面，再启动安全桌面入口；也可分开运行 `npm run build` 和 `npm start`。正常开发、`npm start`、桌面包和 Studio CLI 共用系统应用数据目录下的 `Sprout Studio/current`，Windows 通常为 `%APPDATA%/Sprout Studio/current`。配置保存一次后，新窗口、新项目和更换程序目录继续复用，不需要每次编译或验收重新输入。首次使用此新目录需通过正常设置入口保存；历史测试目录与旧配置不自动读取或迁移。

需要网页热更新时显式运行 `npm run dev:web`，默认本机 5173 端口，`STUDIO_PORT` 可指定其他端口。这个裸网页服务的密钥只在本次进程内存中，退出即清除，不使用正常桌面的安全配置。开发专用 `STUDIO_URL` 外接本机网页服务也使用独立窗口目录，配置由外接服务管理；它不是正常配置复用入口。

`npm run pack` 生成 Windows 目录版；构建需要先安装 Electron 官方运行时。本仓库还提供支持代理与 SHA256 校验的 `scripts/setup-electron.mjs`。CLI 使用方式见 [Studio CLI 和模型配置](docs/studio-cli.md)。

## 使用

1. 打开“模型与设置”，选择 DeepSeek，填写 API Key；可选择 DeepSeek Flash 或 V4 Pro。输入框上方也可直接切换模型。也可选择兼容 OpenAI Chat Completions 的服务。
2. 点击“测试连接”，再保存设置。
3. 新建小程序，描述页面、样式和交互。Agent 会读取源码、修改文件、运行两个平台的编译，失败时尝试修复。
4. 在右侧手机预览中点击、输入，验证实际功能。可以继续对话修改，或从版本记录恢复以前的代码。
5. 点击“导出小程序”，解压 ZIP，将包含 `project.config.json` 的目录导入微信开发者工具。`dist/weapp` 已经是编译产物，不需要先安装依赖。
6. 使用自己的真实 AppID、微信登录和官方工具完成真机预览、上传及发布。当前 demo 不代办注册、认证、审核和发布。

正常桌面入口通过系统安全存储加密保存 API Key，关闭、重开或升级后继续使用。密钥不会导出到小程序或保存到项目文件。裸网页开发入口 `npm run dev:web` 是仅内存的例外。请求模型时会向所配置服务发送对话和当前源码；更换 API 地址不会自动转发此前的密钥。

网络环境需要代理时，应用支持现有 `HTTPS_PROXY` / `HTTP_PROXY` / `NO_PROXY` 环境变量；本机工作台和预览不经过代理。

## 数据与能力范围

- 正常开发与桌面包项目均保存在 `%APPDATA%/Sprout Studio/current/workspace/projects`；显式裸网页开发 `npm run dev:web` 默认保存在源码目录的 `.studio/projects`。测试可用独立配置目录与工作区，彼此隔离。
- 每次成功制作保存不可变版本。失败或取消制作保留上一可用版本。恢复旧版会新建版本，后续历史仍在。
- 手机预览数据按项目保存，刷新以及重新打开工作台后继续存在。恢复代码不会清空用户数据。
- 当前允许编辑一个页面、项目内组件及样式；应用内多个视图可用 React 状态切换。完整多路由管理、云数据库、登录、支付、真机调试尚未集成。
- 右侧明确标为 H5 交互预览，不等同于微信运行时。微信专属 API 和最终兼容性需要在官方工具及真机验证。
- 找到本机微信开发者工具后，每次微信端构建额外运行官方 WXML/WXSS 编译器。可用 `WECHAT_DEVTOOLS_PATH` 指定安装位置。没有该工具时，仅执行 Taro 编译和产物结构检查。
- Agent 只开放 `list_files`、`read_file`、`write_file`、`build_preview` 四个工具，不开放终端。预览在独立本机来源运行，不能直接使用编辑器 API。
- 这是供本机可信使用的 demo，未经过面向恶意生成代码的安全审计，不应公开部署为多用户服务。

## 测试

```powershell
npm test
node scripts/desktop-smoke.mjs
node scripts/interactive-smoke.mjs
node scripts/interactive-smoke.mjs --packaged
node scripts/restart-smoke.mjs
node scripts/verify-weapp.mjs test-results/export-check
```

前两种开发桌面测试默认连接正在运行的 `http://127.0.0.1:5176`。交互测试会在示例里新增一个带“验证习惯”前缀的条目，执行打卡、统计、刷新与导出。打包版测试启动独立应用。测试记录放在 `test-results`。

`npm test` 包括真实 PI SDK 对本地模拟模型的工具调用测试；这个测试并不代表真实 DeepSeek 已验证。真实 DeepSeek Flash 生成、V4 Pro 继续修改以及生成应用的交互和恢复已另行通过实测。各项证据及官方模拟器剩余限制见 `TEST-STATUS.md`。

主要依赖：PI Coding Agent SDK 0.99.1、Taro 4.3.0、React 18.3.1、Electron 38.8.6。项目没有把网页 HTML 当作微信小程序导出。
