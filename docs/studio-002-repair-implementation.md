# STUDIO-002 工作包三：自主检查修复与诚实交付

2026-10-09。执行 `/root/studio_repair`，工程唯一写入者；独立 QA 由 B 另行组织。用户授权来源：AGENTS.md、TASKS.md 的 STUDIO-002，以及 B 本轮工作包；不含发布、费用、历史密钥/项目读取。目录 `D:/app/.worktrees/studio-002-repair`，分支 `codex/studio-002-repair`，基线 `ae0d8af`。

## 根因与交付门

原实现仅拒绝已有 failed 检查，漏检或修改后的过期 passed 仍能以 pending 提交。模型自由文本在服务判断前直接发送，编译及工具上限也主要在事件后/最终检查，无法可靠阻止工具副作用。

现在：制作请求缺少当前源码的编译与功能结果就由宿主在同一个 PI session 接续；最多三次接续，共享原 40 工具、3 构建、3 实际检查、10 分钟。当前源码检查通过才能提交；修改后旧结果失效。明确制作/修改但未写入源码，即使检查原页面 passed 也不能交付。纯讨论保留正常答复；意图采用有限规则，未知请求保守进入制作验收，不引入 NLU 框架。制作期间模型文案不直接展示；服务提交后产生有范围的结果文字。

工具、构建、实际验证与接续次数在副作用/下一次模型请求前预留并 await 持久保存。index 的 `onBudgetCheckpoint` 等待既有进度写队列，再保存预算，防旧进度写覆盖新预留；保存失败停止。显式恢复继承全部计数，不能隐性建立新预算；已耗尽不再恢复。耗时随状态及预留 checkpoint 保存；硬终止重启时，从最后 checkpoint 到恢复保守计费，含离线时段，因此可能提前耗尽，绝不让硬终止重获时间。停止仍有效，失败不发布新版本。

## 复用依据与取舍

- [PI 官方 SDK](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/sdk.md)、[仓库](https://github.com/earendil-works/pi)：MIT，项目已有固定 0.99.1，Node >=22.19。本地 `dist/core/agent-session.js` 已核对 prompt、steer、followUp、abort、beforeToolCall/afterToolCall。prompt 等待整轮；steer/followUp 用于流中排队；agent.continue 不能从完整最终回复直接继续，因此宿主验收后再次 session.prompt。SDK 原生 abort 等待 idle；工具包装器在 execute 前做预算硬门，事件订阅仅用于观测。复用原会话/持久化/compaction/retry，不新增模型框架。
- [Playwright 官方仓库](https://github.com/microsoft/playwright)：Apache-2.0，活跃维护；本地已有 1.63.0，继续复用 Edge 与页面交互。无需另造浏览器执行器。
- [jsQR 官方仓库](https://github.com/cozmo/jsQR)：Apache-2.0，本地成熟固定 1.4.0，发布频率较低；继续复用现有解码器，不因本轮升级。二维码生成仍用项目固定 Arase MIT 资源，模型不能写 vendor，不自写编码器。

最小自建部分是宿主的交付门、共享预算、有限接续与文字二维码的验收计划/证据规则；SDK 不理解产品需求或“可以交付”的含义。

## 统一验证接口

`server/verify.mjs` 三个同步导出，供 Agent 与独立 CLI/API 验证入口共用：

```js
verificationRequirements(project, prompt) // -> {profile:'general'|'text-qr'}
validateVerificationPlan(steps, requirements = {}) // 不满足时 throws
validateVerificationEvidence(verification, steps, requirements = {}) // passed 缺证据时 throws
```

二维码 profile 依据当前/持久明确输入、文字生成要求；样式和历史修改不会解除，仅明确放弃二维码解除，后续需求继续保持该选择。此为有限规则，不能声称自动完整理解任意产品要求。独立验证 route 应使用 `verificationRequirements(project,'')`，不接受自由请求文字绕过项目要求。

计划必须在同次调用完成短中文 fill→click→qr 等值、至少120字长文 fill→click→qr 等值、空输入 fill→click→明确反馈或之前 qr 容器 count0。无关不存在 selector 的 count0 不算空输入验收。填入后核对实际 inputValue，截断即报错。

二维码定位框必须完整位于手机375×720视口。截图取实际整 viewport 像素，再按框裁取解码，避免 locator 截图掩盖遮挡/裁切。结果保留整屏 SHA-256、框、二维码像素 SHA-256、实际解码数据及版本，并与计划逐步逐字绑定；结构格子数无法代替。没有扫描实证不能存 passed。

`runAgent` 新增可选 `onBudgetCheckpoint: async () => void`。index 仅改 import、run计时/进度持久化/预算回调/完成及失败终态，不改新建、settings、bootstrap 或独立 verify route。前端需由包一/集成人在继续按钮条件增加 `task.resumable !== false`（已通知 B）。

## 本轮工程验证与限制

- 完整现有回归一次：53/53通过；随后新增明确制作 no-op 两项，针对2/2通过。最终相关回归39/39通过，覆盖 core、agent-budget、harness、repair-loop、verify-qr，结果见本机 `test-results/studio-repair-final.tap`。
- 真实 PI SDK + 本地确定性模型：失败→模型假完成→宿主同会话接续→修复通过；build-only拒绝、过期检查拒绝、明确制作无写无检拒绝、仅检查旧页拒绝、主动停止、41st工具执行前拒绝、预算继承。
- 真子进程在 verify 执行中硬杀，再恢复核对 tool=3/build=1/verify=1 已持久预留且耗时不回退。
- 真 Edge 浏览器：短/长中文合法二维码尺寸实际整屏像素解码、内容不符和装饰方格失败；全屏白色遮挡失败、手机横向溢出失败、maxlength截断明确失败。正例 metadata 本机 `test-results/studio-repair-qr-positive.json`；反例本机 `test-results/studio-repair-qr-negative.json`。

编译/部分验证器为测试替身，浏览器反例为真实 Edge；没有调用真实商业模型，没有重新执行 Taro 全构建、微信真机或桌面打包。本次是已实现/工程自测，尚待 B 组织独立 QA，不把工程自测当验收。通用 text/count 仍只证明所列断言，不证明任意用户需求全部正确。

恢复：从本分支提交与上述报告接续；B 集成后独立 QA 优先核对统一 route、预算门、正常 UI 停止/恢复及真实生成链。本执行者不合入 main、不 push、不改总台账。
