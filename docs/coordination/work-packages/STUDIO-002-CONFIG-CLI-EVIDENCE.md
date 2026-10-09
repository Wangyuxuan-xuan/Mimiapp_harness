# STUDIO-002 工作包二实施证据

- 授权：2026-10-09 用户在 A 聊天批准三团队并行实施 STUDIO-002；范围为正常配置一次复用及共用业务逻辑的 CLI，禁止读取/复制/迁移历史 Key、vault 或用户数据。
- C 唯一代码写入者：`/root/studio_config_cli`。工作树 `D:/app/.worktrees/studio-002-config-cli`，分支 `codex/studio-002-config-cli`，起点 `ae0d8af`。交付 B `/root`，由 B 集成及独立 QA 验收；不修改总台账，不 push。
- 归属：electron、cli、server/studio-client、UI api/run/export 与配置刷新 hunk、package 脚本、打包 cli 资源清单、server/index 新 GET settings / POST verify hunk及必要 import；不改制作 run、初始化准备或其它团队主体逻辑。

## 根因与复用决策

旧开发路径为源码 `.studio/desktop`，打包路径依赖 Electron 默认名称，测试 r5 还使用单独启动目录；`STUDIO_URL` 直接外接服务，跳过本地加密入口。多个独立进程还会分别读取旧的配置内存。新实现使用全新稳定 `appData/Sprout Studio/current`，单实例锁和多窗口共享同一服务，不读取旧目录。普通源码/打包采用相同规则。

已核对本地 Electron 38 与 PI Coding Agent 0.99.1，均为 MIT，无新增依赖：

1. [Electron safeStorage 官方文档](https://www.electronjs.org/docs/latest/api/safe-storage)：采用已使用的系统加密，Windows DPAPI；不加入自制加密或明文 fallback。沿用 credential-store 的原子写入与 backend 检查。
2. [Electron 官方 app 实现文档](https://github.com/electron/electron/blob/main/docs/api/app.md) 与 [MIT 许可](https://github.com/electron/electron/blob/main/LICENSE)：采用 appData/userData 及 requestSingleInstanceLock，多窗口共用进程。最小自建为稳定新 profile、客户端发现与存活文件。
3. [PI 官方 RPC 模式](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/rpc.md) 与 [MIT 许可](https://github.com/earendil-works/pi/blob/main/LICENSE)：PI RPC可复用底层 Agent，但不包含 Studio 项目、验证、版本和导出；本项目已通过 SDK 调用 PI，因此 CLI直接调用现有 Studio HTTP 服务，完整复用当前业务，不再开第二套 Agent/构建链。SDK仍为项目固定0.99.1，未换框架或升级依赖。

## 实现与测试边界

界面与 CLI 使用同一个 fetch/进度流客户端。新增公开 settings 查询，窗口聚焦/定时及发送前刷新公开状态，密钥不回填。run/resume/repair/stop、版本恢复和导出沿用既有路由；verify调用现有真实浏览器，绑定源码摘要/版本，并响应停止与关闭。CLI export拒绝覆盖已有文件。

会话随机 token 从不打印；仅当前profile的短期发现文件，限制普通用户文件权限、检查loopback/活进程/随机token，并先认证再判断workspace冲突。退出清理；CLI只从终端隐藏输入或stdin接收模型配置，拒绝key参数。Windows目录访问由用户应用数据目录系统ACL控制。故障信息使用固定文本，不输出输入或密钥。

原生 Windows 实测发现 Electron stdin会立即EOF，使第一版headless生命周期过早退出。已换为当前profile内随机存活文件（内容仅父PID）和进程存活检查，正常app.quit排空存储；多客户端各自有存活文件，先退出者不会关闭其他客户端在使用的服务。

本包首次测试结果：Vite build通过；共享客户端/配置回归通过；原生safeStorage占位保存、CLI重开、另一profile隔离、正常UI两窗口同服务/配置、CLI附着、清除/保存后两个窗口更新、退出发现文件清理已通过。全部测试只使用新建临时profile、自造占位配置，无真实模型调用。共享业务测试构建为明确替身，但verify使用真实Edge浏览器；不以此声称真实生成或打包升级已验收。

当前第一提交尚待依赖集成：包三 `verificationRequirements(project,'')`、`validateVerificationPlan`、`validateVerificationEvidence` 将统一保护独立verify路由；包一 `cancelPreparation(id)` 由B集成后在verify进入mutation后调用，避免初始化准备覆盖digest。不得在未集成统一策略时把独立二维码验证记作完成。后续在含repair依赖的HEAD进行测试，只交付本包两个commit清单，避免重复拣选依赖提交。

恢复入口：B读取本记录与本包提交，核对共享route和UI hunk；C继续统一策略最小补丁，QALead安排独立QA。正常profile的首次真实凭据输入由用户/A通过正常加密设置入口完成，C不读取或转移历史密钥。包内资源、升级及真实模型整体用户历程仍由集成验收绑定最终版本。
