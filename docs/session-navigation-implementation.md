# STUDIO-002 会话导航修复交付

2026-10-09；唯一产品 writer `/root/studio_preview`；B `/root` 接续集成和独立 QA。授权为用户直接报告制作期间无法切换/新建及持续改进约定，B 正式续派。工作树 `D:/app/.worktrees/studio-002-session-navigation`，分支 `codex/studio-002-session-navigation`，基线 `1e86ca155e3c1378245e80c9fac7bf43b89b89a3`。只改电脑版导航，不涉及微信迁移、用户配置、真实模型、旧服务、原生应用操作或打包。

## 根因与复用选择

原 `main.jsx` 用单一 busy 禁止项目按钮，send 在等待 settings 后才占用，且 SSE/done/finally 的 updateProject 同时改变 active。草稿、状态、流文本、错误均全局，因此仅去掉 disabled 会把迟到响应显示到另一项目。预览仅看初始化信息，制作主动取消初始化后仍显示中断，未结合当前任务/已有版本。

- [React useEffect 官方文档](https://react.dev/reference/react/useEffect)：采用 effect cleanup/ignore 防迟到读取；React 18.3.1 原生能力，无新增依赖。
- [TanStack Query GitHub](https://github.com/TanStack/query)、[官方 query keys 文档](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)：MIT，仍维护并支持 React 的按项目键缓存，可完整处理请求缓存；本项目已有客户端和任务协议，本次引入及迁移成本超过窄修复收益，不采用新依赖。
- 本地 PI Coding Agent SDK 0.99.1 已提供会话/abort；导航不应调用会停止任务的 abort。继续复用服务端按 projectId 的 jobs、断开流不停止和显式 stop。Taro 4.3.0、React、Playwright 保持原栈。

最小自建部分是 React hook 的项目缓存、草稿/流状态归属、同步发送锁及 stop 等待锁；纯预览状态函数；客户端成功响应头回调。没有增加全局并发策略或额度策略。

## 代码合同与文件

- `src/use-project-sessions.jsx`：activeId 仅显式选择/新建改变；异步更新只写来源项目。prompt/busy/stopping/status/stream/logs/error 按 id 保存；send 在首 await 前捕获 id/草稿并加同步锁；切换不取消后台任务。epoch 防旧 GET 覆盖新制作结果，同 task 终态不退回 running；无 task 同版本初始化终态不被旧 preparing 覆盖。现服务初始化在活跃进程内没有重试转换。
- stop 在 preflight 取消本次发送；starting 排队，成功头后才发到服务；running 按捕获 id 请求。每项目 stop 请求到响应完整结束前锁住下一轮，避免旧 stop 停掉新任务；回执只清理捕获等待项。无本地运行项时不保留陈旧停止状态。
- `server/studio-client.mjs`：`run(id, value, {signal, onStarted})` 新增可选回调，成功 HTTP 头后、首事件前触发；旧调用兼容。服务先注册 jobs/createTask 再 flushHeaders。只有接受后才清空捕获的草稿，且不覆盖后续编辑；HTTP 拒绝保留草稿。
- `src/main.jsx`：使用 hook；项目/新建可导航；全局设置在任何项目制作/停止期间仍禁改；预览、文件读取、iframe 反馈和错误按来源归属。继续按钮保留 `task.resumable!==false` 合同。
- `src/project-preview-state.mjs`：有 ready 版本时保持 iframe 可交互并显示保存版本；无版本时制作优先于被取消的初始化；初始化失败、任务失败/停止和待准备各有真实文案，不把 revision 0 显示为可用版本。
- 后端恢复合同已核 `server/harness.mjs`：createTask 使用 randomUUID 创建新任务，push 并设置 resumedFrom；本次同 id 终态防回退不会阻止真实恢复。复用原恢复证据，无假同 id 恢复协议。

## 实测证据与范围

命令在本树执行，均独立临时 root/随机端口，受控 Agent/替身编译，不连接现有 r2/API50276 或商业模型：

```text
npm run build
node --test --test-force-exit --test-reporter=tap --test-timeout=90000 tests/session-navigation.test.mjs
node --test --test-force-exit --test-timeout=15000 tests/project-preview-state.test.mjs tests/project-run-started.test.mjs tests/studio-cli.test.mjs
```

- 最新隔离 Edge 轨迹 9/9（父测试加 8 子项），约 17.6 秒。preflight 切换/重复发送、B 草稿、新建 C、A 迟到 stream/done/error/finally、双项目运行、停止选中 id、旧 ready 版本交互均通过。新增 stop 请求与响应分别延迟、未接受 HTTP409 草稿保留、无 task 初始化失败后迟到 active GET 三项通过。
- 纯状态/客户端/既有 CLI 兼容共 9/9，约 5.7 秒。合计 18 项开发检查通过，不代表独立 QA 或真实模型完成。
- 最新 `test-results/session-navigation-report.json`：passed=true、closed=true、8 条检查；新建 C 到输入 352ms，仅替身环境交互时序。sourceHead 是测试时基线 HEAD，测试执行时源码尚未提交；最终候选由冻结提交及 dist manifest 绑定。
- 首次轨迹 `test-results/session-navigation-first-attempt.json` 保留。它实际 TAP 失败：测试 newProject helper 只等待原已可见 textarea，抢在 C 选中前输入 B。首版汇总错误地写 passed=true，不是有效通过证据。已改为等 dialog 关闭和 C 被选中；其后 6/6、最新 9/9 通过。未放宽功能断言。
- 最终 Vite 产品资源 JS `index-346f283a.js`、CSS `index-4178fc67.css`，构建 3.32 秒。冻结后生成 ignored `test-results/session-navigation-dist-manifest.json`，含精确提交、index 实际引用的三项 SHA256，供 QA 核查与复用；不重用 r2 dist。

## 性能待测与后续入口

本轮没有真实分段数字，不能将慢直接归因为 PI/Taro。初始 prepare 和首次模型制作必须分别记录：create 的模板复制/元数据保存；prepare 取消到 drain；PI 会话启动/首输出；H5 子进程 spawn→exit；Weapp spawn→exit；官方 WXML/WXSS 检查；commit 复制/保存；poll 到 iframe load。复用 builder 现 onLog 接口，后续可增加只含阶段名/单调耗时/匿名关联号的测量，不记录 prompt、代码、密钥或用户路径。

原 prepare 未传 onLog，因此现日志不足以还原分段耗时。all-projects 每秒轮询含历史数据的流量也待测；本轮采用单请求完成后再计时的轮询避免堆积，没有新增缓存协议或重写构建。历史包1首屏/真实构建时序仅属于其对应版本，不替代本次性能验收。

下一步由 B 核冻结 SHA/干净状态并放行独立 QA，复用本次 Vite 产物验证双项目导航和三项边界。开发已实现并测试，集成、独立验收和真实准备/首次制作的分段测量尚待完成；不承诺后台自动执行。
