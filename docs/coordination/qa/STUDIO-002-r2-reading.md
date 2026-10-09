# r2 正常入口真实读书任务独立验收

2026-10-09；QA Lead 执行，B 负责最终亲验。授权来自 AGENTS.md / TASKS.md 和 B 对正常 current 新 QA 项目的串行放行。原用户项目与旧失败任务未修改。

## 版本与范围

- 产品 main：dbe7a6bc35861315f879cf4b3d2fe7b8809a2cec；连续运行产品文件与冻结 4e43676b9cc03f8210e2d27936c88aa9d74dcb53 一致。
- 正常包：`release-harness-20261009-studio2-r2/win-unpacked/Sprout Studio.exe`；实际 PID 58896，公开 API 50276。manifest SHA256：0292ee8f79ef9d256b28fe549fbe27095e53a097aca039dbc0137a8c62364f85。
- 正常 r1 退出后启动 r2；公开配置 encrypted/hasKey/persisted/available 均 true，不重填或读取密钥。旧项目 revision/taskstate 前后相同。证据：`test-results/studio-002-r{1,2}-public-upgrade.json`。
- 真实模型使用现有 deepseek-flash 配置，QA Lead 唯一操作；没有人工追加修复任务或改生成源码。

## 同任务纠错证据

正常 UI 新建“QA读书r2-1009”，原始请求“做一个记录读书进度的小程序”。project `469b3fa8-0c36-4cd8-9543-19448720cff3`，task `d85595f1-db96-49a7-b148-52335568c55d`；同一原生 session `2026-10-09T11-11-11-709Z_01a1205c-235c-752c-a1f7-d0677fc64a56.jsonl`，draft `9dfa7157-02e9-4810-9902-4b7aa59e8501`。自然 completed，revision 1。

1. 第一次真实检查：step 4 fill `.sheet .field-input` 匹配 5 个元素，plan failed，候选反馈实际进入会话。模型改源码加入 input-title / input-total / input-pages 后重新真实构建。
2. 第二次真实检查：step 8 text `.bar-text` 匹配 2 个元素，plan failed，实际候选与 2 项建议反馈。模型加入 progress-text 后重新真实构建。
3. 第三次检查 passed：原有“人类简史、320 总页、记录 25、25/320、日志 +25、统计 25”断言通过，未降低原期望。
4. 第四次额外检查 passed：60 总页、记录 20、重载、撤销一次、删除、空书名反馈。不是替换第三轮原断言。tab 与 undo 部分仍使用位置选择器，不能宣称所有定位均无 nth；B 已核源码第三个卡片按钮确为撤销一次，QA 下述独立 UI 另验其语义。

15 工具 / 3 次真实双端构建 / 4 次真实浏览器检查 / 0 host repair prompt，约 198 秒；超过旧 3 次验证限制后继续自然交付。13 条 assistant 消息汇总 input 7148、output 16676、cacheRead 162688、cacheWrite 0、totalTokens 186512。SDK cost 0 为占位，真实金额未知。

证据：`test-results/studio-002-r2-reading-status.json`、`test-results/studio-002-r2-reading-trace.json`；trace 按 sprout-task 精确核绑定，只抽取非敏感工具结果/用量/计划，无密钥或整个 session 内容输出。

## 独立正常 UI 与交付

QA 在正常 Electron 手机预览内添加人类简史 / 320 页，记录 25 后显示 25/320；再记录 10 显示 35/320 与两条记录；按可见“撤销一次”按钮回到 25/320，保留最初 +25 日志。没有把撤销最后一次误称重置全部。

正常另开第三个 r2 窗口 11144748，首次加载即显示该 QA 项目及相同 25/320 / 单条 +25 记录，重开持久性通过。窗口 7673380 也保留安全亲验现场；15274978 是早先打开的旧列表视图。QA 已通知 B 并暂停桌面输入，供 B 一次亲验。

包内 CLI 实际 export exit 0（没有声称点击 UI 导出）。源码 digest `91c376e93ea01847fd818b6788b777f5e9483c7a2fbf844e4a7ea63c108393d8` 与 revision1 / 最后检查一致。ZIP `test-results/studio-002-r2-reading-rev1.zip`，SHA256 `3b62585aef486eeb315d2b4c72b4281e70217bd73efdc53672a455ce44b5aced`；15 个源码条目逐个 SHA 匹配，21 个 weapp 条目、root project.config.json 存在，未带私有运行文件。证据：`studio-002-r2-reading-export.json` / `studio-002-r2-reading-zip-check.json`。B 另独立重算 digest 与 ZIP 字节：`test-results/studio-002-b-reading-artifact.json`。

此结论覆盖真实商业模型、真实 Taro 构建、H5 业务交互和静态微信格式产物，不证明微信模拟器或真机运行。二维码及一次历史业务修改尚待 B 亲验后的串行放行，整体 STUDIO-002 未验收完成。继续负责人 QA Lead；恢复先读本文件、TASKS.md 和 B 最新交接，不再重复已通过的昂贵检查。

后续结果：B已在窗口11144748亲验25/320单条+25→新增5为30/320两条→撤销一次回25/320单条+25，原记录保留；并独立核对15源码+19非空weapp字节与精确revision1相同。随后B放行原QR+history两自然任务，QA独立执行已结束，完整结果与保留边界见 STUDIO-002-r2-qr-history.md。本文件冻结，不重复真实模型或构建。
