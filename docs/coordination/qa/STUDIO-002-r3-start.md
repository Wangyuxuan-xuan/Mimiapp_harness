# STUDIO-002 r3 正常启动与配置复用独立 QA

2026-10-09（北京时间）。QA Lead 实际唯一原生操作者。授权来源：用户 AGENTS 内部协作/持续修复授权，以及 B 负责人直接放行安全退出空闲 r2、启动完整 r3、只读配置复用和数据保全检查。没有模型调用、制作、自动恢复、项目编辑、二维码亲验替代操作或历史服务操作。

## 结果

正常升级和本范围保全检查通过。包目录 `D:/app/release-harness-20261009-studio2-r3/win-unpacked`；基线/最终打包提交 `58458dcc29f82a8423e4aa64e6e1d3da298b7d54`，B 独立资源报告 `test-results/studio-002-b-r3-package-manifest.json`，manifest SHA256 `aafc694873c9bd6b507b3bc660012ef366afea9c2660484fa54287f22eb8ba34`。43 固定资源与3 dist一致的既有工程/B证据复用，本次不重复构建/打包。

| 检查 | 实际证据 |
| --- | --- |
| 升级前安全 | fresh sky list_apps 唯一 r2 window 4852776；窗口原最小化，经授权恢复后原生树/截图显示hi第4版、输入为空且发送禁用，无未保存modal；公开session PID58896/API50276，6项目runningCount=0 |
| 正常退出 | 对准确归属r2窗口执行Alt+F4；fresh list_windows不再含r2；正常审批Get-Process确认58896不存在。未强杀其它服务 |
| 新包启动 | sky.launch_app完整r3 exe；首次工具回报未暴露targetable window，未重复launch；随后fresh list_apps实际返回唯一r3 window77992166 |
| 新归属 | 正常审批Get-Process PID16940路径为r3完整目录；readSession实际PID16940/API59589；原生窗口文档URL59589、预览59588，hi revision4正常显示比分1:7 |
| 配置一次复用 | before/after公开settings深比较一致；hasKey=true，keyStorage.mode=encrypted、available=true、persisted=true、warning空；未打开设置或读取/输出Key |
| 项目与预览保全 | 六项目按id比较完整public响应SHA256、revision、ready、task id/state以及storage.json原字节SHA256，前后精确一致；hi070372d0-3528-4897-9d67-234664e77469仍revision4/ready=true；最终原生预览加载后再次只读快照确认仍一致，runningCount=0 |

证据：`test-results/studio-002-r3-start-before.json`、`test-results/studio-002-r3-start-after.json`。只读采集器 `test-results/studio-002-r3-start-snapshot.mjs` 仅readSession现有会话、拒绝launch fallback及profile覆盖；读取公开settings/projects并仅保存项目/存储摘要，不保存项目正文或存储原文。endpoint token只由现有readSession内存使用，从未打印或写入报告。历史配置/服务未访问。

默认沙箱的CIM返回无访问权限，默认Get-Process亦无法看到实际桌面进程；这些不作为进程终止证据。正常审批同一只读Get-Process成功返回新PID16940的r3路径，并确认旧PID58896不存在。sky首次get_window_state明确窗口最小化，按API恢复后重新取得窗口状态，没有使用失败观察中的坐标或元素。

## 观察与范围

r3侧栏项目排列相对r2反转：r2新hi在前，r3旧项目在前，但当前仍选中hi且公开项目内容完全一致。已报B，可能与新hook逐项prepend有关，属于待B判断的导航呈现观察，本次未修改产品或扩大为排序验收通过。

本次只证明正常启动、现有配置公开复用和上述数据保全；复用导航冻结25d66c1十场景及input独立验收证据，不声称新原生并行制作/真实模型/微信运行/性能提速已验收。没有重做历史繁重配置矩阵。

窗口现保持r3运行，QA已交还B，停止原生输入。B继续原二维码负责人亲验刷新/回填/清空，QA不代做。没有临时QA服务或模型任务；新r3是用户正常实例，按授权保留。后续恢复读取本报告、TASKS及B工作包，再核实际window/session；继续负责人B。
