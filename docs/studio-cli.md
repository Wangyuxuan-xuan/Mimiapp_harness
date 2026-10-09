# Studio CLI 和模型配置

正常源码桌面启动 `npm start` 与打包程序都使用系统应用数据目录下的 `Sprout Studio/current`。Windows 通常为 `%APPDATA%/Sprout Studio/current`。它不随程序安装位置、升级目录或项目变化；一个配置目录只有一个服务，可打开多个窗口。密钥使用 Electron safeStorage，在 Windows 上由系统 DPAPI 加密。此目录为本轮新增的空目录，不发现、读取或迁移历史 `.studio`、r5 测试目录或旧默认配置。首次在新版正常设置窗口保存一次，之后复用。历史程序和历史数据保持各自隔离。

开发者可显式设置绝对路径 `STUDIO_USER_DATA_DIR` 和 `STUDIO_WORKSPACE_DIR` 做隔离检查。相同配置目录不能同时运行不同工作区；另一个工作区须使用独立配置目录。开发专用 `STUDIO_URL` 连接外部本机服务时使用独立 `external-dev` 窗口目录，配置能力由那个服务决定，不能共享普通桌面的密钥；CLI 拒绝此模式。单独 `npm run dev` 仍是明确的开发内存配置入口。

在源码目录运行：

```text
npm run studio -- help
npm run studio -- config save
npm run studio -- config status
npm run studio -- projects list
npm run studio -- projects create "我的小程序"
npm run studio -- progress <项目ID>
npm run studio -- stop <项目ID>
npm run studio -- restore <项目ID> <版本ID>
npm run studio -- export <项目ID> <新的ZIP路径>
```

`config save` 和 `config test` 在真实终端逐项提问，密钥输入隐藏。自动化时由父程序通过标准输入提供配置 JSON；不要把密钥放在命令参数、环境变量、终端命令文本、文件或日志中。空密钥只在 API 地址相同时保留已有密钥。`config clear` 清除当前配置密钥。公开状态包含 `hasKey` 和保存状态，永不返回密钥。

`run <项目ID>` 从标准输入读取制作/修改需求；`resume <项目ID> <任务ID>` 继续可恢复任务；`repair <项目ID>` 修复当前版本运行错误。制作进度逐行输出 JSON，只有收到 `done` 才按制作终态处理；错误或断线返回非零退出码。断开客户端不会伪装成主动停止，可用 `progress` 核对后续状态；`stop` 才请求显式停止。

`verify <项目ID>` 从标准输入读取含 `steps` 的 JSON，调用与制作过程相同的真实浏览器检查器，结果绑定当前源码摘要和版本。它只验证用户指定的检查计划，不另起模型或复制构建流程。二维码项目须服从服务端统一的二维码场景与截图解码规则；结构、标题或方格计数不能替代扫码。恢复版本后需要重新验证。

CLI 自动连接当前配置目录的已有服务；没有服务时启动本地 Electron 服务，用同一加密入口读写配置。它只接受本机地址，检查进程存活并验证随机会话令牌；短期发现文件和 CLI 存活文件位于当前配置目录，退出清理。令牌也是本机 API 权限，文件限当前系统用户，不应分享。Windows 文件访问依赖用户应用目录的系统访问控制；跨用户共享配置目录不在支持范围内。CLI 客户端的存活文件避免一个命令完成后关闭其它命令仍在使用的服务。CLI 不需要真实模型即可查询项目或进行已有产物验证、导出。

打包目录包含 `cli` 和共享客户端。用 Node 运行包内 `resources/app/cli/studio.mjs` 时，可将非敏感的 `STUDIO_EXECUTABLE` 设为同一包内 `Sprout Studio.exe` 的绝对路径；自动启动不依赖机器额外安装 Electron。源码模式复用现有本地 Electron 依赖，无新增运行库。导出拒绝覆盖已有文件。

检查：`npm test` 包含共享业务/CLI回归。原生 Windows 检查另运行 `npm run build` 与 `npm run test:studio-native`；它会打开两个隔离桌面窗口，仅使用自造占位配置，不调用真实模型。打包程序升级与最终整体用户历程由独立 QA 在集成包上继续验收。
