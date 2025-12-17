async function loadPosts() {
  const res = await fetch("./posts.json", { cache: "no-store" });
  if (!res.ok) throw new Error("posts.json failed to load");
  return await res.json();
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function cardHTML(p) {
  return `
    <a class="card" href="./post.html?slug=${encodeURIComponent(p.slug)}">
      <div class="card-top">
        <span class="card-tag">${p.category}</span>
        <span class="card-date">${formatDate(p.date)}</span>
      </div>

      <h3 class="card-title">${p.title}</h3>
      <p class="card-text">${p.excerpt}</p>

      <div class="card-footer">
        <span class="card-meta">${p.meta || ""}</span>
        <span class="card-link">Read →</span>
      </div>
    </a>
  `;
}

async function main() {
  const grid = document.getElementById("postsGrid");
  const searchInput = document.getElementById("searchInput");
  const filterButtons = Array.from(document.querySelectorAll(".filter"));

  const posts = await loadPosts();

  function getActiveFilter() {
    const btn = filterButtons.find(b => b.classList.contains("active"));
    return btn ? btn.dataset.filter : "all";
  }

  function apply() {
    const q = (searchInput?.value || "").trim().toLowerCase();
    const active = getActiveFilter();

    const filtered = posts.filter(p => {
      const matchesFilter = active === "all" || p.category === active;
      const hay = `${p.category} ${p.title} ${p.excerpt} ${p.meta || ""}`.toLowerCase();
      const matchesSearch = !q || hay.includes(q);
      return matchesFilter && matchesSearch;
    });

    grid.innerHTML = filtered.map(cardHTML).join("");
  }

  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      apply();
    });
  });

  if (searchInput) searchInput.addEventListener("input", apply);

  apply();
}

main().catch(err => {
  console.error(err);
  const grid = document.getElementById("postsGrid");
  if (grid) grid.innerHTML = `<div style="color:#ffb4b4">Blog failed to load. Check file paths.</div>`;
});
