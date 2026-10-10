import { readFileSync } from "node:fs";

const { GITHUB_TOKEN, ANTHROPIC_API_KEY, REPO, PR_NUMBER } = process.env;
const MODEL = process.env.REVIEW_MODEL ?? "claude-sonnet-5-5";
const MAX_DIFF_CHARS = 60_000;

const diff = readFileSync("diff.txt", "utf8");
if (!diff.trim()) {
  console.log("No changes to review.");
  process.exit(0);
}

const guidelines = readFileSync(".github/review-guidelines.md", "utf8");
const truncated = diff.length > MAX_DIFF_CHARS;

// 1. Ask the model for a review
const res = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  },
  body: JSON.stringify({
    model: MODEL,
    max_tokens: 2000,
    system: `You are a senior full-stack reviewer for this repository. Review only the changes in the diff.\n\n${guidelines}`,
    messages: [
      {
        role: "user",
        content: `Review this pull request diff${truncated ? " (truncated)" : ""}:\n\n${diff.slice(0, MAX_DIFF_CHARS)}`,
      },
    ],
  }),
});

const text = await res.text();
console.log(`Model call: ${res.status} (${res.headers.get("content-type")})`);
if (!res.ok) throw new Error(`Model call failed: ${res.status} ${text.slice(0, 500)}`);

const data = JSON.parse(text);
const review = data.content
  .filter((block) => block.type === "text")
  .map((block) => block.text)
  .join("\n");

if (!review.trim()) throw new Error("Model returned no review text.");
const note = data.stop_reason === "max_tokens" ? "\n\n_⚠️ Review truncated at the token limit._" : "";

// 2. Post it as a PR comment
const MARKER =  "<!-- ai-review-bot -->";
const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
};
const body = 
  `${MARKER}\n## 🤖 AI review (${MODEL})\n` + 
  `_Reviewed commit ${process.env.HEAD_SHA?.slice(0,7)} at ${new Date().toISOString()}_\n\n` +
  review + note;

  // Find an existing bot comment
const listRes = await fetch(
  `https://api.github.com/repos/${REPO}/issues/${PR_NUMBER}/comments?per_page=100`, {headers}
);
if (!listRes.ok) throw new Error(`Listing comments failed: ${listRes.status} ${await listRes.text()}`);
const comments = await listRes.json();
const existing = comments.find((c) => c.user?.login === "github-actions[bot]" && c.body?.includes(MARKER));

// Update it or create new one
const url = existing
  ? `https://api.github.com/repos/${REPO}/issues/comments/${existing.id}`
  : `https://api.github.com/repos/${REPO}/issues/${PR_NUMBER}/comments}`;

const post = await fetch(url, {
  method: "POST",
  headers,
  body: JSON.stringify({ body }),
});
if (!post.ok) throw new Error(`Posting comment failed: ${post.status} ${await post.text()}`);

console.log(existing ? `Updated comment ${existing.id}` : "Created review comment");