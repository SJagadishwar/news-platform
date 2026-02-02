const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;



/* -------------------- MongoDB -------------------- */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.error(err));


/* -------------------- Schemas -------------------- */
const NewsSchema = new mongoose.Schema({
  title: String,
  summary: String,
  content: String,
  category: String,
  breaking: Boolean,
  sponsored: Boolean,
  image: String,
  video: String,
  date: String,
  author: {
    name: String,
    photo: String,
    verified: Boolean
  },
  ads: {
    sponsored: {
      content: String   // client / sponsor ad
    },
    google: {
      enabled: Boolean  // true / false
    }
  },
  likes: { type: Number, default: 0 },
  comments: [
    {
      name: String,
      text: String,
      date: { type: String }
    }
  ]
});



const AdminSchema = new mongoose.Schema({
  username: String,
  password: String
});

const News = mongoose.model("News", NewsSchema);
const Admin = mongoose.model("Admin", AdminSchema);

/* -------------------- Create Default Admin -------------------- */
async function ensureAdmin() {
  const admin = await Admin.findOne({ username: "reporter" });
  if (!admin) {
    await Admin.create({ username: "reporter", password: "news123" });
    console.log("Default admin created");
  }
}
ensureAdmin();

/* -------------------- Middleware -------------------- */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../client")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

const upload = multer({
  dest: path.join(__dirname, "../uploads")
});

/* -------------------- Auth -------------------- */
function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer", "").trim();

  if (token === "secure-token") {
    return next();
  }

  return res.status(401).json({ error: "Unauthorized" });
}



/* -------------------- Login -------------------- */
app.post("/api/login", async (req, res) => {
  const username = req.body.username.trim();
  const password = req.body.password.trim();

  const admin = await Admin.findOne({ username, password });
  if (!admin) {
    return res.json({ success: false });
  }

  res.json({ success: true, token: "secure-token" });
});


/* -------------------- Change Password -------------------- */
app.post("/api/change-password", auth, async (req, res) => {
  const oldPassword = req.body.oldPassword.trim();
  const newPassword = req.body.newPassword.trim();

  const admin = await Admin.findOne({
    username: "reporter",
    password: oldPassword
  });

  if (!admin) {
    return res.json({ success: false, message: "Old password incorrect" });
  }

  admin.password = newPassword;
  await admin.save();

  res.json({ success: true });
});


/* -------------------- News APIs -------------------- */
app.get("/api/news", async (req, res) => {
  const articles = await News.find().sort({ _id: -1 });
  res.json(articles);
});

app.get("/api/news/:id", async (req, res) => {
  const article = await News.findById(req.params.id);
  res.json(article);
});

app.post(
  "/api/news",
  auth,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "authorPhoto", maxCount: 1 }
  ]),
  async (req, res) => {

  const { title, summary, content, category, breaking, sponsored } = req.body;

  const article = new News({
    title: req.body.title,
    summary: req.body.summary,
    content: req.body.content,
    category: req.body.category,
    breaking: req.body.breaking === "true",
    sponsored: req.body.sponsored === "true",
    image: req.files?.image
      ? `/uploads/${req.files.image[0].filename}`
      : null,
    video: req.body.video || null,
    date: new Date().toISOString().split("T")[0],
    author: {
      name: req.body.authorName || "Independent Reporter",
      photo: req.files?.authorPhoto
        ? `/uploads/${req.files.authorPhoto[0].filename}`
        : "/assets/reporter.jpg",
      verified: req.body.authorVerified === "true"
    },
    
    ads: {
      sponsored: req.body.sponsoredAd
        ? { content: req.body.sponsoredAd }
        : null,
      google: {
        enabled: req.body.enableGoogleAd === "true"
      }
    },    
  });



  await article.save();
  res.json(article);
});

app.post("/api/news/:id/like", async (req, res) => {
  const ip = req.ip;
  const key = `${req.params.id}_${ip}`;

  if (!global.likeTracker) global.likeTracker = {};

  if (global.likeTracker[key]) {
    return res.json({ likes: null });
  }

  global.likeTracker[key] = true;

  const article = await News.findById(req.params.id);
  article.likes += 1;
  await article.save();

  res.json({ likes: article.likes });
});



app.post("/api/news/:id/comment", async (req, res) => {
  const article = await News.findById(req.params.id);

  article.comments.push({
    name: req.body.name,
    text: req.body.text,
    date: new Date().toLocaleDateString()
  });

  await article.save();
  res.json(article.comments);
});


app.delete("/api/news/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    await News.findByIdAndDelete(id);

    res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(400).json({ error: "Invalid article ID" });
  }
});


/* -------------------- Sitemap -------------------- */
/* -------------------- Sitemap -------------------- */
app.get("/sitemap.xml", async (req, res) => {
  const articles = await News.find();
  res.setHeader("Content-Type", "application/xml");

  const urls = articles.map(a => `
    <url>
      <loc>${BASE_URL}/article.html?id=${a._id}</loc>
      <lastmod>${a.date}</lastmod>
    </url>
  `).join("");

  res.send(`<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls}
  </urlset>`);
});

/* -------------------- Start Server -------------------- */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
