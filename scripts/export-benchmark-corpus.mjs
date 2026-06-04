import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const samplesPath = path.join(root, "benchmarks", "known-bugs.json");
const outputDir =
  process.env.BENCHMARK_CORPUS_DIR || path.join(tmpdir(), "checkaicode-benchmark-corpus");

const extensions = {
  javascript: "js",
  typescript: "ts",
  python: "py",
  java: "java",
  go: "go",
  ruby: "rb",
  php: "php",
  c: "c",
  cpp: "cpp",
  rust: "rs",
  kotlin: "kt",
  scala: "scala",
  swift: "swift",
  csharp: "cs",
  "c#": "cs",
};

function safeName(value) {
  return value.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "");
}

function samplePath(sample, index) {
  const language = sample.language || "txt";
  const extension = extensions[language.toLowerCase()] || "txt";
  const prefix = String(index + 1).padStart(3, "0");
  return path.join(language, `${prefix}-${safeName(sample.id)}.${extension}`);
}

let samples;
try {
  samples = JSON.parse(readFileSync(samplesPath, "utf8"));
} catch (error) {
  console.error(
    `Failed to read benchmark samples: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
}
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

const manifest = samples.map((sample, index) => {
  const relativePath = samplePath(sample, index);
  const absolutePath = path.join(outputDir, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, sample.code.endsWith("\n") ? sample.code : `${sample.code}\n`);

  return {
    id: sample.id,
    title: sample.title,
    language: sample.language,
    path: relativePath,
    expectedPresent: sample.expectedPresent ?? [],
    expectedAbsent: sample.expectedAbsent ?? [],
  };
});

writeFileSync(path.join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2));
writeFileSync(
  path.join(outputDir, "README.md"),
  [
    "# Check AI Code Benchmark Corpus",
    "",
    "This directory is generated from `benchmarks/known-bugs.json`.",
    "",
    "Use it as a file-based corpus for external scanners such as CodeQL, Sonar,",
    "Snyk, or other tools that expect real source files rather than JSON samples.",
    "",
    "The expected rule IDs in `manifest.json` are Check AI Code rule IDs. External",
    "tools will not use the same IDs, so compare by sample-level hit/miss rather",
    "than exact rule ID.",
    "",
  ].join("\n")
);

console.log(`Exported ${samples.length} samples to ${outputDir}`);
console.log(`Manifest: ${path.join(outputDir, "manifest.json")}`);
