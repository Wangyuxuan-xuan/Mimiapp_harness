# STUDIO-002 包3 独立 QA

## 可重复仓库回归（用户新增要求）

已新增 `tests/qa/qr-delivery.test.mjs`、`tests/qa/qr-fixture.mjs`，由独立QA维护。调用当前 `../../server/verify.mjs`，不硬编码旧工作树；二维码生成复用当前项目固定Arase vendor core，不新增依赖、模型或Taro编译。真实Edge浏览器，应用为确定性fixture，不冒充真实模型生成或完整桌面UI。

命令：`node --test tests/qa/qr-delivery.test.mjs`。每个场景通过mkdtemp创建唯一os.tmpdir根，verifyPreview使用自己的随机HTTP端口/浏览器并关闭；每例finally删除临时数据后断言目录ENOENT，避免残留与重复运行冲突。八场景串行，每例40秒中止信号/45秒测试超时。运行不读Studio profile、配置、旧数据或密钥。没有改package/scripts入口、现有开发测试、产品，也没有commit/push；Lead统一接入。

| 已验证业务/缺陷 | 仓库测试映射 |
| --- | --- |
| 短中文和120纯中文真实fill→click→编码→整375×720像素解码 | 每例动态fixture，绑定qrChecks数据、像素/viewport摘要和完整框；overlay必须在第3步拒绝 |
| 正常空反馈、真实新提示保留旧QR、“请先输入” | normal、fresh-feedback-keep-qr（另断言QR数量1）、please-first均passed；验证前后可见变化，删除emptyChecks必须证据校验拒绝 |
| 已验证QR容器由1变0 | clear-count passed并断言before.count=1/after.count=0 |
| QA-REPAIR-001原常驻提示误pass | constant-empty-label必须failed且第9步空反馈错误；短长QR先真实解码成功，排除无关失败 |
| 隐藏反馈/透明祖先/整屏遮挡 | hidden-feedback、hidden-ancestor、overlay均必须failed，绑定对应错误及步骤 |

本轮相称只跑一次新套件：8/8通过，约14.3秒。实际执行前后主仓库HEAD `ccae82b131abe30a7b9cc682c1b18712830d8dce`，verify.mjs SHA-256仍 `0d66b45aececc5bd35e221589641c30343b40f1263c9fb911dd0abde1b2b414d`。证据 `test-results/studio-002-qa-repair-repository-regression.tap`。主仓库原有管理文档修改未动，tests/qa开始时不存在，本执行者仅创建上述两个测试文件和本报告追加内容。没有重跑预算全套、真实模型或Taro；旧ignored证据未覆盖。下一责任人QA Lead/B统一仓库入口和集成验收。

## QA-REPAIR-001 修后独立复验

新冻结：`e3c816432963f84da6583510a87d6152594f5ff8`（require fresh visible empty-input feedback）。执行前后均实际读取 Git HEAD、status clean、verify.mjs SHA-256 `0d66b45aececc5bd35e221589641c30343b40f1263c9fb911dd0abde1b2b414d` 一致。diff仅verify.mjs、对应开发测试和实现说明；旧预算/9项PI测试未重复，也未Taro编译或真实模型请求。

**QA-REPAIR-001原步骤复验通过，缺陷关闭。** 本结论只覆盖该缺陷与相关验证器变化，不替代新集成包正常UI/真实模型全历程验收。f371856误passed原JSON和原脚本未改写。

| 真实Edge独立场景（均先动态输入短中文和120纯中文、生成、整375×720像素解码） | 新版本实际结果 | 判定 |
| --- | --- | --- |
| 原constant-empty-label：常驻“请输入内容”，空点击无处理 | failed：空输入未引起新的可见错误反馈或已验证二维码消失 | 原缺陷修复 |
| normal：空输入新可见提示且清QR | passed，emptyChecks记录前后状态和transition | 正例通过 |
| fresh-feedback-keep-qr：空输入新可见提示，保留旧QR | passed | 未错误强制清除旧QR |
| hidden-feedback：新提示存在但opacity0 | failed：无新的可见错误反馈 | 隐藏负例通过 |
| hidden-ancestor：祖先opacity0，子提示本身正常 | failed：无新的可见错误反馈 | 透明祖先负例通过 |
| overlay：真实二维码被整屏遮挡 | failed：二维码截图无法解码 | 保留像素门控 |
| clear-count：已解码#qr从存在到空输入后count0 | passed，emptyChecks.before.count=1/after.count=0 | 消失路径通过 |
| please-first：空输入新“请先输入内容”提示 | passed | 同义提示兼容 |

新证据：test-results/studio-002-qa-repair-followup-run.mjs、followup-generated.mjs、followup-results.json、followup-final-run.log；额外三例见followup-extra-run.mjs、followup-clear-count.json、followup-hidden-ancestor.json、followup-please-first.json、followup-extra.log，均统一前缀studio-002-qa-repair-。记录真实HEAD和verify摘要，不沿用旧硬编码SHA。

QA脚本初轮生成HTML时字符串插值语法错误，浏览器未执行二维码业务；失败输出保留，不作为产品缺陷。随后仅修QA生成脚本，原业务期待不变，新版本八个相称场景完成。无当前测试进程；继续责任人QA Lead/B负责集成与最终用户历程验收。

## 冻结版独立验证结论（覆盖下方准备期状态）

对象：`f371856125f8f3c2f05aa1eca907603b41908588`，分支 `codex/studio-002-repair`；开始和最后一批测试执行结束时均核对工作树 clean。随后B已续派原writer修复，报告交付前再次核对HEAD仍f371856但server/verify.mjs已有未提交改动；本轮结果仅绑定此前冻结版本，不对新增改动记通过，等待新冻结再复验。独立 QA 仅写本报告和主目录 test-results/studio-002-qa-repair-*，未改产品/开发测试、未Taro构建、未用真实模型/密钥、未读旧配置或操作旧服务。

**结论：主要修复与预算门通过相称复验，但空输入错误反馈仍可被常驻标签冒充，不能验收包3全部完成。** B/QA Lead 已收到原步骤和证据，需开发修复后独立原步骤复验。完整桌面 UI/真实生成/CLI集成仍由 QA Lead 另行安排，本报告不覆盖。

| 独立范围 | 结果 | 证据 |
| --- | --- | --- |
| 同 session失败后假完成→服务接续修复；build-only/no-op/只检查旧页面拒绝；修改后重新验收；显式停止；第41工具阻断；恢复继承；实际verify中硬杀 | 9/9通过，复用开发测试原步骤在冻结对象独立运行，不复用开发结果 | test-results/studio-002-qa-repair-targeted-unsandboxed.tap |
| 第4次build前拒绝；600000ms耗尽时模型请求=0/工具=0；纯讨论仅1请求无制作接续 | 3/3通过；前三次build后第4次工具可计入，但build副作用未执行；旧revision保持1 | studio-002-qa-repair-boundaries.mjs/.json/.log |
| 第三次实际验证成功、第4次实际验证拒绝并保旧版 | 2/2通过 | studio-002-qa-repair-verifybudget.tap |
| 短中文“独立验收一二三”→生成→整viewport实际像素解码；120纯中文→重新生成→等值解码；空输入清除QR并出现反馈 | 真实Edge通过；375×720，绑定每次输入、图像/viewport摘要、解码内容与框 | studio-002-qa-repair-dynamic.mjs/.json normal |
| 全屏遮挡二维码 | 真实Edge返回无法解码，负例通过 | 同上 overlay |
| 普通修改保留QR要求；明确取消二维码允许切换；无关count0空反馈 | “把历史改为三条”“把按钮改成蓝色”“取消二维码历史记录”均text-qr；“不再做二维码”为general；无关selector count0被拒绝 | 同上 profiles/unrelatedEmptyRejected |
| 空输入点击无处理、旧QR保留、常驻提示标签 | **缺陷复现：passed** | 同上 constant-empty-label |

### QA-REPAIR-001 [P1] 常驻提示允许空输入无处理仍通过

版本：f371856。位置：server/verify.mjs 的 validateVerificationPlan 空反馈分支与 verifyPreview text contains分支（冻结版约34、90行）。检查只接受提示文字匹配，却未要求空输入触发反馈或二维码消失。真实浏览器中，短/120字中文分别动态生成并正确解码，空输入点击什么也不做、保留上一张QR，只要页面一直显示“请输入内容”，整个计划仍 passed，validateVerificationEvidence也接受。

原步骤：运行 `node D:/app/test-results/studio-002-qa-repair-dynamic.mjs`；其 constant-empty-label fixture在页面加载时写固定提示，生成有效QR后不移除标签，空输入时button handler直接return。计划为 fill短→click→qr；fill120中文→click→qr；fill空→click→text #message “请输入内容”。期望：此空输入业务失败，验收不得passed。实际：state=passed，qrChecks两项正常，旧QR仍保留。normal fixture同计划会清除QR并动态提示且passed，overlay fixture失败，排除编码器/运行环境错误。B澄清真实提示变化即可满足空反馈，并不强制清除旧QR；故缺陷依据是没有新的可见反馈且无任何处理，不是单独保留旧QR。需开发补空反馈与动作关联的服务规则，再原步骤复验；不能改QA故障fixture为正常或放宽业务要求。

### 环境失败记录与限制

首次沙箱运行旧原步骤全部在创建临时node_modules junction时EPERM，属于环境失败，原日志 studio-002-qa-repair-targeted.tap 保留；首次浏览器也在launch退出，无业务步骤执行。经正常require_escalated审批后，仅自建本地fixture和临时数据重跑成功，没有绕过审批。独立脚本不调用外部商业模型，模型为随机本地端口HTTP替身，浏览器为实际Edge；创建的服务器均由代码finally关闭，硬杀仅针对自己创建的子进程。10分钟边界采用已有累计600000ms直接进入的精确前置测试，不实际等待10分钟。恢复含离线时间的保守计费可能提前耗尽是实现明示策略，未将此当预算重置。

下一责任人：QA Lead协调 B/包3开发修复 QA-REPAIR-001，交付新冻结SHA后本执行者原触发复验；本轮没有待运行测试进程，不称后台仍在验收。

日期：2026-10-09（北京时间）。独立执行者：QA Lead 子代理 `/root/qa_repair`，不参与产品实现。恢复入口：先读 AGENTS、HANDBOOK、TASKS 的 STUDIO-002、总工作包和本报告，再由 QA Lead 派发冻结版本测试。

## 授权、归属与实际状态

用户 TASKS STUDIO-002 组织补充明确要求每包非开发者 QA，AGENTS 授权项目内部子代理。父 QA Lead 负责汇总，B 最后集成验收；本执行者仅写本文件，不写产品、测试预期或总台账。

只读对象：`D:/app/.worktrees/studio-002-repair`，HEAD `ae0d8af940c3aa5392e2ef2df70c28818e28539a`。预审时 agent-skills/mini-program/SKILL.md、server/agent.mjs、server/harness.mjs、server/index.mjs、server/verify.mjs 有未提交改动，开发者仍可写，**没有冻结，不记通过**。本轮仅读取源码和现有测试；没有执行测试、编译、服务、浏览器或真实模型，没有读取旧配置、vault 或密钥。

本次预审不是源码最终审核；下述行号绑定预审快照，冻结后须重新定位。

## 预审发现与待复现风险

| ID | 观察与位置 | 独立验证方式 | 当前结论 |
| --- | --- | --- | --- |
| R1 | server/agent.mjs:12、132 仅在 finally 更新 budgetUsedMs；server/harness.mjs:17 recoverTasks 只改状态。硬崩溃不进入 finally，可能恢复时漏算运行时间 | 独立隔离任务设置既有使用时间，运行产生检查点后硬退出测试进程；重开核对累计时间及剩余时间不可重置。测试进程只能自己的，不操作旧进程 | 源码风险，待冻结后复现 |
| R2 | server/verify.mjs:14 出现“改为/改成”等且本句未重述二维码即返回 general；二维码项目“把历史改为三条”可能取消 QR 要求 | 同项目 title/goal 文字二维码，分别传“把历史改为三条”“把按钮改成蓝色”；再以标题/count-only 计划尝试提交，必须拒绝 QR 验收降级；明确“不再做二维码，改成清单”应允许切换 | 源码风险，待冻结后复现 |
| R3 | server/verify.mjs:32 长文仅检查字符数，没有要求长中文；:34 空输入接受任意 count=0 或包含“内容”的任意文本 | 120 字中文是本轮实际业务样本；对无关空 selector/count=0、常驻“内容”标签做负例，确认不能拿无关断言宣称空输入通过 | 负例覆盖待验证 |
| R4 | 同会话自动接续保留同 session 对象，提交要求 builtAt/verifiedAt 与 writes 一致；需要实际证明，而非只看字段 | 模拟 PI 首次失败后直接声称完成，服务必须同 session 接续修复；验证通过后再写文件/编译失败/不验证，都不能提交旧 passed 或 pending | 待验证 |
| R5 | 硬预算工具前 wrapper、reserveBuild、verifyAttempts 与恢复字段已有改动；检查点可能发生在工具计数前 | 独立边界测试 40→41 工具、3→4 构建/实际验证、已有 budgetUsedMs 到期；记录副作用计数不得多执行，恢复继承工具/构建/验证/接续计数 | 待验证 |

## 冻结后覆盖与证据要求

| 范围 | 独立触发步骤 | 必需证据 |
| --- | --- | --- |
| 自主修复 | PI 模拟返回业务失败，随后仅返回完成；核对服务主动同 session 发反馈，再实现修复、重新 build、verify 通过 | 请求历史/会话身份、失败原文、工具序列、源码摘要、最终版本；无人工源码介入 |
| 漏验与过期验收 | 写→编译→不 verify；verify passed→再次写；verify passed→再次编译失败；仅模型声称成功 | 无 done/新 revision，诚实未完成，旧版本摘要不变 |
| 工具前预算 | 先用40工具，再发带写副作用的第41次；build/actualverify分别到3再请求4 | 第41/4次真实副作用计数为0；task原因、累计计数、resumable与继续请求结果 |
| 恢复累计预算 | 中断、显式停止、硬进程终止后恢复；此前计数和已用时间接近上限 | 不重置总40/3/3/10min；恢复拒绝耗尽；错误现场及旧可用版本保留 |
| 停止 | 模型请求中、写/构建/验证中、提交前门控停止；发布已开始的停止明确拒绝 | 停止响应、任务终态、无隐式自动继续、无停止成功后提交；复用历史门控方法 |
| QR 正例 | 同页真实 fill→click→截图解码短中文“一二三”；120字纯中文长文；空输入点击后明确提示或二维码消失 | 输入等值、实际PNG摘要/解码内容、375×720整 viewport二维码可见、真实浏览器类型及源码摘要 |
| QR 负例 | 自写假格子、旧二维码不随输入更新、内容不符、二维码超出视口、计划只计格子、缺少图像证据 | 原失败保留，不能改格子期待值宣称通过 |
| 讨论与交付 | 普通讨论不改源码可答复；“做一个/修改/修复”不能借纯文本完成绕过验收 | UI事件和任务状态一致，制作失败不显示完成 |

## 现有测试复用范围

- tests/agent-budget.test.mjs：已有第三次成功与第四次拒绝 PI HTTP 模拟，可复用实际 PI 工具路径；仅验证三次实际检查计数，不覆盖40工具/3构建/10分钟/硬退出恢复，且注入 verifier，不证明浏览器真实功能。
- tests/harness.test.mjs：已有断线、显式停止、服务关闭、硬进程中断、源码不匹配恢复和检查点失败；历史硬中断仅断言 interrupted，未断言累计预算。
- tests/verify-qr.test.mjs：已有 Taro input host、短中文/长中文像素解码、内容不符和假图失败；二维码是预生成静态图，不随输入生成，不能作为新“输入→生成”验收依据；旧样本也不足120字。
- QA 历史提交停止竞态方法可在冻结版复用原触发步骤，但旧结果不得直接覆盖新源码。

## 依赖与接续

等待开发者给出冻结 commit 或精确文件摘要、改动清单和测试证据；QA Lead 确认允许本执行者运行哪些测试、隔离根目录和时间槽。服务使用随机端口，数据独占新临时 root；不占旧服务或用户项目。真实编译集中协调，不无谓重复；本执行者当前无编译/浏览器/服务运行授权，不自动启动。

集成后真实模型只由 QA Lead/B 指定唯一操作者；本执行者目前不得使用真实Key/模型，不向r3旧项目请求。完整 UI 验收与实际导出/重开由 QA Lead 跨包安排，CLI不能代替UI。本报告当前完成的是覆盖准备和只读风险反馈，全部功能仍待验证。下一责任人：QA Lead 接收报告并协调冻结后的独立测试。
