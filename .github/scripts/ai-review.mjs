import { readFileSync } from "node:fs";

const { GITHUB_TOKEN, REPO, PR_NUMBER } = process.env;
const MODEL = process.env.REVIEW_MODEL ?? "openai/gpt-4.1";
const MAX_DIFF_CHARS = 60_000;

const diff = readFileSync("diff.txt", "utf8");
if (!diff.trim()) {
  console.log("No changes to review.");
  process.exit(0);
}

const guidelines = readFileSync(".github/review-guidelines.md", "utf8");
const truncated = diff.length > MAX_DIFF_CHARS;

// 1. Ask the model for a review
const res = await fetch("https://models.github.ai/inference/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: MODEL,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `You are a senior full-stack reviewer for this repository. Review only the changes in the diff.\n\n${guidelines}`,
      },
      {
        role: "user",
        content: `Review this pull request diff${truncated ? " (truncated)" : ""}:\n\n${diff.slice(0, MAX_DIFF_CHARS)}`,
      },
    ],
  }),
});

const text = await res.text();
console.log(`Model call: ${res.status} ${res.url} (${res.headers.get("content-type")})`);

if (!res.ok) throw new Error(`Model call failed: ${res.status} ${text.slice(0, 500)}`);

let data;
try {
  data = JSON.parse(text);
} catch {
  throw new Error(`Model returned non-JSON: ${text.slice(0, 500)}`);
}

const review = data.choices[0].message.content;

// 2. Post it as a PR comment
const post = await fetch(`https://api.github.com/repos/${REPO}/issues/${PR_NUMBER}/comments`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
  },
  body: JSON.stringify({ body: `## 🤖 AI review (${MODEL})\n\n${review}` }),
});
if (!post.ok) throw new Error(`Posting comment failed: ${post.status} ${await post.text()}`);

console.log("Review posted.");