const express = require('express');
const router = express.Router();
const { createContact, getContacts, deleteContact } = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const sanitizeMiddleware = require('../middleware/sanitizeMiddleware');
const { validateObjectId } = require('../middleware/validationMiddleware');

// Public create route
router.post('/', sanitizeMiddleware, createContact);

// Admin protected routes
router.get('/', protect, adminOnly, sanitizeMiddleware, getContacts);
router.delete('/:id', protect, adminOnly, validateObjectId('id'), sanitizeMiddleware, deleteContact);

module.exports = router;
