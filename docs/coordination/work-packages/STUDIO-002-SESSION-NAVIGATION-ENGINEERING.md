# 制作期间会话切换：工程只读审查

2026-10-09。工程负责人聊天：01a11fb4-ff38-7723-8711-298ab2608c9c；汇报给 B：01a11ebf-e71e-71c0-97a1-86bcff83f324。

授权：用户在 B 直接报告 hi 羽毛球计分制作时无法切换/新建、预览状态矛盾；A 确认优先修复。范围与唯一产品 writer 见 `STUDIO-002-SESSION-NAVIGATION.md`。工程只读工作树 `D:/app/.worktrees/studio-002-session-navigation`，基线 `1e86ca155e3c1378245e80c9fac7bf43b89b89a3`，只写本工程说明；不运行活动树测试，不操作用户 hi/current、UI、模型、服务或包。

## 活动初改审查

状态：未冻结，不能记最终通过。已读 use-project-sessions、project-preview-state、main、studio-client 及开发用例；核对服务 jobs/createTask/flushHeaders、stop 与 store 保存逻辑。

正确方向：项目缓存、草稿、流和错误按 id；异步 updateProject 不主动切 active；发送第一 await 前捕获所属项目与输入；onStarted 在服务已登记任务并发送 headers 后通知；HTTP 拒绝不报告 started；代码请求用 ignore 防迟到；预览区分首版制作和旧版本可用。resume 创建新 randomUUID task，不能把旧任务 id 相同作为恢复前提。

集中提交 B 的修正项：

1. P1：stop 只有 projectId，迟到请求可能停到同项目后续新 run；迟到响应也无 entry/epoch 核对，会把新 run 状态改成“正在停止”。应通过每项目 stop 在途门控下一次发送或条件任务身份，保证请求归属；回执核代次。onStarted 的延迟 requestStop 同样受保护。待测延迟停止请求/响应与旧任务结束后新发送。
2. P2：publicSettings 后立即清草稿，run 在 onStarted 前 HTTP 拒绝或断网，finally 再用服务 messages 覆盖乐观消息，导致未接受的内容消失。应确认接受后再清，或只在对应项目安全恢复未接受草稿，不覆盖新编辑。待测启动拒绝后切回仍有草稿。
3. P2：无 task 的初始化状态不受 revision/task 时间比较保护，迟到 project GET 可将较新 failed/interrupted 覆盖成旧 preparing。应核请求新鲜度；store.save 并非每次更新 project.updatedAt，不能直接假设其可靠。待测初始 GET 晚于终态 poll 返回的轨迹。

性能观察仅作待测：从单 active GET 改为全 projects 每秒轮询会携带更多需求/历史；没有实际字节和分段耗时，不据此断言变慢，不要求本包重造缓存或增加任务额度。

## 交接与恢复

以上已发 B 集中交唯一 writer。工程未执行测试或触碰产品。继续负责人 B；待修正冻结 SHA 后工程增量只读复核，独立 QA 绑定同版本运行用户轨迹。工程静态审查、开发测试与独立验收分开记录，不把源码改动视为运行 r2 已修。恢复时先读本工作包、TASKS 与真实工作树状态。

## 冻结版本最终只读复核

实际 HEAD：`25d66c1cd2ecfa96b31b18d618b0e791e512b5b7`，状态干净。`src/use-project-sessions.jsx` SHA256：`bd1029f8437267bc1d981b5b1a04a4fa91733b869f0c955f1bf3cc3842a426e8`。已读最终 hook、main 接线、客户端、实施说明及新增开发轨迹；差异格式检查无错误。未运行测试、浏览器或构建。

- 停止归属：增加按项目的 stops Map，在请求发出至响应结束期间拦住 send；本地 busy 合并 stopping，输入与继续按钮遵守门控。回执只清理相同 pending 项；status 仅在捕获 entry 非空且仍为同一 run 时保留“正在停止”，不存在 undefined===undefined 误留状态。starting 的 stop 由 onStarted 后发送，preflight 不误发服务 stop。导航不会触发 hook 卸载 cleanup；只有真实组件卸载才 abort 本地流连接。
- 草稿：publicSettings 后不再清空或添加乐观用户消息。onStarted 确认接受后，仅当该项目草稿仍等于捕获 draft 才清除；服务拒绝前没有清草稿，finally 的项目读取不会改 session.prompt。
- 迟到状态：保持 epoch、版本、任务数量、同 task 时间及终态检查；新增同版本且同最新 task 的初始化 failed/interrupted/ready 防 preparing/缺失旧元数据覆盖。服务当前活跃生命周期没有初始化重试转换，因此该窄保护不拦现有合法状态。恢复仍为新 task UUID 加 resumedFrom，不被同 task 终态门误挡。
- 项目归属：select/open 显式改变当前选择；SSE、stop、finally、文件读取及 iframe 回执保持对应 id；旧已保存版本 iframe 在后台制作时仍可交互。全局设置门仍取全部项目 running/busy/stopping。未见这三项修正或最终接线的剩余工程阻塞。

只读证据核对：开发 `session-navigation-report.json` 的8条检查为 passed=true、closed=true，包括延迟 stop 请求/响应、HTTP409 保草稿及无 task 初始化迟到 GET；sourceHead 是提交前基线，不冒充冻结 SHA 测试。实施说明报告开发 Edge 9/9（含父项）与其他9/9；原失败汇总误写 passed 的首轮不作为有效证据。独立 QA 尚在另工作包执行，不以开发通过代替。

已实际核 dist 清单 sourceCommit 为冻结 SHA，并重新读取三文件 SHA256 与清单逐项相同：index.html `c495c52ffad07972414db8f9b1b464c84a384d7d568b28f986f8a82b09e5d2ce`；index-346f283a.js `7553384fbda66e71b0e61dbca3a3fd92c717f0884dc99a0d57b9c1420267d01f`；index-4178fc67.css `4178fc67a20093a8426b935a30da7212f2ff4168761ca689a62367366270d057`。这是冻结清单与实际文件一致性核对，不是当前 r2 运行包已更新或商业模型验收。

工程结论：对该精确 SHA 只读审查通过。继续负责人 B，独立 QA 依放行的冻结源码与匹配 dist 做边界轨迹；性能仍待真实阶段数据，全 projects 轮询流量只作待测，不因静态审查断言快慢。本报告不授权集成、打包或用户现场操作，后续由 B 按既有授权收口。
