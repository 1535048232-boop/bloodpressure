const express = require('express');
const { dbHelpers } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all blood pressure records for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

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

    query += ' ORDER BY measurement_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const records = await dbHelpers.all(query, params);

    res.json({ records });
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({ error: 'Failed to get records' });
  }
});

// Create new blood pressure record
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { systolic, diastolic, heartRate, measurementTime, notes } = req.body;

    if (!systolic || !diastolic) {
      return res.status(400).json({
        error: 'Systolic and diastolic pressure are required'
      });
    }

    const result = await dbHelpers.run(
      'INSERT INTO blood_pressure_records (user_id, systolic, diastolic, heart_rate, measurement_time, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, systolic, diastolic, heartRate || null, measurementTime || new Date().toISOString(), notes || null]
    );

    const record = await dbHelpers.get(
      'SELECT * FROM blood_pressure_records WHERE id = ?',
      [result.lastID]
    );

    res.status(201).json({
      message: 'Record created successfully',
      record
    });
  } catch (error) {
    console.error('Create record error:', error);
    res.status(500).json({ error: 'Failed to create record' });
  }
});

// Update blood pressure record
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { systolic, diastolic, heartRate, measurementTime, notes } = req.body;

    // Verify record belongs to user
    const existingRecord = await dbHelpers.get(
      'SELECT id FROM blood_pressure_records WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!existingRecord) {
      return res.status(404).json({ error: 'Record not found' });
    }

    await dbHelpers.run(
      'UPDATE blood_pressure_records SET systolic = ?, diastolic = ?, heart_rate = ?, measurement_time = ?, notes = ? WHERE id = ?',
      [systolic, diastolic, heartRate || null, measurementTime, notes || null, req.params.id]
    );

    const record = await dbHelpers.get(
      'SELECT * FROM blood_pressure_records WHERE id = ?',
      [req.params.id]
    );

    res.json({
      message: 'Record updated successfully',
      record
    });
  } catch (error) {
    console.error('Update record error:', error);
    res.status(500).json({ error: 'Failed to update record' });
  }
});

// Delete blood pressure record
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await dbHelpers.run(
      'DELETE FROM blood_pressure_records WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Delete record error:', error);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

module.exports = router;