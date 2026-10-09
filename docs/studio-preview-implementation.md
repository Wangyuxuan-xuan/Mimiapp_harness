# STUDIO-002 工作包一交付记录

2026-10-09；执行者 `/root/studio_preview`；工作树 `D:/app/.worktrees/studio-002-preview`；分支 `codex/studio-002-preview`；基线 `ae0d8af`。授权依据为 AGENTS.md、HANDBOOK.md、TASKS.md 的 STUDIO-002，以及 B 派发的工作包一。只改新建/初始化/预览及相应测试，不推送、不集成、不读取历史配置或用户项目。

## 实现与接口

- `GET /api/bootstrap` 只等项目元数据，不等预览编译；`POST /api/projects` 返回 revision 0、ready false、initialization preparing，输入可立即使用。
- `project.initialization` 包含 state（preparing / ready / failed / interrupted）、phase，失败时 error。ready 只有真实 build 后的 Store.commit 才变 true；失败/取消没有虚假 iframe 或版本。
- 初始化复用现有 Taro 双端构建，使用独立 AbortController。制作入口仅在读取项目之前增加 `await cancelPreparation(id)`；先取消并等准备任务退出，避免旧 draft 覆盖制作结果。
- 成功发布与失败状态合并都保护项目操作锁，并重读最新元数据；run 持锁取消的路径使用明确的 cancelledByRun 标记，避免互等。close 先关闭新写入，再取消/等待初始化、制作和已接收的写入。
- 重启只自动准备没有制作任务的未就绪项目；首轮模型任务已中断时保持 revision 0 和原恢复基线。
- iframe 内容为选定宽度 × 720，手机外壳总高 784；ResizeObserver 计算外壳整体缩放，不改变内容 viewport。UI 每秒读取项目以更新准备状态，保留失败/中断说明。继续按钮尊重跨包约定 task.resumable !== false。
- 与包二/三共享文件的归属：index 的 initialize/bootstrap/create、run 上述一行、close；main 的准备轮询、PhonePreview、resumable 按钮；未改 settings/run/agent 业务逻辑。

## 先复用的核对

| 候选 | 许可与兼容 | 决定 |
| --- | --- | --- |
| [PI 官方 SDK](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/sdk.md)；本地 sdk.md | 本地 @earendil-works/pi-coding-agent 0.99.1，MIT；原 badlogic/pi-mono 地址已重定向 | 会话与 abort 用于模型；初始化是 Taro 构建，不新建 PI 会话、不改栈 |
| [Taro](https://github.com/NervJS/taro)、[H5 文档](https://docs.taro.zone/docs/h5) | 已安装 CLI 4.3.0，MIT，项目各插件同版本；官方 H5 搜索结果支持 build/watch，正文读取失败如实保留 | 复用 buildProject 双端实编译、产物检查、AbortSignal；不引入额外常驻 watch 服务 |
| [ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) | 浏览器原生 API，Electron 38 支持；无需引入依赖 | 复用原生布局观察与 CSS transform |

最小自行实现部分是项目准备状态/取消协调、UI 轮询与外壳缩放。没有安装依赖、调用付费模型或新增费用。

## 证据与验证边界

所有报告在本工作树 `test-results/`，测试数据仅自己新建，服务使用随机本机端口，执行完已关闭。

- `studio-preview-baseline.json`：旧基线实际首启动监听 16ms，但 bootstrap 等 93,966ms；新建 POST 等 28,380ms。两次均真实 H5、Weapp 和官方 WXML/WXSS 编译通过后才返回。
- `studio-preview-ui-first-attempt.json`：真实 Edge 首启动（初始示例构建被门控保持等待）195ms 可输入，新建真实项目 488ms 可输入；真实新项目双端预览 29,757ms 后出现。之后脚本因跨域直接读取 iframe Window 失败，不是产品编译失败。
- `studio-preview-ui-report.json`：修正为 frame 内执行尺寸测量，复用同一已编译新项目，没有重编译；1280×900、900×650、1600×1000 均为 375×720 内容 viewport 且完整落在可用区，320×720 同样通过。前两次复验中的100ms resize等待过短保留在 second/third-attempt 报告；最终等待浏览器观察器调度后通过。
- `studio-preview-failure-race-before.json`：临时恢复未加锁的失败状态写入片段，构建已运行时并发保存需求，门控出现状态覆盖并超时；finally 已恢复修复源码。工具片段边界错误另存 tooling-error，不当作缺陷复现。
- `node --test --test-force-exit --test-timeout=30000 tests/studio-preview.test.mjs tests/core.test.mjs`：最终 26/26，通过8项本包门控（首屏、取消/制作、关闭/重开、失败、创建中关闭、提交前关闭、失败与需求并发、首轮任务恢复）及既有核心检查。
- `node --test --test-force-exit --test-timeout=30000 tests/harness.test.mjs tests/desktop-close.test.mjs tests/security-boundary.test.mjs tests/agent-budget.test.mjs`：15/15。旧fixture原假定同步返回revision1，真实失败为 harness.test.mjs:28 的200≠400；以 waitProjectReady 显式准备已发布基线后，原功能预期未改。相同helper用于 harness-ui-check 的已就绪fixture，脚本本轮未重新执行。
- `node node_modules/vite/bin/vite.js build` 通过；`git diff --check` 通过。首次受沙箱 realpath 限制失败，正常升级后构建通过。

已实现且工程验证通过，待 B 集成与独立 QA。上述不是最终桌面包、真实模型全流程或微信真机结论。工作包1的真实编译没有使用模型三次预算，也没有因尺寸脚本失败重编译小程序。

## 恢复与交接

继续负责人 B；QA 从冻结提交和上述报告接续，重点核对正常界面新建、发送与初始化交叉、失败/退出和内容尺寸。临时 `.test-preview-*`、`.test-data-preview-*`、test-results、dist 绝不纳入提交，提交只用明确源码/测试/脚本/本记录清单。
