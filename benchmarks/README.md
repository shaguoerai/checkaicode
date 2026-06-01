# Rule Benchmark

This benchmark is a small, repeatable guardrail for Check AI Code detection quality.

Run it with:

```bash
npm run benchmark:rules
```

To compare the local rule-engine baseline against the live Semgrep-backed provider
used by the site, run:

```bash
npm run benchmark:compare
```

The compare script writes its latest report to:

```bash
/tmp/checkaicode-benchmark-reports/provider-compare.latest.md
```

You can override the API endpoint with `BENCHMARK_COMPARE_URL` if production routing
changes or you want to point at another environment.

To benchmark the static analysis pipeline that mirrors the user-visible `/api/analyze`
static phase, run:

```bash
npm run benchmark:pipeline
```

This combines the local rule engine with the live Semgrep provider, without using
the production `/api/analyze` endpoint. That avoids consuming anonymous review quota
while still measuring the merged static output users see before optional Pro LLM
enhancement.

The latest static pipeline report is written to:

```bash
/tmp/checkaicode-benchmark-reports/static-pipeline.latest.md
```

The benchmark checks the local rule engine against known bug/security samples in
`benchmarks/known-bugs.json`. Each sample declares rules that must be present and,
for selected negative cases, rules that must be absent.

Current baseline:

- 52 samples
- 52/52 passing after `112980b`, `2422bed`, and follow-up rule/fixture expansion
- Coverage focus:
  - JavaScript/TypeScript async misuse
  - React effect misuse
  - Python runtime footguns
  - command injection and unsafe deserialization
  - secrets and hardcoded credentials
  - deprecated framework/API usage
  - AI-generated code mistakes such as hallucinated APIs and cross-language methods

This is not a claim that Check AI Code is stronger than Semgrep, CodeQL, SonarQube,
or Snyk Code. It is a product-quality baseline for the custom rules that make the
site useful for AI-generated code review.

Current provider compare snapshot against `https://checkaicode.com/api/semgrep`:

- 52 samples total
- Rule engine: `49/49` positive hits, `3/3` negative-clean
- Live Semgrep provider: `11/49` positive hits, `3/3` negative-clean
- Static pipeline: `49/49` positive hits, `3/3` negative-clean
- Biggest observed gap: runtime-semantic, framework-version, and AI cross-language
  samples are mostly custom-value checks that Semgrep's current hosted rulesets do
  not catch in this endpoint

Before broad public promotion, extend this set toward 50+ samples and compare:

- Check AI Code static pipeline result
- Check AI Code full `/api/analyze` result for a small quota-safe smoke subset
- Live `POST /api/semgrep` provider result
- CodeQL where local setup is available
- Sonar/Snyk only where account and CLI access are available

Do not weaken existing expected-hit checks unless a sample is genuinely invalid.
