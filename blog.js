async function loadPosts() {
  const res = await fetch("./posts.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load posts.json");
  return await res.json();
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function postCard(p) {
  return `
    <a class="card" href="./post.html?slug=${encodeURIComponent(p.slug)}">
      <div class="cardTop">
        <span class="pill">${p.category}</span>
        <span class="date">${formatDate(p.date)}</span>
      </div>
      <h3>${p.title}</h3>
      <p>${p.excerpt}</p>
      <div class="cardBottom">
        <span class="link">Read more →</span>
      </div>
    </a>
  `;
}

async function main() {
  const grid = document.getElementById("postsGrid");
  const search = document.getElementById("searchInput");
  const filters = document.querySelectorAll("[data-filter]");

  const posts = await loadPosts();

  function render(list) {
    grid.innerHTML = list.map(postCard).join("");
  }

  function apply() {
    const q = (search?.value || "").trim().toLowerCase();
    const active = document.querySelector("[data-filter].active")?.dataset.filter || "all";

    const filtered = posts.filter(p => {
      const hay = `${p.category} ${p.title} ${p.excerpt} ${(p.tags || []).join(" ")}`.toLowerCase();
      const matchesQ = !q || hay.includes(q);
      const matchesC = active === "all" || p.category === active;
      return matchesQ && matchesC;
    });

    render(filtered);
  }

  filters.forEach(btn => {
    btn.addEventListener("click", () => {
      filters.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      apply();
    });
  });

  if (search) search.addEventListener("input", apply);

  // Default
  const first = document.querySelector('[data-filter="all"]');
  if (first) first.classList.add("active");

  render(posts);
}
main().catch(err => {
  console.error(err);
  const grid = document.getElementById("postsGrid");
  if (grid) grid.innerHTML = `<div class="error">Blog failed to load. Check posts.json path.</div>`;
});
