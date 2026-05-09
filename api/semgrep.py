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

COMMON_RULESETS = [
    "p/default",
    "p/owasp-top-ten",
    "p/r2c-security-audit",
    "p/command-injection",
    "p/sql-injection",
    "p/xss",
]

LANGUAGE_RULESETS = {
    "python": ["p/python", "p/flask"],
    "javascript": ["p/javascript", "p/react"],
    "typescript": ["p/typescript", "p/react"],
    "java": ["p/java"],
    "go": ["p/go"],
}


def rulesets_for(language):
    rulesets = COMMON_RULESETS + LANGUAGE_RULESETS.get(language, [])
    return list(dict.fromkeys(rulesets))


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

            cmd = [
                sys.executable,
                "-c",
                "from semgrep.console_scripts.pysemgrep import main; main()",
                "scan",
                "--json",
                "--quiet",
            ]

            for ruleset in rulesets_for(language):
                cmd.extend(["--config", ruleset])

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
