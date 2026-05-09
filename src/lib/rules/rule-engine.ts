import { Issue } from "../review-types";

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

// ── CodeSlick P0: Cross-language method confusion (40 rules) ──
// Detects methods from one language used in another language's code.
const CROSS_LANG_METHODS: {
  wrong: string;
  correct: string;
  targetLang: string[];
  sourceLang: string;
  description: string;
}[] = [
  // Python code containing JS/Java methods (16 rules)
  { wrong: ".toUpperCase()", correct: ".upper()", targetLang: ["python"], sourceLang: "JavaScript", description: "Python strings use .upper(), not .toUpperCase() (JavaScript method)." },
  { wrong: ".toLowerCase()", correct: ".lower()", targetLang: ["python"], sourceLang: "JavaScript", description: "Python strings use .lower(), not .toLowerCase() (JavaScript method)." },
  { wrong: ".trim()", correct: ".strip()", targetLang: ["python"], sourceLang: "JavaScript", description: "Python strings use .strip(), not .trim() (JavaScript method)." },
  { wrong: ".push(", correct: ".append(...)", targetLang: ["python"], sourceLang: "JavaScript", description: "Python lists use .append(), not .push() (JavaScript method)." },
  { wrong: ".shift()", correct: "list.pop(0) or collections.deque.popleft()", targetLang: ["python"], sourceLang: "JavaScript", description: "Python lists have no .shift() — use pop(0) or deque for efficient left-pop." },
  { wrong: ".unshift(", correct: "list.insert(0, ...)", targetLang: ["python"], sourceLang: "JavaScript", description: "Python lists have no .unshift() — use list.insert(0, item)." },
  { wrong: ".splice(", correct: "del list[i:j] or list[i:j] = [...]", targetLang: ["python"], sourceLang: "JavaScript", description: "Python lists have no .splice() — use slice assignment or del." },
  { wrong: ".join(", correct: "str.join(iterable)", targetLang: ["python"], sourceLang: "JavaScript", description: "Python uses str.join(iterable), not array.join(sep)." },
  { wrong: ".includes(", correct: "... in ...", targetLang: ["python"], sourceLang: "JavaScript", description: "Python uses 'in' operator for membership, not .includes() (JavaScript)." },
  { wrong: ".startsWith(", correct: ".startswith()", targetLang: ["python"], sourceLang: "JavaScript", description: "Python strings use .startswith(), not .startsWith() (JavaScript method)." },
  { wrong: ".endsWith(", correct: ".endswith()", targetLang: ["python"], sourceLang: "JavaScript", description: "Python strings use .endswith(), not .endsWith() (JavaScript method)." },
  { wrong: ".substring(", correct: "str[start:end]", targetLang: ["python"], sourceLang: "JavaScript", description: "Python uses slice notation str[start:end], not .substring()." },
  { wrong: ".substr(", correct: "str[start:end]", targetLang: ["python"], sourceLang: "JavaScript", description: "Python uses slice notation str[start:end], not .substr()." },
  { wrong: ".charAt(", correct: "str[index]", targetLang: ["python"], sourceLang: "JavaScript", description: "Python strings support direct indexing with [], not .charAt()." },
  { wrong: ".indexOf(", correct: ".index() or .find()", targetLang: ["python"], sourceLang: "JavaScript", description: "Python strings/lists use .index() or .find(), not .indexOf()." },

  // JavaScript/TypeScript code containing Python methods (14 rules)
  { wrong: ".upper()", correct: ".toUpperCase()", targetLang: ["javascript", "typescript"], sourceLang: "Python", description: "JavaScript strings use .toUpperCase(), not .upper() (Python method)." },
  { wrong: ".lower()", correct: ".toLowerCase()", targetLang: ["javascript", "typescript"], sourceLang: "Python", description: "JavaScript strings use .toLowerCase(), not .lower() (Python method)." },
  { wrong: ".strip()", correct: ".trim()", targetLang: ["javascript", "typescript"], sourceLang: "Python", description: "JavaScript strings use .trim(), not .strip() (Python method)." },
  { wrong: ".append(", correct: ".push(...)", targetLang: ["javascript", "typescript"], sourceLang: "Python", description: "JavaScript arrays use .push(), not .append() (Python method)." },
  { wrong: ".extend(", correct: ".push(...)", targetLang: ["javascript", "typescript"], sourceLang: "Python", description: "JavaScript arrays use .push() or spread [...arr, ...items], not .extend()." },
  { wrong: ".insert(", correct: ".splice(index, 0, item)", targetLang: ["javascript", "typescript"], sourceLang: "Python", description: "JavaScript arrays use .splice(index, 0, item), not .insert()." },
  { wrong: ".remove(", correct: "arr.splice(arr.indexOf(item), 1)", targetLang: ["javascript", "typescript"], sourceLang: "Python", description: "JavaScript arrays have no .remove() — use splice or filter." },
  { wrong: ".startswith()", correct: ".startsWith()", targetLang: ["javascript", "typescript"], sourceLang: "Python", description: "JavaScript strings use .startsWith(), not .startswith() (Python method)." },
  { wrong: ".endswith()", correct: ".endsWith()", targetLang: ["javascript", "typescript"], sourceLang: "Python", description: "JavaScript strings use .endsWith(), not .endswith() (Python method)." },
  { wrong: ".find()", correct: ".indexOf() or .find()", targetLang: ["javascript", "typescript"], sourceLang: "Python", description: "JavaScript arrays use .indexOf() or .find(), strings use .indexOf()." },
  { wrong: ".splitlines()", correct: ".split('\\n')", targetLang: ["javascript", "typescript"], sourceLang: "Python", description: "JavaScript strings use .split('\\n'), not .splitlines() (Python method)." },
  { wrong: ".isdigit()", correct: "/^\\d+$/.test(str)", targetLang: ["javascript", "typescript"], sourceLang: "Python", description: "JavaScript has no .isdigit() — use regex /^\\d+$/.test(str)." },
  { wrong: ".isalpha()", correct: "/^[a-zA-Z]+$/.test(str)", targetLang: ["javascript", "typescript"], sourceLang: "Python", description: "JavaScript has no .isalpha() — use regex /^[a-zA-Z]+$/.test(str)." },
  { wrong: ".isalnum()", correct: "/^[a-zA-Z0-9]+$/.test(str)", targetLang: ["javascript", "typescript"], sourceLang: "Python", description: "JavaScript has no .isalnum() — use regex /^[a-zA-Z0-9]+$/.test(str)." },

  // Java code containing JavaScript/Python methods (6 rules)
  { wrong: ".push(", correct: ".add() or .addAll()", targetLang: ["java"], sourceLang: "JavaScript/Python", description: "Java collections use .add() or .addAll(), not .push() (JS/Python method)." },
  { wrong: ".includes(", correct: ".contains()", targetLang: ["java"], sourceLang: "JavaScript", description: "Java collections/strings use .contains(), not .includes() (JavaScript method)." },
  { wrong: ".indexOf(", correct: ".indexOf() (Java also has this)", targetLang: ["java"], sourceLang: "JavaScript", description: "Java String/List also has .indexOf() — verify semantics match." },
  { wrong: ".length()", correct: ".length (field) or .size()", targetLang: ["java"], sourceLang: "JavaScript", description: "Java arrays use .length field, collections use .size() — not .length() method." },
  { wrong: ".toUpperCase()", correct: ".toUpperCase() (Java also has this)", targetLang: ["java"], sourceLang: "JavaScript", description: "Java String has .toUpperCase() — this may be valid, verify context." },
  { wrong: ".trim()", correct: ".trim() (Java also has this)", targetLang: ["java"], sourceLang: "JavaScript", description: "Java String has .trim() since Java 11 — verify your Java version." },

  // Python code containing Java methods (4 rules)
  { wrong: ".add(", correct: ".add() (Python set also has this)", targetLang: ["python"], sourceLang: "Java", description: "Python sets use .add(), lists use .append() — verify collection type." },
  { wrong: ".contains(", correct: "... in ...", targetLang: ["python"], sourceLang: "Java", description: "Python uses 'in' operator for membership, not .contains() (Java method)." },
  { wrong: ".size()", correct: "len(...)", targetLang: ["python"], sourceLang: "Java", description: "Python uses len() for length, not .size() (Java method)." },
  { wrong: ".getClass()", correct: "type(...)", targetLang: ["python"], sourceLang: "Java", description: "Python uses type() or isinstance(), not .getClass() (Java method)." },
];

// ── CodeSlick P0: Framework deprecated APIs (15 rules) ──
const DEPRECATED_APIS: {
  pattern: RegExp;
  id: string;
  frameworks: string[];
  title: string;
  description: string;
  fix_suggestion: string;
  fix_code?: string;
  reference_url?: string;
  severity: "critical" | "warning" | "info";
}[] = [
  // React (5 rules)
  {
    pattern: /componentWillMount\s*\(/,
    id: "DEPRECATED-REACT-001",
    frameworks: ["react"],
    title: "React: componentWillMount 已移除",
    description: "componentWillMount 在 React 17+ 中已移除。请使用 componentDidMount 或在构造函数中初始化。",
    fix_suggestion: "Use componentDidMount for side effects, or initialize state in constructor/useState.",
    fix_code: "useEffect(() => { /* side effect */ }, []);",
    reference_url: "https://react.dev/reference/react/Component#componentwillmount",
    severity: "critical",
  },
  {
    pattern: /componentWillUpdate\s*\(/,
    id: "DEPRECATED-REACT-002",
    frameworks: ["react"],
    title: "React: componentWillUpdate 已移除",
    description: "componentWillUpdate 在 React 17+ 中已移除。请使用 componentDidUpdate 或 getSnapshotBeforeUpdate。",
    fix_suggestion: "Use componentDidUpdate for post-update logic, or getSnapshotBeforeUpdate for DOM reads.",
    reference_url: "https://react.dev/reference/react/Component#componentwillupdate",
    severity: "critical",
  },
  {
    pattern: /componentWillReceiveProps\s*\(/,
    id: "DEPRECATED-REACT-003",
    frameworks: ["react"],
    title: "React: componentWillReceiveProps 已移除",
    description: "componentWillReceiveProps 在 React 17+ 中已移除。请使用 getDerivedStateFromProps 或 useEffect。",
    fix_suggestion: "Use getDerivedStateFromProps (static) or useEffect with prop dependencies.",
    reference_url: "https://react.dev/reference/react/Component#componentwillreceiveprops",
    severity: "critical",
  },
  {
    pattern: /React\.createClass\s*\(/,
    id: "DEPRECATED-REACT-004",
    frameworks: ["react"],
    title: "React: createClass 已废弃",
    description: "React.createClass 在 React 16 中已移除。请使用 ES6 class 或函数组件。",
    fix_suggestion: "Convert to a function component with hooks, or an ES6 class extending React.Component.",
    fix_code: "function MyComponent() { const [state, setState] = useState(...); return ... }",
    reference_url: "https://react.dev/reference/react/Component",
    severity: "warning",
  },
  {
    pattern: /React\.PropTypes\./,
    id: "DEPRECATED-REACT-005",
    frameworks: ["react"],
    title: "React: PropTypes 已移出核心",
    description: "React.PropTypes 在 React 16 中已移除。请使用 prop-types 包。",
    fix_suggestion: "Install prop-types: npm install prop-types, then import PropTypes from 'prop-types'.",
    reference_url: "https://react.dev/reference/react/Component#static-proptypes",
    severity: "warning",
  },

  // Vue (2 rules)
  {
    pattern: /Vue\.extend\s*\(/,
    id: "DEPRECATED-VUE-001",
    frameworks: ["vue"],
    title: "Vue 2: Vue.extend 在 Vue 3 中变化",
    description: "Vue.extend 在 Vue 3 中不再推荐使用。请使用 defineComponent 或 <script setup>。",
    fix_suggestion: "In Vue 3, use defineComponent({ ... }) or <script setup> for Composition API.",
    fix_code: "import { defineComponent } from 'vue';\nexport default defineComponent({ ... })",
    reference_url: "https://vuejs.org/api/general.html#definecomponent",
    severity: "warning",
  },
  {
    pattern: /this\.\$set\s*\(/,
    id: "DEPRECATED-VUE-002",
    frameworks: ["vue"],
    title: "Vue 2: $set 在 Vue 3 中不再需要",
    description: "Vue 3 使用 Proxy 实现响应式，this.$set 不再需要。直接赋值即可。",
    fix_suggestion: "In Vue 3, simply assign: obj.key = value — reactivity is handled by Proxy.",
    reference_url: "https://vuejs.org/guide/extras/reactivity-in-depth.html",
    severity: "info",
  },

  // Django (3 rules)
  {
    pattern: /django\.conf\.urls\.url\s*\(/,
    id: "DEPRECATED-DJANGO-001",
    frameworks: ["django"],
    title: "Django: django.conf.urls.url 已废弃",
    description: "django.conf.urls.url() 在 Django 4.0 中已移除。请使用 django.urls.re_path 或 path。",
    fix_suggestion: "Use django.urls.path() or re_path() instead of url().",
    fix_code: "from django.urls import path\npath('route/', view)",
    reference_url: "https://docs.djangoproject.com/en/4.0/releases/4.0/#features-removed-in-4-0",
    severity: "critical",
  },
  {
    pattern: /from django\.conf\.urls import url/,
    id: "DEPRECATED-DJANGO-002",
    frameworks: ["django"],
    title: "Django: 导入 url() 已废弃",
    description: "from django.conf.urls import url 在 Django 4.0 中已移除。",
    fix_suggestion: "Use from django.urls import path, re_path instead.",
    reference_url: "https://docs.djangoproject.com/en/4.0/releases/4.0/",
    severity: "critical",
  },
  {
    pattern: /force_text\s*\(/,
    id: "DEPRECATED-DJANGO-003",
    frameworks: ["django"],
    title: "Django: force_text 已移除",
    description: "django.utils.encoding.force_text 在 Django 4.0 中已移除。请使用 force_str。",
    fix_suggestion: "Replace force_text() with force_str().",
    reference_url: "https://docs.djangoproject.com/en/4.0/releases/4.0/",
    severity: "warning",
  },

  // Flask (1 rule)
  {
    pattern: /flask\.ext\./,
    id: "DEPRECATED-FLASK-001",
    frameworks: ["flask"],
    title: "Flask: flask.ext 已废弃",
    description: "flask.ext 导入方式在 Flask 0.11+ 中已废弃。请直接导入扩展包。",
    fix_suggestion: "Import extensions directly: from flask_sqlalchemy import SQLAlchemy",
    reference_url: "https://flask.palletsprojects.com/en/latest/changes/#version-0-11",
    severity: "warning",
  },

  // Spring (4 rules)
  {
    pattern: /@RequestMapping\s*\(/,
    id: "DEPRECATED-SPRING-001",
    frameworks: ["spring"],
    title: "Spring: @RequestMapping 可用更具体注解替代",
    description: "@RequestMapping 仍然有效，但 Spring 推荐使用 @GetMapping/@PostMapping 等更具体的注解。",
    fix_suggestion: "Use @GetMapping, @PostMapping, @PutMapping, @DeleteMapping for clarity.",
    reference_url: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/bind/annotation/RequestMapping.html",
    severity: "info",
  },
  {
    pattern: /JdbcTemplate\.queryForObject\s*\([^)]*String\.class\s*\)/,
    id: "DEPRECATED-SPRING-002",
    frameworks: ["spring"],
    title: "Spring: JdbcTemplate.queryForObject(String.class) 已废弃",
    description: "queryForObject(sql, String.class) 在 Spring 5.3+ 中已废弃。请使用 queryForObject(sql, String.class, args...).",
    fix_suggestion: "Pass parameters explicitly: jdbc.queryForObject(sql, String.class, arg1, arg2)",
    reference_url: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/jdbc/core/JdbcTemplate.html",
    severity: "warning",
  },
  {
    pattern: /WebSecurityConfigurerAdapter/,
    id: "DEPRECATED-SPRING-003",
    frameworks: ["spring"],
    title: "Spring Security: WebSecurityConfigurerAdapter 已废弃",
    description: "WebSecurityConfigurerAdapter 在 Spring Security 5.7+ / Spring Boot 2.7+ 中已废弃。请使用 SecurityFilterChain bean。",
    fix_suggestion: "Define a SecurityFilterChain bean instead of extending WebSecurityConfigurerAdapter.",
    fix_code: "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception { ... }",
    reference_url: "https://spring.io/blog/2022/02/21/spring-security-5-7-migration-guide",
    severity: "critical",
  },
  {
    pattern: /@Autowired/,
    id: "DEPRECATED-SPRING-004",
    frameworks: ["spring"],
    title: "Spring: 字段注入 @Autowired 不推荐",
    description: "字段注入 @Autowired 在 Spring 中仍有效，但官方推荐构造函数注入。",
    fix_suggestion: "Use constructor injection: private final MyService service; public MyClass(MyService s) { this.service = s; }",
    reference_url: "https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#beans-constructor-injection",
    severity: "info",
  },
];

const VERSION_MISMATCHES = [
  {
    pattern: /openai\.ChatCompletion\.create/,
    id: "VERSION-001",
    title: "OpenAI v1.x API 迁移",
    description: "openai.ChatCompletion.create() 在 openai v1.0.0+ 中已移除。请使用新 API。",
    fix_suggestion: "Switch to the new API: client = openai.OpenAI(); client.chat.completions.create(...)",
    fix_code: "from openai import OpenAI\nclient = OpenAI()\nresponse = client.chat.completions.create(model='gpt-4')",
    reference_url: "https://github.com/openai/openai-python/discussions/742",
  },
  {
    pattern: /openai\.Completion\.create/,
    id: "VERSION-002",
    title: "OpenAI v1.x API 迁移 (Completion)",
    description: "openai.Completion.create() 在 openai v1.0.0+ 中已移除。",
    fix_suggestion: "Switch to the new API: client = openai.OpenAI(); client.completions.create(...)",
    reference_url: "https://github.com/openai/openai-python/discussions/742",
  },
  {
    pattern: /langchain\.llms\.OpenAI/,
    id: "VERSION-003",
    title: "LangChain 弃用警告",
    description: "langchain.llms.OpenAI 在较新版本中已弃用，请使用 langchain-openai。",
    fix_suggestion: "Use langchain-openai instead: from langchain_openai import OpenAI",
    reference_url: "https://python.langchain.com/docs/guides/migration/",
  },
  {
    pattern: /tensorflow\.keras\.layers/,
    id: "VERSION-004",
    title: "TensorFlow Keras 导入变更",
    description: "tensorflow.keras 在 TF 2.16+ 中推荐直接使用 keras 包。",
    fix_suggestion: "Import keras directly: import keras; from keras import layers",
    reference_url: "https://keras.io/getting_started/",
  },
  {
    pattern: /sklearn\./,
    id: "VERSION-005",
    title: "scikit-learn 包名错误",
    description: "sklearn 是导入别名，实际包名为 scikit-learn。",
    fix_suggestion: "Install scikit-learn: pip install scikit-learn, then import sklearn works",
    reference_url: "https://scikit-learn.org/stable/install.html",
  },
];

const SECURITY_PATTERNS = [
  {
    pattern: /(sk|pk)_(live|test|proj)_[A-Za-z0-9]{24,}/,
    id: "SEC-001",
    title: "Hardcoded API Key detected",
    description: "Detected a possible API key in source code. Never commit secrets to version control.",
    fix_suggestion: "Move the key to an env var: import os; api_key = os.environ.get('API_KEY')",
    severity: "critical" as const,
  },
  {
    pattern: /password\s*=\s*["'][^"']+["']/i,
    id: "SEC-002",
    title: "Hardcoded password",
    description: "Detected a hardcoded password. Use environment variables or a secrets manager.",
    fix_suggestion: "Use a secrets manager (AWS Secrets Manager, HashiCorp Vault) or at minimum an env var — never commit passwords to git",
    severity: "critical" as const,
  },
  // ── Command Injection (6 rules) ──
  {
    pattern: /os\.system\s*\(/,
    id: "SEC-CMD-001",
    title: "Command injection via os.system()",
    description: "os.system() passes user input directly to the shell. Never pass untrusted data to shell commands.",
    fix_suggestion: "Use subprocess.run() with a list of arguments and shell=False instead of os.system()",
    severity: "critical" as const,
  },
  {
    pattern: /subprocess\.run\s*\([^)]*shell\s*=\s*True/,
    id: "SEC-CMD-002",
    title: "Command injection via subprocess.run(shell=True)",
    description: "subprocess.run() with shell=True passes user input to the shell. Prefer passing arguments as a list.",
    fix_suggestion: "Pass arguments as a list with shell=False: subprocess.run(['ls', '-la'], shell=False)",
    severity: "critical" as const,
  },
  {
    pattern: /subprocess\.Popen\s*\([^)]*shell\s*=\s*True/,
    id: "SEC-CMD-003",
    title: "Command injection via subprocess.Popen(shell=True)",
    description: "subprocess.Popen() with shell=True is vulnerable to command injection.",
    fix_suggestion: "Pass arguments as a list with shell=False: subprocess.Popen(['cmd', 'arg1'], shell=False)",
    severity: "critical" as const,
  },
  {
    pattern: /eval\s*\(/,
    id: "SEC-CMD-004",
    title: "Dangerous eval() usage",
    description: "eval() executes arbitrary code. User input should never be passed to eval().",
    fix_suggestion: "Avoid eval() entirely — use ast.literal_eval() for safe Python literal parsing, or JSON.parse() for JSON",
    severity: "critical" as const,
  },
  {
    pattern: /exec\s*\(/,
    id: "SEC-CMD-005",
    title: "Dangerous exec() usage",
    description: "exec() allows arbitrary code execution. Never pass untrusted data to exec().",
    fix_suggestion: "Replace exec() with safer alternatives — if you need dynamic code, use a proper sandbox or restrict to a whitelist of allowed operations",
    severity: "critical" as const,
  },
  {
    pattern: /require\s*\(\s*["']child_process["']\s*\).*\.exec\s*\(/,
    id: "SEC-CMD-006",
    title: "Dangerous child_process.exec()",
    description: "child_process.exec() passes user input to the shell. Use execFile() or spawn() with args array instead.",
    fix_suggestion: "Use child_process.execFile() or .spawn() with a list of arguments instead of .exec()",
    severity: "critical" as const,
  },
  // ── Secret / Credential Detection (13 rules) ──
  {
    pattern: /AKIA[0-9A-Z]{16}/,
    id: "SEC-KEY-001",
    title: "Hardcoded AWS Access Key ID",
    description: "AWS Access Key ID detected in source code. Rotate immediately and move to env vars.",
    fix_suggestion: "Use AWS IAM roles or AWS Secrets Manager. Never hardcode AWS credentials.",
    severity: "critical" as const,
  },
  {
    pattern: /ghp_[A-Za-z0-9]{36}|gho_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{22,}/,
    id: "SEC-KEY-002",
    title: "Hardcoded GitHub token",
    description: "GitHub personal access token detected. Revoke and rotate immediately.",
    fix_suggestion: "Store tokens in GitHub Secrets or environment variables. Never commit them to source.",
    severity: "critical" as const,
  },
  {
    pattern: /glpat-[A-Za-z0-9\-]{20,}/,
    id: "SEC-KEY-003",
    title: "Hardcoded GitLab token",
    description: "GitLab Personal Access Token detected in source code.",
    fix_suggestion: "Use CI/CD variables or a secrets manager. Revoke the exposed token immediately.",
    severity: "critical" as const,
  },
  {
    pattern: /xox[bap]-[0-9]{10,13}-[0-9]{10,13}/,
    id: "SEC-KEY-004",
    title: "Hardcoded Slack token",
    description: "Slack bot/user token detected. Rotate the token and move to env vars.",
    fix_suggestion: "Use Slack app configuration or environment variables. Revoke the exposed token.",
    severity: "critical" as const,
  },
  {
    pattern: /sk_(live|test)_[0-9a-zA-Z]{24,}/,
    id: "SEC-KEY-005",
    title: "Hardcoded Stripe API key",
    description: "Stripe secret key detected. This is a live payment credential.",
    fix_suggestion: "Use Stripe's restricted keys and store them in a secrets manager or env vars.",
    severity: "critical" as const,
  },
  {
    pattern: /sk-proj-[A-Za-z0-9_-]{20,}/,
    id: "SEC-KEY-006",
    title: "Hardcoded OpenAI API key",
    description: "OpenAI API key detected in source code.",
    fix_suggestion: "Store in environment variables or a secrets manager. Rotate the exposed key.",
    severity: "critical" as const,
  },
  {
    pattern: /AIza[0-9A-Za-z_-]{35}/,
    id: "SEC-KEY-007",
    title: "Hardcoded Google API key",
    description: "Google API key detected. Restrict key usage in Google Cloud Console.",
    fix_suggestion: "Use Google Cloud Secret Manager or environment variables. Restrict the key's HTTP referrers.",
    severity: "critical" as const,
  },
  {
    pattern: /ya29\.[0-9A-Za-z_-]+/,
    id: "SEC-KEY-008",
    title: "Hardcoded Google OAuth token",
    description: "Google OAuth access token detected. Tokens expire but should never be hardcoded.",
    fix_suggestion: "Use OAuth 2.0 flow with refresh tokens stored securely. Never hardcode access tokens.",
    severity: "critical" as const,
  },
  {
    pattern: /-----BEGIN (RSA|DSA|EC|OPENSSH|PGP) PRIVATE KEY-----/,
    id: "SEC-KEY-009",
    title: "Hardcoded SSH/PEM private key",
    description: "Private key material detected in source code. This is a critical security exposure.",
    fix_suggestion: "Store keys in a secrets manager (AWS Secrets Manager, Vault) or mount them as files in containers.",
    severity: "critical" as const,
  },
  {
    pattern: /eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/,
    id: "SEC-KEY-010",
    title: "Hardcoded JWT token",
    description: "JWT token detected. Even if expired, the pattern reveals poor secret handling practices.",
    fix_suggestion: "Generate JWTs at runtime. Store signing keys in a secrets manager, never the tokens themselves.",
    severity: "critical" as const,
  },
  {
    pattern: /(password|passwd|secret|api_key|api_key_id|api_secret|api_token|auth_token|access_token|refresh_token|client_secret|consumer_key|consumer_secret|session_key|private_key|public_key|SECRET_KEY|SECRET|TOKEN|PASSWORD|DB_PASSWORD|DB_URL|DATABASE_URL|CONNECTION_STRING|MONGO_URI|REDIS_URL|CLOUDINARY_URL|HEROKU_API_KEY|HEROKU_API_TOKEN|TWILIO_ACCOUNT_SID|TWILIO_AUTH_TOKEN|SENDGRID_API_KEY|MAILGUN_API_KEY|MAILCHIMP_API_KEY|DOCKER_PASSWORD|DOCKER_TOKEN|NPM_TOKEN|NPM_AUTH_TOKEN|PYPI_TOKEN|RUBYGEMS_API_KEY|DEEPSEEK_API_KEY|ANTHROPIC_API_KEY|CLAUDE_API_KEY|OPENAI_API_KEY|AZURE_OPENAI_KEY|HUGGINGFACE_TOKEN|REPLICATE_API_TOKEN|COHERE_API_KEY|ELEVENLABS_API_KEY|MAPBOX_API_TOKEN|MAPBOX_ACCESS_TOKEN|GOOGLE_MAPS_API_KEY|FIREBASE_API_KEY|FIREBASE_AUTH_DOMAIN|FIREBASE_DATABASE_URL|FIREBASE_STORAGE_BUCKET|AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|AWS_SESSION_TOKEN|GCP_PROJECT_ID|GCP_PRIVATE_KEY|AZURE_CLIENT_ID|AZURE_CLIENT_SECRET|AZURE_TENANT_ID|AZURE_SUBSCRIPTION_ID|ALGOLIA_APP_ID|ALGOLIA_API_KEY|NEW_RELIC_LICENSE_KEY|DATADOG_API_KEY|DATADOG_APP_KEY|SENTRY_DSN|SENTRY_AUTH_TOKEN|JENKINS_API_TOKEN|JIRA_API_TOKEN|CONFLUENCE_API_TOKEN|LINEAR_API_KEY|NOTION_API_KEY|NOTION_TOKEN|SLACK_BOT_TOKEN|SLACK_WEBHOOK_URL|DISCORD_BOT_TOKEN|DISCORD_WEBHOOK_URL|TELEGRAM_BOT_TOKEN|TWITTER_API_KEY|TWITTER_API_SECRET|TWITTER_BEARER_TOKEN|REDDIT_CLIENT_ID|REDDIT_CLIENT_SECRET|GITHUB_TOKEN|GITLAB_TOKEN|BITBUCKET_OAUTH_KEY|BITBUCKET_OAUTH_SECRET|VERCEL_TOKEN|NETLIFY_TOKEN|CLOUDFLARE_API_TOKEN|CLOUDFLARE_API_KEY|DIGITALOCEAN_TOKEN|LINODE_TOKEN|VULTR_API_KEY|DO_SPACES_KEY|DO_SPACES_SECRET|S3_ACCESS_KEY|S3_SECRET_KEY|MINIO_ACCESS_KEY|MINIO_SECRET_KEY|KUBERNETES_SERVICE_ACCOUNT_TOKEN|K8S_TOKEN|ELASTICSEARCH_PASSWORD|ELASTICSEARCH_API_KEY)\s*=\s*["'][^"']{4,}["']/i,
    id: "SEC-KEY-011",
    title: "Hardcoded credential detected",
    description: "A credential or secret appears to be hardcoded. Use environment variables or a secrets manager.",
    fix_suggestion: "Move all secrets to environment variables or a dedicated secrets manager (AWS Secrets Manager, HashiCorp Vault, Doppler).",
    severity: "warning" as const,
  },
  {
    pattern: /-----BEGIN [A-Z ]+ PRIVATE KEY-----/,
    id: "SEC-KEY-012",
    title: "Hardcoded PEM private key",
    description: "PEM-encoded private key detected. Private keys must never be committed to source control.",
    fix_suggestion: "Mount keys as files or load from a secrets manager. Never commit PEM files to git.",
    severity: "critical" as const,
  },
  // ── Insecure Hash / Crypto (3 rules) ──
  {
    pattern: /hashlib\.md5\s*\(/,
    id: "SEC-CRYPTO-001",
    title: "Insecure hash: MD5",
    description: "MD5 is not collision-resistant. Use SHA-256 or higher for any security-sensitive operation.",
    fix_suggestion: "Replace hashlib.md5() with hashlib.sha256() or hashlib.sha3_256()",
    severity: "warning" as const,
  },
  {
    pattern: /hashlib\.sha1\s*\(/,
    id: "SEC-CRYPTO-002",
    title: "Insecure hash: SHA-1",
    description: "SHA-1 is deprecated and considered broken. Use SHA-256 or higher.",
    fix_suggestion: "Replace hashlib.sha1() with hashlib.sha256() or hashlib.sha3_256()",
    severity: "warning" as const,
  },
  {
    pattern: /Crypto\.Cipher\.DES\.new\s*\(/,
    id: "SEC-CRYPTO-003",
    title: "Weak cipher: DES",
    description: "DES is insecure due to its small key size. Use AES instead.",
    fix_suggestion: "Use AES from cryptography.fernet or PyCryptodome's AES module.",
    severity: "warning" as const,
  },
  // ── Path Traversal / File Ops (2 rules) ──
  {
    pattern: /os\.path\.join\s*\(/,
    id: "SEC-PATH-001",
    title: "Potential path traversal risk",
    description: "os.path.join() with unsanitized user input can lead to path traversal. Validate all path components.",
    fix_suggestion: "Sanitize paths with os.path.normpath() and verify the resolved path is within an allowed directory.",
    severity: "warning" as const,
  },
  {
    pattern: /tempfile\.mktemp\s*\(/,
    id: "SEC-PATH-002",
    title: "Unsafe temporary file creation",
    description: "tempfile.mktemp() is race-condition prone. Use tempfile.mkstemp() or TemporaryFile() instead.",
    fix_suggestion: "Replace tempfile.mktemp() with tempfile.mkstemp() or tempfile.NamedTemporaryFile()",
    severity: "warning" as const,
  },
  // ── Deserialization (3 rules) ──
  {
    pattern: /pickle\.load\s*\(/,
    id: "SEC-DSER-001",
    title: "Unsafe deserialization: pickle.load()",
    description: "pickle.load() can execute arbitrary code during deserialization. Never unpickle untrusted data.",
    fix_suggestion: "Use JSON for data interchange. If you must serialize objects, use a restricted format and validate schemas.",
    severity: "critical" as const,
  },
  {
    pattern: /yaml\.load\s*\(/,
    id: "SEC-DSER-002",
    title: "Unsafe YAML deserialization",
    description: "yaml.load() without Loader is unsafe and can execute arbitrary code. Use yaml.safe_load() instead.",
    fix_suggestion: "Replace yaml.load() with yaml.safe_load() — it restricts the loader to safe constructors only.",
    severity: "critical" as const,
  },
  {
    pattern: /jsonpickle\.decode\s*\(/,
    id: "SEC-DSER-003",
    title: "Unsafe deserialization: jsonpickle.decode()",
    description: "jsonpickle.decode() can reconstruct arbitrary Python objects, leading to RCE.",
    fix_suggestion: "Use standard json.loads() with a restricted object_hook if you need custom deserialization.",
    severity: "warning" as const,
  },
  // ── Debug / Config Leaks (4 rules) ──
  {
    pattern: /app\.run\s*\([^)]*debug\s*=\s*True/,
    id: "SEC-DEBUG-001",
    title: "Flask debug mode enabled",
    description: "Flask debug mode exposes the Werkzeug debugger and allows remote code execution. Never use in production.",
    fix_suggestion: "Set debug=False in production, or better, use an environment variable: app.run(debug=os.environ.get('DEBUG') == 'true')",
    severity: "critical" as const,
  },
  {
    pattern: /DEBUG\s*=\s*True/,
    id: "SEC-DEBUG-002",
    title: "Django debug mode enabled",
    description: "Django DEBUG=True exposes stack traces and sensitive settings. Never deploy with DEBUG=True.",
    fix_suggestion: "Set DEBUG = os.environ.get('DJANGO_DEBUG', 'false').lower() == 'true' and ensure it's false in production.",
    severity: "critical" as const,
  },
  {
    pattern: /NODE_ENV\s*=\s*["']development["']/,
    id: "SEC-DEBUG-003",
    title: "Node.js development environment",
    description: "NODE_ENV=development disables security optimizations and exposes verbose error messages.",
    fix_suggestion: "Set NODE_ENV=production in production environments. Use dotenv or container orchestration to manage env vars.",
    severity: "warning" as const,
  },
  {
    pattern: /Access-Control-Allow-Origin\s*:\s*\*|res\.setHeader\s*\(\s*["']Access-Control-Allow-Origin["']\s*,\s*["']\*["']/,
    id: "SEC-DEBUG-004",
    title: "CORS wildcard allows any origin",
    description: "CORS wildcard '*' allows any domain to make requests to your API. Restrict to specific origins.",
    fix_suggestion: "Whitelist specific origins instead of '*': res.setHeader('Access-Control-Allow-Origin', 'https://yourdomain.com')",
    severity: "warning" as const,
  },
  // ── SQL Injection (2 rules) ──
  {
    pattern: /\.execute\s*\(\s*["'][^"']*["']\s*\+\s*/,
    id: "SEC-SQL-001",
    title: "SQL injection via string concatenation",
    description: "String concatenation in SQL queries allows attackers to inject malicious SQL. Use parameterized queries.",
    fix_suggestion: "Use parameterized queries: cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))",
    severity: "critical" as const,
  },
  {
    pattern: /\.execute\s*\(\s*f["'][^"']*\{[^}]+\}[^"']*["']/,
    id: "SEC-SQL-002",
    title: "SQL injection via f-string",
    description: "f-strings in SQL queries allow variable interpolation, which is vulnerable to SQL injection.",
    fix_suggestion: "Use parameterized queries instead of f-strings: cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))",
    severity: "critical" as const,
  },
  // ── JS/TS Frontend Security (3 rules) ──
  {
    pattern: /\.innerHTML\s*=\s*[^;]+/,
    id: "SEC-XSS-001",
    title: "XSS risk: innerHTML assignment",
    description: "Setting innerHTML with user-controlled data can lead to XSS. Use textContent or sanitize with DOMPurify.",
    fix_suggestion: "Use textContent for plain text, or sanitize HTML with DOMPurify before assigning to innerHTML.",
    severity: "critical" as const,
  },
  {
    pattern: /document\.write\s*\(/,
    id: "SEC-XSS-002",
    title: "Dangerous document.write()",
    description: "document.write() is dangerous in async contexts and can lead to XSS. Use DOM manipulation methods instead.",
    fix_suggestion: "Build DOM nodes instead: document.createElement() + appendChild() — safer and more predictable",
    severity: "critical" as const,
  },
  {
    pattern: /location\.href\s*=\s*[^;]+/,
    id: "SEC-REDIR-001",
    title: "Open redirect via location.href",
    description: "Setting location.href with user-controlled data can lead to open redirect vulnerabilities.",
    fix_suggestion: "Validate URLs against an allowlist before assignment, or use a routing library with built-in validation.",
    severity: "warning" as const,
  },
];

const SEMANTIC_PATTERNS = [
  {
    pattern: /while\s+True\s*:/,
    id: "SEM-001",
    title: "无限循环风险 (while True)",
    description: "while True 循环缺少显式退出条件，可能导致程序挂起。",
    fix_suggestion: "Add a break condition inside the loop, or switch to a for loop with a clear termination condition",
    severity: "warning" as const,
  },
  {
    pattern: /while\s+1\s*:/,
    id: "SEM-002",
    title: "无限循环风险 (while 1)",
    description: "while 1 等同于 while True，缺少显式退出条件。",
    fix_suggestion: "Add a break condition inside the loop, or switch to a for loop with a clear termination condition",
    severity: "warning" as const,
  },
  {
    pattern: /open\s*\([^)]+\)(?!.*close)/,
    id: "SEM-003",
    title: "文件句柄未关闭",
    description: "文件打开后未在同级作用域内关闭，可能导致资源泄漏。",
    fix_suggestion: "Use a with statement to auto-close the file: with open(...) as f: data = f.read()",
    fix_code: "with open('file.txt', 'r') as f:\n    data = f.read()",
    severity: "warning" as const,
  },
  {
    pattern: /\.get\([^)]+\)(?!\s*\|\|)/,
    id: "SEM-004",
    title: "字典 get() 返回值未处理",
    description: "dict.get() 可能返回 None，后续操作可能引发 AttributeError。",
    fix_suggestion: "Always handle the None case: value = d.get('key'); if value is not None: ... or use d.get('key', default)",
    severity: "info" as const,
  },
  {
    pattern: /try\s*:\s*[^}]*}\s*catch\s*\(/,
    id: "SEM-005",
    title: "空的异常处理",
    description: "try-catch 块中 catch 为空，可能静默吞掉重要错误。",
    fix_suggestion: "Don't swallow errors silently — at minimum log them: catch (e) { console.error(e); }",
    severity: "warning" as const,
  },
  {
    pattern: /JSON\.parse\s*\(/,
    id: "SEM-006",
    title: "JSON.parse 未处理异常",
    description: "JSON.parse 在输入非法时会抛出异常，应使用 try-catch 包裹。",
    fix_suggestion: "Wrap JSON.parse in try-catch: try { JSON.parse(str) } catch (e) { /* handle invalid JSON */ }",
    severity: "warning" as const,
  },
  {
    pattern: /\.split\(\s*\)/,
    id: "SEM-007",
    title: "split() 空参数歧义",
    description: "Python: split() 按空白分割; JS: split() 返回 ['']。行为不一致。",
    fix_suggestion: "Be explicit about the separator: .split(' ') for single space, or .split(/\\s+/) for any whitespace",
    severity: "info" as const,
  },
  {
    pattern: /==\s*(null|undefined)/,
    id: "SEM-008",
    title: "宽松相等检查",
    description: "== null 同时匹配 null 和 undefined，可能引入隐式类型转换 bug。",
    fix_suggestion: "Use strict equality: === null or === undefined to avoid implicit coercion surprises",
    severity: "info" as const,
  },
  {
    pattern: /typeof\s+\w+\s*===?\s*["']undefined["']/,
    id: "SEM-009",
    title: "typeof 检查变量未声明",
    description: "typeof 用于检查未声明变量是有效的，但检查已声明变量应直接用 === undefined。",
    fix_suggestion: "For declared variables, just use: if (x === undefined) — typeof is only needed for potentially undeclared vars",
    severity: "info" as const,
  },
  {
    pattern: /async\s+function\s+\w+\s*\([^)]*\)\s*\{[^}]*\}(?!\s*\w+\s*\()/,
    id: "SEM-010",
    title: "async 函数缺少 await",
    description: "函数声明为 async 但内部没有 await，async 是冗余的。",
    fix_suggestion: "Either add an await call inside, or drop the async keyword if you don't need it",
    severity: "info" as const,
  },
  {
    pattern: /new\s+Promise\s*\(\s*\(/,
    id: "SEM-011",
    title: "Promise 构造函数误用",
    description: "new Promise((resolve, reject) => ...) 是正确形式，检查是否遗漏参数。",
    fix_suggestion: "Make sure you pass the (resolve, reject) callback to the Promise constructor",
    severity: "warning" as const,
  },
  {
    pattern: /\.then\s*\([^)]*\)\s*\.then\s*\([^)]*\)\s*\.then\s*\(/,
    id: "SEM-012",
    title: "Promise 链过长",
    description: "过长的 .then() 链可读性差，建议使用 async/await 重构。",
    fix_suggestion: "Refactor to async/await — it flattens the code and makes error handling cleaner",
    severity: "info" as const,
  },
  {
    pattern: /for\s*\(\s*var\s+/,
    id: "SEM-013",
    title: "var 循环变量作用域泄漏",
    description: "for 循环中使用 var 会导致变量提升到函数作用域，产生闭包陷阱。",
    fix_suggestion: "Switch to let: for (let i = 0; ...) — it keeps i scoped to the loop block",
    severity: "warning" as const,
  },
  {
    pattern: /\.map\s*\([^)]*\)\s*\.forEach\s*\(/,
    id: "SEM-014",
    title: "map + forEach 冗余",
    description: "先 map 再 forEach 是冗余的，直接用 forEach 或 for...of。",
    fix_suggestion: "Skip the map — use forEach or for...of directly if you don't need a new array",
    severity: "info" as const,
  },
  {
    pattern: /fetch\s*\([^)]+\)(?!\s*\.then)/,
    id: "SEM-015",
    title: "fetch 未处理响应",
    description: "fetch 返回 Promise，必须处理响应或错误，否则请求结果丢失。",
    fix_suggestion: "Always await or chain .then() on fetch — otherwise the request fires and the result is lost",
    severity: "warning" as const,
  },
  {
    pattern: /\.innerHTML\s*=\s*[^;]+/,
    id: "SEM-016",
    title: "innerHTML XSS 风险",
    description: "直接设置 innerHTML 可能引入 XSS，如果内容包含用户输入。",
    fix_suggestion: "Use textContent for plain text, or sanitize with DOMPurify if you need HTML",
    severity: "warning" as const,
  },
  {
    pattern: /document\.write\s*\(/,
    id: "SEM-017",
    title: "document.write 已弃用",
    description: "document.write 在异步加载脚本时可能清空页面，且存在 XSS 风险。",
    fix_suggestion: "Build DOM nodes instead: document.createElement() + appendChild() — safer and more predictable",
    severity: "warning" as const,
  },
  {
    pattern: /\.querySelector\s*\([^)]+\)\s*\.(value|innerText|textContent)/,
    id: "SEM-018",
    title: "querySelector 结果未检查",
    description: "querySelector 可能返回 null，直接访问属性会抛出 TypeError。",
    fix_suggestion: "Guard against null: const el = document.querySelector(...); if (el) { ... }",
    severity: "warning" as const,
  },
  {
    pattern: /setTimeout\s*\(\s*["'][^"']+["']/,
    id: "SEM-019",
    title: "setTimeout 字符串参数",
    description: "setTimeout('code', delay) 使用字符串会被 eval，存在注入风险。",
    fix_suggestion: "Pass a function, not a string: setTimeout(() => { ... }, delay) — strings get eval'd",
    severity: "critical" as const,
  },
  {
    pattern: /setInterval\s*\(\s*["'][^"']+["']/,
    id: "SEM-020",
    title: "setInterval 字符串参数",
    description: "setInterval('code', delay) 使用字符串会被 eval，存在注入风险。",
    fix_suggestion: "Pass a function, not a string: setInterval(() => { ... }, delay) — strings get eval'd",
    severity: "critical" as const,
  },
  {
    pattern: /\.catch\s*\(\s*\)\s*\{/,
    id: "SEM-021",
    title: "空的 catch 块",
    description: "catch 块为空，静默吞掉错误，调试困难。",
    fix_suggestion: "Don't swallow errors silently — at minimum log them: .catch(err => console.error(err))",
    severity: "warning" as const,
  },
  {
    pattern: /Object\.prototype\.\w+\s*=/,
    id: "SEM-022",
    title: "修改原型链",
    description: "修改 Object.prototype 会影响所有对象，极不推荐。",
    fix_suggestion: "Use Symbol or WeakMap instead — extending Object.prototype breaks libraries and future-proofing",
    severity: "warning" as const,
  },
  {
    pattern: /delete\s+\w+\[\s*["'][^"']+["']\s*\]/,
    id: "SEM-023",
    title: "delete 操作符性能问题",
    description: "delete 对象属性会导致 V8 隐藏类退化，性能下降。",
    fix_suggestion: "Set to undefined instead: obj.key = undefined — delete deoptimizes the object in V8",
    severity: "info" as const,
  },
  {
    pattern: /new\s+Array\s*\(\s*\d+\s*\)/,
    id: "SEM-024",
    title: "Array 构造函数歧义",
    description: "new Array(3) 创建 [empty × 3]，而非 [3]。极易出错。",
    fix_suggestion: "Use a literal: [1, 2, 3] or Array.from({length: 3}, (_, i) => i) — new Array(n) creates empty slots",
    severity: "warning" as const,
  },
  {
    pattern: /\.sort\s*\(\s*\)/,
    id: "SEM-025",
    title: "sort() 默认按字符串排序",
    description: "[10, 2].sort() 返回 [10, 2] 而非 [2, 10]，因为默认按字符串比较。",
    fix_suggestion: "Pass a comparator: .sort((a, b) => a - b) for numbers — default sort is alphabetical",
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
              fix_suggestion: `You probably meant ${good} — double-check the package name on PyPI/npm.`,
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
              fix_suggestion: `That method doesn't exist — use ${info.correct} instead`,
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

// ── CodeSlick P0: Cross-language method confusion detector ──
function detectCrossLangMethods(code: string, lines: string[], language: string): Issue[] {
  const issues: Issue[] = [];
  const normalizedLang = language.toLowerCase();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const rule of CROSS_LANG_METHODS) {
      if (!rule.targetLang.includes(normalizedLang)) continue;
      if (line.includes(rule.wrong)) {
        issues.push(
          makeIssue(
            {
              id: `CROSSLANG-${rule.wrong.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}`,
              type: "hallucinated_api",
              severity: "critical",
              title: `${rule.sourceLang} method '${rule.wrong}' in ${normalizedLang} code`,
              description: rule.description,
              fix_suggestion: `Use ${rule.correct} instead of ${rule.wrong}`,
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

// ── CodeSlick P0: Framework deprecated API detector ──
function detectDeprecatedApis(code: string, lines: string[], language: string): Issue[] {
  const issues: Issue[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const rule of DEPRECATED_APIS) {
      if (rule.pattern.test(line)) {
        issues.push(
          makeIssue(
            {
              id: rule.id,
              type: "api_version_mismatch",
              severity: rule.severity,
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

export function analyzeCode(code: string, language: string): { score: number; issues: Issue[]; summary: string } {
  const lines = code.split("\n");
  const allIssues: Issue[] = [];

  allIssues.push(...detectHallucinatedPackages(code, lines));
  allIssues.push(...detectHallucinatedMethods(code, lines));
  allIssues.push(...detectVersionMismatches(code, lines));
  allIssues.push(...detectSecurityIssues(code, lines));
  allIssues.push(...detectSemanticIssues(code, lines));
  allIssues.push(...detectCrossLangMethods(code, lines, language));
  allIssues.push(...detectDeprecatedApis(code, lines, language));

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
