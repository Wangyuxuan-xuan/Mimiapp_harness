# STUDIO-002 检查计划反馈与预算 v2 实施证据

历史试验记录：正常任务固定额度已按用户最新指示取消。当前实现与合同见 [持续制作实施记录](studio-continuous-implementation.md)；下文保留原试验及证据，不能作为当前限制或验收结论。

日期：2026-10-09。执行树 `D:/app/.worktrees/studio-002-repair`，分支 `codex/studio-002-feedback`，基线 `94871848c724efe7d509eb228c439ed7d1926f0f`。仅开发者局部验证，独立工程审查、QA 和新包真实任务验收由 B 接续；不把此文当总台账。交接已读 `D:/app/docs/PRODUCT.md`。未使用真实模型、Key、用户项目、Taro 重编译、主服务重启、打包或 push。

## 根因与复用边界

原读书任务在同一 PI session 已获得错误 toolResult，定位错误两次和成功子检查一次占满旧三次实际检查额度；第四次语义修正被挡。沿用 PI 0.99.1 原生同 session 工具 isError 与 prompt 接续，不新增框架、扩展或依赖，不自动改模型选择器/期待值。

核对本地 PI SDK agent-session/tool hook 与官方 [SDK 文档](https://github.com/pi-packages/earendil-works-pi/blob/main/packages/coding-agent/docs/sdk.md)、[官方仓库](https://github.com/pi-packages/earendil-works-pi)。PI 为 MIT，当前锁定 0.99.1、要求 Node >=22.19；近期官方仓库可访问，在线文档并非锁定版本兼容保证，实施以本地 API 为准。已存在的 session 持久化、原生错误回传和有限 prompt 接续足够，本轮仅自建宿主预算与验收反馈。

复用现有 Playwright 1.63 [strictness](https://playwright.dev/docs/locators#strictness) 和 [其他定位方式](https://playwright.dev/docs/other-locators)，Apache-2.0，无新增依赖。`:text-is`/`:has-text` 建议必须在当前页面唯一且属于原目标集合；候选仅帮助模型辨认，宿主不代选 first/nth。既有 jsQR 1.4（Apache-2.0）、Arase（MIT）及整手机视口二维码解码继续使用。

## 契约

`verifyPreview(dir, steps, {signal, initialStorage={}, viewport={width:375,height:720}}={})` 异步；既有 `verificationRequirements(project,prompt)`、`validateVerificationPlan(steps,requirements={})`、`validateVerificationEvidence(verification,steps,requirements={})` 同步签名不变。无需 route 新参数。

宿主结果 `failureType` 为 plan/business/runtime/external。仅真实 `verify===verifyPreview` 可提供非 business 分类；未知和注入结果一律保守 business。passed 同样消耗 business。单目标 click/fill/text/qr 使用唯一性门，多元素 count 合法。planKind 为 `selector-syntax`、`selector-ambiguous`、`selector-missing`；静态格式/断言拒绝为 kind=`plan-rejected`，无浏览器启动。语法只在 Locator.count 操作边界识别实际 parser 错误，不依据页面业务文本含 strict 字样。页面关闭/浏览器断连归 external，应用 pageerror 归 runtime，显式 abort 重新抛出。

定位失败返回 step/action/selector/matchCount、至多6个可见 candidates、唯一验证过的 suggestions。容器内多个可编辑子元素保留原 selector，并附 resolvedSelector/targetContext=editable-child。候选不读 input.value、编辑正文、HTML；所有 isContentEditable（包括空属性/plaintext-only）正文禁止读取；名称/id/testId/role 及祖先 role 限100字符，祖先提示至多2级。透明祖先过滤仅影响候选，原匹配多个仍报歧义。maxlength 实际填值不符仍 business。

Agent 实际/静态检查 toolResult 附 `budget:{version:2,used,remaining,transientRetryLimit:1}`。used 与 remaining 同键 business/plan/runs/transient/tools/builds/timeMs；快照取本次计数完成落盘后状态。transient 最大2个失败结果代表首错与一次重试，并非两次重试。实际检查前预留 verificationRuns/verifyAttempts 与 verificationInFlight{id,sourceDigest,stepsDigest,startedAt} 并 await 持久化；分类后一次保存终态计数并删除 reservation。保存失败停止，无实际副作用。

同一总任务最多3 business、3 plan、6 browser runs；仍受40tools/3build/10min/3host repair/1SDK retry共同限制。静态 plan 消耗 plan+tool、不消耗 runs。runtime/external 合计最多1次自动重试，第二个错误后不再运行。稳定 syntax/ambiguous 缓存绑定 sourceDigest+完整 stepsDigest（含全部期待值），同时保留 failedstep/action/selector/kind/error 指纹；相同源码/完整计划重跑前停止。missing/runtime/external 不进入稳定缓存。各停止理由与 resumable=false 一致，普通可修错误继续同 session。

恢复复制全部 v2 计数与历史。未知 inFlight 保守记 business 一次，清除并保存，重复恢复不再扣；旧任务无 v2 按旧 verifyAttempts 全部算 business，旧3次不可复活。运行时间在检查点累积，恢复保守计入未知停机间隔，避免硬kill退还时间。只有当前写入源码的完整所列计划通过才可提交，不能拼接多个子检查通过。原 QR 短中文/120字/空输入因果反馈、整375×720视口像素与摘要门不变。

## 开发证据与恢复入口

新增 `tests/verify-plan-feedback.test.mjs` 使用隔离本地 HTTP 假模型、真实 PI session 和真实 headless Edge。模型读取真正 toolResult suggestions 后纠正语义：2 plan + 1 passed 子检查后第4次真实运行成功，最终 business2/plan2/runs4、同一 session、无 host 再 prompt。负例覆盖错误返回按钮/盲首项、假二维码、静态计划、伪造免费分类、重复稳定计划、应用异常文字伪装、页面关闭/abort、恢复与旧任务、内部2input、截断与透明祖先。

保留初始失败 `test-results/studio-v2-initial.tap`、`studio-v2-feedback.tap`（helper旧作用域问题已修），不覆写独立 QA 原报告。修复后相关8/8为 `studio-v2-feedback-r2.tap`；扩展真实8/8为 `studio-v2-feedback-r3.tap`。硬kill落盘/恢复1/1为 `studio-v2-hard-kill.tap`；QR、空反馈与旧业务预算5/5为 `studio-v2-qr-budget.tap`。最后隐私与实时预算反馈补丁只复跑受影响3项，通过3/3，见 `studio-v2-final-feedback-r2.tap`。`studio-v2-final-feedback.tap` 为沙箱临时链接/Edge启动限制导致0/3，保留。build-required早退余额新增针对回归，前三次失败保留（r2/r3定位到helper跨try作用域），移到计数变量同作用域后 `studio-v2-build-required-r4.tap` 1/1通过；该早退仅扣既有tool不扣plan/runs。

动态正/负证据为本树 `test-results/studio-v2-semantic-positive.json` / `studio-v2-semantic-negative.json`（开发用，不替代独立QA）。原用户项目与历史失败未操作。后续 B 以冻结提交 SHA 交独立 Lead/QA 原步骤复验，原 QA 报告须保留，新报告新文件。未做新包或真实模型端到端成功声明。
