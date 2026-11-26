import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { Queue } from "bullmq";
dotenv.config();

const queue = new Queue("file-upload-queue", {
    connection: {
        host: 'localhost',
        port: '6379'
    }
})

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix} - ${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

const app = express();

app.use(cors());

const PORT = process.env.PORT;

app.post("/upload/pdf", upload.single("pdf"), (req, res) => {
    queue.add('file-ready', {
        filename: req.file.originalname,
        destination: req.file.destination,
        path: req.file.path
    })
  return res.json({
    msg: "uploaded",
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
