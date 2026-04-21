const express = require('express');
const { dbHelpers } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all medications for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const medications = await dbHelpers.all(
      'SELECT * FROM medications WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json({ medications });
  } catch (error) {
    console.error('Get medications error:', error);
    res.status(500).json({ error: 'Failed to get medications' });
  }
});

// Create new medication
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, dosage, frequency, instructions } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Medication name is required' });
    }

    const result = await dbHelpers.run(
      'INSERT INTO medications (user_id, name, dosage, frequency, instructions) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, name, dosage || null, frequency || null, instructions || null]
    );

    const medication = await dbHelpers.get(
      'SELECT * FROM medications WHERE id = ?',
      [result.lastID]
    );

    res.status(201).json({
      message: 'Medication created successfully',
      medication
    });
  } catch (error) {
    console.error('Create medication error:', error);
    res.status(500).json({ error: 'Failed to create medication' });
  }
});

// Update medication
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, dosage, frequency, instructions, isActive } = req.body;

    // Verify medication belongs to user
    const existingMedication = await dbHelpers.get(
      'SELECT id FROM medications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!existingMedication) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    await dbHelpers.run(
      'UPDATE medications SET name = ?, dosage = ?, frequency = ?, instructions = ?, is_active = ? WHERE id = ?',
      [
        name,
        dosage || null,
        frequency || null,
        instructions || null,
        isActive !== undefined ? (isActive ? 1 : 0) : 1,
        req.params.id
      ]
    );

    const medication = await dbHelpers.get(
      'SELECT * FROM medications WHERE id = ?',
      [req.params.id]
    );

    res.json({
      message: 'Medication updated successfully',
      medication
    });
  } catch (error) {
    console.error('Update medication error:', error);
    res.status(500).json({ error: 'Failed to update medication' });
  }
});

// Delete medication
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Also delete related medication records
    await dbHelpers.run(
      'DELETE FROM medication_records WHERE medication_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    const result = await dbHelpers.run(
      'DELETE FROM medications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    res.json({ message: 'Medication deleted successfully' });
  } catch (error) {
    console.error('Delete medication error:', error);
    res.status(500).json({ error: 'Failed to delete medication' });
  }
});

// Record medication taken
router.post('/:id/taken', authenticateToken, async (req, res) => {
  try {
    const { takenAt, notes } = req.body;

    // Verify medication belongs to user
    const medication = await dbHelpers.get(
      'SELECT id FROM medications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    const result = await dbHelpers.run(
      'INSERT INTO medication_records (medication_id, user_id, taken_at, notes) VALUES (?, ?, ?, ?)',
      [req.params.id, req.user.id, takenAt || new Date().toISOString(), notes || null]
    );

    const record = await dbHelpers.get(
      'SELECT * FROM medication_records WHERE id = ?',
      [result.lastID]
    );

    res.status(201).json({
      message: 'Medication intake recorded successfully',
      record
    });
  } catch (error) {
    console.error('Record medication error:', error);
    res.status(500).json({ error: 'Failed to record medication' });
  }
});

// Get medication history
router.get('/:id/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const records = await dbHelpers.all(
      `SELECT mr.*, m.name as medication_name
       FROM medication_records mr
       JOIN medications m ON mr.medication_id = m.id
       WHERE mr.medication_id = ? AND mr.user_id = ?
       ORDER BY mr.taken_at DESC
       LIMIT ? OFFSET ?`,
      [req.params.id, req.user.id, parseInt(limit), offset]
    );

    res.json({ records });
  } catch (error) {
    console.error('Get medication history error:', error);
    res.status(500).json({ error: 'Failed to get medication history' });
  }
});

// Get all medication intake records for user (for statistics)
router.get('/intakes/all', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = `SELECT mr.*, m.name as medication_name, m.frequency
       FROM medication_records mr
       JOIN medications m ON mr.medication_id = m.id
       WHERE mr.user_id = ?`;
    let params = [req.user.id];

    if (startDate) {
      query += ' AND mr.taken_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND mr.taken_at <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY mr.taken_at DESC LIMIT 500';

    const records = await dbHelpers.all(query, params);
    res.json({ records });
  } catch (error) {
    console.error('Get all intakes error:', error);
    res.status(500).json({ error: 'Failed to get medication intakes' });
  }
});

module.exports = router;
