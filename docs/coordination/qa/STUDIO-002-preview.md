# STUDIO-002 包 1 独立 QA 准备记录

2026-10-09（北京时间）。负责人：QA Lead 下 `/root/qa_preview`，非实现者；继续负责人为 QA Lead。最新状态：冻结 c288bd2 的本包定向独立验证通过，整体集成/Electron/真实模型扫码待验证。只读对象 `D:/app/.worktrees/studio-002-preview`；本报告及指定 `D:/app/test-results/studio-002-qa-preview-*` 是本代理写入范围。下方准备阶段记录保留，不当作最新执行状态。

## 授权与版本

已读 AGENTS.md、HANDBOOK.md、TASKS.md 的 STUDIO-002、总工作包 STUDIO-002.md。授权来自用户在 A 聊天批准内部协作及每包独立 QA，QA Lead 派发本包。禁止产品/测试修改、旧配置/vault/Key 读取迁移、旧服务重启、真实模型请求。构建统一由 QA Lead 协调，本轮没有运行构建、测试或新服务，没有访问用户项目。

观察 HEAD 为 `ae0d8af940c3aa5392e2ef2df70c28818e28539a`。未提交改动：server/index.mjs、server/store.mjs、src/main.jsx、src/style.css、tests/core.test.mjs，共 54 增/17 删；期间新增 tests/studio-preview.test.mjs 及四个 .test-preview-* 临时目录，说明实现者仍在执行。未读测试数据，不把移动中的工作树作固定验收版本。后续必须重取冻结提交、diff 和资源摘要。

## 静态观察与待确认风险

- index.mjs:74–115 增加后台 preparations、bootstrap 先返回项目、制作先取消并等待准备。必须用明确门控验证准备最后一步提交与 run/close 的交错，不能仅用快替身 build 验证。
- index.mjs:85–96 以 operations 和重读元信息保护构建期间编辑。需验证需求、运行错误等元信息不丢；制作后旧准备不再提交；初始准备失败仅保留诚实 failed/revision0。
- main.jsx:37 轮询将初始化状态及 revision 纳入更新；需实测切项目时旧请求不回写当前项目，加载/失败/成功状态不依赖刷新才出现。
- main.jsx:100–103、style.css 最后一行规定 iframe 宽度为选择值、高 720，外壳 784 并按 stage 缩放。需浏览器确认实际内容 viewport、外壳边界、缩放后输入点击坐标及窗口缩小时是否截断；CSS 文本不足以证明。
- main.jsx:82 已加 `resumable!==false` 限制。需 UI 用 failed/stopped/interrupted 各自 true/false 状态验按钮，并与包 3 服务门控集成交叉检查。
- 现有 desktop-close.test.mjs 的恢复关闭测试在 POST create 后直接取 project.revision，再对 revisions/该版本/src 放门控；异步新建可能仍是 revision0，原测试可能等待不到门控。此为测试兼容风险，未执行，不能称产品缺陷或擅自改预期。
- 未确认任何实际产品缺陷；上述风险均待冻结版本原步骤验证。

## 独立覆盖与步骤

| ID | 独立步骤及应有结果 | 证据/依赖 | 当前状态 |
| --- | --- | --- | --- |
| P1-01 | 冷启动空隔离 root，卡住真实准备入口；bootstrap 返回首项目，UI 可聚焦输入；正常新建计时从点击到可输入并发送。返回时 ready=false，不渲染假 iframe。 | QA Lead 分配实际 UI 资源及独立 root；记录首屏/输入毫秒与 API 时间；准备门控与最终真实构建耗时区分。 | 待验证 |
| P1-02 | 放行准备，UI 自动显示真实 iframe；失败 build 后显示失败原因，不显示“可交互”；失败后仍可输入制作。 | 可控编译替身用于门控；一份集中真实编译产物用于 iframe 真实性。 | 待验证 |
| P1-03 | 卡住准备，立即制作；观察 abort，延迟结束准备再让制作提交。仅制作版成为 revision1，源码/需求不被旧初始版覆盖。 | 隔离 PI 模拟、本地占位 Key；保存前后摘要与事件顺序。 | 待验证 |
| P1-04 | 准备期间修改需求，放行完成；对照 memory。连续新建 A/B 并切回，在延迟轮询响应后仍保持当前项目。 | 独立 API 门控及实际浏览器；逐项目 ID、摘要和 UI 标题。 | 待验证 |
| P1-05 | 准备进行到复制/编译/发布前各阶段关闭；停止发布，重开只重试同项目，不重复建项。关闭之后新请求应拒绝，退出不悬挂。 | 已有关闭测试作回归；新增交错步骤独立执行，限时并清理本轮进程。 | 待验证 |
| P1-06 | 375 模式，量 iframe 内 innerWidth=375、innerHeight=720；320/414 模式宽正确。不同桌面窗口高度下测 transform 与四边，实际输入、点击底部控件、刷新数据。 | 实际浏览器截图、DOM 几何、frame 内测量；不能只断言 style。 | 待验证 |
| P1-07 | 同一真实生成 QR 产物在 375×720 整 viewport 截图，短中文、长中文逐字解码，空输入反馈；缩小桌面窗口后重新操作。 | 集成后由 QA Lead 唯一真实模型操作者交付冻结产物，本代理不发模型请求、不重复编译。 | 待验证，集成依赖 |
| P1-08 | failed/stopped/interrupted 且 resumable=false 不出现继续入口；true 可见且调用原任务。运行时不能二次发送，停止和关闭不被初始化干扰。 | 包 3 冻结任务状态契约、浏览器与模拟门控。 | 待验证 |

“几秒”尚无更精确数字；准备验证先用 2 秒观察门控响应，实际 UI 记录原始毫秒由 QA Lead/B 判定，不擅自把假编译速度当产品指标。

## 可复用证据及限制

- tests/core.test.mjs：API 鉴权、异步 create 最终 ready、导出基础可复用；fakeBuild 不能证明真实构建、首屏可输入或手机内容尺寸。
- tests/studio-preview.test.mjs：新写的四项门控覆盖返回、抢占、关闭恢复、失败，属于实现者测试。本轮只读，不重复宣布独立通过。其 artifact 是静态 HTML，即便用语为 actual artifact，也不是 Taro 真实编译证据。
- tests/desktop-close.test.mjs 与 tests/harness.test.mjs：复用退出保存、恢复窗口、并发制作/显式停止/重启状态回归；新建异步带来的 fixture 时序需实现者先修正，再独立核对原行为。
- scripts/harness-ui-check.mjs：可借鉴真实浏览器 UI 定位与停止/恢复路径；当前注入任务 runner 和 fixture compiler，且 production:true 依赖 dist，不能代表包 1 新 JSX/CSS 直到 QA Lead 确认资源对应冻结源。
- 旧 r5/HARNESS 结论不覆盖本包；QR 解码属于集成证据，不可改格子期待值掩盖。

## 接续条件与恢复入口

QA Lead 收到实现者冻结提交及交付后续派本代理。最小输入：冻结 SHA/分支、开发者自测原始结果、可用浏览器入口和该入口的源码资源对应关系、独立数据 root/端口、统一构建是否已批准及产物位置。先核版本，再执行 P1-01–06/P1-08；P1-07 接收集成实际产物。失败保留原步骤、版本、截图/事件，不改产品或预期；报 QA Lead 交原实现者修复。没有当前实际运行的 QA 或可靠唤醒承诺。

## 冻结版本独立验证结果

QA Lead 续派后实核 HEAD `c288bd2a3ce0570bc0fe9fe8e88405fdb490077e`，tracked clean，末尾再次核对状态仍仅四个作者旧 `.test-preview-*` untracked，`git diff --check` 无输出。已读作者 docs/studio-preview-implementation.md 与真实 UI 报告，不重复 Taro 构建。无用户配置/vault/Key 读取，无旧服务操作，无真实模型请求。

### 门控 11/11 通过

在冻结源码执行 `node --test --test-force-exit --test-timeout=30000 tests/studio-preview.test.mjs tests/desktop-close.test.mjs`，10/10 通过，原始日志 `D:/app/test-results/studio-002-qa-preview-gates-retry.txt`。涵盖立即返回、初始化取消且迟到结果不覆盖制作、关闭等待准备退出、失败不可用、创建中关闭、发布前关闭、失败与 memory 保存交错不丢需求、未 ready 的首轮 interrupted task 重启不自动发布 blank 破坏 baseRevision，以及已有退出保存和恢复源码读取关闭门控。

另执行 `--test-name-pattern='M2 HTTP disconnect' tests/harness.test.mjs`，1/1 通过，日志 `D:/app/test-results/studio-002-qa-preview-stop.txt`：断线后任务继续、显式停止持久化、恢复检查源码、关闭转 interrupted。使用冻结开发测试中的独立占位与模拟 agent，不使用商业模型。此为独立执行既有测试，未声称独立设计全部门控。

首次沙箱执行 10/10 均在 Store.init 的依赖 symlink 报 EPERM，业务尚未进入；原日志 `studio-002-qa-preview-gates.txt` 保留。按正常 require_escalated 审批执行后通过，不属于产品缺陷。

### 独立实际浏览器检查通过

独立脚本 `D:/app/test-results/studio-002-qa-preview-ui.mjs`，结果 `studio-002-qa-preview-ui-report.json`；只从作者 UI 测试 root 复制 ready 项目 `841d6567-ef5c-4639-be33-53520580e090` 到全新 QA root，不复制 settings/runtime 或 root 配置；启动随机端口服务，生产 UI 复用本工作树已有 Vite dist。复用作者 Taro 实编译的空白 revision1，本轮 Taro 构建为 0。数据 root 和 UI 资源 SHA256 保存在报告；JS `index-0bec8598.js` 摘要 `8e55b4b521e30b24b5431786dad4578e553c11473ac415fe5719458174f922ce`，CSS `index-4178fc67.css` 摘要 `4178fc67a20093a8426b935a30da7212f2ff4168761ca689a62367366270d057`。源码对应依赖作者同次冻结交付中的 Vite build 记录，独立锁定实际资源摘要；没有重新构建证明。

- 实际 Edge 首输入 215ms；通过新建弹窗新建项目，后台准备门控未完成时 184ms 可输入，无假 iframe。首输入计时包含 page.goto 至 fill；新建计时包含点击创建至关闭弹窗及 fill。该轮初始项目已 ready，冷启动 seed 等待首输入证据复用作者195ms，独立门控证明 bootstrap 不等待；二者不混称同一次冷启动实测。
- 注入真实后台失败后，UI 无需刷新自动显示预览失败，仍可输入且 iframe 不出现。
- 实际跨域 frame 内测量标准模式始终 innerWidth=375、innerHeight=720；320/414 模式宽度正确。窗口 1280×900、960×700、1600×1000 的 iframe 均完整落在 stage 内，缩放分别为 0.8125、0.55739794921875、0.9349488932291666。实际点击已编译空白模板文字，并在 Studio 输入区填写并核对文本。
- 截图 `studio-002-qa-preview-1280.png`、`-960.png`、`-1600.png`；已人工查看960截图，手机完整可见、工作台输入可见。空白模板无输入/业务按钮，不能把其文字点击称为生成应用业务操作通过。
- 独立隔离任务 fixture 分别置 interrupted/failed/stopped：resumable=false 无继续按钮、true 显示继续按钮，三种状态均通过。未执行真实模型恢复。

UI 首次失败 `studio-002-qa-preview-ui-first-attempt.json`：184ms 前的新建 UI 已可用，但脚本立即断言后台已进入 build 不成立（记录当次新建159ms）；补有界等待后台入口，不改产品或行为预期。第二次失败 `studio-002-qa-preview-ui-second-attempt.json`：页面两个“预览准备失败”文本导致 Playwright strict selector 不唯一；限定 `.preview-loading` 后通过。两次失败及各次 root 保留，不覆盖失败历史。最终报告 closed=true，浏览器和本轮服务均已关闭。

### 结论与剩余边界

本包冻结版本的异步状态/取消/关闭/需求保留、首轮恢复基线、实际浏览器尺寸和 resumable 按钮独立检查通过；未发现确认产品缺陷。早期 desktop-close revision0 测试兼容风险已由开发者以显式 waitProjectReady 修正，原功能预期不变，本轮原关闭门控已独立通过。

仍需 QA Lead/B 集成：正常 Electron 双击及最小960×700、新稳定加密配置、新项目真实模型制作与连续业务修改，以及实际 Studio 缩放 iframe 的短中文/120中文二维码截图像素解码。375×720 DOM 尺寸和空白模板点击不能推出缩放二维码可扫。跨项目延迟轮询与更复杂多建项竞态本轮未额外设计实测，不扩大通过结论。继续负责人 QA Lead；无本代理运行中的服务或待机承诺。

## 用户轨迹持久回归（集成源码 ccae82b）

按用户经 A/B 新增直接要求，新增仓库测试 `tests/qa/preview-journey.test.mjs`，没有修改产品、既有测试或 package 入口。命令：`node --test --test-timeout=60000 tests/qa/preview-journey.test.mjs`。显式依赖先已有 `npm run build` 产生的 Vite dist；产物缺失给出 skip 和构建命令，测试不自行构建。拒绝 STUDIO_URL/STUDIO_ROOT/SPROUT_TEST_PACKAGE 未知附着，独立 OS 临时 root、随机端口、自有 Edge，finally 关闭并只删除验证位于 OS temp 下的新建专属目录。

映射：P1-01 冷启动 bootstrap/新建门控尚未完成即可输入；P1-02 不就绪无 iframe，失败自动轮询且仍能点击制作（内存占位设置+注入模拟 agent）；P1-06 375×720 逻辑内容、960×700/1280×900 缩放边界，真实填预览输入、点底部按钮、核验输出并填 Studio 输入；P1-08 interrupted/failed/stopped 的 resumable true/false 按钮。动态 HTML 是本测试自造夹具，不是 Taro 或真实模型产物；不引用旧 test-results/项目 ID/配置。旧门控及扫码/Electron 边界保持前文结论。

首次执行日志 `test-results/studio-002-qa-preview-persistent-regression.txt` 保留失败：主树实际 dist 仍引用旧 `index-b395ef40.js`（无 initialization/phone-stage/resumable），放行初始化后 UI 不轮询、30秒 iframe 超时。不是新测试通过记录。QA Lead/B 随后明确授权把最终 ccae82b stage/dist 的三文件复制到 root/dist 并逐项核对相同；本代理没有自行构建或拷贝产物。

修正依赖后仅复验新增套件一次，日志 `test-results/studio-002-qa-preview-persistent-regression-retry.txt`：2/2 通过（顶层轨迹和失败后制作子测试），集成 HEAD `ccae82b131abe30a7b9cc682c1b18712830d8dce`，首输入225ms、新建277ms。当前实际资源 SHA256：dist/index.html `bd05849d0e8fe660ad464b0bdd9459fa51ac4b8d27db2d3b8209a5246ad0710c`；index-4f796438.js `09fe9e0ff905cda829edc9e138a4f5c9c995af8a5d2887dfcb99530d9432a0a5`；index-4178fc67.css `4178fc67a20093a8426b935a30da7212f2ff4168761ca689a62367366270d057`。source/资源/helper摘要均输出原日志，资源与最终包 stage 的对应沿用 QA Lead/B 的逐项核对授权证据。

按 B 要求测试实际 import `scripts/studio-qa-ui.mjs` 的 approvedJourney，调用 `previewGeometry()` 两次，匹配本轮 iframe 选择器并核对逻辑尺寸、物理边框、缩放、viewport 和版本；960×700 为0.55739794921875、1280×900为0.8125。helper摘要 `d8bc5a569f1ad7765bfdbb9f2bf8f11dadf34606f4b38d7c2d81984ff1bf62ef`。只证明该 helper 的 previewGeometry 实际可运行，其他 observe/newProject/submitNaturalRequirement/exerciseQr/exportFromUi 未经本测试调用，不宣称全部通过。

本轮 Taro构建0、真实模型请求0、原生窗口操作0；执行结束测试文件冻结并归还主树唯一写入窗口。QA Lead/工程 Lead 负责统一接入入口和后续文档，最终真实扫码与正常 Electron 路径仍待集成验收。
