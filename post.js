function qs(name) {
  return new URLSearchParams(location.search).get(name);
}

function formatDate(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

async function loadIndex() {
  const res = await fetch("./posts.json", { cache: "no-store" });
  if (!res.ok) throw new Error("posts.json failed to load");
  return await res.json();
}

async function loadPostHTML(slug) {
  const res = await fetch(`./posts/${slug}.html`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Missing: posts/${slug}.html`);
  return await res.text();
}

async function main() {
  const slug = qs("slug");
  if (!slug) throw new Error("Missing ?slug=");

  const posts = await loadIndex();
  const meta = posts.find(p => p.slug === slug);
  if (!meta) throw new Error("Post not found in posts.json");

  document.title = `${meta.title} — FYNX Journal`;
  document.getElementById("postCategory").textContent = meta.category;
  document.getElementById("postDate").textContent = formatDate(meta.date) + (meta.updated ? ` · Updated ${formatDate(meta.updated)}` : "");
  document.querySelector('meta[name="description"]').content = meta.excerpt;
  document.getElementById("postTitle").textContent = meta.title;
  document.getElementById("postExcerpt").textContent = meta.excerpt;

  const html = await loadPostHTML(slug);
  document.getElementById("postBody").innerHTML = html;
}

main().catch(err => {
  console.error(err);
  document.getElementById("postTitle").textContent = "Article unavailable";
  document.getElementById("postBody").innerHTML =
    `<p>This article is unavailable. <a href="./index.html">Return to all articles</a>.</p>`;
});

