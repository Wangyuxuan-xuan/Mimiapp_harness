# STUDIO-002 输入值与历史回填：独立 QA 方案

2026-10-09，北京时间。执行者：`/root/input_assert_qa`；负责人：B 小芽项目负责人。

## 授权、版本和实际范围

用户 AGENTS.md 授权项目内部协作及已授权功能验收；A 本轮明确要求 B 组织工程/QA审现有 Playwright 输入值断言、需求覆盖与最小方案。此次仅准备方案和隔离反例，不实施产品功能。先读 HANDBOOK.md、TASKS.md、STUDIO-002-ACCEPTANCE.md。实际 main 引用为 `f6b147ed6d10f37623e07837ff156476707b1083`。读取产品源码和已脱敏的 `test-results/studio-002-r2-history-trace.json`；没有读用户项目、配置、原始模型会话、密钥，没有桌面输入、真实模型调用、Taro构建、重包或 Git 操作。唯一写入为本报告与 `test-results/studio-002-input-assert-qa/`。

## 原触发与根因

脱敏 trace 的最后 `verify_preview` toolCall index74（结果 index75 passed），第14步点击 `.history-item:nth-child(3)`，第15步主动 `fill .input = 你好二维码`，第16步生成，第17步二维码解码为你好二维码。它证明后一次填写和生成正常，不能证明第14步历史点击回填了任何值。此前 index66 的 `.input` text断言在第14步失败，结果 index67说明实际innerText为空；输入框文字存在于 value 而非可见元素正文，这是断言能力选择问题，不足以判定应用回填故障。

`server/agent.mjs` 的工具 schema 与 `server/verify.mjs` 仅接收 click/fill/text/count/qr/reload。text读取innerText、做包含匹配；fill核对自己刚写入的 editable value。这两者均不是只读输入值断言。现交付只对文字二维码有窄覆盖规则，没有“最近三条、回填、清空”的独立需求覆盖门。现有 QR 门把后续解码绑定到最近fill，因此尝试只点击历史再解码会被计划拒绝；模型通过再次fill绕开了回填证明。这是验收证据缺口，不能由此宣称实际生成的应用回填有故障；原生独立QA另已验证其正确回填。

## 已实际验证的小反例

脚本：`test-results/studio-002-input-assert-qa/repro.mjs`；结果：同目录 `result.json`；首默认沙箱失败：`verifier-sandbox-failure.json`。

隔离HTML只有初值sentinel的input、完全无事件处理的历史按钮和ready文本。main真实verifyPreview在headless Edge执行“fill sentinel → 点击无效历史按钮 → fill 历史中文 → text ready”，结果passed。独立浏览器只点击同一无效按钮，inputValue仍为sentinel；再fill才变为历史中文。这实际证明“点击后主动fill掩盖回填故障”的最小机制。不是原商业QR完整计划重放、不是产品修复后的验证，也没有实际二维码或用户历史数据。

同次轻量原生对照实际观察：textarea inputValue保留 `甲\n乙`；select返回存储值stored，显示文字为显示名；contenteditable调用inputValue明确抛不支持错误，其textContent为甲乙而innerText为带换行的甲/乙，不能混同；延迟120ms的回填在立即inputValue读取时还是before，等待条件后才是after。说明值读取需有界等待，不能只读一次。

默认沙箱两次均在浏览器launch、业务第0步外部失败，首报告保留；同一命令正常审批一次后exit0并完成上述实际反例。不降低断言、不以环境错误冒称业务失败。所有浏览器由脚本finally关闭。

## 优先复用与最小合同建议（尚未实现）

现有依赖 playwright-core 1.63.0，Apache-2.0，仍由 Microsoft 官方仓库维护，无须新增浏览器框架。官方 [inputValue](https://playwright.dev/docs/api/class-locator#locator-input-value) 可读取input/textarea/select的值；官方 [toHaveValue](https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-value) 与 [自动重试断言](https://playwright.dev/docs/test-assertions) 可等待异步值。现依赖是core，未声明Playwright Test；不可假设已可直接import expect。优先复用core的inputValue加既有有界轮询、signal及定位反馈；如工程选择引入Test的expect，先说明依赖和打包成本。官方 [源码仓库](https://github.com/microsoft/playwright) 和 [输入指南源码](https://github.com/microsoft/playwright/blob/main/docs/src/input.md) 已搜索核对；无需拼装第三方封装。官方toHaveValue解决值与等待，不解决“是谁写入”或需求是否全覆盖。

建议分别保留普通只读value断言与带点击归属的回填断言，最终命名和schema由工程方案确定。普通value只说明当前值相等，不能被标记为已验收历史回填。回填证据至少满足：

1. 明确绑定本次计划的某个历史click步骤、目标输入selector、精确期待值；click必须实际执行成功，不能接受虚构索引、仅fill或别的生成按钮充作历史动作。若绑定的按钮语义只来自模型自述，仍需独立审查，不能宣称通用语义证明。
2. 点击前读取目标值，必须不同于期待值；点击后仅观察同一目标直到精确相等，有界等待允许应用异步处理。不能用trim、包含匹配、Unicode归一化或截断放宽长中文/空白/换行要求。
3. 点击与只读断言之间存在fill、reload或其他有写入副作用的测试操作，应拒绝将该断言作为回填因果证据。只读value本身不能自动证明因果。初值已经等于期待值、没点击、点击后fill都不得满足回填覆盖。
4. input/textarea优先；Taro host仅解析其唯一子输入，不取first/nth。外层和子输入都应可见，透明/隐藏祖先不合格，多个子输入或visible+hidden双输入都返回定位问题。selector明确落到唯一可见目标是调用方责任，不能悄悄过滤来选一个。
5. 回填后的QR可从实际读到的、与点击证据绑定的值建立新的输入来源，再点击生成、实际截图解码。不能简单取消现有“解码绑定输入”门，也不能让额外fill满足回填要求。普通短/长/空二维码门保持有效。
6. 结果仅保存必要step/selector/触发关系/精确相等与变化结论；异常文本限制长度并走既有脱敏。候选列表不得为此新增全部input.value、textarea正文或DOM导出。证据需按源码/计划摘要绑定，源码变化后旧passed不可复用。

## 建议回归矩阵（除上节注明项外均待实现后验证）

| 用例 | 期待 |
| --- | --- |
| 正确历史click把不同sentinel变为完整120字中文 | 通过回填覆盖；期间没有再fill |
| 回填函数无效 | 普通标题/QR仍可通过；回填断言必须失败 |
| 回填错误条目、错一字、截断120字、丢空格/换行 | 精确值失败，不以contains通过 |
| 只fill目标值没有click、伪造click引用 | 回填计划/证据拒绝 |
| click后再fill成期待值 | 普通value可过，回填因果及需求覆盖拒绝 |
| click前已是期待值 | 无变化证据，回填覆盖拒绝 |
| 隐藏输入、隐藏host、透明祖先、唯一host内多个子输入 | 可见性/定位失败；无first/nth自动选取，无值泄露候选 |
| 先无输入随后挂载、点击后异步更新、超时永不更新 | 前两者有界等待通过，后者诚实业务失败；stop/浏览器异常仍可中止 |
| textarea含空值/首尾空白/换行 | 普通value允许空字符串并精确比较；与text非空规则分开 |
| select | 初版可明确不支持；若支持须比较option.value，不能用显示文案替代，multiple另约定 |
| contenteditable | 初版明确不支持；不能假装inputValue支持，未来需独立定义文本/换行/富文本合同 |
| count/text旧语义、Taro唯一child fill、QR短长空及隐藏QR负例 | 不回退；不借新断言放宽既有真像素门 |
| 同计划改源码、恢复任务、摘要失配 | 重新构建/检查，旧值证据不被当当前证据 |

这些是后续最小实现的验收要求，未实际跑全矩阵。此次仅实际运行无效回填被后fill掩盖及几个值API边界对照。

## 覆盖层与仍存局限

新增value解决输入值观察；点击归属、前后变化与无测试写入解决本次受控序列的证据；需求覆盖解决是否真的把最近三条/回填/清空都检查了。三者不能互相替代。一般应用仍需从持久需求生成可审查验收条目、绑定当前证据并明确未覆盖项；不建议为此无边界扩展关键词正则或宣称通用需求理解已解决。

现每次verify新浏览器且最多20steps，QR要求每次完整短/长/空，自然历史修改已多次重复QR检查，挤占历史准备、回填、刷新和清空步骤。应在后续方案讨论按同源码、存储起点及来源绑定组合多个独立结果；本次不改20steps、不放宽QR门、不增加平台或真实模型实验。仅加一个action不足以解除覆盖/组合限制。

结论：反例机制和既有API复用已实际核实，产品实现及完整回归尚未开展；原桌面验收继续保持待验证，不用本方案替代。继续负责人为B，工程方案由工程Lead聊天 `01a11fb4-ff38-7723-8711-298ab2608c9c` 写独立记录，B核对两份方案后确定最小后续工作包；原QALead审批恢复后优先完成原生剩余验收。B仅修正本段实际角色登记，没有改变反例或结论。
