/**
 * Validation middleware functions
 */

const { check, validationResult, query, header, body, param } = require('express-validator')
const path = require('path');

module.exports = {
    failIfLimitAndOffsetAreInvalid: [
        query('limit')
            .trim()
            .optional()
            .isInt({ min: 1, max: 50 })
            .withMessage('Invalid value'),
        query('offset')
            .trim()
            .optional()
            .isInt({ min: 0 })
            .withMessage('Invalid value')
    ],
    failIfSearchQueryParameterMissing: [
        query('lat').exists().withMessage('Latitude is required').isFloat().withMessage('Latitude must be a float'),
        query('long').exists().withMessage('Longitude is required').isFloat().withMessage('Longitude must be a float'),
        query('radius').exists().withMessage('Radius is required'),
        query('gender').exists().withMessage('Gender is required'),
        query('limit').exists().withMessage('Limit is required').isInt().withMessage('Limit must be an integer'),
    ],
    validate: (req, res, next) => {
        const errors = validationResult(req)
        if (errors.isEmpty()) {
            return next()
        }
        const extractedErrors = []

        errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }))
        const Response = { message: 'Bad Request', error: extractedErrors }

        /* Send Back An HTTP Response */
        res.status(400)['json'](Response)
        res.end()
    }

}