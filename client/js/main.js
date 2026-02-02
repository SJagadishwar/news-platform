// Load news list on homepage
if (document.getElementById("news-list")) {
  fetch("/api/news")
    .then(res => res.json())
    .then(data => {

      // BREAKING NEWS (CORRECT LOGIC)
      const breakingBox = document.querySelector(".breaking");
      const breakingText = document.getElementById("breaking-text");

      // find breaking article from news list
      const breakingArticle = data.find(a => a.breaking === true);

      if (breakingArticle && breakingText) {
        breakingText.innerText = breakingArticle.title;
      } else if (breakingBox) {
        // hide bar completely if no breaking news
        breakingBox.style.display = "none";
      }

      // TRENDING (Most Read)
      const trending = [...data]
        .sort((a, b) => (b.likes || 0) - (a.likes || 0))
        .slice(0, 5);

      const trendingList = document.getElementById("trending-list");

      if (trendingList) {
        trendingList.innerHTML = trending.map(article => `
          <p>
            <a href="/article.html?id=${article._id}">
              ${article.title}
            </a>
          </p>
        `).join("");
      }


      const lead = document.getElementById("lead-story");
      const list = document.getElementById("news-list");

      lead.innerHTML = "";
      list.innerHTML = "";

      if (data.length > 0) {
        const top = data[0];

        lead.innerHTML = `
        <div style="margin-bottom:60px;">
          ${top.image ? `<img src="${top.image}" style="width:100%;max-height:420px;object-fit:cover;margin-bottom:30px;">` : ""}
          <h2 style="font-size:52px;margin-bottom:18px;line-height:1.2;">
            <a href="/article.html?id=${top._id}" style="color:#fff;text-decoration:none;">
              ${top.title}
            </a>
          </h2>
          <p style="font-size:18px;color:#ccc;">
            <strong>${top.category}</strong>
            ${top.sponsored ? ' • <span style="color:#c00;font-weight:bold">Sponsored</span>' : ''}
            — ${top.summary}
          </p>

          <p style="font-size:13px;color:#999;margin-top:8px;">
            Published on ${top.date}
          </p>
          <p style="font-size:14px;color:#aaa;margin-top:10px;">
            By <strong>${top.author?.name || "Independent Reporter"}</strong>
            ${top.author?.verified ? ' • <span style="color:#4caf50">Verified</span>' : ''}
          </p>
        </div>
      `;
      }

      data.slice(1).forEach(article => {
        const div = document.createElement("div");
        div.className = "news-card";

        div.innerHTML = `
          ${article.image ? `
            <img src="${article.image}" />
          ` : ""}

          <div class="news-card-body">
            <h3>
              <a href="/article.html?id=${article._id}">
                ${article.title}
              </a>
            </h3>

            <p class="meta">
              ${article.category}
              ${article.sponsored ? ' • <span class="sponsored">Sponsored</span>' : ''}
            </p>

            <p class="summary">
              ${article.summary}
            </p>
          </div>
        `;
        list.appendChild(div);  
      });
    });
  }




// Load single article
const params = new URLSearchParams(window.location.search);
const id = params.get("id");


if (id && document.getElementById("title")) {
  fetch(`/api/news/${id}`)
    .then(res => res.json())
    .then(article => {

      // Visible content
      document.getElementById("title").innerText = article.title;
      document.getElementById("date").innerText = article.date;
      document.getElementById("content").innerText = article.content;

      
      // LIKE FEATURE (FINAL, FIXED)
      const likeBtn = document.getElementById("like-btn");
      const likeCount = document.getElementById("like-count");

      likeCount.innerText = article.likes ?? 0;

      if (likeBtn) {
      const likedKey = `liked_${article._id}`;

      // If already liked, lock UI
      if (localStorage.getItem(likedKey)) {
        likeBtn.classList.add("liked");
      }

      likeBtn.addEventListener("click", async () => {
        // ❌ Block spam
        if (localStorage.getItem(likedKey)) return;

        // ✅ Optimistic UI
        const currentLikes = Number(likeCount.innerText) || 0;
        likeCount.innerText = currentLikes + 1;

        likeBtn.classList.add("liked");
        localStorage.setItem(likedKey, "true");

        // Sync with server
        fetch(`/api/news/${article._id}/like`, {
          method: "POST"
        }).catch(() => {
          // rollback if request fails
          likeCount.innerText = currentLikes;
          localStorage.removeItem(likedKey);
          likeBtn.classList.remove("liked");
        });
      });
    }



      // SHARE LINKS
      const url = window.location.href;

      document.getElementById("wa-share").href =
        `https://wa.me/?text=${encodeURIComponent(url)}`;

      document.getElementById("fb-share").href =
        `https://www.facebook.com/sharer/sharer.php?u=${url}`;

      document.getElementById("tw-share").href =
        `https://twitter.com/intent/tweet?url=${url}`;

      // COMMENTS
      function renderComments(comments) {
        document.getElementById("comments").innerHTML =
          comments.map(c =>
            `<p><strong>${c.name}</strong>: ${c.text}</p>`
          ).join("");
      }

      renderComments(article.comments || []);

      document.getElementById("comment-btn").onclick = async () => {
        const name = document.getElementById("comment-name").value;
        const text = document.getElementById("comment-text").value;

        if (!name || !text) return;

        const res = await fetch(`/api/news/${article._id}/comment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, text })
        });

        const comments = await res.json();
        renderComments(comments);

        document.getElementById("comment-name").value = "";
        document.getElementById("comment-text").value = "";
      };

      
      if (article.video) {
        const videoId = article.video.split("v=")[1];
        document.getElementById("video-container").innerHTML = `
          <iframe
            width="100%"
            height="420"
            src="https://www.youtube.com/embed/${videoId}"
            frameborder="0"
            allowfullscreen>
          </iframe>
        `;
      }

      if (article.sponsored) {
        document.getElementById("sponsored-label").innerText = "Sponsored Content";
      }

      // Article image
      if (article.image) {
        document.getElementById("article-image").src = article.image;
      }

      // AUTHOR RENDER
      if (article.author) {
        document.getElementById("author-box").innerHTML = `
          <div class="reporter-box" style="margin-top:20px;">
            <img src="${article.author.photo}" />
            <div>
              <h4>${article.author.name}</h4>
              ${article.author.verified ? '<span class="verified">✔ Verified Reporter</span>' : ''}
            </div>
          </div>
        `;
     
        if (window.adsbygoogle) {
          window.adsbygoogle.push({});
        }
        
        // SPONSORED AD (Client)
        if (article.ads?.sponsored?.content) {
          document.getElementById("sponsored-ad-slot").innerHTML = `
            <div class="ad-inline">
              <strong style="display:block;margin-bottom:6px;color:#999;">
                Sponsored
              </strong>
              ${article.ads.sponsored.content}
            </div>
          `;
        }

        // GOOGLE AD (Network)
        if (article.ads?.google?.enabled) {
          document.getElementById("google-ad-slot").innerHTML = `
            <div class="ad-inline">
              <ins class="adsbygoogle"
                style="display:block"
                data-ad-client="ca-pub-XXXXXX"
                data-ad-slot="YYYYYY"
                data-ad-format="auto"
                data-full-width-responsive="true"></ins>
            </div>
          `;

          if (window.adsbygoogle) {
            window.adsbygoogle.push({});
          }
        }
      }

      // SEO meta
      document.title = article.title + " | Reporter News";
      document
        .querySelector('meta[name="description"]')
        .setAttribute("content", article.summary);

      // Schema.org structured data
      const schema = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": article.title,
        "datePublished": article.date,
        "articleSection": article.category,
        "author": {
          "@type": "Person",
          "name": "Independent Reporter"
        }
      };

      document.getElementById("schema").innerText =
        JSON.stringify(schema);
    });
}

window.addEventListener("scroll", () => {
  const header = document.querySelector(".brand-header");
  if (!header) return;

  if (window.scrollY > 40) {
    header.classList.add("header-shrink");
  } else {
    header.classList.remove("header-shrink");
  }
});

window.addEventListener("scroll", () => {
  const header = document.querySelector(".brand-header");
  if (!header) return;

  if (window.scrollY > 40) {
    header.classList.add("header-shrink");
  } else {
    header.classList.remove("header-shrink");
  }
});
