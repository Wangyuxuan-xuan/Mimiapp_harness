# HARNESS-001 独立 QA 专项

日期：2026-10-09（北京时间）。负责人：B 小芽项目负责人；独立执行与报告写入者：`/root/harness_qa`，未参与本轮产品实现，非永久聊天。工程修复由 B 指定唯一产品写入者；QA 不改产品、测试源码、总台账或 Git 暂存。

## 授权与精确版本

- 用户授权见 AGENTS.md、TASKS.md：2026-10-09 用户直接批准本项目自主实施、团队派发及功能验收。A 续派本专项给 B，B 派发 QA。范围限已授权 HARNESS-001、可复现缺陷与复验；不读取 `.studio`、旧进程或真实密钥，不重启旧服务，不新增费用、部署或迁移微信。
- 初查 HEAD：`abdbe7b9ed6453962f829431f72df8b332137d38`（A 已追加管理提交）；产品基线：`f774eb3173fc015fb04b9eebc8e1a08210bdd253`。`git diff f774eb3 HEAD -- server src tests package.json package-lock.json scripts/harness-real-check.mjs scripts/harness-ui-check.mjs` 无差异。
- 最终修复产品提交：`242b6fcd40638bb30723249b1489f4ef578c009e`。C 已结束代码写入；QA 核对 `git show --stat` 的9个明确交付文件，及 `git diff HEAD -- server tests src scripts/harness-business-check.mjs docs/harness-implementation.md` 为空，提交产品树与本轮独立复验稳定工作区一致。未为纯提交重复有效运行。
- 复用历史证据，不默认重跑全部构建。QA 新测试全部位于 `test-results/qa-*` 的独立数据目录和随机本地端口，已退出自建服务。首次沙箱本地连接 EACCES 后，采用已获批准的限定测试执行；未访问外网模型。

## 新缺陷与证据

| 编号 | 优先级 | 初版实际复现 | 处理/复验 |
| --- | --- | --- | --- |
| QA-01 | P1 | 已知测试占位密钥分成两个 SSE text_delta 返回；NDJSON text 事件拼接后包含完整密钥。最终 assistant 消息虽脱敏，不能补救已发送的实时文本。`server/index.mjs` emit 仅逐段 safeText。 | 工程修复，QA 对同一 SSE 分段独立复验无泄漏。 |
| QA-02 | P1 | verify 工具返回 steps.value / storage 中的已知测试占位密钥，project.json 及版本 verification 原样持久保存；真实 Edge 填写→回显→文本断言也返回原始步骤值，故非仅替身特性。 | 工程修复 agent 结果边界递归脱敏，QA 成功提交后检查 project、版本、steps/storage 均无密钥。 |
| QA-03 | P1 | runAgent 进入 store.commit 时用等待门暂停；POST stop 返回 200 后放行提交，revision 从 1 变 2，task 为 completed，done 被发送。主动停止与提交之间缺明确原子边界。 | 工程修复，QA 复验提交前 stop200→stopped、不切版本、不发 done；restore 同窗口也不切版，已进入发布时409清楚拒绝停止。 |
| QA-04 | P2 | 真实 Edge 点击按钮，页面 200ms 后添加 `.item`；下一步 count=1 立即失败“实际0”，正常异步业务被误判错误。文本断言已有上限等待，数量断言没有。 | 工程复用有限轮询修复，QA 用原真实 Edge 脚本复验 passed。 |

可复现入口（本机临时证据，未提交）：

```powershell
node test-results/qa-special-repro.mjs
node test-results/qa-browser-repro.mjs
```

- `qa-special-report.json`：2026-10-09 12:15:02 北京时间，真实 PI SDK 0.99.1 + 本地确定性 SSE 模型、替身编译/验证；stop.commitGateEntered=true、httpStatus=200、taskState=completed、revisionBefore=1、revisionAfter=2、doneEmitted=true；joinedTextLeaksKnownFixtureKey/projectJsonLeaksKnownFixtureKey/verificationStepsLeak/verificationStorageLeak 均 true。测试原始值只为明显占位文本，未使用真实凭据。
- `qa-browser-report.json`：12:15:42 北京时间，真实无头 Edge，静态 HTML 夹具，不涉及模型/编译；echoState=passed、knownFixtureKeyInVerificationSteps=true、delayedCount.state=failed，step=2。
- 脚本用等待门放大确定的异步边界，真实 PI 与 HTTP stop 路径均执行；不宣称已验证真实商业模型或真实 Taro 编译正在提交时的竞态。

### QA 独立复验（12:21，北京时间）

- 修复复验先在 `abdbe7b` 上稳定产品工作区执行，工程明确暂停这些产品逻辑改动后 QA 执行；最终对应产品提交 `242b6fcd40638bb30723249b1489f4ef578c009e`，已核对无未提交产品差异。核心修复涉及 `server/agent.mjs`、`harness.mjs`、`index.mjs`、`store.mjs`、`verify.mjs`；新增产品测试/业务脚本及技术说明由工程明确清单提交。
- 保留原 `qa-special-repro.mjs`。修复阻止提交后旧 verification 为 undefined，原脚本仅结果读取处 TypeError；复制为 `qa-special-recheck.mjs`，只将步骤/storage 输出读取改为可选字段，触发操作、SSE 分段与 commit 等待门完全相同。`qa-special-recheck-report.json`：stop200、stopped、revision1→1、done=false、joinedTextLeaksKnownFixtureKey/projectJsonLeaksKnownFixtureKey=false。额外直接断言旧 verification 仍 undefined、无新完成回复，通过。
- `qa-persist-recheck.mjs` 使用同一模型/验证占位值，只不调用 stop 以便验收成功发布后的脱敏。`qa-persist-recheck-report.json`：completed、revision1→2、done=true，流式/steps/storage/project 均无占位密钥；直接检查保存步骤为 `[密钥已隐藏]`、verification.revision=current revision、sourceDigest=版本源码摘要，全部通过。停止后的数据不含新 verification，故不能单靠取消分支宣称持久结果脱敏通过，此成功分支补足该证据。
- 原 `qa-browser-repro.mjs` 复验：异步 count=1 现在 passed。裸 verifyPreview 仍返回真实原始 steps（含测试占位值），其职责是实际执行检查；持久/工具反馈边界由 runAgent 脱敏，已用上方成功发布分支验证。
- `qa-restore-repro.mjs` / `qa-restore-report.json`：恢复提交前等待门，stop200，restore400、revision1→1；等待门位于实际 publication 的 save 阶段时，stop409 返回“版本已开始保存，无法停止；请等待结果。”，restore200、revision1→2。与现有 UI 对非200停止结果的提示路径一致；未声称新跑完整桌面UI。
- 尚未重跑完整自动测试或三类全部真实构建，未将工程自报回归计入 QA 独立运行结果。
- 工程后续小保护由 QA 直接相称复验：已知 key 的所有二段拆分点均隐藏；在任何未完整密钥前缀处结束会保守隐藏；safeValue 对嵌套属性名和值均脱敏。另只读核对 close 对已进入不可取消发布的任务等待 finished，不再在这一阶段 abort。

### 三类业务修改补验（12:25，北京时间）

工程新增 `scripts/harness-business-check.mjs`，基线复用旧真实双端首版，每类只做一次新真实 H5 编译，通过真实 PI SDK + 本地确定性模型执行 read/write/build/verify 工具；`test-results/harness-business-report.json` passed=true。这是产物线索，QA 不据自报验收。

QA 另写本机 `test-results/qa-business-recheck.mjs`，从报告实际 root `D:/app/.test-data-business-fbeONK` 找三类 revision2；逐项读取已保存源码，核对报告 sourceDigest、project.verification.sourceDigest 与实际源码 SHA-256 一致、verification.revision=当前 revision，再使用最新 verifyPreview 独立真实 Edge 操作。未调用模型、未重新编译、不使用历史用户 storage；每次独立检查从空存储开始。

| 应用 | 独立步骤/断言 | 实际产物 | 结果 |
| --- | --- | --- | --- |
| 清单 | 新增两项=2，删除最后一项=1，再删除=0，刷新仍0；11步骤 | `2675785b-e9e9-4e19-9f50-ea8ccca1e1b4/revisions/2` | passed |
| 记录 | 新增3和2=5，将最后一条改9，合计12，刷新仍12；10步骤，比开发单条替换步骤更强，确认前一条不被覆盖 | `028fc71a-6aff-4647-b82a-d605572006f0/revisions/2` | passed |
| 计算 | 倍率2改3，输入3结果9；负数/非数输入提示，零返回0；12步骤 | `5101a2aa-0f29-4705-a377-e44b5dc47336/revisions/2` | passed |

独立结果：`test-results/qa-business-report.json`，2026-10-09 12:25:03 北京时间，3/3通过。该补验使原来“只改标题”的证据缺口获得一次明确业务修改/类的真实 H5 交互证据；不把它表述为真实商业模型开放需求测试，也不宣称业务修改版微信端已编译或运行。

## 独立审查结论与验收缺口

- 断线与停止：现有宿主 tests 已覆盖 NDJSON 断开仍继续、停止持久化、显式继续、并发启动拒绝、服务关闭、硬终止恢复、源码变化拒绝继续及次数上限；QA 阅读断言确认覆盖范围，本轮只补提交窗口新复现，未重复全部历史运行。
- 源码绑定：已读 agent 的 writes/builtAt/verifiedAt、sourceDigest、显式 revision 与 Store 版本快照，现有 tests/core 中 passed/stale/failed 用例直接断言摘要与旧版保留。这是模拟模型/替身验证器证据；未发现新的源码绑定反例，不将其扩大成真实模型功能验收。
- 三类报告：现有脚本首次生成真实业务（清单新增/数量/刷新、记录输入/求和/刷新、计算乘2），后续连续修改只更换标题并故意报错再恢复原业务。证明连续源码替换、错误反馈与交互仍可用，**不足以证明业务规则连续修改**（例如清单删除/筛选，记录编辑及更新合计，计算倍率/边界规则改变）。标题变化也没有在 modify-1/modify-2 的步骤中断言；只在回退断言初版标题。该项为验收证据缺口，需补相称业务修改证据，不能靠现有12阶段通过消除。
- 真实模型仍缺正常授权输入，未测；后续修改版本微信编译、微信模拟器/真机、安装包仍未测。H5 浏览器通过不能替代微信业务通过。

## 优先复用核对

QA 复用 B/C 已有调研，补读已装 PI 0.99.1 的 docs/sdk.md / package.json 与[官方 SDK 文档](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/sdk.md)。已装 SDK 文档说明 abort 等待模型会话空闲、SessionManager 管理持久上下文；不包含宿主版本提交原子性或已知密钥跨片段输出脱敏。因此这些修复属于最小宿主层，无须重建会话系统或新依赖。PI MIT、Playwright-core Apache-2.0 保持现有版本；官方文档可读且仓库有维护活动，仅据本地安装验证版本兼容，不依据 main 升级。数量断言可直接复用现有有限轮询/Playwright 定位能力，不引入 MCP 新服务。

## 当前状态与恢复

已完成初版独立审查、四项专项复现、三P1/一P2修复独立复验及三类新增业务修改真实 H5 独立交互复验，均在上述范围通过；对应最终产品提交 `242b6fcd40638bb30723249b1489f4ef578c009e`。QA 报告写入结束，结果交 B；源码/QA文件提交及同步由 B 安排，QA 未触碰暂存或提交。继续负责人 B；真实模型、后续微信编译/交互、真机/安装包与复杂长期任务压力仍待验证，不因本专项通过宣布整个HARNESS-001完成。恢复先读 TASKS.md、B 工作包、本报告与临时复现脚本；本机临时报告不是远端已有证据。若临时文件不在恢复机器，可依据上述明确步骤重建，不需历史用户数据。没有配置后台唤醒，不承诺结束后持续执行。
