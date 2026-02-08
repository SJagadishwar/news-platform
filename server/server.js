const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const mongoose = require("mongoose");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { Resend } = require("resend");
const sanitizeHtml = require("sanitize-html");

let resend = null;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  console.warn("⚠️ RESEND_API_KEY not set — email disabled");
}


const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});


const fs = require("fs");

async function uploadToR2(file, folder = "images") {
  if (!file) return null;

  // ============================
  // LOCAL PREVIEW MODE
  // ============================
  if (!process.env.MONGODB_URI) {
    const uploadsDir = path.join(__dirname, "uploads");

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const safeName = file.originalname.replace(/\s+/g, "_");
    const filename = `${Date.now()}-${safeName}`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, file.buffer);

    return `/uploads/${filename}`;
  }

  // ============================
  // PRODUCTION (R2)
  // ============================
  if (!process.env.R2_BUCKET_NAME) {
    throw new Error("R2 not configured properly");
  }

  const safeName = file.originalname.replace(/\s+/g, "_");
  const key = `${folder}/${Date.now()}-${safeName}`;

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      })
    );
  } catch (err) {
    console.error("❌ R2 upload failed:", err);
    throw new Error("Image upload failed");
  }

  return `${process.env.R2_PUBLIC_URL}/${key}`;
}





const app = express();
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
// -------------------- ADMIN EMAIL (CHANGE LATER) --------------------
const ALLOWED_ADMIN_EMAIL = "jagadhii.09.09.1999@gmail.com".toLowerCase().trim();

// -------------------- CONTACT EMAIL RECEIVER --------------------
const CONTACT_RECEIVER_EMAIL = "jagadhii.09.09.1999@gmail.com";



/* -------------------- MongoDB -------------------- */
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connected ✅"))
    .catch(err => console.error(err));
} else {
  console.log("MongoDB skipped (local preview mode)");
}



/* -------------------- Schemas -------------------- */
const NewsSchema = new mongoose.Schema(
  {
    title: String,
    summary: String,
    content: String,
    category: String,
    breaking: Boolean,
    sponsored: Boolean,
    image: String,
    images: [String],
    video: String,
    date: String,
    author: {
      name: String,
      photo: String,
      verified: Boolean
    },
    ads: {
      sponsored: {
        content: String
      },
      google: {
        enabled: Boolean
      }
    },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: [
      {
        name: String,
        text: String,
        date: { type: String }
      }
    ]
  },
  {
    timestamps: true   // 🔥 THIS LINE FIXES IT
  }
);



const News = mongoose.model("News", NewsSchema);


// -------------------- PREVIEW STORAGE (PERSISTENT) --------------------
const PREVIEW_FILE = path.join(__dirname, "preview.json");

if (!process.env.MONGODB_URI) {
  if (fs.existsSync(PREVIEW_FILE)) {
    try {
      global.PUBLISHED_NEWS = JSON.parse(
        fs.readFileSync(PREVIEW_FILE, "utf-8")
      );
    } catch (e) {
      global.PUBLISHED_NEWS = [];
    }
  } else {
    global.PUBLISHED_NEWS = [];
  }
}



// -------------------- OTP STORE (IN-MEMORY) --------------------
const otpStore = {};


/* -------------------- Middleware -------------------- */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));




app.use(express.static(path.join(__dirname, "../client")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


/* -------------------- Auth -------------------- */
function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer", "").trim();

  if (token === "secure-token") {
    return next();
  }

  return res.status(401).json({ error: "Unauthorized" });
}


/* -------------------- News APIs -------------------- */
app.get("/api/news", async (req, res) => {
  try {
    const { page = 1, limit = 10, category, type } = req.query;

    // ===============================
    // LOCAL PREVIEW MODE (NO MONGODB)
    // ===============================
    if (!process.env.MONGODB_URI) {
      let data = [...global.PUBLISHED_NEWS];

      // Homepage → last 7 days
      if (type === "homepage") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        data = data.filter(a => {
          const articleDate = new Date(a.date);
          return articleDate >= sevenDaysAgo;
        });
      }

      // Category filter
      if (category) {
        data = data.filter(a => a.category === category);
      }

      const total = data.length;
      const start = (page - 1) * limit;
      const end = start + Number(limit);

      return res.json({
        articles: data.slice(start, end),
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      });
    }

    // ===============================
    // PRODUCTION MODE (MONGODB)
    // ===============================
    const query = {};

    if (type === "homepage") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query.createdAt = { $gte: sevenDaysAgo };
    }

    if (category) {
      query.category = category;
    }

    const news = await News.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await News.countDocuments(query);

    res.json({
      articles: news,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});



/* -------------------- Send OTP -------------------- */
app.post("/api/send-otp", async (req, res) => {
  const email = (req.body.email || "").toLowerCase().trim();


  // ❌ Reject any email except allowed one
  if (email !== ALLOWED_ADMIN_EMAIL) {
    return res.json({
      success: false,
      message: "Unauthorized email"
    });
  }
  
  if (!resend) {
    console.log("📭 OTP skipped (email disabled)");
    return res.json({ success: true });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store OTP with expiry (5 minutes)
  otpStore[email] = {
    otp,
    expires: Date.now() + 5 * 60 * 1000
  };

  await resend.emails.send({
    from: "Sangareddy News <onboarding@resend.dev>",
    to: email,
    subject: "Your Admin Login OTP",
    html: `
      <div style="font-family:Arial;line-height:1.6">
        <h2>Admin Login Verification</h2>
        <p>Your One-Time Password (OTP) is:</p>
        <h1 style="letter-spacing:3px">${otp}</h1>
        <p>This OTP is valid for 5 minutes.</p>
        <p>If you did not request this login, ignore this email.</p>
      </div>
    `
  });

  res.json({ success: true });
});

/* -------------------- Verify OTP -------------------- */
app.post("/api/verify-otp", (req, res) => {
  const email = (req.body.email || "").toLowerCase().trim();
  const otp = (req.body.otp || "").trim();

  const record = otpStore[email];


  if (!record) {
    return res.json({ success: false });
  }

  // OTP expired
  if (record.expires < Date.now()) {
    delete otpStore[email];
    return res.json({ success: false });
  }

  // OTP mismatch
  if (record.otp !== otp) {
    return res.json({ success: false });
  }

  // OTP verified — delete it
  delete otpStore[email];

  res.json({
    success: true,
    token: "secure-token"
  });
});





app.get("/api/news/:id", async (req, res) => {

  // PREVIEW MODE
  if (!process.env.MONGODB_URI) {
    const article = global.PUBLISHED_NEWS.find(
      a => a._id === req.params.id
    );
    return res.json(article || null);
  }

  // PRODUCTION MODE
  const article = await News.findById(req.params.id);
  res.json(article);
});

/* ================================
   TIME TRAVELER / ARCHIVE API
================================ */

app.get("/api/archive", async (req, res) => {
  const { date, category } = req.query;

  if (!date) {
    return res.json({ articles: [] });
  }

  // ===============================
  // LOCAL PREVIEW MODE
  // ===============================
  if (!process.env.MONGODB_URI) {
    let data = [...global.PUBLISHED_NEWS];

    data = data.filter(a => a.date === date);

    if (category) {
      data = data.filter(a => a.category === category);
    }

    return res.json({ articles: data });
  }

  // ===============================
  // PRODUCTION MODE (MongoDB)
  // ===============================
  const query = { date };

  if (category) {
    query.category = category;
  }

  const articles = await News.find(query).sort({ createdAt: -1 });

  res.json({ articles });
});






app.post(
  "/api/news",
  auth,
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "authorPhoto", maxCount: 1 }
  ]),

  async (req, res) => {

    const today = new Date().toISOString().split("T")[0];

    // ---------- HANDLE IMAGES ----------
    const imageFiles = req.files?.images || [];
    const imageUrls = [];

    for (const img of imageFiles) {
      const url = await uploadToR2(img, "news");
      imageUrls.push(url);
    }

    const mainImage = imageUrls[0] || null;

    // ---------- AUTHOR PHOTO ----------
    let authorPhotoUrl = null;
    if (req.files?.authorPhoto?.[0]) {
      authorPhotoUrl = await uploadToR2(
        req.files.authorPhoto[0],
        "authors"
      );
    }

    const article = {
      title: req.body.title,
      summary: req.body.summary,
      content: req.body.content,
      category: req.body.category,
      breaking: req.body.breaking === "true",
      sponsored: req.body.sponsored === "true",

      image: mainImage,          // 👈 used everywhere
      images: imageUrls,         // 👈 slideshow array

      video: req.body.video || null,
      date: today,

      author: {
        name: req.body.authorName,
        photo: authorPhotoUrl,
        verified: req.body.authorVerified === "true"
      },

      ads: {
        sponsored: {
          content: sanitizeHtml(req.body.sponsoredAd || "", {
            allowedTags: ["a", "img", "div", "span", "strong"],
            selfClosing: ["img"],

            allowedAttributes: {
              a: ["href", "target", "rel"],
              img: ["src", "alt", "style"],
              div: ["style"],
              span: ["style"]
            },

            allowedSchemesByTag: {
              img: ["http", "https", "data"],
              a: ["http", "https"]
            }
          })
        },
        google: {
          enabled: req.body.enableGoogleAd === "true"
        }
      },

      views: 0,
      likes: 0,
      comments: []
    };

    // ===============================
    // LOCAL PREVIEW MODE
    // ===============================
    if (!process.env.MONGODB_URI) {
      global.PUBLISHED_NEWS.unshift(article); // 🔥 THIS WAS MISSING

      fs.writeFileSync(
        PREVIEW_FILE,
        JSON.stringify(global.PUBLISHED_NEWS, null, 2)
      );

      return res.json({ success: true });
    }

    // ===============================
    // PRODUCTION MODE
    // ===============================
    const saved = await News.create(article);
    res.json(saved);
  }
);  
  
app.put(
  "/api/news/:id",
  auth,
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "authorPhoto", maxCount: 1 }
  ]),
  async (req, res) => {

    const id = req.params.id;

    // ===============================
    // PREVIEW MODE
    // ===============================
    if (!process.env.MONGODB_URI) {
      const index = global.PUBLISHED_NEWS.findIndex(a => a._id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Article not found" });
      }

      const article = global.PUBLISHED_NEWS[index];

      // 🔥 HANDLE VIDEO REMOVAL
      if (req.body.video === "__REMOVE__") {
        delete article.video;
      } else if (req.body.video) {
        article.video = req.body.video;
      }

      // 🔥 UPDATE OTHER FIELDS
      article.title = req.body.title;
      article.summary = req.body.summary;
      article.content = req.body.content;
      article.category = req.body.category;
      article.breaking = req.body.breaking === "true";
      article.sponsored = req.body.sponsored === "true";

      article.author.name = req.body.authorName;
      article.author.verified = req.body.authorVerified === "true";

      article.ads.sponsored.content = sanitizeHtml(req.body.sponsoredAd || "", {
        allowedTags: ["a", "img", "div", "span", "strong"],
        selfClosing: ["img"],

        allowedAttributes: {
          a: ["href", "target", "rel"],
          img: ["src", "alt", "style"],
          div: ["style"],
          span: ["style"]
        },

        allowedSchemesByTag: {
          img: ["http", "https", "data"],
          a: ["http", "https"]
        }
      })


      article.ads.google.enabled = req.body.enableGoogleAd === "true";

      article.updatedAt = new Date().toISOString();

      fs.writeFileSync(
        PREVIEW_FILE,
        JSON.stringify(global.PUBLISHED_NEWS, null, 2)
      );

      return res.json({ success: true });
    }

    // ===============================
    // PRODUCTION MODE (MongoDB)
    // ===============================
    const update = {
      title: req.body.title,
      summary: req.body.summary,
      content: req.body.content,
      category: req.body.category,
      breaking: req.body.breaking === "true",
      sponsored: req.body.sponsored === "true",
      "author.name": req.body.authorName,
      "author.verified": req.body.authorVerified === "true",
      "ads.sponsored.content": req.body.sponsoredAd || "",
      "ads.google.enabled": req.body.enableGoogleAd === "true",
      updatedAt: new Date()
    };

    if (req.body.video === "__REMOVE__") {
      update.video = undefined;
    } else if (req.body.video) {
      update.video = req.body.video;
    }

    await News.findByIdAndUpdate(id, update);
    res.json({ success: true });
  }
);


app.post("/api/news/:id/like", async (req, res) => {
  const id = req.params.id;

  // ===============================
  // LOCAL PREVIEW MODE (NO MONGODB)
  // ===============================
  if (!process.env.MONGODB_URI) {
    const article = global.PUBLISHED_NEWS.find(a => a._id === id);

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    article.likes = (article.likes || 0) + 1;

    // 🔥 Persist likes to preview.json
    fs.writeFileSync(
      PREVIEW_FILE,
      JSON.stringify(global.PUBLISHED_NEWS, null, 2)
    );

    return res.json({ likes: article.likes });
  }

  // ===============================
  // PRODUCTION MODE (MongoDB)
  // ===============================
  const article = await News.findById(id);

  if (!article) {
    return res.status(404).json({ error: "Article not found" });
  }

  article.likes += 1;
  await article.save();

  res.json({ likes: article.likes });
});


/* -------- INCREMENT ARTICLE VIEWS -------- */
app.post("/api/news/:id/view", async (req, res) => {

  // Preview / dummy mode
  if (!process.env.MONGODB_URI) {
    const article = global.PUBLISHED_NEWS.find(
      a => a._id === req.params.id
    );

    if (article) {
      article.views = (article.views || 0) + 1;
    }

    return res.json({ success: true });
  }


  // MongoDB mode
  const article = await News.findById(req.params.id);
  if (!article) return res.status(404).json({ error: "Not found" });

  article.views += 1;
  await article.save();

  res.json({ views: article.views });
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
  const { id } = req.params;

  // ===============================
  // PREVIEW MODE (NO MONGODB)
  // ===============================
  if (!process.env.MONGODB_URI) {
    global.PUBLISHED_NEWS = global.PUBLISHED_NEWS.filter(
      article => article._id !== id
    );

    fs.writeFileSync(
      PREVIEW_FILE,
      JSON.stringify(global.PUBLISHED_NEWS, null, 2)
    );

    return res.json({ success: true });
  }

  // ===============================
  // PRODUCTION MODE (MONGODB)
  // ===============================
  await News.findByIdAndDelete(id);
  res.json({ success: true });
});

// ===============================
// CONTACT FORM API
// ===============================

app.post("/api/contact", async (req, res) => {
  
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false });
  }

  try {
    await transporter.sendMail({
      from: `"Sangareddy News Contact" <${CONTACT_RECEIVER_EMAIL}>`,
      to: CONTACT_RECEIVER_EMAIL,
      subject: "New Contact Message – Sangareddy News",
      html: `
        <h3>New Contact Message</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Contact form error:", err);
    res.status(500).json({ success: false });
  }
});


/* -------------------- Sitemap -------------------- */
app.get("/sitemap.xml", async (req, res) => {

  // ✅ ADD THIS LINE (FIRST LINE INSIDE ROUTE)
  res.setHeader("Cache-Control", "public, max-age=3600");

  const articles = process.env.MONGODB_URI ? await News.find() : [];
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
