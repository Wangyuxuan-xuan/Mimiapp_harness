# Studio 可重复回归

在 `D:/app` 执行。测试源码和执行入口是回归依据；截图、JSON和TAP是某次运行的证据，不能代替可重复测试。

## 当前版本与已验证范围（2026-10-09）

当前产品与 r2 包基线为 `dbe7a6bc35861315f879cf4b3d2fe7b8809a2cec`，已由 B 正常上传。连续制作实现冻结于 `4e43676b9cc03f8210e2d27936c88aa9d74dcb53`，集成产品相关源码散列一致。正常任务不再按工具、构建、检查、接续、恢复次数或整任务时长结束；使用次数只作记录。真实构建和当前源码功能验收、用户停止、持久草稿与原生会话恢复仍为必要条件。

| 范围 | 已有有效证据 | 实际边界 |
| --- | --- | --- |
| B 集成基础 | `test-results/studio-002-b-continuous-foundation-approved.tap` 中37项通过；工具清单补入第六项 read_requirements 后 `studio-002-b-continuous-tools-integrated.tap` 单项通过 | 首次38项中唯一旧工具清单断言失败保留；不是重跑全套38项 |
| 独立连续制作 | `test-results/studio-002-qa-continuous-4e43676-summary.json`：16/16 | 真实 PI 0.99.1、原生自动 threshold 压缩及事件、真实 Edge；响应式本地模拟模型、HTML 编译替身，无商业模型/Taro |
| 严格二维码 | 同一 summary 及 `studio-002-qa-continuous-4e43676-qr8.tap`：8/8 | 真实输入驱动像素解码、长中文、空输入及隐蔽/覆盖负例；不是商业模型生成 |
| CLI | dbe 产品的独立1/1、内17条命令 | 隔离配置及业务替身；原生加密、新包和商业模型另验，精确入口与散列见下方最新 QA 交接 |
| 预览与需求修正 | 同 r2 dist 的独立3/3 | 真实浏览器与HTML替身，61729字符/60条历史原文和时间保留；不是Taro生成或新包正常窗口 |
| r2 包 | `release-harness-20261009-studio2-r2/packaging-verification.json` 与 `test-results/studio-002-b-r2-package-manifest.json` | 一次正式打包 exit0，43固定资源及3dist匹配；没有因此宣称运行验收通过 |

两个需求分页场景首跑失败来自 QA HTTP fixture 分块分别转 UTF-8，跨中文字符边界出现替换字符；修为 Buffer.concat 后一次解码，仅定向复验这两项2/2，原严格原文/偏移/digest断言未变，其余14项有效结果复用。失败与诊断日志均在 summary 中，不能用最终通过覆盖原记录。

r2 完整目录入口为 `D:/app/release-harness-20261009-studio2-r2/win-unpacked/Sprout Studio.exe`。清单 baseCommit/finalizerSourceCommit 均为 dbe 完整 SHA；脚本硬编码的 productBase 是历史字段，不能作为本包源码版本。manifest SHA256 为 `0292ee8f79ef9d256b28fe549fbe27095e53a097aca039dbc0137a8c62364f85`。exe 是 Electron 壳，不能仅凭 exe 散列识别产品；应核清单和全部资源。stage `D:/app/.package-staging-studio-20261009-r2/dist` 已保留，QA 将3项散列与 root/dist、包内产物核对后复用，未额外构建。

正常 r2 配置复用与真实模型读书、连续修改、二维码交付仍待后续验收，不能写为完成。统一 runner 尚无 continuous tier，也未为整理文档重跑 delivery；连续轨迹使用下面的直接测试入口。下节保留 r1 和旧测试版本的历史证据，不代表当前产品仍使用旧额度。

## r1 与旧测试版本（历史证据）

- 当前目录包产品基线：`ccae82b131abe30a7b9cc682c1b18712830d8dce`。
- 包：`release-harness-20261009-studio2-r1/win-unpacked/Sprout Studio.exe`，使用时保留整个目录。资源基线见输出目录的 `build-manifest.json`，工程核查见 `packaging-verification.json`。
- 独立QA回归源码版本：`94871848c724efe7d509eb228c439ed7d1926f0f`，共9份测试/入口文件，不属于当前包产品资源。实际结果：QR新suite8/8（真实Edge动态正反例），CLI新suite1/1内11条实际命令（隔离替身），preview新suite2/2（真实Edge、动态HTML替身iframe、输入/缩放/失败轮询）。preview首次用旧root bundle失败，原日志保留；改复用本包stage同散列dist后一次复验通过，没有重复构建。
- 统一入口仅 `node scripts/studio-qa.mjs cli` 已实际通过，日志 `test-results/studio-002-qa-entry-cli.tap`；其他tier已映射但没有为验证入口额外重跑，不称delivery已通过。三份入口/助手的语法及help已通过。`studio-qa-ui.mjs`仅previewGeometry在preview中实际调用两次；其余真实流程助手尚未执行，pixels助手不代表最终缩放截图通过。
- 后续仅tests/docs及回归scripts变更使用独立测试版本记录，不改变上述包的产品基线，也不自动触发重包。
- 开发入口修正版本为 `6a6481c34ec2cbaca77c49afe7cfc5d41803a253`，已合入普通dev安全启动修正；本次仅package scripts和说明变化，工程实际将package删除scripts/build/devDependencies后与stage及包内JSON逐项比较一致，生产化规范JSON SHA256为 `ba2a4dceac8f1c825226361610934ff9572aefe882a7696dbcbc6fee26b3e8a3`，无需重包。后续测试提交不改变这一包资源结论。
- native参数化版本：`ce621a7308446a2e7ca1a9771675e3aeb5e39792`，只改两份回归文件。语法/help及错误包路径/错误SHA早拒已验证，没有重复原5/5桌面运行。
- 旧读书任务出现两次定位歧义和一次成功子检查共耗三次检查额度，同一PI会话收到错误并修改了计划，第四调用被旧预算拒绝。分层预算v2试验 fe4ba9b 保留为历史，未单独交付；用户随后取消正常任务固定额度。当前方向和验证结果以上节 continuous/r2 为准；原用户现场不自动复活或重跑。

## 本地入口

当前连续轨迹精确入口如下。先确认4e工作树仍干净且HEAD匹配；测试自身拒绝错误版本、活动产品改动和越界目录。环境覆盖仅对本条测试使用，结束后移除，不给CLI/preview/native继承。该组使用每项自己的测试超时，不能套统一runner的90秒全项超时替代。

```powershell
$env:STUDIO_QA_PRODUCT_ROOT='D:/app/.worktrees/studio-002-repair'
$env:STUDIO_QA_EXPECTED_PRODUCT='4e43676b9cc03f8210e2d27936c88aa9d74dcb53'
try { node --test --test-concurrency=1 tests/qa/plan-correction-journey.test.mjs }
finally { Remove-Item Env:STUDIO_QA_PRODUCT_ROOT,Env:STUDIO_QA_EXPECTED_PRODUCT -ErrorAction SilentlyContinue }
```

CLI 和预览最新实际入口分别为 `node --test tests/qa/cli-journey.test.mjs`、`node --test tests/qa/preview-journey.test.mjs`，在主目录 dbe 基线上运行；需要时正常申请环境审批，不故意先复现 junction/realpath EPERM。报告分别为 `test-results/studio-002-qa-cli-continuous-dbe7a6bc-approved.log`（1/1、17命令）与 `test-results/studio-002-qa-preview-r2-e13-retry.txt`（3/3）。预览首次 `studio-002-qa-preview-r2-e13.txt` 因QA exact label包含textarea原文而定位失败，修为唯一前缀label/textarea定位，业务期待未改。前端复用记录为 `test-results/studio-002-b-r2-dist.json`，不是额外一次构建。

continuous summary 中 QR8 曾通过精确 Node24 registerHooks 将唯一测试文件的 `../../server/verify.mjs` 指向4e工作树，同时核HEAD/clean/hash；这是该次冻结执行的产品绑定，不能默认不加loader就仍验证工作树。主目录已集成相同verify散列，未来直接 `node --test tests/qa/qr-delivery.test.mjs` 选择主目录产品，应记录当次HEAD，不能冒称复用了旧loader执行。

最新QA源码SHA256（尚未以新测试提交替代初版提交号时，以此散列绑定实际证据）：

| 文件 | SHA256 |
| --- | --- |
| tests/qa/plan-correction-journey.test.mjs | d23d0fa9e7812d6208d4ca3accaa2627acd99a064fb60c48cd1bb398e2e8fed1 |
| tests/qa/plan-correction-fixture.mjs | 56b2d4211958f250a3c0dae552359c3155bc056cb0e754ce315db6d571e60f9f |
| tests/qa/cli-journey.test.mjs | 1f03f45e1c6b3c0fcbe6dabd46da37b9fd01adb90a1a4cc3d0c9c5cbe28a9729 |
| tests/qa/preview-journey.test.mjs | 075f61dbd98a849b9b0b44d28fc7e2b77a2cf66863a1dedc46e5137e4b0751a3 |

工程实际重算这四项散列并读取对应报告一致；仅核证据，没有为文档重跑。QR两份文件散列未变，见历史散列表及当前summary。以下统一入口继续可用，但 `delivery` 暂未包含新增continuous组：

```powershell
node scripts/studio-qa.mjs help
node scripts/studio-qa.mjs core
node scripts/studio-qa.mjs browser
node scripts/studio-qa.mjs delivery
node scripts/studio-qa.mjs native
```

`native`无参明确只选择历史studio2-r1/ccae82b。验证新包必须成对给出包的绝对目录和完整产品SHA，例如指定 r2（本命令仅列入口，未据此宣称已运行）：

```powershell
node scripts/studio-qa.mjs native --package-dir D:/app/release-harness-20261009-studio2-r2 --expected-product dbe7a6bc35861315f879cf4b3d2fe7b8809a2cec
node scripts/studio-qa.mjs native --help
```

缺参数、重复/未知参数、非绝对目录、非40位SHA或manifest基线不符会拒绝；manifest读取和基线匹配在创建临时profile及启动GUI前完成。此两文件参数改动的语法/help、不存在目录及错SHA早拒由QA实际验证，未重复原生5/5；参数化不扩展为不同产品版本升级证明。

入口使用现有Node依赖、隔离fixture及需要时的真实Edge，串行执行测试，子测试失败返回非零。它不调用商业模型、不进行Taro编译、不打包，也不自动准备前端。运行前清除指向已有用户服务或配置的 `STUDIO_URL`、`STUDIO_USER_DATA_DIR`、`STUDIO_WORKSPACE_DIR`、`STUDIO_EXECUTABLE`、`STUDIO_CLI_LEASE`、`STUDIO_CLI_PARENT_PID`；存在这些变量时入口会拒绝执行。

`preview`、`browser`、`delivery`要求已有当前源码的 `dist/index.html` 和可用Edge。没有对应前端产物、或前端源码已变更时，先明确执行一次 `npm run build`；可复用版本相符的有效产物，不重复编译。此Vite准备不代表Taro或包内编译通过。

## 按改动选择轨迹

| 改动范围 | 命令参数 | 主要覆盖 |
| --- | --- | --- |
| 配置、共享客户端、CLI业务 | `cli` | `tests/qa/cli-journey.test.mjs`的隔离业务轨迹 |
| 新建准备、预览尺寸和桌面缩放 | `preview` | `tests/qa/preview-journey.test.mjs`的实际浏览器轨迹 |
| 二维码业务检查、空输入证据 | `qr` | `tests/qa/qr-delivery.test.mjs`的动态QR正反例 |
| 持续制作、准备及CLI基础交互 | `core` | agent-budget（文件名沿用，断言已取消旧帽）、studio-preview及CLI轨迹 |
| 原生压缩、长需求覆盖、同会话反馈与恢复 | 直接运行 `tests/qa/plan-correction-journey.test.mjs` | 16项连续轨迹；尚未纳入统一runner，不能把delivery等同于已包含此组 |
| 同会话自主修复、失败与停止 | `repair` | `tests/repair-loop.test.mjs` |
| 准备/验证、恢复响应衔接 | `handoff` | `tests/studio-integration.test.mjs` |
| 浏览器与验证器相关改动 | `browser` | preview、QR、空输入反馈及集成衔接 |
| 交付前核心跨包回归 | `delivery` | core、repair、browser去重后的集合 |
| Windows包配置一次保存与跨目录重开 | `native` 加包路径/SHA | 独立原生桌面轨迹，无参仅历史r1，自造占位，显式触发且不含于delivery |

具体断言、替身范围和结果以冻结QA源码及其报告为准。先跑受影响的轨迹；准备交付时跑一次 `delivery`，复用同版本有效结果。仅文档调整不自动运行昂贵检查，失败后按原因定向修复与复验。

## 原生包与真实模型的触发

本地回归不证明Windows加密保存、真实Electron多窗口、包内依赖或真实模型完整用户历程。

## 配置一次长期复用

当前普通 `npm start`、打包exe、新窗口和CLI默认共用 `%APPDATA%/Sprout Studio/current`（Windows）。同一profile内项目共享设置；配置使用Electron safeStorage，不随exe目录或正常升级变化。`STUDIO_USER_DATA_DIR`显式改变配置归属，`STUDIO_WORKSPACE_DIR`改变工作区；同profile同时运行不同workspace会拒绝，不能把为测试另建profile后的空配置误报为密钥丢失。

普通dev入口缺口已在源码6a6481c修正：`npm run dev`先Vite构建再Electron安全启动，显式 `dev:web`保留无credentialStore的临时网页服务，密钥仅在该进程内存；开发外接 `STUDIO_URL`也不共享普通桌面的安全入口。`npm start`须有当前dist。工程已核启动脚本与包生产资源等价；这不是实际重新编译后配置保留的运行证明。临时网页/HMR模式不得作为真实配置持久化验收入口。

本轮current是包2按当时“不读取/迁移历史密钥”的范围新建的稳定目录；历史r5专用启动目录与它分离，不是已证实打包覆盖配置。本次打包只使用D:/app下新stage/output，失败恢复仅删本轮空stage，脚本没有访问或删除current。以后升级沿用正常current，不能每次更换到新的真实模型profile。

安全配置已有两条入口：正常设置保存，以及 `node cli/studio.mjs config save` 的隐藏TTY或父进程stdin JSON。自动化只通过内存中的stdin传递自造测试配置，不能将密钥放在命令文字、参数、环境变量、文件、报告或Git；公开状态只断言hasKey/persisted/encrypted，不读取密码框或vault。一次保存后重开/新窗口/CLI/新项目复用，不每轮再次save。

用户已允许团队为本项目测试保存使用现有Key，最小暴露仍优先，不创建账号/新Key或费用。真实current不因QA结束自动清除；隔离自造占位可自清。B统筹并负责最终结果，工程负责持久安全存储，QA通过正常入口和公开状态验证，不设置额外管理员角色或权限审批系统。

离线CLI/业务测试使用隔离fixture和自造占位，native持久化测试使用自己的临时profile和自造占位，均不需要真实Key。真实模型QA使用已正常配置的current及独立新项目，不另建每次须重填的profile，不清除current。A只负责秘书协调，不承担填Key或代QA。本次此前未保存页面已退出、没有可接续运行时变量；最终由B用现有CLI隐藏TTY一次供应并保存，B报告公开hasKey/persisted/encrypted均true且无warning，退出按lease清理，不再需要供应或新建管道。工程未读取字段/vault/密钥，实际正常重开及模型轨迹由QA接续。工具参数可能保留执行记录与应用无回显/argv/env/文件/日志须区分，不将输入通道称为隐藏工具传参。

持久native轨迹已由QA独立实际执行5/5及6条包内CLI通过。命令 `node tests/qa/native-config-upgrade.check.mjs`，报告 `test-results/native-config-upgrade-1791537133516/report.json`，测试运行HEAD为6a6481c，产品包ccae82b。自有临时profile只stdin保存一次自造占位，使用实际Windows DPAPI；路径A两正常窗口及CLI共享两个ready HTML fixture项目，正常退出；路径B重开复用同配置及项目，不再save；另一profile为空，自有临时数据和进程清理完成。

两个exe目录对应同一产品，exe文件通过hardlink或copy复用、资源目录通过junction复用并核对散列；未重新编译，也不是不同源码版本升级。测试显式使用自有profile，不是默认current所有入口实际证明；两项目为动态HTML fixture，非真实生成/Taro产物。统一runner新增的 `native`分派已核语法/help，未为了入口重复桌面测试。将来产品版本变化时须绑定新固定包并调整此固定包门控，保留跨版本边界，不能把本次同版本结论自动沿用。

涉及Electron配置/进程退出/打包资源/生产依赖的改动，或需要交付新产品包时，由B明确冻结产品版本，安排唯一打包执行者及独立包内QA。仅tests/docs/回归入口变更不是重包理由。打包使用现有脚本、固定新目录及 `--source-commit FULL_SHA`，运行前核对实际HEAD和产品输入；不覆盖旧包、不自动下载依赖。

真实模型检查仅在已有明确授权且B安排唯一执行者后进行；通过已有安全配置持续复用，测试不得读取或转移历史凭据，也不依赖A手填或Computer Use反复录入。应绑定固定exe、新项目、授权调用范围及实际调用/token和可得成本依据，覆盖正常启动、配置复用、新建、自然生成、实际预览、连续修改、失败修复、导出、重开继续。正常制作不重新引入固定次数或整任务硬时长；供应商传输重试、单操作超时与无进展诊断须区别记录。可复用有效编译和像素产物，不因报告整理重复模型或Taro。原生/最终真实流程的执行归属及恢复步骤见 `docs/coordination/qa/STUDIO-002-final-execution.md`。

## 当前冻结测试文件散列

以下为2026-10-09工程实际读取的冻结初版SHA256，对应独立测试提交 `94871848c724efe7d509eb228c439ed7d1926f0f`；它们不是当前包资源清单的一部分。其后native参数化提交 `ce621a7308446a2e7ca1a9771675e3aeb5e39792` 仅修改scripts/studio-qa.mjs及tests/qa/native-config-upgrade.check.mjs，新SHA256分别为 `d1991442f1046768379e1bc5de62bd72f4610480e275ed61ca4063c83a96c043`、`cb0a37d67f9685edb499dd8929567f306eddb2cba81d2873bd9db6415c3f0024`；以下两行旧散列保留为原5/5执行版本，不能冒充参数化新版本的桌面复跑。

| 文件 | SHA256 |
| --- | --- |
| scripts/studio-qa.mjs | c38ee996af66369cdc3ced61f978dd35ecd92a30a16968f570800effd98eb4a4 |
| scripts/studio-qa-ui.mjs | d8bc5a569f1ad7765bfdbb9f2bf8f11dadf34606f4b38d7c2d81984ff1bf62ef |
| scripts/studio-qa-pixels.mjs | 8fadd9a7d8c457f5f123c8a06c64b8e94efb84b6eb6c5194b9debbc4cd19b33b |
| tests/qa/cli-journey.test.mjs | a2948b55f11bf0b8585951a25c0523d752244136ae0d27765eb2bb437b36e5e4 |
| tests/qa/cli-fixture.mjs | 25bb087ce5d6a1b3cb9c9989751d0caa297592b30cba894d7bac98170524b276 |
| tests/qa/preview-journey.test.mjs | f2de355603fadf29b672e4b1688764a677fce2af1497ac99286bf0f83ddc5fd5 |
| tests/qa/qr-delivery.test.mjs | 77a524ee21dde0cf08bd8c4e6e77c211d98ccc848b6a616da4092c0d4c6d1004 |
| tests/qa/qr-fixture.mjs | 74783c31e6a045fcbfac222657c788c345322c1b0212a79f25e698a6c7fc8d82 |
| tests/qa/native-config-upgrade.check.mjs | 74cb7d618b49f10d23b04e37e1ec4c21c9fab47da66a523eecabacba86fddb45 |

## 每次运行记录

记录产品源码/包基线、测试源码提交或未提交文件散列、所选命令、前端产物版本、实际退出码及报告路径。区分已实现、已测试、包已生成与最终验收；失败和误启动记录保留，不能用后续通过覆盖。当前包工程核查通过不等于最终UI或真实模型验收通过。
