# 制作期间切换项目与预览状态

- 日期：2026-10-09；状态：实现进行中，未验收。
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
