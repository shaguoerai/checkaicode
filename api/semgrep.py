import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
from http.server import BaseHTTPRequestHandler


LANG_EXT = {
    "python": ".py",
    "javascript": ".js",
    "typescript": ".ts",
    "java": ".java",
    "go": ".go",
    "ruby": ".rb",
    "php": ".php",
    "c": ".c",
    "cpp": ".cpp",
    "rust": ".rs",
    "kotlin": ".kt",
    "scala": ".scala",
    "swift": ".swift",
    "c#": ".cs",
    "csharp": ".cs",
}

# ── 14 套规则集，按语言动态加载 ──
# 通用规则（所有语言都跑）
COMMON_RULESETS = [
    "p/default",
    "p/owasp-top-ten",
    "p/command-injection",
    "p/jwt",
    "p/secrets",
    "p/supply-chain",
]

# 语言专属规则
LANGUAGE_RULESETS = {
    "javascript": ["p/javascript", "p/react", "p/nodejs"],
    "typescript": ["p/typescript", "p/react", "p/nodejs"],
    "python": ["p/python"],
    "go": ["p/golang"],
    "java": ["p/java"],
}

# 被排除的规则集（已知不稳定或重复）
EXCLUDED_RULESETS = {"p/ssrf", "p/r2c-security-audit", "p/sql-injection", "p/xss"}


def rulesets_for(language):
    """返回该语言应加载的规则集列表（去重，不含被排除项）"""
    lang = language.lower()
    rulesets = COMMON_RULESETS + LANGUAGE_RULESETS.get(lang, [])
    # 去重并保持顺序
    seen = set()
    result = []
    for r in rulesets:
        if r not in seen and r not in EXCLUDED_RULESETS:
            seen.add(r)
            result.append(r)
    return result


def send_json(handler, status, payload):
    data = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("content-type", "application/json")
    handler.send_header("content-length", str(len(data)))
    handler.end_headers()
    handler.wfile.write(data)


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        send_json(self, 200, {"ok": True, "service": "checkaicode-semgrep"})

    def do_POST(self):
        try:
            length = int(self.headers.get("content-length", "0"))
            body = json.loads(self.rfile.read(length).decode("utf-8"))
        except Exception:
            send_json(self, 400, {"error": "Invalid JSON body"})
            return

        code = body.get("code") or ""
        language = str(body.get("language") or "javascript").lower()
        filename = str(body.get("filename") or "target")

        if not code.strip():
            send_json(self, 400, {"error": "Code required"})
            return

        ext = LANG_EXT.get(language) or os.path.splitext(filename)[1] or ".txt"
        tmp_dir = tempfile.mkdtemp(prefix="checkaicode-semgrep-")
        src_file = os.path.join(tmp_dir, "target" + ext)

        try:
            with open(src_file, "w", encoding="utf-8") as f:
                f.write(code)

            semgrep_home = os.path.join(tmp_dir, ".semgrep")
            semgrep_cache = os.path.join(tmp_dir, ".cache")
            os.makedirs(semgrep_home, exist_ok=True)
            os.makedirs(semgrep_cache, exist_ok=True)

            # ── 本地规则优先，远端 fallback ──
            rulesets = rulesets_for(language)
            local_rules_dir = os.path.join(os.path.dirname(__file__), "..", "semgrep-rules")
            final_configs = []
            for rs in rulesets:
                local_yaml = os.path.join(local_rules_dir, rs.replace("/", "_") + ".yaml")
                if os.path.exists(local_yaml):
                    final_configs.append(local_yaml)
                else:
                    final_configs.append(rs)

            cmd = [
                sys.executable,
                "-c",
                "from semgrep.console_scripts.pysemgrep import main; main()",
                "scan",
                "--json",
                "--quiet",
            ]

            for cfg in final_configs:
                cmd.extend(["--config", cfg])

            cmd.append(src_file)
            env = {
                **os.environ,
                "HOME": tmp_dir,
                "XDG_CONFIG_HOME": tmp_dir,
                "XDG_CACHE_HOME": semgrep_cache,
                "SEMGREP_SETTINGS_FILE": os.path.join(semgrep_home, "settings.yml"),
                "SEMGREP_LOG_FILE": os.path.join(semgrep_home, "semgrep.log"),
                "SEMGREP_ENABLE_VERSION_CHECK": "0",
                "SEMGREP_SEND_METRICS": "off",
                "PYTHONPATH": os.pathsep.join(
                    [
                        "/var/task/_vendor",
                        "/var/task",
                        os.environ.get("PYTHONPATH", ""),
                    ]
                ),
            }

            started = time.time()
            proc = subprocess.run(
                cmd,
                cwd=tmp_dir,
                env=env,
                text=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=55,
                check=False,
            )
            scan_time_ms = int((time.time() - started) * 1000)

            try:
                output = json.loads(proc.stdout or "{}")
            except json.JSONDecodeError:
                output = {"results": [], "errors": []}

            for result in output.get("results", []):
                if isinstance(result.get("path"), str):
                    result["path"] = result["path"].replace(tmp_dir, "input")

            send_json(
                self,
                200,
                {
                    "results": output.get("results", []),
                    "errors": output.get("errors", []),
                    "scanTimeMs": scan_time_ms,
                    "exitCode": proc.returncode,
                    "stderr": proc.stderr[-4000:] if proc.returncode != 0 and not output.get("results") else "",
                    "rulesets": rulesets,  # 返回实际使用的规则集，便于调试
                },
            )
        except subprocess.TimeoutExpired:
            send_json(
                self,
                200,
                {
                    "results": [],
                    "errors": [{"message": "Semgrep scan timed out"}],
                    "scanTimeMs": 55000,
                },
            )
        except Exception as exc:
            send_json(
                self,
                200,
                {
                    "results": [],
                    "errors": [{"message": str(exc)}],
                    "scanTimeMs": 0,
                },
            )
        finally:
            shutil.rmtree(tmp_dir, ignore_errors=True)
