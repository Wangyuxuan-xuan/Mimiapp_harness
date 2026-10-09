# 读书任务选择器失败独立只读核查

2026-10-09。产品包ccae82b；QA未提交或重跑本任务，用户在正常窗口接管项目后发起。project6525c536-586f-4ffe-9894-24f72c4d9b92，task2d78c133-ff3a-4396-b714-ba8c689261ed，revision0/readyfalse。任务已自然failed，reason verification-budget-exhausted/resumablefalse；toolCalls13/buildAttempts1/verifyAttempts3/verifyCalls4/verifyRejected1/repairPrompts0/budgetUsedMs76446。

仅只读该任务明确命名的session：2026-10-09T09-19-43-403Z_01a11ff6-152a-7303-9554-611069401081.jsonl。未输出模型正文/源码/配置/令牌/Key；按message序号只抽工具名称、read_file路径、verify步骤和结果。未读取其他会话或凭据库。

忽略目录内诊断脚本test-results/studio-002-reading-trace-check.mjs已实际执行，先断言sprout-task customEntry.taskId精确绑定，baseRevision0/sourceDigest61179d3b98a7361d8c6d7de29338dcd2ea2b282aaecc08b1836a6e5a78b3108d；再输出匹配toolCall/toolResult ID、时间和限定字段到test-results/studio-002-reading-trace-1791537962130.json。四次verify调用时间09:20:47.391Z、09:20:51.893Z、09:20:54.658Z、09:20:57.067Z；四个toolResult ID均精确对应，isError依次true/false/true/true，最后是实际预算拒绝文本。这是已保存工具反馈证据，不仅是源码推断。

| message序号 | 同一已保存PI会话事实 |
| --- | --- |
| 3/6/9 | list_files，read_file读取index.jsx、index.css、app.css、vendor/qr/index.js |
| 11/13/15/17 | 三次write_file，一次build_preview |
| 19→20 | verify第一轮16步，步骤4 text `.section .label`期待“书名”失败，实际匹配“书名”“作者（可选）”“总页数”三个元素；toolResult isError=true，kind real-browser |
| 21→22 | 模型收到错误后同session修改计划，label改`.section .field:first-child .label`、input按field nth-child细化、quick改`.quick .chip:first-child`；16步实际passed，toolResult isError=false。期间没有read_file/write_file/build |
| 23→24 | 模型另做进度二维码4步检查：click `.card:first-child`、click `.btn-ghost`、count `.qr-box`=1、qr逐字期待《活着》 当前第120页 / 共200页 进度60% 作者余华。步骤2 strict mode失败，匹配“生成进度二维码”“返回书架”两按钮；toolResult isError=true |
| 25→26 | 模型同session再改第二步为`.section > .btn-ghost:first-of-type`，其余count/qr期待相同；第四次verify调用被宿主预算拒绝，未执行实际浏览器检查。未因此宣称该选择器正确 |

独立结论：不是“工具错误完全没有回给模型”；已有具体候选文本的Playwright错误经toolResult返回，同session模型实际两次改计划，第一次改后通过。repairPrompts=0只表示没有走模型提前结束后的宿主续提示，不能据此认定没有反馈。问题是前一定位错误及成功子检查共同耗去三次实际检查额度，第二个歧义改计划后没有剩余额度；第四次被拒，最终没有交付。现有最后一次修正使用位置选择，不能当作已经准确按语义定位或完整业务通过。

待工程方案与QA新隔离自动轨迹：两个同类按钮返回结构化候选/必要上下文→模型同session按目标语义纠正→真实浏览器执行并保持原count/qr业务期待；负例拒绝盲first/错误候选/空页面蒙混。预算应区分定位计划错误与真正业务执行失败，工具/时间/构建/显式停止及累计恢复仍有界，不能仅增加次数或人工新需求。当前QR未启动，无QR task ID；原用户项目不修改/重跑，源码唯一writer仍由B安排。

## 独立复验门槛（实现前冻结）

1. 实际Edge动态fixture含同class的“生成进度二维码”和“返回书架”两个按钮，只有目标按钮产生可解码进度二维码。错误的宽选择器必须拒绝执行，不触发任一按钮，结构化反馈列出两个真实候选及必要定位上下文，不泄露源码、storage或凭据。
2. 实际PI工具链采用可审计的本地模拟模型，下一响应必须依据上一toolResult所含候选选择目标；不能用预先不看反馈的固定动作列表冒充“依据反馈纠正”。同一session/task/初始自然需求，不追加人工需求，不重编译相同源码。正确选择后实际Edge点击并按原进度文字逐字解码通过。
3. 选择“返回书架”或使用盲first不能蒙混通过；二维码数量/解码期待不变，错误业务结果仍失败。真实业务断言失败仍计对应预算，计划错误不能无限免费重试；持续错误有界停止，旧版不发布错误候选。
4. 核对预算预留和硬中断、显式停止、恢复累计；复用已有有效证据，仅对新增分类/计数边界补检查。模型在一次成功后扩展第二子检查时，首轮歧义→纠正成功→第二歧义→纠正成功应在同自然需求内可完成，不能重置总工具/时间/构建预算。
5. 正负例源码纳入持久测试，报告绑定产品/测试SHA；本地模拟通过不替代后续真实模型同自然需求证明。原用户failed任务与原包均保留。

## Fixture准备实际结果

B正式授予主树唯一QA新增测试窗口后，非产品开发qa_repair新增tests/qa/plan-correction-fixture.mjs和plan-correction-journey.test.mjs，未动产品/现9源码。实际Edge fixture自验1/1通过，日志test-results/studio-002-qa-plan-fixture-selfcheck-utf8.tap：三label歧义、两同class按钮且“返回书架”故意排首；宽click被strict拒绝、两按钮点击计数均0；错按钮无QR；正确语义按钮动态生成《活着》120/200=60%余华二维码，在完整375×720截图中精确解码；count多匹配合法。首次fixture HTTP漏UTF8导致乱码，失败日志保留，仅修fixture后通过。

响应式模拟模型已准备，纠正分支必须读取实际上一次toolResult并断言failureType=plan及唯一目标候选，再经明确候选adapter产生语义CSS，拒绝first/nth。尚未接入冻结产品，不能声称同session新预算通过。源码写入窗口已归还、无测试进程；等待精确候选字段/新产品SHA再授予适配窗口。Lead只读审查完成，下一次适配须将originalPrompt保持用户原句“做一个记录读书进度的小程序”，不以补充人工精确步骤代替自主纠正。

B随后明确指出准备prompt包含“生成…二维码”会被现有宽规则判为text-qr。Lead在子代理归还写入后只修originalPrompt一行，现已是用户原句；实际调用verificationRequirements，project title及memory.goal均“读书进度”，断言profile=general通过，fixture语法通过，未重复Edge。完整同session须保留同样title/goal绑定，工具steps中的实际进度QR仍逐字检查；不inject requirements或修改validatePlan。原文字二维码短文/120中文/empty严格8例继续独立保留，宽分类规则边界仅记录不在本任务擅扩产品目标。

## 冻结前新增边界

B/工程中间审查发现并交产品writer修，QA尚未称通过：唯一外层容器内含两个input时，子编辑定位应typed plan并返回子候选；maxlength截断或实际value不符仍business。候选必须排除opacity0及透明祖先，不可泄漏input/contenteditable编辑内容；contenteditable空值/plaintext-only按isContentEditable处理。原selector多匹配仍报歧义，不能宿主visible-first。稳定重复缓存只限syntax/ambiguous，missing0不能按稳定歧义直接停止；仍受3plan/6runs限制。loc.count异常、targetclosed/browser断开与显式abort不得泛化成plan，恢复/停止保持原累计规则。

已把这些边界续交独立qa_repair在唯一主树新增测试窗口准备。待实际产品冻结后相称运行新旅程与必要既有QR严格门；不提前反复运行活动实现、不动用户现场。

## 完整旅程源码适配冻结

qa_repair已完成上述两新增文件适配并归还主树唯一writer，只有两文件node --check通过，未运行活动产品。支持STUDIO_QA_PRODUCT_ROOT绝对realpath且限定本仓库.worktrees受控Git顶层/clean，STUDIO_QA_EXPECTED_PRODUCT完整SHA不符硬拒，所有Store/agent/harness/verify从同root加载并记录摘要。正例原自然prompt/general，模型读真实candidates及suggestions纠正，两计划错+两业务passed的持久期待为business2/plan2/runs4/build1，核唯一session/custom task/四次已persist预留及旧版不变。负例含错误候选/first业务失败、count多匹配、恢复累计/旧三次不得复活、真实子进程在已持久预留后硬kill一次扣账、内部两个input、maxlength business、透明祖先和contenteditable隐私。Lead已只读审查。

待冻结精确版本后运行。尚未补运行态runtime/external一次重试及stablePlanKind/missing0连续轨迹，仍须最终合同后最小适配，不据此称全覆盖或产品通过。当前商业QR任务0，用户项目不重跑。

最终合同预告仍非冻结：planKind为selector-syntax/selector-ambiguous/selector-missing；静态kind=plan-rejected不带planKind。重复缓存只syntax/ambiguous+同sourceDigest+完整stepsDigest，missing/runtime/external不缓存。工具结果budget含version2、used/remaining、transientRetryLimit1，键business/plan/runs/transient/tools/builds/timeMs，须为持久后快照；transient初始remaining2仅表示首次故障和一次retry，第二次错误即终止。候选禁所有isContentEditable正文，role/祖先role上限100。已交独立QA冻结后补对应最小轨迹和快照断言，当前不运行活动实现。

## 用户方向更新后的停止与恢复入口（覆盖上述固定预算门槛）

B曾放行产品fe4ba9bd0fad1b3d15a1877123ba3828f857a187/受控repair tree独立复验，QA已续派，但随后用户明确取消正常任务固定检查次数/硬时长/tools/build预算终止。最新要求：保留真实结构化反馈/业务验收、PI压缩、持久恢复、用户stop；重复无进展应换策略，不能以任意次数耗尽为结束目标。QA立即停止旧v2适配和执行。

实际STOP确认：qa_repair本放行回合只读产品文档/冻结实现/源码，未新增修改、未启动任何测试/本地模型/Edge/服务/子进程，无进程待终止或数据待清理。两untracked文件保留并归还writer，fixture SHA256 5d3e804804fb1d93505b2f48a7202a63511209cc63b9d240f9574211a905086f，journey SHA256 5c238de2b919f9b7dd716d74b61d50ebc9b12d31184cd604785283fa720fb291。旧固定预算断言仅为旧方案待改源，不记新方向通过；没有新增产品v2或新verify QR8独立运行结果。

现等待B/工程新最小方案与明确适配窗口，验收改持续反馈修复/压缩与恢复/用户stop/交付。历史fixture语义/候选隐私/QR有效证据按版本和范围复用；用户项目/原失败现场保护不变，没有商业模型或打包放行。

## 连续执行合同下的独立QA准备

B已锁新合同并安排产品独立分支codex/studio-002-continuous，正式续派qa_repair为主树唯一两新增文件writer。当前先本地PI 0.99.1 SessionManager.open/compaction能力核对、测试计划及精确字段依赖，不运行未冻结产品。正常task无固定tools/build/verify/hostprompt/resume次数/总10min终止，计数仅usage、无remaining；结构化候选/分类隐私/严格QR/current-source发布门保持。

精确旧session与持久draft恢复需核项目路径/baseDigest，失败/stop/hardkill保留；resume旧passed失效须新build/verify，不重放工具副作用。旧无draft诚实基线退化，旧budget任务可显式继续，不自动操作用户项目。原生compaction与事件须有实证；system仅goal/constraints，长历史原文走可压缩user上下文；超初始化容量read_requirements分页全覆盖后可交付，不手写summary。稳定重复plan返缓存/换策略，不任意次数终止；供应商故障诚实可恢复，SDKretry1仅传输。

测试自身timeout只隔离防挂，不是产品限制。跨旧时间阈值可用持久历史usage种子后真实继续观察，不实际空等10分钟、不称压力运行；硬kill/session/草稿/不重放/当前源码重验须实际过程。精确API未冻结前只准备，不猜字段。QA Lead不并发代码写入。

QA Lead影响只读确认：现cli-journey第31行把toolCalls40+resumablefalse、无reason的人工fixture判不可恢复；旧preview-journey仅测试任意resumablefalse/true按钮投影。新合同须区分真实历史*-budget-exhausted/timeout可显式继续与completed不可恢复，旧人工false不能继续称40预算门。上述现9源码不在当前两文件writer范围，只登记依赖；待当前writer归还后另排串行CLI/preview适配，B不改QA断言。工程agent-budget/repair-loop旧限制由产品writer调整，QA不并发代改。

本地PI 0.99.1独立只读核对：SessionManager.open(path,sessionDir,cwdOverride)支持指定文件/cwd，但项目/draft授权绑定需产品承担；docs/sdk.md强调SessionManager权威重建finalized context/active branch/compaction，不能仅赋agent.state.messages。agent-session原生threshold/overflow路径appendCompaction后刷新finalized context，提供compaction_start/end(reason/result/aborted/willRetry)事件。SDK overflow compact-and-retry与传输retry分开，不是产品整任务次数上限。未另外运行SDK或活动产品。

独立连续旅程计划已形成并回B：原句/读书goal及实际候选纠正；历史usage超过旧阈值后真实继续；一次唯一草稿标记hardkill再精确session/draft恢复、不重放且旧passed失效后重buildverify；显式stop/错项目绑定拒绝/旧无draft诚实退化；高reported usage触发真正SDK auto compaction并观察事件/持久entry/后续上下文和早期要求；read_requirements全分页覆盖后发布/外故障可恢复。精确字段待冻结：draft路径/会话绑定/createTask继承与baseDigest、usage快照、恢复校验失效、compaction映射及测试配置、分页参数与coverage摘要门、旧无draft退化原因、cached no-progress/外故障reason。两新增文件暂未改、未运行活动实现，不据此称测试通过。

B补SDK恢复依据：pi-ai/dist/api/transform-messages.js125起原生orphan tool_call补isError “No result provided”，不重放工具副作用，并过滤errored/aborted assistant；产品应复用，不自行修历史。QA恢复断言须检查已执行副作用只一次及原生缺结果处理。活动实现压缩订阅误用auto_compaction_已被B发现交修；独立QA必须实际compaction_start/end订阅及持久记录，不用test seam手工task状态冒充原生事件。已交qa_repair下次冻结适配，当前仍不写/不跑。

进展判断新增独立门槛：连续读取不同源码或获得新诊断也属新证据，不因暂未write或跨旧3host轮就暂停。正例本地反馈模型依据实际不同源码证据继续并最终交付；负例同source/同plan在收到纠正提示后原样重复，可恢复暂停而非换任意计数终止。工具名及安全args/result摘要指纹应区分新证据与相同read/错误；不以手工注入进展状态代替真实工具轨迹。接口仍待冻结，未运行产品。

## Continuous冻结后的独立适配执行

B正式放行16a0f89fb773c1fd8f1ee985f662026c4c42e9f4，受控D:/app/.worktrees/studio-002-repair、codex/studio-002-continuous，Lead及qa_repair独立核HEAD/clean。qa_repair已取得主树两新增源码唯一writer，先按实际docs/studio-continuous-implementation.md适配再执行；合同无接口阻塞，不运行旧v2额度目标。task.executionPolicy continuous/accountingVersion2；task.usage仅tools/builds/verificationRuns/repairPrompts/timeMs/cost unknown，verify toolResult usage无remaining。精确draftRef/sessionFile直系basename与recoveryMode三枚举；原生compaction_start/end映射真实task.compaction；read_requirements连续分页/digest覆盖为交付门。

本阶段本地反馈PI/真实Edge/fixture build，不Taro/商业模型/桌面包/current/用户现场；真auto compaction独立补验，不拿开发manual结果替代。QR8用ignored精确resolve hook仅映射现测试verify import到冻结tree并记录摘要，不改现9源码/不copy产品。旧CLI/preview另排串行适配，无并发写。收到失败立即报告并保原件，测试自身timeout仅防挂。当前适配开始尚未开跑，不据此记通过。

最新撤回16a产品执行许可：工程只读发现E9同项目错session缺旧sprout-task绑定校验，E10需求页coverage已save而toolResult未入会话/初始history未落盘的硬kill窗口，E11skill残旧额度提示。B已交产品writer最小修复，QA两文件可继续适配但不启动16a测试。新增独立负例：错同项目session拒绝且不得追加binding；页coverage提前save未落盘硬kill及初history窗口恢复必须依据实际会话或保守补读。Lead已向qa_repair立即传撤销并要实际进程状态，不自行修产品。

工程另报E12同PI连续相同build/business/runtime错误时外层noProgress无机会执行，仅selector工具去重；待B锁范围再补相称轨迹，不擅设次数门。length本地SDK已有原生可恢复处理，最终不可恢复可诚实保存resume；真auto测试须核原生恢复后host不会因旧length误终止。现仍无独立通过声明。

E12随后已由B正式锁入：同PI连续tool_call无null返回的重复build/business/runtime/静态invalid plan，工具内依据source/完整args/稳定错误/已反馈和新证据识别，返回known evidence并要求换策略后仍无新信息可恢复暂停；代码变更/新诊断/不同计划允许继续最终交付，不另加次数帽。已交独立QA准备正负例。

实际执行状态确认：16a本轮没有启动node:test、Edge、HTTP模型或子进程，只有两新增文件源码适配/只读，无运行待终止或清理。旧额度断言已删，continuous usage/旧高usage显式恢复/精确sessiondraft硬kill恢复准备中；依B许可继续只适配E9/E10/E12，等待新冻结SHA后运行，16a执行禁止。QA Lead不并发源码写入，用户现场未触。

E13已由B正式补入：累计历史>48000时只修goal/constraints应允许省略changes并原样保留历史及时间；合法全量编辑兼容，非法格式/单条保护仍生效。独立QA在两文件窗口准备隔离HTTP正负例，最终精确memory合同待freeze；真实MemoryModal UI行为另需新dist/最终包绑定，不为准备额外Vite/Taro。现9源码不并发，旧root执行禁令不变。

连续旅程准备已冻结归还主树writer：仅两新增文件node --check通过，未启动任何测试/Edge/HTTP模型/子进程，无清理需求。fixture SHA256 2dce559e8834e2a70ca9550e904219712102f6a74a5f98d4ab3149bd39a3869d；journey SHA256 5447a780649a18343eaacc9ec7170ae88c00374ebd928749175f2e7eb2e77486。已备真auto threshold请求/事件/entry、六页全文覆盖、跨四host不同读取、旧高usage兼容、精确sessiondraft恢复、E7E8隐私、E9错会话拒绝、E10两硬kill落盘缺消息窗口、E12连续无null失败与新证据正例。

待新冻结SHA后最小核对E10初history真实持久形式、E12复用错误feedback kind（当前行为断言不猜），并补E13精确memory HTTP partial/full格式/单条上限。当前无代码writer/测试进程；B拿新产品版本及最终合同后续派独立运行。上述是准备和语法证据，不能称产品通过。

新增legacy初始化边界已交产品writer：真实r1旧task可能有sessionFile但无draftRef，重建新draft第一次persist若仍带旧session引用，硬kill后会误作native恢复。独立初history窗口负例须覆盖此分支，依最终初始化stage/原子清旧引用合同，确认诚实current-source-context-rebuilt与精确native恢复分开，旧session不误追加、新草稿不混旧会话。已传qa_repair留待下一冻结适配窗口，当前不改源码/不运行产品。

## 新冻结bebe8ca独立验收放行

B已正式放行bebe8ca4093d3d1f59b237b4d53ed1fc02a64bc9（parent16a），受控repair tree clean。Lead核HEAD/clean并读最终实施记录，实际续派qa_repair唯一两新增源码writer最小适配+运行，不以开发证据作QA通过。E9原native getEntries绑定/header cwd检查前不得追加；legacy新draft首保存清旧引用/sessionInitialized=false。E10requirementPageInFlight预留，已读依据native真实user原文及配对toolCall/toolResult重建；initialization-interrupted-context-rebuilt明确退化。E12复用kind=reused-tool-evidence，真实新证据可再推进，无新全局帽。E13partial省略保留/全量兼容/非法400及长原文兼容按最终合同测试。

本轮含真auto threshold、E9错同项目会话零追加/零模型、E10页结果前/首user前/legacy首persist硬kill、E12同PI稳定失败及新诊断、E13长历史partial，必要QR8映射真实冻结verify。禁产品写/current/Key/商业模型/Taro/包；旧9仍另排串行，无并发。当前开始适配，实际运行状态和失败将以新日志记，不声明已通过。

再次暂缓bebe产品执行：工程集中审查新增E12 build-required前置反馈错误缓存，成功build后同plan首次verify可能仍返旧反馈；E15 execute普通throw（非法write/缺read/错需求页）不进失败证据，同PI可持续重复。B等待安全停状态后由产品writer定向修复。qa_repair已明确确认本轮只读HEAD/clean及两QA文件，尚未启动产品测试/Edge/模型服务/子进程，无PID/运行日志，适配也暂未续写。Lead只读CIM精确QA测试标识筛选无匹配作为补充，不替代执行者确认；已报B可安全放行writer。QA仅准备两新增测试，不运行旧root/不改产品。

后续串行依赖再明确：两新文件writer归还后再改CLI旧人工40/resumablefalse拒绝，使用真实历史quota reason显式resume成功、entered+1/usage继承，保留source/base失配拒绝；preview可保留无reason人工false，但补真实历史public projection。当前不并发改现9，不商业模型/current/Taro。

两新增源码最终准备冻结归还：journey SHA A414A36D223248936334D148AF81E508F23AA430CD1AF68F1FEC65B4EDBEB8CB，fixture SHA2DCE559E8834E2A70CA9550E904219712102F6A74A5F98D4AB3149BD39A3869D，仅语法通过，无产品/PI/Edge/HTTP/子进程或新运行日志。E14/E15正反例已备，kind=tool-error预告收到，signal/checkpoint优先；等待最终产品冻结及审核，不宣称dev定向结果为独立通过。

Lead按B授权串行将主树唯一测试writer交qa_config_cli，仅cli-journey（必要fixture先报）迁移旧quota断言，准备及语法不运行旧main。实际CLI/server的legacy public投影+显式resume/entered/历史usage字段继承为本套范围，fixture runner不手造task.usage冒认真实PI统计；completed与source/base失配拒绝保留。归还后才安排preview，不与qa_repair并发源码。

## 2026-10-09 最终冻结4e43676独立实际首跑
- 产品树 D:/app/.worktrees/studio-002-repair，HEAD 4e43676b9cc03f8210e2d27936c88aa9d74dcb53；QA负责人及qa_repair分别只读核对clean。B正式放行，工程Lead最后增量复审无剩余阻塞。
- qa_repair实际执行新增旅程，显式产品root/FULLSHA门；首自然读书请求1/1通过，日志test-results/studio-002-qa-continuous-4e43676-first.tap。真实PI/真实Edge、本地模拟模型及确定性HTML构建，不证明商业模型/Taro/正常新桌面包。
- 剩余组自然收尾13pass/2fail，日志test-results/studio-002-qa-continuous-4e43676-remaining.tap；历史用量恢复、native硬kill、候选隐私、超过旧host次数、原生自动threshold压缩、E12/E14/E15、旧session首draft持久化、E13长历史HTTP均通过。
- 两项失败为长需求分页原文比对、需求回执前硬kill恢复原文比对；本地模型assert回500，产品诚实保存provider-unavailable。不是Store junction EPERM。首日志重复中文diff被PI错误消息截断，暂不能认定产品缺陷或测试缺陷。
- qa_config_cli仅完成旧CLI源码合同迁移及node --check，尚未运行；只修改tests/qa/cli-journey.test.mjs，SHA256 1f03f45e1c6b3c0fcbe6dabd46da37b9fd01adb90a1a4cc3d0c9c5cbe28a9729，writer已归还。实际回归须等最终主目录集成版本。
- 当前唯一D:/app测试代码writer为qa_repair，仅获准两处原文相等断言添加等强度短诊断（长度、firstDiff、摘要和页信息）；不得改期望或产品。仅定向复验失败两项并保留新旧日志；归还writer后再安排旧preview准备。QR8尚未启动。
- B独立基础五文件组首sandbox junction EPERM保留，正常审批恢复后37pass/1fail；唯一core旧精确5工具列表与当前6工具不符，B负责集成时调整并单项复验。本QA没有重复该组，也不将环境失败计为产品缺陷。
- 用户current、历史服务、密钥、商业模型、Taro、正常exe/打包均未触碰。整体待失败定性、新verify QR8、最终主目录旧CLI/preview回归及后续正常包用户历程，不记验收完成。

### 长需求首次失败定性及最小QA修复
- 短诊断复验仍2/2失败，实际页offset12000/next24000/total26019，actualLength12001对expected12000，firstDiff5205；硬kill分支同类firstDiff5819。并非产品分页裁切/持久恢复缺陷。
- QA fixture HTTP接收使用逐Buffer隐式转字符串，中文UTF8字符跨TCP chunk产生替代字符U+FFFD。纯内存在对应字节分界复现；Buffer.concat后一次UTF8 decode保持严格原文相等。诊断日志test-results/studio-002-qa-continuous-4e43676-page-diagnostic.tap保留。
- 已批准唯一qa_repair仅修fixture两HTTP收包点，不改产品或期望；两QA源码node --check通过。fixture SHA256 56B2D4211958F250A3C0DAE552359C3155BC056CB0E754CE315DB6D571E60F9F；journey等强度短诊断SHA256 D23D0FA9E7812D6208D4CA3ACCAA2627ACD99A064FB60C48CD1BB398E2E8FED1。
- qa_repair已归还源码writer，当前仅定向重跑失败两项，若通过即执行精确4e loader的严格QR8。当前唯一D:/app测试源码writer交qa_preview，仅准备旧preview历史reason合同迁移及语法，不在主目录集成前执行旧suite。

### 4e43676连续场景独立结论
- QA UTF8收包修正后，两项原强断言定向2/2通过：test-results/studio-002-qa-continuous-4e43676-page-utf8-fixed.tap，约17.5秒。
- 16个连续运行独立场景均有有效通过证据（首1 + remaining13 + 定向修后2），不是一次全绿首跑。原remaining13/15及诊断0/2原件保留，失败归属QA mock中文请求分块解码，不以此报产品缺陷。
- 精确4e严格QR8目前执行中：inline registerHooks仅映射qr-delivery对verify的导入至冻结产品树，root/FULLSHA/clean/hash门与QA_VERIFY_MAP实际命中日志要求保留；未复制产品代码、未改旧QR源码。
- 不将模拟模型/确定性HTML/真实Edge证据扩大为商业模型、真实Taro或最终正常桌面包用户历程。B已收到独立结论，整体尚待QR8、主目录最终集成后的旧CLI/preview及新包流程。

### 最终4e冻结树独立检查完成
严格二维码8/8实际通过，日志test-results/studio-002-qa-continuous-4e43676-qr8.tap；exec30631 exit0，约13.3秒。QA负责人已亲读QA_VERIFY_GATE/MAP及8项结果，确认实际加载4e树verify SHA256 51df7f4074ece2d852395462b97bf769dd99d40093c504486c3647f4e20eef46。4正例通过、4负例正确失败，未放宽断言或复制产品源码。连同连续16场景有效证据，此冻结树受测范围独立检查完成；产品树前后clean，qa_repair核无本轮自有node残留，writer归还。
完整本地证据与所有初失败日志路径：test-results/studio-002-qa-continuous-4e43676-summary.json。下一步B最终main freeze后QA接续CLI，唯一r2 dist后preview/E13 UI；最终正常包及真实模型用户历程仍未完成。

### 最终主目录集成后接续
B冻结main dbe7a6bc35861315f879cf4b3d2fe7b8809a2cec，7产品文件SHA与独立4e完全一致，core精确6工具单项由B复验1/1；正式放行QA旧CLI单套。qa_config_cli执行前核HEAD、产品路径git diff空、测试SHA1f03...，首次Store.init os.tmp junction EPERM(-4048)22ms退出，未进入CLI/服务/业务断言，first.log保留；按正常审批原命令定向恢复一次，新approved.log，不改断言。
B已归还产品源码writer；qa_preview当前唯一QA代码writer，仅preview-journey最小E13真实MemoryModal测试准备及nodecheck，60×约1000字符历史含固定time/内换行，目标约束局部编辑保持整段历史；不得改产品/helper/fixture。工程Lead独立打包r2，测试文件不在包资源内；待3dist核hash再实际preview，不提前重复Vite，不触current/模型。

### dbe7a6bc最终集成CLI独立通过及恢复入口
QA负责人已亲读test-results/studio-002-qa-cli-continuous-dbe7a6bc-approved.log，1/1 passed，套件约4.8秒/总约6秒。qa_config_cli记录17个真实CLI子进程及finally清理完成；HEAD前后dbe7a6bc35861315f879cf4b3d2fe7b8809a2cec，测试SHA1f03...不变，产品路径diff空。覆盖run/repair、使用记录继承、legacy工具额度/超时显式恢复（41工具/4构建/4验证/4恢复提示/>600000ms，非实际长时压测）、completed/sourceDigest/baseRevision拒绝、关闭客户端后台进度、工作区冲突、断流及stdin脱敏。首次sandbox junction EPERM日志test-results/studio-002-qa-cli-continuous-dbe7a6bc-first.log保留；不重复其他套件。
E13真实MemoryModal测试准备已冻结：preview-journey SHA25607ef5c25c4734c92601e069fadba57309f014ad73f62e4ef723aa2e6e42cebd7，本次+28行/legacy累计+45；语法/diff检查通过，尚未动态运行。全部QA代理现已结束自身执行、无writer。B/工程Lead正在唯一r2打包，待匹配同3dist摘要及正式放行后，由QA Lead复用qa_preview实际运行旧preview+E13，不另Vite。当前商业模型/正常current/newexe均未放行。源码可提交准确清单待preview动态通过后统一交B；QA不自行提交/合并产品。

### r2同dist preview首次执行及E13定位准备纠正
B正式放行r2唯一Vite stage/dist三文件，记录test-results/studio-002-b-r2-dist.json sourceCommit=dbe7a6bc；qa_preview核root/stage/record逐hash相等后正常审批实际运行。首日志test-results/studio-002-qa-preview-r2-e13.txt保留，首输入207ms/新建148ms、三尺寸真实控件、legacy15组合、completed HTTP400均走过；整套因E13读取历史textarea exact label30秒超时未通过。失败发生在fill/PUT前，不判断产品长历史保存行为。finally本轮资源已清，测试SHA仍07ef...。
已授权qa_preview唯一测试writer，只查实际DOM并最小修正为dialog内原可见label前缀过滤、count唯一后取textarea，禁止first/nth；全部原文/time/payload/reload断言保持。src/main.jsx:114包裹label和初始textarea长文本可能影响accessible name，需实际确认。冻结后定向E13；若嵌套setup限制必须短套重跑，可明确一次完整preview范围，不大改fixture、不重复Vite/model。B包产品仍dbe，测试不在资源内。
