# HARNESS-001 工作包

更新：2026-10-09，北京时间。当前执行记录由 B 维护；唯一当前任务状态以 ../TASKS.md 为准。

## 归属与授权
- 唯一实施负责人：B 小芽项目负责人，聊天 01a11ebf-e71e-71c0-97a1-86bcff83f324。
- A 总办秘书：01a11e93-220d-7ba1-bc51-23007e5621e4，独占 AGENTS.md、HANDBOOK.md、TASKS.md。
- C 工程执行子代理：/root/harness_engineer；本轮唯一产品代码写入者。
- 用户授权来源：B 已读取 A 聊天 2026-10-09 的直接用户消息（turn 01a11ebd-cf14-7230-bb80-11758121540f），用户明确批准自行推进、长期 PM 聊天和工程团队；项目内协作范围同时见 AGENTS.md 与 TASKS.md。
- 工作目录 D:/app，main，实施起点 36916ae（源码基线 788aa1d 后含授权管理提交），开始核对时无工作区变更。
- 本轮允许实现、适度重构、必要测试、保存提交和同步既有 GitHub 仓库；不注册账号、不新增费用、不公开部署发布、不迁移手机端。不读取 .studio 或历史进程密钥，不重启历史服务。

## 目标与顺序
保留电脑 demo 与调试入口，先完成需求记忆，再任务恢复，最后以实际交互推动功能修复。最终微信创作目标本轮不迁移。

| 子任务 | 执行归属 | 完成条件 | 当前证据 |
| --- | --- | --- | --- |
| M1 需求记忆 | C /root/harness_engineer | 持久目标/约束/变更进入上下文，超过十条消息不丢；用户查看修正；旧项目、重启、回退兼容；不保存密钥 | 已实现；自动测试/真实页面修正/长期PI上下文通过。独立QA发现流式与检查结果泄漏后修复，已独立复验无占位密钥泄漏。真实模型效果待验证。 |
| M2 任务恢复 | 同上，顺序执行 | 持久状态/进度/恢复点；断线与停止区分；重启标明中断且支持继续；停止不重试；恢复核对代码、失败留旧可用版；资源与重试上限 | 已实现；基础状态/API/UI/硬中断已测；QA独立提交与restore停止竞态修复复验通过，接受停止保留旧版/检查，保存边界后停止409明确拒绝。恢复是最后可用源码重新执行。 |
| M3 功能验收 | 同上，顺序执行 | 清单/记录/计算三类覆盖生成、连续修改、真实交互、运行错误修复、回退；明确模型/编译证据性质 | 基础12阶段已测但标题修改不证明业务变化；现已补三类真实H5业务改变并独立QA3/3通过，多项删除/多记录合计/计算边界。三类业务修改rev2后续Weapp/官方格式3/3也已补验；真实模型、微信实际运行/真机待验证。 |

## 验收与交付
B 检查实际代码、执行相称的独立验证，不能仅据 C 汇报宣称通过。分别记录已实现、已测试、已交付、已验收与待验证；模拟模型不证明真实模型效果，编译不证明功能通过。
测试使用独立临时工作区与端口，不触碰原用户数据。C 提交明确产品文件及测试源码，B 维护本文件并统一核对同步；排除密钥、依赖、构建与临时产物。

## 运行与恢复
- 当前：r3新独立电脑版与包内实际编译/新产物交互/保存关闭已验收通过，源码8076b85包含c88退出窄修；三类业务修改版本Weapp及官方检查3/3通过。执行C已结束，QA完成最终记录后结束，B提交同步最终记录；既有29项/三类H5证据仍有效，不重复。真实商业模型与微信实际运行待外部条件，不记总任务完成，无永久后台承诺。
- 恢复入口：先读 TASKS.md、本工作包，核对 git status/log 和 /root/harness_engineer 消息、代码与证据；子代理无法继续时按现有实际改动接续，禁止重复派发写入者。
- 继续负责人：B；结果报给 A，由 A 更新总台账。
- 停止条件：完成目标、用户停止，或遇新增账号/费用/发布/关键范围取舍时上报 A；继续不受影响部分。
- 下一步：B正常同步明确源码与三份说明，交A登记最终提交/产物和条件缺口；真实模型需正常输入后再做开放需求/自主检查修复验收，微信实际运行/发布不自动启动。

### 当前电脑版产物专项
- 授权来源：A于2026-10-09依据用户既有自主开发/验收授权及实际heartbeat续派；范围仅当前电脑demo产物，不新增费用/下载/发布/微信迁移。
- 执行/QA归属：C /root/harness_engineer，QA /root/harness_qa；B维护本工作包，QA独占HARNESS-001-QA.md，A独占台账/手册/AGENTS。
- 资源上限：本轮30分钟，正常打包1次、确认缺陷后最多1次针对重打；不反复尝试缺依赖下载，不重复29项及三类已有效编译。条件不足明确报告并完成其余检查。
- 先核对现有Electron38、electron-builder26、Playwright及package/repair脚本，优先现成能力；必要产品修复仍只C写入。打包需新的stage/output，不能旧release冒充新版本，运行必须新userData/workspace和随机端口。
- 产物/版本/新证据待执行提供；不读取.studio/旧进程key，不重启旧服务，只有占位测试模型或离线fixture。真实模型验收入口仅确有缺口补充，不主动费用调用。
- 续派规则（A根据用户反馈明确）：子任务结束先对照HARNESS-001总验收条件；同一授权范围仍有实质可做工作，B自行接续并告知A，不以代理/提交结束为总任务停止。外部条件仅阻塞对应分支。无新增实质缺口不无限扩展/重复测试；结束交付列已完成、尚可做、外部阻塞、正在执行、恢复入口。Git提交前与A管理写入协调。
- 首包release-harness-20261009已真实exe独立QA：启动/包内哈希/隔离路径/renderer权限、需求修正与普通重开、旧版本预览通过；尚不能交付。QA对仅新fixture的storage.json rename加500ms门确认写入中，新增4使合计9后正常关窗重开实际5，P1最后数据丢失。新证据test-results/qa-desktop-report.json，QA数据qa-desktop-r2FMVi，不含用户数据。
- B已派C唯一写入最小修复关闭fence/drain（包括队列登记前在途请求），随后唯一第二包，不覆盖首包；QA保持原触发独立复验。未宣布修复通过，不无限重包或重跑旧测试。

### 独立 QA 首轮缺陷与修复派发
授权：A 于2026-10-09续派独立QA及范围内修复，用户既有自主协作/功能验收授权不变。QA具体证据和最终结论以 HARNESS-001-QA.md 为准，复现脚本/输出在本机 test-results/qa-special-repro.mjs、qa-special-report.json，不上传临时目录。
1. P1：模型把已知占位密钥拆成两个 text_delta，逐段脱敏后NDJSON拼接仍泄漏完整值。
2. P1：功能检查结果 steps.value/storage 回显已知占位密钥，project.json/版本verification未经脱敏持久保存。
3. P1：Agent 进入Store.commit后暂停，停止请求返回200，再放行仍发布新版本且任务completed/done。
4. P2：真实Edge正常200ms异步新增元素，数量断言立即读到0误报失败，可能错误触发模型修复。
5. 验收缺口：旧三类连续修改仅标题、修改阶段未断言新标题，不能证明业务规则改变。B 已派每类一次真实业务变化模拟PI执行+真实H5/Edge，不重复原首版双端和12阶段。
执行C已收到读取原复现、修复产品/tests、先不提交、由QA独立原步骤复验的派发；严禁并发产品写入。此处仅记录确认缺陷，不预告修复通过。
首轮修复采用已装PI事件/abort与宿主原子保存的最小补充，无新框架：分片文本缓冲、验证递归脱敏、候选project提交、停止/发布边界及数量限时等待；C自报28项轻量回归通过，独立QA结论尚待报告。停止修复同时要求旧verification/回复不能假发布，restore路径及不可取消阶段返回必须明确。
上述为过程记录；最终修复产品242b6fc包含分片截断前缀与对象属性名脱敏、保存边界中关闭等待。QA原触发复验及restore边界通过；QA业务复验扩展为双项逐删、3+2再改最后值9合计12并刷新、倍率3/非法负数/非数/零，3/3通过。具体独立证据/优先级/未测范围见 HARNESS-001-QA.md。

## 复用调研（2026-10-09）
用户新增要求“尽量不重复造轮子”已传给 C，C 已确认。B 先检查已安装版本，再查官方 GitHub；不因 PyTorch 口述更换 PI 技术栈。

| 候选与来源 | 当前版本/许可证 | 可复用及本轮取舍 |
| --- | --- | --- |
| [PI SDK](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/sdk.md)、本地 docs/sdk.md、examples/sdk/11-sessions.ts | 已装 0.99.1，MIT | 已接入 SessionManager.create(draft, project/sessions) 原生 JSONL 与任务 custom entry，消息持久化包装脱敏，记录工具轨迹与恢复来源，最多保留50会话。复用原生工具事件、abort/retry，不自行重建 Agent 循环。恢复核对最后可用源码后建新会话重新执行未完成需求，不直接重播旧文件副作用。用户可编辑需求、任务 stop/断线语义、可用版本切换不是原始会话日志本身，保留最小宿主层。 |
| [PI 仓库](https://github.com/earendil-works/pi) 的 pi-durable | main 提供 durable conversation/task/document runtime；本机未装 | 官方仓库有持续维护历史、未标归档；新组件与 0.99.1 的兼容性未验证，不直接升级或引入整套服务。当前任务恢复先复用已装原生能力并补宿主状态。 |
| [Taro](https://github.com/NervJS/taro) | 已装 4.3.0，MIT | 保留现有真实 H5/微信编译及项目模板，不自造编译器。官方仓库有维护历史、未归档；以当前版本真实构建验证兼容性，不因 main 文档升级。 |
| [Playwright](https://github.com/microsoft/playwright) | 已装 playwright-core 1.63.0，Apache-2.0 | 直接复用浏览器、定位和操作 API；只补限定步骤、业务断言结果与 Agent 错误反馈。已有依赖升级为运行依赖以支持产品检查，不下载额外浏览器。 |
| [Playwright MCP](https://github.com/microsoft/playwright-mcp) | 官方维护候选 | 设计可参考；当前 Node 宿主已直接使用 Playwright，另加 MCP 服务增加进程/权限边界，不为同样点击输入能力再加一层。 |

外部 main 不是已安装版本的兼容证据；许可证通过已安装 package.json 与官方仓库核对。维护状况仅指查询日仓库未归档且有近期索引与维护历史，不承诺未来持续维护。

## B 阶段核验
- 已读实际代码并提出纠偏：项目操作并发互斥、恢复作业关闭等待、旧检查在写代码后失效、已知密钥脱敏、历史需求容量、源码摘要排序、真实预览限制一致、发送按钮事件。
- 2026-10-09 B 独立执行 `node --test tests/harness.test.mjs`：3/3 通过。第一次受沙箱 Windows junction 权限影响，批准临时目录依赖链接后成功；未读取 .studio。
- 该证据是迁移/修正/回退策略及模拟 Agent/替身编译下的断线、停止、恢复状态，不证明真实模型，也不证明三类应用功能通过。
- C 报告自动测试 17/17 与前端构建通过，待最终版本复核；真实三类构建/交互脚本仍在运行，未记完成。
- 后续 B 独立复跑核心 tests/core.test.mjs：14/14 通过；新增并发启动、错误反馈/旧版本拒绝和硬进程终止后的 tests/harness.test.mjs：4/4 通过。
- B 独立执行 scripts/harness-ui-check.mjs：退出0，test-results/harness-ui-report.json passed=true，验证需求查看修正保存、按钮启动、刷新查运行进度、主动停止及显式继续。该 UI 证据使用模拟任务/替身编译，属于真实页面操作而非真实模型。
- 三类真实证据仍由 C 顺序生成。早期 03:51Z 失败报告属于旧轮，问题是检查器在异步界面/存储桥更新前读取；已加入限时等待并重跑清单全循环通过。最终报告覆盖后再核验，不把旧失败文件当最新完成。
- 最终三类 test-results/harness-real-report.json 已更新 passed=true；B 读取并核对12阶段，每类生成、修改一、修改二引入错误后反馈修复、回退。各错误修复阶段 failedFeedbackObserved=true。
- B 使用最终检查模块、复用既有真实产物独立再跑三类第4版的操作与断言，全部通过；每类4版本，第4版源码精确等于第1版。独立证据 test-results/harness-b-acceptance.json。
- 证据范围：本地模拟模型实际调用 PI SDK，不是真实商业模型；首版真实 Taro H5+Weapp+微信产物格式验证，后续修改真实 H5，回退复用首版精确双端产物；实际交互在带 Studio CSP/存储桥的真实 Edge，微信模拟器/真机未跑。测试没有新增费用或读取历史密钥。

## 独立 QA 交接（用户新增团队要求，范围不扩大）
建议 A 指定一个独立 QA 负责人聊天，按专项需要分派测试执行者；开发侧由项目负责人/Tech Lead 统一写入与集成。QA 依据实际源码、业务步骤和运行结果做判断，开发自报只当线索。当前 B 已做开发外独立核验，尚未新建独立 QA 聊天或第二代码写入者；不要把未来角色描述成已在执行。

### 交接与运行入口
- 最终版本：产品提交 f774eb3173fc015fb04b9eebc8e1a08210bdd253（15个明确产品/测试/技术说明文件）；开始 QA 先核对 git log/status，不用 main 名称替代 commit。
- 自动测试：`node --test tests/*.test.mjs`；需求/恢复专项 `node --test tests/harness.test.mjs`；真实 SDK 模拟模型回归 `node --test tests/core.test.mjs`。用测试源码确认断言，不仅看退出0。
- 真实页面操作：先 `npm run build`，再 `node scripts/harness-ui-check.mjs`。脚本使用新临时工作区、替身编译和模拟任务，不是商业模型生成。
- 三类集成入口：`node scripts/harness-real-check.mjs`。该项已有有效证据，默认先读报告和源码；仅新缺陷或不一致时重跑相关范围，不默认再做全部编译。
- 独立复验可直接对报告 root 内 projects/<id>/revisions/4 使用 server/verify.mjs 的 verifyPreview，与 rollback 步骤核对；无需模型调用/重编译。B 已在 test-results/harness-b-acceptance.json 保存该项。
- 实际报告：test-results/harness-real-report.json（12阶段）、harness-ui-report.json（3项界面流程）、harness-b-acceptance.json（3类独立验收）。test-results 不上传；测试源码与本工作包及 C 技术说明用于远端恢复。不要将未提交的本机报告当作远端已有文件。
- 环境：Windows、已装 Edge、Node 项目依赖；Windows 临时目录 junction/浏览器启动可能需执行权限。只用新工作区/随机端口；不读 .studio、历史服务/进程中的密钥，不重启旧服务。

### 已覆盖与待覆盖
| 验收项 | 已覆盖的实际证据 | QA 剩余缺口/限制 |
| --- | --- | --- |
| 长期需求 | 旧项目迁移、用户修正、重启/回退策略、超过14条消息后的实际 PI 请求、已知测试密钥日志脱敏 | 真实模型对需求语义的遵循；复杂冲突需求处理与原生自动压缩触发后的长上下文。当前容量超限会明确要求整理，不静默删除。 |
| 任务恢复 | HTTP断线仍执行、重新打开看进度、并发run拒绝、主动停止及显式继续、关闭/硬进程终止后的中断标记、源码变化拒绝恢复、次数上限、检查点写入失败不报告完成 | 真实模型/真实编译正在进行时硬中断及磁盘持续故障；构建/工具调用极限的完整端到端压力验证。未运行的聊天不视为后台任务。 |
| 功能检查 | 三类12阶段，真实 H5操作/业务断言，运行错误回到模型工具结果、修复、精确源码回退；检查步骤可查看，空断言被拒；检查与源码版本绑定 | 模拟模型按预设工具序列执行，不证明模型能自行设计完整测试；当前示例修改以标题连续修改为主，新增复杂业务/多页面不在本轮。 |
| 预览错误修复 | 当前版本错误含定位信息、API保存脱敏/旧版本拒绝，修复请求实际送到模拟Agent；浏览器功能工具捕获真实操作错误 | 真实用户iframe错误→界面按钮→真实模型修复全链，及错误频发/异步竞争专项。 |
| 微信及交付 | 三类首版真实 Taro H5/Weapp、官方产物检查；后续修改真实H5；回退复用已编译首版精确产物 | 后续修改版本微信编译、微信模拟器/真机、最终桌面安装包、无Edge环境。不得据H5通过宣布微信功能通过。 |

交接后由独立 QA 负责人提出可复现问题及证据，B/Tech Lead 安排唯一写入者修复，QA 再核验。主要结果仍汇总给 A；范围/优先级改变由 A 同步台账。真实模型需使用正常用户授权输入的密钥，不借测试交接提取历史密钥。

## 基础交付核对（历史，后续QA结论见下）
- 已实现：M1/M2/M3 产品能力；C 写入结束，子代理回合结束，不视为仍在运行。
- 已测试：C 最终24/24自动测试、桌面前端构建、真实页面操作通过。B 在产品提交 f774eb3 上独立完整执行 `node --test tests/*.test.mjs`，24/24通过；三类真实回退操作复验已通过。技术说明：../../harness-implementation.md。
- 已验收：本轮无真实密钥条件下的实现与上述模拟模型/真实构建/真实H5证据范围；不宣称真实模型、后续微信改版、真机/安装包已通过。
- 版本对应：三类12阶段报告基于36916ae上的开发工作区，非最终每行代码覆盖。之后调整的严格参数、验证绑定、界面、清理/压缩与状态等由最终24项回归/前端构建/UI检查及B最新检查器复验覆盖；详情见技术说明“独立QA交接”。无额外重做已有效真实编译。
- 待验证：真实模型开放需求与自主测试设计、后续修改微信构建/微信交互、最终安装包，以及上方QA专项缺口。继续负责人 B；A 决定独立QA归属与下一轮任务状态。当前无需用户做日常技术决策。
- 远端同步：B 核对 origin/main 为正常祖先、仅落后两提交，正常快进推送产品 f774eb3 与验收/QA工作包 a67fb89 成功；当时本地/远端均 a67fb895237e0664e302be44dc11024a44e310e6。此最终同步结果随后另存文档提交，最终hash交A登记。A 的 TASKS.md 未提交改动保持原样，未纳入 C/B 明确文件提交；测试报告/临时数据未上传。

## 独立 QA 续派最终交付
- 产品：242b6fcd40638bb30723249b1489f4ef578c009e；明确9文件（server五模块、security-boundary测试、业务专项脚本、package.json与技术说明）。无总台账/用户数据/运行产物。
- 独立QA：/root/harness_qa，未参与实现，已结束；仅写HARNESS-001-QA.md并核对提交树等于独立复验工作区。三P1、一P2及业务证据缺口在本轮范围关闭，具体复现与复验可追溯。
- B最终实测：在242b6fc上完整自动回归29/29通过（含真实PI模拟模型、替身编译/验证，以及真实Edge数量延迟用例）。不重复已有效初版双端构建。
- 业务新证据：test-results/harness-business-report.json（模拟模型真实PI执行、每类一次真实Taro H5、真实Edge）；独立qa-business-report.json（三类真实产物与摘要核对、增强交互断言，无新模型调用/编译）。这些本机产物不上传；可提交脚本明确依赖旧首版有效报告/产物，远端fresh需先准备隔离基线。
- 已实现/已测试/已验收：本轮修复与三类真实H5业务改变；真实模型、微信后续构建/模拟器/真机、安装包仍待验证，不记HARNESS-001整体完成。
- 接续：B仍为实施负责人，由A安排剩余范围与输入条件；读TASKS、本工作包、QA报告及产品提交后接续。开发/QA子代理本轮已结束，不视为后台工作。A台账未提交修改保留，B只提交工作包和QA报告并正常快进同步，最终hash通过消息交A登记。

### 电脑版专项实际验收与立即接续（2026-10-09 13:00 北京时间）
- 已完成：唯一第二包 release-harness-20261009-r2/win-unpacked/Sprout Studio.exe。QA独立真实新exe三次打开，需求查看修正、可用revision2预览/历史版本、普通关闭重开持久化、中断入口且不自动重试均通过。原500ms storage rename触发复验9→9通过；报告qa-desktop-report.json，隔离root qa-desktop-uuERjj。B读报告/源码，并独立 desktop-close.test.mjs 1/1通过（新临时目录依赖链接需获执行权限）；未重复29项或旧三类构建。
- 版本绑定：manifest基线a09f1b9（管理HEAD）/产品基线242b6fc；包内server/index.mjs SHA256 6bc9adbb044149824eacd5879cf4e54b226752fd93040f2174e549ed5ede0b2e、electron/main.cjs 2531997d8923d9350ce29ed0308aa5440875787a16752d13b16ea5d125aa2df2。最终对应源码提交待C登记。输出为解压目录版，未做安装/签名/发布，产物与测试报告不上传。
- 正在执行：C只读收尾发现恢复任务await sourceDigest期间关闭快照后晚注册作业，可能等待任务完成/超时；B派原r2源码先独立提交，再独立最小源码修复+门控复验，不作第三包。r2对该窄竞态尚未包含修复，不能以storage专项通过扩大为全部关闭竞态通过。QA随后独立检查。
- 尚可做：C已实际确认本机Taro4.3.0与D:/微信web开发者工具内wcc.exe/wcsc.exe可用。上述源码提交后，立即接续三类已修改业务revision2到新隔离目录，仅一次每类weapp编译及官方WXML/WXSS校验；20分钟上限，无新模型/H5重编译/账号/下载/历史服务。此时尚未实际开始，不伪称正在运行。
- 外部阻塞：真实商业模型自主需求理解/测试设计/修复需要正常授权输入；微信模拟器/真机运行需要后续环境/身份，不连接旧9420服务。不以缺模型输入阻塞可离线编译分支。
- 下次恢复入口：TASKS、本工作包、HARNESS-001-QA.md，核对git及r2 manifest/QA报告；B负责，C唯一代码写入者，QA独占QA记录，A台账不纳入B/C提交。后续包若需要超出本轮两包上限，由A另定有限资源安排；不暗中重复打包。
- 接续实际状态更新（13:03）：r2对应源码691d41a（8明确文件）已提交；恢复晚注册窄修c88db3e（源码1行、门控测试、说明）已单独提交，C 2/2与QA独立qa-desktop-resume-close-report.json通过：挂起摘要读取→close→释放→HTTP400且Agent未调用、任务数1仍interrupted、close完成。B读取实际报告/提交及检查实现；不把这项源码结果冒充r2包结果。QA已独立核对691d41a与包内10资源归一行尾内容一致；包内raw SHA精确对应manifest，Git LF与Windows CRLF原始SHA有区别。
- C已实际开始三类业务revision2新隔离Weapp编译专项（20分钟上限），QA等完成后独立摘要与产物核查。当前仍在执行，不停在阶段交付；无模型、H5重编译或历史开发者工具连接。

### 包内编译实际失败与有限新轮（2026-10-09）
- 源码Weapp分支：三类业务revision2真实Taro Weapp+本地官方wcc/wcsc 3/3通过，harness-business-weapp-report.json，sourceCommit=c88db3e；QA独立qa-desktop-weapp-report.json 3/3核对源码摘要、page文件与六官方输出SHA。运行源Node24及D:/app依赖，不是包内链，不等于微信交互。
- 实际包内链：13:05:43在新.test-data-package-build-hro8RQ用真实r2 Electron Node22.22、包内builder/Store/deps仅1次H5，约8秒失败，harness-package-build-report.json。log-symbols4.1.0要求chalk^4.1，实际包chalk6导致chalk.blue不是函数。B与QA独立读取host/package声明与路径核对一致：hostchalk4.1.2/包chalk6.0.0，repair此前仅检查存在。r2不能完整创作交付，保留其UI/storage限定通过，不扩大结论。
- A已直接续派下一有限轮：原两包限制已遵守；新轮最多1新包、30分钟。C唯一写入，先在新临时stage轻量复现/修复依赖解析，再新stage/output打包含c88db3e；不手改r2、不下载/模型/费用/旧数据。路径核验防止修改host依赖junction，按host实际依赖位置保留正确嵌套版本，不全局强塞chalk4。
- QA独立新exe资源绑定后用包内工具唯一1次真实H5并实际操作产物；保存立即关闭及恢复窄修相称复验，复用其它有效UI/三类证据。若新轮仍失败，明确未交付，不无限重包，继续源码诊断与恢复记录。
- 已派C/QA，正在依赖定位及轻测准备；待实际新轮开始登记时间。B记录/统一提交，A暂不Git，TASKS不纳入C/B提交；仍不记HARNESS总完成。
- 新轮实际开始13:07:53、截止13:37:53，最多r3一包。C先在新物理.test-data-package-deps-ckv8C1目录用r2 ElectronNode22复现chalk6→chalk.blue异常，修补host解析chalk4.1.2后blue函数/log-symbols运行通过（harness-package-deps-report.json）；未写r2资源或host依赖。B已读实际before/after报告，独立package-deps.test.mjs 2/2通过：错版替换及nested合法版本保留、拒绝out junction实际指向source。C添加实际路径边界校验，递归替换仅新输出内，随后明确源码提交再唯一r3新包；QA负责唯一包内H5编译与实际产物操作，工程不重复编译。

### 本轮最终验收与恢复（2026-10-09 13:18 北京时间）
- 已完成：源码修复691d41a（退出存储/隔离/打包）、c88db3e（恢复晚注册关闭）、8076b85（依赖错版修补及验收入口）。B已核对明确8/3/6文件清单无TASKS/用户数据，并独立关闭存储1/1、依赖结构与实际路径2/2，QA独立恢复门控通过。新轮唯一r3于13:12:36生成，manifest baseCommit=8076b85296c2529dc785a3daf627102c94111534，server/index SHA=dcb44b91129b8287e11b880d288f5d0986ae571e012c12f26b441149496d3c3d；包内10资源rawSHA匹配manifest，Git行尾归一内容对应8076，包含c88修复。
- 已验收产物：D:/app/release-harness-20261009-r3/win-unpacked/Sprout Studio.exe。QA唯一一次真实包内H5编译通过（Electron38.8.6/Node22.22、包内builder/Store/node_modules realpath），报告qa-desktop-newpackage-build-report.json。真实r3exe直接操作此新编译计算页面：3×3=9、负数及非数精确提示“结果：请输入非负数字”、0=0。另复用既有记录H5仅验原500ms storage门，确认rename进入未完成后正常退出，重开9→9通过；qa-desktop-newpackage-ui-report.json passed=true。首次UI严格期望漏前缀属QA脚本错误，first-report保留；仅改临时断言/新UI工作区、复用已编译revision，未重复编译。
- 微信格式已验收：三类业务rev2源码摘要均绑定原真实H5业务改变，源码Node24/Taro编译及官方wcc/wcsc 3/3、QA摘要/页结构/六官方输出hash核查3/3。不是微信模拟器/真机交互，亦不冒充包内Weapp编译。恢复窄修为QA独立源码门控+新包内容绑定，不宣称真实模型任务途中恢复关窗实测。
- 尚可做：本轮必须的离线桌面补验已通过、没有待修复的确认缺陷；进一步真实模型开放需求/自主测试设计与修复、模型执行中真实构建中断、复杂长任务压力可在正常输入就绪后按适度专项验证。正式安装器/签名、微信创作端迁移/发布属于后续范围，不在本轮自行扩大。
- 外部阻塞：真实商业模型需正常授权输入，未提取旧密钥/调用费用；微信模拟器/真机实际运行需后续环境及账号条件，未连接历史9420服务。保留未验证，不记HARNESS-001整体完成。
- 正在执行：工程与QA产品/测试运行已结束，B整理三份最终说明并按明确清单提交/正常同步；此后由A维护总台账。无永久后台执行承诺。依赖、stage、release、临时报告不上传，只源码/可复现入口与说明进入Git。
- 下次恢复入口：TASKS、本工作包、HARNESS-001-QA.md、docs/harness-implementation.md与r3 manifest；现有报告保留在本机test-results，远端fresh需按脚本前提准备新隔离fixture。B继续负责人；模型/微信条件由A汇总，不让用户搬运内部消息。恢复先核对实际Git/产物，不重复已有效编译/测试。

### 用户真实模型二维码流程续派（2026-10-09 13:44 后，北京时间）
- 授权证据：A聊天01a11e93-220d-7ba1-bc51-23007e5621e4直接用户turn01a11f30-d139-7b01-86a2-a50f734ba9fb已由B读取核实。用户已在实际应用配置模型，要求真实end-to-end生成/预览/修改/交付全流程，不再以离线限定证据判总体完成；补充需求“做一个输入文字就能生成二维码的小程序”与625/441数量错误。
- 当前实际服务：只读进程路径/端口确认r3 exe主进程60072，主API127.0.0.1:54526、preview54525；应用bootstrap公开字段model=deepseek-flash/provider=deepseek/hasKey=true，空闲。未读settings/凭据文件、进程内存/命令行或提取/打印/转移APIKey；HTTP应用访问token仅请求中使用，不落盘/输出。禁止停止/重启该已配置服务。
- 原现场：项目123，id a7245741-6cec-42cb-af42-203aa62ea2bd，revision1/readytrue，task failed/error/attempts1/toolCalls14/build1/verifyAttempts5；最后脱敏助手摘要“功能检查未通过：数量不符：实际625；期待441”。只读不覆盖/删除，不把旧可用revision1冒充生成成功；625=25²/441=21²仅合法QR版本变化线索，需查真实模块/选择器/解码。
- 正在执行归属：B定位现场并汇总；C /root/harness_engineer重新接手唯一产品写入资格，目前先只读诊断预算/检查/失败反馈与SDK/QR复用；QA /root/harness_qa独立准备并唯一操作真实模型，通过现有应用接口创建新项目QA真实二维码-20261009，不用原项目。各自记录文件归属不变，A总台账不纳入B/C提交。
- 验收：真实配置模型生成→新应用真实预览→截图像素解码严格等于短中文/长文本输入→连续业务修改后再解码并保留旧版→空输入反馈→导出ZIP源码/微信结构与版本摘要对应；失败反馈修复同链有限复验。text/count与编译不是二维码功能验收；不简单把441改625或放宽为有图案。
- 复用：原PI0.99.1会话/customTools/预算保留，Taro保留；QA已装jsQR1.4 Apache2与PNG/Playwright截图直接复用，官方https://github.com/cozmo/jsQR；若需生成器优先官方qrcode-generator MIT候选https://github.com/kazuhikoarase/qrcode-generator，UTF8原生模块能力待实际核对，不先自造随机网格/引新框架。
- 资源/边界：现有40工具/3编译/3检查/10分钟每任务及SDK重试上限不取消；先一次新项目生成，失败先诊断再有限修复，不无限模型调用。用户授权使用已有配置，不买服务/新订阅/新增账号/发布/微信迁移；不转移模型Key到新服务。若修复需新服务/重输模型，只具体上报并继续其它诊断。
- 恢复：先TASKS/本工作包/QA报告与实际应用接口空闲状态。B继续负责人；模型调用由QA唯一执行、代码写入C唯一，保护用户原现场；尚未开始的调用不称已运行。

### 14:00恢复实际状态与范围内接续（2026-10-09，北京时间）
- A自动跟进发现B中断/notLoaded，非用户停止。B核对自身D:/app git正常、读写可用，无仓库损坏证据。旧子代理live已空，实际新建C /root/harness_engineer_resume与独立QA /root/harness_qa_resume；C仍唯一代码writer，不同时另派。
- 原QA真实run已结束失败，不再后台运行：project1616710e-213e-441e-9d91-f6f1da2a1a37/task0d850301... failed，20工具/build1/verifyAttempts8，最后fill(.text-input)命中taro-input-core非editable。rev仍1初版，verification null；失败draft被清理，API仅初版源码，不能拿初版当模型生成或扫码通过。旧SSE记录running是中断日志，QA另存恢复状态，不篡改旧失败。
- C接续已有budget改动，实际检查最多3、拒绝另计，用PI原生非阻塞abort并持久budget reason；旧第4/5等调用被拒但计数累加、SDK继续工具错误循环、最后只报旧count/fill错误已定位。Taro host仅唯一内部editable填写，多输入明确拒绝；QR受限截图1–1024像素、PNG/jsQR像素严格等值，不能用gridcount替代，既有CSP/脱敏/次数预算保留。
- 独立QA新定向5/5通过：真实已编译Taro Input host操作、歧义拒绝、有效QR精确payload、错payload拒绝、伪网格拒绝；PI预算独立2/2第三次可成功/第四请求不执行并明确预算原因/无新版。历史PNG仅工具fixture，不证明当前真实模型QR已生成。本轮不重复旧33项/三类构建。
- 继续实质工作：C获准最小只读模板QR生成资源，原样复用已装qrcode-terminal内Arase MIT纯算法+标准UTF8适配（不Node Buffer）、固定受控relative入口；模型不得编辑vendor/开放Node。核对vendor纳入不可变源码摘要/版本回放/ZIP、legacy兼容；一次新隔离H5+Weapp与中文长文/纠错级别截图解码相称验证。不开新框架、不自造QR算法、不下载新库。
- 当前app54526仍hasKey=true，但仍r3旧实现；禁止改其资源/重启/读取或转移Key。新版本模块需正常加载后才能真实验收，模型正常UI配置条件将在可审查新包到位后交A协调；这不是沿用“用户未配模型”为停止理由，当前源码修复/生成支持/独立QA继续。QA唯一后续模型操作者，现不重复run。
- 14:09补验：C唯一新隔离QR模板H5+Weapp及官方WXML/WXSS实际编译通过，但首次UI在Taro host attached/internal input尚未创建时误判0。旧已编译fixture通过不能覆盖此hydration竞态，独立QA已指出；C限定4秒等待内部editable、仍拒多输入，并复用同一次产物，不重编译。长文本需>=100字且实际值未截断，当前原fixture约90字不足，等级仅纯适配像素或后续真实模型修改，不能扩大Taro等级结论。
- 独立资源实测4/4：核心10文件原样/许可来源、12只读resource模型写拒/唯一adapter进口、三版snapshot/restored完整源码一致且历史保留、实际API导出ZIP逐源码bytes匹配含MIT许可且无settings/sessions。隔离假编译夹具只证明资源/导出，不替代真实编译/模型；legacy无vendor首次补模板边界明确。仍未真实模型新版本验收，不记录总完成。
- 14:13实际截图未通过已复现：C作者fixture混inline真实px与Taro转换CSS设计单位，容器145px但module/quietzone被放大裁切，二维码图片无法解码。QA独立DOM/截图同证，不宣称编码模块错或功能通过。B批准唯一额外仅H5针对作者fixture统一尺寸来源，不重Weapp、保留首失败，不调decoder门槛；短中文/长>=100字实际值无截断/empty由QA重验。真实模型新版本仍待运行，工具变更不冒充model已成功。

### 新版本有限打包接续（2026-10-09，北京时间）
- 产品修复提交1cbf5ce794750a95feb4aa704ef1a61455aea991，明确24文件，不含A台账/B/QA记录或用户数据。vendor核心10文件保留上游原样（包括原有空白）；其余改动diffcheck通过。B独立相关回归7/7：写入边界、源码版本恢复、M3通过/陈旧/失败绑定、断线继续/停止恢复；不重复全量或三类编译。
- QA同一修正手写Taro H5产物在375×720和1280视口短中文/107字符实际未截断长文/空反馈3/3均通过；纯adapter四等级4/4、资源/版本/导出4/4。作者120/155字失败和首次裁切证据保留；当前不是模型全流程成功，也不宣称任意长文/1000 maxlength能力已验收。
- C /root/harness_engineer_resume 已接手唯一r4包，限定一次新包/30分钟，脚本25分钟界限；固定新stage .package-staging-harness-20261009-r4、新output release-harness-20261009-r4，不覆盖旧r3。manifest递归固定electron/server/templates/agent-skills/package.json实际包与stage逐文件hash，并记录实际jsqr/pngjs版本；不扫描用户配置/auth/data。
- QA /root/harness_qa_resume 接手新包离线资源和解码依赖加载/复用已编译fixture检查，再启动隔离r4 exe与新工作区/新端口。旧r3服务60072保持运行，不读取/转移Key或覆盖原项目。具体新包先可审查，再由A引导用户在新窗口正常接口设置；QA唯一新真实模型操作者，尚未再次调用模型。
- 下一步：实际包交接→独立离线检查→安全新窗口就绪→正常配置后真实模型自然需求生成、手机短长文本像素解码、业务修改、旧版保留、导出摘要检查。阶段通过/提交不记总完成；B继续负责人，A维护唯一总台账。
- B独立读取手机报告补充边界：107字loc截图宽385，超过375视口；区域像素可解码不等于整图在手机屏幕内。已通知QA补范围说明，未来真实模型必须另查二维码boundingBox完全在375×720可见范围及viewport截图，不能仅locator截图算手机布局验收。不重复旧夹具编译。
- 正常git push origin main被自动审批拒绝，理由为不能确认具体GitHub目的地/完整源码上传授权。B未绕过、未再push；A核对原用户指定仓库原文但尚无更明确本次上传授权，将具体同步审批与新窗口配置合并由A协调。当前1cbf5ce仅本地提交，包与独立QA继续，不受此阻塞影响。
- r4于14:24开始，主体打包和1113项依赖修补完成后manifest拒绝。B/C独立确认package.json唯一JSON差异是electron-builder删除scripts，其余生产字段/依赖完全相同。最小脚本修复55c5087e084ef064012b69f72236783124474e20允许仅标准删除scripts的深相等，并可finalize-only已有物理目录且不覆盖manifest；未重新Vite/builder/repair，不修改包资源。r4实际源码基线保留1cbf5ce，finalizer另55c5087，两个不能混称同一编译源码。C正在唯一已有产物生成清单，后交独立QA。
- r4 manifest实际生成完成，B独立逐38项包内rawHash核对全部匹配；baseCommit=1cbf5ce794750a95feb4aa704ef1a61455aea991，finalizerSourceCommit=55c5087e084ef064012b69f72236783124474e20，decoderVersions jsqr1.4.0/pngjs3.4.0。exe D:/app/release-harness-20261009-r4/win-unpacked/Sprout Studio.exe，需整个win-unpacked。尚不以文件存在判可创作交付，QA实际包内加载及隔离新exe验收已接手，C执行结束不视为运行中。
- QA实际新包独立离线与真实exe启动passed，report test-results/qa-r4-offline-report.json及test-results/qa-r4-launch-report.json；38rawhash/Git归一1cb对应、生产package只标准去build/devDependencies/scripts、12vendor完整，包Electron38.8.6/Node22.22实际导入verify与375旧手写H5短文/107长文/空反馈通过，只decoder兼容不算模型/整图手机可见。
- 新窗口已就绪：title“小芽 · r4 真实验收（新模型配置窗口）”，PID14572，API http://127.0.0.1:58362 / preview58361，隔离D:/app/test-results/qa-r4-wazkY0/{user-data,workspace}，明确非模型fixture90bad993…，bootstrap hasKey=false/initialError空。安全空设置截图qa-r4-settings-empty.png由B实看无Key；输入后不截密码或读值。旧r3未动。
- 当前模型流程没有运行，等待用户在该新窗口正常配置并保存接口（不聊天发Key）；A已收到具体入口/批准Git上传问题。QA维护连接session34143保留新exe，不是模型作业或永久后台承诺。输入就绪由A通知B，B复用QA唯一操作者继续自然需求新项目→120纯中文实际值→375×720 viewport完整图像解码→业务修改→旧版保留→ZIP，不以非模型fixture交付。
- 恢复入口：本工作包/QA记录/r4 manifest；先核对新PID和bootstrap hasKey公开布尔，若新窗口已退出需新正常配置，不提取旧Key。B继续唯一负责人；模型未就绪不反复测试或扩大范围。Git上传阻塞仍由A取得具体授权，本地产品1cbf5ce与清单脚本55c5087均保留。
