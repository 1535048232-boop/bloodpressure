const express = require('express');
const { dbHelpers } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get blood pressure statistics
router.get('/bp', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = 'SELECT * FROM blood_pressure_records WHERE user_id = ?';
    let params = [req.user.id];

    if (startDate) {
      query += ' AND measurement_time >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND measurement_time <= ?';
      params.push(endDate);
    }

    const records = await dbHelpers.all(query, params);

    if (records.length === 0) {
      return res.json({
        totalRecords: 0,
        avgSystolic: 0,
        avgDiastolic: 0,
        avgHeartRate: 0,
        maxSystolic: 0,
        minSystolic: 0,
        maxDiastolic: 0,
        minDiastolic: 0,
        normalCount: 0,
        abnormalCount: 0,
        normalRate: 0
      });
    }

    const totalRecords = records.length;
    const avgSystolic = Math.round(records.reduce((s, r) => s + r.systolic, 0) / totalRecords);
    const avgDiastolic = Math.round(records.reduce((s, r) => s + r.diastolic, 0) / totalRecords);
    const hrRecords = records.filter(r => r.heart_rate);
    const avgHeartRate = hrRecords.length > 0
      ? Math.round(hrRecords.reduce((s, r) => s + r.heart_rate, 0) / hrRecords.length) : 0;

    const normalCount = records.filter(r => r.systolic < 120 && r.diastolic < 80).length;

    res.json({
      totalRecords,
      avgSystolic,
      avgDiastolic,
      avgHeartRate,
      maxSystolic: Math.max(...records.map(r => r.systolic)),
      minSystolic: Math.min(...records.map(r => r.systolic)),
      maxDiastolic: Math.max(...records.map(r => r.diastolic)),
      minDiastolic: Math.min(...records.map(r => r.diastolic)),
      normalCount,
      abnormalCount: totalRecords - normalCount,
      normalRate: Math.round((normalCount / totalRecords) * 100)
    });
  } catch (error) {
    console.error('Get BP statistics error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

module.exports = router;
