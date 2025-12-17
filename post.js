function qs(name) {
  return new URLSearchParams(location.search).get(name);
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

async function loadPostsIndex() {
  const res = await fetch("./posts.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load posts.json");
  return await res.json();
}

async function loadPostHtml(slug) {
  const res = await fetch(`./posts/${slug}.html`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Missing post file: posts/${slug}.html`);
  return await res.text();
}

async function main() {
  const slug = qs("slug");
  if (!slug) throw new Error("No slug provided. Use post.html?slug=your-slug");

  const posts = await loadPostsIndex();
  const meta = posts.find(p => p.slug === slug);
  if (!meta) throw new Error("Post not found in posts.json");

  document.title = `FYNX — ${meta.title}`;
  document.getElementById("postCategory").textContent = meta.category;
  document.getElementById("postDate").textContent = formatDate(meta.date);
  document.getElementById("postTitle").textContent = meta.title;
  document.getElementById("postExcerpt").textContent = meta.excerpt;

  const html = await loadPostHtml(slug);
  document.getElementById("postBody").innerHTML = html;
}

main().catch(err => {
  console.error(err);
  document.getElementById("postBody").innerHTML =
    `<div class="error">This post failed to load. ${err.message}</div>`;
});
