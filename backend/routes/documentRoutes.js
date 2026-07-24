const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../config/db");

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, "../uploads");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Configure File Filter (PDF and Images)
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Allowed file types: PDF, JPEG, JPG, PNG"), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB limit
    },
    fileFilter: fileFilter
});

// Helper to get parameters (which can be a single string or an array of strings)
const getParam = (param, idx) => {
    if (Array.isArray(param)) {
        return param[idx];
    }
    return param;
};

// POST Endpoint: Upload Documents
router.post("/upload", (req, res) => {
    // Multer upload execution
    upload.array("files", 5)(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }

        const { hf_id, care_mr_no } = req.body;
        if (!hf_id || !care_mr_no) {
            // Delete uploaded files if missing identifier
            if (req.files) {
                req.files.forEach(f => fs.unlinkSync(f.path));
            }
            return res.status(400).json({ success: false, message: "Missing hf_id or care_mr_no" });
        }

        try {
            // Query DB to see how many documents already exist for this hf_id
            const [countRows] = await db.execute(
                "SELECT COUNT(*) AS count FROM hf_patient_documents WHERE hf_id = ?",
                [hf_id]
            );
            const currentCount = countRows[0].count;
            const newFilesCount = req.files ? req.files.length : 0;

            if (currentCount + newFilesCount > 5) {
                // Delete newly uploaded files from disk
                if (req.files) {
                    req.files.forEach(f => fs.unlinkSync(f.path));
                }
                return res.status(400).json({
                    success: false,
                    message: `Upload blocked. A maximum of 5 files can be uploaded per Heart Failure form. Currently has ${currentCount} file(s).`
                });
            }

            if (newFilesCount === 0) {
                return res.status(400).json({ success: false, message: "No files uploaded" });
            }

            // Save metadata to database
            for (let i = 0; i < newFilesCount; i++) {
                const file = req.files[i];
                const docType = getParam(req.body.document_types, i) || "Other";
                const notes = getParam(req.body.notes, i) || null;
                const fileSizeKb = Math.round(file.size / 1024);

                await db.execute(
                    `INSERT INTO hf_patient_documents 
                    (hf_id, care_mr_no, document_type, notes, original_file_name, file_path, mime_type, file_size_kb) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [hf_id, care_mr_no, docType, notes, file.originalname, file.filename, file.mimetype, fileSizeKb]
                );
            }

            return res.status(200).json({ success: true, message: "Documents uploaded successfully." });
        } catch (dbError) {
            console.error("Database error saving document metadata:", dbError);
            if (req.files) {
                req.files.forEach(f => fs.unlinkSync(f.path));
            }
            return res.status(500).json({ success: false, message: "Database error saving document metadata." });
        }
    });
});

// GET Endpoint: Fetch Uploaded Documents
router.get("/:hf_id", async (req, res) => {
    try {
        const hf_id = req.params.hf_id;
        const [rows] = await db.execute(
            "SELECT * FROM hf_patient_documents WHERE hf_id = ? ORDER BY uploaded_at DESC",
            [hf_id]
        );
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error retrieving documents:", error);
        return res.status(500).json({ success: false, message: "Failed to retrieve documents." });
    }
});

// DELETE Endpoint: Remove Document
router.delete("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const [rows] = await db.execute(
            "SELECT * FROM hf_patient_documents WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Document not found." });
        }

        const document = rows[0];
        const filePath = path.join(__dirname, "../uploads", document.file_path);

        // Delete physical file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete DB record
        await db.execute(
            "DELETE FROM hf_patient_documents WHERE id = ?",
            [id]
        );

        return res.status(200).json({ success: true, message: "Document deleted successfully." });
    } catch (error) {
        console.error("Error deleting document:", error);
        return res.status(500).json({ success: false, message: "Failed to delete document." });
    }
});

module.exports = router;
