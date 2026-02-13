let currentPage = 1;
const PAGE_LIMIT = 10;


/* =========================================================
   MAIN.JS — CLEAN, STABLE, FINAL
========================================================= */

/* ---------------------------------------------------------
   UTIL
--------------------------------------------------------- */
function qs(id) {
  return document.getElementById(id);
}

/* =========================================================
   HOMEPAGE IMAGE SLIDESHOW (SAFE, SILENT)
========================================================= */

/* =========================================================
   PREMIUM SECTION-SPECIFIC THUMBNAIL SLIDESHOW ENGINE
========================================================= */

function startSlideshow(imgEl, images, mode = "fade") {
  if (!imgEl || !images || images.length <= 1) return;

  let index = 0;

  if (mode === "slide") {
    setupSlideAnimation(imgEl, images);
    return;
  }

  if (mode === "zoom") {
    setupZoomAnimation(imgEl, images);
    return;
  }

  if (mode === "crossfade") {
    setupCrossfadeAnimation(imgEl, images);
    return;
  }

  if (mode === "rotate") {
    setupRotateAnimation(imgEl, images);
    return;
  }


  // default fallback
  setupFadeAnimation(imgEl, images);
}

/* ---------- BREAKING NEWS: SLIDE (RIGHT → LEFT) ---------- */
function setupSlideAnimation(imgEl, images) {
  let index = 0;

  imgEl.style.transition = "transform 0.9s ease, opacity 0.9s ease";
  imgEl.style.transform = "translateX(0)";
  imgEl.style.opacity = "1";

  setInterval(() => {
    imgEl.style.transform = "translateX(-30px)";
    imgEl.style.opacity = "0";

    setTimeout(() => {
      index = (index + 1) % images.length;
      imgEl.src = images[index];
      imgEl.style.transform = "translateX(30px)";
    }, 450);

    setTimeout(() => {
      imgEl.style.transform = "translateX(0)";
      imgEl.style.opacity = "1";
    }, 500);

  }, 5000);
}

/* ---------- LATEST HEADLINES: SOFT FADE ---------- */
function setupFadeAnimation(imgEl, images) {
  let index = 0;
  imgEl.style.transition = "opacity 0.8s ease-in-out";

  setInterval(() => {
    imgEl.style.opacity = "0";

    setTimeout(() => {
      index = (index + 1) % images.length;
      imgEl.src = images[index];
      imgEl.style.opacity = "1";
    }, 400);
  }, 4500);
}

/* ---------- TODAY'S BREAKING: ZOOM IN ---------- */
function setupZoomAnimation(imgEl, images) {
  let index = 0;

  imgEl.style.transition =
    "opacity 0.7s ease, transform 0.7s ease";
  imgEl.style.transform = "scale(1)";
  imgEl.style.opacity = "1";

  setInterval(() => {
    imgEl.style.opacity = "0";
    imgEl.style.transform = "scale(1.05)";

    setTimeout(() => {
      index = (index + 1) % images.length;
      imgEl.src = images[index];
      imgEl.style.transform = "scale(1)";
      imgEl.style.opacity = "1";
    }, 400);
  }, 4800);
}

/* ---------- ARCHIVE: ROTATE ANTI-CLOCKWISE ---------- */
function setupRotateAnimation(imgEl, images) {
  let index = 0;

  imgEl.style.transition =
    "opacity 0.8s ease, transform 0.8s ease";
  imgEl.style.transformOrigin = "center center";
  imgEl.style.opacity = "1";

  setInterval(() => {

    // rotate anti-clockwise and fade out
    imgEl.style.transform = "rotate(-12deg) scale(0.95)";
    imgEl.style.opacity = "0";

    setTimeout(() => {
      index = (index + 1) % images.length;
      imgEl.src = images[index];

      // reset rotation before fading back
      imgEl.style.transform = "rotate(12deg) scale(0.95)";
    }, 400);

    setTimeout(() => {
      imgEl.style.transform = "rotate(0deg) scale(1)";
      imgEl.style.opacity = "1";
    }, 450);

  }, 5000);
}


/* ---------- MORE STORIES: CROSS FADE (VERY SUBTLE) ---------- */
function setupCrossfadeAnimation(imgEl, images) {
  let index = 0;

  imgEl.style.transition = "opacity 1s ease-in-out";

  setInterval(() => {
    imgEl.style.opacity = "0";

    setTimeout(() => {
      index = (index + 1) % images.length;
      imgEl.src = images[index];
      imgEl.style.opacity = "1";
    }, 600);
  }, 6000);
}




/* ---------------------------------------------------------
   PAGE DETECTION
--------------------------------------------------------- */
const isArticlePage = document.body.classList.contains("article-page");
// 🚫 Article pages should NEVER show breaking layout
if (isArticlePage) {
  const breakingStack = document.querySelector(".breaking-stack");
  const todayBreaking = document.querySelector(".today-breaking-section");

  breakingStack && breakingStack.remove();
  todayBreaking && todayBreaking.remove();
}


function highlightActiveNav() {
  const navLinks = document.querySelectorAll(".masthead-nav a");
  if (!navLinks.length) return;

  const params = new URLSearchParams(window.location.search);
  const currentCategory = params.get("category");
  const path = window.location.pathname;

  navLinks.forEach(link => {
    link.classList.remove("active");
  });

  // 1️⃣ Time Travel page (highest priority)
  if (path.includes("archive.html")) {
    document
      .querySelector('.masthead-nav a[data-nav="time-travel"]')
      ?.classList.add("active");
    return; // ⛔ STOP HERE — do not activate HOME
  }

  // 2️⃣ Category pages
  if (currentCategory) {
    document
      .querySelector(`.masthead-nav a[data-nav="${currentCategory.toLowerCase()}"]`)
      ?.classList.add("active");
    return;
  }

  // 3️⃣ Home & article pages
  document
    .querySelector('.masthead-nav a[data-nav="home"]')
    ?.classList.add("active");
    
  }

/* =========================================================
   HOMEPAGE LOGIC
========================================================= */
function loadHomepage() {
  const params = new URLSearchParams(window.location.search);
  const selectedCategory = params.get("category");

  const breakingList = qs("breaking-list");
  const latestList = qs("latest-list");
  const newsList = qs("news-list");
  const trendingList = qs("trending-list");
  const todayBreakingList = qs("today-breaking-list");

  if (!newsList) return;

  // Skeleton
  newsList.innerHTML = `
    <div class="skeleton skeleton-text"></div>
    <div class="skeleton skeleton-text"></div>
    <div class="skeleton skeleton-text short"></div>
  `;
  let apiUrl = "/api/news?type=homepage&limit=20";
  if (selectedCategory) {
    apiUrl += `&category=${encodeURIComponent(selectedCategory)}`;
  }
  fetch(apiUrl)
    .then(res => res.json())
    .then(data => {
      const allArticles = [
        ...(data.breaking || []),
        ...(data.articles || [])
      ];

      data = allArticles;

      // Clear skeletons
      breakingList && (breakingList.innerHTML = "");
      latestList && (latestList.innerHTML = "");
      newsList.innerHTML = "";
      trendingList && (trendingList.innerHTML = "");
      

      /* -------- BREAKING -------- */
      const breaking = data
        .filter(a => a.breaking)
        .slice(0, 10); // ✅ LIMIT TO 10 BREAKING NEWS


      /* -------- TODAY'S BREAKING NEWS -------- */
      if (todayBreakingList) {
        todayBreakingList.innerHTML = "";

        const today = new Date().toISOString().split("T")[0];

        const todaysBreaking = data.filter(
          a => a.breaking && a.date === today
        );

        if (todaysBreaking.length === 0) {
          todayBreakingList.innerHTML = `
          <p style="color:#999;font-size:15px;max-width:600px;">
            There are no breaking developments today.
            Regular news coverage continues below.
          </p>
        `;

        } else {
          todaysBreaking.forEach(article => {
            todayBreakingList.innerHTML += `
              <div class="news-card today-breaking-item">
                <div class="news-card-body">

                  <h3>
                    <a href="article.html?id=${article._id}">
                      ${article.title}
                    </a>
                  </h3>

                  <p class="summary">${article.summary}</p>

                  <div class="meta">
                    ${article.category} • ${article.date}
                  </div>

                </div>

                <img 
                  class="today-breaking-thumb"
                  src="${article.image || '/assets/news-placeholder.jpg'}"
                  data-images='${JSON.stringify(article.images || [])}'
                  alt="${article.title}"
                />
              </div>
            `;
          });
        }

        // 🟠 Today’s Breaking — ZOOM animation
        document.querySelectorAll(".today-breaking-thumb").forEach(img => {
          try {
            const images = JSON.parse(img.dataset.images || "[]");
            startSlideshow(img, images, "slide");

          } catch (e) {}
        });
      }


      const heroBreaking = breaking[0];          // latest breaking
      const secondaryBreaking = breaking.slice(1);

      if (heroBreaking) {
        breakingList.innerHTML += `
          <div class="breaking-hero">
            <a href="article.html?id=${heroBreaking._id}" class="breaking-link">
              <img src="${heroBreaking.image}" alt="${heroBreaking.title}" />
              <h2>${heroBreaking.title}</h2>
              <p class="summary">${heroBreaking.summary || ""}</p>
              <div class="breaking-meta">
                ${heroBreaking.category} • ${heroBreaking.date}
              </div>
            </a>
          </div>
        `;
      setTimeout(() => {
        const heroImg = document.querySelector(".breaking-hero img");
        startSlideshow(heroImg, heroBreaking.images, "slide");
      }, 100);


      secondaryBreaking.forEach(article => {
        breakingList.innerHTML += `
          <div class="breaking-item">
            <a href="article.html?id=${article._id}" class="breaking-link">
              <img 
                src="${article.image || '/assets/news-placeholder.jpg'}"
                class="breaking-thumb"
                data-images='${JSON.stringify(article.images || [])}'
              />
              <div class="breaking-text">
                <h2>${article.title}</h2>
                <p class="summary">${article.summary || ""}</p>
                <div class="breaking-meta">
                  ${article.category} • ${article.date}
                </div>
              </div>
            </a>
          </div>
        `;
      });

      // 🔴 Secondary Breaking — SLIDE animation
      document.querySelectorAll(".breaking-thumb").forEach(img => {
        try {
          const images = JSON.parse(img.dataset.images || "[]");
          startSlideshow(img, images, "slide");
        } catch (e) {}
      });
    }


      /* -------- LATEST (TOP 2 NON-BREAKING) -------- */
      const nonBreaking = data.filter(a => !a.breaking);
      const latest = nonBreaking.slice(0, 5);

      latest.forEach(article => {
        latestList.innerHTML += `
          <div class="latest-item">
            <img
              src="${article.image || '/assets/news-placeholder.jpg'}"
              data-images='${JSON.stringify(article.images || [])}'
            />

            <div class="latest-text">
              <h4>
                <a href="article.html?id=${article._id}">
                  ${article.title}
                </a>
              </h4>
              
              <div class="meta">
                ${article.category} • ${article.date}
              </div>
            </div>
          </div>
        `;
      });


      // 🔵 Latest Headlines — FADE animation
      document.querySelectorAll(".latest-item img").forEach(img => {
        try {
          const images = JSON.parse(img.dataset.images || "[]");
          startSlideshow(img, images, "slide");
        } catch (e) {}
      });



      /* -------- MORE STORIES (ALL REMAINING) -------- */
      const remaining = nonBreaking;

      remaining.forEach(article => {
        newsList.innerHTML += `
          <div class="news-card">
            <img
              src="${article.image || '/assets/news-placeholder.jpg'}"
              data-images='${JSON.stringify(article.images || [])}'
            >
            <div class="news-card-body">

              <h3>
                <a href="article.html?id=${article._id}">
                  ${article.title}
                </a>
              </h3>

              <p class="summary">${article.summary}</p>

              <div class="meta">
                ${article.category} • ${article.date}
              </div>

            </div>
          </div>
        `;
      });

      // 🟢 More Stories — CROSSFADE animation
      document.querySelectorAll(".news-card img").forEach(img => {
        try {
          const images = JSON.parse(img.dataset.images || "[]");
          startSlideshow(img, images, "slide");
        } catch (e) {}
      });


      
      /* -------- MOST READ (by views) -------- */
      data
        .slice()
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5)
        .forEach(article => {
          trendingList.innerHTML += `
            <p>
              <a href="article.html?id=${article._id}">
                ${article.title}
              </a>
            </p>
          `;
        });

        
    })
    .catch(err => {
      console.error("Homepage load failed", err);
    });
}




/* =========================================================
   ARTICLE PAGE LOGIC
========================================================= */
function loadArticlePage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id || !qs("title")) return;

  qs("content").innerHTML = `
    <span class="skeleton skeleton-text"></span>
    <span class="skeleton skeleton-text"></span>
    <span class="skeleton skeleton-text short"></span>
  `;

  fetch(`/api/news/${id}`)
    .then(res => res.json())
    .then(article => {
      qs("title").innerText = article.title;
      qs("date").innerText = article.date;
      qs("category-label").innerText = article.category || "News";

      // ---------------- RELATED ARTICLES (SAME CATEGORY) ----------------
      const sidebarCategory = qs("sidebar-category");
      const relatedList = qs("related-list");

      if (sidebarCategory && relatedList && article.category) {
        sidebarCategory.innerText = article.category;

        fetch("/api/news?limit=50")
          .then(res => res.json())
          .then(data => {

            const combined = [
              ...(data.breaking || []),
              ...(data.articles || [])
            ];

            const related = combined
              .filter(a =>
                a.category === article.category &&
                a._id !== article._id
              )
              .slice(0, 5);


            relatedList.innerHTML = related.length
              ? related.map(a => `
                  <div class="latest-item">
                    <img
                      src="${a.image || '/assets/news-placeholder.jpg'}"
                      data-images='${JSON.stringify(a.images || [])}'
                      alt="${a.title}"
                    />

                    <div class="latest-text">
                      <h4>
                        <a href="article.html?id=${a._id}">
                          ${a.title}
                        </a>
                      </h4>

                      <div class="meta">
                        ${a.category} • ${a.date}
                      </div>
                    </div>
                  </div>
                `).join("")
              : `<p style="color:#777;font-size:14px;">No more articles in this category.</p>`;
          });

          // 🔵 Animate latest thumbnails in article page sidebar
          setTimeout(() => {
            document
              .querySelectorAll("#related-list .latest-item img")
              .forEach(img => {
                try {
                  const images = JSON.parse(img.dataset.images || "[]");
                  startSlideshow(img, images, "slide");
                } catch (e) {}
              });
          }, 100);


          // Sidebar thumbnail slideshow (same premium animation)
          document.querySelectorAll(".sidebar-item img").forEach(img => {
            const articleId = img.closest(".sidebar-item")
              ?.querySelector("a")
              ?.getAttribute("href")
              ?.split("id=")[1];

            if (!articleId) return;

            fetch(`/api/news/${articleId}`)
              .then(res => res.json())
              .then(a => {
                const images = a.images && a.images.length > 1 ? a.images : [];
                startSlideshow(img, images, "slide");
              });
          });
      }


      qs("content").innerHTML = article.content
        .split("\n")
        .map(p => `<p>${p}</p>`)
        .join("");

        // ===============================
        // RENDER SPONSORED AD (MANUAL)
        // ===============================
        const sponsoredSlot = document.getElementById("sponsored-ad-slot");

        if (
          sponsoredSlot &&
          article.ads &&
          article.ads.sponsored &&
          article.ads.sponsored.content &&
          article.ads.sponsored.content.trim() !== ""
        ) {
          sponsoredSlot.innerHTML = `
            <div class="sponsored-label">Sponsored</div>
            ${article.ads.sponsored.content}
          `;
        } else if (sponsoredSlot) {
          sponsoredSlot.innerHTML = "";
        }

      
      // ---------------- ARTICLE VIDEO ----------------
      const videoContainer = document.getElementById("article-video");
      const videoLink = document.getElementById("article-video-link");

      if (
        article.video &&
        typeof article.video === "string" &&
        article.video.trim() !== "" &&
        article.video !== "__REMOVE__"
      ) {

        videoLink.href = article.video;
        videoContainer.style.display = "block";
      } else {
        videoContainer.style.display = "none";
        videoLink.href = "";   // 🔥 THIS LINE WAS MISSING
        videoContainer.innerHTML = ""; // 🔥 FORCE RESET
      }

      
      // 🔐 Count view ONLY ONCE per user (lifetime)
      const viewKey = `viewed_once_${article._id}`;

      if (!localStorage.getItem(viewKey)) {
        fetch(`/api/news/${article._id}/view`, {
          method: "POST"
        });

        // Mark as viewed permanently
        localStorage.setItem(viewKey, "true");
      }


      // SEO
      document.title = `${article.title} | Sangareddy News`;
      qs("meta-description")?.setAttribute(
        "content",
        article.summary || article.content.slice(0, 150)
      );
      qs("og-title")?.setAttribute("content", article.title);
      qs("og-description")?.setAttribute(
        "content",
        article.summary || article.content.slice(0, 150)
      );
      article.image &&
        qs("og-image")?.setAttribute("content", article.image);

      // Article Hero Image / Slideshow (SAME AS HOMEPAGE)
      const heroImg = qs("article-image");

      if (heroImg) {
        const images = article.images && article.images.length > 0
          ? article.images
          : article.image
            ? [article.image]
            : [];

        if (images.length > 0) {
          heroImg.src = images[0];
          startSlideshow(heroImg, images, "slide");
        }
      }

      // Author
      if (article.author && qs("author-box")) {
        qs("author-box").innerHTML = `
          <img src="${article.author.photo}">
          <div class="author-details">
            <div class="author-name">${article.author.name}</div>
            ${
              article.author.verified
                ? `<div class="author-verified">✔ Verified Reporter</div>`
                : ""
            }
          </div>
        `;
      }

      // Likes
      const likeBtn = qs("like-btn");
      const likeCount = qs("like-count");
      if (likeBtn && likeCount) {
        likeCount.innerText = article.likes || 0;
        const likedKey = `liked_${article._id}`;

        if (localStorage.getItem(likedKey)) {
          likeBtn.classList.add("liked");

          const icon = likeBtn.querySelector("i");
          if (icon) {
            icon.classList.remove("fa-regular");
            icon.classList.add("fa-solid");
          }
        }

        likeBtn.onclick = () => {
          if (localStorage.getItem(likedKey)) return;

          fetch(`/api/news/${article._id}/like`, {
            method: "POST"
          })
            .then(res => res.json())
            .then(data => {
              if (data.likes !== undefined) {
                likeCount.innerText = data.likes;

                // 🔥 ICON SWITCH: outline → solid
                const icon = likeBtn.querySelector("i");
                if (icon) {
                  icon.classList.remove("fa-regular");
                  icon.classList.add("fa-solid");
                }

                likeBtn.classList.add("liked");
                localStorage.setItem(likedKey, "true");
              }
            })
            .catch(() => {
              console.error("Like failed");
            });
        };
      }

      // Share
      const url = window.location.href;
      qs("wa-share") && (qs("wa-share").href = `https://wa.me/?text=${encodeURIComponent(url)}`);
      qs("fb-share") && (qs("fb-share").href = `https://www.facebook.com/sharer/sharer.php?u=${url}`);
      qs("tw-share") && (qs("tw-share").href = `https://twitter.com/intent/tweet?url=${url}`);

      // Comments
      function renderComments(comments) {
        qs("comments").innerHTML = comments
          .map(c => `<p><strong>${c.name}</strong>: ${c.text}</p>`)
          .join("");
      }

      renderComments(article.comments || []);

      qs("comment-btn") &&
        (qs("comment-btn").onclick = async () => {
          const name = qs("comment-name").value;
          const text = qs("comment-text").value;
          if (!name || !text) return;

          const res = await fetch(`/api/news/${article._id}/comment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, text })
          });

          const comments = await res.json();
          renderComments(comments);
          qs("comment-name").value = "";
          qs("comment-text").value = "";
        });
    })
    .catch(err => console.error("Article load failed", err));
}


/* =========================================================
   CATEGORY RENDER + PAGINATION (STEP 8)
========================================================= */

function renderCategory(catData) {
  const breakingList = qs("breaking-list");
  const newsList = qs("news-list");

  if (!breakingList || !newsList) return;

  breakingList.innerHTML = "";
  newsList.innerHTML = "";

  // 🔴 CATEGORY BREAKING (TOP SECTION)
  const breaking = (catData.breaking || []).filter(a => a.breaking);

  breaking.forEach(article => {
    breakingList.innerHTML += `
      <div class="breaking-item">
        <a href="article.html?id=${article._id}" class="breaking-link">
          <img src="${article.image || '/assets/news-placeholder.jpg'}" />
          <div class="breaking-text">
            <h2>${article.title}</h2>
            <div class="breaking-meta">
              ${article.category} • ${article.date}
            </div>
          </div>
        </a>
      </div>
    `;
  });

  // 📰 MORE STORIES (CATEGORY)
  catData.articles.forEach(article => {
    newsList.innerHTML += `
      <div class="news-card">
        <img
          src="${article.image || '/assets/news-placeholder.jpg'}"
          data-images='${JSON.stringify(article.images || [])}'
        >

        <div class="news-card-body">

          <h3>
            <a href="article.html?id=${article._id}">
              ${article.title}
            </a>
          </h3>

          <p class="summary">${article.summary}</p>

          <div class="meta">
            ${article.category} • ${article.date}
          </div>

        </div>
      </div>
    `;
  });

  // 🟢 Category More Stories — SLIDESHOW animation
  document.querySelectorAll(".news-card img").forEach(img => {
    try {
      const images = JSON.parse(img.dataset.images || "[]");
      startSlideshow(img, images, "slide");
    } catch (e) {}
  });
}


function renderPagination(page, totalPages) {
  const newsList = qs("news-list");
  if (!newsList || totalPages <= 1) return;

  const pagination = document.createElement("div");
  pagination.style.marginTop = "50px";
  pagination.style.textAlign = "center";

  pagination.innerHTML = `
    <button ${page === 1 ? "disabled" : ""} id="prev-page">← Previous</button>
    <span style="margin:0 14px;">Page ${page} of ${totalPages}</span>
    <button ${page === totalPages ? "disabled" : ""} id="next-page">Next →</button>
  `;

  newsList.appendChild(pagination);

  document.getElementById("prev-page")?.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      loadHomepage();
    }
  });

  document.getElementById("next-page")?.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadHomepage();
    }
  });
}

/* =========================================================
   INIT
========================================================= */
if (isArticlePage) {
  loadArticlePage();
} else {
  loadHomepage();
}

// 🔥 ALWAYS highlight active section
highlightActiveNav();


/* =========================================================
   HEADER SCROLL
========================================================= */
window.addEventListener("scroll", () => {
  const header = document.querySelector(".brand-header");
  if (!header) return;
  header.classList.toggle("header-shrink", window.scrollY > 40);
});

/* =========================================================
   CLICK FEEDBACK
========================================================= */
document.addEventListener("click", e => {
  if (e.target.closest("a, button")) {
    document.body.style.cursor = "progress";
    setTimeout(() => {
      document.body.style.cursor = "default";
    }, 300);
  }
});


/* =========================================================
   TIME TRAVELER / ARCHIVE PAGE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  
  // ================================
  // TIME TRAVELER – CATEGORY PILLS
  // ================================
  

  document.querySelectorAll(".archive-categories button").forEach(btn => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".archive-categories button")
        .forEach(b => b.classList.remove("active"));

      btn.classList.add("active");
      selectedCategory = btn.dataset.category || "";
    });
  });
});

/* =========================
   ARCHIVE FETCH (USED BY TIME MACHINE)
========================= */

function fetchArchive(date) {
  const results = document.getElementById("archive-results");
  const onThisDay = document.getElementById("on-this-day");
  const category = selectedCategory || "";

  if (!results) return;

  let url = `/api/archive?date=${date}`;
  if (category) {
    url += `&category=${category}`;
  }

  results.innerHTML = "<p style='color:#888;'>Loading...</p>";
  onThisDay && (onThisDay.innerHTML = "");

  fetch(url)
    .then(res => res.json())
    .then(data => {
      const articles = data.articles || [];

      /* ---------- ON THIS DAY ---------- */
      if (onThisDay && articles.length > 0) {
        const highlights = articles.slice(0, 3);

        onThisDay.innerHTML = `
          <div class="on-this-day-card">
            <h2>On This Day</h2>
            ${highlights
              .map(
                a => `
                <div class="on-this-day-item">
                  <h3>
                    <a href="/article.html?id=${a._id}">
                      ${a.title}
                    </a>
                  </h3>
                  <p>${a.summary}</p>
                </div>
              `
              )
              .join("")}
          </div>
        `;
      }

      /* ---------- ARCHIVE LIST ---------- */
      if (articles.length === 0) {
        results.innerHTML = `
          <div class="empty-archive">
            <h3>No stories on this day</h3>
            <p>
              We didn’t publish any news on this date.
              Try another day or explore nearby dates.
            </p>
          </div>
        `;
        return;
      }


      results.innerHTML = "";

      articles.forEach(article => {
        const card = document.createElement("div");
        card.className = "news-card archive-card";

        card.innerHTML = `
          <img
            class="archive-thumb"
            src="${article.image || '/assets/news-placeholder.jpg'}"
            data-images='${JSON.stringify(article.images || [])}'
            alt="${article.title}"
          />
          <div class="archive-content">
            <h3>
              <a href="/article.html?id=${article._id}">
                ${article.title}
              </a>
            </h3>
            <p class="summary">${article.summary}</p>
            <div class="meta">
              ${article.category} • ${article.date}
            </div>
          </div>
        `;

        results.appendChild(card);
      });

      // 🔵 Archive Thumbnail Slideshow — ENABLE ANIMATION
      document.querySelectorAll(".archive-thumb").forEach(img => {
        try {
          const images = JSON.parse(img.dataset.images || "[]");
          startSlideshow(img, images, "rotate");
        } catch (e) {}
      });
    });
}

/* =========================
   TIME MACHINE NAVIGATION
========================= */

function goBack() {
  if (!dateView.classList.contains("hidden")) {
    selectedDateStr = null;
    updateBreadcrumb();
    dateView.classList.add("hidden");
    monthView.classList.remove("hidden");
    return;
  }

  if (!monthView.classList.contains("hidden")) {
    selectedMonth = null;
    updateBreadcrumb();
    monthView.classList.add("hidden");
    yearView.classList.remove("hidden");
  }
}


// 🚀 PREVIEW MODE LAUNCH DATE (first-ever article date)
const launchDate = new Date(2026, 1, 6, 12, 0, 0); 
// Month is 0-based → Feb = 1

/* =========================
   TIME TRAVEL BREADCRUMB
========================= */

function updateBreadcrumb() {
  const bc = document.getElementById("time-breadcrumb");
  if (!bc) return;

  let parts = [];

  if (selectedYear) {
    parts.push(selectedYear);
  }

  if (selectedMonth) {
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    parts.push(monthNames[selectedMonth - 1]);
  }

  if (selectedDateStr) {
    const day = selectedDateStr.split("-")[2];
    parts.push(day);
  }

  bc.innerHTML = parts.length
    ? parts.join(" <span class='sep'>›</span> ")
    : "";
}


/* =========================
   TIME MACHINE LOGIC
========================= */

// AUTO-GENERATED ARCHIVE DATES (PREVIEW + PROD SAFE)
let availableArchiveDates = [];

fetch("/api/archive/dates")
  .then(res => res.json())
  .then(data => {
    availableArchiveDates = (data.dates || []).sort();
    renderYears(); // 🔥 IMPORTANT: trigger year rendering AFTER data loads
  })
  .catch(err => {
    console.error("Failed to load archive dates", err);
  });






let selectedYear = null;
let selectedMonth = null;
let selectedDateStr = null;
let selectedCategory = "";


const yearView = document.getElementById("tm-year");
const monthView = document.getElementById("tm-month");
const dateView = document.getElementById("tm-date");

const yearsGrid = document.getElementById("tm-years");
const monthsGrid = document.getElementById("tm-months");
const datesGrid = document.getElementById("tm-dates");

/* ---------- YEAR SETUP (AUTO, DATA-DRIVEN) ---------- */

function renderYears() {
  yearsGrid.innerHTML = "";

  // derive years only from published articles
  const yearsSet = new Set(
    availableArchiveDates.map(d => Number(d.split("-")[0]))
  );

  // no articles yet → show nothing
  if (yearsSet.size === 0) return;

  const years = Array.from(yearsSet).sort();

  years.forEach(year => {
    const div = document.createElement("div");
    div.textContent = year;

    div.onclick = () => {
      selectedYear = year;
      selectedMonth = null;
      selectedDateStr = null;
      updateBreadcrumb();
      showMonths();
    };


    yearsGrid.appendChild(div);
  });
}

// render years after archive dates are loaded
setTimeout(renderYears, 300);



/* ---------- MONTH VIEW ---------- */

function showMonths() {
  yearView.classList.add("hidden");
  monthView.classList.remove("hidden");

  monthsGrid.innerHTML = "";
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  months.forEach((m, idx) => {
    const div = document.createElement("div");
    div.textContent = m;

    const monthKeyPrefix = `${selectedYear}-${String(idx + 1).padStart(2,"0")}`;

    const hasMonthData = availableArchiveDates.some(d =>
      d.startsWith(monthKeyPrefix)
    );

    if (!hasMonthData) {
      div.classList.add("disabled");
      div.onclick = () => alert("No news available for this month");
    } else {
      div.onclick = () => {
        selectedMonth = idx + 1;
        selectedDateStr = null;
        updateBreadcrumb();
        showDates();
      };
    }
    monthsGrid.appendChild(div);
  });
}

/* ---------- DATE VIEW ---------- */

function showDates() {
  monthView.classList.add("hidden");
  dateView.classList.remove("hidden");

  datesGrid.innerHTML = "";

  const today = new Date();
  const isCurrentMonth =
    selectedYear === today.getFullYear() &&
    selectedMonth === today.getMonth() + 1;

  const maxDay = isCurrentMonth
    ? today.getDate()
    : new Date(selectedYear, selectedMonth, 0).getDate();


  availableArchiveDates.forEach(dateStr => {
    const [y, m, d] = dateStr.split("-").map(Number);

    // show only dates for selected year & month
    if (y !== selectedYear || m !== selectedMonth) return;

    const div = document.createElement("div");
    div.textContent = d;

    div.onclick = () => {
      selectedDateStr = dateStr;
      updateBreadcrumb();


      document.querySelectorAll("#tm-dates div").forEach(el =>
        el.classList.remove("active")
      );
      div.classList.add("active");
    };

    datesGrid.appendChild(div);
  });
}






const exploreBtn = document.getElementById("archive-search");

if (exploreBtn) {
  exploreBtn.addEventListener("click", () => {
    if (!selectedDateStr) {
      alert("Please select a date first");
      return;
    }
    fetchArchive(selectedDateStr);
  });
}

/* =========================
   ARCHIVE CLEAR BUTTON
========================= */

const clearBtn = document.getElementById("archive-clear");

if (clearBtn) {
  clearBtn.addEventListener("click", () => {

    // 1️⃣ Reset state
    selectedYear = null;
    selectedMonth = null;
    selectedDateStr = null;
    selectedCategory = "";

    // 2️⃣ Reset breadcrumb
    updateBreadcrumb();

    // 3️⃣ Reset views
    yearView.classList.remove("hidden");
    monthView.classList.add("hidden");
    dateView.classList.add("hidden");

    // 4️⃣ Reset category pills to "All"
    document
      .querySelectorAll(".archive-categories button")
      .forEach(btn => {
        btn.classList.remove("active");
        if (btn.dataset.category === "") {
          btn.classList.add("active");
        }
      });

    // 5️⃣ Clear results + highlights
    const results = document.getElementById("archive-results");
    const onThisDay = document.getElementById("on-this-day");

    results && (results.innerHTML = "");
    onThisDay && (onThisDay.innerHTML = "");

  });
}

//MOBILE//


// ===============================
// MOBILE SECTIONS TOGGLE
// ===============================
const openBtn = document.getElementById("openSections");
const closeBtn = document.getElementById("closeSections");
const sheet = document.getElementById("sectionsSheet");

openBtn && openBtn.addEventListener("click", () => {
  sheet.classList.add("open");
});

closeBtn && closeBtn.addEventListener("click", () => {
  sheet.classList.remove("open");
});

// ===============================
// PWA SERVICE WORKER
// ===============================
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");
}

document.addEventListener("DOMContentLoaded", function () {

  const navItems = document.querySelectorAll(".mobile-bottom-nav .nav-item");

  function setActive(type) {
    navItems.forEach(item => item.classList.remove("active"));
    document.querySelector(`[data-mobile="${type}"]`)?.classList.add("active");
  }

  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");

  // ===== ROUTE DETECTION (FIXED ORDER) =====
  if ((path === "/" || path.includes("index.html")) && !category) {
    setActive("home");
  }
  else if (category && category.toLowerCase() === "latest") {
    setActive("latest");
  }
  else if (path.includes("archive.html")) {
    setActive("time");
  }
  else if (path.includes("contact.html")) {
    setActive("contact");
  }
  else {
    setActive("sections");
  }


  // ===== FORCE SECTIONS ACTIVE ON CLICK =====
  const openBtn = document.getElementById("openSections");

  openBtn?.addEventListener("click", function (e) {
    e.preventDefault();
    setActive("sections");

    const sheet = document.getElementById("sectionsSheet");
    sheet?.classList.add("open");
  });

});



// ===============================
// MOBILE DRAWER MENU
// ===============================

document.addEventListener("DOMContentLoaded", function() {

  const menuBtn = document.getElementById("mobileMenuBtn");
  const drawer = document.getElementById("mobileDrawer");
  const overlay = document.getElementById("mobileDrawerOverlay");
  const closeBtn = document.getElementById("closeDrawer");

  if (!menuBtn) return;

  function openDrawer() {
    drawer.classList.add("open");
    overlay.classList.add("open");
  }

  function closeDrawer() {
    drawer.classList.remove("open");
    overlay.classList.remove("open");
  }

  menuBtn.addEventListener("click", openDrawer);
  closeBtn.addEventListener("click", closeDrawer);
  overlay.addEventListener("click", closeDrawer);

});




/* =========================================================
   EPAPER GENERATOR ENGINE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.getElementById("generate-epaper-btn");
  const modal = document.getElementById("epaper-modal");
  const closeBtn = document.getElementById("close-epaper");
  const loading = document.getElementById("epaper-loading");
  const carousel = document.getElementById("epaper-carousel");
  const prevBtn = document.getElementById("prev-epaper");
  const nextBtn = document.getElementById("next-epaper");
  const indicator = document.getElementById("epaper-page-indicator");
  const downloadAllBtn = document.getElementById("download-all-epaper");

  if (!generateBtn) return;

  let pages = [];
  let currentIndex = 0;

  generateBtn.addEventListener("click", async () => {
    modal.classList.remove("hidden");
    loading.style.display = "block";
    carousel.innerHTML = "";
    pages = [];
    currentIndex = 0;

    await generateEpaperPages();

    loading.style.display = "none";
    renderPage();
  });

  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      renderPage();
    }
  });

  nextBtn.addEventListener("click", () => {
    if (currentIndex < pages.length - 1) {
      currentIndex++;
      renderPage();
    }
  });

  downloadAllBtn.addEventListener("click", () => {
    pages.forEach((dataUrl, index) => {
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `epaper-page-${index + 1}.png`;
      link.click();
    });
  });

  const downloadPdfBtn = document.getElementById("download-pdf-epaper");
  const shareBtn = document.getElementById("share-epaper-btn");

if (shareBtn) {
  shareBtn.addEventListener("click", async () => {
    const shareUrl = window.location.href;
    const shareTitle = document.getElementById("title")?.innerText || "News Article";

    // Native Share (Mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareTitle,
          url: shareUrl
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      // Fallback (Desktop)
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareTitle + " " + shareUrl)}`;
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`;

      window.open(whatsappUrl, "_blank");
      window.open(twitterUrl, "_blank");
    }
  });
}

  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener("click", () => {
      downloadAsPDF(pages);
    });
  }


  function renderPage() {
    if (!pages.length) return;

    carousel.innerHTML = "";
    const img = document.createElement("img");
    img.src = pages[currentIndex];
    carousel.appendChild(img);

    indicator.textContent = `Page ${currentIndex + 1} of ${pages.length}`;
  }

  async function generateEpaperPages() {
    const title = document.getElementById("title").innerText;
    const date = document.getElementById("date").innerText;
    const category = document.getElementById("category-label").innerText;
    const reporterEl = document.querySelector(".author-name");
    const reporter = reporterEl ? reporterEl.innerText : "";
    
    const heroImg = document.getElementById("article-image");
    const heroSrc = heroImg ? heroImg.src : null;


    const contentDiv = document.getElementById("content");
    const elements = Array.from(contentDiv.children);

    const currentPage = document.createElement("div");
    currentPage.style.position = "absolute";
    currentPage.style.left = "-9999px";
    document.body.appendChild(currentPage);

    let pageWrapper = createPageWrapper(title, date, category, heroSrc, 1, reporter);


    currentPage.appendChild(pageWrapper);

    let contentWrapper = pageWrapper.querySelector(".page-content");

    pages = [];

    for (let el of elements) {
      const cloned = el.cloneNode(true);

      // Reset text styles for paper clarity (clean override)
      cloned.style.color = "#000";
      cloned.style.fontWeight = "500";
      cloned.style.opacity = "1";

      cloned.querySelectorAll("*").forEach(child => {
        child.style.color = "#000";
        child.style.fontWeight = "500";
        child.style.opacity = "1";
      });

      contentWrapper.appendChild(cloned);

      if (contentWrapper.scrollHeight > contentWrapper.clientHeight) {
        contentWrapper.removeChild(cloned);

        const canvas = await html2canvas(currentPage, {
          scale: 1.5,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff"
        });


        pages.push(canvas.toDataURL("image/png"));

        currentPage.innerHTML = "";
        pageWrapper = createPageWrapper(title, date, category, heroSrc, pages.length + 1, reporter);
        currentPage.appendChild(pageWrapper);
        contentWrapper = pageWrapper.querySelector(".page-content");

        contentWrapper.appendChild(cloned);
      }
    }

    const finalCanvas = await html2canvas(currentPage, {
      scale: 1.5,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff"
    });


    pages.push(finalCanvas.toDataURL("image/png"));

    document.body.removeChild(currentPage); 
  }


  function createPageWrapper(title, date, category, imageSrc, pageNumber, reporter) {
    const wrapper = document.createElement("div");
    wrapper.style.height = "1130px";
    wrapper.style.width = "800px";
    wrapper.style.background = "#ffffff";
    wrapper.style.padding = "35px 55px";
    wrapper.style.boxSizing = "border-box";
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    
    wrapper.style.color = "#000";

    wrapper.innerHTML = `
      <!-- Masthead -->
      <div style="
        text-align:center;
        margin-bottom:25px;
        background:#b30000;
        padding:9px 18px;
      ">
        <div style="
          font-size:45px;
          font-weight:800;
          font-family: var(--font-primary);
          color:#ffffff;
        ">
          మంజీరధార
        </div>

        <div style="
          font-size:13px;
          font-weight:700;
          margin-top:0px;
          color:#ffffff;
          opacity:0.9;

          text-transform:uppercase;
          letter-spacing:1px;
        ">
          ${date} | ${category}
        </div>
      </div>

      <!-- Red Separator Line -->
      <div style="
        height:3px;
        background:#b30000;
        margin:1px 0 20px 0;
      "></div>

      <!-- Headline -->
      <h2 style="
        font-size:30px;
        line-height:1.25;
        margin-bottom:2px;
        font-weight:800;
        text-align:left;
        font-family: var(--font-primary);
        color:#000;
      ">
        ${title}
      </h2>

      ${reporter ? `
        <div style="
          font-size:14px;
          font-weight:700;
          margin:6px 0 14px 0;
          color:#444;
          font-family: var(--font-primary);
        ">
          By ${reporter}
        </div>
      ` : ""}

      ${imageSrc ? `
        <img 
          src="${imageSrc}"
          crossorigin="anonymous"
          style="
            width:100%;
            height:280px;
            object-fit:cover;
            margin:12px 0 18px 0;
            border-radius:0px;
          "
        />
      ` : ""}


      <!-- Article Content -->
      <div 
        class="page-content" 
        style="
          flex:1;
          font-size:19px;
          line-height:1.9;
          text-align:justify;
          font-family: var(--font-primary);
          color:#000;
          font-weight:500;
        ">
      </div>

      <!-- Footer -->
      <div style="
        margin-top:25px;
        font-size:12px;
        font-weight:600;
        color:#ff2b2b;
        border-top:1px solid #ff2b2b;
        padding-top:12px;
        text-align:center;
        letter-spacing:0.5px;
      ">
        www.manjeeradhaarnews.com
        <span style="float:right;">Page ${pageNumber}</span>
      </div>
    `;
  return wrapper;
}

});

async function downloadAsPDF(pages) {
  if (!pages || pages.length === 0) return;

  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: [800, 1130]
  });

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) pdf.addPage();

    pdf.addImage(
      pages[i],
      "PNG",
      0,
      0,
      800,
      1130
    );
  }

  const titleEl = document.getElementById("title");
  const dateEl = document.getElementById("date");

  let fileTitle = titleEl ? titleEl.innerText : "epaper";
  let fileDate = dateEl ? dateEl.innerText : "";

  // Clean filename (remove special characters)
  fileTitle = fileTitle
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  fileDate = fileDate.replace(/\s+/g, "");

  const fileName = `${fileTitle}-${fileDate}.pdf`;

  pdf.save(fileName);

}

