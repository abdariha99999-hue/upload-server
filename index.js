const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// ✅ Health check (مهم جداً)
app.get('/health', (req, res) => {
  res.send('OK');
});

// اختبار سريع
app.get('/test', (req, res) => {
  res.send('Server is working ✅');
});

// تسجيل مستخدم (تجريبي)
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  console.log("New user:", name, email);

  res.json({
    message: "User registered successfully ✅",
    user: { name, email }
  });
});

// إعداد رفع الملفات
const upload = multer();

// 🔐 إعداد Cloudflare R2
const s3 = new AWS.S3({
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_KEY,
  endpoint: 'https://e8cdce15046e1d87615bedb83f774670.r2.cloudflarestorage.com',
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
});

// ✅ رفع صورة
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // اسم الملف
    const fileName = `users/${Date.now()}-${file.originalname}`;

    // رفع إلى R2
    await s3.upload({
      Bucket: 'wassal-images',
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    }).promise();

    // رابط الصورة
    const imageUrl = `https://pub-5926ff8f2dca4c22b8fcade3d0fe6f73.r2.dev/${fileName}`;

    res.json({ url: imageUrl });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
