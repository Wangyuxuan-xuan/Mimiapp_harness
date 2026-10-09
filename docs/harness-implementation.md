# HARNESS-001 实现与验证说明

日期：2026-10-09。执行：C 子代理 `/root/harness_engineer`；验收由 B 负责人另行记录。此文件是技术证据说明，不替代当前任务台账。

## 已实现

- 项目 JSON 新增 memory、tasks、runtimeErrors；旧项目按全部用户历史迁移需求。目标、长期约束、变更持续进入 PI 系统上下文；近期消息只是有限背景。用户可在“项目需求”中查看、整理与修正。超过容量会明确要求整理，原记录与原对话不静默丢弃。
- 版本快照保存当时需求和功能检查。恢复旧代码仍保留用户当前最新需求，并记下回退事件；不把旧代码版本覆盖成旧需求。已知当前密钥及常见密钥形式在提示、写入源码、回复、任务事件和会话消息中脱敏。
- 任务持久保存状态、阶段、事件、源版本、排序后源码 SHA-256、恢复来源、次数和限额。断开 NDJSON 不终止任务；重新打开界面轮询当前状态。主动停止持久标为 stopped；服务关闭、超时或进程硬中断标为 interrupted；均不自动重试。显式继续先核对源版本和源码摘要，从最后可用源码创建新草稿重新执行未完成需求。
- 项目变更接口有互斥保护。进度写入失败中断任务，不发 completed/done。正常关闭等待任务收尾。草稿在外层 finally 清理，覆盖模型运行时和会话初始化失败；失败不切换当前可用版本。
- 限额：每任务 10 分钟、40 次工具、3 次构建、3 次功能检查、SDK 请求重试 1 次；继续最多 3 次尝试；保留最近 50 个任务/SDK 会话、40 条任务事件、10 条运行错误。需求最多 48000 字符。Windows 原子替换遇到短暂文件占用进行有限退避。
- `verify_preview` 复用 Playwright，支持 CSS 定位、填写、点击、文本包含、数量断言、刷新；最多 20 步且必须有非空业务断言。应用使用与实际 Studio 相同的 CSP 和存储桥；浏览器错误、失败步骤、实际文本回到模型修复循环。编译与功能检查分开，检查绑定源码摘要/版本，编辑后旧检查失效。未验证版本显示待验证，失败保留原可用版本。
- 预览运行错误带版本、文件、行号、栈；旧版本错误不能应用到当前版本。用户可以点击修复当前错误。界面“功能检查”显示实际检查步骤和覆盖范围。

## 复用与最小自建边界

现有 PI Coding Agent SDK 0.99.1（MIT）提供原生 SessionManager.create/open、appendCustomEntry、retry、compaction。实现直接采用其文件会话保存脱敏消息/工具轨迹与任务来源，采用 SDK 的重试和上下文压缩；长期需求固定在系统上下文。未自建模型循环、会话树或压缩器。

本地依据：`node_modules/@earendil-works/pi-coding-agent/docs/sdk.md`、`examples/sdk/11-sessions.ts`、`dist/core/session-manager.d.ts`、`dist/core/settings-manager.d.ts` 与 package.json。SDK 会话恢复不等同于产品恢复：它不能替代用户可编辑需求、不可变可用版本、主动停止/断线语义、源码核对和宿主进度。因此只为这些产品语义保存少量 JSON。恢复新会话关联原任务，不重放中断时的工具副作用，不宣称恢复模型推理现场。仍使用原 Taro 4.3.0 构建及官方 WXML/WXSS 校验，Playwright-core 已从开发依赖改为运行依赖，以免桌面运行时缺模块；没有引入新模型框架或升级 PI。

## 验证矩阵

| 证据 | 模型/执行器 | 编译 | 已覆盖 |
| --- | --- | --- | --- |
| `npm test`：24/24 通过 | 真实 PI SDK + 本机确定性模拟模型；部分宿主任务注入执行器 | 替身编译/替身验证器（用例明确标注） | 超过十条早期约束实际进入 PI 请求；密钥回显脱敏与 JSONL 检查；旧项目、重启、回退；断线继续、主动停止、显式继续、并发互斥、源码变化阻止恢复、硬进程中断、保存失败；检查版本绑定、编辑后失效、检查失败保留旧版、参数约束 |
| `npm run build`：通过 | 不涉及模型 | 真实桌面前端构建 | 新界面可构建 |
| `npm run test:harness-ui`：通过；`test-results/harness-ui-report.json` | 真实 Edge、宿主任务注入执行器 | 替身编译 | 需求查看/修正保存、点击发送、页面刷新显示任务、主动停止和继续、检查范围入口 |
| `npm run test:harness-real`：12/12 阶段通过；`test-results/harness-real-report.json` | 真实 PI SDK + 本机确定性模拟模型；真实 Edge | 每类首版真实 Taro H5/Weapp + 官方 WXML/WXSS；后续修改真实 H5；回退复用源码完全相同首版不可变构建 | 清单新增/数量/刷新持久；记录新增/求和/刷新持久；计算输入乘算。每类生成、两次连续修改、第二次故意运行错误被模型收到并修复、精确回退首版再实际交互 |

三类真实验收隔离目录见报告 root。测试没有读取 `.studio`、旧进程密钥，也没有重启旧服务。运行报告与测试临时目录未提交 Git。第一次真实验收由于断言读取发生在 React/存储桥异步更新之前而失败；已改为有上限的断言等待，第二轮三类全通过，最终报告覆盖旧失败轮。

## 未验证与恢复入口

真实付费模型没有可用授权密钥，尚未验证真实模型在开放需求下的自主生成质量；不将本地确定性模型称为真实模型。后续连续修改版本的微信端未重新编译，本轮真实交互只证明 H5 范围；三类初版已真实双端检查。微信真机、上传、发布、手机创作端不在本轮范围。未重新打包桌面安装包。

恢复：先读任务台账与 B 工作包，核对 Git 版本及本文件；快速回归使用 npm test 与 test:harness-ui，真实构建仅在新增改动或新问题需要时重跑。完整三类脚本可单独使用 test:harness-real。项目开发服务使用新 root 和 port 0；不要默认启动用户历史 `.studio` 服务。没有配置后台唤醒，本执行结束不意味着仍有执行进程。
## 独立 QA 交接

从最终产品提交检出后，使用现有依赖运行以下精确入口：

```powershell
npm test
npm run build
npm run test:harness-ui
# 只在需要重验三类真实构建时运行，耗时明显更长
npm run test:harness-real
```

当前测试与报告版本对应：本轮基线为 36916ae，真实三类报告于 2026-10-09 03:54:35 UTC 启动，来源是该基线上的开发工作区；不把它宣称为最终提交每一行代码的完整验证。该轮实际加载的实现已含原生文件会话、CSP/存储桥与有上限文本断言等待。该轮启动后补入的改动是：严格拒绝空业务断言/非法数量、验证显式版本及摘要快照、界面显示覆盖步骤、任务工具计数/检查状态文案、外层清理覆盖初始化失败、长期需求移入系统上下文并启用 SDK compaction/压缩记录脱敏、无写入时也可保存功能检查结果、UI轮询跨项目取消和显示样式、checkpoint失败/硬中断/过时验证测试。最后一次 24/24 回归与前端构建、UI报告对应这些最终改动；B 另用最新检查器对三类最终回退产物做了真实交互复验，证据 `test-results/harness-b-acceptance.json`，执行者及结论由 B 工作包确认。

QA 应先核对最终提交、上述报告的 compiler/model/interaction 字段和实际 root，再决定新增检查范围。检查“通过”只能指报告所列步骤。需要真实模型授权密钥的检查另开受控范围；无需向 QA 传递用户旧密钥或旧进程数据。
## 独立 QA 后的边界修复（基线 abdbe7b，2026-10-09）

独立 QA 在占位密钥/本机模拟模型下实证发现：分段 text_delta 拼接泄漏已知密钥；验证结果的 steps/storage 未脱敏而落入项目和版本；commit 入口门控后接受停止仍发布新版本；count 断言没有等待异步业务更新。原24项未覆盖这些边界，不能据此前通过结果否定缺陷。

修复仍复用本地 PI 0.99.1 text_delta/message_end/abort 和原子 JSON 存储；另核对 [官方 SDK 文档](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/sdk.md)，不升级框架。少量宿主代码用于输出与版本发布边界：

- 已知密钥跨 delta 时保留可能前缀，完整识别后才输出；中止/结束剩余前缀保守隐藏。Agent 和 NDJSON 出口均保护。嵌套验证结果在返回工具与保存前统一递归脱敏，包括步骤、存储值和对象属性名。
- 候选项目承载未发布的检查结果与完成回复。Store 只准备新不可变目录，检查 signal 后进入明确的原子保存边界，不预写原 current。接受停止返回200时不发布、任务为stopped、旧版本/旧检查/旧完成回复保持；保存边界开始后停止返回409解释无法取消，不假称已停止。restore 使用同一边界；关闭/超时不会在保存边界内再触发取消。先等待检查点保存，再发起提交。
- 数量断言与文本断言一样最多80次、每次50毫秒等待，防止200毫秒延迟更新误触发修复。

针对入口 `node --test tests/security-boundary.test.mjs`：5/5通过，包含所有密钥切分、截断前缀、嵌套值/属性名、真实PI模拟输出、提交入口接受停止、保存中409与真实Edge延迟count。模型/编译/验证替身的范围由测试名和源码明确区分；count用真实Edge。QA原复现脚本及复验报告由独立QA保管，工程不改其输出。

### 业务修改补验入口及前提

`npm run test:harness-business` 每类只做一次真实 H5 构建与真实 Edge 业务断言：清单删除后数量及刷新数据归零；记录改值后合计及刷新更新；计算倍率由2改3并验证负数、非数字、零边界。通过真实 PI SDK 调用本机确定性模型读、写、编译、检查。它补业务修改证据，不把此前两次标题修改当作业务规则改变。

此脚本复用 `test-results/harness-real-report.json` 指向的三类首版真实双端不可变产物。该报告/产物未上传，远端检出不可直接运行本专项。先检查本机已有有效报告和 root；缺失时需在隔离目录运行 `npm run test:harness-real` 生成所需基线，或由QA按同一源码准备明确标注的基线；不得指向用户 `.studio`。新报告为 `test-results/harness-business-report.json`，每类保存 root/projectId/revision/sourceDigest/步骤，QA可直接对其 revisions/2 独立执行 verifyPreview，不需重编译。后续修改微信端仍未验证；本轮没有真实模型密钥/费用、公开发布或新桌面打包。
最终本轮证据：在 abdbe7b 上的修复工作区运行 `node --test tests/*.test.mjs`，29/29通过；`test-results/harness-business-report.json` passed=true，三类修改各真实H5/Edge通过。独立QA复验占位密钥流/持久化、接受停止与旧版本一致性、保存中409、restore边界、延迟count及辅助函数切分/截断前缀/属性名均通过，证据 `qa-special-recheck-report.json`、`qa-persist-recheck-report.json`、`qa-restore-report.json`、`qa-browser-report.json`。独立三类业务复验 `qa-business-report.json`：清单双项逐删/刷新0；记录3+2后最后2改9合计12/刷新12；计算三倍率/负数/非数字/零；均核对检查与版本/源码摘要匹配。上述报告均位于未上传的 test-results，由QA独立维护；对应最终产品提交由B/QA登记，不由工程修改QA记录。本轮未更改前端源文件，也未重复三类首版双端或全12阶段构建。
## 当前电脑版独立产物（2026-10-09）

专项只复用本机 Electron 38.8.6、electron-builder 26.15.3、既有 Taro/Playwright；先核对 Electron 本地声明与[官方 app 生命周期/路径文档](https://www.electronjs.org/docs/latest/api/app)。现有脚本参数化 fresh stage/output 与依赖修补目的地，不覆盖旧release，默认不发布，使用本机electronDist、跳过依赖重建/签名；不安装或下载工具。输出目录及独立stage已加入Git忽略。

`STUDIO_USER_DATA_DIR` 和 `STUDIO_WORKSPACE_DIR` 可显式指定绝对隔离目录；入口在app ready前创建并setPath(userData)，拒绝相对路径。业务工作区直接使用覆盖值，服务仍随机端口。正常before-quit通过原生preventDefault等待既有close完成；未重造退出框架。QA使用新的预置测试项目，不连接旧STUDIO_URL，不读取旧AppData/.studio/密钥。

首次命令：

```powershell
node scripts/package-desktop.mjs --stage .package-staging-harness-20261009 --output release-harness-20261009
node scripts/harness-package-smoke.mjs release-harness-20261009/build-manifest.json
```

首包真实Electron UI、明确隔离路径、包内index/PI SDK/验证器与直接生产依赖导入通过。最初SDK导入探针30秒超时，调整为完成导入后显式结束探针，60秒限额，复验通过；这不是重复打包。初包源码摘要存build-manifest.json，包含server/electron逐文件SHA256、baseCommit、productBase、工具实际版本；打包期间管理提交会变化，以实际文件摘要对应产物，不只按main名称认定。

独立QA基本功能检查通过后，隔离storage.json rename延迟500毫秒实证命中正常关闭丢末笔数据。修复：关闭先fence新mutation；storage请求在await store.get之前同步登记完成Promise，mutation也登记；等待作业、已接收请求与存储队列后再关HTTP并退出；读取返回后已关闭时不再创建新run/restore。单项 `node --test tests/desktop-close.test.mjs` 通过，覆盖源读取与重命名双门控、在途请求被等待、新请求503拒收及最终数据9保留。没有重复29项/三类编译。

唯一一次针对重打：

```powershell
node scripts/package-desktop.mjs --stage .package-staging-harness-20261009-r2 --output release-harness-20261009-r2
```

新包测试/QA都应设置两项绝对隔离路径并删除STUDIO_URL/ELECTRON_RUN_AS_NODE；可复制此前有效H5测试产物至新workspace，明确这是已有真实H5产物夹具，不是本轮模型生成。smoke入口依赖本机harness-business-report.json/产物，远端fresh环境需先准备明确夹具；不指向用户历史数据。安装版、签名、微信实际运行和商业模型仍不是本轮证明范围。QA报告由独立QA维护，产物与本机报告不提交Git。
最终修复包 `release-harness-20261009-r2/win-unpacked/Sprout Studio.exe` 于北京时间12:56生成，专项开始于12:42，限额内共两包。C r2烟雾报告 `test-results/harness-package-smoke-report.json` passed=true：包内生产依赖/PI/index/检查器导入、源码摘要匹配、真实新exe明确隔离启动及正常退出。QA r2原触发脚本复验 `test-results/qa-desktop-report.json` passed=true：需求修正/任务中断入口/旧版本实际预览/正常重开均通过；仅新夹具storage.json rename延迟500毫秒，确认未完成时合计9，正常quit后第三次打开仍9，关闭丢末笔数据已修复。QA进程均已结束，未做第三包或重复全量构建。

最终包manifest `baseCommit=a09f1b9f326060b760b12744f6ef05113e9766a1` 是构建期间管理HEAD，产品基线242b6fc加本轮明确改动由文件SHA256绑定；server/index.mjs为6bc9adbb044149824eacd5879cf4e54b226752fd93040f2174e549ed5ede0b2e，electron/main.cjs为2531997d8923d9350ce29ed0308aa5440875787a16752d13b16ea5d125aa2df2。最终源码提交由B/QA绑定。可执行文件是同版本Electron启动器，单看exe摘要不足以证明业务源码版本，应同时核对resources/app与manifest。依赖修补脚本现在要求显式目的目录，拒绝默认覆盖旧包；该脚本不在app运行代码里，此收尾保护不改变已验收产物。

关闭恢复晚注册补充：r2 打包后只读审查发现 resume 的 sourceDigest 等待期间可能错过 close 的 jobs 快照。源码在注册 controller 前同步复查 closing，阻止关闭后的新任务；node --test tests/desktop-close.test.mjs 两项门控通过（存储与恢复）。该窄修不在 r2 包中，本轮遵守最多两次打包；单独源码提交，不宣称已完成新包验收。

微信业务专项（2026-10-09 13:03–13:05）：node scripts/harness-business-weapp-check.mjs。前提是本机 test-results/harness-business-report.json 及其中不可变业务 revision 2 目录、现有 Node/Taro 依赖与官方 wcc.exe/wcsc.exe。它复制三类精确源码到新的 .test-data-business-weapp-*，每类只编译一次 Weapp 并验证官方 WXML/WXSS；报告 harness-business-weapp-report.json 为 3/3，QA 只读核对摘要、页结构及六份官方输出哈希也 3/3。来源源码 commit c88db3e；使用 Node v24.15.0 与 D:/app/node_modules，范围是源码编译链，不是打包编译链；无 H5、模型、下载、开发者工具服务或账号调用。

桌面包编译专项：node scripts/harness-package-build-check.mjs release-harness-20261009-r2/build-manifest.json。前提是指定新包、manifest、上述本地业务报告与 fixture 源码。脚本以该 exe 的 ELECTRON_RUN_AS_NODE 执行包内 Store/builder，校验隔离 node_modules 的 realpath 指向包内依赖，只做一个真实 H5 编译，最长三分钟。r2 首次真实检查于13:05失败：log-symbols 4.1.0 的 CommonJS require 实际得到包内 Chalk 6.0.0，chalk.blue 不是函数；host同路径为 Chalk 4.1.2。失败报告 harness-package-build-report.json 保留。r2 UI/storage 验收仍有效，但该包创作编译能力未交付，不允许用模块导入通过替代编译证据。

后续有限修复轮于13:07:53开始，最多一个新包、30分钟，无下载。repair-package-deps 按 host 实际解析位置核对 name/version，错版替换，保留各层嵌套依赖；输出/source lexical 与 realpath 必须分离，替换目标现存祖先须位于输出实际根内，拒绝输出 junction 指向来源。node --test tests/package-deps.test.mjs 2/2（错版与嵌套解析、junction拒绝）通过；node scripts/harness-package-deps-check.mjs release-harness-20261009-r2/build-manifest.json 在全新物理临时目录、现有 Electron 38.8.6/Node22.22 先复现错误再修复为 Chalk4.1.2/BLUE function，通过，报告 harness-package-deps-report.json。未修改 r2 或 host。下一新包需独立QA执行唯一包内H5编译并实际操作产物、相称存储/恢复关闭复验，成功前不宣称打包编译修复已验收。
