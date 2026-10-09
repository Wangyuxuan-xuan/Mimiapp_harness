# STUDIO-002 用户轨迹持久回归冻结记录

2026-10-09 北京时间。用户经A/B直接要求：独立验收形成可重复仓库测试，后续按影响回归，不能只保存截图/报告。QA拥有独立断言；工程Lead维护docs/studio-regression.md；B按显式文件清单提交。产品包基线仍ccae82b131abe30a7b9cc682c1b18712830d8dce，新增测试/脚本文档尚未提交，不据此重包。

## 文件与首次可运行结果

| 独占作者与源码 | 独立断言/边界 | 首次结果 |
| --- | --- | --- |
| qa_repair：tests/qa/qr-delivery.test.mjs、qr-fixture.mjs | 实际Edge；固定Arase动态输入→点击→短中文/120纯中文整viewport解码；常驻提示/隐藏/透明祖先/遮挡拒绝；正常、新提示保旧QR、消失及同义提示接受；每例临时数据清理 | 8/8通过，约14.3秒；日志studio-002-qa-repair-repository-regression.tap |
| qa_config_cli：tests/qa/cli-journey.test.mjs、cli-fixture.mjs | 实际CLI进程+模拟runner/build；成功run/repair、恢复累计/耗尽拒绝、关闭后后台继续/progress、断流非零、异workspace冲突、安全stdin；统一强隔离spawn。无原生lease reaper的mock不冒充异常清理证明 | 1/1通过，内部11命令/6路径，约4.8秒；residual既有证据不重跑 |
| qa_preview：tests/qa/preview-journey.test.mjs | 实际Edge+模拟初始化/动态HTML iframe，非Taro；立即输入、失败自动显示且可制作、375×720/缩放真实填入/底部点击、resumable；实际调用approvedJourney.previewGeometry | 旧root旧bundle首跑失败保留；替换本轮stage同hash3dist后一次retry2/2通过，首输入225ms/新建277ms，960×700与1280×900 |
| QA Lead：scripts/studio-qa.mjs | 层级cli/preview/qr/core/repair/handoff/browser/delivery；禁止继承用户profile/service环境，未准备dist明确拒绝；不构建/打包/调用真实模型 | help/语法通过；实际cli层1/1通过（约5.1秒），日志studio-002-qa-entry-cli.tap；其他层未盲目重复 |
| QA Lead：scripts/studio-qa-ui.mjs | 对显式选定已批准Page的可复用UI步骤，拒绝未知origin，真实提交需allowRealModel；不启动/附着服务、不读profile/Key。geometry使用elementHandle.contentFrame而非FrameLocator.evaluate | geometry已在preview套件实际两次调用通过；其余真实UI步骤尚未执行，不冒充全helper验证 |
| QA Lead：scripts/studio-qa-pixels.mjs | 仅离线实际截图像素等值解码，绑定version/整图SHA/物理框与scale；不生成/缩放图像，wx新JSON不覆盖历史 | 语法通过；最终实际Electron scaled像素尚待真实产物，未宣称可扫 |

主树dist首次被误当最新，源文件旧index-b395ef40导致新UI轮询失败。按B授权仅复制.package-staging-studio-20261009-r1/dist的index.html、index-4f796438.js、index-4178fc67.css到root，三项hash一致；不新Vite/Taro、不改包。未将旧bundle失败当产品缺陷或放宽断言。

## 层级使用

直接命令：node scripts/studio-qa.mjs cli / preview / qr / core / repair / handoff / browser / delivery（每次选一个参数）。入口打印本层文件和范围；细项见工程Lead的docs/studio-regression.md。修改验收器优先qr/repair，修改初始化/预览优先preview/core/handoff，修改配置/CLI优先cli，跨包交付执行delivery。需显式准备正确Vite dist，入口不自动构建。

本地模拟/Edge层不包含商业模型/Taro构建/桌面打包。原生正常启动/多窗/同current复用/升级/异常lease及真正模型生成链要在对应变更或最终交付时单独触发，固定exe、正确profile、实际窗口、明确授权和原累计预算。真实Key经已授权安全入口一次保存，未来真实验收同current新项目，不要求每次新profile/新Key；占位异常另行临时profile。用户已纠正角色：A只协调，QA执行验收；本次B仅作一次安全输入供应，不设管理员角色。

## 协作和交付边界

最初不同文件写入时间有重叠，B纠正后已全部停止；实际先qr/cli冻结，Lead脚本冻结，再Lead唯一窗口修geometry+copydist，归还给preview唯一窗口修改/复验，最后QA Lead入口复验。此前重叠如实保留，不伪称全程串行。所有代理当前结束无测试进程，B统一Git，A独占TASKS。

正常包阶段0–2已启动并仅核对公开状态，详见STUDIO-002-package-start.md。此前未保存的设置窗口随后消失，QA没有读取或保存表单，也未重启旧服务；原因未证实。当前由B在自己的隐藏TTY完成正常current的一次安全输入，QA只收公开状态并独立验收。跨聊天写入QA的TTY返回Unknown process id，证明该会话不能跨聊天使用；QA的占位TTY已取消、隔离目录已删除，未调用模型。最终完整真实链及B亲验尚未完成，以上测试不替代。

## 原生隔离复用层冻结（2026-10-09 09:12Z）

新增tests/qa/native-config-upgrade.check.mjs，SHA256为74cb7d618b49f10d23b04e37e1ec4c21c9fab47da66a523eecabacba86fddb45。在testHead 6a6481c34ec2cbaca77c49afe7cfc5d41803a253对固定产品ccae82b的studio2-r1包实际通过5/5、包内CLI6命令，报告test-results/native-config-upgrade-1791537133516/report.json。一次随机占位Key经stdin及真实Windows加密保存后正常退出，A两个窗口和CLI共享配置/两项ready动态HTML项目；关闭A后从不同目录B重开，无第二次save，CLI附着B进程并复用项目；显式不同profile无Key。临时进程/目录均清理。

首跑因测试junction路径与CLI入口严格匹配不一致，退出0但未执行保存，失败证据native-config-upgrade-1791536912262保留。测试入口改为realpath一行后重验通过，未改产品/降低断言。此层只证明同一产品跨目录复用，不证明不同产品版本升级、默认current所有入口或真实模型生成；没有Taro构建。

已接入显式命令node scripts/studio-qa.mjs native，与delivery分开，不默认重跑。runner新增分派的语法及help已通过；实际原生证据来自上述直接执行，未重复启动桌面。当前QA源码全部冻结，工程Lead可更新使用说明，B统一按显式文件清单Git。

B随后要求未来新包不能始终测旧包，QA最小参数化native脚本和runner：node scripts/studio-qa.mjs native --package-dir D:/app/实际产物目录 --expected-product 完整40位SHA。两参数必须成对，目录必须绝对路径，manifest SHA不符在建立临时profile或启动GUI前硬拒。无参仅明确选择本轮历史r1；每个新包必须传两参数。两文件语法、native --help及不存在目录/错误SHA早拒均实际验证；没有重跑原生5/5，早先源码SHA对应原执行，新解析变更不冒充已再次行为验收。
