const express = require("express");
const router = express.Router();
const db = require("../config/db");

// PUT Endpoint: Edit Health Facility
router.put("/:id", async (req, res) => {
    const id = req.params.id;
    const { facility_code, facility_name } = req.body;

    if (!facility_code || !facility_name) {
        return res.status(400).json({
            success: false,
            message: "facility_code and facility_name are required fields."
        });
    }

    try {
        // 1. Verify record exists and is not deleted
        const [rows] = await db.execute(
            "SELECT id, facility_code, facility_name FROM hf_files WHERE id = ? AND deleted_at IS NULL",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Health Facility not found."
            });
        }

        const before = {
            facility_code: rows[0].facility_code,
            facility_name: rows[0].facility_name
        };

        // 2. Update record
        await db.execute(
            "UPDATE hf_files SET facility_code = ?, facility_name = ? WHERE id = ?",
            [facility_code, facility_name, id]
        );

        // 3. Insert audit log
        const after = { facility_code, facility_name };
        const changedFieldsJson = JSON.stringify({ before, after });
        const ipAddress = req.ip || req.connection.remoteAddress || "127.0.0.1";
        const changedBy = req.user?.id || 1; // Default to 1 as specified

        await db.execute(
            `INSERT INTO hf_files_audit (file_id, action, changed_by, changed_fields, ip_address) 
             VALUES (?, ?, ?, ?, ?)`,
            [id, "EDIT", changedBy, changedFieldsJson, ipAddress]
        );

        return res.status(200).json({
            success: true,
            message: "HF File updated successfully."
        });
    } catch (error) {
        console.error("Error editing health facility:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update Health Facility details."
        });
    }
});

module.exports = router;
