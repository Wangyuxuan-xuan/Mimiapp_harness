# STUDIO-002 输入回填验收补强准备

维护人：B 小芽项目负责人，2026-10-09。准备已验收；A已明确批准最小范围实施，当前开发与独立QA准备中。当前状态以下述最新记录为准。

## 授权、归属与边界

来源：用户 AGENTS 内部协作授权、已授权的连续制作与真实功能验收目标；A 总办秘书在本轮明确要求围绕历史点击后主动 fill 掩盖回填缺口，组织工程/QA核现有能力和官方/GitHub复用，形成最小方案、原触发负例、回归要求及优先级。

- B：01a11ebf-e71e-71c0-97a1-86bcff83f324；独占本汇总。
- 工程：01a11fb4-ff38-7723-8711-298ab2608c9c；已实际续派只读评审，独占 `STUDIO-002-INPUT-ASSERT-ENGINEERING.md`。
- 独立QA：子代理 `/root/input_assert_qa`；已实际接手，独占 `docs/coordination/qa/STUDIO-002-input-assert-plan.md` 及 `test-results/studio-002-input-assert-qa/` 微型隔离复现。
- 工作目录 `D:/app`，主线基线 `f6b147e`。产品与现有QA源码零写入，不改Git基线、不建产品实现分支。
- 不操作桌面、原待审批QA、current/profile、用户项目、Key、旧服务；不新增真实模型调用、Taro编译、依赖或桌面包。

原验收仍保持待验证。BreakTimer无关应用访问待处理，恢复后优先由原QA收尾，不能把本方案准备当作原流程验收完成。

## 已核事实

1. `server/verify.mjs` 与 `server/agent.mjs` 工具schema仅支持 click/fill/text/count/qr/reload。text读取 innerText，不读取 input.value；fill 校验的是本次主动写入成功与未截断。
2. Taro填入支持宿主内唯一可编辑子元素，不盲取first/nth；有结构化歧义/缺失反馈、取消与失败证据机制，可复用。
3. `verificationRequirements` 明确是 general/text-qr 窄验收profile，不是通用自然需求到业务断言覆盖系统；需求原文完整读取也不等于全部业务已验证。
4. 原history自然任务最终计划点击history后主动fill，再生成解码，无法证明history click引起回填。真实应用实际回填由独立原生QA只点击后读取Value另行证明；本缺口在验收能力，不据此推断应用回填有bug。

## 待审最小方案

先复用既有 Playwright 的只读 inputValue / 可重试值比较能力，保持 text 与 value 语义分开，明确input/textarea及Taro唯一子输入的支持范围。select/contenteditable/多子输入不默默降级。值断言应支持空字符串、精确值、不向候选反馈输出编辑值，保留信号取消与原失败分类。

只增加 value 断言仍不足以防止“点击后再fill”蒙混。工程/QA须提出最小因果合同：断言绑定具体click步骤，在该click前读取目标输入的不同初值，在click后只读等待期待值；绑定之间的主动fill、reload及无法确认目标的歧义不能算回填证据。独立负例必须覆盖值原本已等于期待、点击无效、点击错误条目、主动fill掩盖、异步回填及空值清除。

因果证据仍不能自动证明任意自然需求覆盖。应明确需求项、触发操作、只读断言、来源版本和待验证项；不以模型自报覆盖或新增一个history关键词profile宣称全需求已受宿主约束。当前每次QR检查要求自包含完整短/长/空场景，新增业务证据如何组合且不放宽QR门，亦需评审；不为本方案自行增加业务次数帽或扩大到通用测试平台。

## 交付与恢复

工程提交候选链接、复用/不采用理由、许可证/维护/版本成本、最小改动与局限；QA提交原触发负例实际命令和结果、等强修复回归要求。B核证据后给A优先级及下一实施工作包建议。产品实现需另行明确唯一writer和隔离工作树；本轮没有代码实现或通过结论。

恢复入口：先读TASKS本项、STUDIO-002-ACCEPTANCE及本工作包，核原QA审批状态，再读两份方案报告。无实际可靠唤醒时不承诺后台持续执行。

## B 已核结果与建议顺序

独立QA已结束，B实际读取其报告、result.json和摘要：精确main真实verifier在无事件历史按钮后主动fill仍passed；独立只点击的inputValue仍是sentinel，再fill才变化。textarea/select/contenteditable及异步读取边界也作了轻量原生对照。证据 `test-results/studio-002-input-assert-qa/result.json` SHA256 `0fd1ac4e11374faae16b48912c959866a817212ca6c2b214263a3438757922f9`，产品verifier摘要与冻结资源一致。默认沙箱launch第0步外部失败保留，正常审批同命令一次完成；没有修改期望或重放商业QR全计划。完整建议回归矩阵尚待实现，不能写已通过。

工程只读方案已形成，复用 Microsoft 官方Playwright公开inputValue及现有core 1.63.0，Apache-2.0；当前没有@playwright/test，不直接import不存在的expect、不复制私有_expect。官方文档/GitHub候选、版本成本及不用第三方封装的理由见工程报告。B核对后要求补充回填→生成→QR的输入来源交叉，并去除“扫码时输入还必须等于原文”的额外要求：生成后自动清空可能合法，可信来源应在生成前只读确认并绑定实际点击和精确解码。旧码恰好内容相同是否本次重生成不能靠值断言证明，须诚实保留局限；错误旧内容仍由实际解码拒绝。

建议顺序：

1. 原桌面验收审批恢复后优先收尾：回填后扫码、刷新/新窗、清空及B亲验。本方案不能替代原验收。
2. 下一最小实施包：`value`精确只读输入断言；可选一基`afterStep`仅绑定紧邻前一步click，click前值不同，click后只读等待，无中间fill/reload/额外click；宿主核真实valueChecks。仅支持可见input/textarea及Taro唯一子输入，取消、分类、空值、2000 UTF16边界和隐私按工程合同。实施前另登记唯一writer和独立工作树。
3. 同一最小包必须把额外历史扫码接到真实因果value来源：不能强迫value之后再次fill，也不能让普通value/伪造证据成为QR输入来源；原短中文、长文、空输入的fill-based基线强度不变。按完整计划核20步能否容纳，有冲突先记录具体步骤，不删断言凑通过。
4. 明确验收覆盖边界：只读值、点击变化、自然需求覆盖三项分别报告。当前原语不保证模型一定选择正确历史按钮或检查所有需求；最近三条/回填/清空须列出可审查需求项和证据。宿主结构化必验合同另估算，不用history关键词扩展冒充通用理解，也不以提示词声明当宿主覆盖。
5. 后续再评审按同源码/编译/需求/工具合同版本组合独立场景，减少重复完整QR基线；这会改变完成与失效规则，不纳本次最小原语准备，更不能借此复活旧次数帽。历史phase文案和manifest旧字段保持既有待办优先级，不挤占本核心验收缺口。

B接受方案方向和原负例证据，尚未授权或执行产品实现、完整回归与新包。独立QA报告末尾角色名已由B修正为实际工程Lead聊天ID，其负例及结论未改。原QALead仍是唯一待恢复桌面验收者，不称其正在操作。

准备工作已完成并经B核对：工程最终冻结SHA256 `bfa7b94ecd16c47e13268ac44684b091c38b3df54d113e4ab39f1c69826793da`，QA经角色登记修正后的报告SHA256 `d9cfa7ed2d6411377e20abad36d32f5b5a0a46d9e45d6d416e138e32a3b9f038`。工程与本子QA均已结束本轮执行；没有产品writer或新增模型任务。当前继续负责人B，交A确认下一实施派发，原QALead审批恢复后仍优先收尾真实桌面验收。源码基线与r2产品不变，方案完成不等于功能已实现。

## 最新：A批准实施后已实际派发

A明确接受最小value/相邻click因果/可信QR来源同包，纳用户持续改进授权自动接续，不因无关桌面审批停止全部工作。准备三文档已随 `c4af44f9a3d7bb7676e7a8cedba1aa3caacc6d54` 正常推送。B已创建独立干净工作树 `D:/app/.worktrees/studio-002-input-assert`，分支 `codex/studio-002-input-assert`，基线c4af44f。

- 唯一产品writer：实际续派 `/root/studio_repair`，限新工作树verify/agent/skill及必要自有开发回归/实施说明。原连续工作树4e冻结保留，不在main写产品，不push或打包。
- 独立QA：实际续派 `/root/input_assert_qa`，主树唯一新QA代码writer，仅新增 `tests/qa/input-value-journey.test.mjs`、`tests/qa/input-value-fixture.mjs`；自有记录 `docs/coordination/qa/STUDIO-002-input-assert-implementation.md`。先准备，等B放行精确冻结SHA才运行产品，不追活动工作树。
- 工程Lead：01a11fb4-ff38-7723-8711-298ab2608c9c，只读集中复审新实现，不与writer并发写产品。
- B：核版本与证据、纠偏、统一集成和范围内接续；A独占总台账。

沿最终工程合同实施并验证值精确比较、相邻点击前后变化、可信QR来源与宿主证据、取消/失败分类/隐私及保留原短长空门；允许生成后合法清空。通用需求覆盖与多场景组合未纳本包，20steps不变。无新依赖、Taro编译、商业模型、桌面输入、current或用户项目修改、r2重包。原QALead仍待审批，恢复后优先完成其原生余项，本开发不代替那份验收。

下一步：writer冻结SHA/clean后，工程集中复审与独立QA按精确SHA执行，必要修复继续同writer；B验收通过才集成。当前无已实现/已测试完成结论，不承诺结束回合后的永久后台运行。

## 最新验收与源码集成

最终开发冻结cb578873ca83b7c3b19beceefec492da2195a4ff（父6e12e14），工作树干净。工程Lead精确只读复审通过，最后deadline累加风险已修正：所有value定位读取共用剩余期限，仅短暂DOM脱离重解，不吞取消/运行错误。开发证据4/4、隐私分类1/1、静态1/1及截止增量1/1按对应版本复用。

独立input_assert_qa对该精确SHA实际6分组通过（46秒），含19次隔离HTML/真实Edge检查、3次完整QR基线加来源分支；同长度selector篡改增量1/1（8.3秒）。无效点击、错回填、截断、初值已等、后fill/reload、隐藏/歧义/不支持目标、缺证据/来源篡改、错误旧码均拒绝；合法自动清空通过。默认Edge第0步external首败保留，正常审批同命令通过，没有弱化期望。详情见独立实施报告，结果SHA256 842b5e5903d2895910cf231d1628555a74705ccdaee7e467db83ddb9e534126d。

B已读最终verify/schema/evidence，并独立运行冻结树原repair-loop的QR delivery retains静态门1/1，通过，未重复原繁重套件。两提交已集成main为c8c0c32、d3eb3f2；B核五文件与冻结产品逐字节一致。源码通过实现/隔离测试/工程复审，尚未重包或在商业模型上采用新原语，不称运行中的r2已有此能力；原生二维码剩余亲验仍等待用户安全空闲窗口。当前用户新报导航/预览状态缺陷已独立包优先实施，不覆盖本验收结论。

## r3实际纳入及执行方式更新

上述未重包为当时阶段。最终r3产品基线58458dcc29f82a8423e4aa64e6e1d3da298b7d54已纳入本能力，B/工程分别核43固定资源和全部3dist；独立QA正常升级、配置复用与6项目状态/存储保全通过，详见 `qa/STUDIO-002-r3-start.md`。未增加商业模型调用来使用新原语，不把隔离检查结果扩大为开放需求全覆盖。

用户Escape停止Computer Use后保持全部桌面操作停止。用户要求大规模生成与用户轨迹优先CLI自动回归、原生UI仅最终少量抽查；B正在协调统一入口覆盖核查，不重复本包19次有效检查。测试源码 `tests/qa/input-value-{fixture,journey.test}.mjs` 已纳Git，但目前runner尚未映射该组，不能宣称delivery已包含。B负责接续并向A汇总。
