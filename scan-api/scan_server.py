#!/usr/bin/env python3
"""Internal Semgrep scan API for checkaicode.com.
Runs on the Singapore server, called by the Vercel-hosted Next.js backend.
"""
import http.server
import json
import subprocess
import tempfile
import os
import signal
import sys

PORT = 3001

def run_semgrep(code: str, language: str) -> dict:
    """Write code to temp file, run semgrep, parse results."""
    ext_map = {
        "python": ".py", "javascript": ".js", "typescript": ".ts",
        "go": ".go", "java": ".java", "ruby": ".rb", "rust": ".rs",
        "c": ".c", "cpp": ".cpp", "csharp": ".cs", "php": ".php",
        "swift": ".swift", "kotlin": ".kt", "html": ".html",
        "css": ".css", "sql": ".sql", "shell": ".sh", "json": ".json",
        "yaml": ".yaml", "markdown": ".md",
    }
    lang = language.lower()
    ext = ext_map.get(lang, ".txt")

    tmp = tempfile.NamedTemporaryFile(mode="w", suffix=ext, delete=False)
    try:
        tmp.write(code)
        tmp.close()

        cmd = ["semgrep", "--config", "auto", "--json", tmp.name]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)

        # semgrep exits 0 when no findings, non-zero when findings exist
        output = result.stdout or result.stderr
        if not output.strip():
            return {
                "summary": "No issues found.",
                "score": 100,
                "issues": [],
                "suggestions": [],
            }

        data = json.loads(output)
        issues = []
        suggestions = []
        score = 100

        for r in data.get("results", []):
            extra = r.get("extra", {})
            metadata = extra.get("metadata", {})
            sev = extra.get("severity", "warning")
            fix = extra.get("fix")

            # Map severity
            if sev.lower() == "error":
                severity = "critical"
            elif sev.lower() == "warning":
                severity = "warning"
            else:
                severity = "info"

            # Map type
            check_id = r.get("check_id", "")
            cwe = metadata.get("cwe", [])
            owasp = metadata.get("owasp", [])
            sec_kw = ["inject", "sql", "xss", "csrf", "command", "eval",
                      "exec", "deserial", "traversal", "path", "ssrf",
                      "crypto", "password", "secret", "token", "auth",
                      "cwe", "owasp", "cve", "vuln"]
            has_security = any(k in check_id.lower() for k in sec_kw)
            issue_type = "security" if (has_security or cwe or owasp) else "quality"

            docs_url = None
            refs = metadata.get("references", [])
            if refs:
                docs_url = refs[0]

            start = r.get("start", {})
            end = r.get("end", {})

            issue = {
                "type": issue_type,
                "severity": severity,
                "file": r.get("path", "input"),
                "line": start.get("line", 1),
                "column": start.get("col"),
                "message": extra.get("message", check_id),
                "fix": fix,
                "docsUrl": docs_url,
                "ruleId": check_id,
                "endLine": end.get("line"),
            }
            issues.append(issue)

            if severity == "critical":
                score -= 15
            elif severity == "warning":
                score -= 5
            else:
                score -= 2

            if fix:
                suggestions.append(f"[{check_id}] {fix}")

        score = max(0, min(100, score))
        cnt = len(issues)
        crit = sum(1 for i in issues if i["severity"] == "critical")
        warn = sum(1 for i in issues if i["severity"] == "warning")
        info = sum(1 for i in issues if i["severity"] == "info")

        summary = f"Found {cnt} issue{'s' if cnt != 1 else ''} ({crit} critical, {warn} warning, {info} info)." if cnt else "No issues found."

        return {
            "summary": summary,
            "score": score,
            "issues": issues,
            "suggestions": suggestions,
        }

    except subprocess.TimeoutExpired:
        return {"summary": "Scan timed out.", "score": 0, "issues": [], "suggestions": []}
    except json.JSONDecodeError:
        return {"summary": "Scan failed: could not parse results.", "score": 0, "issues": [], "suggestions": []}
    except FileNotFoundError:
        return {"summary": "Semgrep is not installed on the server.", "score": 0, "issues": [], "suggestions": []}
    except Exception as e:
        return {"summary": f"Scan error: {str(e)}", "score": 0, "issues": [], "suggestions": []}
    finally:
        try:
            os.unlink(tmp.name)
        except OSError:
            pass


class ScanHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == "/scan":
            try:
                length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(length)
                data = json.loads(body)
                code = data.get("code", "")
                language = data.get("language", "auto")
                result = run_semgrep(code, language)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok"}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        sys.stderr.write("[scan-api] %s\n" % (args[1] if len(args) > 1 else str(args)))


def main():
    server = http.server.HTTPServer(("0.0.0.0", PORT), ScanHandler)
    print(f"[scan-api] Starting on 127.0.0.1:{PORT}")
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        sys.exit(0)


if __name__ == "__main__":
    main()
