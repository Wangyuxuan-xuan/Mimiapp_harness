# STUDIO-002 会话切换独立 QA 结果

## 当前结论：冻结版本十个场景独立验证通过

绑定 `25d66c1cd2ecfa96b31b18d618b0e791e512b5b7`，独立工作树 `D:/app/.worktrees/studio-002-session-navigation`；两次执行均通过完整源HEAD/clean/src-server无untracked及独立dist哈希门。没有产品改动或新增Vite/Taro/商业模型/current/native操作。**本结论为九个首跑有效子组 + 一个定向复验子组，不是首跑全通过或第二次全套重跑。**需要B集成，用户现有r2未因此改变。

首跑：10子组9通过1失败；TAP包含父聚合总11项，pass9/fail2。唯一组5在旧任务已完成、stop已settle后，下一次发送点击被暂停测试时钟下不消失的toast遮住；实际定位已visible/enabled/stable，失败是QA夹具时钟与点击路径，不是已确认产品缺陷。首TAP完整保留后置。按QA Lead允许只把该组下一发送改为已启用composer的真实fill+Enter，无force click、不改业务期望；其余9组没有修改或重跑。

定向复验：`SPROUT_SESSION_QA_CASE=stop-before-service`，原组5真实执行5095.6655ms且TAP **ok 5，无SKIP**；父+目标组pass2/fail0，另外9组显式skip且注明复用首轮，不是0-test。实际退出0，耗时5623.3952ms。正常全量命令不设该filter；任何其它filter值拒绝。两段完整TAP均保存在本报告，禁止删除首失败。

| 有效场景 | 证据来源 | 实际通过范围 |
| --- | --- | --- |
| 1 preflight/草稿/C/迟到完成 | 首跑组1 | 挂住全部settings后A原需求不随切换变更；B/C独立草稿、新建可输入；A所属stream/status；done/finally不抢active；旧ready动态HTML控件实际输入点击 |
| 2 独立锁/选中停止/迟到error | 首跑组2 | A/B并行、重复Enter仅一次B run；独立锁；切换不stop，选中B仅停止B且A继续；A错误回A保留，不污染B草稿 |
| 3 迟到files/runtime/poll | 首跑组3 | 浏览器JSON真实resolve+两帧调度标记后再核B SOURCE正文本/active/草稿；A runtime所属错误切回可见，迟到回执不污染B；真实1秒list poll响应不抢active |
| 4 首版与初始化 | 首跑组4 | 准备期真实准备语义；首版制作覆盖旧初始化interrupted文案，严格无iframe/ready=false/init interrupted；失败诚实无可用预览 |
| 5 stop尚未到服务 | 定向组5 | 请求前gate下旧A已completed且UI消费其完成；stopping锁住A但B导航输入正常，无新服务run；stopsettle后新A run实际进入agent，未被旧stop中止、状态不被旧提示覆盖 |
| 6 服务已处理stop、响应延迟 | 首跑组6 | service stop实际处理且旧A task stopped；客户端收到响应前不注册新run，settle后新run可启动、signal未abort、B草稿保留 |
| 7/8 接受头前HTTP400/网络失败 | 首跑组7/8 | 没有agent执行；A完整原草稿含首尾空格保留；B草稿独立；迟到finally GET消费后不覆盖A后来编辑的新草稿 |
| 9/10 无task同revision旧GET | 首跑组9/10 | 真实preparing快照延迟；通过实际build失败或cancelPreparation后空prompt被400拒绝产生failed/interrupted，无task/无agent/revision0；新poll终态已消费再放旧GET，状态不退回preparing |

浏览器 `startIds/stopIds` 是请求记录；服务事实另由注入agent的实际runs、controller.signal、持久Store task状态及gate.route.fetch返回证明，未混称。动态HTML为本轮临时夹具，非Taro产物；注入agent不代表商业模型业务完成。

两次源/资源完全相同：index.html `c495c52ffad07972414db8f9b1b464c84a384d7d568b28f986f8a82b09e5d2ce`；index-346f283a.js `7553384fbda66e71b0e61dbca3a3fd92c717f0884dc99a0d57b9c1420267d01f`；index-4178fc67.css `4178fc67a20093a8426b935a30da7212f2ff4168761ca689a62367366270d057`。src/server全tracked源摘要见两段TAP。来源manifest为该树 `test-results/session-navigation-dist-manifest.json`，仅复用writer唯一Vite。

最终仓库测试冻结SHA256：

- `tests/qa/session-navigation-fixture.mjs`：`ae2c6902784f97417d5dd1e06ebc5a95e40d84632cc4593f3b8cc18bb87aa71e`。
- `tests/qa/session-navigation-journey.test.mjs`：`97b39526d3df789943781c84f8c08d49a4e8880130e9ae59362c31f3e672166d`。

两个语法check与纯fixture self-check已通过，门控纯自检含release-during-fetch。首跑和复验每个实际场景均在finally await关闭自己的Edge与startStudio服务，并核绝对OS temp专属根后删除；若清理失败该子测试会失败，当前有效场景清理均完成。没有留下本代理产品/浏览器运行，也不承诺后台运行。

性能仅有模拟轨迹分段elapsed，不能据此推断Taro或真实制作速度。本包未验证真实模型、原生Electron、正常current配置、微信端或完整用户业务；这些不被十场景通过覆盖。继续负责人QA Lead/B，已归还QA唯一writer，由Lead复审并交B集成，不再运行或写产品。

## 历史准备记录（保留原文，非当前状态）

2026-10-09。独立执行者 `/root/qa_preview`，非产品实现者；继续负责人 QA Lead，最终 B 验收。授权来源：用户 AGENTS 内部协作与持续回归授权、TASKS 最新制作中无法切会话/新建及预览矛盾报告、B 的 SESSION-NAVIGATION 工作包，经 QA Lead 派发。

已读 HANDBOOK、TASKS、PRODUCT 和 `docs/coordination/work-packages/STUDIO-002-SESSION-NAVIGATION.md`。产品唯一 writer 在 `D:/app/.worktrees/studio-002-session-navigation`、分支 `codex/studio-002-session-navigation`，基线 `1e86ca155e3c1378245e80c9fac7bf43b89b89a3`；准备时仍有未冻结改动。当前不是产品验收结论。

本代理仅新增 `tests/qa/session-navigation-journey.test.mjs`、`tests/qa/session-navigation-fixture.mjs` 和本报告；未改既有 QA、input_assert_qa 文件、产品、工作包或台账，没有提交/合并/推送。没有启动产品、startStudio、Edge、服务、模型、Vite、Taro、原生窗口，也未附着 current/r2/API50276 或读取用户配置。纯夹具自检不导入产品/Playwright。

## 冻结执行合同

测试不构建、不拷贝产物、不回退旧 root/dist。B 需给完整40位 source SHA、工作树干净及该版本的一次独立 Vite dist，优先复用 writer 一次构建。QA Lead 明确放行后才执行；准备阶段不得直接运行测试入口。

参数：`SPROUT_SESSION_QA_ROOT=D:/app/.worktrees/studio-002-session-navigation`；`SPROUT_SESSION_QA_SHA=<40hex>`；`SPROUT_SESSION_QA_DIST_MANIFEST=<绝对JSON路径>`，建议 manifest 在该树 `test-results/session-navigation-dist-manifest.json`。

最小 JSON：

```json
{
  "sourceCommit": "完整40位冻结SHA",
  "root": "D:/app/.worktrees/studio-002-session-navigation",
  "files": [
    {"file": "dist/index.html", "sha256": "64位SHA256"},
    {"file": "dist/assets/index-实际名.js", "sha256": "64位SHA256"},
    {"file": "dist/assets/index-实际名.css", "sha256": "64位SHA256"}
  ]
}
```

执行命令：`node --test --test-timeout=120000 tests/qa/session-navigation-journey.test.mjs`，由正常 require_escalated 执行，依赖 Store 测试 junction 与自有 Edge。三个参数全缺时明确 skip；部分缺失、非绝对路径、未知 root、HEAD 不同、tracked diff、src/server untracked 产品模块、manifest 版本/root 不同、资产列表不恰等 index 所引用 JS/CSS、三文件任一 hash 不等全部拒绝。既有 STUDIO_URL/ROOT/WORKSPACE、SPROUT_TEST_PACKAGE、SPROUT_CONFIG_DIR、ELECTRON_USER_DATA_DIR 会拒绝附着。

动态产品 import 在通过上述门后才发生，来自精确工作树。打印 src/server 所有 tracked 文件摘要、dist 摘要及 SHA，不输出 token/占位设置值。每组独立 OS temp root、随机端口、注入 agent 和动态 HTML（不是 Taro/真实模型）；只在本轮内存接口写占位配置，不读取历史配置。finally 关闭本轮浏览器/服务，核实绝对临时根在 OS temp 且有专属前缀后仅清理该根。

## 已准备轨迹源码（全部待实际验证）

| 组 | 确定门控与强断言 | 状态 |
| --- | --- | --- |
| SN1 preflight/草稿/迟到完成 | arm 后挂起全部 settings GET，实际 A 发送且无 run；切 B 填独立草稿、新建 C 可输入，统一释放设置；A run 的 prompt 必须原 A 需求，B/C 无污染、无 stop；A late text/status 只属 A，切回 A 真正看到流/进度，旧 ready iframe实际填入点击仍正常；切 B/C后 A done 及 finally GET 不抢 active，A最终消息只属A | 源码准备，待冻结执行 |
| SN2 独立锁/停止/error | A/B分别运行，B连续键盘提交不能多一条 run；A/B各自锁；切换不 stop/abort，选中 B 停止仅 B id 且A signal未abort；A late error/finally不抢B或覆盖B草稿，回A看到自己的错误 | 源码准备，待冻结执行 |
| SN3 files/runtime/poll | fixture分别写 A/B SOURCE 标记到各自真正 src/page 文件，延迟A files，B代码已加载后放A，B代码不污染；真实iframe发所属A runtime消息，延迟回执后切B，B不显示A错误；控制真实hook的 projects list轮询返回，不抢active，切A仍见所属错误 | 源码准备，待冻结执行 |
| SN4 首版/初始化 | UI新建C，无iframe且尚无可用版本；制作取消初始化后，persisted interrupted仍保留，实际UI显示首版制作且不说准备中断，无假ready/版本；失败后仍无可用iframe并诚实未完成 | 源码准备，待冻结执行 |

不以具体 preflight 文案作门：使用 settings 请求已挂起、无 run、project id/草稿事实。实际冻结后的预览语义文案和 `.project-item`/`.breadcrumb` 等选择器需核对，合同不符先报 QA Lead/B，不猜测放宽期待。

Playwright 依赖只有 playwright-core，没有 @playwright/test。新夹具提供小型 `expect.poll` 对明确可观察条件进行有期限轮询，不以任意 sleep 推测事件顺序；浏览器 clock 按真实 hook 定时器推进。准备所读 hook 为无条件 `setTimeout(poll,1000)`，故 SN3 推进1000ms；冻结后必须重新核对，不为造不存在的 poll 伪造产品行为。

所有单项控件用语义或项目ID确定归属并 count===1，不使用 first/nth。settings 周期刷新与 preflight GET 不可区分，因此挂起所有已接管 settings 再统一释放。responseGate 在 route.fetch 前登记 release/delivered，release等待全部已接管handler完成，避免 fetch 返回晚于 release 的挂起竞态。

性能只记录轨迹实际分段 elapsedMs；模拟 HTML/注入 agent 时间不是 Taro 构建、商业制作或历史性能基线。预览尺寸/控制属于本包关联检查，二维码像素扫码、微信运行、商业业务和最终桌面包不在本静态准备结论内。

## B 新增三项：冻结执行前必须补齐

以下是 B review 后新增合同，已登记但暂未写入动态轨迹。不能拿上述四组通过替代；当前 hook 仍在修改，冻结后由 QA Lead 续派本代理最小补齐再执行。

1. **迟到 stop 不能误停下一 run**：增加请求到达服务之前的 stop gate，并另测服务已处理但响应晚到的 gate。A旧run先done，尝试下一send；旧stop未settle时按最终合同应阻止新run进入服务，不能把停止旧任务的请求打到新run。释放后下一run可启动，旧stop响应/错误不能覆盖新entry状态或草稿。需B确认最终是UI禁用还是send内门控；测试以实际run/stop id、对应controller/entry及状态为准，不猜按钮形态。
2. **run header/onStarted前拒绝/网络失败保草稿**：在本测试自有route挂住A `/run`，分别HTTP400及网络失败、均不触发注入agent；期间切B改草稿/C，失败后A原prompt仍在，不污染B/C。再挂住A finally读取窗口，A可编辑时输入新草稿，释放旧响应后不覆盖新编辑。明确区分失败前后的可编辑时机，冻结代码合同不支持时先报B，不模拟不可操作UI。
3. **同revision初始GET不可倒退新初始化状态**：新建未ready项目，挂起早期单项目GET并捕获preparing快照；通过真实初始化gate失败或显式取消形成failed/interrupted且revision不变，按真实poll计时拿到新状态后才放旧GET。断言UI/缓存仍failed/interrupted而非preparing，不只断言active未改变。使用无task分支，不混入制作task提高epoch而掩盖问题。

## 静态证据与交接

准备检查仅为：`node --check tests/qa/session-navigation-fixture.mjs`、`node --check tests/qa/session-navigation-journey.test.mjs`、`node tests/qa/session-navigation-fixture.mjs --self-check`。纯自检覆盖 Deferred、条件poll、合法manifest及版本/root/额外资产/hash拒绝、release发生于fake route.fetch未完成时仍最终完成；fake page/route为纯对象，不导入产品、不建立网络、不创建浏览器。

冻结执行依赖：B给精确SHA与dist manifest；QA Lead增量只读复审；补齐上述三条最终合同；明确放行后单次运行并保留首失败。恢复入口为本报告和两个新测试文件，结果回 QA Lead/B。当前无运行中的产品或QA浏览器，无后台待机承诺；源码准备结束即归还唯一QA writer。

### QA Lead/B 准备末轮意见（执行前必改）

- files/runtime/poll 的 `route.fulfill` 完成只证明回执已发送，紧接着 active 仍为B可能过早。冻结执行前须增加浏览器接收/消费证据（例如仅本测试page的fetch.json消费标记、相应后续请求/DOM事实和React调度完成屏障），然后再断言active/代码不被旧回执污染；不能把当前静态四组直接当充分动态证据。done/error已有noSidebarRun与最终项目消息/错误正事实，仍需实际复验。
- SN4 当前 `.preview-bottom` 包含总栏“尚无可用版本”，但状态helper的footer可为“尚无可用预览”或“正在制作 · 预览尚未就绪”。冻结后改为检验制作中且无ready的语义，不因未约定的完整文案制造产品缺陷；无iframe、不称“预览准备已中断”、persisted ready=false/init interrupted保持严格断言。
- 以上两项连同B新增三项共同作为续派补齐清单。当前仅静态源码和纯自检，不运行产品来猜测稳定合同，也不声称已充分验收。

## 冻结25d66c1独立首跑原始TAP（保留，不覆盖）

本轮按B明确放行，先由测试完整校验冻结HEAD/clean/untracked产品模块/三个dist SHA；五项补齐已静态完成，纯检查通过。fixture SHA ae2c6902784f97417d5dd1e06ebc5a95e40d84632cc4593f3b8cc18bb87aa71e；journey SHA 060263101fb6a90a344ff86d7957658001f34a11ee7b25206fc7d00034e5f776。startIds/stopIds为浏览器请求计数，agent runs/store terminal/route.fetch已返回为服务事实，两者不混称。完整TAP直接保留在本报告，未新增其它日志路径。

```text
TAP version 13
# Subtest: independent project session navigation against explicitly frozen source and dist
    # Subtest: preflight ownership, drafts, new C, late text/done/finally, and old ready interaction
    ok 1 - preflight ownership, drafts, new C, late text/done/finally, and old ready interaction
      ---
      duration_ms: 6752.2229
      type: 'test'
      ...
    # Subtest: independent project locks, duplicate gate, selected stop, late error and finally
    ok 2 - independent project locks, duplicate gate, selected stop, late error and finally
      ---
      duration_ms: 4062.667
      type: 'test'
      ...
    # Subtest: late files, runtime receipt and project polling preserve active B and code ownership
    ok 3 - late files, runtime receipt and project polling preserve active B and code ownership
      ---
      duration_ms: 3894.964
      type: 'test'
      ...
    # Subtest: first-version working overrides interrupted initialization without pretending ready
    ok 4 - first-version working overrides interrupted initialization without pretending ready
      ---
      duration_ms: 3634.8965
      type: 'test'
      ...
    # Subtest: stop in-flight blocks next run: request not at service
    not ok 5 - stop in-flight blocks next run: request not at service
      ---
      duration_ms: 33845.4759
      type: 'test'
      location: 'D:\\app\\tests\\qa\\session-navigation-journey.test.mjs:64:49'
      failureType: 'testCodeFailure'
      error: |-
        locator.click: Timeout 30000ms exceeded.
        Call log:
        [2m  - waiting for getByTitle('发送消息', { exact: true })[22m
        [2m    - locator resolved to <button title="发送消息" class="send-button">…</button>[22m
        [2m  - attempting click action[22m
        [2m    2 × waiting for element to be visible, enabled and stable[22m
        [2m      - element is visible, enabled and stable[22m
        [2m      - scrolling into view if needed[22m
        [2m      - done scrolling[22m
        [2m      - <div class="toast">…</div> intercepts pointer events[22m
        [2m    - retrying click action[22m
        [2m    - waiting 20ms[22m
        [2m    2 × waiting for element to be visible, enabled and stable[22m
        [2m      - element is visible, enabled and stable[22m
        [2m      - scrolling into view if needed[22m
        [2m      - done scrolling[22m
        [2m      - <div class="toast">…</div> intercepts pointer events[22m
        [2m    - retrying click action[22m
        [2m      - waiting 100ms[22m
        [2m    57 × waiting for element to be visible, enabled and stable[22m
        [2m       - element is visible, enabled and stable[22m
        [2m       - scrolling into view if needed[22m
        [2m       - done scrolling[22m
        [2m       - <div class="toast">…</div> intercepts pointer events[22m
        [2m     - retrying click action[22m
        [2m       - waiting 500ms[22m

      code: 'ERR_TEST_FAILURE'
      name: 'TimeoutError'
      stack: |-
        send (D:\app\tests\qa\session-navigation-fixture.mjs:96:134)
        async file:///D:/app/tests/qa/session-navigation-journey.test.mjs:76:7
        async isolatedStudio (D:\app\tests\qa\session-navigation-fixture.mjs:73:5)
        async TestContext.<anonymous> (D:\app\tests\qa\session-navigation-journey.test.mjs:64:41)
      ...
    # Subtest: stop in-flight blocks next run: service processed, response delayed
    ok 6 - stop in-flight blocks next run: service processed, response delayed
      ---
      duration_ms: 4018.3812
      type: 'test'
      ...
    # Subtest: run rejected before headers preserves draft and later edit: http
    ok 7 - run rejected before headers preserves draft and later edit: http
      ---
      duration_ms: 3412.9866
      type: 'test'
      ...
    # Subtest: run rejected before headers preserves draft and later edit: network
    ok 8 - run rejected before headers preserves draft and later edit: network
      ---
      duration_ms: 3311.4229
      type: 'test'
      ...
    # Subtest: no-task same-revision delayed preparing GET cannot regress failed initialization
    ok 9 - no-task same-revision delayed preparing GET cannot regress failed initialization
      ---
      duration_ms: 3574.8535
      type: 'test'
      ...
    # Subtest: no-task same-revision delayed preparing GET cannot regress interrupted initialization
    ok 10 - no-task same-revision delayed preparing GET cannot regress interrupted initialization
      ---
      duration_ms: 4078.7115
      type: 'test'
      ...
    1..10
not ok 1 - independent project session navigation against explicitly frozen source and dist
  ---
  duration_ms: 71018.69
  type: 'test'
  location: 'D:\\app\\tests\\qa\\session-navigation-journey.test.mjs:13:1'
  failureType: 'subtestsFailed'
  error: '1 subtest failed'
  code: 'ERR_TEST_FAILURE'
  ...
# {"sourceCommit":"25d66c1cd2ecfa96b31b18d618b0e791e512b5b7","root":"D:\\\\app\\\\.worktrees\\\\studio-002-session-navigation","dist":[{"file":"dist/index.html","sha256":"c495c52ffad07972414db8f9b1b464c84a384d7d568b28f986f8a82b09e5d2ce"},{"file":"dist/assets/index-346f283a.js","sha256":"7553384fbda66e71b0e61dbca3a3fd92c717f0884dc99a0d57b9c1420267d01f"},{"file":"dist/assets/index-4178fc67.css","sha256":"4178fc67a20093a8426b935a30da7212f2ff4168761ca689a62367366270d057"}],"sourceHashes":[{"file":"server/agent.mjs","sha256":"5f6bb9c4aa6df829b85a914c4a81aa8a2346f1b97dd9dd17c5110cf47e6661ee"},{"file":"server/builder.mjs","sha256":"083b2a56a4468335ac4ffa219b1e6660b128e24a77940e2c058f287044b78cda"},{"file":"server/harness.mjs","sha256":"32800242ae5c188d8370239e30fa7c106170634d44d9ab269f5041376a5a5e4c"},{"file":"server/index.mjs","sha256":"0741803d13ac97ec99198797f89a6f231856a968423ec4fd9030c706e4bfd519"},{"file":"server/network.mjs","sha256":"fd1c24d7bf581ec0552af298d1cc29bb061c248a325e31ea7630ef48e7d3ec0c"},{"file":"server/preview-bridge.mjs","sha256":"7994b50e1b03564945311179da5a15e07dd53d7a734d34c695c7f46cfc7a5738"},{"file":"server/store.mjs","sha256":"3f31d68c0ccf0674e63231f812acd86690af9d33adf80cf2e8325af349391005"},{"file":"server/studio-client.mjs","sha256":"eb9fd71fe47de8b071de308e2783068b56fd783b473b821c68ea3a43d1118b22"},{"file":"server/verify.mjs","sha256":"51df7f4074ece2d852395462b97bf769dd99d40093c504486c3647f4e20eef46"},{"file":"server/wechat.mjs","sha256":"a52bfe8bd5ac87780fc3bd308e74fe183d619f9067e463b22430a848a1083f1e"},{"file":"src/main.jsx","sha256":"33bfc7dfea68b2b5b835c22239f225d16448f976d2bf09dea25130cdac97ddd5"},{"file":"src/project-preview-state.mjs","sha256":"b64efb81ccdd62df63f6f1aa27082fe8c221915d495a0892f9692a0c69d2a5aa"},{"file":"src/style.css","sha256":"f3304852aedaeab9830a8a853b662b7f509589a674ace4f1cd07f26a9446d1e2"},{"file":"src/use-project-sessions.jsx","sha256":"bd1029f8437267bc1d981b5b1a04a4fa91733b869f0c955f1bf3cc3842a426e8"}],"preview":"QA dynamic HTML, not Taro","agent":"injected local agent, no model requests"}
# {"group":"preflight/late completion","elapsedMs":1268}
1..1
# tests 11
# suites 0
# pass 9
# fail 2
# cancelled 0
# skipped 0
# todo 0
# duration_ms 71189.304
```

## 同冻结版本组5定向复验原始TAP

首跑唯一组5被暂停时钟下不消失toast遮挡，未放宽业务预期；按QA Lead允许仅该组下一发送改为已启用composer的真实fill+Enter，无force click。加入SPROUT_SESSION_QA_CASE=stop-before-service精确过滤，其它9组明确skip，复用首轮有效证据。journey最终SHA97b39526d3df789943781c84f8c08d49a4e8880130e9ae59362c31f3e672166d，fixture不变ae2c6902784f97417d5dd1e06ebc5a95e40d84632cc4593f3b8cc18bb87aa71e。

```text
TAP version 13
# Subtest: independent project session navigation against explicitly frozen source and dist
    # Subtest: preflight ownership, drafts, new C, late text/done/finally, and old ready interaction
    ok 1 - preflight ownership, drafts, new C, late text/done/finally, and old ready interaction # SKIP Explicit targeted retry: first-run passed scenario evidence retained, not repeated
      ---
      duration_ms: 0.6753
      type: 'test'
      ...
    # Subtest: independent project locks, duplicate gate, selected stop, late error and finally
    ok 2 - independent project locks, duplicate gate, selected stop, late error and finally # SKIP Explicit targeted retry: first-run passed scenario evidence retained, not repeated
      ---
      duration_ms: 0.1572
      type: 'test'
      ...
    # Subtest: late files, runtime receipt and project polling preserve active B and code ownership
    ok 3 - late files, runtime receipt and project polling preserve active B and code ownership # SKIP Explicit targeted retry: first-run passed scenario evidence retained, not repeated
      ---
      duration_ms: 0.0839
      type: 'test'
      ...
    # Subtest: first-version working overrides interrupted initialization without pretending ready
    ok 4 - first-version working overrides interrupted initialization without pretending ready # SKIP Explicit targeted retry: first-run passed scenario evidence retained, not repeated
      ---
      duration_ms: 0.0744
      type: 'test'
      ...
    # Subtest: stop in-flight blocks next run: request not at service
    ok 5 - stop in-flight blocks next run: request not at service
      ---
      duration_ms: 5095.6655
      type: 'test'
      ...
    # Subtest: stop in-flight blocks next run: service processed, response delayed
    ok 6 - stop in-flight blocks next run: service processed, response delayed # SKIP Explicit targeted retry: first-run passed scenario evidence retained, not repeated
      ---
      duration_ms: 0.3202
      type: 'test'
      ...
    # Subtest: run rejected before headers preserves draft and later edit: http
    ok 7 - run rejected before headers preserves draft and later edit: http # SKIP Explicit targeted retry: first-run passed scenario evidence retained, not repeated
      ---
      duration_ms: 0.1588
      type: 'test'
      ...
    # Subtest: run rejected before headers preserves draft and later edit: network
    ok 8 - run rejected before headers preserves draft and later edit: network # SKIP Explicit targeted retry: first-run passed scenario evidence retained, not repeated
      ---
      duration_ms: 0.1692
      type: 'test'
      ...
    # Subtest: no-task same-revision delayed preparing GET cannot regress failed initialization
    ok 9 - no-task same-revision delayed preparing GET cannot regress failed initialization # SKIP Explicit targeted retry: first-run passed scenario evidence retained, not repeated
      ---
      duration_ms: 0.2561
      type: 'test'
      ...
    # Subtest: no-task same-revision delayed preparing GET cannot regress interrupted initialization
    ok 10 - no-task same-revision delayed preparing GET cannot regress interrupted initialization # SKIP Explicit targeted retry: first-run passed scenario evidence retained, not repeated
      ---
      duration_ms: 0.2017
      type: 'test'
      ...
    1..10
ok 1 - independent project session navigation against explicitly frozen source and dist
  ---
  duration_ms: 5470.8885
  type: 'test'
  ...
# {"sourceCommit":"25d66c1cd2ecfa96b31b18d618b0e791e512b5b7","root":"D:\\\\app\\\\.worktrees\\\\studio-002-session-navigation","dist":[{"file":"dist/index.html","sha256":"c495c52ffad07972414db8f9b1b464c84a384d7d568b28f986f8a82b09e5d2ce"},{"file":"dist/assets/index-346f283a.js","sha256":"7553384fbda66e71b0e61dbca3a3fd92c717f0884dc99a0d57b9c1420267d01f"},{"file":"dist/assets/index-4178fc67.css","sha256":"4178fc67a20093a8426b935a30da7212f2ff4168761ca689a62367366270d057"}],"sourceHashes":[{"file":"server/agent.mjs","sha256":"5f6bb9c4aa6df829b85a914c4a81aa8a2346f1b97dd9dd17c5110cf47e6661ee"},{"file":"server/builder.mjs","sha256":"083b2a56a4468335ac4ffa219b1e6660b128e24a77940e2c058f287044b78cda"},{"file":"server/harness.mjs","sha256":"32800242ae5c188d8370239e30fa7c106170634d44d9ab269f5041376a5a5e4c"},{"file":"server/index.mjs","sha256":"0741803d13ac97ec99198797f89a6f231856a968423ec4fd9030c706e4bfd519"},{"file":"server/network.mjs","sha256":"fd1c24d7bf581ec0552af298d1cc29bb061c248a325e31ea7630ef48e7d3ec0c"},{"file":"server/preview-bridge.mjs","sha256":"7994b50e1b03564945311179da5a15e07dd53d7a734d34c695c7f46cfc7a5738"},{"file":"server/store.mjs","sha256":"3f31d68c0ccf0674e63231f812acd86690af9d33adf80cf2e8325af349391005"},{"file":"server/studio-client.mjs","sha256":"eb9fd71fe47de8b071de308e2783068b56fd783b473b821c68ea3a43d1118b22"},{"file":"server/verify.mjs","sha256":"51df7f4074ece2d852395462b97bf769dd99d40093c504486c3647f4e20eef46"},{"file":"server/wechat.mjs","sha256":"a52bfe8bd5ac87780fc3bd308e74fe183d619f9067e463b22430a848a1083f1e"},{"file":"src/main.jsx","sha256":"33bfc7dfea68b2b5b835c22239f225d16448f976d2bf09dea25130cdac97ddd5"},{"file":"src/project-preview-state.mjs","sha256":"b64efb81ccdd62df63f6f1aa27082fe8c221915d495a0892f9692a0c69d2a5aa"},{"file":"src/style.css","sha256":"f3304852aedaeab9830a8a853b662b7f509589a674ace4f1cd07f26a9446d1e2"},{"file":"src/use-project-sessions.jsx","sha256":"bd1029f8437267bc1d981b5b1a04a4fa91733b869f0c955f1bf3cc3842a426e8"}],"preview":"QA dynamic HTML, not Taro","agent":"injected local agent, no model requests"}
1..1
# tests 11
# suites 0
# pass 2
# fail 0
# cancelled 0
# skipped 9
# todo 0
# duration_ms 5623.3952
```
