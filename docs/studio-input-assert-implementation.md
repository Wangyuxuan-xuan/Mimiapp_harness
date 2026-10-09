# 输入值、点击变化与二维码来源实施记录

授权：用户 AGENTS 持续改进与 A 经 B 派发的 INPUT-ASSERT 最小工作包。唯一产品 writer `/root/studio_repair`；独立树 `D:/app/.worktrees/studio-002-input-assert`，基线 `c4af44f9a3d7bb7676e7a8cedba1aa3caacc6d54`。原连续修复树、main、桌面包、用户项目与凭据均未操作。完成开发不等于独立 QA 验收。

复用已冻结工程方案 `STUDIO-002-INPUT-ASSERT-ENGINEERING.md`（SHA256 bfa7b94ecd16c47e13268ac44684b091c38b3df54d113e4ab39f1c69826793da）的官方研究：[Locator.inputValue](https://playwright.dev/docs/api/class-locator#locator-input-value)、[官方仓库](https://github.com/microsoft/playwright)、[Apache-2.0](https://github.com/microsoft/playwright/blob/main/LICENSE)。再次核本地 D:/app/node_modules/playwright-core 为 1.63.0，公开类型有 inputValue。采用 core 公开 API 与既有 uniqueTarget；不引入 Test expect、私有 _expect、新依赖或新框架。最小自建部分是只读轮询、相邻触发绑定和执行证据。

`value` 精确比较字符串，允许空串，最长 2000 UTF-16 单位。只读可见 input/textarea 或宿主内唯一子输入，readonly 可读，select/contenteditable/password/file 等不支持。解析包含祖先透明/隐藏检查；多输入不选 first。每次值观察共享约四秒单操作期限，取消优先传播。点击前初值相等是 plan/value-initial-equal；不支持/不可见是 plan/value-target；唯一定位沿用 selector-syntax/missing/ambiguous。期限内未等值是 business；页面错误 runtime、浏览器关闭 external 保持原来源分类。

可选一基 afterStep 仅用于 value，必须为紧邻前一步 click。执行 click 前先解析其后继 value 目标并读取不同初值；click 成功才记录 clickExecuted；之后只读等待。中间 fill/reload/额外 click 不满足绑定。valueChecks 保存 step、selector、matched、expectedLength、actualLength；因果断言另有 afterStep、beforeEqualsExpected=false、afterEqualsExpected、transition、clickExecuted。没有实际值全文、片段或实际值摘要。歧义输入宿主也不以其 textarea 正文生成候选名。

额外 qr 的 sourceStep 必须指向前两步因果 value，严格连续 click→value→生成 click→qr，期待字符串精确相同。在生成前重新解析输入并只读确认当前值，随后实际点击与解码。qrChecks.source 保存 sourceStep、afterStep、selector、generateStep、beforeGenerateMatched、generateClickExecuted。允许应用生成后自动清空。普通 value、缺变化、错误索引/步骤不能成为来源。宿主证据校验核全部 value 和额外 source QR，并核 verification.planDigest 与本次完整 steps 的 SHA256；摘要针对调用者已提供的计划，不针对实际私密值。当前源码/编译门仍由 agent/HTTP 外层保留。

原 fill-based QR 分支保留；sourceStep 分支不计短/长/空基线。20 步不变，额外分支与完整基线可组成 14 步静态例，但不宣称所有业务均能容纳。HTTP 和 CLI 复用 verify 导出，无第二套策略；agent 原六工具不变，仅 verify action/schema/说明扩展，完整 steps/工具参数签名已涵盖新字段。

开发证据：`test-results/input-value-engineering-final.tap` 4/4，真实隔离 Edge：静态错误引用/UTF16/缺证据；异步 Taro textarea 回填与空清除；no-op/错误回填/初值已等/隐私/目标类型；实际 viewport QR 解码与合法自动清空、错误旧码；取消。随后仅新增候选隐私与页面错误/选择器分类，`test-results/input-value-privacy-classification.tap` 1/1。后者命令的附带依赖路径查询因树内无 node_modules 而失败，测试本身已完成 1/1；随后从真实 D:/app/node_modules 成功核版本。首四项在最终候选隐私小补丁前完成；后者专门覆盖该补丁。新增静态基线组合与同长度异计划证据拒绝另有定向日志。未重复旧 QR/native/Taro 大套，未调用商业模型。

局限：本原语不会自动覆盖全部自然需求，具体按钮语义与需求清单仍需独立审查；无关后台异步写入不能据此数学证明来源。旧码恰好与期待相同只证明点击后实际码内容正确，不证明本次重生成。跨调用组合、通用必验需求门不在本包。继续负责人 B；冻结后由独立工程 Lead 与 QA 核精确 SHA。

## 截止时间复审补丁

6e12e14 冻结后工程 Lead 发现类型和可见性 evaluate 仍使用默认等待，现统一由 valueOptions 校验 signal/剩余期限；所有 Locator.evaluate 与 inputValue 显式传剩余 timeout 和 signal，isVisible 为公开即时查询，其前先核期限。宿主/子输入解析前也核剩余期限。只有原生 locator 的短暂 detached 错误在原期限内重新解析，typed 业务/计划/运行错误与取消不吞；浏览器关闭仍优先 external。原生等待到期仅返回不含输入内容的截止提示。

仅定向 `node --test --test-name-pattern "DOM replacement" tests/input-value-engineering.test.mjs`，`test-results/input-value-deadline-followup.tap` 1/1。实际 Edge 正例点击后移除旧 input、120ms 后重建同 selector，因果值通过。截止反例通过测试包装公开 Locator.evaluate，在真实浏览器的第一次求值耗时3秒后移除DOM，随后真实原生求值只获得不足1.5秒剩余期限；所有观察到的 evaluate timeout 均为正且不超过4秒，整次过期检查含启动关闭不足6秒，返回 business 截止提示。该测试没有替换 verifier 的执行结果或证据，也没有新增产品 seam。旧4/4及隐私1/1有效证据复用，独立 QA 等待新冻结SHA。
