# Check AI Code 产品能力提升计划

## Phase A: 代码改动（build通过即可）

### A1. 多文件扫描支持
- review/page.tsx: 支持多文件拖拽/上传（多个文件标签页）
- api/analyze/route.ts: 支持 files[] 数组扫描，合并结果
- analyzer.ts: 保持单文件分析，循环调用

### A2. 结果分类筛选
- review/page.tsx: 增加 severity 过滤器（All/Critical/Warning/Info）
- 增加 type 过滤器（Security/Quality/Version/Hallucination）
- 增加语言过滤器

### A3. 问题行代码高亮
- review/page.tsx: 在结果面板中显示问题所在代码片段
- 高亮问题行（红色/黄色/蓝色背景）
- 显示修复建议（fix_suggestion）

### A4. 扫描结果导出
- review/page.tsx: 增加 Copy JSON / Copy Markdown / Download 按钮

## Phase B: 文案打磨（不改代码逻辑）

### B1. 首页 Hero 文案升级
- 更有冲击力的标题和副标题
- 增加社交证明（GitHub stars mockup、用户数）
- 增加实时扫描演示动画

### B2. Review 页文案
- 扫描结果更人性化描述
- 修复建议更具体

### B3. Pricing 页文案
- 价值导向描述
- 增加对比暗示

## 执行顺序
1. A1 + A2 + A3 并行（都是 review/page.tsx 改动，串行）
2. A4
3. B1 + B2 + B3
4. 最终 build
