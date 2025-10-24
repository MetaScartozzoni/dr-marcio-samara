// src/middleware/uuid-validation.middleware.js
// Middleware for validating UUID parameters in routes

const { isValidUuid } = require('../utils/db');

/**
 * Middleware to validate UUID in route parameters
 * Usage: router.get('/paciente/:id', validateUuidParam('id'), controller.getPaciente)
 * 
 * @param {string} paramName - The name of the parameter to validate (default: 'id')
 * @returns {Function} Express middleware function
 */
function validateUuidParam(paramName = 'id') {
    return (req, res, next) => {
        const paramValue = req.params[paramName];
        
        if (!paramValue) {
            return res.status(400).json({
                success: false,
                message: `Parameter '${paramName}' is required`,
                error: 'MISSING_PARAMETER'
            });
        }
        
        if (!isValidUuid(paramValue)) {
            return res.status(400).json({
                success: false,
                message: `Invalid UUID format for parameter '${paramName}'`,
                error: 'INVALID_UUID_FORMAT',
                received: paramValue
            });
        }
        
        // Parameter is valid, continue
        next();
    };
}

/**
 * Middleware to validate multiple UUID parameters
 * Usage: router.post('/transfer', validateUuidParams(['fromId', 'toId']), controller.transfer)
 * 
 * @param {string[]} paramNames - Array of parameter names to validate
 * @returns {Function} Express middleware function
 */
function validateUuidParams(paramNames) {
    return (req, res, next) => {
        const invalidParams = [];
        const missingParams = [];
        
        for (const paramName of paramNames) {
            const paramValue = req.params[paramName] || req.body[paramName] || req.query[paramName];
            
            if (!paramValue) {
                missingParams.push(paramName);
            } else if (!isValidUuid(paramValue)) {
                invalidParams.push({
                    param: paramName,
                    value: paramValue
                });
            }
        }
        
        if (missingParams.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required parameters: ${missingParams.join(', ')}`,
                error: 'MISSING_PARAMETERS',
                missing: missingParams
            });
        }
        
        if (invalidParams.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid UUID format for parameters: ${invalidParams.map(p => p.param).join(', ')}`,
                error: 'INVALID_UUID_FORMAT',
                invalid: invalidParams
            });
        }
        
        // All parameters are valid, continue
        next();
    };
}

/**
 * Middleware to validate optional UUID parameter
 * If parameter exists, it must be a valid UUID
 * Usage: router.get('/search', validateOptionalUuidParam('ownerId'), controller.search)
 * 
 * @param {string} paramName - The name of the parameter to validate
 * @returns {Function} Express middleware function
 */
function validateOptionalUuidParam(paramName) {
    return (req, res, next) => {
        const paramValue = req.params[paramName] || req.body[paramName] || req.query[paramName];
        
        // If parameter doesn't exist, that's okay
        if (!paramValue) {
            return next();
        }
        
        // If it exists, it must be valid
        if (!isValidUuid(paramValue)) {
            return res.status(400).json({
                success: false,
                message: `Invalid UUID format for optional parameter '${paramName}'`,
                error: 'INVALID_UUID_FORMAT',
                received: paramValue
            });
        }
        
        // Parameter is valid, continue
        next();
    };
}

/**
 * Middleware to validate UUID in request body field
 * Usage: router.post('/create', validateUuidBody('userId'), controller.create)
 * 
 * @param {string} fieldName - The name of the body field to validate
 * @param {boolean} required - Whether the field is required (default: true)
 * @returns {Function} Express middleware function
 */
function validateUuidBody(fieldName, required = true) {
    return (req, res, next) => {
        const fieldValue = req.body[fieldName];
        
        if (!fieldValue) {
            if (required) {
                return res.status(400).json({
                    success: false,
                    message: `Field '${fieldName}' is required in request body`,
                    error: 'MISSING_FIELD'
                });
            }
            // Not required and not present, continue
            return next();
        }
        
        if (!isValidUuid(fieldValue)) {
            return res.status(400).json({
                success: false,
                message: `Invalid UUID format for field '${fieldName}'`,
                error: 'INVALID_UUID_FORMAT',
                received: fieldValue
            });
        }
        
        // Field is valid, continue
        next();
    };
}

module.exports = {
    validateUuidParam,
    validateUuidParams,
    validateOptionalUuidParam,
    validateUuidBody
};
