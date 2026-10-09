# STUDIO-002 持续制作与原生恢复实施记录

2026-10-09。授权来自 A 转达的用户最新纠偏：正常制作不按工具、构建、检查、接续或恢复次数以及十分钟总时长强制结束；持续依据真实反馈修复，以用户停止与实际交付为准。唯一产品写入树 `D:/app/.worktrees/studio-002-repair`，分支 `codex/studio-002-continuous`，历史基线 `fe4ba9bd0fad1b3d15a1877123ba3828f857a187` 保留。已读 PRODUCT、协作手册和台账；本记录为工程实现及局部证据，不代表独立 QA/B 验收。

## 复用与范围

继续采用锁定 PI Coding Agent SDK 0.99.1（MIT，Node >=22.19）、Playwright 1.63（Apache-2.0）及已有二维码实现，无新增依赖或框架。核对本地 `agent-session.d.ts/js`、`session-manager.d.ts/js`、`sdk.js` 与 [PI 官方 SDK](https://github.com/pi-packages/earendil-works-pi/blob/main/packages/coding-agent/docs/sdk.md)。在线文档可能不同于锁定版本，实际实施以本地为准。自动压缩由 PI 原生 threshold/overflow 机制负责；宿主只映射事件、持久状态、重新绑定工具与安全边界。

移除 agent 正常制作的40tools/3build/3business/3plan/6runs/3host repair、恢复3次、总10min硬门及相应余额文案；保留 SDK 供应商传输 retry1、各工具/浏览器单操作超时和输入大小校验。使用计数、耗时和未知中断记录继续落盘，真实副作用前 await 保存，保存失败不继续。没有新增替代性的全局停止次数。

index 仅改正常 run 的总timer与终态来源；公开旧预算任务为可显式继续，不自动启动。16a阶段 UI 按服务 resumable 显示按钮、CLI 透传 run/resume，无额外固定帽；随后 E13 已最小修改 src/main.jsx 的 MemoryModal 部分修正请求，CLI 仍无需修改。候选隐私、错误分类、真实业务断言、当前源码构建与验收、整手机视口二维码解码以及空输入因果反馈均保留。verify 的必要修复只把容器子输入改为 `loc.locator(...)`，避免联合 CSS `#form,#missing` 拼接丢作用域。

## 当前合同

新 task 为 `executionPolicy:'continuous'`、`accountingVersion:2`，不生成数值限额契约。旧 budgetVersion/verifyAttempts/budgetUsedMs 等字段作为历史事实兼容。`task.usage` 为 tools/builds/verificationRuns/repairPrompts/timeMs/cost（`unknown`）；verify toolResult 的 usage 为 business/plan/runs/transient/tools/builds/timeMs，没有 remaining 或假无限。模型注册中的 cost0 是 SDK 占位，不是商业费用为0的证明。本地 fixture 不调用商业模型。

失败、停止、硬kill后保留自有 draft，task.draftRef 是本项目 drafts 下的直系 basename，sessionFile 是本项目 sessions 下精确 .jsonl basename。Store.taskPath 拒绝路径逃逸、目录或文件类型不符、软链接/junction、文件多硬链接以及草稿内部链接；不会扫描其他项目历史。createTask 与 runAgent 核对已交付 baseRevision/sourceDigest，实际读取草稿摘要，使用 `SessionManager.open(exactFile,sessionDir,draft)` 重建 runtime、工具、脱敏与订阅。不会重放旧 write/build，也不沿用旧 passed；恢复后必须重构建与验收。

`task.recoveryMode` 为 native-session-and-draft / current-source-context-rebuilt / new-session。旧任务没有可恢复引用时，从当前源码重建上下文并明确标识；引用存在但无效时诚实失败，不偷偷打开最新 history。旧 budget-exhausted/timeout task 在 public 投影可显式恢复，原 reason 与记录保留。删除旧 sessions/tasks 的50条裁剪；本轮不自动清理草稿，以免破坏恢复引用。已完成版本不可再作为未完任务恢复；版本变化必须核对后用新需求。

本地 PI 实际事件为 `compaction_start` / `compaction_end`，reason 为 manual/threshold/overflow；映射中文 status 和 task.compaction{state,reason,time,error}。state 区分 running/completed/failed/aborted。不是 auto_compaction_start/end。恢复只判断本轮最后 assistant 结果，不扫描旧 session 任意 error。底层 agent.continue 不绕过 AgentSession 生命周期；正常接续使用 session.prompt。停止调用原生 session.abort（也取消 compaction）。压缩失败、供应商最终错误与外部浏览器不可用如实保存可恢复状态，不无限立即重发。

完整需求全文持久保存，不因历史累计48000字阻止新需求。system仅稳定 goal/constraints，不塞全部历史；稳定内容过大也显式分页。首个新 session 的可容纳历史放 user 内容，由 PI 原生压缩；精确恢复不重复塞全历史。超单次初始化容量的原记录保留未装载目录，目录反馈限当前10页并给总未读数，避免目录自身无限增长。原生 custom tool `read_requirements({section:'goal'|'constraints'|'changes',index?,offset?})` 返回 section/index/offset/nextOffset|null/total/requirementsDigest/text；每次最多12000字符，是响应大小而非任务额度。

宿主 `pendingRequirements[{section,index?,offset,total}]` 按连续偏移覆盖，每页绑定完整 memory digest；持久保存并恢复。同一版本才继承覆盖，变化使未装载记录重读；执行及交付前校验当前 memory digest，不以“已读”自由文字冒充覆盖。全部未装载页读取后才可制作交付，最新修正仍按原文顺序与当前 prompt 优先，不自建摘要或静默省略约束。

稳定 selector-syntax/selector-ambiguous 的相同 sourceDigest+完整 stepsDigest 首次重复返回 `kind:'reused-plan-evidence'` 及已有候选，不重启浏览器，并要求读源码/换语义策略。收到该证据后仍完全同样计划则 code=no-progress，可恢复暂停。缺少验收的外层接续也比较源码、错误、完整检查计划、未读页及有意义工具证据；tool名+安全参数+结果内容哈希形成 progressEvidence，剔除 usage/time 等动态值。不同源码读取/新诊断算进展，相同read与相同内容不靠调用次数冒充进展。不自动first/nth，不降低断言。

终态 reason 区分 no-progress、provider-unavailable、compaction-unavailable、external-unavailable、checkpoint-failed、requirements-changed 和 user-stop；failureType 取实际本轮来源，旧 lastVerification 仅留事实，不拿旧plan/business覆盖供应商故障。成功仅当前修改的源码经过完整所列业务检查后发布；纯讨论按原行为答复。

## 开发验证与边界

隔离本地假模型 HTTP + 真实 PI session/SDK/native compaction，必要处真实 Edge；没有真实Key、真实模型、用户current/vault/session、旧服务重启、Taro重编译、打包、合入或push。

- `test-results/studio-continuous-r2.tap`：24/24，覆盖连续推进、旧3检查后的第6次成功、停止、恢复、候选与误选负例、二维码假码拒绝、唯一子输入等。
- `studio-continuous-final.tap`：当时新增连续集7/7；之后仅针对新增进展证据/来源映射补检。
- `studio-continuous-events.tap`：1/1，实际原生 compact summary 请求和 compaction entry、真实 subscribe 事件映射。测试 seam 仅 `testSessionOptions:{contextWindow?,keepRecentTokens?,compactAfterPrompt?}` 配置窗口/保留量或调用原生 compact，不替换压缩实现或伪造事件；不从HTTP/产品配置暴露。
- `studio-continuous-hardkill.tap`：1/1，子进程在 verify 已预留后硬kill；未知结果只记一次使用，精确同 session/draft 恢复后重新build/verify并交付。
- `studio-continuous-evidence.tap`：2/2，跨旧工具/构建/检查/接续/恢复/耗时限制；新文件读取跨4轮host接续成功、相同read暂停。
- `studio-continuous-sources.tap`：3/3，真实原生压缩事件、读取进展及本地供应商500经SDK有限传输retry后标 external/provider-unavailable，保留旧lastVerification但不误归旧plan。
- `studio-continuous-memory-qr.tap`：9/9，全文保留/脱敏/HTTP停止恢复/状态写入失败与真实QR像素、overlay/overflow/截断/空输入因果门。
- 最终连续集为 `studio-continuous-freeze.tap`：9/9通过。初始5/6、compact过小/错误要求system进入summary的失败日志原样保留；事件名错误修正后单项复验，不将此前手写状态当事件证据。

停止/外阻只保存可恢复，不承诺后台自动继续。长期模型仍可能无法完成某需求，不能把循环存在当作成功保证。没有增加自动清理，草稿与历史会占磁盘；后续清理需保护引用并单独授权。真实商业费用当前未知，不把SDK占位0当费用事实。独立 Lead/QA 按冻结SHA审查及复验，B决定后续新包/真实任务验收；本执行不宣称已验收。


## 冻结审查 E9–E13 后续修正

历史16a0f89冻结后独立工程审查发现任务绑定、需求覆盖写入时机、skill残留文案、同一SDK工具链重复失败及长期需求部分修正五项阻塞。本节记录最小修复，前节旧策略描述以下述精确合同为准。

E9：打开受控会话后、追加当前sprout-task之前，核对原native getEntries中最近绑定的taskId是否为本任务resumedFrom或已确认sessionBindingTaskId、原sourceDigest/baseRevision、projectId/draftRef（新记录）和header cwd是否精确同一草稿。新binding包含projectId/draftRef；不明或同项目另一会话拒绝session-binding-mismatch，错误文件不追加任何内容。连续合法resume保持同一session；绑定刚落盘但task保存尚未完成的中断，允许最近binding为直接前任务ID。legacy无draft重建时，第一次保存新draft前清旧sessionFile/binding并设sessionInitialized=false，避免把旧会话绑定到新草稿。

E10：task.pendingRequirements只作派生状态，不作为已读证明。read_requirements先保存requirementPageInFlight预留，不提前减少coverage；返回原文为kind=requirement-page。恢复及每轮原生prompt完成后，从native已持久user消息的完整history digest标记、read_requirements实际toolCall/对应toolResult重建连续覆盖。校验同一memory digest、调用ID/参数、total/offset及精确脱敏原文页，不信模型自由文字或compaction摘要声称已读。初始完整history仅真实user消息落盘后视为加载；初始化前kill出现尚未创建conversation文件，只有sessionInitialized未确认时诚实以initialization-interrupted-context-rebuilt重建，已确认持久文件丢失仍拒绝。coverage派生状态可落后，重开依据native消息恢复；已有task空coverage不允许绕过未送达页。

E11：skill整文件删除旧shared budget、3/6配额、correction allowance和runtime/external合计一次重试说明，保留真实分类、语义候选、证据及换策略要求。SDK供应商retry1仍只是传输参数。

E12：失败证据缓存扩到build、完整verify业务/runtime及静态invalid plan，键为sourceDigest+工具名+完整脱敏安全参数，保留原失败结果。同一失败操作第一次重复直接返回kind=reused-tool-evidence，免重开构建/浏览器并给换策略提示；已提示且无新诊断证据则no-progress，可恢复暂停，即使同一PI工具链始终不返回外层prompt也有效。不同源修改/新读取诊断/不同检查计划可继续；新证据变化后允许实际重试。使用progressEvidence的稳定内容集合，动态usage/time不算进展。selector-missing保留动态缺目标语义，不归稳定重复缓存。没有新增全局次数帽。

E13：PUT /api/projects/:id/memory根值必须plain object，不能是array/null/primitive。goal/constraints分别可省略，省略保留原文；显式值必须string，新改内容每字段<=既有48000字符，已存更长且原样回传兼容。changes省略保留原数组及时间，提供时仍为array<{text:string,time?}>；每条<=48000或匹配已存长原文可合法回传，不按历史累计长度拒绝。非法格式返回400；未知顶层字段沿用忽略，响应完整public project。1mb HTTP请求安全限制保留。MemoryModal历史文字未实际改变时只发goal/constraints，不重写全部changes或时间；历史确实修改仍兼容全量编辑。

新增工程证据（隔离本地模拟模型，真实PI，无商业模型/Key/用户现场）：

- test-results/studio-continuous-review-final.tap：4/4，E9同项目错会话文件零追加、合法多次resume；E12连续工具链同build/business/static失败复用暂停与新诊断后成功；E10页预留保存后/result append前、初始化history prompt前两个真正子进程硬kill窗口及恢复。对页覆盖故意把task.pending置空，仍必须从实际native原文重新读取。
- studio-continuous-review-compat.tap：11/11，受影响连续制作9项及旧3检查之后的成功2项。重复失败的正例使用不同完整检查计划，避免把无变化重试称作进展。
- studio-continuous-memory-partial-final.tap：1/1，累计>48000历史仅修constraints、原长条目全量回传兼容、root及字段非法格式；历史全文/time保留。MemoryModal JSX使用本地Babel parser验证，无全UI重构。
- 初始studio-continuous-review-initial.tap保留部分失败日志：页硬kill测试原inline child命令超Windows命令长度，改为临时脚本文件后studio-continuous-coverage-r2.tap 1/1，再最终4/4。原测试残留的两个确定自有node进程已核对后结束，未动用户服务。

这些是开发者定向证据；原生auto threshold及独立QA反例由B安排冻结SHA复验。未重复全部QR/native检查，原有效范围证据继续复用。本轮无main/push/打包/真实模型/新增依赖。


## E14–E15 最小余修

E14：build-required是尚未编译当前源码的前置条件提示，不是编译后同一检查计划失败的证据。此kind不进入toolFailures，并在加载时清理历史同类缓存；write→未编译verify→build成功→同计划verify不会再被旧前置错误阻断。实际同源码构建失败仍复用原失败及换策略反馈，无变化时可恢复暂停。

E15：wrapper内execute普通throw统一转成脱敏isError、kind=tool-error、tool/error，进入同一失败证据缓存和进展记录。优先检查signal与executionFailure，checkpoint-failed直接抛出；用户停止、状态保存失败不能被当普通错误吞掉。重复缺失read、非法write路径/禁用document、错误需求页均在同一PI连续工具链里复用证据后暂停，不需模型先返回null触发外层。纠正参数产生不同键，可继续交付，没有新增任意停止次数。

定向证据：test-results/studio-continuous-tools-initial.tap 4/4（E14真实Edge同计划编译后两次passed、历史前置缓存清除；E12真实构建失败缓存负例；E15连续错误与参数纠正、脱敏/stop）；studio-continuous-tools-checkpoint.tap 1/1追加覆盖写入后checkpoint失败优先抛；studio-continuous-core-migration.tap 4/4（passed/stale/failed与父项），stale/failed精确assert code=no-progress并保留旧revision1，passed绑定digest不变，删除不可达旧pending分支。只跑受影响组，未重复native/QR全套；原失败与有效历史证据不覆盖。MemoryModal最终状态按E13已修改，CLI未改。
