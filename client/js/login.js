function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        localStorage.setItem("token", data.token);
        window.location.href = "/admin.html";
      } else {
        document.getElementById("status").innerText = "Invalid login ❌";
      }
    });
}
