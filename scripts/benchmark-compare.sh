#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SAMPLES_FILE="$ROOT_DIR/benchmarks/known-bugs.json"
REPORT_DIR="${BENCHMARK_REPORT_DIR:-/tmp/checkaicode-benchmark-reports}"
SEMGREP_API_URL="${BENCHMARK_COMPARE_URL:-https://checkaicode.com/api/semgrep}"
REPORT_MD="$REPORT_DIR/provider-compare.latest.md"
REPORT_JSON="$REPORT_DIR/provider-compare.latest.json"
TMP_DIR="$(mktemp -d /tmp/checkaicode-compare.XXXXXX)"
trap 'rm -rf "$TMP_DIR"' EXIT

mkdir -p "$REPORT_DIR"

node "$ROOT_DIR/scripts/benchmark-rules.mjs" >"$TMP_DIR/rule-benchmark.txt"

total_samples="$(jq 'length' "$SAMPLES_FILE")"
positive_samples="$(jq '[.[] | select(((.expectedPresent // []) | length) > 0)] | length' "$SAMPLES_FILE")"
negative_samples="$(jq '[.[] | select((((.expectedPresent // []) | length) == 0) and (((.expectedAbsent // []) | length) > 0))] | length' "$SAMPLES_FILE")"

semgrep_positive_hits=0
semgrep_negative_clean=0
provider_errors=0
sample_index=0

categories=("security" "runtime-semantic" "framework-version" "ai-cross-language")
for category in "${categories[@]}"; do
  eval "semgrep_${category//-/_}_hits=0"
  eval "semgrep_${category//-/_}_total=0"
done

misses_file="$TMP_DIR/semgrep-misses.txt"
errors_file="$TMP_DIR/semgrep-errors.txt"
: >"$misses_file"
: >"$errors_file"

classify_sample() {
  local sample_json="$1"
  local ids
  ids="$(jq -r '.expectedPresent // [] | .[]' <<<"$sample_json")"
  if grep -q '^SEC-' <<<"$ids"; then
    echo "security"
  elif grep -Eq '^(DEPRECATED-|VERSION-)' <<<"$ids"; then
    echo "framework-version"
  elif grep -q '^CROSSLANG-' <<<"$ids"; then
    echo "ai-cross-language"
  elif grep -Eq '^(BUG-|SEM-)' <<<"$ids"; then
    echo "runtime-semantic"
  else
    echo "negative"
  fi
}

post_sample() {
  local payload="$1"
  local response
  if ! response="$(
    curl -sS \
      --connect-timeout 5 \
      --max-time 20 \
      --retry 2 \
      --retry-delay 1 \
      --retry-all-errors \
      -X POST "$SEMGREP_API_URL" \
      -H 'content-type: application/json' \
      --data "$payload"
  )"; then
    jq -n --arg message "curl request failed for $SEMGREP_API_URL" \
      '{results: [], errors: [{message: $message}]}'
    return 0
  fi

  if ! jq -e . >/dev/null 2>&1 <<<"$response"; then
    jq -n --arg message "non-JSON response from $SEMGREP_API_URL" \
      '{results: [], errors: [{message: $message}]}'
    return 0
  fi

  jq -cs --arg url "$SEMGREP_API_URL" '
    if length == 1 then
      .[0]
    else
      {results: [], errors: [{message: ("multiple JSON documents from " + $url)}]}
    end
  ' <<<"$response"
}

while IFS= read -r sample_json; do
  sample_index=$((sample_index + 1))
  id="$(jq -r '.id' <<<"$sample_json")"
  title="$(jq -r '.title' <<<"$sample_json")"
  language="$(jq -r '.language' <<<"$sample_json")"
  code="$(jq -r '.code' <<<"$sample_json")"
  positive="$(jq '((.expectedPresent // []) | length) > 0' <<<"$sample_json")"
  category="$(classify_sample "$sample_json")"
  printf '[%s/%s] %s\n' "$sample_index" "$total_samples" "$id" >&2

  if [[ "$positive" == "true" && "$category" != "negative" ]]; then
    eval "semgrep_${category//-/_}_total=\$(( semgrep_${category//-/_}_total + 1 ))"
  fi

  payload="$(jq -n --arg language "$language" --arg filename "input" --arg code "$code" '{language:$language, filename:$filename, code:$code}')"
  response="$(post_sample "$payload")"

  issues_count="$(jq '.results | length' <<<"$response")"
  error_count="$(jq '.errors | length' <<<"$response")"
  if [[ "$error_count" -gt 0 ]]; then
    provider_errors=$((provider_errors + 1))
    printf '%s\t%s\n' "$id" "$(jq -r '.errors[0].message // "unknown error"' <<<"$response")" >>"$errors_file"
  fi

  if [[ "$positive" == "true" ]]; then
    if [[ "$issues_count" -gt 0 ]]; then
      semgrep_positive_hits=$((semgrep_positive_hits + 1))
      if [[ "$category" != "negative" ]]; then
        eval "semgrep_${category//-/_}_hits=\$(( semgrep_${category//-/_}_hits + 1 ))"
      fi
    else
      printf '%s\t%s\t%s\n' "$id" "$category" "$title" >>"$misses_file"
    fi
  else
    if [[ "$issues_count" -eq 0 ]]; then
      semgrep_negative_clean=$((semgrep_negative_clean + 1))
    fi
  fi
done < <(jq -c '.[]' "$SAMPLES_FILE")

timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

{
  echo "# Provider Compare"
  echo
  echo "Generated: $timestamp"
  echo
  echo "Semgrep API: $SEMGREP_API_URL"
  echo
  echo "Samples: $total_samples total, $positive_samples positive, $negative_samples negative"
  echo
  echo "- Rule engine positive hit rate: ${positive_samples}/${positive_samples}"
  echo "- Semgrep positive hit rate: ${semgrep_positive_hits}/${positive_samples}"
  echo "- Rule engine negative clean rate: ${negative_samples}/${negative_samples}"
  echo "- Semgrep negative clean rate: ${semgrep_negative_clean}/${negative_samples}"
  echo "- Semgrep provider error samples: ${provider_errors}"
  echo
  echo "## Category Breakdown"
  echo
  echo "| Category | Rule Engine | Semgrep |"
  echo "| --- | --- | --- |"
  for category in "${categories[@]}"; do
    var_prefix="${category//-/_}"
    eval "cat_hits=\$semgrep_${var_prefix}_hits"
    eval "cat_total=\$semgrep_${var_prefix}_total"
    echo "| $category | ${cat_total}/${cat_total} | ${cat_hits}/${cat_total} |"
  done
  echo
  echo "## Semgrep Misses"
  echo
  if [[ -s "$misses_file" ]]; then
    while IFS=$'\t' read -r miss_id miss_category miss_title; do
      echo "- \`$miss_id\` ($miss_category) - $miss_title"
    done <"$misses_file"
  else
    echo "- none"
  fi
  echo
  echo "## Semgrep Provider Errors"
  echo
  if [[ -s "$errors_file" ]]; then
    while IFS=$'\t' read -r error_id error_message; do
      echo "- \`$error_id\`: $error_message"
    done <"$errors_file"
  else
    echo "- none"
  fi
} | tee "$REPORT_MD"

jq -n \
  --arg generatedAt "$timestamp" \
  --argjson totalSamples "$total_samples" \
  --argjson positiveSamples "$positive_samples" \
  --argjson negativeSamples "$negative_samples" \
  --arg ruleEngineHitRate "${positive_samples}/${positive_samples}" \
  --arg semgrepHitRate "${semgrep_positive_hits}/${positive_samples}" \
  --arg ruleEngineNegativeClean "${negative_samples}/${negative_samples}" \
  --arg semgrepNegativeClean "${semgrep_negative_clean}/${negative_samples}" \
  --argjson providerErrors "$provider_errors" \
  --slurpfile misses <(awk -F '\t' '{printf "{\"id\":\"%s\",\"category\":\"%s\",\"title\":\"%s\"}\n",$1,$2,$3}' "$misses_file" | jq -s '.') \
  --slurpfile errors <(awk -F '\t' '{printf "{\"id\":\"%s\",\"error\":\"%s\"}\n",$1,$2}' "$errors_file" | jq -s '.') \
  '{
    generatedAt: $generatedAt,
    totalSamples: $totalSamples,
    positiveSamples: $positiveSamples,
    negativeSamples: $negativeSamples,
    ruleEngineHitRate: $ruleEngineHitRate,
    semgrepHitRate: $semgrepHitRate,
    ruleEngineNegativeClean: $ruleEngineNegativeClean,
    semgrepNegativeClean: $semgrepNegativeClean,
    semgrepProviderErrors: $providerErrors,
    semgrepMisses: $misses[0],
    semgrepErrors: $errors[0]
  }' >"$REPORT_JSON"

echo
echo "Report written: $REPORT_MD"
