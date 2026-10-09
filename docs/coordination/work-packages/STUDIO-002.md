# STUDIO-002 用户全过程与自主修复

2026-10-09。B唯一负责人/集成者：小芽项目负责人，聊天01a11ebf-e71e-71c0-97a1-86bcff83f324；A总办秘书01a11e93-220d-7ba1-bc51-23007e5621e4独占TASKS。当前进行中，尚未交付。

## 授权与边界
用户在A聊天明确批准五块改进分三个团队并行、独立工作树、统一集成；A已在TASKS的STUDIO-002登记并派发B。AGENTS授权本项目内部读取、派发、子代理和正常源码同步。允许当前Windows桌面实现、隔离测试和已有配置接口内有界真实模型验收；不重启旧服务、不覆盖用户项目、不读取/转移历史Key/vault/进程内存、不新增费用/外部人员消息/发布/微信迁移。模型Key仅正常加密UI入口或安全交互输入，禁止argv/日志/Git。

用户新故障：新建等待约一分钟；预览尺寸不适；配置重复；二维码自写编码器仅检查格子即称完成、实际无法扫码；耗尽验证仍称核心成功，修改出现224期待0。模型自述白缝未经证实。旧HARNESS特定目录及版本结论不覆盖这些问题。

## 分工与写入接口
基线ae0d8af940c3aa5392e2ef2df70c28818e28539a，main管理台账由A独占。三个C盘managed树注册长期停留creating且无附件，未使用其目录或绕过工具等待要求；B正常审批在D:/app/.worktrees内另建三个普通Git树，均创建成功且依赖junction固定指向D:/app/node_modules，现已向三名执行者下发最终路径并开始实现。C盘树只保留待注册完成后清理，不当作实际开发树。

工程负责人长期聊天01a11fb4-ff38-7723-8711-298ab2608c9c“小芽工程负责人”，负责接口、三开发流技术质量/架构与集成审核；独占STUDIO-002-ENGINEERING.md。QA负责人长期聊天01a11fb5-2b8d-75a2-bdd3-8aaf5ca47938“小芽独立QA负责人”，负责每包独立QA与用户历程，独占STUDIO-002-QA.md。两聊天均已实际创建、接手并提交版本复审/独立验证记录，不伪称常驻。现有3工程代理保留在B的collaboration树，工程Lead通过B桥接协调，不能伪称另一聊天直接控制这些代理；新后续执行由Lead按实际工具自行组织并登记。B最终集成/亲验，A独占台账；每包QA执行者由QA Lead登记真实创建/状态。

最终开发工作树：包1 D:/app/.worktrees/studio-002-preview（codex/studio-002-preview）；包2 D:/app/.worktrees/studio-002-config-cli（codex/studio-002-config-cli）；包3 D:/app/.worktrees/studio-002-repair（codex/studio-002-repair）。本地.git/info/exclude忽略.worktrees/，不纳用户数据或依赖；A不同时操作Git，B集成前另协调。

| 包 | 唯一工程执行者 | 文件/接口 | 完成要求 |
| --- | --- | --- | --- |
| 1 新建与预览 | /root/studio_preview | src/main.jsx新建/预览/轮询/继续按钮；样式；Store初始化状态；index initialize/bootstrap/create、run入口cancelPreparation一行、close准备Map | 几秒可输入制作；预览真实异步准备；取消/退出/制作不被旧准备覆盖；内容375×720且按空间缩放 |
| 2 配置与CLI | /root/studio_config_cli | electron；新增server/studio-client、cli；package脚本；UI api/run/export独立hunk；index新增verify路由及settings必要hunk | 未来正常启动同稳定加密profile、单实例多窗口；stdin安全配置；CLI与UI调用同HTTP业务，完整命令/退出/错误/隔离 |
| 3 自主修复 | /root/studio_repair | agent/verify/harness/skill/对应tests；index timer/终态/catch独立hunk | nativePI同session有界反馈，工具前硬预算；写入必须最新构建与实际功能通过；QR真实输入→生成→像素解码；耗尽/停止保旧版且诚实恢复 |

三个包不得改对方hunk；index按上述明确分区，B统一人工核对集成冲突，不覆盖整文件。UI继续按钮遵守task.resumable!==false。工程师不push/合入main、不写总台账。依赖复用D:/app/node_modules的只读junction；测试各自root/随机端口。真实模型由集成后独立QA唯一操作，不并发共享用户数据。

## 首轮发现与方案约束
- 新建POST与bootstrap均等待完整H5+Weapp build后返回；UI依赖active导致无法输入。phone总高720又扣状态/底栏，iframe非真实375×720。包1已启动隔离真实基线测量，未将替身耗时当实际编译时间。
- dev userData=root/.studio/desktop，pack默认路径不同；STUDIO_URL绕过本地credential，多个实例各自内存配置。未来统一新稳定appData/Sprout Studio/current，不读取迁移旧配置。A后续正常加密入口录入一次，未来dev/pack/项目/新窗口沿用；显式测试profile仍隔离。
- agent现允许漏验/过期验收后pending提交；模型text_delta可先说完成；部分预算只事后abort。修复须服务门控而非仅改prompt，讨论与制作区分；恢复共享已用预算，预算已耗尽不显示假继续入口。
- 当前实际窗口只读进程定位为r3 release-harness-20261009-r3/win-unpacked/Sprout Studio.exe，主PID57264，API59462/preview59461；公开摘要候选d1e992e6-0bd0-4466-8a66-5c03ef23f0cc，标题为原文字二维码需求，rev3 ready=true/verification pending，最新task c45558fa-ef9f-4a7e-b54c-1aac104d7323 failed。非先前r5验收现场；还需只读这个任务的非敏感错误/源码对应，不能凭候选推断根因。未读Key/token仅内存使用/未修改现场。
- 包1真实冷构建基线：startStudio监听16ms、首次bootstrap 93,966ms、新建POST 28,380ms，均被实际H5+Weapp/官方格式编译阻塞；仅自建root test-results/studio-preview-baseline-1791532901072，服务已关闭。最终报告由工程交付，当前耗时事实不替代修复后UI计时。

## 调研记录
各包先核对本地PI0.99.1、Electron38/Taro4.3原生能力，再查官方/GitHub；详细候选和许可证由各包工程记录交付后汇总。当前采用原生PI session.prompt/abort/队列能力、Taro已有buildProject+AbortSignal、Electron safeStorage/单实例、浏览器ResizeObserver/CSS transform、既有Playwright/jsQR；不换框架、不新增零碎依赖。CLI复用同HTTP路由和共享client，不另写agent/build。

## 独立QA覆盖表（尚待执行，不记通过）
| 正常用户步骤 | 必要证据 | 状态 |
| --- | --- | --- |
| 正常双击启动/首次打开 | 实际exe/profile/资源基线、首屏可输入耗时，不靠特殊测试cmd | 待验证 |
| 一次配置/新窗口/新项目/正常重开及下一包 | 真safeStorage占位验证、公开hasKey/endpoint/model、不回填密码、无读取旧Key | 待验证 |
| 新建→立即输入执行 | UI计时、构建未完成仍可提交需求、初始化取消/串行不覆盖 | 待验证 |
| 真实模型生成→操作手机预览 | 真375×720内容及缩放、输入不截断、截图像素逐字解码、空反馈 | 待验证 |
| 连续业务修改→失败自主修复 | 同一总预算无需人工补写源码/调整需求预期，真实业务断言与版本摘要 | 待验证 |
| 耗尽/显式停止/断线恢复 | 诚实未完成、旧版和数据保留、不无限重试；已耗尽不能伪继续 | 待验证 |
| 导出→重开继续 | ZIP源码/Weapp/许可逐项对应、配置与项目数据恢复 | 待验证 |
| CLI完整历程 | 配置/建项/制作修改/进度/真实验证/导出共用业务、安全stdin、退出清理 | 待验证 |

B负责三包集成及必要的集成窄修，自己的改动由QA Lead独立验证；QA Lead组织跨包UI及唯一真实模型操作，CLI不替代UI。开始真实模型前固定集成源码/包与任务预算（40tools/3build/3actualverify/10min，SDKretry1）；修复接续不重置总预算。只做相称必要测试，不重复旧繁重检查。

## 当前接续与恢复
当前恢复以末尾最新冻结/执行记录为准，早先段落保留历史。A只维护台账。未承诺结束聊天后持续后台工作。恢复先读TASKS本项/本工作包、Lead实际状态、git worktree及实际资源，再续派；执行结束不等于已验收。遇费用/发布/范围扩大才交A决策，范围内开发/纠偏/集成自动接续。

### 16:19 首轮实施与独立责任线进展
- 两Lead均已实际接手，工程Lead持续只读复审并写ENGINEERING记录；QA Lead已实际创建qa_preview/qa_config_cli/qa_repair三名非开发QA，完成只读覆盖准备，报告docs/coordination/qa/STUDIO-002-{preview,config-cli,repair}.md。当前准备代理均已结束，等待精确冻结版本后复用；不称正在测试/已通过。总QA表STUDIO-002-QA.md由QA Lead独占。
- B实际读取用户候选项目公开摘要及当前预览：d1e992e6…rev3，completed任务曾verifyAttempts4且verification pending，最新失败含224期待0/数据位读取失败。无工作台父窗口的独立浏览器只读一二三输入，canvas240×240完整在375×720范围，viewport与fullpage相同一个像素样本均jsQR无法解码、无runtimeerror/0mutating请求。test-results/studio-002-user-scene.json和studio-002-user-preview-report.json；QA Lead离线复核同像素失败，不当第二独立现场复现。不能推断仅白缝/裁切是原因。
- 工程审核E1连续“改成蓝色”误降QRprofile、E2无关count0冒充empty、E3硬kill计时、E4 CLI verify绕过QR策略、E5跨窗settings过期、E6工具预算副作用前持久，B均已桥接各writer修正。B另要求fill实际value等值、手机viewport真实像素扫码和skill前后成功条件一致；包1prepare失败catch与memory编辑竞态需门控保留原要求，不能因锁引入run取消死锁。
- 包1开发者报告相称回归22/22/Vite通过；真实UI首输入195ms（seed构建人为gate，非宣称真实编译已提速）、新建可输入488ms、真实双端预览29,757ms。375×720/320×720内容在三个外壳尺寸保持且缩放可见；首布局失败复用同实际build后重验，不重复编译。尚待冻结SHA/独立QA。
- 包2shared client10/10及Vite通过，但原生Windows headless stdin立即EOF导致owned服务提前退出已实际复现，正在以短期lease/PID存活+正常退出修复，未用forcekill冒充正常退出。配置/CLI尚未验收。包3硬门/反馈/证据/持久预算持续修正与相称测试，未冻结、未真实模型。
- 下一步依次接源码冻结→工程Lead版本审核→每包独立QA立即接续→B统一集成/hunk核对→一个固定源码正常包/独立正常UI完整历程。A已配置studio每5分钟心跳，仅中断补救，未变安静；本回合范围内持续推进，不等待定时器。

### 最新冻结与打包接续
- main源码冻结ccae82b131abe30a7b9cc682c1b18712830d8dce。包3 f371856→main 3dc5e8c；包1 c288bd2→a788ac1；包2 398de9a/1314925→29626e5/d557124。冲突仅保留两方必要hunk，未整文件覆盖。包3空反馈修复e3c8164→a329d26。B集成窄修57177cb使未ready verify不取消准备、restore清理结束后才回成功。
- 三开发代理当前均已结束并冻结。工程Lead逐版只读复审无阻塞；QA Lead独立包1初始化/缩放通过；包3原版确认QA-REPAIR-001（常驻空提示误pass），保留原脚本/JSON，修后8动态浏览器正反例通过；B两集成边界由QA独立2/2通过。对应qa/STUDIO-002-{preview,repair,integration}.md，不以开发自测替代独立证据。
- 包2独立25实际CLI命令逐项有效、native-only 5命令DPAPI隔离保存/重开/清除通过；完整脚本因漏env/后续spawn前隔离断言失败，整体failed原样保留，不能称CLI全部通过。两次默认误启动可能发生seed/编译，次数未知；未读默认vault/Key、无真实模型，检查时无Electron残留，未kill未知进程。已修两漏传点并强制每次绝对profile/workspace在本轮根内。剩余正常UI多窗/升级/包内CLI/成功制作及断流等按QA覆盖表补验，详见qa/STUDIO-002-config-cli.md。
- B一次集成node --test tests/*.test.mjs：71项70通过，唯一CLI旧fixture在异步新建后立即run取消准备，继而verify未ready。ccae82b仅测试两处复用有失败/超时上限的waitProjectReady，原业务断言不变，定向5/5通过；未重复整套测试。报告test-results/studio-002-b-integrated-tests.tap与studio-002-b-cli-integrated.tap。
- B已明确放行工程Lead唯一打包代理/root/studio2_packaging，先核HEAD和产品干净，再执行node scripts/package-desktop.mjs --stage D:/app/.package-staging-studio-20261009-r1 --output D:/app/release-harness-20261009-studio2-r1 --source-commit ccae82b131abe30a7b9cc682c1b18712830d8dce。新stage/output此前不存在，脚本含Vite构建，无额外根目录build。禁止启动正式UI/模型、下载依赖、改旧r3或用户数据。当前已派发，包尚未交付。
- 后续：工程Lead回实际manifest/入口→B固定包放行QA正常启动/公开配置检查→QA正常受控一次配置保存及公开状态验证→QA Lead唯一真实模型完整用户历程/缩放像素扫码/包内CLI→B亲验→冻结记录及正常Git同步。A只统筹，不代输入或代QA。真实模型仍未调用，整体尚未验收，A独占TASKS，B独占main Git。
- 打包首次use_default在Vite realpath D:/app/src/main.jsx EPERM，226ms退出1，仅本次空stage，output/manifest/exe未创建。B批准核精确绝对路径后非递归删空stage，同参数经require_escalated正常审批恢复一次；审批通过且Vite已成功，桌面目录包正在生成。原失败保留，无源码/依赖改动、无未知进程kill。
- 用户新增授权（A直接传达）：独立验收要形成仓库内持久可重复用户轨迹自动测试，确认缺陷保留原触发负例/修后正例；后续按影响回归、交付核心跨包，昂贵真实模型/打包明确触发，截图报告不可代替测试。QA Lead独占测试断言/覆盖及其登记的tests/scripts文件，工程Lead独占docs/studio-regression.md接精确node执行入口与触发规则；优先现有有效脚本，不重测、不加模型调用。当前产品仍ccae82b冻结；测试/文档后续版本和包内产品基线分开记录。
- 正常包已生成exit0：release-harness-20261009-studio2-r1/win-unpacked/Sprout Studio.exe，build-manifest.json base/finalizer均ccae82b；43固定资源（含cli2）+3dist匹配stage，manifest SHA fbee13f85c2c041f5d8cc8edadb00d24bb69df4e262034056a97931b83269412。B独立逐项43及3dist散列匹配，test-results/studio-002-b-package-manifest.json；不是实际运行通过。依赖解析warnings及既有repair复制1113目录保留，包内运行待QA。已明确放行QA正常默认启动/公开配置检查，不靠特殊cmd；唯一真实模型仍未放行。
- 用户最新纠偏：不设额外管理员角色或审批，工程实现安全存储、QA负责配置/正常历程、B统筹亲验、A只协调。一次配置独立于构建持久，正常重编译/升级/重开/项目/CLI复用；QA真实流程固定current新项目，模拟/破坏场景临时profile自造占位。已有新window1445978/PID22084/API63174实际首输入可用、公开hasKey=false及encrypted可用；首次启动工具延迟使精确首屏时延不可用。A曾输入但未保存，后来窗口/PID/端口均消失，原因未确定，不归咎任何人；QA/B未取字段/截图/保存/重启旧r3。不能假设表单仍在或索用户重填。
- 确认缺口：裸npm run dev无credentialStore仅内存，不能称所有dev统一。原包2writer提交e07497e，工程复审后B合入6a6481c34ec2cbaca77c49afe7cfc5d41803a253，仅package scripts/README/docs-studio-cli；正常dev先Vite构建再Electron安全入口，dev:web显式临时HMR。实际生产化package与当前stage/包deepEqual，SHA ba2a4dceac8f1c825226361610934ff9572aefe882a7696dbcbc6fee26b3e8a3，无运行时资源变更，无需重包；真实native行为待QA。
- 持久QA源码新QR8/8、CLI1/1内11命令、preview2/2及helper两次实际调用通过；旧root dist导致新preview首次失败保留，明确复制本次stage3dist绑定散列后复验通过，无新编译。原生跨exe持久源码归qa_config_cli唯一writer，Lead runner其后串行；不同文件主树曾重叠写入已如实记录并停止，不声称一直串行。当前B合入/记录窗口结束后交QA。
- 用户明确允许本项目一次凭据供应，凭据值不得进入本文件/报告/Git/文件/env/argv/终端历史。QA使用现有CLI隐藏TTY或父进程stdin负责一次安全保存和公开验证，不依赖A代跑/CU，不新增Key管理器或供应商账号/费用。已授权供应与工具参数可能保留执行记录的风险分开表述，不自行加禁令永久阻断。真实调用待公开就绪及B明确放行。
- 最新一次配置已实际完成：QA聊天TTY session不能跨聊天write_stdin（Unknown process id），其自有占位会话取消并清理。B在自己现CLI隐藏TTY先隔离占位成功、再正常默认current一次供应授权凭据，exit0且无密钥回显，只有public hasKey=true/persisted=true/mode=encrypted/available=true/warning空；provider=deepseek、baseUrl=https://api.deepseek.com、model=deepseek-flash。不是无源永久阻塞，不再A代输入、不向各代理传播。CLI正常退出；下一次QA正常重开独立确认后使用同配置。
- 持久九源码已显式提交94871848c724efe7d509eb228c439ed7d1926f0f（scripts/studio-qa*.mjs三份、tests/qa六份），实际测试边界/入口见docs/studio-regression.md。native5/5、6包内CLI通过，原resource junction令import.meta.url与argv不同而入口未执行的QA首次失败保留，单行realpath修后通过；同产品不同exe目录不是不同源码升级。
- B明确放行QA Lead唯一真实模型2自然生产任务：原始文字二维码+一次完整最近三条历史/回填/清空业务修改；每task40tools/3build/3actualverify/10min、SDKretry1，修复恢复累计不重置，不另开人工修正任务绕预算。QA新正常window11997288已启动，正在只读public确认；首次整窗截图/完整accessibility被自动审批拒绝可能含Key设置字段，改最小公开状态/制作页标识检查，不绕过。任务尚未实际生成，整体尚未验收。

### 当前主线：用户读书定位歧义的多轮纠正
- QA正常current重开已独立确认hasKey/encrypted/persisted=true，随后制作页最小过滤和审批通过，无设置表单。用户输入检测后，用户在项目6525c536-586f-4ffe-9894-24f72c4d9b92发起读书task2d78c133-ff3a-4396-b714-ba8c689261ed；QA从未提交QR任务、未停止或覆盖用户任务。该task自然failed，13tools/1build/3actualverify、4calls/1rejected、repairPrompts0，76,446ms，verification-budget-exhausted/resumablefalse，rev0/readyfalse。不能将用户读书任务当QA二维码通过。
- 用户经A直接要求本轮修复多轮反馈/计划与业务预算分层，优先于旧包QR调用。QR两任务现暂停且QA调用数0；旧用户任务保护不复活、不重跑。非敏感单session诊断仅精确task对应脱敏JSONL，禁止runtime/auth/vault/其他会话，见qa/STUDIO-002-reading-selector.md与test-results/studio-002-reading-trace-1791537962130.json。
- 实际序列证实PI原生toolResult已同session反馈：第一verify text .section .label匹配3个→模型改位置定位后第二verify passed→第三verify click .btn-ghost匹配2个→模型再改位置但第四次调用预算拒，未浏览器执行；期间无read/write/build。根因2个计划歧义+1成功子检查共用3actual额度，不是0repair意味着无feedback，也不能称最后位置修正正确。
- B派唯一原repair writer /root/studio_repair，复用D:/app/.worktrees/studio-002-repair切新分支codex/studio-002-feedback，从9487184；旧e3分支保留。工程Lead只读审核；QA Lead已续派非开发qa_repair为主树唯一新增tests/qa/plan-correction-journey.test.mjs(+必要fixture)writer，其他源码不并发写。
- 批准最小v2契约：宿主verify分类plan/business/runtime/external，单元素action歧义有限可见候选/语义CSS建议，不取input.value/fullDOM、不自动first/nth/改期待；count多匹配合法。3business（含passed）/3plan（静态动态）/6browser启动联合上限，总40tools/10min/3build/hostrepair3/SDKretry1保留；runtime/external合计1次重试后停，重复稳定计划歧义指纹拦截浏览器。启动前runs+inFlight落盘，终态原子分类清inFlight，硬kill恢复保守business扣一次，旧无v2按旧verifyAttempts保守锁定不退款复活。仅宿主真实verify分类免费plan，注入/未知按business保守。实际代码/独立验证待冻结，不记解决。
- 原生测试未来包参数化两文件已提交ce621a7308446a2e7ca1a9771675e3aeb5e39792：native --package-dir绝对目录 --expected-product完整SHA；错路径/错SHA在启动前硬拒，原5/5不重复。当前包产品仍ccae82b，main开发入口6a6481c、持久初版测试9487184，参数化ce621a7。v2源码后需要新正常包及独立同一自然需求内模型接反馈自主语义纠正通过，再恢复QR完整历程/B亲验；模型配置current复用无需重配。A继续独占TASKS，B独占main Git。
- 产品长期入口 docs/PRODUCT.md 与 README 链接已提交并上传4986f3d，A已全文核对认可；工程/QA Lead均实际读过并纳入交接。明确专做小程序的 Coding Agent、多轮反馈修复与验证是基础，微信长期愿景和当前桌面范围分开；不改变本轮授权。当前r1不含v2、不记整体通过。
- 开发者局部真实Edge新增8/8通过，覆盖两次歧义+一次成功子检查后第四次语义扫码检查、内部多输入框、maxlength业务失败、透明祖先、page关闭external及abort。B/工程Lead继续冻结审查，补所有isContentEditable禁止正文、role限长、每次verify工具结果携带已持久计数后的budget/remaining。尚无冻结SHA或独立执行结果；QA两新增源码准备已冻结、语法通过、未运行活动产品树，待精确SHA立即独立复验。

### 最新用户方向：持续多轮制作，取消固定正常任务额度
- A直接传达用户重大纠偏，覆盖此前3/6检查、40tools、3build、10分钟、3hostrepair及恢复次数门限方案：正常制作持续反馈修复，长上下文使用 PI 原生 compaction/持久恢复；不以固定次数或整任务硬时长替代任务完成。保留真实业务门、结构化错误候选、分类、隐私、版本保护、用户停止和恢复记录。无进展须基于证据诊断/换策略/诚实可恢复，不无穷重复同错，也不另造任意阈值。
- v2冻结fe4ba9bd0fad1b3d15a1877123ba3828f857a187仅作历史试验，tree clean，不合入主线或打包；开发8/8+hardkill1/1+QR5/5+最后补丁3/3与1/1证据保留，不宣称新方向完成。B已撤回旧额度独立验收与打包放行，QA仅安全停止自有测试并报告实际状态，禁止用户现场操作。两Lead与唯一repair writer接只读新方案评估，未放行新代码写入。
- 代码调整需覆盖agent/harness/index/skill的固定计数与硬时长、task恢复资格与公开字段/文案、原生会话压缩及继续；工具单操作合理超时和供应商实际rate limit须区分整任务任意时长，不机械删除。保留计数/耗时作事实观测，去除剩余额度UI/提示。供应商故障如实反馈与可恢复，不静默无限重发。
- 下一步：工程Lead与writer核本地PI0.99.1/官方支持，B锁最小合同及新分支唯一writer→QA改持续反馈/压缩恢复/stop/真实交付轨迹→独立冻结验证→新包当前配置复用及真实任务→B亲验。PRODUCT已同步最新方向和持续差距队列；B主动排序范围内改进，与A协调，不等待A重复派活。仍不推定新费用、微信迁移、账号或发布授权。
- 工程Lead与writer只读核对完成，无需新依赖；B正式放行/root/studio_repair从fe4新建codex/studio-002-continuous，保持唯一产品writer。范围agent/harness/index/store必要草稿恢复、skill、相称工程tests与docs/studio-continuous-implementation.md；UI/CLI仅实际必要小改。工程Lead只读审核，QA源码冻结等待新合同，不并发改产品。允许正常任务跨旧限制完成，不修改用户项目/Key、不打包/push/真实模型。
- 原生恢复合同：精确SessionManager.open(sessionFile,sessionDir,cwdOverride)，核项目/task/session/draft归属及baseRevision/sourceDigest；失败/停止/硬kill保留草稿，恢复不重放工具副作用，重新构建/验证当前源码。旧无草稿记录诚实退化为基线重建，旧预算锁仅允许显式继续，不自动复活现场。去除可恢复session/task的50条裁剪。原生auto compaction已有enabled，需真实PI链测试/事件进度/stop；历史需求不无限塞system，不手写摘要替代PI。供应商SDKretry1暂保留为传输参数，不能当产品轮数。费用数字未知则不虚构，真实任务记录调用/token及可得成本依据。
- 独立QA停止旧方案实际确认：本次只读，未改两新增源码、未启动任何测试/本地模型/Edge/服务/子进程；无终止清理事项。两文件仍旧v2待改源且未纳Git，不能算新方向通过。工程另外发现联合CSS选择器填子输入框作用域问题，已交唯一writer相称修复；恢复会话不得因扫描到历史assistant.error就误判本轮失败。
- continuous首版已冻结16a0f89fb773c1fd8f1ee985f662026c4c42e9f4，开发连续9/9、memory/QR9/9、硬kill后原生恢复交付1/1、真实manual compact事件1/1、来源与新读取进展3/3。B读日志并派精确Lead审核/独立QA；不把manual当auto threshold，不把开发通过当验收。真实PI事件误名、不同源码读取被误停和provider来源误借旧验证的活动审查问题已先修复，证据均保留。
- Lead冻结审核确认E9–E12阻塞，B已撤16a实际执行/集成/打包放行并续派同一writer：E9恢复原会话没有校旧task/draft绑定；E10页覆盖或初始history先存task后才落native消息，硬kill可造成未入会话却被认为已读；E11 skill尾残旧额度要求；E12同一PI连续重复失败build/business检查时外层noProgress无机会执行。QA本次实际尚未启动测试/Edge/模型/进程，仅两源码适配，继续准备负例，待新SHA。
- E9–E12最小方案：校原sprout-task及header的task/project/base/draft归属后才追加新binding；从实际持久native user/toolResult重建需求覆盖，不信pending[]，未建conversation的初始化中断诚实重建而已确认session丢失拒绝；去skill旧配额；工具内按源码/完整参数/稳定失败证据反馈换策略，没有新诊断才可恢复暂停。新证据/代码/计划可以继续，不能换任意计数帽。保留先前有效检查，不重旧全套，当前仍未打包或商业模型调用。
- Lead集中余审增加E13（已正式纳同writer最小src MemoryModal/index修改）：全历史memory PUT仍有48000累计帽，目标/约束小修随全量changes回传被拒。改未编辑历史不重发/重写、HTTP支持省略changes保留原文与时间，保留全量合法编辑兼容、格式/单条输入安全防护；新包实际UI绑定后验证，无需提前额外Vite编译。QA新增HTTP长历史小修/非法格式，现有9持久QA源码仍无并发改动。
- QA continuous两新增源码准备完成并归还writer，仅node --check通过；E9/E10/E12、真auto threshold、原始读书/分页/跨旧限制/新读取/stop与原生硬kill恢复均待新冻结执行，不误称已通过。初始化负例补legacy旧sessionFile有值但draftRef缺失，新draft首persist中断不能混用旧session；writer以明确stage/清旧引用保证诚实重建。模型/current/Taro/新包仍未调用。
- E9–E13已由唯一产品writer冻结于bebe8ca4093d3d1f59b237b4d53ed1fc02a64bc9，codex/studio-002-continuous，实际工作树干净；writer已结束。开发定向review-final 4/4、兼容11/11、memory-partial-final 1/1通过，初始失败日志保留，不当独立验收。B已正式交工程Lead按16a→bebe增量只读复审、QA Lead按精确SHA实际独立复验（含真实native auto threshold、硬kill覆盖窗口、同PI稳定失败、长历史部分修正）。QA两新增文件由其单一writer最小适配后执行，产品冻结不写；未合入main、未打新包、未调用商业模型或重配current。E13 HTTP根必须对象非Array，goal/constraints/changes省略各保留，未改历史不发changes、不改原时间，单字段/条目安全限制及全量合法编辑兼容保留。下一步根据独立结论修正或集成整个948→最终连续版本差异，再固定r2包与正常用户历程、B亲验；A仍独占总台账。
- bebe集中余审确认E14/E15，集成/打包/产品QA执行再次暂缓。E14 verify前置build-required被当稳定失败缓存，成功build后仍误拦同计划实际检查；E15普通execute throw未进入失败证据，使同PI重复非法write/缺失read不被无进展暂停。QA Lead与child实际确认本轮无产品test/Edge/模型/子进程、无PID，B才正式续派原repair writer唯一窗口最小修复及定向正反例；产品树活动期间QA仅准备自身两文件，不执行。允许同writer迁移core M3旧文案为精确no-progress reason并保留未发布/已通过digest断言，QA旧CLI额度断言由QA随后串行迁移。新有效编译应允许同计划真正检查；用户stop/checkpoint/executionFailure不得被普通工具错误处理吞掉。新SHA后只验本增量，不重复原有效繁重检查；当前仍无新包或商业模型调用。
- E14/E15已冻结4e43676b9cc03f8210e2d27936c88aa9d74dcb53（parent bebe8ca），产品writer已结束且树干净。开发工具定向4/4、checkpoint优先1/1、core M3迁移4/4通过；B已交工程Lead仅最后4文件增量复审，正式放行独立QA按最终SHA实际执行两新增continuous源码及精确新verifier QR映射。旧CLI/preview归QA串行准备，待main集成后执行，不能以旧main证明新产品。B启动独立core/security-boundary/studio-integration/studio-preview/studio-cli基础回归，日志test-results/studio-002-b-continuous-foundation.tap，均隔离替身构建/本地模型，非商业模型或新包验收。当前仍未集成/打包/current操作，继续B→独立QA与工程结论→集成/新包/正常历程。
- 工程Lead最后4e增量只读审核已明确无剩余阻塞，开发报告与源码对应，但非QA执行。B基础首跑sandbox禁止隔离node_modules junction，单snapshot确证EPERM；CIM正常审批精确核本组PID43304后仅结束该组及子50936，未动用户/QA服务。同五文件正常审批复跑test-results/studio-002-b-continuous-foundation-approved.tap为38项37pass/1fail，唯一core:64仍断言旧五工具，实际新增read_requirements为六；B在main集成时补精确第六项及README并单项复验，不修改冻结4e、不重有效37项。独立QA仍按冻结产品实际执行，尚无整体通过结论。
