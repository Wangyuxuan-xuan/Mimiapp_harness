# 制作期间切换项目与预览状态

- 日期：2026-10-09；状态：源码与隔离业务轨迹已验收，r3包已生成并核资源；正常原生启动/安全启用待现场，性能分段待测。
- 授权：用户在B聊天直接报告制作羽毛球计分器时无法切换会话/新建，预览准备中断文案矛盾及准备慢；AGENTS持续改进授权。A已确认导航和状态为当前首优先，无需再次等待批准。
- B唯一负责人：小芽项目负责人，01a11ebf-e71e-71c0-97a1-86bcff83f324。A仅维护TASKS。
- 唯一产品writer：B子代理 /root/studio_preview；工作树 D:/app/.worktrees/studio-002-session-navigation；分支 codex/studio-002-session-navigation；基线1e86ca1。独立QA待冻结后由QA Lead安排，不能将开发测试称独立验收。
- 现场保护：用户正常r2/API50276的hi项目正在制作；本包不附着、点击、停止、重启该服务，不新增商业调用，不修改用户数据和r2包。原二维码B亲验已生成负责人亲验并整窗解码通过；后续刷新/回填/清理因用户接管窗口待安全空闲时继续。

## 已定位事实与最小范围

src/main.jsx全局busy禁用新建和项目按钮；updateProject在SSE done/error/finally中总setActive，故不能仅解除禁用。发送前await publicSettings期间尚未busy，可能将旧需求追加至新active。代码文件请求与runtime回执也需归属核对。

服务jobs按projectId管理。导航不等于执行互斥；本包不新增并发策略或任务额度。所有异步结果只更新对应项目缓存，显式切换/新建控制当前选择；发送锁、流、状态、错误、控制器和草稿按项目保存。切换不停止后台任务，停止绑定所选id，设置保留全局安全边界。

制作开始会cancelPreparation；右侧仅显示initialization.interrupted，忽略正在运行的task，因此与左编译矛盾。预览应结合任务和ready显示首版制作、旧版本可用且后台修改、初始化准备、无可用版本及恢复入口；不假改ready和历史状态。

## 验证与交付

- 先核官方React文档/GitHub复用能力，继续现有React/客户端/测试，不新增依赖。
- 隔离双项目轨迹：preflight时切换、A迟到text/done/error/finally不抢B，B草稿保存、新建C可输入、切回A查看进度、stop归属、重复发送门控、旧版本交互保持。
- 复用现有preview用户轨迹及初始化/断线/停止证据，按影响增量执行，独立QA绑定冻结SHA。
- 性能目前没有分段数据，不能断言慢在何处。先区分创建/初始构建、取消等待、制作、H5/Weapp、官方检查、版本保存和iframe加载；复用已有onLog及轻量计时，不盲目重编译或改缓存。
- writer冻结提交与干净状态→工程只读复审→独立QA→B集成验收。正常用户包更新另行统一安排，不能把源码修复当成当前r2已修。
- 恢复入口：本工作包、TASKS、上述工作树实际HEAD和代理结果；继续负责人B。原input assertion在另一工作树cb578873冻结并已交input_assert_qa独立复验，两包禁止混写。

## 活动实现复审与独立准备

工程Lead 01a11fb4-ff38-7723-8711-298ab2608c9c已只读核初改，B集中交唯一writer修三项：停止请求/响应跨轮归属（同项目stop未结算时不得启动下一轮并防旧状态回写）；run被接受前HTTP/网络失败不能丢草稿；无task同revision时迟到初始GET不能使failed/interrupted倒退preparing。尚无冻结或通过结论。

独立QA Lead 01a11fb5-2b8d-75a2-bdd3-8aaf5ca47938实际复用qa_preview准备，仅写新tests/qa/session-navigation-{fixture,journey.test}.mjs与自有报告，不改产品、不写input测试。待B精确SHA及对应dist三项摘要放行才动态运行；优先复用writer一次Vite产物，必要时已授权唯一一次补建，不做Taro或商业调用。独立QA已同步上述三项迟到负例。

方案复用：React官方useEffect清理/ignore模式（https://react.dev/reference/react/useEffect）及项目键隔离；GitHub TanStack/query（https://github.com/TanStack/query，MIT）能力成熟，但本次现有客户端足用，不新增依赖。抽现有React hook及纯预览状态helper，客户端只增可选onStarted接收通知；服务已有先jobs/createTask再flushHeaders，允许正确处理发送启动阶段停止，不改协议/执行策略。恢复实际createTask会新建UUID并resumedFrom旧id，不以同id恢复假设扩大修改。

慢的调查边界：当前buildProject默认targets=['h5','weapp']串行，preview初始化等待双端/官方验证和提交；能输入与真实预览就绪需区分。没有分段实测，不断言瓶颈，不擅自拆交付门。全项目轮询携带历史可能增加流量亦需测量，不能冒称已优化。

## 冻结与独立验收结果

候选25d66c1cd2ecfa96b31b18d618b0e791e512b5b7、工作树干净。开发18项通过（实际Edge父+8业务子项9，状态/client/既有CLI9），新建可输入352ms仅替身环境。首开发失败因新建helper未等待选中C，原TAP失败保留；其首汇总误passed不能作有效证据。

工程Lead精确只读最后审查通过，三项边界与空entry停止状态guard已修。B实际读最终hook/main/client、核服务headers/任务归属和恢复新UUID合同，独立逐项核dist index/JS/CSS摘要与精确sourceCommit一致。没有重复原繁重构建或商业验收。

独立QA实际10业务轨迹通过：首完整运行9有效通过、1因测试冻结时钟导致toast永不消失挡住发送而失败；保留原失败，改用真实Enter后只重测该1组5095ms通过（父+子pass2/skip9），其余9不重跑。不得写成完整套件单次全绿。覆盖真实JSON消费后的迟到files/runtime/poll、双项目/新建/草稿、停止请求和响应分别晚到、HTTP拒绝/网络失败保原草稿及后续编辑、无task同revision失败与真实取消初始化终态、首版未ready与旧版可交互。使用隔离Edge、注入Agent、动态HTML，非商业模型/Taro或正常Electron窗口。

下一步B统一集成导航与已验收input源码、补检查弹窗value/qr两项中文标签这一低风险集成项，保存回归/报告，再给工程Lead最终main SHA只打包一次独立r3。旧r2/current/hi继续保护，新包资源核验后再安排安全启用；不得宣称当前r2已修。性能分段仍待测，原二维码B亲验后续刷新/回填/清理尚待安全空闲现场。

## r3交付与恢复

源码集成a48da30，QA/复审与低风险标签集成58458dcc29f82a8423e4aa64e6e1d3da298b7d54已push。B核7文件Git blob与25d66冻结一致，main.jsx只增value/qr两项中文标签；个别checkout换行LF/CRLF使文件原始摘要不同，规范化换行后源内容核对一致，不冒称7项全字节相同。B实际主树preview-state/client4/4通过。独立QA报告仅去除原TAP一行尾空格供Git格式检查，原错误/结论不变。

工程Lead复用唯一/root/studio2_packaging一次打包，脚本内部一次Vite，独立输出 `D:/app/release-harness-20261009-studio2-r3/win-unpacked/Sprout Studio.exe`，须保留整个目录。正常r2/current/hi/配置/历史服务未动。B已独立运行ignored核查脚本：HEAD/base/finalizer均58458dcc；main文件与stage、stage与包内43固定资源、全部3dist字节一致，生产package删除build/devDependencies/scripts后的结构逐项一致；没有仅凭相同Electron壳摘要断言产品版本。

证据 `test-results/studio-002-b-r3-package-manifest.json` passed=true；构建manifest SHA256 `aafc694873c9bd6b507b3bc660012ef366afea9c2660484fa54287f22eb8ba34`。包内CLI help实际exit0，只加载客户端，不连接服务或启动原生窗口，不称正常native启动通过。工程已实际exit0、独立固定/全部dist/生产package核通过，依赖修复1113、Vite1583模块6.48秒；唯一pack代理completed，HEAD锁已解除。未再构建或改产品。

继续负责人B，下一步在安全空闲现场协调正常r3入口/公开配置复用及原二维码亲验余项；不得停止用户正在制作的任务来做验收。用户可继续当前窗口，运行包仍旧r2，不能说其已升级。真实准备和首次制作分段耗时仍待测，后续按本包测量点安排，当前没有优化速度的完成结论。

最新安全接续：B实际正常审批只读已知r2 readSession（拒绝启动/回退），13:11UTC公开任务元数据runningCount=0，用户hi项目070372d0-3528-4897-9d67-234664e77469已自然completed/revision4/ready=true。默认sandbox无法取得session的失败保留，不读取Key。B已给QA Lead条件升级许可：先新鲜UI/任务核无未发草稿/未保存modal/新running，才正常退出准确r2并开r3，核公开配置和项目版本状态保全；若用户又在输入/制作则暂停不强关。唯一native操作者QA Lead，结束交B完成原二维码亲验余项；尚无正常r3启动结论。

## 最新实际交付与用户停止桌面操作

以上“仍运行r2/尚无r3启动结论”为升级前记录。独立QA已完成正常安全升级：r3实际PID16940、窗口77992166、API59589、预览59588，准确exe路径；复用公开hasKey/encrypted/available/persisted，无再次输入或读取Key。6项目版本、任务状态、公开摘要和预览存储摘要前后一致，hi revision4/ready及比分1:7保留。报告 `docs/coordination/qa/STUDIO-002-r3-start.md`，SHA256 a63669de296ec98b251f7391cd1575eaf27b9ee78568c023ed67c0e4688c2efe。B与工程包资源核验另见此前证据，不重复构建。

B随后在QR revision2界面刷新，看到先前自己生成的“负责人亲验”历史保留；只点击该历史行，截图输入显示回填该文字，未fill/type/set。下一次正式状态取证时工具返回用户物理Escape停止，因此未完成最终亲验记录、清理或恢复hi视图；原生操作全部停止，不自动重试。已有独立QA完整回填证据仍有效，B最终余项如实留待。

另观察r3侧栏顺序与r2相反，项目数据未变；初步代码线索为loadProjects逐条调用前插updateProject，尚未独立复现/修复，作为低优先级候选报A，不为此重包。预览慢仍需分段测量，不能把替身新建352ms当真实编译性能。

用户进一步明确：批量生成、用户轨迹优先CLI和隔离自动回归，Computer Use仅少量最终UI检查。执行规则已存手册，B核现有runner尚未包含continuous/navigation/input新组，交QA Lead只读核查，暂不重复测试或商业调用。继续负责人B，A维护总状态。
