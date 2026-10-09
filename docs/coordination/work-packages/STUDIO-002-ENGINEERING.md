# STUDIO-002 工程审核与恢复

2026-10-09（北京时间）。工程负责人聊天：01a11fb4-ff38-7723-8711-298ab2608c9c。B 产品范围、集成和最终核验负责人：01a11ebf-e71e-71c0-97a1-86bcff83f324；A 独占 TASKS。本文件由工程负责人唯一维护，不代替总工作包或独立 QA 结论。

## 当前工程结论与恢复入口（2026-10-09）

B已授权本轮仅更新本文件和 `docs/studio-regression.md`，不自行Git提交。产品冻结/已上传基线为 `dbe7a6bc35861315f879cf4b3d2fe7b8809a2cec`；连续制作修复树 `D:/app/.worktrees/studio-002-repair`、`codex/studio-002-continuous` 冻结于 `4e43676b9cc03f8210e2d27936c88aa9d74dcb53`。fe4分层预算试验保留历史，未单独合入；用户后续明确取消正常任务固定工具/构建/验证/接续/恢复次数及整任务时限。计数仅作使用记录，不以新任意阈值代替完成。

工程按16a、bebe、4e三轮精确冻结审查，先后提出并由唯一原writer修正 E9任务/会话/草稿绑定、E10持久原文消息重建分页覆盖、E11旧额度系统提示、E12同PI失败证据处理、E13长期需求部分HTTP/UI修正、E14 build-required缓存、E15普通工具throw。4e最后增量只读审核无剩余工程阻塞；核心stale/failed精确no-progress且旧revision保留，passed绑定当前源码。工程未重跑作者整套测试；实际代码与定向TAP分别核对，不冒充独立执行。原生SessionManager.open/compaction、PI orphan toolResult投影补齐均复用本地0.99.1，不重放副作用、不替换框架或自建摘要。实现详见 `docs/studio-continuous-implementation.md`。

独立证据已由QA补齐：continuous16/16与严格QR8/8，summary `test-results/studio-002-qa-continuous-4e43676-summary.json`。包含真正native自动threshold压缩/事件/继续、精确session/draft硬kill恢复、未送达需求原文不能伪已读、同PI错误纠正、旧额度兼容和停止。真实PI/Edge+本地模拟模型/HTML编译替身，不是商业模型或Taro；超旧10分钟只用历史耗时seed证明不再设帽，不称真实10分钟压力测试。两个中文分页失败已证实为QA fixture逐chunk UTF8解码错误，修为Buffer.concat后定向2/2，保留原失败及同强度原文断言，其余14项有效结果复用。

B集成基础38项首轮37通过，唯一旧5工具清单遗漏read_requirements；仅该精确白名单补第六项后单项通过，报告 `test-results/studio-002-b-continuous-foundation-approved.tap` 与 `studio-002-b-continuous-tools-integrated.tap`。QA主目录dbe CLI1/1内17实际命令，报告 `studio-002-qa-cli-continuous-dbe7a6bc-approved.log`；同r2 dist独立preview/E13 3/3，60条61729字符及时间保留，报告 `studio-002-qa-preview-r2-e13-retry.txt`。预览首exact label测试定位失败原日志保留，仅QA定位修正，不改产品/业务期待。工程已核四份最新QA源码散列与报告，精确入口、按影响触发和模拟边界写入回归说明。

### r2 包交接已完成，运行验收尚待后续

原唯一子代理 `/root/studio2_packaging` 在B明确放行后复用，正常require_escalated审批一次正式打包，主命令session26171实际exit0；Vite1581模块11.79秒，本地Electron38.8.6/builder26.15.3，既有依赖修复1113目录。完整入口 `D:/app/release-harness-20261009-studio2-r2/win-unpacked/Sprout Studio.exe`，保留整个目录。清单与工程核查位于同output的build-manifest.json、packaging-verification.json；B独立记录 `test-results/studio-002-b-r2-package-manifest.json`。

HEAD/baseCommit/finalizerSourceCommit均dbe完整SHA，43固定资源+3dist逐项匹配。工程独立重算manifest SHA256 `0292ee8f79ef9d256b28fe549fbe27095e53a097aca039dbc0137a8c62364f85`，exe SHA256 `62c62d170a95aa4a3eb3df05f0d56a3654ab4344f7452e21dea1334afed7100f`；exe壳与r1相同，版本须靠产品资源识别。清单productBase仍脚本硬编码历史值，不当本次冻结源。author缺失/asar禁用/依赖解析/配置跳过签名提示保留，没有因此改源码或重包。

stage `D:/app/.package-staging-studio-20261009-r2/dist`保留，B核root/dist与stage/包3散列后复用，记录 `test-results/studio-002-b-r2-dist.json`，无额外前端构建。工程/packager未启动UI/模型、未动current/Key/用户项目/旧r1/旧服务。代理已结束，不能称仍后台打包。

当前已实现并局部/独立回归通过、目录包已生成；正常r2升级配置复用、商业模型原读书同任务纠错与QR连续修改交付仍未获最终结论。继续负责人B统一放行/亲验，QA唯一实际执行，工程等待具体缺陷或下一冻结。先读TASKS、PRODUCT、B工作包和本节，再核实际HEAD/QA状态；不重复有效全套、Taro、打包或模型。A独占台账，工程不写产品/QA源、不提交本轮文档；无可靠唤醒不承诺后台持续推进。

## r1与分层预算阶段（以下为历史记录）

下列“当前”“待冻结”和配额策略均保留其发生时的事实，以本文件上方最新结论为准。

## 历史文档冻结与恢复入口

本次仅冻结本文件及docs/studio-regression.md供B显式提交同步，不纳A TASKS或QA活跃记录。稳定产品包ccae82b131abe30a7b9cc682c1b18712830d8dce、正常dev入口6a6481c34ec2cbaca77c49afe7cfc5d41803a253（已实际证明包生产资源等价）、9份独立测试94871848c724efe7d509eb228c439ed7d1926f0f、native两文件参数化ce621a7308446a2e7ca1a9771675e3aeb5e39792分别绑定。参数化支持native --package-dir绝对目录 --expected-product完整SHA，无参仅历史r1；语法/help及错误路径/错SHA早拒通过，未重复native5/5。下方保留首轮到当前的历史过程，“待冻结”等旧阶段措辞不代表最新状态。

当前新增主线为计划纠正与预算v2，已获用户/B批准，原repair writer在独立工作树新branch codex/studio-002-feedback从9487184实施，工程只读复审，QA主树唯一writer准备独立动态fixture。仍待产品冻结/工程审核/独立QA，不是已交付能力。核实根因为读书原task同session两次定位错误+一次成功子检查耗去旧三次额度，错误反馈确实收到且模型修改计划，第4次被预算拒；脱敏证据docs/coordination/qa/STUDIO-002-reading-selector.md及test-results/studio-002-reading-trace-1791537962130.json。原项目保护、不重跑/重置，QR未启动已暂停。

B批准v2联合上限：3业务（含passed）/3计划（静态亦扣）/6实际浏览器启动，runtime/external首次可纠正、第二次停；保留40tools/10min/3build/hostrepair3。开始前持久reserve runs+inFlight，终态宿主分类原子清除，hardkill保守业务扣一次；旧任务无v2按旧verifyAttempts保守处理，不复活旧预算。单元素歧义返回有限结构化候选，模型同session自行准确CSS语义纠正，count合法多匹配；不宿主盲first/nth、不降断言、不读取input.value/完整DOM。稳定同源同错误指纹重复不重开浏览器，瞬变runtime不能混为重复计划。

工程已向B桥接API审核重点：函数identity信任边界下QA须默认真实verifyPreview，不以注入wrapper伪plan；reason/resumable及recover/createTask一致，所有新计数/fingerprint继承；工具description/skill/剩余额度文字同步；独立回归须实际toolResult候选驱动响应而非固定排表。恢复从B取得冻结完整SHA、最终字段路径/理由/测试证据后精确审，不自行另派writer或重包。工程本次只改上述两文档，文档冻结后归还写窗口。

## 授权、归属与现场

已读 AGENTS.md、HANDBOOK.md、TASKS.md 最新 STUDIO-002、STUDIO-002.md。用户在 A 聊天直接授权工程/QA 负责人与执行代理组织及内部必要交流，授权来源见 TASKS 的组织补充、AGENTS 的授权与派发；正常源码同步在已有授权范围内。不得读取迁移旧 Key、重启历史服务、覆盖用户项目、费用或发布。

实际 Git 基线 ae0d8af。三个开发者归属 B collaboration 树，本聊天不能直接控制他们，由 B 桥接反馈；没有重复派发，也没有另建代码写入者。本轮只读代码，唯一写入本文件。D 盘三个真实工作树：

| 包 | 分支与目录 | 首轮已见实际改动 |
| --- | --- | --- |
| 1 | codex/studio-002-preview；D:/app/.worktrees/studio-002-preview | index、Store、UI、CSS、测试 |
| 2 | codex/studio-002-config-cli；D:/app/.worktrees/studio-002-config-cli | Electron profile/单实例、共享 HTTP client、CLI、verify 路由 |
| 3 | codex/studio-002-repair；D:/app/.worktrees/studio-002-repair | agent、harness、verify、index 终态 |

C 盘 managed detached 工作树仍见于 Git 清单，本轮不使用。用户原现场仅沿用 B 已定位记录（r3 主 PID57264，API59462，preview59461）；工程本轮未触碰其服务、项目或配置。

## 首轮接口审查

下列结论针对未提交开发中快照，不能当最终缺陷或验收通过。

1. 包1 run 在读取项目之前 await cancelPreparation，准备过程等待 operations 锁时检查 signal，这一顺序可避免准备覆盖制作。仍须独立验证：准备发布临界点、内存需求编辑、关窗清理、取消后 run。index 各包按 hunk 集成，禁止整文件覆盖。
2. 包2 verify 必须同项目 mutation/assertIdle，检查当前 revision/sourceDigest，关窗可中止并等待完成。若集成后初始化仍存在，应先取消准备再读项目；未就绪项目不能被记为验证通过。CLI 共享 HTTP client，不另建 agent/build 业务路径。
3. 包3已改为工具 execute 前检查总数、同 PI session 接续、最新源码构建与验证通过后 commit，并延迟模型自由文本直至服务判断交付。这些方向符合契约，尚未验证全部异常路径。

## 已交 B 桥接的具体问题

| 编号 | 证据与影响 | 要求与状态 |
| --- | --- | --- |
| E1 | verify.mjs verificationRequirements 首个正则把当前句“改成蓝色”判 general，即使历史目标为文字二维码；连续样式修改可降级实际扫码验收 | 仅明确撤销二维码或明确换产品目标才解除既有要求；加连续修改回归。已交 B，待复审 |
| E2 | validateVerificationPlan 空输入允许任意 count selector=0；不存在的无关选择器可以假充二维码消失 | 绑定此前实际解码的二维码区域或真实错误提示；保留像素解码、输入逐字匹配。已交 B，待复审 |
| E3 | agent budgetUsedMs 仅 finally 赋值；进程终止/崩溃丢失本轮耗时，重启 recover 后可重获时间预算 | 持久化累计时间及本轮计时起点/检查点，恢复保守计费并继承工具/构建/检查次数。已交 B，待复审 |
| E4 | 包2 verify 路由最初只调用 verifyPreview，未使用包3 profile/plan/evidence；手工 CLI 可用结构断言把文字二维码状态改为 passed | 集成必须统一要求与证据校验，状态明确为所列实际检查而非整个需求完成。待交 B/复审 |
| E5 | UI settings 仅本窗 boot/保存刷新；另一窗或 CLI 保存后旧窗 hasKey=false 仍阻止发送 | 窗口激活/发送前刷新公开设置，清除也同步，禁止回填密码。已交 B，待复审 |
| E6 | tool_execution_start 先发状态，再 execute 增加预算计数；崩溃在检查过程中可能少记一次真实检查 | 预留次数后持久化再启动副作用，保存失败不执行；覆盖硬终止恢复。已交 B，待复审 |

E1/E2 已通过只导入 verify.mjs 的最小调用复现：历史文字二维码 + “改成蓝色”结果 general；空输入用 .totally-missing 数量0可获 plan 接受。没有调用模型、浏览器或写用户数据。之后未提交代码已将 E1 限为明确撤销二维码，E2 count 必须绑定 qrSelectors；仍待最终提交/回归证据。E3 已见 checkpointBudget 在状态、finally、recover 的改动；恢复会保守计入停机时间，不重获预算，待执行者验证。E4 B 已确认桥接。

后续开发快照复审：E5 已见 focus/1500ms 公开 settings 刷新；E6 已见工具、编译、实际检查预留次数后 await persistBudget，并提供 onBudgetCheckpoint 连接 index 队列；保存失败停止。尚未定版，必须看最终提交及回归结果。8个变更中的 mjs/cjs 文件 node --check 无语法错误；不代表运行验收。

追加复审：E1/E2最小调用复验已得到样式/历史修改保留text-qr、无关empty selector拒绝。包1 catch 正常失败等待operations并持锁合并元数据；run取消时先标cancelledByRun，catch在run锁内完成，再由run读取，静态看避免死锁及覆盖需求。待开发者门控并冻结后移交QA。包3fill读取实际value严格等值，二维码从完整viewport截图按可见box裁剪解码；建议证据门也要求viewportImageDigest。E6最后自主接续repairPrompts预留后也应持久化再发模型，已交B。

包1开发者实测产物已读：基线 studio-preview-baseline.json 首 bootstrap 93.966秒、新建 POST 28.380秒；studio-preview-ui-report.json 首可输入195毫秒（seed故意阻塞，不是首次编译提速结论）、新建可输入488毫秒（真实Taro双端后台构建）、真实预览29.757秒。375×720/320×720内容尺寸在3种桌面视口保持，缩放后inside=true。报告复用first-attempt真实构建；尚未绑定最终提交/独立QA，不重跑有效繁重编译。

B 新增现场证据已读 test-results/studio-002-user-preview-report.json（2026-10-09T08:12:36Z）：原 r3 rev3 在375×720视口完整显示240×240 canvas，一二三输入实际匹配，无 runtime error，viewport/fullpage jsQR 均未解码，无变更请求。该证据证实用户故障，不能推断白缝是根因。旧现场不处理；新包新项目验证最新模板固定编码资源及服务验收门控。

## 原生能力核对

本地依赖 PI 0.99.1，Electron 38，Taro 4.3。已读本地 PI AgentSession 声明：prompt 返回 Promise、可 abort/dispose。官方 SDK 文档及源码仓库说明同会话连续 prompt、steer/followUp、session JSONL；本轮采用原生同会话 prompt/abort，不另造智能体框架。版本兼容以本地固定声明与执行证据为准，在线 main 不能替代 0.99.1。

- https://pi.dev/docs/latest/sdk
- https://github.com/pi-packages/earendil-works-pi/blob/main/packages/coding-agent/docs/sdk.md
- https://github.com/pi-packages/earendil-works-pi/blob/main/packages/coding-agent/docs/sessions.md
- https://www.electronjs.org/docs/latest/api/app
- https://github.com/electron/electron/blob/main/docs/api/app.md

Electron 原生 userData 与 requestSingleInstanceLock/additionalData 支持稳定目录与同实例新窗口。维持已有 safeStorage、Playwright/jsQR/PNG 依赖，不增加许可证或引入成本。完整候选许可/维护记录以三个执行者交付为准；当前仅接口审核，不称调研全部完成。

## 状态与恢复

### 唯一打包执行代理登记（待B放行）

接续：B已明确放行最终完整SHA ccae82b131abe30a7b9cc682c1b18712830d8dce，实际HEAD已核一致；较a329仅CLI测试3行等待真实ready，B报告定向5/5及其他70项通过。三包QA结论已回（包1通过、包3修后8场景通过、包2隔离后25项CLI和5项native通过），残余包内/UI/真实模型留最终包QA。已用followup复用唯一代理/root/studio2_packaging，执行前重核输入干净和目录不存在，再按固定参数正常目录打包一次；不得额外根目录build、不得启动正式UI或模型。当前等待实际打包结果，不能记交付通过。

首次打包失败（保留事实）：默认use_default执行，Vite226ms/1module后报`[commonjs--resolver] EPERM: operation not permitted, realpath 'D:\app\src\main.jsx'`（node:fs:2838:18，Vite getRealPath:28861），主脚本退出1，尚未进入electron-builder。指定stage物理目录已存在但entries为空，output/manifest/exe不存在；主命令及Vite子进程均已报告exit1。CIM额外枚举被环境拒绝，不能称已独立枚举全部进程。HEAD及产品输入仍一致。无源码改动/删除/重打/UI/模型/旧服务操作。工程向B提出清理确认属于本轮的空stage后，经正常require_escalated自动审批按原参数定向恢复；待B明确，不自行绕过或改目录。

B随后明确批准此环境失败定向恢复：重核绝对路径、归属和冻结输入，仅删除本轮失败stage（空目录非递归），output不存在不处理；相同参数通过require_escalated正常审批执行一次，拒绝则保留原理由停止，不绕过、不另造目录。已followup同一代理执行，等待审批及实际结果。

定向恢复正常exit0，Vite1581模块10.33秒，使用本地Electron38.8.6/builder26.15.3，既有生产依赖修复复制1113目录；builder依赖解析warnings保留，尚未包内运行。实际产物`D:/app/release-harness-20261009-studio2-r1/win-unpacked/Sprout Studio.exe`，须保留完整win-unpacked；清单为output/build-manifest.json，额外核查为output/packaging-verification.json。43固定资源（electron3/cli2/server10/templates26/agent-skills1/package1）stage与包散列一致，补核3项dist一致。12源码仅Git正常LF/CRLF转换、归一化后匹配冻结提交，产品diff仍空。baseCommit/finalizerSourceCommit/HEAD均ccae82b131abe30a7b9cc682c1b18712830d8dce；工程已实际读取报告及manifest并独立复算manifest SHA256 fbee13f85c2c041f5d8cc8edadb00d24bb69df4e262034056a97931b83269412、exe SHA256 62c62d170a95aa4a3eb3df05f0d56a3654ab4344f7452e21dea1334afed7100f一致。所有脚本子步骤顺序await后主命令exit0，无正式UI/模型/下载/旧服务操作。已向B交付接续独立包内QA；打包不是整体验收。

### 可重复回归入口交接

B传达用户新增要求：关键用户轨迹须持久测试源码与真实可运行入口，截图/报告不能代替测试；按变更选择相关轨迹，交付前覆盖核心跨包，昂贵真实模型和打包明确触发。B已批准工程独占`docs/studio-regression.md`；QA独占tests/qa/preview-journey.test.mjs（可选preview-fixture.mjs）、qr-delivery.test.mjs与qr-fixture.mjs、cli-journey.test.mjs（可选cli-fixture.mjs），QA Lead独占scripts/studio-qa.mjs与studio-qa-pixels.mjs。当前QA源码尚未冻结，工程等待实际命令/覆盖/版本再接文档，不写package.json或QA文件、不据tests/docs/scripts-only提交重包。最终分别绑定产品包ccae82b和回归测试版本。

已落地docs/studio-regression.md草稿并交B/QA核对：准确列当前入口cli/preview/qr/core/repair/handoff/browser/delivery、隔离环境/Edge/dist准备、变更与轨迹映射、交付核心跨包及昂贵流程触发；明确当前新套件仍待冻结与首次运行证据。工程仅实际运行`node scripts/studio-qa.mjs help`核对接口，不代替QA跑测试。恢复后从QA Lead获取冻结版本/首次结果再补文档；当前QA另已获B最终包UI放行，工程不抢执行、不读配置、不调用模型。

接续QA冻结交付：QR8/8、CLI1/1内11命令、preview2/2，真实Edge与mock范围见docs/studio-regression.md；统一runner仅cli实际通过，其他tier不记已跑，UI helper仅previewGeometry真实调用两次，pixels不记final pass。工程已在B明确给予的docs唯一写窗口补准确结果、8个测试/助手实际SHA256和长期配置规范。当前测试尚无独立Git提交，后续由B提交时分别绑定产品ccae82b和测试版本。

### 配置反复输入纠偏（只读审核与待实施）

A/B传用户最新明确要求一次安全配置、自动QA、不依赖CU或A反复填Key。工程未看窗口/字段/截图、未读任何旧或current vault、未操作保存/清除。源码证明normal npm start/pack/newwindow/CLI默认共用appData/Sprout Studio/current且项目不改变配置；显式profile覆盖隔离，工作区并发冲突拒绝。打包脚本只动新stage/output、此次只删失败空stage，没有访问current。r5专用profile与新current分离是当时禁止历史迁移的设计，不是已证实包覆盖Key。

确认未统一的入口是package scripts.dev直接server/index.mjs的Vite middleware，无credentialStore，配置仍内存；STUDIO_URL外接亦独立。已向B提最小3文件方案：package.json的dev先npm run build再electron .，保留dev:web裸server；README与docs/studio-cli更新准确入口/例外。不动main/server/profile、不增依赖/Keybridge、不迁移vault；推荐B桥接原包2writer独立tree实施，待B指定。仅scripts/docs变化时工程应实际证明生产化package（删除scripts/build/devDependencies）等于本包stage、固定资源不变，再判断不用重包，不能口头替代核对。

独立QA接native跨包目录轨迹：固定包两物理目录副本、自有temp profile通过stdin仅保存一次自造占位，再真实正常窗口/新窗口/CLI/另一exe路径重开，断言公开保存状态及项目；不读取真实配置、不模型/额外编译/打包。工程只提契约不冒独立QA。A不再代录/代QA，已填未保存window1445978由B安排QA受控接管；工具有缺口则报告最小补充入口，不能要求A再填。真实模型后续持续用current新项目，离线隔离全部自造占位。

用户最新直接澄清：“管理员”为口述误解，取消额外管理员角色及审批设计，不扩展产品权限系统。核心目标为用户一次配置后，配置独立于程序构建持久保存，编译/升级/重开/切换项目/CLI继续可用。B统筹最终结果，工程负责实现与安全存储，QA负责正常入口跨编译/跨exe/升级实际轨迹，不能只凭源码推断通过。既有现有Key保存使用授权有效，不含创建账号/新Key/费用；不索取、读取、复制或将Key写入记忆/报告/Git/命令历史。本次已填未保存表单由B安排QA受控正常保存，不让A或用户重填；current不因QA结束自动清除，隔离占位可自清。实际保存与公开状态证据待QA反馈。B已指定原包2writer独占package scripts/README/docs-studio-cli3文件，工程不另派。此前角色误解已删除并将最新纠正同步B/QA。

最新实际接续（覆盖前述等待）：原writer e07497ec1308f6223127dce88829e0d99a002fc0仅3文件已冻结，B合入main 6a6481c34ec2cbaca77c49afe7cfc5d41803a253。工程精确diff复审并两次实际读取提交/主树package，删除scripts/build/devDependencies后与本包stage及包内JSON deepEqual，canonical SHA256 ba2a4dceac8f1c825226361610934ff9572aefe882a7696dbcbc6fee26b3e8a3一致；因此无须新包，包产品仍ccae82b。普通dev实际编译后复用未以此静态结果冒充通过。

未保存窗口后来退出，A无现存secret变量，工程未读取字段/vault/工具历史找密钥。工具能力评估区分用户明确无应用文件/env/argv/日志/Git与工具chars可能留执行记录的风险，不把后者自行扩大成永久无法推进；B最终用既有CLI隐藏TTY一次供应保存，报告公开hasKey/persisted/encrypted均true且无warning、lease正常清理，无新pipe/管理器/额外Key供应。后续真实模型由B放行QA唯一两自然tasks，工程不调用模型。

QA持久native源码已冻结74cb7d618b49f10d23b04e37e1ec4c21c9fab47da66a523eecabacba86fddb45，工程实际读源与报告并复算散列一致：5/5及6包内CLI，报告test-results/native-config-upgrade-1791537133516/report.json，运行HEAD6a6481c、包ccae82b。一次stdin占位真实DPAPI、自有profile、同版本两exe目录A双窗口/项目/CLI→关闭→B重开继续，异profile为空，自有清理完成。exe hardlink/copy、资源junction复用并核散列；非不同产品升级/重新编译/default current全入口/真实生成证明。runner显式native且排除delivery，新hash c38ee996af66369cdc3ced61f978dd35ecd92a30a16968f570800effd98eb4a4。QA归还源码后工程已补docs准确命令/触发/结果/边界，不重跑桌面/编译/模型，完成窗口交还B。

九份QA测试/入口已由B显式提交94871848c724efe7d509eb228c439ed7d1926f0f，工程实际git show核清单9文件，并将docs/studio-regression.md改为准确测试提交号，不再称未提交；开发入口版本6a6481c与产品包ccae82b分别保留。QA获B放行唯一真实模型轨迹，整窗截图/tree自动审批因可能Key拒绝后改最小公开状态检查；工程不接管、不绕过、不改产品，文档完成归还。

B已授权工程组织唯一打包执行子代理，实际已创建 `/root/studio2_packaging`。当前仅只读核查脚本、本地依赖、路径和manifest规则，不运行构建、测试、打包或服务。最终源码须等三个独立QA结论及必要修正冻结，由B明确提供完整SHA并放行；当前main短SHA a329d26不作为打包授权。

固定暂存目录 `D:/app/.package-staging-studio-20261009-r1`，输出 `D:/app/release-harness-20261009-studio2-r1`。使用现有脚本及 `--source-commit FULL_SHA`；一次正常目录打包，实际缺陷才定向重打，不覆盖旧包、不下载或新增依赖、不停r3。代理后续仅写指定打包产物，不写产品源码或TASKS；工程负责人汇总，B负责放行和最终验收。manifest须覆盖cli/electron/server/templates/agent-skills固定资源。恢复时复用该代理并核对B最新指令，不重复创建执行者。

代理只读准备结果：HEAD为a329d2624d911ffbfc96c8a6f7e347217f1e9986，产品资源/脚本限定diff及untracked检查无输出，仅协调记录有变动；两个目标目录均不存在且规范路径在D:/app内。本地Electron38.8.6、electron-builder26.15.3、Vite4.5.14、jsqr1.4.0/pngjs3.4.0及所需可执行入口存在。脚本递归核对electron/cli/server/templates/agent-skills/package.json的stage与包SHA256，生产package仅允许builder标准scripts移除。脚本source-commit参数只校验记录提交，不保证当前源码匹配；正式运行前必须再次核对B最终完整SHA、实际HEAD及固定资源差异。准备结果不代表构建或包验收通过。

待放行命令：`node scripts/package-desktop.mjs --stage D:/app/.package-staging-studio-20261009-r1 --output D:/app/release-harness-20261009-studio2-r1 --source-commit FULL_SHA`。执行前重核目录仍不存在、所有产品及构建输入干净、B冻结期间无其他产品写入。manifest中productBase为历史常量，最终基线按baseCommit/finalizerSourceCommit和资源散列识别；固定资源列表未含前端dist散列，包内前端仍需后续QA实测。代理已结束准备轮，等待显式followup，没有后台执行。

B最新反馈：集成一次全量测试仅studio-cli.test.mjs:55因异步准备后立即verify而未ready失败，B核对并窄调测试等待真实ready，不改业务策略；待新SHA及放行。包3followup独立8场景已通过，包2完整报告仍待。工程已提醒等待应有超时/失败处理、不能固定sleep掩盖；目前仍未启动包。

### 独立QA追加空输入缺陷与接续审核

QA真实动态全链在f371856发现新缺陷：test-results/studio-002-qa-repair-dynamic.mjs/json 的constant-empty-label模式中，常驻“请输入内容”、empty click无动作且旧QR仍在，验证器仍passed。此前工程“可交QA”不是验收通过，本缺陷须修正后复验；不改原失败记录。

原writer当前verify.mjs followup方向已审核：空输入前记录断言元素状态；text需可见且本次才出现期待内容/可见性变化；count0需此前成功解码同selector且空输入前存在；emptyChecks绑定fill/click/assertion步骤与selector/expected/transition，并由validateVerificationEvidence校验。新增实际空输入错误反馈可保留旧QR，不强制清空。尚待最终冻结SHA与原独立动态步骤复验。

B当前独占main集成，工程只读；main正在合入包2时的冲突不是最终差异，不据此定结论。B计划将restore成功响应移到draft清理后，并以立即verify门控复验。等待冲突完成和窄修提交再审接口，未重包/未模型请求。

后续实际diff已审：main d557124完成四个产品提交集成，保留异步准备/PhonePreview/resumable、公开settings及共享client、预算回调和统一验收route。6行窄修中，未ready的verify报不可用并保留后台准备；ready则cancelPreparation排空、重新get后绑定digest。restore在finally清理draft后再同步res.json，随后无await释放mutation锁。tests/studio-integration.test.mjs以门控阻塞fs.rm，断言清理期间未响应，释放后立即verify，不靠sleep掩盖锁窗口。静态审查无新增阻断，待B冻结与执行结果。

empty followup又增加祖先opacity/visibility/display检查，避免Playwright将opacity0视为visible；正常新增提示保留QR、常驻提示、hidden、opacity0、移除此前QR五模式测试源码已审。14项阶段报告已见，透明模式最新结果及冻结待核。两份变更mjs语法检查通过；工程未重跑整套测试。

已读最终empty-feedback-final.tap：单文件1/1、0失败；最新JSON五模式为normal-retains-qr passed、constant/hidden/invisible-new-feedback failed、count-removes-qr passed。最小followup三文件源及证据审查暂无新增阻断，等待冻结SHA绑定并交原独立QA复验。main窄修已冻结57177cb6c4d28f484388d21ec34caaa72a81b93e（index6行、门控测试26行），代码无遗留合并标记；工程审核可交QA，不把测试方法当已独立通过。

最终followup冻结e3c816432963f84da6583510a87d6152594f5ff8，3文件47增4删，树干净。精确diff复审通过，可交原独立QA。最终isEmptyFeedback统一兼容“请先输入”，不降低状态变化/可见证据门；新增第六场景normal-please-first passed，其余五场景结果不变。14相关与最终单文件专项报告已核，原QA失败证据保留。B获新SHA后统一集成，QA按原步骤另存新版本报告；B仍负责最终完整正常用户历程。工程本轮审核已完成，没有重包/商业模型/用户现场变更。

### 16:25 包3冻结审核：可交独立QA

- 精确提交 f371856125f8f3c2f05aa1eca907603b41908588；D盘repair树干净，9文件293增44删。已读最终源码hunk、docs/studio-002-repair-implementation.md、test-results/studio-repair-final.tap（39 pass、0 fail）及QR正反例JSON。
- E1/E2/E3/E6具体修正、no-op制作拒绝、当前writes绑定构建/验收、fill实际值、整viewport截图裁剪像素证据、停止与诚实终态均已核代码及相应开发者证据。工程结论：可交独立QA，不代表独立验收通过。B确认QA Lead已获SHA接续，本聊天不重跑有效全套测试。
- 集成必须保留三个verify同步导出共用、onBudgetCheckpoint等待原checkpoint队列、task.resumable!==false。包2verify应使用verificationRequirements(project,'')，不能接受请求prompt绕过既有要求。B最终仅拾取包2owncommit，避免其测试依赖的repair提交被重复纳入。
- 正例QR报告为已知静态像素解码，输入驱动120字中文生成与真实自然模型完整链尚待独立QA；通用text/count仅证明所列断言。测试中构建/部分verifier替身有明确标识，没有新增真实模型或Taro重编译。本轮无包3新增工程阻断。

### 包1冻结审核：可交独立QA

- 精确提交 c288bd2a3ce0570bc0fe9fe8e88405fdb490077e，14文件；已跟踪源码无差异，另有4个未跟踪.test-preview临时目录，未纳入提交。已读docs/studio-preview-implementation.md、实际Edge计时/尺寸报告、测试fixture和新增门控。
- catch失败/需求编辑锁、run先cancelPreparation、关窗排空、新建revision0异步准备、375×720内容缩放均落实。额外重启门只准备!ready且无tasks项目，保护首轮模型中断的revision0恢复基线。无新增工程阻断，可交QA。
- 作者报告最终26/26（八项准备门控与core）+15/15（harness/desktop-close/security/agent-budget）、Vite/Edge通过。工程复用报告并核代码，不重跑；独立QA仍须绑定冻结版本执行。
- 旧回归新增waitProjectReady是建立已发布fixture，没有放宽原版本/停止/安全预期。集成core.test冲突应同时保留包1等待ready和包3实际verify；UI共享client与PhonePreview/resumable hunk均保留，index close准备Map与包3预算回调均保留，不覆盖整文件。

### 包2冻结审核：可交独立QA

- 精确own提交398de9ae835aacef957d002e3ab5993194175e7c及13149253d1a0f5fb0d0f9c710b988d5c62b97660，测试树HEAD为后者且干净；中间ddecf35是包3依赖，不重复拣选。已读STUDIO-002-CONFIG-CLI-EVIDENCE.md、最终策略测试报告（22/22、0失败）、原生Windows占位测试方法及源码。
- verify固定采用verificationRequirements(project,'')，计划/证据错误存failed并CLI非零退出；请求prompt不能解除既有二维码要求。公开settings聚焦/轮询/发送前刷新，不回填密码；共享client、stdin配置、每客户端lease正常quit及CLI入包/manifest已核。E4/E5工程关闭，可交独立QA，非原生包或真实模型总验收。
- 集成关口：包2没有包1初始化代码，verify进入mutation后仍须await cancelPreparation再读项目。作者实际发现restore响应已成功、finally仍在清draft而写锁未释放，紧随verify可能被拒；交B在集成窄修并用立即请求门控验证，不靠sleep掩盖。

本轮三个冻结包均已完成工程审核并向B发出可交QA结论。尚未独立验收、未打包、未调用真实模型。继续负责人B统一集成及窄修，QA Lead负责各包及最终正常用户历程，工程负责人在B提供集成提交后可恢复做接口复审。现有执行者仍由B管理；不能声称本聊天已派发他们或在后台常驻。

16:23阶段判断：包1最新hunk静态审核无新增阻断，新增构建失败与已接受memory保存的门控用例已读，待通过结果与冻结SHA即可单独交QA，无需等待其余包。包3已见repairPrompts预留后await持久化、viewportImageDigest证据门；硬kill检查中预算回归用例覆盖真实子进程，待通过/冻结。包2Windows headless stdin EOF提前退服务已由执行者/B发现，当前改为自建lease文件/PID存活检查及正常app.quit；需原生通过证据。CLI verify仍须统一包3规则，保留交QA关口。工程本轮不运行他人开发中的整套测试、不重复构建。

恢复读取 TASKS/STUDIO-002、B 总工作包、本文件，核对三个 D 盘 worktree HEAD/status 和 B 最新运行状态。主目录代码不写、不合并、不 push；若需新增 writer，先 B 登记再独立工作树。结束前更新此处版本与证据，不要求用户搬运消息。
