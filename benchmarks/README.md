# Rule Benchmark

This benchmark is a small, repeatable guardrail for Check AI Code detection quality.

Run it with:

```bash
npm run benchmark:rules
```

The benchmark checks the local rule engine against known bug/security samples in
`benchmarks/known-bugs.json`. Each sample declares rules that must be present and,
for selected negative cases, rules that must be absent.

Current baseline:

- 32 samples
- 32/32 passing after `112980b` and `2422bed`
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

Before broad public promotion, extend this set toward 50+ samples and compare:

- Check AI Code full `/api/analyze` result
- Semgrep public rulesets
- CodeQL where local setup is available
- Sonar/Snyk only where account and CLI access are available

Do not weaken existing expected-hit checks unless a sample is genuinely invalid.
