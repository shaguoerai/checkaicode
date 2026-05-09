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

RULESETS = [
    "p/default",
    "p/owasp-top-ten",
    "p/javascript",
]


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

            cmd = [
                sys.executable,
                "-m",
                "semgrep",
                "scan",
                "--json",
                "--quiet",
            ]

            for ruleset in RULESETS:
                cmd.extend(["--config", ruleset])

            cmd.append(src_file)

            started = time.time()
            proc = subprocess.run(
                cmd,
                cwd=tmp_dir,
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
                    "stderr": proc.stderr[-2000:] if proc.returncode not in (0, 1) else "",
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
