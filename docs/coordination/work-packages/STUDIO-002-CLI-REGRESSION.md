# STUDIO-002 命令行与用户轨迹回归

2026-10-09。唯一负责人B：01a11ebf-e71e-71c0-97a1-86bcff83f324。A维护TASKS；工程Lead 01a11fb4-ff38-7723-8711-298ab2608c9c组织实现，独立QA Lead 01a11fb5-2b8d-75a2-bdd3-8aaf5ca47938验收。

## 授权与边界

用户在B聊天直接要求：Computer Use占用桌面影响其他工作，大规模生成及用户轨迹应优先command line，纳入回归，Computer Use仅最终实际UI交互检查。用户已按Escape停止原生操作，本包不自行恢复。沿用持续改进/内部协作授权，不新增产品目标、付费服务、微信迁移或公开发布；本批只做隔离回归入口及编排准备，不放行额外商业模型调用。

## 已核实际能力与缺口

B及QA Lead分别只读核对现有源码。Studio CLI与界面共用业务服务，已有projects create/show/list、run（同项目新需求实现连续修改）、progress、verify、export及stop/resume/repair/restore。server verifier与preview测试使用headless Edge，真实DOM/输入/像素验证可以从命令行执行，不必占用用户桌面。

现有CLI独立17命令证据是模拟agent/build，未覆盖verify/export及完整真实模型生成至交付轨迹。不得冒称批量真实生成已完成。当前verify每次新浏览器默认空initialStorage，endpoint未传回项目storage，跨调用历史状态验证存在缺口，须另作最小隔离复现再决定是否修复，不用CLI结果冒充此前原生持久化验收。

统一入口scripts/studio-qa.mjs未纳入continuous、session-navigation和input-value三个新增组。已有测试源码可复用，不能简单拼接：nav缺冻结参数会skip，CASE可只跑单组；input当前Git绑定只兼容原工作树；统一90秒超时与新增suite120秒不同，报告路径也需隔离。

## 最小执行安排

1. 工程Lead组织唯一writer在独立工作树，复用现Node/Playwright/现有QA源码，先接navigation/input和continuous明确入口与覆盖表。冻结源码、实际dist和报告目录显式绑定；支持当前集成版本的严格核对，不默默默认旧树。完整组拒绝缺参数/筛选/全skip伪通过，按各suite合理测试时限，不把测试时限重新变成产品制作额度。
2. 增量独立QA验证入口分派、错误参数早拒、版本/产物不符拒绝、真正命中业务数及退出码。复用旧有效业务证据，只有适配影响的组才重跑。CLI业务层、无焦点浏览器UI层、最终原生层分别报告。测试自身也不得意外附着current、弹可见窗口或读取Key。
3. 再准备CLI生成/修改/验证/导出轨迹编排及准确证据字段：任务/session/revision/sourceDigest/ZIP字节对应、原始需求stdin、唯一模型操作者及新建QA项目白名单。当前不执行额外商业调用；批量调用需B明确具体范围，优先隔离模拟。当前CLI缺attach-only，批量runner先readSession fail-closed并核已知包/workspace，禁止未知fallback启动。

新增或改变能力继续遵守手册先核原生工具和官方/GitHub实现的要求；本批优先复用已在仓库的测试，避免新增依赖。主树Git由B统一，工程独立树内提交冻结，QA不得验收自己实现的产品逻辑。不能为仅测试/文档变化重包。

## 当前状态与恢复

核查完成，尚未实施入口适配或新增动态测试。B向工程Lead交接唯一实现安排，QA已结束只读核查；没有原生操作者，不承诺本聊天结束后的永久后台执行。恢复入口：本包、手册、TASKS、实际Git/测试源码与两个Lead回报。预览性能后续优先用隔离CLI和已有日志分段计时，先测量再决定优化。
