import { Issue } from "./review-types";

interface Rule {
  id: string;
  type: Issue["type"];
  severity: Issue["severity"];
  title: string;
  description: string;
  fix_suggestion: string;
  fix_code?: string;
  reference_url?: string;
  detect: (code: string, lines: string[]) => Issue[];
}

function makeIssue(
  rule: Omit<Rule, "detect">,
  line: number,
  code_snippet: string
): Issue {
  return {
    id: rule.id,
    type: rule.type,
    severity: rule.severity,
    line,
    code_snippet,
    title: rule.title,
    description: rule.description,
    fix_suggestion: rule.fix_suggestion,
    fix_code: rule.fix_code,
    reference_url: rule.reference_url,
  };
}

const HALLUCINATED_PACKAGES: Record<string, string> = {
  "pandas_ai": "pandas-ai",
  "sklearn_pandas": "sklearn-pandas",
  "tensorflow_gpu": "tensorflow",
  "torchvision_models": "torchvision",
  "openai_chat": "openai",
  "langchain_openai": "langchain-openai",
  "langchain_anthropic": "langchain-anthropic",
  "numpy_ml": "numpy",
  "pandas_ml": "pandas",
  "chatgpt_api": "openai",
};

const HALLUCINATED_METHODS: Record<string, { correct: string; pkg?: string }> = {
  "requests.get_json": { correct: "requests.get(...).json()", pkg: "requests" },
  "requests.post_json": { correct: "requests.post(...).json()", pkg: "requests" },
  "json.load_string": { correct: "json.loads(...)", pkg: "json" },
  "json.dump_string": { correct: "json.dumps(...)", pkg: "json" },
  "list.append_all": { correct: "list.extend(...)" },
  "dict.add": { correct: "dict[key] = value" },
  "array.contains": { correct: "item in array" },
  "string.replace_all": { correct: "string.replace(..., ...)" },
  "openai.ChatCompletion.create": { correct: "client = openai.OpenAI(); client.chat.completions.create(...)", pkg: "openai" },
  "openai.Completion.create": { correct: "client = openai.OpenAI(); client.completions.create(...)", pkg: "openai" },
  "pandas.DataFrame.to_excel_sheet": { correct: "df.to_excel(..., sheet_name=...)", pkg: "pandas" },
  "numpy.array.sort_inplace": { correct: "arr.sort()", pkg: "numpy" },
};

const VERSION_MISMATCHES = [
  {
    pattern: /openai\.ChatCompletion\.create/,
    id: "VERSION-001",
    title: "OpenAI v1.x API 迁移",
    description: "openai.ChatCompletion.create() 在 openai v1.0.0+ 中已移除。请使用新 API。",
    fix_suggestion: "改用: client = openai.OpenAI(); client.chat.completions.create(...)",
    fix_code: "from openai import OpenAI\nclient = OpenAI()\nresponse = client.chat.completions.create(model='gpt-4')",
    reference_url: "https://github.com/openai/openai-python/discussions/742",
  },
  {
    pattern: /openai\.Completion\.create/,
    id: "VERSION-002",
    title: "OpenAI v1.x API 迁移 (Completion)",
    description: "openai.Completion.create() 在 openai v1.0.0+ 中已移除。",
    fix_suggestion: "改用: client = openai.OpenAI(); client.completions.create(...)",
    reference_url: "https://github.com/openai/openai-python/discussions/742",
  },
  {
    pattern: /langchain\.llms\.OpenAI/,
    id: "VERSION-003",
    title: "LangChain 弃用警告",
    description: "langchain.llms.OpenAI 在较新版本中已弃用，请使用 langchain-openai。",
    fix_suggestion: "改用: from langchain_openai import OpenAI",
    reference_url: "https://python.langchain.com/docs/guides/migration/",
  },
  {
    pattern: /tensorflow\.keras\.layers/,
    id: "VERSION-004",
    title: "TensorFlow Keras 导入变更",
    description: "tensorflow.keras 在 TF 2.16+ 中推荐直接使用 keras 包。",
    fix_suggestion: "改用: import keras; from keras import layers",
    reference_url: "https://keras.io/getting_started/",
  },
  {
    pattern: /sklearn\./,
    id: "VERSION-005",
    title: "scikit-learn 包名错误",
    description: "sklearn 是导入别名，实际包名为 scikit-learn。",
    fix_suggestion: "安装: pip install scikit-learn; 导入: import sklearn",
    reference_url: "https://scikit-learn.org/stable/install.html",
  },
];

const SECURITY_PATTERNS = [
  {
    pattern: /(sk|pk)_(live|test|proj)_[A-Za-z0-9]{24,}/,
    id: "SEC-001",
    title: "硬编码 API Key  detected",
    description: "代码中检测到可能的 API Key。请勿将密钥硬编码到源码中。",
    fix_suggestion: "使用环境变量: import os; api_key = os.environ.get('API_KEY')",
    severity: "critical" as const,
  },
  {
    pattern: /password\s*=\s*["'][^"']+["']/i,
    id: "SEC-002",
    title: "硬编码密码",
    description: "检测到硬编码密码。请使用环境变量或密钥管理服务。",
    fix_suggestion: "使用环境变量或密钥管理服务 (如 AWS Secrets Manager, HashiCorp Vault)",
    severity: "critical" as const,
  },
  {
    pattern: /eval\s*\(/,
    id: "SEC-003",
    title: "eval() 使用风险",
    description: "eval() 执行任意代码，存在严重的代码注入风险。",
    fix_suggestion: "避免使用 eval()，改用 ast.literal_eval() 或 JSON 解析",
    severity: "warning" as const,
  },
  {
    pattern: /exec\s*\(/,
    id: "SEC-004",
    title: "exec() 使用风险",
    description: "exec() 执行任意代码，存在严重的代码注入风险。",
    fix_suggestion: "避免使用 exec()，重构为安全的替代方案",
    severity: "warning" as const,
  },
];

const SEMANTIC_PATTERNS = [
  {
    pattern: /while\s+True\s*:/,
    id: "SEM-001",
    title: "无限循环风险 (while True)",
    description: "while True 循环缺少显式退出条件，可能导致程序挂起。",
    fix_suggestion: "确保循环内有 break 条件，或改用 for 循环",
    severity: "warning" as const,
  },
  {
    pattern: /while\s+1\s*:/,
    id: "SEM-002",
    title: "无限循环风险 (while 1)",
    description: "while 1 等同于 while True，缺少显式退出条件。",
    fix_suggestion: "确保循环内有 break 条件，或改用 for 循环",
    severity: "warning" as const,
  },
  {
    pattern: /open\s*\([^)]+\)(?!.*close)/,
    id: "SEM-003",
    title: "文件句柄未关闭",
    description: "文件打开后未在同级作用域内关闭，可能导致资源泄漏。",
    fix_suggestion: "使用 with 语句: with open(...) as f: ...",
    fix_code: "with open('file.txt', 'r') as f:\n    data = f.read()",
    severity: "warning" as const,
  },
  {
    pattern: /\.get\([^)]+\)(?!\s*\|\|)/,
    id: "SEM-004",
    title: "字典 get() 返回值未处理",
    description: "dict.get() 可能返回 None，后续操作可能引发 AttributeError。",
    fix_suggestion: "检查返回值: value = d.get('key'); if value is not None: ...",
    severity: "info" as const,
  },
  {
    pattern: /try\s*:\s*[^}]*}\s*catch\s*\(/,
    id: "SEM-005",
    title: "空的异常处理",
    description: "try-catch 块中 catch 为空，可能静默吞掉重要错误。",
    fix_suggestion: "至少记录日志: catch (e) { console.error(e); }",
    severity: "warning" as const,
  },
  {
    pattern: /JSON\.parse\s*\(/,
    id: "SEM-006",
    title: "JSON.parse 未处理异常",
    description: "JSON.parse 在输入非法时会抛出异常，应使用 try-catch 包裹。",
    fix_suggestion: "try { JSON.parse(str) } catch (e) { ... }",
    severity: "warning" as const,
  },
  {
    pattern: /\.split\(\s*\)/,
    id: "SEM-007",
    title: "split() 空参数歧义",
    description: "Python: split() 按空白分割; JS: split() 返回 ['']。行为不一致。",
    fix_suggestion: "显式指定分隔符: .split(' ') 或 .split(/\\s+/)",
    severity: "info" as const,
  },
  {
    pattern: /==\s*(null|undefined)/,
    id: "SEM-008",
    title: "宽松相等检查",
    description: "== null 同时匹配 null 和 undefined，可能引入隐式类型转换 bug。",
    fix_suggestion: "使用严格相等: === null 或 === undefined",
    severity: "info" as const,
  },
  {
    pattern: /typeof\s+\w+\s*===?\s*["']undefined["']/,
    id: "SEM-009",
    title: "typeof 检查变量未声明",
    description: "typeof 用于检查未声明变量是有效的，但检查已声明变量应直接用 === undefined。",
    fix_suggestion: "已声明变量直接用: if (x === undefined)",
    severity: "info" as const,
  },
  {
    pattern: /async\s+function\s+\w+\s*\([^)]*\)\s*\{[^}]*\}(?!\s*\w+\s*\()/,
    id: "SEM-010",
    title: "async 函数缺少 await",
    description: "函数声明为 async 但内部没有 await，async 是冗余的。",
    fix_suggestion: "移除 async 关键字，或添加 await 调用",
    severity: "info" as const,
  },
  {
    pattern: /new\s+Promise\s*\(\s*\(/,
    id: "SEM-011",
    title: "Promise 构造函数误用",
    description: "new Promise((resolve, reject) => ...) 是正确形式，检查是否遗漏参数。",
    fix_suggestion: "确保 Promise 构造器接收 (resolve, reject) 回调",
    severity: "warning" as const,
  },
  {
    pattern: /\.then\s*\([^)]*\)\s*\.then\s*\([^)]*\)\s*\.then\s*\(/,
    id: "SEM-012",
    title: "Promise 链过长",
    description: "过长的 .then() 链可读性差，建议使用 async/await 重构。",
    fix_suggestion: "改用 async/await 使代码扁平化",
    severity: "info" as const,
  },
  {
    pattern: /for\s*\(\s*var\s+/,
    id: "SEM-013",
    title: "var 循环变量作用域泄漏",
    description: "for 循环中使用 var 会导致变量提升到函数作用域，产生闭包陷阱。",
    fix_suggestion: "改用 let: for (let i = 0; ...)",
    severity: "warning" as const,
  },
  {
    pattern: /\.map\s*\([^)]*\)\s*\.forEach\s*\(/,
    id: "SEM-014",
    title: "map + forEach 冗余",
    description: "先 map 再 forEach 是冗余的，直接用 forEach 或 for...of。",
    fix_suggestion: "直接使用 forEach 或 for...of 遍历",
    severity: "info" as const,
  },
  {
    pattern: /fetch\s*\([^)]+\)(?!\s*\.then)/,
    id: "SEM-015",
    title: "fetch 未处理响应",
    description: "fetch 返回 Promise，必须处理响应或错误，否则请求结果丢失。",
    fix_suggestion: "await fetch(...) 或 fetch(...).then(res => ...)",
    severity: "warning" as const,
  },
  {
    pattern: /\.innerHTML\s*=\s*[^;]+/,
    id: "SEM-016",
    title: "innerHTML XSS 风险",
    description: "直接设置 innerHTML 可能引入 XSS，如果内容包含用户输入。",
    fix_suggestion: "使用 textContent 或 DOMPurify 净化输入",
    severity: "warning" as const,
  },
  {
    pattern: /document\.write\s*\(/,
    id: "SEM-017",
    title: "document.write 已弃用",
    description: "document.write 在异步加载脚本时可能清空页面，且存在 XSS 风险。",
    fix_suggestion: "使用 DOM API: document.createElement + appendChild",
    severity: "warning" as const,
  },
  {
    pattern: /\.querySelector\s*\([^)]+\)\s*\.(value|innerText|textContent)/,
    id: "SEM-018",
    title: "querySelector 结果未检查",
    description: "querySelector 可能返回 null，直接访问属性会抛出 TypeError。",
    fix_suggestion: "检查元素存在: const el = document.querySelector(...); if (el) { ... }",
    severity: "warning" as const,
  },
  {
    pattern: /setTimeout\s*\(\s*["'][^"']+["']/,
    id: "SEM-019",
    title: "setTimeout 字符串参数",
    description: "setTimeout('code', delay) 使用字符串会被 eval，存在注入风险。",
    fix_suggestion: "传入函数: setTimeout(() => { ... }, delay)",
    severity: "critical" as const,
  },
  {
    pattern: /setInterval\s*\(\s*["'][^"']+["']/,
    id: "SEM-020",
    title: "setInterval 字符串参数",
    description: "setInterval('code', delay) 使用字符串会被 eval，存在注入风险。",
    fix_suggestion: "传入函数: setInterval(() => { ... }, delay)",
    severity: "critical" as const,
  },
  {
    pattern: /\.catch\s*\(\s*\)\s*\{/,
    id: "SEM-021",
    title: "空的 catch 块",
    description: "catch 块为空，静默吞掉错误，调试困难。",
    fix_suggestion: "至少记录错误: .catch(err => console.error(err))",
    severity: "warning" as const,
  },
  {
    pattern: /Object\.prototype\.\w+\s*=/,
    id: "SEM-022",
    title: "修改原型链",
    description: "修改 Object.prototype 会影响所有对象，极不推荐。",
    fix_suggestion: "使用 Symbol 或 WeakMap 替代原型扩展",
    severity: "warning" as const,
  },
  {
    pattern: /delete\s+\w+\[\s*["'][^"']+["']\s*\]/,
    id: "SEM-023",
    title: "delete 操作符性能问题",
    description: "delete 对象属性会导致 V8 隐藏类退化，性能下降。",
    fix_suggestion: "赋值为 undefined: obj.key = undefined",
    severity: "info" as const,
  },
  {
    pattern: /new\s+Array\s*\(\s*\d+\s*\)/,
    id: "SEM-024",
    title: "Array 构造函数歧义",
    description: "new Array(3) 创建 [empty × 3]，而非 [3]。极易出错。",
    fix_suggestion: "使用字面量: [1, 2, 3] 或 Array.from({length: 3}, (_, i) => i)",
    severity: "warning" as const,
  },
  {
    pattern: /\.sort\s*\(\s*\)/,
    id: "SEM-025",
    title: "sort() 默认按字符串排序",
    description: "[10, 2].sort() 返回 [10, 2] 而非 [2, 10]，因为默认按字符串比较。",
    fix_suggestion: "显式比较器: .sort((a, b) => a - b)",
    severity: "warning" as const,
  },
];

function detectHallucinatedPackages(code: string, lines: string[]): Issue[] {
  const issues: Issue[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const [bad, good] of Object.entries(HALLUCINATED_PACKAGES)) {
      const regex = new RegExp(`\\b${bad.replace(/_/g, "[_-]?")}\\b`, "i");
      if (regex.test(line)) {
        issues.push(
          makeIssue(
            {
              id: `HALLUC-${bad.toUpperCase()}`,
              type: "hallucinated_api",
              severity: "critical",
              title: `包 '${bad}' 可能不存在`,
              description: `AI 生成了 '${bad}'，但 PyPI/npm 中无此确切包名。可能是 LLM 幻觉。`,
              fix_suggestion: `您可能想用: ${good}，请确认包名是否正确。`,
            },
            i + 1,
            line.trim()
          )
        );
      }
    }
  }
  return issues;
}

function detectHallucinatedMethods(code: string, lines: string[]): Issue[] {
  const issues: Issue[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const [bad, info] of Object.entries(HALLUCINATED_METHODS)) {
      const escaped = bad.replace(/\./g, "\\.").replace(/\(/g, "\\(");
      const regex = new RegExp(escaped, "i");
      if (regex.test(line)) {
        issues.push(
          makeIssue(
            {
              id: `HALLUC-METHOD-${bad.replace(/\./g, "-")}`,
              type: "hallucinated_api",
              severity: "critical",
              title: `方法 '${bad}' 不存在`,
              description: `AI 生成了不存在的方法 '${bad}'。${info.pkg ? `属于 ${info.pkg} 包。` : ""}`,
              fix_suggestion: `改用: ${info.correct}`,
            },
            i + 1,
            line.trim()
          )
        );
      }
    }
  }
  return issues;
}

function detectVersionMismatches(code: string, lines: string[]): Issue[] {
  const issues: Issue[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const rule of VERSION_MISMATCHES) {
      if (rule.pattern.test(line)) {
        issues.push(
          makeIssue(
            {
              id: rule.id,
              type: "api_version_mismatch",
              severity: "warning",
              title: rule.title,
              description: rule.description,
              fix_suggestion: rule.fix_suggestion,
              fix_code: rule.fix_code,
              reference_url: rule.reference_url,
            },
            i + 1,
            line.trim()
          )
        );
      }
    }
  }
  return issues;
}

function detectSecurityIssues(code: string, lines: string[]): Issue[] {
  const issues: Issue[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const rule of SECURITY_PATTERNS) {
      if (rule.pattern.test(line)) {
        issues.push(
          makeIssue(
            {
              id: rule.id,
              type: "security",
              severity: rule.severity,
              title: rule.title,
              description: rule.description,
              fix_suggestion: rule.fix_suggestion,
            },
            i + 1,
            line.trim()
          )
        );
      }
    }
  }
  return issues;
}

function detectSemanticIssues(code: string, lines: string[]): Issue[] {
  const issues: Issue[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const rule of SEMANTIC_PATTERNS) {
      if (rule.pattern.test(line)) {
        issues.push(
          makeIssue(
            {
              id: rule.id,
              type: "semantic_error",
              severity: rule.severity,
              title: rule.title,
              description: rule.description,
              fix_suggestion: rule.fix_suggestion,
              fix_code: (rule as any).fix_code,
            },
            i + 1,
            line.trim()
          )
        );
      }
    }
  }
  return issues;
}

export function analyzeCode(code: string, language: string): { score: number; issues: Issue[]; summary: string } {
  const lines = code.split("\n");
  const allIssues: Issue[] = [];

  allIssues.push(...detectHallucinatedPackages(code, lines));
  allIssues.push(...detectHallucinatedMethods(code, lines));
  allIssues.push(...detectVersionMismatches(code, lines));
  allIssues.push(...detectSecurityIssues(code, lines));
  allIssues.push(...detectSemanticIssues(code, lines));

  // Deduplicate by (line, title)
  const seen = new Set<string>();
  const deduped = allIssues.filter((issue) => {
    const key = `${issue.line}:${issue.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by severity
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  deduped.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Score: 100 minus deductions
  let score = 100;
  for (const issue of deduped) {
    if (issue.severity === "critical") score -= 15;
    else if (issue.severity === "warning") score -= 8;
    else score -= 3;
  }
  score = Math.max(0, Math.min(100, score));

  const critical = deduped.filter((i) => i.severity === "critical").length;
  const warning = deduped.filter((i) => i.severity === "warning").length;
  const info = deduped.filter((i) => i.severity === "info").length;

  const summary = `发现 ${deduped.length} 个问题，其中 ${critical} 个 Critical，${warning} 个 Warning，${info} 个 Info`;

  return { score, issues: deduped, summary };
}
