function publishNews() {
  const formData = new FormData();
  formData.append("title", document.getElementById("title").value);
  formData.append("summary", document.getElementById("summary").value);
  formData.append("content", document.getElementById("content").value);
  formData.append("category", document.getElementById("category").value);
  formData.append("breaking", document.getElementById("breaking").checked);
  formData.append("image", document.getElementById("image").files[0]);
  formData.append(
    "authorPhoto",
    document.getElementById("authorPhoto").files[0]
  );
  formData.append("sponsored", document.getElementById("sponsored").checked);
  formData.append("video", document.getElementById("video").value);
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





  fetch("/api/news", {
    method: "POST",
    headers: {
      "Authorization": localStorage.getItem("token")
    },
    body: formData
  })
    .then(res => res.json())
    .then(() => {
      document.getElementById("status").innerText = "News published ✅";
    });
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login.html";
}

function loadAdminNews() {
  fetch("/api/news")
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById("admin-news-list");
      list.innerHTML = "";

      data.forEach(article => {
        const div = document.createElement("div");
        div.innerHTML = `
          <p>
            <strong>${article.title}</strong>
            <button onclick="deleteNews('${article._id}')">Delete</button>
          </p>
        `;
        list.appendChild(div);
      });
    });
}

function deleteNews(id) {
  if (!confirm("Are you sure you want to delete this news?")) return;

  fetch(`/api/news/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: localStorage.getItem("token")
    }
  })

    .then(res => res.json())
    .then(() => {
      loadAdminNews();
    });
}

// Load news list when admin page opens
loadAdminNews();

function changePassword() {
  const oldPassword = document.getElementById("oldPassword").value;
  const newPassword = document.getElementById("newPassword").value;

  fetch("/api/change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": localStorage.getItem("token")
    },
    body: JSON.stringify({ oldPassword, newPassword })
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById("password-status").innerText =
        data.success ? "Password updated ✅" : data.message;
    });
}
