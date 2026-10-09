# STUDIO-002 包2独立QA：配置与CLI

日期：2026-10-09（北京时间）。执行者：QA Lead子代理 /root/qa_config_cli；上报 /root（QA Lead），最终验收 B 01a11ebf-e71e-71c0-97a1-86bcff83f324。

## 当前结论与授权

最新残余独立验证版本：ccae82b131abe30a7b9cc682c1b18712830d8dce；11个实际CLI命令覆盖6项残余路径，真实TTY隐藏输入另通过。原始残余脚本在最后mock宿主死PID lease断言failed，该宿主没有Electron清理器，未据此认定产品失败；证据与手动清理记录保留，下文详述。此前核心独立验收版本：13149253d1a0f5fb0d0f9c710b988d5c62b97660。核心25个实际CLI命令已有独立成功操作证据，另native-only的5个原生配置命令通过，覆盖Windows DPAPI占位保存、重开恢复、profile隔离及清除。完整CLI脚本的整体failed来自QA漏传隔离env及后续硬断言拦截，不能写成产品通过或产品缺陷；失败与误启动事件全部保留在下文。固定包隔离GUI两窗口/跨exe目录已新增5项原生通过证据（testHead 6a6481c，产品ccae82b）；默认current全部入口与不同产品版本升级仍待整体核验。本代理执行已结束，无需重复现有有效证据。

## 历史：冻结前准备状态与授权

仅完成只读准备，未执行测试、构建、服务启动或模型请求，未判通过。用户AGENTS/TASKS授权项目内部独立QA；本次父任务限定只写本报告。未读取任何用户配置、旧vault或密钥；未操作旧服务/用户项目。产品和测试预期均未修改。

对象 D:/app/.worktrees/studio-002-config-cli，HEAD ae0d8af940c3aa5392e2ef2df70c28818e28539a。读取时工作树未冻结：electron/main.cjs 修改，electron/profile.cjs、server/studio-client.mjs 未跟踪；没有CLI入口交付，package.json尚未增加CLI命令。此为开发中快照，不能当最终缺陷或完成版本。恢复须重新取HEAD、明确文件清单和摘要。

## 独立覆盖与操作证据

| ID | 操作与独立判据 | 现状/依赖 |
| --- | --- | --- |
| C01 | 正常双击交付exe，记录实际资源hash、默认profile位置；占位配置在正常UI保存，公开hasKey/persisted/encrypted为真，密码不回填 | 待固定包，QA Lead集中协调实际UI |
| C02 | 同一次保存后开第二窗口、新建两个项目，两个窗口读取同model/endpoint且hasKey为真；修改设置后另一窗口刷新一致 | 待Electron隔离profile/端口分配 |
| C03 | 正常退出所有窗口、从同一正常入口重开；项目/数据/公开配置恢复。换下一包exe仍相同稳定profile；无需特制cmd | 待固定两份包；禁止旧vault迁移 |
| C04 | 显式profile A/B各存不同自造占位；A新窗口复用A，B与A独立；绝对路径验证；相同profile不同显式workspace不串读/不静默无响应 | 待运行许可；重点检查单实例归属 |
| C05 | 无加密后端/损坏本轮测试vault/保存失败：固定错误不含占位，保留原有效设置，磁盘无明文；清除key后重开仍无key但endpoint保留 | 可复用credential单测，原生Windows另验 |
| C06 | CLI help与未知参数、status/bootstrap、配置查询/保存/清除/连接测试、项目列举/创建/详情、run/modify、任务进度/stop/resume、verify、restore、export依实际命令逐项执行 | CLI尚未交付；不得用client调用替代命令证据 |
| C07 | 密钥仅stdin或安全交互，不接受argv；父子命令行/标准输出/标准错误/日志/报告/项目设置/导出包不出现自造占位；token不随连接错误泄露 | 待CLI入口；只扫描本轮测试数据，不读历史配置 |
| C08 | CLI与UI针对同隔离项目观察相同revision、task状态、业务产物、验证结果；假PI门控成功/失败与停止，不另建agent/build实现 | 待冻结源码及PI模拟注入方式 |
| C09 | CLI连接已运行UI、UI连接CLI自启服务；CLI退出/SIGINT/EOF/超时/坏响应/断流/无效项目/旧session文件处理；退出码诚实，所有归属子进程与session文件清理 | 待统一服务生命周期契约；不kill未知进程 |
| C10 | 独立真实UI正常历程：一次配置→新项目输入→生成→375×720操作→连续修改→有界修复→导出→正常重开 | 由QA Lead集成后唯一真实模型操作；本包CLI不能替代UI |

所有项当前待验证。仅允许自造占位和模拟PI；真实编译与端口由QA Lead统一分配，避免重复。总预算40工具/3build/3actualverify/10分钟及恢复继承由集成验收统一计量。

## 可复用历史脚本与覆盖缺口

- tests/credentials.test.mjs：覆盖加密适配器占位保存、重开/清除/隔离、损坏及写失败、设置序列化、制作等待保存、运行时拒绝清除、无适配器仅内存。使用随机AES替代safeStorage，**不证明Windows原生加密或正常默认启动**。会启动HTTP服务，当前未执行。
- tests/desktop-close.test.mjs：覆盖关闭栅栏、存储排空、恢复读源码时关闭避免晚注册任务。会启动服务，待统一许可。
- scripts/harness-package-smoke.mjs：可复用manifest逐文件核对与实际exe启动退出，现强制显式目录/特定初始结果，不覆盖正常默认profile、多窗口或CLI。
- scripts/package-desktop.mjs：固定资源仅枚举electron/server/templates/agent-skills/package.json；新CLI若位于其他目录必须实际入包并进manifest，不能只在源码npm运行通过。
- 当前package.json版本0.1.0，Electron ^38.0.0，PI 0.99.1；本次只读审计未更改依赖或调研实现方案。

## 开发中重点风险（尚非确认缺陷）

1. electron/main.cjs以userData申请单实例，second-instance在workspace不同直接return。显式相同userData不同workspace时第二次启动是否静默退出需动态查验；profile/workspace错误归属不能混同为隔离通过。
2. studio-client.run的finally目前只有reader.releaseLock；消费者中断迭代、CLI终止时需证明主动取消或stop契约，不留后台制作。网络错误目前统一描述，需区分用户主动停止与失败，保留诚实退出码。
3. profile.endpoint含本机token，是本次会话文件，不得写报告或CLI常规输出；错误/异常退出留下旧文件时须验证不可误连其他服务。Windows的mode/chmod不能单靠代码参数证明ACL安全。
4. CLI入口尚未出现；打包脚本默认不复制任意cli目录且删生产scripts，最终命令路径与包内独立可用性需实际核对。
5. seed:!headless使纯CLI启动不初始化示例；从CLI服务再开UI时bootstrap初始化/首屏行为须与包1协同验证，避免把无示例误判失败。

## 接续条件与恢复

QA Lead需提供：冻结commit及文件hash；CLI命令清单/预期退出码；自启服务/既有UI连接与退出契约；分配本轮独立测试profile/工作区/端口与可启动范围；模拟PI注入方法；唯一真实构建和最终包manifest。收到冻结后依C04/C06-C09优先验证并上报原命令、版本、实际/预期与原始失败证据，再由开发者修复，QA不改产品或测试预期。

本报告是准备交付，不表示后台测试在运行；继续负责人QA Lead，执行代理可由其复用唤醒。总台账由A维护，本代理不写。

## 2026-10-09 冻结版本独立执行补充

- 对象 HEAD 13149253d1a0f5fb0d0f9c710b988d5c62b97660，执行前git status干净；读取包2实施证据、CLI文档与22/22工程记录。未修改产品或测试预期。
- 独立证据（冻结版本相同）：D:/app/test-results/studio-002-qa-config-cli-partial-25commands.json：25个真实CLI子进程命令的输入类型、输出、退出码。成功覆盖help、config status/save/test、本机模拟连接测试、项目create/list/show、run失败/错误脱敏、resume、repair、运行中progress、stop及旧revision保留、真实Edge点击业务操作verify并绑定digest/revision、export ZIP标志/拒覆盖、restore新revision且pending、错误业务检查非零、无效项目/任务/JSON/命令/key选项拒绝。所有这些命令均有正确隔离env；25项结束后硬断言在另一个漏env的QR命令spawn前阻止，报告整体failed为QA脚本缺陷，不能将整体failed改为产品passed。
- 原生证据：D:/app/test-results/studio-002-qa-config-cli-report.json，native-only补验5个实际CLI命令成功（config save/status，另一profile status，clear/status）。真实Electron safeStorage DPAPI、自造占位仅stdin，公开encrypted/persisted/hasKey正确；本轮vault bytes无占位明文；A重开恢复、B无key、清除后endpoint保留；A/B发现文件及lease均清理。此报告passed只指native-only分支，不覆盖未执行完整UI。
- 检查脚本：D:/app/test-results/studio-002-qa-config-cli-check.mjs；默认完整分支保留，但本轮最后执行的是 --native-only，复用前述25命令证据以避免重复真实浏览器检查。每个后续CLI启动硬性要求本轮根目录内绝对STUDIO_USER_DATA_DIR和STUDIO_WORKSPACE_DIR。
- C06主要命令、C07 stdin输出保护、C08失败/停止/真实业务verify、C09正常CLI lease清理已独立验证上述具体范围。C01/C02/C03最终正常UI/多窗口/升级仍待QA Lead集成验证；TTY隐藏输入、强杀异常清理、错误断流、同profile不同workspace拒绝尚仅工程证据，无新增独立通过结论。二维码非法计划本轮硬断言阻止spawn，仍复用22/22工程证据，未算独立通过。未发现确认的包2产品缺陷。

### QA脚本失败与误启动事件（保留，不算产品失败）

1. 首次沙箱运行Store.init依赖junction EPERM，记录studio-002-qa-config-cli-first-failure.json；曾以空node_modules目录诊断，未据此判Store路径通过。之后正常require_escalated获准并恢复正常junction路径。
2. 沙箱内父子loopback连接失败，second-failure/third-failure保留；正常审批后config附着通过，后加saved闭包断言证明CLI连接的是自造服务。
3. 两次获准脚本在projects create漏传env，继承父环境并尝试默认入口自启，40秒超时；approved-timeout/isolation-failure保留。未读取默认profile配置、vault或值；无真实模型调用。可能发生默认seed/项目实际编译尝试，具体次数/产物未核实，**不得声称全程隔离或0实际编译**。这是QA脚本错误，已向QA Lead立即报告。超时CLI由脚本停止；本轮正常审批只读CIM过滤Name=electron.exe返回空，确认该检查时没有Electron进程；未终止任何归属未知进程，未读默认session。未记录到误启动Electron PID，不编造精确归属。
4. 增加强制隔离env断言后，又在QR create遗漏env处于spawn前被拦截；未再默认启动。两个漏传点均已修复。后续只补native-only且每次命令均显式profile/workspace，没有创建项目或编译。

当前结论：上述核心CLI/隔离原生配置范围已有独立证据；总工作包仍待最终集成正常UI、包内资源/升级与唯一真实模型完整用户历程。继续负责人QA Lead；本代理当前执行结束，恢复读取本节及两份JSON，不重复25个有效命令。




## 2026-10-09 最终源码残余独立验证（未重跑25命令）

对象 D:/app 主树 HEAD ccae82b131abe30a7b9cc682c1b18712830d8dce。开始前产品路径clean，变更仅协调文档；结束产品git diff仍空。未改源码/预期，未启动最终包/默认profile，未运行Taro或真实模型。脚本每次spawn均硬检查本轮根目录内绝对profile/workspace及无STUDIO_URL，所有入口共用同helper。

### 新增有效证据

D:/app/test-results/studio-002-qa-config-cli-residual-report.json：11个实际CLI子进程命令，6项独立成功检查。

1. run与repair成功：fixture runner实际修改隔离draft并commit；CLI收到done、退出0，revision递增。验证对象为CLI/HTTP业务调用、终态和提交边界，不代表真实PI生成或实际功能验收；fixture明确kind=fixture-only。
2. run模拟失败后resume，runner入口实际取得前任务7 tools、1 build、1 verify、1 repair、至少1234ms已用预算，attempts+1且resumedFrom正确，没有重置。耗尽后resume非零，runner调用数不增加。此项证明resume继承；显式repair为新用户命令，本轮仅验证成功调用，不宣称跨新任务的预算继承。
3. 只关闭本轮CLI子进程：退出非零，后台任务仍running，progress可查；释放模拟门控后failed仍可查，没有伪装用户stop。无未知进程终止。
4. 同隔离profile但不同显式workspace：实际CLI非零，明确“其他工作区”提示，不fallback启动native。
5. 自造随机端口HTTP进度流仅status然后结束：实际CLI返回1，无done，不假称完成。
6. 强杀子进程的lease在mock profile留下，最后“无lease”断言失败，原始整体passed=false保留。mock宿主不运行Electron activeCliLeases清理器，所以这条断言不适用原生自动清理能力，既不算确认产品缺陷，也不改为通过。已核死PID后仅手动删除该本轮文件，独立记录studio-002-qa-config-cli-residual-cleanup.json。此手动动作不代替原生自动清理验收；HTTP服务均由finally关闭，无native进程启动。

D:/app/test-results/studio-002-qa-config-cli-residual-tty-report.json：真实TTY（stdinTTY=true）实际调用CLI main config save，逐项终端输入，Key仅自造占位stdin；工具现场Key输入后无回显，脚本截获输出亦不含Key；raw状态恢复，lease正常清除，通过。mock credentialStore仅接收保存，不把此项当DPAPI证据；DPAPI已有前节native-only证据。脚本studio-002-qa-config-cli-residual-tty.mjs，报告未记录占位值。

### 最终包仍需的相称检查

- 固定studio2-r1/manifest与实际源码，正常启动已配置的最终exe；不读取旧vault或配置值。
- 从同正常入口再开窗口，两窗口同服务/profile且公开hasKey/model/endpoint一致，焦点刷新后变更一致；正常重开与下一包正常入口复用。
- 用包内CLI连接该正常exe（绝对STUDIO_EXECUTABLE及已协调的当前profile），公开查询与UI同项目/revision；不以源码CLI证据替代包内资源验证。
- 隔离最终包native服务下，强杀本轮CLI，确认activeCliLeases自动去除死PID lease、剩余活客户端/窗口仍可用，最后退出session清理。
- 真实模型完整历程仍由QA Lead唯一操作者；本残余不替代。

继续负责人QA Lead。本代理此次已结束当前可做项，不重已有有效命令，不在等待最终包时自启默认目录或承诺后台运行。

## 原生跨exe目录可重复轨迹（最终包固定版）

新增持久native检查：tests/qa/native-config-upgrade.check.mjs，命令 `node tests/qa/native-config-upgrade.check.mjs`。源码现冻结SHA256 74cb7d618b49f10d23b04e37e1ec4c21c9fab47da66a523eecabacba86fddb45。仅新增此QA文件，不改产品。执行测试HEAD 6a6481c34ec2cbaca77c49afe7cfc5d41803a253；固定studio2-r1包产品基线 ccae82b131abe30a7b9cc682c1b18712830d8dce，二者明确分开。

成功原始证据：D:/app/test-results/native-config-upgrade-1791537133516/report.json，5项通过、6个包内CLI实际命令，3张隔离GUI截图。所有原生入口由统一spawn helper强制本轮os tmp绝对profile/workspace和实际临时exe，禁止STUDIO_URL/default current。只在两个自有runtime目录硬链接/复制相同exe与dll，并以junction只读复用固定包resources/locales，记录不同实际exe路径、相同exe SHA256与全部manifest资源SHA256；没有重新打包。

- 自造随机占位只经CLI stdin config save一次，调用包内Electron真实DPAPI；保存hasKey/persisted/encrypted为真，本轮自有vault无占位明文，正常退出后session/lease清理。
- 路径A正常GUI两窗口，公开配置一致；密码字段为空不回填；两个预置ready动态HTML项目可切换并点击计数；包内CLI config status/projects list确实附着A主PID。
- A正常退出后路径B同profile正常GUI重开，无再次save；两项目和配置恢复、密码不回填、动态页面可操作；包内CLI公开状态/项目列表确实附着B主PID。
- 不同显式profile通过包内CLI status无key，不seed/编译；全部自有GUI/CLI正常退出，临时根目录已删除。

边界：这是**同一固定产品包跨不同实际exe目录重开**的原生证据，不能单独声称不同产品版本升级或默认current的全部开发/打包入口通过。项目由测试预置ready HTML/Weapp fixture，未真实PI生成、未Taro编译、未调用模型。真实默认入口/真实Key录入/不同产品版本升级仍由B/QA Lead按授权整体验收；本测试不访问其配置窗口或密钥。

首失败：D:/app/test-results/native-config-upgrade-1791536912262/report.json保留，5项中的第1项资源一致后，CLI代码0但无stdout。原因是资源junction使Node import.meta.url规范化到真实包路径，而argv入口仍链接路径，入口guard未执行main。只修QA启动helper一行使用fs.realpath包内CLI入口，STUDIO_EXECUTABLE和GUI实际A/B路径保持不变；未修改产品/预期，重验新时间目录不覆盖首失败。首轮尚未进入GUI/配置save执行，临时根已清理。

本native分支现已交付证据；后续仅QA Lead/B汇总，不需重跑旧25命令或本轮5项。源码writer已冻结归还，无测试进程继续运行。
