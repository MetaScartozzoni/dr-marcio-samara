// src/routes/EXAMPLE-uuid-routes.js
// Example showing how to use UUID validation middleware in routes

const express = require('express');
const router = express.Router();
const { 
    validateUuidParam, 
    validateUuidParams, 
    validateOptionalUuidParam,
    validateUuidBody 
} = require('../middleware/uuid-validation.middleware');

// Example controller (replace with actual controller)
const PacienteController = require('../controllers/paciente.controller');

// ==========================================
// EXAMPLE 1: Single UUID parameter validation
// ==========================================
// GET /api/paciente/:id
// Validates that :id is a valid UUID
router.get(
    '/paciente/:id',
    validateUuidParam('id'),  // Validates req.params.id
    async (req, res) => {
        // At this point, req.params.id is guaranteed to be a valid UUID
        // Your controller code here
        res.json({ message: 'Valid UUID received', id: req.params.id });
    }
);

// ==========================================
// EXAMPLE 2: Multiple UUID parameter validation
// ==========================================
// POST /api/transfer
// Validates multiple UUIDs in body, params, or query
router.post(
    '/transfer',
    validateUuidParams(['fromId', 'toId']),  // Validates both IDs
    async (req, res) => {
        // Both fromId and toId are valid UUIDs
        const { fromId, toId } = req.body;
        res.json({ message: 'Valid UUIDs received', fromId, toId });
    }
);

// ==========================================
// EXAMPLE 3: Optional UUID parameter
// ==========================================
// GET /api/search?ownerId=uuid
// Validates ownerId if present, but doesn't require it
router.get(
    '/search',
    validateOptionalUuidParam('ownerId'),
    async (req, res) => {
        // If ownerId exists, it's a valid UUID; if not, that's okay
        const { ownerId } = req.query;
        res.json({ 
            message: 'Search executed',
            filteredByOwner: !!ownerId,
            ownerId 
        });
    }
);

// ==========================================
// EXAMPLE 4: Validate UUID in request body
// ==========================================
// POST /api/assign
// Validates userId field in request body
router.post(
    '/assign',
    validateUuidBody('userId', true),  // true = required
    async (req, res) => {
        const { userId } = req.body;
        res.json({ message: 'User assigned', userId });
    }
);

// ==========================================
// EXAMPLE 5: Combining with other middleware
// ==========================================
const authMiddleware = (req, res, next) => {
    // Your auth logic
    next();
};

router.put(
    '/paciente/:id',
    authMiddleware,                    // First check auth
    validateUuidParam('id'),           // Then validate UUID
    validateUuidBody('updatedBy', false),  // Optional UUID in body
    async (req, res) => {
        // Both authentication passed and UUID is valid
        res.json({ message: 'Update successful' });
    }
);

// ==========================================
// EXAMPLE 6: Manual UUID validation in controller
// ==========================================
// If you need to validate UUIDs in your controller logic:
const { isValidUuid } = require('../utils/db');

router.post('/complex-operation', async (req, res) => {
    const { ids } = req.body;  // Array of UUIDs
    
    // Validate array of UUIDs
    if (!Array.isArray(ids)) {
        return res.status(400).json({ error: 'ids must be an array' });
    }
    
    const invalidIds = ids.filter(id => !isValidUuid(id));
    if (invalidIds.length > 0) {
        return res.status(400).json({ 
            error: 'Invalid UUID format',
            invalid: invalidIds 
        });
    }
    
    // All IDs are valid UUIDs
    res.json({ message: 'Operation completed', processedCount: ids.length });
});

// ==========================================
// EXAMPLE 7: Real-world usage with actual controller
// ==========================================
// This is how you would update existing routes:

// BEFORE (with integer IDs):
// router.get('/paciente/:id', pacienteController.buscarPaciente);

// AFTER (with UUID validation):
// router.get('/paciente/:id', 
//     validateUuidParam('id'), 
//     pacienteController.buscarPaciente
// );

// BEFORE (multiple IDs):
// router.post('/batch-update', batchController.update);

// AFTER (with UUID validation):
// router.post('/batch-update',
//     validateUuidParams(['userId', 'organizationId']),
//     batchController.update
// );

module.exports = router;

// ==========================================
// ERROR RESPONSES
// ==========================================
// The validation middleware returns these error formats:

// Missing parameter:
// {
//   "success": false,
//   "message": "Parameter 'id' is required",
//   "error": "MISSING_PARAMETER"
// }

// Invalid UUID format:
// {
//   "success": false,
//   "message": "Invalid UUID format for parameter 'id'",
//   "error": "INVALID_UUID_FORMAT",
//   "received": "not-a-uuid"
// }

// Multiple invalid UUIDs:
// {
//   "success": false,
//   "message": "Invalid UUID format for parameters: fromId, toId",
//   "error": "INVALID_UUID_FORMAT",
//   "invalid": [
//     { "param": "fromId", "value": "invalid1" },
//     { "param": "toId", "value": "invalid2" }
//   ]
// }
