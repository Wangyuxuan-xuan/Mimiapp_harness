# STUDIO-002 独立 QA 工作包

日期：2026-10-09（北京时间）。状态：进行中；本轮仅准备，不代表产品已验收。

## 责任与授权
- QA Lead：本聊天（小芽独立 QA 负责人）；B 最终集成验收：01a11ebf-e71e-71c0-97a1-86bcff83f324；A 总台账：01a11e93-220d-7ba1-bc51-23007e5621e4。
- 授权依据：用户提供的 D:/app/AGENTS.md“参与者可在已派发任务内按需继续创建执行聊天或子代理”及 TASKS.md STUDIO-002“每个工作包独立 QA，最后 B 核验”。允许必要的项目内部结果交流。
- QA 不实现产品，不改测试预期掩盖缺陷，不读取旧 Key/vault/配置，不重启旧服务，不覆盖用户项目，不发布、不产生新增费用。
- 基线：ae0d8af940c3aa5392e2ef2df70c28818e28539a。D:/app 的三个 .worktrees 已核实存在；C 盘 detached managed 树不使用。

## 实际安排
| 包 | 非开发者 QA | 只读对象 | 独占报告 | 当前实际状态 |
| --- | --- | --- | --- | --- |
| 1 | /root/qa_preview | D:/app/.worktrees/studio-002-preview | docs/coordination/qa/STUDIO-002-preview.md | c288bd2本包独立验证通过，代理已结束；集成Electron/扫码待验 |
| 2 | /root/qa_config_cli | 包2冻结证据13149253；残余取执行前实际主树SHA | docs/coordination/qa/STUDIO-002-config-cli.md | 核心证据已交；隔离残余定向验证已续派，最终包UI待产物 |
| 3 | /root/qa_repair | D:/app/.worktrees/studio-002-repair | docs/coordination/qa/STUDIO-002-repair.md | e3c8164八场景独立复验通过，P1关闭，代理已结束；集成待验 |

本文件和总覆盖表仅 QA Lead 写；三份报告各执行者写。A 独占 TASKS，B 独占总工作包。准备审查不构建、不启动服务、不调用真实模型，避免开发中竞态和重复编译。代理结束后记为已结束，冻结交付后续派；角色可恢复并不代表常驻。

## 用户全过程覆盖表
所有证据必须包含冻结 commit、包/资源版本、隔离数据根、端口、步骤、实际值和失败原文。历史 r5 结论不覆盖新版本。

| 编号 | 必须验证的行为 | 证据/判定 | 状态 |
| --- | --- | --- | --- |
| UI-01 | 正常双击稳定入口到首屏 | exe 与资源版本、实际首屏和可输入耗时；不以特殊测试启动代替 | 待验证 |
| UI-02 | 正常设置一次，新窗口、新项目、退出重开、升级复用 | 自造占位 safeStorage 实测；公开 hasKey/persisted；密码不回填；显式测试 profile 隔离 | 待验证 |
| UI-03 | 几秒内新建即可输入并执行 | UI 实测计时、构建未就绪仍可提交；真实异步准备状态；失败、取消、退出及制作不被旧准备覆盖 | c288bd2定向门控/浏览器通过，正常集成Electron待验 |
| UI-04 | 375×720 内容及空间缩放实际操作 | iframe 实际 viewport、完整手机截图、输入点击及不同可用空间操作；正常Electron窗口及最小支持960×700记录logical尺寸/physical boundingBox/scale，实际scaled iframe像素扫码短中文/120纯中文 | 待验证 |
| UI-05 | 真实自然需求生成文字二维码 | 实际界面输入短中文、长中文；整 viewport 二维码可见；截图像素解码逐字等值；空输入反馈 | 待验证 |
| UI-06 | 连续业务修改与自主修复 | 原始需求/后续需求、版本及业务变化；故障在同一累计预算内自主修正，无 QA 补源码/改预期 | 待验证 |
| UI-07 | 显式停止、耗尽、恢复 | 停止实际终止；耗尽诚实未完成；不提交失败候选；旧版与数据不变；恢复不重置预算、不伪继续 | 待验证 |
| UI-08 | 导出和正常重开继续 | ZIP 源码/Weapp/许可与交付版本对应；配置及项目恢复 | 待验证 |
| CLI-01 | 配置、建项、制作修改、进度、验证、导出完整命令 | 与 UI 共用 HTTP 业务；安全 stdin、不泄露占位字段；错误码/取消/退出清理；CLI 不替代 UI | 13149253核心25命令逐项+native5证据通过，整体脚本失败事件保留；成功制作/跨包待验 |
| GATE-01 | PI 模拟故障修复与提交门控 | 同 session 反馈、最新构建与真实业务验收门控、过期验收不能提交、讨论与制作区分 | f371856模拟及e3c8164空反馈修后复验通过，P1关闭；集成待验 |
| GATE-02 | 硬预算及继承 | 40 tools/3 build/3 actual verify/10 min、SDK retry1；工具前限制；恢复累计 | f371856边界/硬杀恢复复验通过；真实模型与集成待验 |

## 执行依赖与顺序
1. 各开发包提交冻结 commit、改动清单、启动方式、现有测试/真实编译证据。未冻结时仅报告风险，不验收通过。
2. 各包独立 QA 先跑相称的隔离模拟/业务检查。测试根各自独立，端口向 Lead 登记。真实 Taro 编译统一排期，已有有效产物按版本复用。
3. B 固定集成 commit、桌面包和预算。QA Lead 统一安排实际浏览器和正常桌面入口验证；每包报告不能代替跨包用户全过程。
4. B 明确放行后，QA Lead 为唯一真实模型操作者；A 在新稳定加密入口正常录入 Key，QA 只看公开就绪状态。此前禁止向 r3 或任何旧用户项目发请求。
5. 发现缺陷先保存原步骤、版本、实际失败和影响，报 B 交原开发者修复；独立 QA 对新冻结版本复验。实现结束、测试通过、交付和 B 验收分别记录。

## 停止与恢复
无新冻结版本时完成准备记录并明确等待版本，不重复重测。真实请求依赖未放行时继续离线检查。费用、发布、边界扩大交 A；范围内缺陷继续交 B。恢复先读 TASKS STUDIO-002、总包、本文件和三份 QA 报告，核对实际 git/产物及代理状态，再续派，不假定旧代理仍在运行。

## 准备交付与风险汇总

三份独立报告已实际读取核对；本轮没有运行测试、构建、服务、浏览器或模型请求。三个执行代理本轮均已结束，不称仍在测试。每项均待冻结复现，以下不作为确认缺陷：
- 包1：异步 create 可能令历史 desktop-close 测试立即访问 revision0，测试时序需核对；不得靠修改产品预期消除失败。集成 UI dist 必须与冻结源码对应。
- 包2：同 profile 不同 workspace 的单实例行为、流中断取消、CLI 入包/清单、会话文件 token 错误和退出清理需实际测试。
- 包3：budgetUsedMs 仅 finally 累积，硬崩溃恢复可能漏算；“把历史改为三条”可能把 QR 验收降为 general；无关 count=0 或常驻“内容”标签可能冒充空输入反馈。
- 既有静态 QR 图测试可证明解码器，但不能证明真实输入驱动生成，也不覆盖120字纯中文及整375×720画面。

A 已确认继续独立 QA 责任线：恢复预算累计及连续修改 QR 门控风险交 B 组织工程复现/修复，冻结后按原需求验证，不降低断言。最终真实 UI 证据须明确包版本、正常启动入口和配置归属，CLI 证据不替代 UI。接续核对时三个开发树 HEAD 仍为 ae0d8af，尚未收到冻结交付，因此不重复准备、不启动未冻结测试。

## 旧现场失败证据接收（不覆盖新版本验收）

B 交付 test-results/studio-002-user-preview-report.json，时间 2026-10-09 16:12:36 北京时间：r3 项目 d1e992e6-0bd0-4466-8a66-5c03ef23f0cc/revision3 现有编译预览，独立无 Studio 父窗口浏览器实际输入“一二三”，240×240 canvas 在375×720画面内完整可见，运行错误为0、Studio变更请求为0，viewport/fullpage截图均无法解码。该结果确认该具体版本短中文失败，不推定白缝等根因，也不代表修复版通过。

QA Lead 实际读取报告，并仅在离线对 B 留存的两张 PNG 重新执行 pngjs+jsQR（attemptBoth），均375×720、decoded=null；两文件 SHA256 均 8e39527c4db0ed64fbad5d6f6f9a57ced87fb771a7d4862d97731eb3c043cca2，故它们是同一像素证据，不算两个独立样本。没有访问旧服务、用户数据、模型或重编译。

B 报包1门控/core22项及Vite通过、唯一真实后台构建/Edge测量进行中；此为开发证据转述，待冻结与独立复验。包2/3仍开发测试中。冻结到达前不追加旧现场操作，真实集成验收采用新正常稳定入口，不以r5专用cmd代替。

## 包3冻结接续

B交付 f371856125f8f3c2f05aa1eca907603b41908588；QA Lead 已实际核对该树HEAD和clean状态，并读取docs/studio-002-repair-implementation.md及qr-positive/negative报告。开发39项相关检查通过为工程证据，非独立通过。positive报告仍为静态预编码QR和短于120字的长文，不能替代新要求的动态输入完整链；已有遮挡/截断/溢出失败证据可复用范围已知。

已实际续派 /root/qa_repair，允许新建隔离临时数据/随机端口、PI模拟及必要真实浏览器，禁止真实模型/旧现场/Taro重构建。执行原预算、讨论vs制作no-op、同session失败接续、硬终止预算继承/停止/旧版、强QR证据与独立动态输入反例。脚本/结果独占test-results/studio-002-qa-repair-*，报告仍由该QA写。包1/2冻结未到，本轮不等CLI、不重复整suite。

B补充最终集成UI判据：复用同一次真实模型产物/构建，在实际Studio正常Electron窗口和最小支持960×700对scaled iframe或桌面viewport目标区域做像素解码短中文/120纯中文，记录logical尺寸、physical boundingBox、scale。直接375×720预览通过不能推定缩放后桌面可扫。失败保存实际像素及尺寸事实，不调预期、不预制生成源码，不要求不受支持的更小窗口。

## 包1冻结接续

B交付 c288bd2a3ce0570bc0fe9fe8e88405fdb490077e，QA Lead核对HEAD，源码无已跟踪改动，但有四个未跟踪.test-preview-*工程测试目录，不纳入源码或清理他人产物。已读实现记录和UI报告，工程证据195ms/488ms可输入、29757ms真实双端准备，三种窗口均保持逻辑375×720；历史跨域和resize脚本失败原样保留。以上非独立验收结论。

已实际复用 /root/qa_preview，授权隔离门控与相称实际浏览器，复用作者现成Taro产物，禁止另起Taro构建（必要时先由Lead协调一次）。重点初始化取消/失败需求并发/停止关闭/中断首任务重启基线保护、375×720缩放/实际操作/resumable。结果独占test-results/studio-002-qa-preview-*；最终实际Electron缩放扫码仍由集成真实链验证。

包1独立本轮已结束：11项定向门控及实际Edge输入/失败轮询/缩放/继续按钮通过，无确认产品缺陷。首输入215ms来自已有ready首项目的page.goto至fill；新建184ms来自点击创建至弹窗关闭/fill。冷seed门控独立验证不等待，冷启动实际195ms沿用作者证据，不能混成一次独立冷启动实测。逻辑375×720、320/414模式及1280×900/960×700/1600×1000缩放、实际frame点击通过；不算blank应用业务或二维码通过。自己全部服务浏览器关闭，Taro0、模型0。原环境/脚本时序失败日志保留。

## 包3独立缺陷与工程接续

f371856 实际 Edge 动态短中文/120纯中文正常输入生成解码通过，遮挡负例失败符合预期。但独立故障 fixture（constant-empty-label）始终显示“请输入内容”，空输入点击直接return且保留旧二维码，verify/计划/证据门均误判passed。原脚本与结果test-results/studio-002-qa-repair-dynamic.mjs/.json。该缺陷已报B，B已派原writer最小修复；空反馈验收不通过，不改期待。允许真实提示变化或二维码消失，不要求所有实现必须清除旧二维码。隐藏text误通过也由工程一并核对。由于原树进入后续写入，独立QA受告知须保护原SHA证据并等待新冻结复验，不混用版本。

## 包2冻结接续

B交付自有提交398de9ae835aacef957d002e3ab5993194175e7c及13149253d1a0f5fb0d0f9c710b988d5c62b97660；QA Lead实际核对HEAD13149253/clean，内含包3依赖ddecf35（f371856内容），不重复拣选。已读CONFIG-CLI-EVIDENCE与studio-cli说明，22项工程证据非独立验收。

已实际复用 /root/qa_config_cli，授权新profile/测试root/随机端口、实际CLI命令与PI模拟/必要原生占位加密测试，禁止真Key/模型/旧配置/服务/用户数据/Taro重构建。只写本包QA报告及test-results/studio-002-qa-config-cli-*。CLI完整命令不可由client调用代替；需Taro则先Lead协调。最终Electron/真实模型全UI由集成验收承担。包3常驻空提示缺陷统一待包3followup，不记包2自身降低profile。B集成verify取消初始化、restore响应时序仍待跨包核验。

## 集成边界及修复复验接续

QA Lead实际核对并在57177cb6c4d28f484388d21ec34caaa72a81b93e独立运行两项集成边界，2/2通过，报告docs/coordination/qa/STUDIO-002-integration.md。未ready verify400不abort后台；restore清理前不发成功，清理后立即真实Edge verify200，revision2/结果绑定正确。原沙箱EPERM日志保留、正常审批后通过；Taro0/模型0。

包3followup e3c816432963f84da6583510a87d6152594f5ff8已由QA Lead实际核对clean并获B正式冻结确认，已续派原qa_repair。使用新脚本/新JSON，实际读取HEAD/源码摘要，原f371856 constant-empty-label误pass原件不得覆盖。只复验空反馈原步骤/正负例和新证据门，不重复预算suite/Taro。

包2测试仍执行中：help/config status/save/test实际命令初步成功；projects create40秒超时正在一次最小附着/loopback诊断，尚未判产品缺陷。Lead已要求确认是否误进入native真实编译并仅关闭自己进程、记录事实；未知附着前禁止再create，不把未明原因算通过。原生配置不建项、不碰旧profile。最终以该包报告为准。

包3followup结论：QA-REPAIR-001在e3c8164独立八场景复验关闭，实际HEAD/clean/verify SHA256执行前后一致；原常驻标签拒绝，真实新提示保旧QR/清QR/“请先输入”接受，hidden/透明祖先/遮挡拒绝。新报告路径独立，旧f371856原件保留。代理本轮结束，无测试进程；未重预算suite/Taro/模型。

包2QA脚本事件：一次projects create漏传隔离env，尝试默认profile自启并超时，不能称全程隔离或Taro0；编译是否发生未知。QA已停止超时CLI，正常审批只读进程检查electron.exe为空，无未知进程kill、无默认profile/session/vault读取；原错误报告PID23564是结束的自建mock Node。后续统一启动前强制隔离env断言，截获另一漏env调用于spawn前，未再默认启动。正确隔离路径已有25实际CLI命令初步完成，原生配置仍执行中，最终以完整报告为准。

包2最终报告核对：补充确认是两次projects create漏env默认误启动超时，不是仅一次；实际编译次数/产物未知，原始failure均保留且未读默认配置。25个正确隔离命令逐项有有效证据，但整体脚本后续另一次QR命令被隔离硬断言于spawn前拦截为failed，不能改成整体passed；正常run成功制作/连续业务修改、QR非法计划等尚待集成证据。native-only新报告5实际命令通过，原生DPAPI stdin保存/重开/AB隔离/清除保endpoint/lease/session清理通过，明确只指native-only。TTY/强杀断流/同profile异workspace独立缺口及UI/多窗/升级待验。没有确认包2产品缺陷。有效25项不重复。

当前QA继续入口：三个包的局部独立执行已结束，包3P1已关闭，两集成边界通过；等待B固定包含全部修复的最终桌面包/manifest/准确SHA/正常入口并放行唯一真实模型。A正常UI录入新稳定加密配置，QA只看公开状态。之后按UI-01至08及CLI剩余成功制作路径接续，B最后亲验；不把局部结论或旧r5当完整交付。没有本QA聊天独立唤醒承诺，B/A交付消息恢复。

B后续工程集成证据：71项中70通过，CLI旧fixture新建后立即run取消背景准备后verify未ready失败；仅两处复用waitProjectReady（主项目run前、QR项目verify前），业务期待不变，定向5/5通过，无产品改动。此为工程集成转述，不冒充QA全量独立通过，不重复71项。固定正常exe之前QA不调用真实模型。

## 最终包待产物与执行准备

B指定最终源码ccae82b131abe30a7b9cc682c1b18712830d8dce，工程Lead唯一打包到D:/app/release-harness-20261009-studio2-r1。QA未启动该包或请求模型。最终执行单docs/coordination/qa/STUDIO-002-final-execution.md已写，离线实际像素分析辅助test-results/studio-002-final-pixel-check.mjs仅语法检查，不接触服务。

最终正常入口公开hasKey若意外为true先报B，不清未知配置/读取vault；此前QA默认误启动可能留下占位但不能推定归属。原生占位加密已有相称证据可复用，真实Key仅A正常UI录入。B还须明确放行唯一真实模型操作者；固定包完成前不启动，模型预算沿40/3/3/10min且恢复不重置，长文/空反馈/等值不降低标准。

B要求包2残余独立补验，已实际复用qa_config_cli续派，仅隔离mock/占位/必要native（无真实模型/Taro），不重复25已有效命令。目标成功CLI run/repair/预算继承、TTY隐藏、异常断流/关闭、同profile异workspace拒绝；执行前实际SHA/产品clean核对，统一helper强制绝对隔离env避免漏传。新证据studio-002-qa-config-cli-residual-*，旧文件不覆盖。正常多窗及包内CLI连接当前正常exe先准备、产物完成后再验，不虚称已通过。

## 最新阶段结果与持久回归

包2残余11实际CLI/6核心路径通过（fixture runner/build），真实PTY隐藏输入独立通过；mock宿主没有Electron原生lease reaper导致最后断言failed原件保留，不能判产品异常清理失败或通过。原生异常清理仍待最终包。细节见包2报告。

用户新增持久轨迹已落仓库源码：tests/qa五文件、scripts/studio-qa*.mjs三文件，共8份QA源码，归属/层级/首次结果/写入纠正记录见docs/coordination/qa/STUDIO-002-regression.md。新qr8/8、新cli1/1内11命令、新preview正确dist复验2/2；统一runner cli实际1/1。不为文档重模型/Taro，产品包基线ccae82b不改变，后续测试docs提交由B单独标记。

新正常exe实际启动阶段0–2完成公开核对：PID22084/window1445978、API63174/preview63173，A输入前hasKey=false/encrypted available=true/persisted=false/warning及initialError空；首输入实际可用但此次首屏耗时不可用。普通exe launch不伪称用户双击。报告STUDIO-002-package-start.md。

最新用户约束：A只负责协调，QA执行配置验收及完整流程，不设管理员角色。此前未保存表单的窗口消失，QA未读取或保存，原因未证实。B现以自己可控制的隐藏TTY作正常current一次安全输入供应，QA只接受公开状态、不接收Key值；等待其配置结果及真实模型明确放行。未来验收使用同current配置新项目，不需每次新profile/Key；离线与异常测试单独临时profile，禁止迁移vault。当前没有真实模型操作者在运行，不记整体完成。

当前产品包已固定ccae82b，main测试基线6a6481c。Windows UI工具node_repl + @oai/sky已实际操作本轮正常包，前述“尚未操作”仅为早期状态。剩余正常current安全供应由B完成，QA随后核对持久化/重开/CLI和真实生成、连续业务修改、整预览解码、微信格式导出；不得用离线fixture结果代替。

原生持久回归已实际5/5通过、包内CLI6命令：tests/qa/native-config-upgrade.check.mjs（SHA74cb7d618b49f10d23b04e37e1ec4c21c9fab47da66a523eecabacba86fddb45）。报告test-results/native-config-upgrade-1791537133516/report.json，包含A两窗/CLI→正常关闭→不同目录B重开复用、异profile隔离及清理。一次占位真实DPAPI保存、两ready动态HTML项目，无模型/Taro。只覆盖同产品跨目录，非不同产品升级或默认current全入口。首失败realpath测试入口修正与边界见STUDIO-002-config-cli.md。

已新增显式node scripts/studio-qa.mjs native，delivery不自动包含；新增分派只做语法/help核对，不重复原生执行。QA源码现9份全部冻结。跨聊天TTY实验98388无法由B访问，已取消并删除自身隔离profile；该限制不要求用户再次输入，改由B自己TTY一次供应。当前QA无残留测试进程。

收到各树冻结交付即续派对应独立验证。继续负责人为 QA Lead，最终验收负责人为 B；恢复入口为本文件与三份报告。未配置本 QA 聊天独立唤醒，不承诺后台持续执行；B/A 已有跟进机制负责交付后的通知和接续。

最新接续：正常current一次供应及重开config status已独立通过。用户接管新项目并启动读书需求，QA未提交任何模型需求；读书task自然failed。精确sprout-task绑定的同PI会话已只读抽取工具ID/时间/verify计划/错误，证据STUDIO-002-reading-selector.md及test-results/studio-002-reading-trace-1791537962130.json。已证明反馈到模型且两次纠正，但三次实际额度含两定位失败和一次成功，最后纠正被拒。按用户新增要求优先修定位反馈/分层预算，QR和history暂停且无QR task，等待B安排工程唯一writer/QA独立持久测试窗口。原项目不修改/重跑，不重置预算。native参数化两文件已完成冻结，未来新包必须显式指定绝对产物目录及完整产品SHA；早拒检查通过，未重复原生5/5。

B已给QA主树唯一新增测试窗口，实际复用非产品开发qa_repair，仅新增tests/qa/plan-correction-journey.test.mjs及必要fixture；QA Lead不并发写源码，现9源码不变。产品唯一writer在独立codex/studio-002-feedback工作树实施v2：3business/3plan/6runs，runtime/external一次重试，总40tools/10min/3build/hostrepair3，硬kill保守业务扣账/旧耗尽不可复活。QA先构建动态Edge fixture及依据真实toolResult选择候选的本地模拟模型，仅做fixture自验；具体结构化字段和计数合同待工程冻结，不猜兼容接口、不反复跑未实现产品。此阶段不读current/Key、不启动桌面/Taro/商业模型。

候选接口稳定后，B再次授予唯一主树测试writer，已实际续派qa_repair适配上述两文件完整PI旅程。failed候选含tag/role/name/id/testId/ancestorHints、suggestions含selector/tag/role/name；响应式模型须由实际候选及实际建议选目标。可用STUDIO_QA_PRODUCT_ROOT读取受控绝对.worktrees Git工作树，所有产品模块同root，记录HEAD/dirty，禁止复制产品代码或混用verify身份。当前仅源码适配，等待实际产品冻结SHA再针对执行；开发者自验不作QA通过。普通读书prompt/general绑定已由Lead实际断言。

QA Lead已阅读docs/PRODUCT.md和README产品入口，后续QA恢复必读该文档/手册/台账/本工作包。产品是专门制作小程序的Coding Agent，多轮真实工具反馈驱动纠错是基础能力，独立测试维持原自然需求/同session，不靠人工追加需求。长期微信目标、本轮桌面范围及模拟/真实/交付证据分别报告，不将编译或子检查passed当总需求完成。上述两新增测试源码已完成适配冻结，语法通过、完整产品执行尚待freeze SHA；现场保护不变。

最新用户方向覆盖旧v2额度验收：取消正常任务固定次数/硬时长/tools/build预算终止，改为持续真实反馈纠错、PI压缩/持久恢复/用户stop/交付，无进展换策略不任意次数终止。B曾放行fe4ba9bd0fad1b3d15a1877123ba3828f857a187后立即下达STOP；QA已执行。qa_repair本轮仅只读未改源码、未启动测试/Edge/模型/服务/子进程，无待清理进程；两新增untracked源码冻结归还writer，仍含旧预算断言仅为待改源，不作新方向通过，没有新增v2独立运行结果。具体SHA与事实见reading-selector.md末节。当前等待B新最小方案/适配窗口，禁止旧包QR商业任务和新打包，用户现场不触。

B新连续合同已锁，产品writer在独立codex/studio-002-continuous实施；QA已实际复用qa_repair主树唯一两新增文件writer准备改持续轨迹，先本地PI原生open/compaction核对+测试计划/字段问题，不跑未冻结产品。无正常task固定额度/硬时长终止，usage只记录；验收精确session+持久draft恢复/不重放/旧passed失效重buildverify、旧无draft诚实退化、原生压缩/read_requirements分页全覆盖、用户stop/current-source交付门。测试timeout仅防自身挂起，旧有效QR/隐私证据相称复用。最新计划与恢复入口见reading-selector.md末节；无商业模型/打包许可。

最新实际执行（4e43676）：B正式放行最终冻结产品树，QA首自然请求旅程1/1，剩余组13/15通过；长需求页原文与回执前硬kill恢复两项首次失败待定性，日志原件保留。qa_repair当前独占测试源码writer，仅两处等强度断言补短诊断并定向复验，不改产品/期望；CLI迁移语法已过且writer归还，旧preview准备顺延。严格QR8尚未启动；旧CLI/preview实际执行等待最终主目录集成。详细版本、日志、通过范围与下一步见qa/STUDIO-002-reading-selector.md最新节。当前不触current/Key/商业模型/Taro/正常exe，不记整体完成。QA Lead继续汇总独立证据给B，B负责集成和最终用户历程安排。

旧preview准备已冻结并归还writer：仅tests/qa/preview-journey.test.mjs新增17行，SHA256 1C5C50BB867AB53495B196102F504AECA6728E85AFC06060362195EBAD6D32F1，node --check/diff --check通过，尚无动态结论。QA主树无源码writer；已向B交安全窗口，由B独占main集成产品及旧core精确工具列表/README更新。待其最终main SHA、匹配新源码dist摘要放行后，QA实际执行旧CLI/preview受影响回归；不得用r1旧dist当新UI验证。冻结4e树QR8可并行只读执行。

4e冻结树独立受测范围已通过：连续16场景有效证据+严格QR8/8，QA负责人亲读日志和精确verify映射；首轮QA UTF8失败及修复定向2/2记录不覆盖。汇总test-results/studio-002-qa-continuous-4e43676-summary.json。B接管main集成writer，等待最终main SHA派CLI。preview/E13 UI复用唯一r2 Vite dist，不额外构建；E13只读最小方案仅扩preview测试，自有>48000历史真实弹窗只改goal/constraints，捕获PUT无changes并deepEqual原历史文本/time。QA无源码writer，产品/测试总验收仍待后续阶段。

最终集成dbe7a6bc的CLI已实际独立1/1通过（17真实CLI命令），QA亲读approved.log；首次sandbox junction EPERM证据保留，源码/产品未改，cleanup完成。E13 preview准备完成后SHA07ef5c25c4734c92601e069fadba57309f014ad73f62e4ef723aa2e6e42cebd7，语法通过未动态运行。当前QA所有执行者已结束并归还writer，唯一待条件为B/工程Lead r2同3dist及放行；随后QA Lead复用qa_preview跑旧preview+E13。B已收到上述独立结论，无商业模型/正常exe放行，不承诺后台常驻。

最新状态覆盖上述等待：唯一 r2 dist 的 preview/E13 独立 3/3 通过，61729 字符 / 60 条历史原文本与时间、换行保留；初始 exact label 定位失败属于 QA 选择器，保留首败，最小修正后完整短组复验，不称仅失败子项重跑。最终 preview 源 SHA075f61dbd98a849b9b0b44d28fc7e2b77a2cf66863a1dedc46e5137e4b0751a3，retry 报告 test-results/studio-002-qa-preview-r2-e13-retry.txt。三位 QA 子代理均已结束，无源码 writer。

正常 r1→r2 升级、公开配置复用和旧数据保护已通过；QA Lead 经 B 放行后唯一执行新 QA 原始读书自然任务，同 task/session 经两次实际定位歧义反馈及源码纠正，3 构建 / 4 检查后自然 completed。原 320/25 检查第三轮 passed，第四轮额外业务 passed；独立正常 UI 核 25+10→35 / 撤销一次→25、真正新窗口保持与 ZIP 15 源码逐项绑定均通过。完整精确版本/使用量/证据/边界：qa/STUDIO-002-r2-reading.md。已暂停 QA 桌面输入，交 B 窗口11144748或7673380亲验；等待随后 QR+历史修改串行放行。原用户项目未触，未宣称微信 runtime 或整体验收完成。

最终QA接续完成：B读书实际亲验与ZIP独立核字节后放行二维码/历史两个自然任务，均正常UI严格原请求、各同task/session自然completed。QR两次视口失败真实反馈纠正后通过；history36tools/1build/6actualverify，模型passed计划没有充分证明回填，QA独立补齐四条仅留三条、只点击120字历史Value回填/直接生成扫码、刷新及真新窗4852776保持、清空后刷新空；修改前后原生实际短中文与120纯中文扫码均逐字一致。B实际CLI两版ZIP均核15源码+19非空weapp、旧rev1未变，QA亲读复用。完整精确ID/digest/token/首败/报告：qa/STUDIO-002-r2-qr-history.md。

当前QA所有执行者和桌面输入均已停止，无源码writer/新增模型请求。安全窗口4852776交B最终亲验；原生1293×945缩放通过，精确960×700未验证，微信runtime未验证，模型输入值断言/计划覆盖缺口已报B另隔离改进。QA自有10份qa文档及本工作包冻结待B明确清单提交，排除其他人新增input-assert实现文档和所有test-results/用户数据。继续验收负责人B，A维护TASKS；没有本QA独立可靠唤醒配置，不承诺结束后后台持续推进。
