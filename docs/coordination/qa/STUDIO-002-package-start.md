# STUDIO-002 正常包启动独立检查

2026-10-09，北京时间。QA Lead执行，B仅放行阶段0–2，真实模型未放行。

- 产物：D:/app/release-harness-20261009-studio2-r1/win-unpacked/Sprout Studio.exe；产品/manifest基线ccae82b131abe30a7b9cc682c1b18712830d8dce。包装verification通过，B独立43项资源匹配证据另存studio-002-b-package-manifest.json。
- 入口：computer-use sky.launch_app显式普通exe路径，无特殊cmd/启动参数；环境检查无STUDIO_*或ELECTRON_RUN_AS_NODE。不能把这一动作写成用户实际双击。
- 首次launch工具约14秒后报无targetable window，随后list_windows实际找到唯一新包窗口1445978，旧r3窗口8978498保留未操作。首次截图曾显示其他前台内容，激活新包再捕获正确画面，后续仅用实际目标窗口/当前索引。
- 新包正常窗口title小芽·Sprout Studio，主PID22084，API http://127.0.0.1:63174，preview http://127.0.0.1:63173。首观察40.5秒包含工具等待与其他核对，不是应用首输入耗时，不用于几秒指标；未为测速重启。后续新建计时单独补。
- 首屏输入在后台准备仍可set_value写入“独立验收输入检查（不发送）”，按钮变为可发送；随后清空未发送。未触发模型或修改已有项目源码。
- 正常设置页已实际打开，密码框为空、未回填，显示可通过系统安全存储保存。
- 仅从运行中应用公开bootstrap白名单字段核对：hasKey=false、keyStorage.mode=encrypted、available=true、persisted=false、warning空、initialError空。首次沙箱loopback EACCES无响应，经正常require_escalated只读核对成功；token仅从当前页面取到内存用于正常API鉴权，不输出/持久保存。
- 正常profile推导C:/Users/wangy/AppData/Roaming/Sprout Studio/current，workspace其/workspace，依据APPDATA+electron/profile.cjs及未继承STUDIO环境；没有读取profile/vault或密钥文件。
- 首屏已有两条“独立QA业务”0版本，符合此前QA误默认建项的现场；保留不删除/覆盖，不据名称推断任意未知配置。公开hasKey=false，无未知密钥清理动作。

阶段0–2已向B/A回报，设置页/窗口保持，由A独占正常UI录入已授权Key。QA停止该窗口输入，等待A交还和B明确唯一真实调用放行。当前不判配置恢复/真实生成/手机或scaled扫码通过。新用户轨迹回归继续在独立fixture浏览器，不操作此窗口。

最新约束：A已在新正常设置输入真实配置但尚未保存，用户要求先核方案。QA/B不得观察此表单/截图/读值，不输入保存/清除/重启，模型仍禁，A独占。以上公开字段及图像只对应A输入前，不能作为当前就绪状态。真实验收无需每次新profile/新Key，正常current保存一次后原生复用，后续只新建独立项目；mock/占位/异常测试单独临时profile不用真实Key，不迁移vault、不重配current。后续包内CLI仅按B确认归属附着current正常exe，不自行启未知服务。等待A最新指示，不为测试要求其反复录入。

后续用户直接纠正：A只统筹，不代填/代做QA；配置验证与完整历程由QA负责、B统筹、工程实现安全持久。额外“管理员”角色是口述误解，不设管理员或新审批/权限系统。测试Key保存使用授权仍有效，同current长期复用，不因测试结束清除。

## 受控保存接管时的实际阻塞

B明确授权只做新可访问性观察，无截图，node端仅筛选“保存设置”按钮行输出索引，不访问/输出focused_element、document_text或textbox/password/value，再正常点击并只查公开settings。QA按该方案尝试，sky.get_window_state即报“foreground window did not report a process id”，未输出任何表单数据。按技能恢复一次get_window已知新窗口1445978，报window not found，当前列表无Sprout窗口。随后正常require_escalated只读查询63174监听和PID22084均无对象。

结论：受控保存尚未执行，先前窗口和服务在接管时已消失，原因未知。QA没有截图/读取任何已填字段，也没有点击保存/清除、重启或调用模型。不能再使用旧索引/坐标，不把历史hasKey=false当最新配置状态；已经报告B协调当前程序/会话状态，不要求A或用户反复录入、不读旧vault/聊天取Key。继续隔离native一次占位保存跨exe轨迹，无需当前真实窗口。

## 新持久预览回归的资源纠正

首次新套件用了主树旧dist（index-b395ef40.js），iframe等待失败，原日志studio-002-qa-preview-persistent-regression.txt保留，未记产品缺陷或通过。B指明本次真实构建在.package-staging-studio-20261009-r1/dist。QA Lead在单writer窗口复制其3文件到root dist，逐项SHA匹配；当前index引用index-4f796438.js/index-4178fc67.css，不新增Vite/Taro构建、不改变包。预览QA获得下一唯一测试源码写入窗口，修后复验新套件和可复用UI helper几何调用。

## 写入协调事件

收到B纠正前，三个QA被派在主树不同测试文件写入，实际有时间重叠，违反同目录单写入者约定；已明确承认并全部停止源码写入，保留成果，未伪称此前串行。qr/cli两份测试已冻结，Lead scripts写完冻结；之后Lead单窗口修helper/复制dist完成，再轮换preview唯一窗口。docs按各自owner维护，产品源码始终冻结。后续B按显式文件清单统一Git，QA未提交/推送。

## 2026-10-09 r2正常升级与配置复用独立实证
- 产品main dbe7a6bc35861315f879cf4b3d2fe7b8809a2cec；B核r2 manifest与43资源/3dist逐项一致并正式放行正常升级，不含真实模型。壳exe与r1可同hash，版本依据固定资源及实际exe路径/PID。
- 窄公开检查脚本test-results/studio-002-r2-public-upgrade.mjs先用包内readSession仅附着已有正常GUI、不自动启动，公开API仅输出项目id/revision/taskid/state，包内CLI config status。未读取vault/Key/auth/JSONL；endpoint token只内部本机认证不输出。
- r1 PID36532/API52684、准确两窗9769404及11997288，公开runningCount=0；原读书task2d78c133...仍failed/revision0。报告test-results/studio-002-r1-public-upgrade.json。经正常窗口关闭退出两窗，旧PID不存在；没有forcekill、修改/resume项目或重启r3/r5历史服务。
- 旧QA窗口最小化恢复；无截图/文字get_window_state调用被工具要求必须选至少一种，随后仅白名单按钮观察。元素关闭点击一度geometry unavailable，已重新选窗口并使用安全制作页截图后正常标题栏关闭；最后窗正常Alt+F4关闭。失败动作保留工具记录，不盲用旧索引/坐标。
- sky首次启动r2约13.8秒报暂无targetable window，未重复启动；刷新实际出现r2窗口7673380。进程PID58896，CIM精确路径D:/app/release-harness-20261009-studio2-r2/win-unpacked/Sprout Studio.exe，API50276，workspace仍正常current/workspace。
- 包内CLI公开config status exit0，deepseek/deepseek-flash，hasKey=true，encrypted/available/persisted=true，warning空。r1/r2公开settings及全部项目revision/taskstate snapshots严格相等，原任务未改；报告test-results/studio-002-r2-public-upgrade.json。
- 正常再次打开r2产生第二窗15274978，与原7673380均准确r2路径；endpoint仍PID58896/API50276，CLI状态仍同。安全制作按钮白名单观察后仅制作页截图，无设置表单/Key输入；B已收新PID/窗口/API/配置结果供独立亲验。
- 正常升级/同profile新窗/CLI配置复用受测范围通过。尚未调用商业模型、未新建真实任务、未恢复原读书任务，等待B具体真实新项目放行。当前两r2窗为后续正常验收保留，不按测试残留关闭；QA无源码writer/后台服务承诺。
