# STUDIO-002 输入值与点击回填：工程方案

日期：2026-10-09。状态：方案已形成，未实现、未运行本轮测试、待 B 与独立 QA 评审。

## 授权、归属与恢复

- 授权来源：用户 AGENTS 项目内部协作授权；A 经 B 派发的输入回填验收补强准备。直接工作包为 `STUDIO-002-INPUT-ASSERT.md`，本报告不扩大产品目标。
- 唯一工程方案负责人：01a11fb4-ff38-7723-8711-298ab2608c9c；汇报给 B：01a11ebf-e71e-71c0-97a1-86bcff83f324。独立 QA 由 B 另行安排，本工程报告不代替独立结论。
- 目录：D:/app；只读源码基线：main `f6b147ed6d10f37623e07837ff156476707b1083`。本轮唯一写入文件为本报告，不修改产品、现有 QA 源码或总台账。
- 不操作桌面、待审批 QA、current/profile、用户项目、Key、旧服务；不调用真实模型、不编译、不新增依赖、不打包、不创建实现分支。
- 恢复入口：先读 HANDBOOK、TASKS 与 B 工作包，再核源码 SHA 和独立 QA 报告。实施须由 B 另派唯一代码写入者与隔离工作树；本轮不承诺后台实现。

## 结论与已核事实

建议先增加通用的精确输入值断言，以及可选、严格的点击前后变化合同。单独增加值断言不能阻止“点击后主动 fill，再断言通过”。两者必须分别描述能力与证据，不把当前页面等值当成点击生效。

1. `server/verify.mjs` 的步骤只有 click/fill/text/count/qr/reload。text 读 innerText；fillEditable 写入后检查 value/textContent，证明主动填写未截断。两者均不能独立证明历史点击回填。
2. uniqueTarget 已处理唯一定位、结构化缺失/歧义、取消及可见候选；fillEditable 已支持 Taro 宿主内唯一可编辑子元素。复用这些路径，不增加 first/nth 猜测。
3. `server/agent.mjs` 的 verify_preview schema、说明与服务端枚举一致，需要同步扩展。宿主已有编译/真实验证完成门，不能只在提示词中建议检查。
4. verificationRequirements 明确是 general/text-qr 窄规则；需求原文分页完整读取不等于逐项业务覆盖。当前没有自动证明任意自然需求均已断言的机制。
5. B 提供的原触发是 history 点击之后主动 fill，再生成与解码。这份计划不能证明点击回填。B 工作包另记独立原生 QA 仅点击后读取 Value 已证明真实应用回填；本报告确认的是自动验收缺口，不判定实际应用存在回填 bug，也不冒称本工程已复现用户项目。

## 原生能力与开源复用

本地已核：playwright-core 1.63.0，Node >=20，Apache-2.0；未安装 @playwright/test 或 playwright 包。保留 PI Coding Agent SDK 与 Taro，不替换技术栈。

| 候选 | 可复用能力与依据 | 决定及成本 |
| --- | --- | --- |
| Playwright 公共 Locator.inputValue | 读取 input/textarea/select 的当前值。[官方 API](https://playwright.dev/docs/api/class-locator#locator-input-value)；本地 1.63 类型提供 timeout 与 signal | 采用现有 core API，对输入值做严格字符串比较；不需要新依赖。方法本身不等于等待值变成期待值，需最小等待封装 |
| expect(locator).toHaveValue | 原生可重试值断言。[官方断言 API](https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-value)、[重试说明](https://playwright.dev/docs/test-assertions) | 能力完整，但当前没有对应 Test 包；本次不为单个断言引入测试运行器相关运行依赖。若后续统一采用原生断言库，应锁定与 core 相同版本并复核打包成本 |
| Microsoft Playwright 官方开源实现 | [matchers.ts](https://github.com/microsoft/playwright/blob/main/packages/playwright/src/matchers/matchers.ts) 的 toHaveValue 经 toMatchText 调用 locator._expect；[许可证](https://github.com/microsoft/playwright/blob/main/LICENSE) 为 Apache-2.0 | 用于核对设计。官方仓库与本地当前版本表明已有维护来源，但 main 非固定版本证据。不复制私有 _expect 链或拆抄断言内部代码，避免兼容负担 |
| 现有 uniqueTarget、fillEditable、信号与失败分类 | 本仓库实际代码 | 复用目标解析与反馈；只自行实现等待、点击绑定和安全证据，不重造浏览器或通用测试平台 |

官方 inputValue 的支持范围较宽，本轮产品合同主动收窄到可见 input/textarea 与 Taro 唯一子输入。select/contenteditable 另有语义，不默默降级为文本断言。

## 最小工具合同

建议步骤增加 `action: 'value'`，`value` 必须为字符串，可为空，严格相等。可选字段 `afterStep` 为一基 click 步骤号。

```json
[
  {"action":"fill","selector":"#editor","value":"点击前的不同内容"},
  {"action":"click","selector":"#history-item-a"},
  {"action":"value","selector":"#editor","value":"历史内容甲","afterStep":2}
]
```

以上仅为差异片段，不是可绕过 text-qr 门的完整计划。历史条目的创建与既有短/长/空二维码场景仍须按现规则在同次调用准备。

普通 value 只证明该时刻输入框等值。带 afterStep 才要求观察到指定点击前后的不同值，并禁止中间主动写入。第一版采用最窄的相邻合同：afterStep 必须恰好是前一步，且该步骤为 click。这样 click→fill→value、click→reload→value 和 click→另一次 click→value 均是计划错误；不建设任意步骤数据流追踪。若需要一次点击验证多个字段，留待单独扩展，不能暗中放松相邻约束。

执行 click 之前，执行器从后继绑定断言读取目标，记录当前值是否等于期待值；必须不同，再执行指定 click，随后只读轮询该逻辑输入目标至严格相等。点击前已等于期待值返回 plan/证据不足，提示先准备不同初值；不能记通过，也不能据此判定业务失败。允许 click 前的准备 fill；断言函数本身不得填值、触发输入事件、执行应用 setter 或修改存储。

这一合同证明受控浏览器步骤中观察到变化，排除了检查工具的主动补填；它不是对任意后台定时器因果关系的数学证明。夹具必须覆盖无关延迟写入，真实计划需选隔离、稳定的业务状态，避免把无关异步效果归给点击。

### 输入定位、等待与失败

- 提取共享的目标解析小函数，复用 uniqueTarget；直接 input/textarea，或指定宿主内唯一 input/textarea。宿主多个子输入必须给结构化 plan 反馈，不能任选一个。保持 fill 已有 contenteditable 支持；不要为本功能回退或扩张 fill 的范围。
- 断言目标须可见，包含祖先隐藏/透明情况；readonly 可读。先核元素类型，拒绝 password/file 等不适合本合同的输入。普通 label 重定向不是本次隐式支持范围，提示明确定位实际字段。
- 使用公开 inputValue 读取当前属性；不读 getAttribute('value')、innerText 或截图文字。等待采用单个约 4000ms 的总期限，与既有浏览器等待一致；每次操作只用剩余时间，不能每轮重置 4000ms。短间隔等待须响应 signal。
- React/Taro 重渲染允许重新解析同一稳定 selector 的唯一输入，不固定失效 ElementHandle。点击前后都核唯一与类型；出现多个、消失或无法确认逻辑目标时不给因果 pass。任意动态 selector 不能被宣传为保证字段身份，应提供稳定业务定位。
- 超时仍不等值为 business；选择器语法/缺失/歧义/不支持类型/无效 afterStep/初值已等为 plan；页面脚本错误为 runtime；浏览器不可用/异常关闭为 external。取消先传播，不能吞成 business。DOM 替换导致的短暂 detached 可以在剩余期限内重试，不以通用 catch 吞其他异常。
- 保留旧 text/count/qr 语义与 plural count。失败继续回同一 PI 会话修正计划或产品，不引入工具、任务次数或总时长帽。单条等待期限只是浏览器操作边界。

### 边界、证据与隐私

- 沿用步骤 value 最长 2000 的当前 JS 字符串长度定义，即 UTF-16 code units；2000 接受、2001 拒绝，不能称为 2000 个可见字或 Unicode 字符。emoji、组合字符、换行均精确比较，不 trim、不正则、不归一化、不截断比较。
- 空串是合法期望：清空按钮需从非空值开始，click→value('') 才证明清空。textarea 换行按 DOM 当前 value 与明确预期比较，不能悄悄替用户修正 CRLF 或空格。
- 建议返回 valueChecks，至少有断言 step、selector、matched、实际/期待长度、afterStep（若有）、beforeEqualsExpected=false、afterEqualsExpected=true、transition=true，以及已解析目标的非敏感描述。由执行器产生，不采信模型自报。
- validateVerificationEvidence 对每个 value 步骤核同次原生执行证据和步骤绑定；带 afterStep 的缺少前值检查、变化或相邻合同不得 state=passed。证据继续绑定当前编译版本及当前 task，不复用别次浏览器状态冒充本次。
- 不返回实际输入全文、局部截取、DOM 全表单值或常见内容可反查的摘要；候选描述仍不含编辑值。失败只给步骤、类型、等值结果和长度。预期字符串是调用者已提供内容，仍不把它额外复制到错误日志。包装原生异常，避免未来直接引入 toHaveValue 的默认差异输出泄露值。
- 本次只读目标是隔离预览，不延伸到设置、Key、用户现场。现有 fill 错误可能返回截取值是既有事实，本次应复用解析而非复用该错误拼接方式；是否治理全部旧日志属于另项范围。

## 最小改动面与完成门

实施时预计仅需：server/verify.mjs 的枚举/字符串校验、共享输入解析、只读等待、click 前采样、valueChecks 与宿主证据校验，以及下述 QR 输入来源小扩展；server/agent.mjs 的 schema 和说明；agent-skills/mini-program/SKILL.md 的填写/读取值区别、相邻点击合同和需求项检查指导；对应精简回归。CLI 复用 verify 的导出路径，核一致性即可，不另建第二套执行器。

value 应可作为业务断言计入基础计划，但不能替代 QR profile 已要求的短中文、长中文、空输入与实际截图解码。新字段应同步格式校验与同计划稳定失败缓存的输入签名；取消/恢复仍走原 PI 与宿主路径。不可仅放开 schema 而忘记执行或宿主证据门。

对照独立 QA 后补充：现 QR 计划追踪最近 fill 作为输入来源。为支持“历史 click→只读 value→生成→qr”而无需主动补填，最小扩展应允许已成功的带 afterStep 的 value 建立一个新的、同次的可信输入来源。计划层检查顺序与目标，运行证据层必须确认该 value 的真实变化，随后生成点击和 QR 精确内容仍绑定该输入与来源步骤。仅声明 value、普通等值、另一输入的 value、失败的 value 都不能替代来源；插入测试 fill/reload 等操作使相应来源失效，生成前最后只读值必须匹配。生成后的应用自身行为按明确需求判断，不强制输入保留。短/长/空完整 QR 场景要求不减少，不把任何历史点击当成生成点击。该小扩展是原回填路径能实际接入现有门所需，不能以未来跨场景组合代替。

### QR 来源的精确分支合同（冻结补充）

建议额外 QR 步骤可声明 `sourceStep`，引用一基的因果 value 步骤；不声明时完整保留现有 fill-based lastFill 分支。schema 与 validatePlan 必须同步支持并限制该字段仅用于 qr。最小片段如下，五步均为相邻步骤：

```json
[
  {"action":"fill","selector":"#editor","value":"不同的 sentinel"},
  {"action":"click","selector":"#history-item-a"},
  {"action":"value","selector":"#editor","value":"历史内容甲","afterStep":2},
  {"action":"click","selector":"#generate"},
  {"action":"qr","selector":"#qr-container","value":"历史内容甲","sourceStep":3}
]
```

这里第5步不得再拿 sentinel 与 QR 期待值比较。validatePlan 的新分支只接受：sourceStep 是当前 qr 前两步；所指为字符串精确相同且带合法 afterStep 的 value；前一步是另一实际 click（生成）；该 value 的前一步是其绑定的历史 click。不接受普通 value、伪造/未来索引、跨调用来源或插入 fill/reload/其他操作。第一版收紧到 `click→value→click→qr` 连续形状，避免引入任意步骤副作用追踪。

validatePlan 只能批准形状，不能预认运行成功。执行器须在 value 确认变化后创建来源记录，至少绑定 sourceStep、afterStep、输入 selector/已解析逻辑目标、期待值等值关系与本次编译/计划身份。生成前最后一次只读核同一输入仍为期待值，不符或目标不明确则拒绝；随后实际点击生成并截图解码 QR，内容必须精确匹配来源期待值。生成后自动清空或改写输入可能是合法业务行为，不要求扫码时输入仍保留原值，不仅凭输入已变化判业务失败。严格四步邻接已排除测试工具在点击后插入 fill 的通道。生成按钮具体业务语义仍由需求项和独立 QA 核对，步骤类型不等于自动理解按钮用途。

validateEvidence 必须同时核原生 valueChecks 的前后变化、同一次来源绑定、生成前最后只读值匹配、实际生成 click 步骤，以及原有 qrChecks 的真实截图摘要、完整可见与解码精确值。任何缺失都拒绝 passed；模型填写 sourceStep 或自报变化不能建立来源。原有来源摘要机制若不足，实施者须明确补执行器字段，不能把静态计划当运行证据。

局限：旧二维码内容不符会被精确解码拒绝；若旧码恰好与期待值相同，上述合同只证明点击后的实际二维码内容正确，不能证明本次确实重新生成。没有明确需求时，不额外引入重生成事件、像素变化或输入保留要求。

带 sourceStep 的额外 QR **不计入**原短/长 fill-based 基线的 short/long 标志，也不满足空输入基线。text-qr 仍需同次完整短中文 fill→生成→qr、长文 fill→生成→qr、空 fill→生成→变化证据；只是允许其外追加可信回填扫码分支。按每基线三步共9步，历史准备和上述5步可能在20步内，但必须针对真实准备流程核算，不宣称所有需求均能容纳。

实施后须新增交叉正反例：原 lastFill 为 sentinel 时上述额外分支成功；生成后按应用明确合同自动清空输入而 QR 内容正确的正例通过；普通 value/缺变化证据不能成为 QR 来源；填入期待值插在历史点击后被拒；错 sourceStep、错字段、生成前值不匹配、二维码内容不符均不能通过；仅额外分支不得替代短/长/空基线。旧码恰好相同按上述局限记录，不伪造已证明重生成的结论。该分支纳入第一最小实施包，不留给未来跨场景组合；本轮仍仅方案。

工具原语与全需求覆盖分开交付：本轮原语只能执行明确给出的断言。skill 的要求清单能够引导模型，但不能保证模型不漏写。对于已明确要求回填/清空的验收，必须列出需求项、触发、目标、期待值与绑定步骤，由 B/QA核是否覆盖；省略 value 或 afterStep 不能说已验收该要求。

若 B 要求宿主自动阻止漏掉这类检查，需另明确结构化必验合同（来自已确认的需求项与当前来源版本，宿主检查步骤覆盖及因果形状）。不能只搜索“历史”关键词新增 profile，就宣称任意自然需求已有完整覆盖；没有历史关键词的回填仍可能需要检查，提到历史但未要求回填也不该误强制。该结构化合同应单独估算，本报告不以新增通用语义平台为最小实现的前提。

## 原触发负例与实施后的回归要求

独立 QA 负责实际隔离夹具、命令和证据。本工程本轮未执行，下表是验收要求，不是通过清单。

冻结前已只读对照 B 交付的 `docs/coordination/qa/STUDIO-002-input-assert-plan.md`，并独立读取结果文件摘要：`test-results/studio-002-input-assert-qa/result.json` SHA256 `0fd1ac4e11374faae16b48912c959866a817212ca6c2b214263a3438757922f9`。QA 已在精确 main 基线实际调用 verifyPreview，隔离无事件按钮的“fill sentinel→click→fill 历史中文→text ready”得到 passed；只点击时原生 inputValue 仍为 sentinel。还实际对照 textarea/select/contenteditable 与 120ms 异步更新。原沙箱 launch 外部失败保留，正常审批同命令一次 exit0。这是独立 QA 已完成的机制证据，不是本工程执行，也不是原商业 QR 全计划重放；无需重跑。

QA 脱敏 trace 核到最后工具调用 index74/result75：第14步 history click、第15步 fill、第16步生成、第17步 qr。此前 index66/result67 的 input text 断言因 innerText 为空失败。工程只复用 QA 报告中的已脱敏定位，不额外读取用户项目或原会话。该事实进一步要求把真实回填后的值接入 QR 输入来源，而非强迫模型再次 fill 才获准检查。

| 场景 | 旧能力或预期风险 | 新合同预期 |
| --- | --- | --- |
| 原负例：历史按钮存在但回填 handler 无效；先准备不同内容，点历史，再主动 fill 期待历史内容，生成有效 QR | 旧计划可以通过，暴露自动验收缺口；夹具保持其他功能正常 | click→value afterStep 不加 fill 时 business 失败；中间塞 fill 时 plan 拒绝 |
| 同样无效按钮，值本来就等于期待 | 单独 value 可过 | 因果合同 plan/证据不足，不记通过 |
| 点击错误历史条目、输入保持旧值或填成另一个值 | 页面出现历史文本或 QR 不足以证明回填 | 精确输入值断言失败，不能用 text/count 冒充 |
| 正确点击，异步 setState 延迟回填 | 一次即时读取容易误报 | 只读期限内重试通过；期限外 business 失败，不主动补填 |
| 清空按钮从非空到空；按钮无效；原本就空 | 常驻提示容易造成假通过 | 正例变化通过；无效 business 失败；原本为空证据不足 |
| input、textarea、Taro 唯一子输入；DOM 重新渲染 | 需要共享解析且不固定旧节点 | 正例通过；多子输入/多宿主/隐藏/消失反馈 plan，不 first/nth |
| wrapper 与直接 input 的不同 selector 写法；click→fill→value；click→reload→value | 仅按 selector 字符串追踪 fill 可被别名绕开 | 相邻 click 合同直接拒绝中间步骤，无别名补填通道 |
| 2000/2001 code units、空串、emoji、中文、空白与换行、maxlength 截断 | 截取或模糊比较可能放行 | 边界按上述定义；内容必须严格相等，截断 business 失败 |
| password/file、候选值、异常差异、超长实际值 | 隐私与输出风险 | 不支持目标 plan；反馈不含实际值或片段，不截断比较后放行 |
| abort、浏览器关闭、页面脚本异常、无效 selector | 通用 catch 可能误分类 | 保留取消与 external/runtime/plan 分类及同 PI 修复反馈 |
| passed 缺 valueChecks、错误 afterStep、错误编译来源 | 执行结果自报通过不足 | 宿主拒绝缺证据或错误绑定，不标任务完成 |
| 既有 QR 短/长/空、唯一定位、plural count、恢复与稳定失败缓存 | 新断言不能放宽旧门或破坏连续运行 | 复用对应 SHA 的有效证据，新增交叉检查；仅对改变路径补测 |

## 验证成本与后续分界

现每次 verify_preview 都开全新空存储浏览器，text-qr 计划要求同次自包含短/长/空场景，且现有每计划最多 20 步。增加历史准备及回填断言可能接近步骤边界，并重复昂贵基线。B 提到重复基线与约 545k tokens 是后续成本线索；本报告没有重新读取该真实会话用量，也不把 token 当金额。

当前最小包保持上述 QR 门、20 步边界与调用隔离。实施前用完整计划核是否容纳；若不能，向 B 提交具体步骤冲突，不隐藏删断言、不偷偷提高边界或建立次数帽。先收集真实计划的必要步骤，再决定单独扩展。

未来可评审同一来源下多个独立场景的证据组合：必须绑定源码摘要、编译产物摘要、需求版本、工具合同版本与场景身份；源码或相应需求变动使关联证据失效；每个场景自身准备状态，不能假设跨调用保留浏览器。只有完整所需场景集合都通过才完成，不能用旧 QR 结果掩盖新源码回归。它可能减少重复基线，但涉及完成门与失效规则，属于独立工作包，本轮不实施、不降低 QR 强度。

## 交付状态与下一步

已完成只读源码核对、官方文档与官方 GitHub 复用评审，并提出最小实施面、原负例和回归要求。仅本报告新增；没有实现、测试、模型调用或新包，因此不能记功能已完成或原 QA 已验收。

下一负责人 B：结合独立 QA 的实际负例证据确定实施工作包；先交付通用值断言与相邻点击变化证据，明确已确认需求项的覆盖检查，另列全需求覆盖与跨场景证据组合。实施后由独立 QA 在精确冻结 SHA 验收，再决定产品集成，不抢占当前桌面验收。

## 实施初改只读审查（2026-10-09，未冻结）

B 已传 A 批准实施，建立独立工作树 `D:/app/.worktrees/studio-002-input-assert`，分支 `codex/studio-002-input-assert`，基线 `c4af44f`；唯一产品 writer 为 B 管理的 `/root/studio_repair`。本工程仍只读产品，仅写本报告；未运行活动树测试。以上“本轮仅方案”描述对应先前方案阶段，不能作为当前实施已停止的依据。

初改读到 verify/agent/skill 及开发回归，所审 verify 内容摘要 `b0f284429b84b0dd73e3780ee98129a54a0f6c83ac59422bae0b65c9c7a2b18c`，不是冻结 SHA 或最终通过结论。afterStep/sourceStep 的一基索引和相邻约束正确；真实执行器生成 valueChecks 与 qr.source，宿主检查字段及完整 planDigest；sourceStep 分支不计短长基线；未强制生成后保留输入，开发回归包含自动清空；外层 abort 先传播并关闭浏览器。

已集中报 B 一项修正：valueTarget 接收 deadline，但 direct/supported/visibility 的 Locator.evaluate 仍使用默认超时，DOM 移除或替换时可能各自重新等待4000ms。应统一使用剩余期限与 signal 检查，短暂 detached 重试仅限剩余期限，不能吞掉取消或 runtime。独立 QA 应核同长度不同期待值的旧计划摘要失配、source 字段缺失/错绑，以及完整基线与额外来源组合。当前等待 writer 修正后冻结版本再作增量审查，不据初改宣称已通过。

后续增量：HEAD `6e12e14` 上活动修正已加入 valueOptions，direct/supported/visibility 的 Locator.evaluate 与 inputValue 共用剩余期限及 signal；仅 detached 在剩余期限重试，取消与页面关闭先传播，截止错误返回安全 business 信息。本地 core 1.63.0 类型 `types/types.d.ts:14274` 已核 Locator.evaluate 的第三参数支持 timeout/signal。开发新增 DOM 替换及递减期限用例，工程未运行。该修正静态未见剩余阻塞，最终仍待 writer 冻结 SHA 与独立 QA 实际结果。B 新报导航/预览状态问题另由其他工作包隔离处理，不在本报告推断已修复。

## 精确冻结版本最终只读结论

已实际核新树 HEAD 为 `cb578873ca83b7c3b19beceefec492da2195a4ff`，工作树干净。verify SHA256 为 `5580e43c5b692ae2b4e759395b10dd8e9a8a800853c683517df39c663dd658a5`。最后提交仅追加截止修正、开发回归与实施说明；复核增量包含子输入解析前的期限检查，typed 错误不进入 detached 重试。schema、skill、真实 value/QR 来源证据和原 fill-based 基线分支与先前审查一致，允许生成后合法自动清空，未见剩余工程阻塞。

实际读取开发截止专项日志 `D:/app/.worktrees/studio-002-input-assert/test-results/input-value-deadline-followup.tap`：定向1项通过；这属于开发者执行证据，不是本工程重新测试或独立 QA 结论。工程仅进行只读代码/日志/版本及差异格式检查，未启动产品测试、浏览器、模型或桌面。

继续负责人 B；独立 QA 已获准在该精确 SHA 核同长度异计划摘要、QR 来源篡改及完整基线组合等。工程审查通过不等于独立动态验收、集成、重包或用户交付完成；剩余结果按 B 的独立 QA 工作包收口。
