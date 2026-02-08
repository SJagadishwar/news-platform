function sendOtp() {
  const email = document.getElementById("email").value.trim();
  const status = document.getElementById("status");

  if (!email) {
    status.innerText = "Please enter email ❌";
    return;
  }

  fetch("/api/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  })
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        status.innerText = data.message || "Unauthorized email ❌";
        return;
      }

      status.innerText = "OTP sent to email ✅";
      document.getElementById("otp-section").style.display = "block";
      document.getElementById("send-otp-btn").style.display = "none";
      document.getElementById("verify-otp-btn").style.display = "inline-block";
    });
}

function verifyOtp() {
  const email = document.getElementById("email").value.trim();
  const otp = document.getElementById("otp").value.trim();
  const status = document.getElementById("status");

  fetch("/api/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp })
  })
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        status.innerText = "Invalid or expired OTP ❌";
        return;
      }

      sessionStorage.setItem("token", data.token);
      window.location.href = "/admin.html";
    });
}
