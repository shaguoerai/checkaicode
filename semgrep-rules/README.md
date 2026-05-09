# Semgrep Rules Vendoring

## 策略
- **优先远端**：semgrep CLI 自动从 semgrep.dev 下载规则集
- **本地 fallback**：如果远端不可用，使用本地缓存或预下载的规则

## 当前状态
- 远端规则集可用（HTTP 200）
- semgrep CLI 内置重试和缓存机制
- 14 套规则集按语言动态加载

## 预下载方法（如需 vendoring）
在 Vercel build 阶段运行：
```bash
python3 -c "from semgrep.console_scripts.pysemgrep import main; main()" scan --config p/default --json --quiet /dev/null
```
这会触发 semgrep 下载所有规则集到 ~/.semgrep/cache/
然后将 cache 目录打包到部署包中。

## 规则集列表
- 通用：p/default, p/owasp-top-ten, p/command-injection, p/jwt, p/secrets, p/supply-chain
- JS/TS：p/javascript, p/typescript, p/react, p/nodejs
- Python：p/python
- Go：p/golang
- Java：p/java
- 排除：p/ssrf, p/r2c-security-audit, p/sql-injection, p/xss
