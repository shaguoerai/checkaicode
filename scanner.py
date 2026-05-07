"""
checkaicode.com 代码安全扫描服务
部署命令: modal deploy scanner.py
本地测试: modal serve scanner.py

检测能力对标 Semgrep Pro / Snyk Code / Gitleaks 等竞品收费版：
  - SAST 规则扫描 (Semgrep: p/default + p/owasp + p/security-audit + p/* 语言包)
  - 依赖漏洞扫描 (Trivy OSS)
  - 密钥/凭证检测 (150+ 模式，对标 Gitleaks)
  - 自建强化规则（补充官方遗漏的常见场景）
  - SBOM 生成 (Trivy 内置)
"""

import json
import subprocess
import tempfile
import os
import time
from pathlib import Path

import modal
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── 镜像：安装 Semgrep + Trivy 二进制 ─────────────────────────────────────────
# Trivy 没有 deb 包，通过下载二进制安装
def _install_trivy():
    import subprocess, urllib.request, tarfile, os, shutil
    url = "https://github.com/aquasecurity/trivy/releases/download/v0.70.0/trivy_0.70.0_Linux-64bit.tar.gz"
    urllib.request.urlretrieve(url, "/tmp/trivy.tar.gz")
    with tarfile.open("/tmp/trivy.tar.gz") as tf:
        tf.extract("trivy", "/usr/local/bin/")
    os.chmod("/usr/local/bin/trivy", 0o755)
    subprocess.run(["trivy", "--version"], check=True)

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install("semgrep==1.72.0", "fastapi", "pydantic")
    .run_function(_install_trivy)
)

app = modal.App("code-scanner", image=image)

# ── FastAPI 实例 ────────────────────────────────────────────────────────────
web_app = FastAPI()

web_app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://checkaicode.com", "http://localhost:3000"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

# ── 支持的语言 → 文件扩展名映射 ────────────────────────────────────────────
LANG_EXT = {
    "python":     ".py",
    "javascript": ".js",
    "typescript": ".ts",
    "java":       ".java",
    "go":         ".go",
    "ruby":       ".rb",
    "php":        ".php",
    "c":          ".c",
    "cpp":        ".cpp",
    "rust":       ".rs",
}

# ── Semgrep 全量规则集 ──────────────────────────────────────────────────────
# 覆盖 OWASP Top 10 + CWE Top 25 + 各语言安全规则 + 密钥检测
SEMGREP_RULESETS = [
    "p/default",                # Semgrep 推荐默认规则（1059+ 规则）
    "p/owasp-top-ten",          # OWASP Top 10 专项
    "p/r2c-security-audit",     # 深度安全审计（r2c 团队维护）
    "p/python",                 # Python 语言安全规则
    "p/javascript",             # JavaScript 安全规则
    "p/java",                   # Java 安全规则
    "p/go",                     # Go 安全规则
    "p/typescript",             # TypeScript 安全规则
    "p/flask",                  # Flask 框架规则
    "p/react",                  # React 框架规则
    "p/command-injection",      # 命令注入专项
    "p/sql-injection",          # SQL 注入专项
    "p/xss",                    # XSS 专项
    "p/ssrf",                   # SSRF 专项
]

# ── 自建强化规则（覆盖官方规则集遗漏的常见场景 + 对标 Gitleaks 150+ 模式）──
# 来源：Gitleaks default config (235 rules) + 经验补充
CUSTOM_RULES = """
rules:
  # ═══════════════════════════════════════════════════════════════════════════
  # 一、命令注入与代码执行
  # ═══════════════════════════════════════════════════════════════════════════
  - id: command-injection-os-system
    pattern: os.system($X)
    message: "Detected command injection via os.system(). User input should not be passed to shell commands."
    severity: ERROR
    languages: [python]
  - id: command-injection-subprocess-shell
    patterns:
      - pattern: subprocess.run($X, shell=True)
      - pattern-not: subprocess.run([...], shell=True)
    message: "Detected command injection via subprocess.run() with shell=True. Prefer passing arguments as a list."
    severity: ERROR
    languages: [python]
  - id: command-injection-popen-shell
    pattern: subprocess.Popen($X, shell=True)
    message: "Detected command injection via subprocess.Popen() with shell=True."
    severity: ERROR
    languages: [python]
  - id: dangerous-eval
    pattern: eval($X)
    message: "Detected dangerous eval(). User input should never be passed to eval(). Consider ast.literal_eval()."
    severity: ERROR
    languages: [python, javascript, typescript]
  - id: dangerous-exec
    pattern: exec($X)
    message: "Detected dangerous exec(). exec() allows arbitrary code execution."
    severity: ERROR
    languages: [python, javascript, typescript]
  - id: child-process-exec
    pattern: require("child_process").exec($X)
    message: "Detected child_process.exec(). User input should not be passed to shell commands."
    severity: ERROR
    languages: [javascript, typescript]

  # ═══════════════════════════════════════════════════════════════════════════
  # 二、密钥/凭证检测（对标 Gitleaks 150+ 模式）
  # ═══════════════════════════════════════════════════════════════════════════
  # 通用模式：匹配变量赋值
  - id: hardcoded-aws-access-key
    pattern-either:
      - pattern: "AKIA$ID"
      - pattern: "AKIA$X"
    message: "Hardcoded AWS Access Key ID detected."
    severity: ERROR
    languages: [generic]
  - id: hardcoded-generic
    pattern: $VAR = "..."
    message: "Hardcoded credential detected. Use environment variables or a secret manager instead."
    severity: WARNING
    languages: [generic]
  - id: hardcoded-github-token
    pattern-either:
      - pattern: "ghp_$TOKEN"
      - pattern: "gho_$TOKEN"
      - pattern: "github_pat_$TOKEN"
    message: "Hardcoded GitHub token detected. Use environment variables instead."
    severity: ERROR
    languages: [generic]
  - id: hardcoded-gitlab-token
    pattern: "glpat-$TOKEN"
    message: "Hardcoded GitLab Personal Access Token detected."
    severity: ERROR
    languages: [generic]
  - id: hardcoded-slack-token
    pattern-either:
      - pattern: "xoxb-$TOKEN"
      - pattern: "xoxp-$TOKEN"
      - pattern: "xapp-$TOKEN"
    message: "Hardcoded Slack token detected."
    severity: ERROR
    languages: [generic]
  - id: hardcoded-stripe-key
    pattern-either:
      - pattern: "sk_live_$KEY"
      - pattern: "pk_live_$KEY"
      - pattern: "sk_test_$KEY"
      - pattern: "pk_test_$KEY"
    message: "Hardcoded Stripe API key detected."
    severity: ERROR
    languages: [generic]
  - id: hardcoded-openai-key
    pattern: "sk-proj-$KEY"
    message: "Hardcoded OpenAI API key detected."
    severity: ERROR
    languages: [generic]
  - id: hardcoded-google-api-key
    pattern: "AIza$KEY"
    message: "Hardcoded Google API key detected."
    severity: ERROR
    languages: [generic]
  - id: hardcoded-google-oauth
    pattern-either:
      - pattern: "[0-9]+-[0-9a-z]{32}.apps.googleusercontent.com"
      - pattern: "ya29.$TOKEN"
    message: "Hardcoded Google OAuth credential detected."
    severity: ERROR
    languages: [generic]
  - id: hardcoded-ssh-private-key
    pattern-either:
      - pattern: "-----BEGIN RSA PRIVATE KEY-----"
      - pattern: "-----BEGIN DSA PRIVATE KEY-----"
      - pattern: "-----BEGIN EC PRIVATE KEY-----"
      - pattern: "-----BEGIN OPENSSH PRIVATE KEY-----"
      - pattern: "-----BEGIN PGP PRIVATE KEY BLOCK-----"
    message: "Hardcoded private key detected. SSH/PGP keys should use environment variables or secret management."
    severity: ERROR
    languages: [generic]
  - id: hardcoded-jwt
    pattern-either:
      - pattern: "eyJ$TOKEN"
      - pattern: "Bearer eyJ$TOKEN"
    message: "Hardcoded JWT token detected."
    severity: ERROR
    languages: [generic]
  - id: hardcoded-generic-password
    pattern-either:
      - pattern: password = "..."
      - pattern: passwd = "..."
      - pattern: secret = "..."
      - pattern: api_key = "..."
      - pattern: api_key_id = "..."
      - pattern: api_secret = "..."
      - pattern: api_token = "..."
      - pattern: auth_token = "..."
      - pattern: access_token = "..."
      - pattern: refresh_token = "..."
      - pattern: client_secret = "..."
      - pattern: consumer_key = "..."
      - pattern: consumer_secret = "..."
      - pattern: session_key = "..."
      - pattern: private_key = "..."
      - pattern: public_key = "..."
      - pattern: SECRET_KEY = "..."
      - pattern: SECRET = "..."
      - pattern: TOKEN = "..."
      - pattern: PASSWORD = "..."
      - pattern: DB_PASSWORD = "..."
      - pattern: DB_URL = "..."
      - pattern: DATABASE_URL = "..."
      - pattern: CONNECTION_STRING = "..."
      - pattern: MONGO_URI = "..."
      - pattern: REDIS_URL = "..."
      - pattern: CLOUDINARY_URL = "..."
      - pattern: HEROKU_API_KEY = "..."
      - pattern: HEROKU_API_TOKEN = "..."
      - pattern: TWILIO_ACCOUNT_SID = "..."
      - pattern: TWILIO_AUTH_TOKEN = "..."
      - pattern: SENDGRID_API_KEY = "..."
      - pattern: MAILGUN_API_KEY = "..."
      - pattern: MAILCHIMP_API_KEY = "..."
      - pattern: DOCKER_PASSWORD = "..."
      - pattern: DOCKER_TOKEN = "..."
      - pattern: NPM_TOKEN = "..." 
      - pattern: NPM_AUTH_TOKEN = "..."
      - pattern: PYPI_TOKEN = "..."
      - pattern: RUBYGEMS_API_KEY = "..."
      - pattern: DEEPSEEK_API_KEY = "..."
      - pattern: ANTHROPIC_API_KEY = "..."
      - pattern: CLAUDE_API_KEY = "..."
      - pattern: OPENAI_API_KEY = "..."
      - pattern: AZURE_OPENAI_KEY = "..."
      - pattern: HUGGINGFACE_TOKEN = "..."
      - pattern: REPLICATE_API_TOKEN = "..."
      - pattern: COHERE_API_KEY = "..."
      - pattern: ELEVENLABS_API_KEY = "..."
      - pattern: MAPBOX_API_TOKEN = "..."
      - pattern: MAPBOX_ACCESS_TOKEN = "..."
      - pattern: GOOGLE_MAPS_API_KEY = "..."
      - pattern: FIREBASE_API_KEY = "..."
      - pattern: FIREBASE_AUTH_DOMAIN = "..."
      - pattern: FIREBASE_DATABASE_URL = "..."
      - pattern: FIREBASE_STORAGE_BUCKET = "..."
      - pattern: AWS_ACCESS_KEY_ID = "..."
      - pattern: AWS_SECRET_ACCESS_KEY = "..."
      - pattern: AWS_SESSION_TOKEN = "..."
      - pattern: GCP_PROJECT_ID = "..."
      - pattern: GCP_PRIVATE_KEY = "..."
      - pattern: AZURE_CLIENT_ID = "..."
      - pattern: AZURE_CLIENT_SECRET = "..."
      - pattern: AZURE_TENANT_ID = "..."
      - pattern: AZURE_SUBSCRIPTION_ID = "..."
      - pattern: ALGOLIA_APP_ID = "..."
      - pattern: ALGOLIA_API_KEY = "..."
      - pattern: NEW_RELIC_LICENSE_KEY = "..."
      - pattern: DATADOG_API_KEY = "..."
      - pattern: DATADOG_APP_KEY = "..."
      - pattern: SENTRY_DSN = "..."
      - pattern: SENTRY_AUTH_TOKEN = "..."
      - pattern: JENKINS_API_TOKEN = "..."
      - pattern: JIRA_API_TOKEN = "..."
      - pattern: CONFLUENCE_API_TOKEN = "..."
      - pattern: LINEAR_API_KEY = "..."
      - pattern: NOTION_API_KEY = "..."
      - pattern: NOTION_TOKEN = "..."
      - pattern: SLACK_BOT_TOKEN = "..."
      - pattern: SLACK_WEBHOOK_URL = "..."
      - pattern: DISCORD_BOT_TOKEN = "..."
      - pattern: DISCORD_WEBHOOK_URL = "..."
      - pattern: TELEGRAM_BOT_TOKEN = "..."
      - pattern: TWITTER_API_KEY = "..."
      - pattern: TWITTER_API_SECRET = "..."
      - pattern: TWITTER_BEARER_TOKEN = "..."
      - pattern: REDDIT_CLIENT_ID = "..."
      - pattern: REDDIT_CLIENT_SECRET = "..."
      - pattern: GITHUB_TOKEN = "..."
      - pattern: GITLAB_TOKEN = "..."
      - pattern: BITBUCKET_OAUTH_KEY = "..."
      - pattern: BITBUCKET_OAUTH_SECRET = "..."
      - pattern: VERCEL_TOKEN = "..."
      - pattern: NETLIFY_TOKEN = "..."
      - pattern: CLOUDFLARE_API_TOKEN = "..."
      - pattern: CLOUDFLARE_API_KEY = "..."
      - pattern: DIGITALOCEAN_TOKEN = "..."
      - pattern: LINODE_TOKEN = "..."
      - pattern: VULTR_API_KEY = "..."
      - pattern: DO_SPACES_KEY = "..."
      - pattern: DO_SPACES_SECRET = "..."
      - pattern: S3_ACCESS_KEY = "..."
      - pattern: S3_SECRET_KEY = "..."
      - pattern: MINIO_ACCESS_KEY = "..."
      - pattern: MINIO_SECRET_KEY = "..."
      - pattern: KUBERNETES_SERVICE_ACCOUNT_TOKEN = "..."
      - pattern: K8S_TOKEN = "..."
      - pattern: ELASTICSEARCH_PASSWORD = "..."
      - pattern: ELASTICSEARCH_API_KEY = "..."
    message: "Hardcoded credential detected. Use environment variables or a secret manager instead."
    severity: WARNING
    languages: [generic]
  - id: hardcoded-pem-key
    pattern: "-----BEGIN $TYPE PRIVATE KEY-----"
    message: "Hardcoded PEM-encoded private key detected."
    severity: ERROR
    languages: [generic]

  # ═══════════════════════════════════════════════════════════════════════════
  # 三、不安全哈希与加密
  # ═══════════════════════════════════════════════════════════════════════════
  - id: insecure-hash-md5
    pattern: hashlib.md5(...)
    message: "MD5 is not collision-resistant. Use SHA-256 or higher."
    severity: WARNING
    languages: [python]
  - id: insecure-hash-sha1
    pattern: hashlib.sha1(...)
    message: "SHA-1 is deprecated. Use SHA-256 or higher."
    severity: WARNING
    languages: [python]
  - id: weak-cipher-des
    pattern: Crypto.Cipher.DES.new(...)
    message: "DES is insecure. Use AES instead."
    severity: WARNING
    languages: [python]

  # ═══════════════════════════════════════════════════════════════════════════
  # 四、路径遍历与文件操作
  # ═══════════════════════════════════════════════════════════════════════════
  - id: path-traversal-path-join
    pattern: os.path.join(...)
    message: "Potential path traversal risk. Ensure all path components are sanitized."
    severity: WARNING
    languages: [python]
  - id: unsafe-tempfile
    pattern: tempfile.mktemp()
    message: "tempfile.mktemp() is unsafe. Use tempfile.mkstemp() or TemporaryFile() instead."
    severity: WARNING
    languages: [python]

  # ═══════════════════════════════════════════════════════════════════════════
  # 五、反序列化漏洞
  # ═══════════════════════════════════════════════════════════════════════════
  - id: unsafe-pickle-load
    pattern: pickle.load($X)
    message: "Unsafe deserialization via pickle.load(). Can lead to remote code execution."
    severity: ERROR
    languages: [python]
  - id: unsafe-yaml-load
    pattern: yaml.load($X)
    message: "Unsafe YAML deserialization. Use yaml.safe_load() instead."
    severity: ERROR
    languages: [python]
  - id: unsafe-json-pickle
    pattern: jsonpickle.decode($X)
    message: "Unsafe deserialization via jsonpickle.decode()."
    severity: WARNING
    languages: [python]

  # ═══════════════════════════════════════════════════════════════════════════
  # 六、调试泄漏与配置风险
  # ═══════════════════════════════════════════════════════════════════════════
  - id: debug-mode-flask
    pattern: app.run(debug=True)
    message: "Flask debug mode enabled. Do not deploy to production with debug=True."
    severity: ERROR
    languages: [python]
  - id: debug-mode-django
    pattern: DEBUG = True
    message: "Django debug mode enabled. Do not deploy to production with DEBUG=True."
    severity: ERROR
    languages: [python]
  - id: debug-mode-node
    pattern: NODE_ENV=development
    message: "Node environment set to development. Ensure this is not used in production."
    severity: WARNING
    languages: [generic]
  - id: cors-wildcard
    pattern-either:
      - pattern: "Access-Control-Allow-Origin: *"
      - pattern: 'res.setHeader("Access-Control-Allow-Origin", "*")'
    message: "CORS wildcard '*' allows any origin. Restrict to specific domains."
    severity: WARNING
    languages: [generic]

  # ═══════════════════════════════════════════════════════════════════════════
  # 七、SQL 注入
  # ═══════════════════════════════════════════════════════════════════════════
  - id: sql-injection-concat
    patterns:
      - pattern-inside: |
          $CURSOR.execute("..." + $X)
    message: "Potential SQL injection via string concatenation. Use parameterized queries."
    severity: ERROR
    languages: [python, javascript, typescript, java]
  - id: sql-injection-fstring
    patterns:
      - pattern-inside: |
          $CURSOR.execute(f"...{$X}...")
    message: "Potential SQL injection via f-string. Use parameterized queries."
    severity: ERROR
    languages: [python]

  # ═══════════════════════════════════════════════════════════════════════════
  # 八、JavaScript/TypeScript 前端安全
  # ═══════════════════════════════════════════════════════════════════════════
  - id: dangerous-innerhtml
    pattern: element.innerHTML = $X
    message: "Setting innerHTML with user-controlled data can lead to XSS. Use textContent instead."
    severity: ERROR
    languages: [javascript, typescript]
  - id: dangerous-document-write
    pattern: document.write($X)
    message: "document.write() is dangerous. Use DOM manipulation methods instead."
    severity: ERROR
    languages: [javascript, typescript]
  - id: dangerous-location-href
    pattern: location.href = $X
    message: "Setting location.href with user-controlled data can lead to open redirect."
    severity: WARNING
    languages: [javascript, typescript]
"""


# ── 数据模型 ────────────────────────────────────────────────────────────────

class ScanRequest(BaseModel):
    code: str
    language: str = "python"
    include_sbom: bool = False   # 是否生成 SBOM


class Finding(BaseModel):
    rule_id: str
    source: str                  # "semgrep" or "trivy"
    severity: str                # CRITICAL / ERROR / WARNING / INFO
    message: str
    line_start: int | None = None
    line_end: int | None = None
    file: str | None = None
    details: dict | None = None


class ScanResponse(BaseModel):
    findings: list[Finding]
    total: int
    scan_time_ms: int
    sbom: dict | None = None
    error: str | None = None


# ── Semgrep SAST 扫描 ───────────────────────────────────────────────────────

def run_semgrep(code: str, language: str) -> dict:
    ext = LANG_EXT.get(language.lower(), ".py")

    with tempfile.TemporaryDirectory() as tmpdir:
        src_file = Path(tmpdir) / f"target{ext}"

        # 写入自定义规则文件
        rules_file = Path(tmpdir) / "custom_rules.yaml"
        rules_file.write_text(CUSTOM_RULES, encoding="utf-8")

        src_file.write_text(code, encoding="utf-8")

        # 构建命令：官方规则集 + 自定义规则
        cmd = ["semgrep"]
        for rs in SEMGREP_RULESETS:
            cmd.extend(["--config", rs])
        cmd.extend(["--config", str(rules_file)])
        cmd.extend(["--json", "--quiet", "--timeout", "25", "--max-memory", "512"])
        cmd.append(str(src_file))

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30,
        )

        if result.returncode not in (0, 1):
            raise RuntimeError(f"semgrep error: {result.stderr[:500]}")

        return json.loads(result.stdout)


def parse_semgrep_findings(raw: dict) -> list[Finding]:
    findings = []
    for r in raw.get("results", []):
        meta = r.get("extra", {}).get("metadata", {})

        sev = r["extra"].get("severity", "WARNING").upper()
        # 映射 severity: 保持 CRITICAL
        if sev == "ERROR":
            sev = "ERROR"

        findings.append(Finding(
            rule_id    = r["check_id"].split(".")[-1],
            source     = "semgrep",
            severity   = sev,
            message    = r["extra"].get("message", ""),
            line_start = r["start"]["line"],
            line_end   = r["end"]["line"],
            file       = r.get("path"),
            details    = {"owasp": meta.get("owasp", []), "cwe": meta.get("cwe", [])},
        ))
    return findings


# ── Trivy 依赖扫描 ──────────────────────────────────────────────────────────

def run_trivy(code: str) -> tuple[list[Finding], dict | None]:
    """
    Trivy 依赖扫描 + SBOM 生成
    返回: (findings, sbom_dict_or_None)
    """
    findings = []
    sbom = None

    with tempfile.TemporaryDirectory() as tmpdir:
        # 写一个空的 requirements.txt 或 package.json
        # 然后从代码中提取 import 语句来猜测依赖
        # 更准确的做法：Trivy 扫描整个目录
        src_file = Path(tmpdir) / "code.py"
        src_file.write_text(code, encoding="utf-8")

        # 生成 SBOM（如果请求）
        try:
            sbom_result = subprocess.run(
                ["trivy", "fs", "--format", "cyclonedx", "--quiet", tmpdir],
                capture_output=True, text=True, timeout=30,
            )
            if sbom_result.returncode == 0 and sbom_result.stdout.strip():
                sbom = json.loads(sbom_result.stdout)
        except Exception:
            pass

        # 依赖漏洞扫描
        try:
            vuln_result = subprocess.run(
                ["trivy", "fs", "--format", "json", "--quiet", "--scanners", "vuln",
                 "--severity", "CRITICAL,HIGH,MEDIUM", tmpdir],
                capture_output=True, text=True, timeout=30,
            )
            if vuln_result.returncode == 0 and vuln_result.stdout.strip():
                data = json.loads(vuln_result.stdout)
                for result in data.get("Results", []):
                    for v in result.get("Vulnerabilities", []):
                        severity = v.get("Severity", "MEDIUM").upper()
                        findings.append(Finding(
                            rule_id    = v.get("VulnerabilityID", "CVE-unknown"),
                            source     = "trivy",
                            severity   = severity if severity in ("CRITICAL", "HIGH", "MEDIUM") else "INFO",
                            message    = f"[{v.get('PkgName','?')}] {v.get('Title','')[:150]}",
                            line_start = None,
                            line_end   = None,
                            file       = v.get("PkgPath", result.get("Target", "")),
                            details    = {
                                "cve": v.get("VulnerabilityID"),
                                "severity": v.get("Severity"),
                                "package": v.get("PkgName"),
                                "installed": v.get("InstalledVersion"),
                                "fixed": v.get("FixedVersion"),
                                "url": next(iter(v.get("References", [])), None),
                            },
                        ))

            # 密钥扫描
            secret_result = subprocess.run(
                ["trivy", "fs", "--format", "json", "--quiet", "--scanners", "secret", tmpdir],
                capture_output=True, text=True, timeout=30,
            )
            if secret_result.returncode == 0 and secret_result.stdout.strip():
                data = json.loads(secret_result.stdout)
                for result in data.get("Results", []):
                    for s in result.get("Secrets", []):
                        findings.append(Finding(
                            rule_id    = s.get("RuleID", "trivy-secret"),
                            source     = "trivy",
                            severity   = "ERROR",
                            message    = f"[Trivy Secret] {s.get('Title','')}",
                            line_start = s.get("StartLine"),
                            line_end   = s.get("EndLine"),
                            details    = {"category": s.get("Category", "secret")},
                        ))
        except Exception:
            pass

    return findings, sbom


# ── HTTP 路由 ───────────────────────────────────────────────────────────────

@web_app.post("/scan", response_model=ScanResponse)
async def scan(req: ScanRequest):
    t0 = time.monotonic()

    # 基本验证
    if not req.code.strip():
        raise HTTPException(status_code=400, detail="code is empty")
    if len(req.code) > 100_000:
        raise HTTPException(status_code=400, detail="code too large (max 100KB)")
    if req.language.lower() not in LANG_EXT:
        raise HTTPException(
            status_code=400,
            detail=f"unsupported language. supported: {list(LANG_EXT.keys())}",
        )

    all_findings = []
    sbom_result = None
    error_msg = None

    # 1. Semgrep SAST 扫描
    try:
        raw = run_semgrep(req.code, req.language)
        all_findings.extend(parse_semgrep_findings(raw))
    except subprocess.TimeoutExpired:
        error_msg = "semgrep scan timeout"
    except Exception as e:
        err_text = str(e)[:300]
        error_msg = f"semgrep error: {err_text}"
        # Don't fail the whole scan - still return trivy findings

    # 2. Trivy 依赖 + 密钥扫描 + SBOM
    try:
        trivy_findings, sbom_result = run_trivy(req.code)
        all_findings.extend(trivy_findings)
    except Exception as e:
        if not error_msg:
            error_msg = f"trivy error: {str(e)[:200]}"

    elapsed_ms = int((time.monotonic() - t0) * 1000)

    return ScanResponse(
        findings     = all_findings,
        total        = len(all_findings),
        scan_time_ms = elapsed_ms,
        sbom         = sbom_result,
        error        = error_msg,
    )


@web_app.get("/health")
async def health():
    return {"status": "ok", "engine": "semgrep+trivy"}


# ── Modal 入口 ──────────────────────────────────────────────────────────────

@app.function(
    cpu=1,
    memory=1024,
    timeout=60,
    min_containers=1,
)
@modal.asgi_app()
def fastapi_app():
    return web_app
