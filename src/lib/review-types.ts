export interface Issue {
  id: string;
  type: "hallucinated_api" | "api_version_mismatch" | "semantic_error" | "security" | "best_practice";
  severity: "critical" | "warning" | "info";
  line: number;
  code_snippet: string;
  title: string;
  description: string;
  fix_suggestion: string;
  fix_code?: string;
  reference_url?: string;
}

export interface ReviewResult {
  score: number;
  summary: string;
  language: string;
  file_count: number;
  issues: Issue[];
}
