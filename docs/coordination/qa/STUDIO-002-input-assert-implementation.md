# STUDIO-002 输入回填独立实现验收

2026-10-09。执行者 `/root/input_assert_qa`，B负责验收与集成。

授权来源：用户AGENTS内部协作和功能验收授权；A明确批准此前最小方案实施，B续派本独立QA。产品唯一writer另在 `D:/app/.worktrees/studio-002-input-assert` 开发；本执行者仅为主树新增QA源码的唯一writer。不改旧QA四源、产品、总台账或原桌面待审批QA文档，不操作桌面/current/Key/用户项目，不调用商业模型、不编译Taro、不重包。

## 当前状态

已由B正式放行并验收精确产品 `cb578873ca83b7c3b19beceefec492da2195a4ff`，独立树 `D:/app/.worktrees/studio-002-input-assert`。独立回归6组通过，随后等长selector篡改负例所在组定向1/1通过，exit0。脚本无活动树默认地址，强制 `INPUT_ASSERT_PRODUCT_ROOT` 和40位 `INPUT_ASSERT_PRODUCT_SHA`，读取独立worktree HEAD实际匹配才导入产品verifier。产品verifier SHA256 `5580e43c5b692ae2b4e759395b10dd8e9a8a800853c683517df39c663dd658a5`。

唯一新增测试文件：`tests/qa/input-value-journey.test.mjs`、`tests/qa/input-value-fixture.mjs`。复用现有 `qr-fixture.mjs` 的固定vendor二维码浏览器编码与隔离HTML框架，不改已有源、不新增依赖。浏览器、随机HTTP端口及临时工作区各自隔离。

实际分组：正确/异步/节点替换/Taro唯一子输入/textarea精确UTF16及空串变化；无效/错误/截断/初值相等；点击后fill、别名fill与reload静态拒绝；隐藏/歧义/不支持类型与隐私；取消；真实QR像素来源、生成后自动清空、错误旧内容；缺valueChecks/错sourceStep及保留原fill-based短长空基线。相关源码按冻结设计独立准备，运行前仅核产品最终字段，不从实现生成业务期望。

点击前须已可读取目标的不同初值。此次不测试“点击才首次创建目标仍可证明变化”，不为此扩大合同；节点替换用例为点击前存在输入，点击后以相同稳定selector重新解析替换节点。

此前缺口微型机制证据继续复用 `STUDIO-002-input-assert-plan.md` 及其原始result，不重跑原商业计划。此次新合同无效回填实际business失败；中间fill/reload被计划拒绝。普通等值仍可通过，但不被当点击变化。此结论是精确产品的隔离验收通过，未证明已经集成、打包或桌面原流程完成。

## 实际命令与首失败

设定上述root和SHA后实际运行 `node --test --test-concurrency=1 tests/qa/input-value-journey.test.mjs`。默认沙箱2静态组通过、4浏览器组在launch第0步external失败，Edge临时profile site-list替换权限错误；无业务步骤执行。保留 `test-results/studio-002-input-assert-implementation-default.tap` 及 `studio-002-input-assert-implementation/default-results.json`。同命令正常审批后6/6、46004ms，报告 `studio-002-input-assert-implementation-approved.tap`，19个真实隔离HTML执行结果保存于 `studio-002-input-assert-implementation/results.json`，SHA256 `842b5e5903d2895910cf231d1628555a74705ccdaee7e467db83ddb9e534126d`。未改变断言应对环境失败。

收尾发现新selector替换未严格保持字符串等长，仅将该测试值改为等长并加长度断言；没有改产品或业务期望。定向 `--test-name-pattern='actual correct/async'` 正常审批1/1、8322ms，其余组不重跑；保留 `studio-002-input-assert-implementation-same-length.tap` 及同名结果目录。测试源码最终冻结：journey `eb70b2a541287fa37bc18d96b833c73374153677024f8aeaea19fe75ef41cf1c`，fixture `238c21d468b25336c6f3a423835da810740d91abd4128722120b9e6fc4b7247b`。

## 有效结论与边界

- 真实只读正例6种，以及空值、textarea首尾空白/换行/emoji/组合字符精确比较通过。2000/2001 UTF16边界仅静态格式测试，不冒称2000实际输入压力测试。节点替换是同步替换，120ms异步是更新值；更复杂的移除后重建、截止窗口复用工程定向证据，不冒称此次独立重跑。
- 无效、错误、截断实际回填均business失败；点击前值已等于期待返回plan。普通只读value等值可通过。click后fill（包括host别名）/reload/伪造引用均静态拒绝。
- 隐藏祖先、host双输入、password、select、contenteditable均未passed；错误/候选反馈未泄漏夹具实际值或期望标记。预先abort明确抛QA_STOP，没有启动浏览器。本次未额外注入执行中关闭浏览器或页面runtime，复用既有分类证据，不扩称全部故障分类已独立复验。
- 三个真实QR调用各含完整fill短中文、120纯中文、空输入及额外因果来源，均14步。正确来源与生成后自动清空通过；错误旧内容在第14步business失败。来源分支单独不能替代原基线。实际验证二维码截图/视口摘要及解码结果，不用标题、格子数或预渲染图片代替。
- 宿主拒绝删除valueChecks、错afterStep；复用旧planDigest但换同长度value/selector或移除afterStep被拒。额外QR的qr.source六字段逐一删除/篡改及整体缺失均拒；错sourceStep被静态形状/宿主校验拒绝。此证据针对受控执行器输出被篡改后的校验，不证明宿主能识别任意恶意伪造整个执行器及所有摘要的攻击。
- 具体历史按钮语义、任意自然需求是否全部覆盖、同内容旧QR是否本次重生成、跨调用组合仍是已知边界，原原生验收没有被本隔离测试替代。

继续负责人B核报告及工程Lead只读结论后决定集成。独立QA代码写入已冻结，无运行浏览器或模型任务；后续仅按B具体续派调整，不自行改产品。原桌面业务待审批与此次隔离改进分别记录。
