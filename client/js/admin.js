function publishNews() {
  const formData = new FormData();
  formData.append("title", document.getElementById("title").value);
  formData.append("summary", document.getElementById("summary").value);
  formData.append("content", document.getElementById("articleContent").value);
  formData.append("category", document.getElementById("category").value);
  formData.append("breaking", document.getElementById("breaking").checked);
  const images = document.getElementById("image").files;
  for (let i = 0; i < images.length; i++) {
    formData.append("images", images[i]);
  }

  formData.append(
    "authorPhoto",
    document.getElementById("authorPhoto").files[0]
  );
  formData.append("sponsored", document.getElementById("sponsored").checked);
  const videoValue = document.getElementById("video").value.trim();
  formData.append("video", videoValue === "" ? "__REMOVE__" : videoValue);

  formData.append("authorName", document.getElementById("authorName").value);
  formData.append("authorVerified", document.getElementById("authorVerified").checked);
  formData.append(
    "sponsoredAd",
    document.getElementById("sponsoredAd").value
  );
  formData.append(
    "enableGoogleAd",
    document.getElementById("enableGoogleAd").checked
  );





  const url = EDITING_ARTICLE_ID
    ? `/api/news/${EDITING_ARTICLE_ID}`
    : "/api/news";

  const method = EDITING_ARTICLE_ID ? "PUT" : "POST";

  fetch(url, {
    method,
    headers: {
      "Authorization": "Bearer " + sessionStorage.getItem("token")
    },
    body: formData
  })
    .then(res => {
      if (res.status === 401) {
        alert("Session expired. Please login again.");
        sessionStorage.removeItem("token");
        window.location.href = "/login.html";
        return Promise.reject("Unauthorized");
      }
      return res.json();
    })
    .then(() => {

      document.getElementById("status").innerText =
        EDITING_ARTICLE_ID ? "Article updated ✅" : "News published ✅";

      loadAdminNews();

      // EXIT EDIT MODE (🔥 THIS IS THE FIX)
      EDITING_ARTICLE_ID = null;
      document.getElementById("publish-btn").innerText = "Publish";


      // Show "Add Another Article" button
      document.getElementById("add-another-btn").style.display = "inline-block";
    });
}

function logout() {
  sessionStorage.removeItem("token");
  window.location.href = "/login.html";
}

let SHOW_ALL_ADMIN_NEWS = false;

let ALL_ADMIN_ARTICLES = [];

function loadAdminNews(forceRender = false) {
  fetch("/api/news?limit=1000")
    .then(res => res.json())
    .then(data => {
      ALL_ADMIN_ARTICLES = [
        ...(data.breaking || []),
        ...(data.articles || [])
      ];


      if (forceRender) {
        renderAdminArticles(ALL_ADMIN_ARTICLES);
      } else if (SHOW_ALL_ADMIN_NEWS) {
        applyCurrentFilters();
      }

    })
    .catch(err => console.error("Admin news load failed", err));
}



function applyCurrentFilters() {
  const dateVal = document.getElementById("filter-date").value;
  const categoryVal = document.getElementById("filter-category").value;

  if (!dateVal) {
    renderAdminArticles([]);
    return;
  }

  let filtered = [...ALL_ADMIN_ARTICLES];

  filtered = filtered.filter(a => a.date === dateVal);

  if (categoryVal) {
    filtered = filtered.filter(a => a.category === categoryVal);
  }

  renderAdminArticles(filtered);
}



function renderAdminArticles(articles) {
  const list = document.getElementById("admin-news-list");
  list.innerHTML = "";

  if (articles.length === 0) {
    list.innerHTML = "<p style='color:#777;'>No articles found for this date.</p>";
    return;
  }

  articles.forEach(article => {
    const card = document.createElement("div");
    card.className = "admin-article-card";

    card.innerHTML = `
      <div class="admin-article-info">
        <div class="admin-article-title">
          ${article.title}
        </div>
        <div class="admin-article-meta">
          <span>${article.category}</span>
          <span>•</span>
          <span>${article.date}</span>
        </div>
      </div>

      <div class="admin-article-actions">
        <button
          class="admin-edit-btn"
          onclick="editArticle('${article._id}')"
        >
          Edit
        </button>

        <button
          class="admin-delete-btn"
          onclick="deleteNews('${article._id}')"
        >
          Delete
        </button>
      </div>
    `;

    list.appendChild(card);
  });
}

// ================================
// DATE FILTER HANDLING
// ================================

document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById("filter-date");
  const clearBtn = document.getElementById("clear-filters");


  if (!dateInput) return;
  
  


  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      SHOW_ALL_ADMIN_NEWS = false;
      dateInput.value = "";
      document.getElementById("filter-category").value = "";
      renderAdminArticles([]); // ❌ show nothing
    });
  }



  const showAllBtn = document.getElementById("show-all-news");
  if (showAllBtn) {
    showAllBtn.addEventListener("click", () => {
      const dateVal = document.getElementById("filter-date").value;
      const categoryVal = document.getElementById("filter-category").value;

      // 🚫 Date is mandatory
      if (!dateVal) {
        renderAdminArticles([]);
        alert("Please select a date to view published news.");
        return;
      }

      SHOW_ALL_ADMIN_NEWS = true;

      let filtered = [...ALL_ADMIN_ARTICLES];

      filtered = filtered.filter(a => a.date === dateVal);


      if (categoryVal) {
        filtered = filtered.filter(a => a.category === categoryVal);
      }

      renderAdminArticles(filtered);
    });

  }
  loadAdminNews(false); // 🔥 load data, do NOT render

});


const categoryFilter = document.getElementById("filter-category");
const clearFiltersBtn = document.getElementById("clear-filters");



clearFiltersBtn.addEventListener("click", () => {
  SHOW_ALL_ADMIN_NEWS = false;
  document.getElementById("filter-date").value = "";
  categoryFilter.value = "All";
  renderAdminArticles([]);
});



function deleteNews(id) {
  if (!confirm("Are you sure you want to delete this news?")) return;

  fetch(`/api/news/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + sessionStorage.getItem("token")
    }
  })
    .then(res => {
      if (res.status === 401) {
        alert("Session expired. Please login again.");
        sessionStorage.removeItem("token");
        window.location.href = "/login.html";
        return Promise.reject("Unauthorized");
      }
      return res.json();
    })
    .then(() => {

      loadAdminNews();
      applyCurrentFilters();   // 🔥 reapply filters
    });
}




function resetPublishForm() {
  // Clear text inputs
  document.getElementById("title").value = "";
  document.getElementById("summary").value = "";
  document.getElementById("articleContent").value = "";
  document.getElementById("authorName").value = "";
  document.getElementById("video").value = "";
  document.getElementById("sponsoredAd").value = "";

  // Reset selects
  document.getElementById("category").selectedIndex = 0;

  // Reset checkboxes
  document.getElementById("breaking").checked = false;
  document.getElementById("sponsored").checked = false;
  document.getElementById("authorVerified").checked = true;
  document.getElementById("enableGoogleAd").checked = true;

  // Reset file inputs
  document.getElementById("image").value = "";
  document.getElementById("authorPhoto").value = "";

  // Reset status
  document.getElementById("status").innerText = "";

  // Hide button again
  document.getElementById("add-another-btn").style.display = "none";
}

let EDITING_ARTICLE_ID = null;

function editArticle(id) {
  const article = ALL_ADMIN_ARTICLES.find(a => a._id === id);
  if (!article) return;

  EDITING_ARTICLE_ID = id;

  document.getElementById("title").value = article.title;
  document.getElementById("summary").value = article.summary;
  document.getElementById("articleContent").value = article.content;
  document.getElementById("category").value = article.category;
  document.getElementById("authorName").value = article.authorName || "";
  document.getElementById("video").value = article.video || "";
  document.getElementById("breaking").checked = article.breaking;

  // ✅ ADD THESE TWO BLOCKS (THIS IS THE FIX)

  document.getElementById("sponsoredAd").value =
    article.ads?.sponsored?.content || "";

  document.getElementById("enableGoogleAd").checked =
    article.ads?.google?.enabled ?? true;

  // 🔁 Switch button to Update mode
  document.getElementById("publish-btn").innerText =
    "Update Article";

}

document.addEventListener("DOMContentLoaded", () => {
  const publishBtn = document.getElementById("publish-btn");

  if (publishBtn) {
    publishBtn.addEventListener("click", publishNews);
  }

  /* =========================================================
     MANUAL ARTICLE AD — FIX (SAFE LOAD)
  ========================================================= */
  const sponsoredAdTextarea = document.getElementById("sponsoredAd");

  if (sponsoredAdTextarea) {
    sponsoredAdTextarea.style.display = "block";
  }
});


/* =========================================================
   ANALYTICS DASHBOARD
========================================================= */

function loadAnalytics() {

  const token = sessionStorage.getItem("token");

  // ---------- OVERVIEW ----------
  fetch("/api/admin/analytics/overview", {
    headers: { Authorization: "Bearer " + token }
  })
    .then(res => {
      if (res.status === 401) {
        alert("Session expired. Please login again.");
        sessionStorage.removeItem("token");
        window.location.href = "/login.html";
        return Promise.reject("Unauthorized");
      }
      return res.json();
    })
    .then(data => {
      document.getElementById("total-articles").innerText = data.totalArticles || 0;
      document.getElementById("total-views").innerText = data.totalViews || 0;
      document.getElementById("total-likes").innerText = data.totalLikes || 0;
    });

  // ---------- TOP ARTICLES ----------
  fetch("/api/admin/analytics/top-articles", {
    headers: { Authorization: "Bearer " + token }
  })
    .then(res => res.json())
    .then(articles => {
      const container = document.getElementById("top-articles-list");
      container.innerHTML = "";

      articles.forEach(a => {
        const div = document.createElement("div");
        div.className = "analytics-row";
        div.innerHTML = `
          <strong>${a.title}</strong>
          <span>${a.views} views</span>
        `;
        container.appendChild(div);
      });
    });

  // ---------- CATEGORY STATS ----------
  fetch("/api/admin/analytics/categories", {
    headers: { Authorization: "Bearer " + token }
  })
    .then(res => res.json())
    .then(categories => {
      const container = document.getElementById("category-stats-list");
      container.innerHTML = "";

      categories.forEach(cat => {
        const div = document.createElement("div");
        div.className = "analytics-row";
        div.innerHTML = `
          <strong>${cat._id}</strong>
          <span>${cat.totalViews} views (${cat.totalArticles} articles)</span>
        `;
        container.appendChild(div);
      });
    });
}


// Load analytics when admin page loads
document.addEventListener("DOMContentLoaded", () => {
  if (document.body.classList.contains("admin-page")) {
    loadAnalytics();
  }
});
