#!/usr/bin/env python3
"""Read-only AI surface scanner for EU AI Act codebase assessments."""

from __future__ import annotations

import argparse
import json
import os
import re
from collections import defaultdict
from pathlib import Path


DEFAULT_EXCLUDES = {
    ".git",
    "node_modules",
    "dist",
    "build",
    ".next",
    ".astro",
    ".venv",
    "venv",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".turbo",
    "coverage",
    ".tmp"
}

DEFAULT_EXCLUDED_PATHS = {
    ("public", "rag-index"),
    ("content", "blog"),
    ("src", "content", "blog"),
    ("planned-blogs",),
}

MAX_TEXT_FILE_BYTES = 300_000

TEXT_EXTENSIONS = {
    ".astro",
    ".css",
    ".go",
    ".html",
    ".js",
    ".json",
    ".jsx",
    ".md",
    ".mdx",
    ".mjs",
    ".py",
    ".rs",
    ".ts",
    ".tsx",
    ".txt",
    ".yaml",
    ".yml",
}

PATTERNS = {
    "model_provider": r"\b(openai|anthropic|gemini|vertex|bedrock|azure\s*openai|ollama|llama|mistral|cohere|huggingface|transformers|litellm)\b",
    "agent_or_tool": r"\b(ai\s*agent|agentic|tool_call|function_call|tool\s*use|planner|executor|autonomous|handoff)\b",
    "rag_or_embedding": r"\b(rag|retriev|embedding|vector\s*store|vector\s*db|semantic\s*search|chunk|pgvector|pinecone|weaviate|qdrant|chroma|faiss|milvus)\b",
    "prompting": r"\b(prompt|system\s*message|developer\s*message|instructions|few[- ]shot|temperature|max_tokens)\b",
    "generated_content": r"\b(generate|generated|deepfake|synthetic|chatbot|assistant|summary|summarize)\b",
    "personal_data": r"\b(pii|personal\s*data|gdpr|email|phone|address|salary|medical|health|employee|customer|tenant)\b",
    "high_risk_domain": r"\b(hr|hiring|recruit|candidate|employee|promotion|termination|worker\s*management|performance\s*evaluation|education|student|credit|loan|insurance|eligibility|public\s*benefit|healthcare|law\s*enforcement|border\s*control|migration|asylum|biometric|emotion\s*recognition|court|legal\s*decision|election)\b",
    "oversight": r"\b(human\s*review|manual\s*review|approval|approve|escalat|override|fallback|moderation)\b",
    "logging_monitoring": r"\b(audit|trace|telemetry|log|monitor|eval|benchmark|regression|drift|incident|alert)\b",
    "security": r"\b(auth|permission|access\s*control|rbac|redact|secret|token|prompt\s*injection|jailbreak|rate\s*limit)\b",
}


def is_excluded_path(path: Path, root: Path, include_content: bool) -> bool:
    if include_content:
        return False
    rel_parts = path.relative_to(root).parts
    return any(rel_parts[: len(excluded)] == excluded for excluded in DEFAULT_EXCLUDED_PATHS)


def iter_files(root: Path, include_content: bool):
    for current_root, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in DEFAULT_EXCLUDES]
        for name in files:
            path = Path(current_root) / name
            if is_excluded_path(path, root, include_content):
                continue
            if path.suffix.lower() in TEXT_EXTENSIONS:
                try:
                    if path.stat().st_size > MAX_TEXT_FILE_BYTES:
                        continue
                except OSError:
                    continue
                yield path


def read_text(path: Path) -> str | None:
    try:
        return path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return None


def scan_one(root: Path, include_content: bool = False) -> dict:
    compiled = {name: re.compile(pattern, re.IGNORECASE) for name, pattern in PATTERNS.items()}
    findings: dict[str, list[dict[str, object]]] = defaultdict(list)
    counts = defaultdict(int)
    scanned_files = 0

    for path in iter_files(root, include_content):
        text = read_text(path)
        if text is None:
            continue
        scanned_files += 1
        rel = path.relative_to(root)
        lines = text.splitlines()
        for category, pattern in compiled.items():
            for line_number, line in enumerate(lines, start=1):
                if pattern.search(line):
                    counts[category] += 1
                    if len(findings[category]) < 40:
                        findings[category].append(
                            {
                                "file": str(rel),
                                "line": line_number,
                                "snippet": line.strip()[:220],
                            }
                        )

    return {
        "root": str(root),
        "scanned_files": scanned_files,
        "counts": dict(sorted(counts.items())),
        "findings": dict(sorted(findings.items())),
    }


def scan(roots: list[Path], include_content: bool = False) -> dict:
    combined_counts = defaultdict(int)
    combined_findings: dict[str, list[dict[str, object]]] = defaultdict(list)
    scanned_files = 0

    for root in roots:
        result = scan_one(root, include_content=include_content)
        scanned_files += result["scanned_files"]
        for category, count in result["counts"].items():
            combined_counts[category] += count
        for category, items in result["findings"].items():
            combined_findings[category].extend(items)

    return {
        "roots": [str(root) for root in roots],
        "scanned_files": scanned_files,
        "counts": dict(sorted(combined_counts.items())),
        "findings": dict(sorted(combined_findings.items())),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Scan a repository for AI-system assessment evidence.")
    parser.add_argument("roots", nargs="*", default=["."], help="Repository roots to scan")
    parser.add_argument("--json", action="store_true", help="Emit JSON instead of Markdown")
    parser.add_argument("--include-content", action="store_true", help="Include blog/content directories that are skipped by default")
    args = parser.parse_args()

    roots = [Path(root).resolve() for root in args.roots]
    result = scan(roots, include_content=args.include_content)

    if args.json:
        print(json.dumps(result, indent=2))
        return 0

    print("# AI Surface Scan")
    print()
    print("Roots:")
    for root in result["roots"]:
        print(f"- `{root}`")
    print(f"Scanned files: {result['scanned_files']}")
    print()
    print("## Category Counts")
    print()
    print("| Category | Matches |")
    print("|---|---:|")
    for category, count in result["counts"].items():
        print(f"| {category} | {count} |")
    print()
    print("## Findings")
    for category, items in result["findings"].items():
        print()
        print(f"### {category}")
        for item in items[:12]:
            print(f"- `{item['file']}:{item['line']}` - {item['snippet']}")
        if len(items) > 12:
            print(f"- ... {len(items) - 12} more sampled finding(s)")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
