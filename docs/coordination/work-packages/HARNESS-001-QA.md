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

## 电脑版产物独立 QA 续派

A 于2026-10-09 12:42北京时间续派 B；B 继续派本独立 QA。复用上方四缺陷/业务证据，不重复29项或整套真实编译。C 是唯一产品/打包脚本写入者；QA 只追加本报告和 `test-results/qa-desktop-*` 临时证据。约定最多30分钟、一次打包及至多一次有针对性重打，不下载新依赖、不付费模型、不发布安装/更新或触碰旧用户数据。

### 只读准备与验收设计

- 已读 `electron/main.cjs`、`scripts/package-desktop.mjs`、`repair-package-deps.mjs`、现有 `qr-desktop-cdp.mjs`、`desktop-smoke.mjs`、`packaged-build-check.mjs`。旧 smoke 固定旧 release、端口和未证明隔离的数据目录，不能代替新产物验收。
- QA 检查时管理 HEAD 为 `02064b3`，后续管理提交会变化；产品核心仍 `242b6fc`，本次桌面入口/打包修复先为 C 工作区，最终提交待登记。已告 B 核对真实提交而不以初始 HEAD 宣称产物版本。
- 复用 Electron 38 原生 `app.setPath` / `app.getPath` 和 before-quit 生命周期，以及现有 Playwright-core `_electron.launch`；读已安装 electron.d.ts，并核对[官方 app 文档](https://github.com/electron/electron/blob/main/docs/api/app.md)。无需新依赖。不能只凭 Chromium `--user-data-dir` 推断宿主 workspace 已隔离；C 已补 `STUDIO_USER_DATA_DIR` / `STUDIO_WORKSPACE_DIR` 绝对路径入口及正常退出等待 close，QA将实际核对路径。Electron MIT、Playwright Apache-2.0沿用已装版本，兼容性以实际新exe运行验证，未升级。
- 临时脚本 `test-results/qa-desktop-check.mjs` 先核对新目录 build-manifest、exe及包内 electron/server 哈希与源文件；实际启动新exe，核对 isPackaged、execPath、appPath、userData、随机服务端口和 renderer 隔离。使用新workspace，复制上轮已验收记录应用的真实H5 revision2，预置一条running任务标记；不调用模型、不重新编译。运行标记是模拟持久状态夹具，不能表述为真实模型执行中退出。
- 实际界面修改长期需求、在已有可用预览新增3和2显示合计5、查看两条版本历史，正常关闭并重新启动同一新数据目录，核对记忆/业务数据/版本持久、中断状态和显式继续入口、不自动重试。尚不点击恢复重新编译，不以旧可用应用产物声称新包编译链已通过。

### 第一次新exe实测与缺陷

- 新产物：`D:/app/release-harness-20261009/win-unpacked/Sprout Studio.exe`；manifest baseCommit=`02064b3`、productBase=`242b6fc`；本机 Electron38.8.6、electron-builder26.15.3。初包exe SHA256=`62c62d170a95aa4a3eb3df05f0d56a3654ab4344f7452e21dea1334afed7100f`，完整资源SHA清单保存在初包manifest和qa-desktop-first-report。QA核对包内 electron/server 文件的SHA256均等于manifest和C当前源文件，实际 isPackaged=true、execPath=此新exe、appPath=此新包resources/app；未拿旧release作替代。未签名exe可能跨包相同，版本绑定主要依据资源SHA与实际appPath，不仅看二进制SHA。
- QA运行目录：`D:/app/test-results/qa-desktop-r2FMVi`；userData和workspace明确落在此新目录，三个启动轮次随机服务端口，renderer nodeIntegration=false/contextIsolation=true/sandbox=true。正常关闭由 Playwright ElectronApplication.close→app.quit触发，不使用强杀。
- 基础检查通过：持久running夹具启动被诚实标记interrupted、显式继续按钮可见；界面需求查看/修正保存；已验证记录应用revision2的真实预览新增3和2显示5、两个版本历史可见；正常关闭重开需求、业务storage、旧可用revision、中断/继续状态保留，不自动重试。模型未调用，未重新编译。
- **QA-DESKTOP-01，P1，保存中的最后数据在正常关闭时丢失**：第二次启动在Electron主进程只为此新workspace的storage.json rename增加一次500ms延迟，确认已进入且尚未完成；真实iframe新增4后显示合计9，立即正常app.quit，第三次启动实际合计仍5。`startStudio.close`只等待jobs，未等待已接受的storageQueues；这不是仅静态推测，真实新exe已有确定复现。
- 证据：`test-results/qa-desktop-first-report.json`（保留初包失败），`qa-desktop-report.json` 与 `qa-desktop-storage-close.png`；delayedStorageClose expected=`结果：9`、actual=`结果：5`、passed=false。脚本 `qa-desktop-check.mjs`；所有新测试程序已退出。未操作用户数据或旧服务。
- 已报B/C建议最小修复：关闭时拒绝新存储请求，等待已接受的保存队列完成再退出；在本轮授权的一次针对性重打中验证。此时基础桌面检查已通过，但总体桌面验收未通过，不能宣布新包可靠交付。

### 唯一针对性重打与 QA 复验

- 修复：C 为 storage 在首个 await 前同步登记请求Promise，关闭时禁止新变更请求，等待已接受的 mutation/storage 请求和保存队列，再结束HTTP服务；Electron正常退出等待该 close。QA只读核对登记时机避免 get 与 enqueue 之间的关闭竞态，产品实现仍由唯一 C 写入。
- 最后一次新产物：`D:/app/release-harness-20261009-r2/win-unpacked/Sprout Studio.exe`；第一次目录未覆盖。QA使用原 `qa-desktop-check.mjs` 的同一触发步骤，新隔离目录 `D:/app/test-results/qa-desktop-uuERjj`，实际启动此新exe三次，server/electron资源SHA与此包manifest及当时源码一致。未重新编译生成应用、未调用模型。
- 独立结果 `test-results/qa-desktop-report.json` passed=true：实际新exe/包内资源/明确userData/workspace/随机端口/renderer隔离；需求查看修正；旧可用revision2和两条历史；正常关闭重开记忆/业务storage/中断继续入口且不自动重试，均通过。
- 原P1步骤复验：storage.json rename同样500ms延迟门，关窗前确认进入且未完成，真实预览合计9，正常app.quit后第三次启动实际仍9。`delayedStorageClose.expected=actual=结果：9`、passed=true；**QA-DESKTOP-01 在本限定边界独立验收通过**。第一包9→5失败报告仍保留，不用新成功结果改写历史失败。
- 两包exe SHA可能同为原Electron程序，资源清单是精确版本证据。第二包实际exe SHA及完整资源SHA由qa-desktop-report保存；最终源码提交待B/C登记。所有QA桌面程序已正常退出。
- r2对应源码提交：`691d41a`。QA独立从 `git show 691d41a:<file>` 读取此提交的10个manifest资源，与实际包内资源逐项核对内容（不是拿后续server工作区作比较）：Git blob为LF，7个Windows检出文件为CRLF，原始字节SHA因此不同；仅归一化CRLF后内容均完全一致，包内原始字节SHA又逐项匹配r2 manifest。此提交8个明确交付文件已核对。r2 manifest的baseCommit仅指当时管理HEAD，不冒充最终源码commit。
- 本专项只证明Windows未签名解压目录版（win-unpacked）启动和上述界面/保存范围，没有生成或安装正式安装器；任务恢复状态为预置持久running夹具，不是商业模型执行中关窗。生成应用H5来自先前真实构建，不能据本次预览宣称新包内Taro编译链或微信改版已重新验收。没有第三次打包循环，实际于北京时间12:57附近完成，未超过30分钟约定。

### 后续源码窄竞态（未包含在r2包）

C/B在源码复查发现：恢复任务会await sourceDigest，在该等待期间close可开始；若恢复随后仍注册新任务，退出可能等到任务上限。此时r2对上述桌面原步骤的通过仍有效，但不证明这个新的恢复并发窗口已修复。C另做关闭复查与单项测试，不进行第三次打包。

QA使用独立 `test-results/qa-desktop-resume-close.mjs`（没有引用开发自报2/2），在新隔离数据/随机端口门控摘要读取index.css；close开始后释放读取，HTTP400“应用正在关闭”、agentCalled=false、taskCount=1、原任务仍interrupted、closeFinished=true。`qa-desktop-resume-close-report.json` passed=true，2026-10-09 13:02:40北京时间；编译为夹具、无模型调用。对应窄修提交 `c88db3e`，QA核对当前server/index及该专项测试与提交无差异，源码验收通过。

当前：r2电脑版限定产物独立QA通过，对应源码691d41a；恢复窄竞态源码修复c88db3e已另行独立复验通过，**该窄修未进入r2exe**。真实模型、微信交互、安装器/分发仍保留未验证，不据本项宣称整个HARNESS-001完成。B另派C三类修改版Weapp产物分支，QA仅对新报告、源码摘要和本地官方格式校验做相称核查，不重复编译，不连接历史服务，等待该产物后收尾。

## 三类修改版 Weapp 产物补验

C 在新隔离目录 `D:/app/.test-data-business-weapp-dJS7rC` 对三类已真实H5验收的业务revision2，每类仅一次真实Taro Weapp构建与本地官方WXML/WXSS校验；未调用模型、未启动开发者工具服务/模拟器、未访问账号、下载或发布。`harness-business-weapp-report.json` completed/passed=true，运行时源码提交 `c88db3e4112e090c1dac3c26cdfd6e8c4001489c`。环境为源码Node24.15.0及 `D:/app/node_modules`，**不是r2包内编译**。

QA独立运行临时 `qa-desktop-weapp-check.mjs`、`qa-desktop-weapp-business.mjs`，仅读取新产物，不重复任何编译：

- 三类实际readSources SHA256均匹配先前真实H5业务revision2及此编译报告，fixture project/revision对应；源码仍含清单最后项删除、记录最后项替换并重新合计、计算倍率3及非负数字校验，不是退回标题修改版。
- 实际project.config.miniprogramRoot对应dist/weapp，app.json含pages/index/index；每页JS/JSON/WXML/WXSS文件存在非空、JSON可解析。
- 本机既有wcc.exe/wcsc.exe路径存在，报告各类官方校验成功日志对应；六个 `.verification/wxml.js` / `wxss.js` 实际输出均非空，bytes和SHA256逐项等于报告记录。
- 独立结果 `test-results/qa-desktop-weapp-report.json` passed=true，3/3。这是源码一致性、真实Weapp构建与本地官方产物校验证据，不能当作微信模拟器/真机交互或业务通过。

当前该分支产物核查通过，编译脚本/说明最终提交待C/B登记。B另安排一次r2包内实际H5编译，QA等其真实产物仅核对执行器/包内builder与依赖路径、源码及输出，不重新编译；未启动历史9420或旧服务。

## 包内编译阻塞与限定新轮

### r2包内实际编译失败

C仅一次使用r2真正exe的Electron Node22.22、包内Store/builder/node_modules，计算业务revision2源码，在新 `.test-data-package-build-hro8RQ` 进行真实H5编译；`harness-package-build-report.json` failed/passed=false，实际stderr为 `log-symbols/index.js` 的 `chalk.blue is not a function`。未调用模型、未改包或重复编译。

QA独立只读 `qa-desktop-package-build-audit.mjs` / `qa-desktop-package-build-report.json` 确认：实际exe为r2、fixture node_modules realpath指向r2包内依赖、builder/store SHA匹配manifest；从包内 log-symbols/index.js 使用createRequire解析chalk，log-symbols4.1.0声明chalk^4.1.0，实际解析包内chalk6.0.0，与实际失败一致。

**QA-DESKTOP-02，P1：所测计算应用H5包内编译失败，编译交付不通过。** 日志代码在Taro CLI共同启动路径，推测会影响其它应用编译，但没有重复三类包内构建验证这一推测。r2界面/storage通过事实保留，不能据其宣布桌面生成/修改编译完整可交付；源码Node环境三类编译通过也不能补充为包内通过。

### A追加授权的有限新轮

A/B于13:08附近明确允许最多一个新独立包/30分钟；前两包保持原样，C唯一写入者先轻量核对现有依赖的版本解析，再修本地打包依赖收集，新包包含c88db3e窄修。不下载、不费用、不无限重包。新包完成后由QA独占一次真实包内H5编译，工程不重复；成功则实际交互新产物并相称复验原storage关闭门控/源码窄修包内容绑定，失败则如实结束为不能完整交付。

QA准备临时 `qa-desktop-newpackage-build-check.mjs`，仅复用既有包内编译脚本并将输出改为独立QA报告，保留r2失败证据；计算用例使用原业务revision2的倍率3、负数、非数、零输入。等待C新包，未在等待阶段宣称编译问题已修复。

### r3最终独立验收（有限新轮完成）

- 唯一新包：`D:/app/release-harness-20261009-r3/win-unpacked/Sprout Studio.exe`，源码基线 `8076b85296c2529dc785a3daf627102c94111534`。已独立核对10项electron/server包内原始字节SHA=新manifest；与8076提交仅归一化CRLF后内容完全一致。r3实际log-symbols解析chalk4.1.2、blue是函数，与声明版本相容；不再使用r2的chalk6错误版本。前两包保持未改。
- r3实际exe SHA256=`62c62d170a95aa4a3eb3df05f0d56a3654ab4344f7452e21dea1334afed7100f`（原Electron二进制，不能独自证明源码版本）；包内server/index SHA256=`dcb44b91129b8287e11b880d288f5d0986ae571e012c12f26b441149496d3c3d`。实际执行路径/包根/独立userData均在新UI报告中核对，renderer隔离通过。
- QA独占一次真实包内H5编译，2026-10-09 13:13北京时间开始，`qa-desktop-newpackage-build-report.json` completed/passed=true。真实执行器为r3exe/Electron38.8.6/Node22.22.0，包内Store/builder及node_modules真实路径；源码为已验收计算业务revision2，摘要=`26f2f6885c591e06df971b99fc3dfde9c9133a09c14a02e30e9dec2893b351e5`，隔离root `.test-data-package-build-eMzfrC`。只targets H5，日志通用“微信端编译检查通过”文案不能扩大为本次包内Weapp已编译。
- 将该刚编译draft用包内Store发布为测试可用revision；真实r3exe加载新产物。不是旧H5假冒新产物，不调用模型。四项精确文本断言：输入3→`结果：9`，输入-1→`结果：请输入非负数字`，输入abc→同一提示，输入0→`结果：0`，全部通过。
- 首次UI严格断言期望漏写已知固定“结果：”前缀，实际负数提示正确，此为QA脚本错误而非包新故障。保留 `qa-desktop-newpackage-ui-first-report.json`；修正两项精确期望、记录切换先等待.edit及预期文本，在全新UIworkspace仅复制已编译revision并跳过重复发布；**没有再次编译**。最终 `qa-desktop-newpackage-ui-report.json` passed=true，13:17北京时间，新workspace=`D:/app/test-results/qa-desktop-newui-dXBTsu/workspace`，独立userData在同一测试目录。
- 旧有效记录H5只用于相称复用原存储关闭缺陷的触发步骤：真实r3exe进入500ms storage.json rename且尚未完成，预览最后合计9，正常app.quit后重开仍精确9，passed=true。不是把记录旧产物算作新包第二次编译；本轮只一次计算H5包内编译。
- 恢复关闭窄修绑定：c88db3e与8076b85的server/index无源码差异，r3包此文件匹配8076内容，结合上方独立sourceDigest门控（HTTP400、不调用Agent/不创建任务、close结束），证明**窄修已经进入r3资源**。没有宣称在真实UI主动恢复或付费模型执行中关窗；相关开放链仍未验证。

QA-DESKTOP-02在“本地包依赖版本错误→所测计算应用包内H5编译与真实新exe交互”限定范围已修复并独立通过。r2失败证据不改写；r3未覆盖包内微信编译、真实模型、正式安装器/签名/分发。源码环境三类Weapp构建/官方产物校验通过依旧与本项区分，未做微信实际交互。

### 交接与写入结束

本续派QA独立验收已结束：r3 Windows解压目录版启动/实际新H5编译与交互/保存中正常退出重开通过；恢复窄修源码门控及包资源绑定通过；三类业务Weapp源码与官方产物核查通过。报告以上精确版本与范围为准，产品代码、测试源码、打包脚本、总台账、Git暂存/提交均由QA保持未改；临时脚本/报告不上传。B继续负责整体交付和明确清单提交/同步，A维护当前台账。

本轮未做真实商业模型开放需求与自主修复、模型执行中关闭恢复、微信模拟器/真机交互、包内Weapp编译、正式安装器或分发；不将限定验收表述为整个HARNESS-001完成。恢复先读TASKS.md、B工作包、本QA报告与8076源码；新机没有本机临时报告时用已提交脚本及本报告的明确流程重建新夹具，不读取旧密钥或旧服务。QA新桌面/编译进程已结束，无额外后台唤醒承诺；当前无需新增测试或重复编译。

## 真实模型二维码验收恢复（2026-10-09，北京时间）

独立 QA 由 `/root/harness_qa_resume` 接替中断的 `/root/harness_qa`；仅写本 QA 记录与 test-results 临时脚本/报告，产品代码由 `/root/harness_engineer_resume` 唯一写入。授权以 TASKS/HANDBOOK 和 B 已核实的 A 直接用户指示为准。本阶段没有再次发起模型任务、覆盖用户 123 项目、读取凭据、重启已配置服务。

已只读核对实际 API `127.0.0.1:54526` 的 QA 项目 `1616710e-213e-441e-9d91-f6f1da2a1a37`：任务 `0d850301-9afc-428d-b8b6-decdc4e6b5bc` 已 failed/reason=error，attempts=1/toolCalls=20/buildAttempts=1/verifyAttempts=8；可用版本仍为 revision1。其公开事件最后显示第二轮双端编译及官方产物检查通过；前面 fill('.text-input') 实际命中 taro-input-core 外壳而失败。旧 qa-live-qr-run-report.json 停在 running 为流式读取中断记录，不能当作仍在执行。

公开 files 接口返回的仅为原空白初版三文件（含“你的想法，从这里开始”）。没有已发布新二维码源码或最终失败检查计划，不能拿原空白页宣称二维码生成、预览或解码通过；失败 draft/最后检查计划待产品诊断确认是否可恢复。旧失败证据保留，不改写为成功。

最短后续入口：C 修复真实 Taro host fill 定位、实际检查预算及二维码截图语义断言后，QA 先在新隔离目录对真实 Taro 组件、有效二维码/伪图案/错误内容、三次检查上限做独立相称复验；随后等 B 确认新版本及正常配置接口，QA 唯一发起有限真实模型验收，短中文/长文本解码严格等于输入、空输入反馈、业务修改后再解码、旧版保留与导出版本对应。当前未进行后续真实模型调用，未承诺后台持续运行。

### 新工具与上限定向独立复验

test-results/qa-qr-tools-report.json passed=true，五项均满足预期；verify.mjs 当次原始 SHA256=75de12d122298cf17efaeb056e82948fdea9a37dbbd50c243ac1b396868ec7dd。独立脚本只写新 qa-qr-tools-* 临时目录，随机端口与真实 Edge，没有模型调用/重编译：

- 复制先前真实 Taro H5 清单业务产物，选择实际 taro-input-core 外壳填写中文，再提交，业务结果精确为1；新版能进入组件唯一真实输入框，非静态仿造 Input。
- 包含两个输入框的非 Taro 容器明确失败，没有随意选第一个。
- 历史不可变二维码 PNG 仅作截图解码工具夹具，其 SHA 保存在报告；浏览器实际 img 截图按100个a严格解码通过；同一有效二维码期待错误文字明确拒绝；伪黑白网格明确无法解码而拒绝。此夹具不证明新真实模型任务已生成二维码，历史版本仅用于避免重复生成测试图案。
- QA另独立运行 node --test tests/agent-budget.test.mjs 2/2并核对断言：第三次检查可成功完成；第四次请求不再实际执行 verify（实际执行3次），中止PI，持久任务failed/reason=verification-budget-exhausted且保留旧revision，最终不是done。使用本地假模型/替身编译，不调用已有商业模型。

剩余：新源码/新可用应用接口及正常模型配置交接后，由 QA 唯一进行真实生成→短中文/长文截图解码→空输入→连续修改→版本保留→导出对应。当前这一真实业务链仍未验收；不得用上述工具夹具补作成功。

### 固定二维码编码资源专项（新增，真实业务链尚未通过）

QA独立 `qa-qr-resource-report.json` passed=true：模板12固定资源纳入可读源码；10个编码核心逐字节等于本地 qrcode-terminal 的 Arase 原始 MIT 子库，许可保留；模型不能写任何固定资源，仅允许页面受控相对导入 vendor/qr/index.js，直接导入核心/越界/查询参数均拒绝。新隔离 Store 夹具三版本 commit/restore 精确回放完整快照且后续历史保留，真实 export API ZIP 逐源码字节对应含 MIT LICENSE，未含 settings/sessions。此项用替身编译，不宣称真实双端编译或真实模型通过。兼容边界：旧版本缺vendor时首次draft会补新模板资源；之后新快照保存vendor。不能把旧初版三文件与新十五文件宣称绝对相同。

C唯一新二维码兼容fixture已真实 Taro H5/Weapp 编译，`.test-data-qr-vendor-li5TMw`。第一次 fill因Taro内部输入框尚未hydrated而返回0；QA指出等待外壳attached即立即count的竞态，C已增加有限等待，尚需最终定向复验。随后 QR screenshot仍不能解码。

QA独立实际浏览器DOM和像素检查 `qa-qr-vendor-first-report.json`、`qa-qr-vendor-first.png` 证实布局错误：二维码容器inline width/height=145px，但Taro编译CSS使20px padding变实际40px、5px cell变10px；21列需210px，145px容器截图严重裁切（实际截图仅左上定位角与部分图案）。不是对正确编码的误判，不能调整解码器或期望以宣称通过；C/B收到最小同单位尺寸修复线索。此fixture当前功能失败，后续重新构建仅B决定，相称修复后QA重验，不自行无限编译。原首次失败证据保留。

### 修正手写Taro产物独立功能复验

B允许C一次额外H5修作者fixture，把二维码全部尺寸改同源inline样式；未重复Weapp。QA对同一刚编译产物独立实际操作，qa-qr-vendor-report.json（1280×900/deviceScale2）与 qa-qr-vendor-mobile-report.json（实际预览375×720/deviceScale1）各3/3通过：短中文“一二三”严格截图解码版本1；107字符中文与emoji严格检查实际inputValue完全相同、再解码严格等于输入（版本13）；空输入提示“请先输入文字”。sourceDigest/H5 index摘要与时间均在独立报告，真实像素PNG保留。没有重新编译或调用模型。

范围明确：此为手写Taro H5固定M等级夹具，不是新真实模型生成项目；原Weapp编译对应修样式前源码，不能据本次H5宣布当前源Weapp功能或手机真机通过。C另155字默认输入截断与120字解码失败报告仍保留，不宣称所有长文成功、1000maxlength已在此产物生效或不需渲染尺寸预算。107字成功只是本明确样例通过，后续真实模型业务仍须实际长文测验。

纯固定适配器另有独立 qa-qr-levels-report.json 4/4：原模板UTF8 wrapper仅Babel转换模块导入以便在新CJS夹具运行；107字符中文+emoji在L/M/Q/H各实际HTML像素截图严格解码，合法版本11/13/16/19、模块61/69/81/93。不等于Taro已编译纠错级别控件操作或真实模型自主修改证据。

最终工具变化：fill增加最多4秒等待Taro内部输入框hydration，仍只允许唯一子输入；verify默认viewport375×720并在通过/失败结果中记录viewport/已成功qrChecks。旧5项定向报告是变化前默认1280，不冒充全覆盖最终文件；最终verify raw SHA256=4e11ce2f5d941a203f4852250a76739c09e41bdee29d2d17fd997dfe8e6ebc3e。资源4/4、预算2/2有效证据已按范围复用，不再次繁重运行。

当前下一必需步骤由B交接新可用包及正常配置接口后QA唯一完成真实模型生成、真实二维码像素解码、连续业务修改、旧版本保留与导出；旧r3真实项目失败保留，QA没有重发其run。


### 手机可见范围补充（B复核发现，保留原解码passed含义）

qa-qr-vendor-mobile-report 的107字二维码定位截图宽385px，大于375px viewport。Playwright locator.screenshot可截取溢出的整容器，因此严格解码成功只证明该容器像素，不证明用户在手机预览内能看全二维码。前文“两viewport通过”限定为输入/定位截图解码，不能算手机布局验收；不改写既有passed和首次失败证据。新包复用此fixture也仅用于包内解码器/模块兼容，不用它证明整图可见。

后续真实模型项目：长度120的纯中文，先严格检查实际inputValue等于完整原文，再检查实际可见二维码boundingBox满足x/y非负且x+width<=375、y+height<=720（允许先滚到可见位置），保存viewport截图证据并从可见像素解码严格等原文。超出可见范围必须反馈渲染缺陷，不通过换大viewport、放宽文本或只截溢出locator掩盖。

## r4新包离线与真实窗口独立验收（2026-10-09 14:31 北京时间）

独立结果 qa-r4-offline-report.json / qa-r4-launch-report.json 均 passed=true。新实体包 release-harness-20261009-r4/win-unpacked/Sprout Studio.exe；manifest绑定产品1cbf5ce794750a95feb4aa704ef1a61455aea991，finalizer55c5087e084ef064012b69f72236783124474e20。38固定资源逐实际rawSHA匹配manifest，且对应Git内容仅CRLF归一后完全相等。包package.json与产品Git仅扣除build/devDependencies/scripts三生产变换后deep完全相等，未放宽其它字段；rawSHA=0aa784f22df9236022321a587d6c3b98fd1696fd54d369b68504c901284abfe4。decoder包实际jsqr1.4.0/pngjs3.4.0，12固定vendor资源完整。

QA实际使用新包exe的Electron38.8.6/Node22.22导入包内Store/verify，在新workspace发布明确标题“QA固定资源兼容夹具（非模型）”的旧手写编译H5，仅复用，不再次编译。包内真实verify默认375×720完成短中文/107字符中文+emoji二维码严格内容及空反馈通过，版本1/13。此为解码器/资源运行兼容，不是新模型生成/新编译/微信交互/手机整图可见证据；107字loc图385px溢出边界仍适用。旧较长fixture失败和原用户123项目均保留。

随后实际启动同一新包exe，隔离root D:/app/test-results/qa-r4-wazkY0，workspace与user-data为其子目录。新进程PID14572，主API http://127.0.0.1:58362，preview http://127.0.0.1:58361；实测isPackaged/appPath/exe/userData路径对应新包，renderer nodeIntegration=false/contextIsolation=true/sandbox=true。公开bootstrap hasKey=false，initialError为空。已打开正常“模型与设置”，标题标记“小芽 · r4 真实验收（新模型配置窗口）”，安全截图qa-r4-settings-empty.png只拍了尚未输入的空密码框。

新exe窗口保留供用户正常配置，工具session34143仅保持该新窗口连接，未执行模型任务；不宣称QA在后台制作。旧r3服务54526及其Key未停止/重启/读取/转移，新userData的settings/auth文件也未读取。应用访问token仅请求内存使用，未写报告或输出。之后用户输入后禁止截图密码框或读取其值；只通过公开hasKey确认输入条件。

下次入口：B/A确认用户在此新r4窗口正常保存模型配置后，QA通过新API公开状态核对空闲，唯一发起新独立真实模型项目。先120纯中文实际输入完整/二维码在375×720内全图可见并viewport截图解码，再连续业务修改、空反馈、版本保留和ZIP源码/微信产物对应。未输入时此真实模型分支具体等待正常配置，不将r4离线验收宣布全任务完成。

## 模型配置持久化续派：独立验收计划（当前待实现）

B传递A已核实的直接用户新授权：实现退出重开/升级后保留模型配置，C唯一产品writer采用现有Electron38原生safeStorage；QA仅独立测试与本记录，Git由A当前独占。测试占位Key必须由QA自己生成，只放新隔离测试工作区/进程，不从聊天或旧r3/r4密钥提取、迁移或截图。当前r4录入途径单次公开核对hasKey仍false，无任务运行；窗口与session34143保留，真实模型等待A正常安全录入，不因等待持久化而停止此可独立旧r4真实链。

当前r4包实际只读检查：UI“保存设置”POST /api/settings，不自动执行/test；服务器此路由不日志req.body，保存设置剔除apiKey，响应public apiKeyundefined且仅hasKey布尔。显式“测试连接”才POST /api/settings/test触发模型请求。没有调用此测试API，没有读取密码值或真实settings/auth文件。

独立验收采用新Electron进程与新userData/workspace、自己生成占位Key和受控本地假模型，先确认原生safeStorage.isEncryptionAvailable及真正encrypt/decrypt能运行；不能把Mock加密通过写作Windows DPAPI通过。检查磁盘不存在占位明文、public响应不返回Key、请求body不被日志；通过本地假模型只在受控验收路径比较请求认证是否等占位值，报告仅布尔，不输出认证。

必要步骤：正常保存/退出/重开hasKey及假模型认证恢复；相同userData/workspace模拟下一版本/入口升级保留；新不同隔离路径默认hasKeyfalse且不读其它路径；清除后重开false；切换端点不携带旧Key；无安全加密能力、损坏密文、解密失败、文件写失败等明确安全失败，没有明文降级或错误信息泄露。重用有效二维码产物，不新增QR编译。失败必须具体报告并回C有限修复，不无限重包或模型调用。

安全边界依据Electron官方safeStorage文档 https://www.electronjs.org/docs/latest/api/safe-storage ：Windows同步API使用DPAPI，保护不同登录用户，不能宣称抵御同Windows用户其它应用。不同隔离路径不共享是应用路径隔离，不是DPAPI绑定该路径；同路径升级只验证同一机器/用户，不推定另一机器可解密。最新版文档异步API可用性不推定Electron38支持，需本机既有类型与真实运行核对。后续产品冻结后QA按实际接口安排独立脚本，目前尚未运行此新增持久化验收。

### 新持久化组件：真Electron DPAPI独立验证已完成（2026-10-09 14:48 北京时间）

qa-credential-component-report.json passed=true；模块原始SHA173f8799021ed90e8919876285c56558c5ff3b23dd93ca8a5511fd95997f96df前后未变。全新qa-credentials-gfw3lX目录，QA自造占位Key，实际Electron38.8.6/Node22.22/Windows原生safeStorage，三次独立进程，没有模型或旧用户凭据：

- 首次保存后新组件实例精确恢复私有完整配置；实际cipher不含占位Key或endpoint明文。
- 更换程序入口与app名称、相同userData的第二进程恢复占位配置；新不同路径load为null，仅应用路径隔离，不宣称DPAPI路径绑定或其它Windows用户测试。
- clear加密保存空Key并保留指定endpoint/model；第三次进程重开仍为空Key且新配置保留。
- 注入rename失败：已有cipher原始SHA不变、临时文件清理、错误固定且不含占位Key，旧配置仍可读。
- 使用真正native DPAPI读取QA损坏cipher：固定安全警告、原bytes保留。unavailable与Linux basic_text仅注入分支拒写证据，不宣称实机Linux后端或真实系统故障。

### 新持久化源服务：真实DPAPI/API集成独立验证已完成

qa-credential-api-report.json passed=true，qa-credential-api-RvwOvA全新userData/workspace；实际Electron38.8.6/Node22.22，startStudio注入原生vault且seedfalse，无编译或外部模型。源hash：credential173f8799；server/index.mjs cc42960ba378d87dc22a88e344b551491d765d24790509adb211f139296ca126；electron/main.cjs ad773f633c779dc3733a9920fed5cb02a3b2d37f454e3fe35ffe089a6ffd411a；src/main.jsx abcd1753dc84b69243ac61623ee8b8ad1119d7674b77c1170db9394010cbc248。

独立六项：公开保存使用真DPAPI后服务重启bootstrap恢复hasKey/model/endpoint且API响应无Key；注入本地Agent只用布尔核对恢复后的占位认证，不外部请求；API端点切换不携带旧Key；API清除后重启仍空Key且保留endpoint/model；不同userData公开hasKeyfalse；真native损坏vault启动返回固定公共warning并保留原cipher。所有响应/任务事件检查不含占位值，报告未保存认证或私有配置。

边界：这证明冻结源码组件与源服务注入的原生Windows安全保存/恢复，不是尚未生成的新r5包或真实用户模型链。源码main接入只读核对，未把实际服务注入测试写作新exeUI已验收；真实模型现有r4分支仍独立等待正常配置。C六项fakecrypto/并发测试和B关闭门控证据按各自版本复用，不重复整个QR构建/旧回归。

## r5实际新包持久化独立验收（2026-10-09 14:58 北京时间）

qa-r5-resource-report.json / qa-r5-ui-report.json 均 passed=true。唯一新包 release-harness-20261009-r5/win-unpacked/Sprout Studio.exe，manifest产品/打包绑定c09726bc42281ec8c6115b3a2bfe39b23deb646f；39固定资源rawSHA逐项等manifest，并与此Git提交内容仅行尾归一后匹配。新credential-store.cjs原SHA173f8799...97f96df对应此前真DPAPI组件；server cc42960...ca126。package生产字段按明确变化核对，无其它字段放宽。新UI三个pack dist文件逐字节等本轮stage产物，JS含“正常重开或升级无需重新输入”新提示，记录src/main.jsx绑定Git摘要；这不是拿旧r4界面证明新功能。

真实新r5exe四次独立启动，Electron38.8.6/Node22.22，isPackaged/appPath/userData/native safeStorage可用/renderer隔离全部实测。占位流程只在qa-r5-0GQekX独立目录，未读旧r3/r4或用户vault：

1. 正常UI自定义服务保存QA自造占位Key，公开hasKey=true、keyStorage encrypted/available/persisted=true且无Key内容；实际界面明确安全保存；没有自动/test请求（累计0）。
2. 正常quit后同userData、另workspace重开，endpoint/model/hasKey/persisted均恢复；新打开设置的password空，renderer没有回填Key。此为同包重开与workspace改变，实际二进制升级概念另复用此前组件不同入口/程序名相同路径的3进程证据，不宣称已跑两版exe自动升级器。
3. 正常UI清除后quit再重开hasKey=false，endpoint/model保留。
4. 全新不同userData再启动hasKey=false、不共享占位vault；空设置窗口留给正常真实录入，不能把测试占位留给用户。

新空真实录入窗口：PID51536，主API http://127.0.0.1:60775，preview http://127.0.0.1:60774，标题“小芽 · r5 安全保存（新模型配置窗口）”。userData D:/app/test-results/qa-r5-0GQekX/user-data-for-real-input，workspace同root的workspace-for-real-input；与已清除的占位测试user-data隔离。安全空设置截图qa-r5-settings-empty.png已视觉核查，仅在用户输入前拍摄，后续禁止再拍密码框或读值。session32926只保新窗口连接不关；旧r3/r4均未停止或迁移Key，r4原session34143亦保留。

此轮没有新二维码编译、重复解码或真实模型调用。复用明确非模型旧H5只用于避免首次启动空workspace自动编译示例，不据它证明新模型/微信功能。持久化源与实际新包限定验收通过；真实模型二维码生成、120纯中文完整可见像素解码、连续修改、版本恢复和导出仍须正常新窗口录入后由QA唯一继续。QA本轮证据/记录已保存，产品与Git保持不写，B统一交付。

### 保持同一配置的正常重开入口

已建立本机可审阅入口 D:/app/release-harness-20261009-r5/打开安全保存测试版.cmd，显式设置userData/workspace为上述当前真实录入窗口的user-data-for-real-input/workspace-for-real-input，并启动完整r5exe。只清空可能继承的STUDIO_URL/ELECTRON_RUN_AS_NODE启动变量，没有Key/token、文件删除、复制、迁移或外部网络指令。内容逐字段等当前readyForInput报告，三个目标路径均实际存在，脚本SHA写入qa-r5-ui-report.json；本次只检查内容，没有再次启动或关闭已有窗口。

以后正常关闭测试窗口后用此入口重开，继续同一加密配置；后续换测试版本仅改exe指向，保留userData/workspace。直接双击exe会使用默认路径，与此隔离测试配置不同，不能据此要求用户反复输入。测试入口和临时数据不纳入Git产品；现有空设置窗口/session32926保持，用户真实录入仍由A正常操作，不从聊天或旧进程搬Key。

本轮QA记录与报告已保存并冻结，可由B按明确清单提交QA文档；QA不操作Git。真实模型链未运行、等待正常录入条件，不把保窗口连接说成后台制作。
