# 验证状态与继续工作记录

更新时间：2026-10-01。桌面及真实 DeepSeek 链路通过；微信官方模拟器交互仍未验收，不等同于官方编译器验证。

## 已通过

- 最新桌面包：release/win-unpacked/Sprout Studio.exe，已包含独立模型网络请求和 Flash / V4 Pro 快速切换。
- 真实 DeepSeek Flash 通过 PI SDK 工具调用生成“阅光”读书小程序（版本 2）。真实 DeepSeek V4 Pro 继续修改（版本 3），修改页脚并修复确认弹窗失败时错误删除数据的问题。
- DeepSeek 网络故障根因：PI SDK 内置网络库覆盖全局请求设置。现为每次模型请求显式使用独立代理 dispatcher；连接测试和真实 Agent 使用相同网络路径。
- 真实生成应用 12 项桌面检查通过：渲染、空标题、零页数、添加书籍、超出总页数、阅读进度、刷新持久化、完成筛选、整页重载、模型切换保留 Key、真实 Pro 响应、ZIP 完整下载。见 test-results/deepseek-reading-report.json。
- 版本恢复实测：版本 2、3 分别恢复为版本 4、5；源码逐字一致，真实 H5 和微信双端编译通过，阅读数据完全保留。最终当前版本 5 为修复后的版本 3 源码。见 test-results/reading-restore-report.json。
- 最新打包依赖环境 9 项回归测试通过：路径限制、密钥不跨端点转发、精确快照、API 会话隔离、真实 PI SDK 对模拟模型执行工具、失败及取消保留可用版本、首次编译失败重启恢复。此组编译使用替身，真实编译另行验证。
- 最新桌面包 9 项交互验收通过，关闭再启动后新增习惯和打卡数据仍保留。见 test-results/packaged-interactive-report.json 和 restart-report.json。
- 最终导出 test-results/deepseek-reading.zip 解压至 deepseek-final-export；19 个微信产物文件、324625 字节，官方 wcc.exe 与 wcsc.exe 均通过且无警告。见 test-results/wechat-compiler/report.json。
- 修复过 Taro 嵌套依赖被打包器遗漏的问题，桌面包携带完整编译依赖。此前使用内嵌 Electron Node 真实编译通过。

## 官方模拟器当前限制

- 用户已授权服务端口长期开启。通过微信设置 UI 开启成功；CLI 在 31268 正常响应，原 wait IDE port timeout 已解决。
- 微信网络已配置为本机现有代理 127.0.0.1:7890，以处理基础库下载 ECONNRESET；未更改其他安全开关。
- 安装版本 Stable 2.01.2510290。官方 open / auto 对游客项目返回内部 TypeError: d.on is not a function（code 10），项目窗口出现白屏，9420 自动化连接超时。正在尝试正常重启工具。未通过官方模拟器交互，未做真机或上传发布。

## 续跑信息

- 每小时 heartbeat id automation 已启用，不重复创建；所有任务完成交付后再暂停。
- 工作台 http://127.0.0.1:5176 持有用户 Key 于进程内存，保留运行；不要输出或保存 Key。旧 5175 也保留旧进程。
- 阅读项目 a75ebf0c-5ee1-4c3f-abc5-1af218affd66，当前版本 5。最新模型 deepseek-v4-pro。
- 桌面独立版数据在 %APPDATA%/Sprout Studio/workspace；开发工作台数据在 D:/app/.studio。两个工作区独立。
- 尚需完成官方模拟器故障恢复及交互验收。最新桌面包实际模型请求的独立验收还可补充；源工作台真实 Flash 生成、Pro 修改已通过。

### 最新官方工具复测（2026-10-01 13:50）

- 正常 quit 后重新 auto 成功，原内部 d.on 错误消失；CLI 服务当前 44617，自动化端口 9420。
- TCP 及官方 SDK WebSocket connect 成功，但 currentPage 20 秒仍不返回，窗口白屏，不能算模拟器验证通过。
- 官方日志出现基础库 3.17.2 下载及 routeTo appLaunch timeout。独立请求官方基础库地址遇到 TLS 握手失败。
- 对照测试仅在解压测试目录 project.private.config.json 指定已有 3.16.1 及工具内置 2.25.3，均未使页面恢复；没有修改导出 ZIP 或交付项目的基础库默认设置。
- 后续先检查官方工具窗口和日志是否恢复；不要重复生成、重复全量桌面测试或重启持有 Key 的工作台。可以进一步诊断官方工具基础库加载或以官方新版本隔离验证；当前没有进行升级或更改系统网络设置。
- 本轮新增脚本 scripts/reading-restore.mjs、scripts/wechat-probe.mjs；修正 reading-smoke.mjs 重复运行时模型已经是 Pro 导致等待不触发的问题。

## 当前交付结论（2026-10-01 14:41，覆盖前述未通过状态）

用户要求减少繁重桌面操作，后续优先使用 miniprogram-automator。核心 demo 闭环已验收并提供工作台体验。

- 官方模拟器白屏已修复：通过正常 HTTPS 下载官方 3.17.3 基础库，按工具自带公钥与算法校验官方签名后补入缓存。证据 test-results/wechat-library-signature.json。没有关闭 TLS 校验，没有修改系统防火墙。
- 微信工具代理已通过设置界面改为 DIRECT 并核对落盘；DeepSeek 代理保持。单独关闭代理仍未恢复页面，补齐签名有效的基础库后恢复。相同地址 Node 24 可达、工具内置 Node 16.13.1 报 ECONNRESET；目前不能把根因简单归结为代理，底层 TLS 差异尚未完全归因。
- 官方模拟器实际运行最终导出源码，原生 UI 添加“官方模拟器验收”10 页书籍、记录 3 页，官方 miniprogram-automator 读取存储确认，再 reLaunch 并断言数据完全相同。四项通过，见 test-results/wechat-runtime-report.json、wechat-progress-relaunch.png。
- SDK 的页面定位和 wx 存储、reLaunch、截图接口可用；Taro 自定义组件内的直接选择器查询曾超时，不能声称已完成全自动元素交互脚本。
- 用户按 Escape 中止桌面控制后没有继续控制桌面；随后用户要求打开工作台供体验、减少 heavy 测试。
- 核心验收已通过：真实 Flash 生成、Pro 修改与切换、H5 交互、版本恢复、数据保存、桌面打包运行、真实微信导出、官方编译及模拟器基本交互。没有验证真机、上传、审核或发布，均不属于当前本地 demo 交付。
- 工作台 http://127.0.0.1:5176 保留用户 Key 内存，阅读项目当前版本 5。工作台右侧是 H5 预览，不是微信模拟器；微信运行时验证在官方工具中进行。
- 桌面包 release/win-unpacked/Sprout Studio.exe 必须连同整个目录保留；与开发工作台采用独立项目目录。最终 ZIP test-results/deepseek-reading.zip 未被诊断性基础库配置修改。

## 2026-10-01 用户二维码反馈修复（进行中）
- 新项目不再复制习惯功能，改为中性空白起点；示例项目仍保留习惯打卡。
- PI 使用 DeepSeek 时显式发送 thinking.type=disabled，避免仅设置 SDK off 无法关闭供应商思考模式；尚不能将旧空回复的根因直接判定为此。
- 空回复/截断改为明确失败并保留原版本，正常讨论显示实际模型正文；前端只在 revision 增长时提示保存新版本。
- 去除当前用户消息在 PI 上下文中的重复，允许正常讨论而不强制修改。
- 14 项回归通过（含空回复、截断、正文保留、原生参数、空白/示例分离）。
- 修复候选工作台 http://127.0.0.1:5177 运行，原 5176 未停。用户已授权的 Key 只通过输入连接候选进程，没有写入文件。
- scripts/qr-generate-check.mjs 正在以用户原话真实生成，项目与结果记录在 test-results/qr-project.json、qr-generation.json；不得重复启动。后续需要实际解码 I love u 和交互/编译/导出验收，再更新桌面包。
- 每小时 automation 已恢复 ACTIVE；本次反馈尚未交付。

### 2026-10-01 续跑：实际二维码发现失败
- 初次真实生成已完成（ac0867c6-a07f-4cfa-a796-bb5342eb0f77 revision 2），有实际 PI 正文及双端编译。证据 qr-generation.json。
- 轻量 Edge/Playwright 检查真实预览：点击按钮可生成图案，但 qrcode-reader 解码截图报 Error locator degree does not match number of roots。不能报告二维码功能通过。
- 已通过同一 PI Agent 提交真实反馈修复，scripts/qr-repair.mjs 正在运行；同时要求保留首尾空格、删除无法实现的长按保存宣传。勿并发修改该项目。
- 复测入口 scripts/qr-ui-check.mjs（已改为 headless Edge，按钮定位 Taro 按钮外层），接下来等待修复完成再执行；仍需最终桌面包更新。

## 本次二维码反馈验收完成（2026-10-01 20:37，覆盖上面的进行中状态）
- 修复工作台为 http://127.0.0.1:5177；5176 是旧后端，保留以免丢失旧进程状态，不作为本次修复入口。
- 新项目采用中性空白起点，习惯应用仅作为示例；原有用户项目保留。
- PI 接收原始需求，不重复添加当前消息。正常讨论保留真实正文；空响应或长度截断明确报错并保留版本；仅 revision 增长时提示保存新版本。
- 显式 DeepSeek thinking.type=disabled 已通过请求参数测试。旧空响应未保存原始结束原因，因此不能断言旧故障唯一原因。
- 14 项核心回归通过。真实 Flash 使用用户原话从空白生成二维码，随后同一 PI 会话流程依据两轮实际解码反馈修复。二维码项目 ac0867c6-a07f-4cfa-a796-bb5342eb0f77 当前 revision 4。
- 实际 H5 页面点击生成，截图解码通过：I love u（中）、你好，小芽（高）、首尾空格原文（低）、100 个 a（较高）；空输入提示通过。见 test-results/qr-ui-report.json、qr-latest.png。初始失败没有算作成功，修复记录 qr-repair.json。
- 真实只讨论消息返回正文，版本仍为 4，界面提示“小芽已回复”通过，见 qr-discussion.json。
- 最终导出 test-results/text-qr.zip 为 revision 4，含源码和 dist/weapp 的 JS/JSON/WXML/WXSS，可直接导入官方工具；双端及微信官方 WXML/WXSS 编译通过。此二维码没有新增真机扫码或官方模拟器交互验收；此前阅读示例的官方模拟器验收仍有效，二者不混称。
- 新桌面包：release-qr-fix/win-unpacked/Sprout Studio.exe（整个目录）。打包器在临时 app 目录漏收嵌套依赖，已补齐完整生产依赖树并纳入 scripts/package-desktop.mjs / repair-package-deps.mjs。新版包内空白项目双端/官方编译通过；正常桌面环境实际启动和新建项目对话框通过，见 qr-package-start.json/png。
- 受限工具环境 Electron GPU 子进程失败，正常桌面执行验证通过；不是关闭产品沙箱，产品 BrowserWindow 仍 sandbox:true。
- npm run pack 现在使用 staging 避免工作目录异常名称扫描问题，输出 release-qr-fix。旧 release/win-unpacked 打包曾因运行中锁文件失败，请使用新版目录。
- 本次反馈已修复交付，小时任务可暂停，避免重复制作。Key 未写入代码、导出包或报告。
