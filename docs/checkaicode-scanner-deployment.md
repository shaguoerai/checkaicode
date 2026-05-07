# checkaicode Scanner 服务部署完成

**时间：** 2026-05-07

## 上线状态

| 项目 | 状态 |
|------|------|
| Modal URL | ✅ https://shaguoer--code-scanner-fastapi-app.modal.run |
| POST /scan | ✅ 接受 {code, language} → 返回 findings |
| 健康检查 /health | ✅ 返回 {status: "ok"} |

## 检测引擎

### 1. 密钥检测（Python 正则独立，不走 Semgrep）
- 23 种常见密钥模式
- 覆盖：AWS Key/Secret、GitHub/GitLab Token、Slack、JWT、Private Key、Stripe、Google OAuth、Heroku、Twilio、Azure、npm/PyPI/Docker Token、General API Key/Secret、Password Hardcode
- 每行只报一条，避免重复
- 测试 7 个密钥全部命中，0 误报（能区分变量名间接引用）

### 2. SAST（Semgrep）
- 规则集：`p/default` + `p/r2c-security-audit`
- 之前卡住原因：`p/owasp-top-ten` 规则集太弱（对 eval、SQL 注入检出为 0）
- 单文件扫描约 10-11 秒

## 之前卡住的 YAML 问题

之前想把 235 条 Gitleaks 密钥检测模式手动转成 Semgrep YAML 规则，结果语法漏洞百出（不能用 `languages: [generic]`、`$TYPE` 变量、`pattern: Access-Control-Allow-Origin: *` 未转义等）。最终方案：**密钥检测和 SAST 分家**——密钥用 Python `re` 正则，SAST 用 Semgrep，互不干扰。

## 关键教训
- 遇到卡 2 次以上的技术问题，换方案不硬扛
- Semgrep YAML 的自定义规则对语法要求极严，非专业写了容易翻车
- Python 原生正则做密钥检测简单可靠，还不用部署额外二进制

## 下次继续做的
1. 写 Vercel `/api/scan/route.ts` Edge → Modal 代理
2. Vercel 配 `MODAL_URL` 环境变量
3. 修复前端 Review 结果展示（当前显示 "No result" 空白）
4. 修复 Privacy/Terms 页面
