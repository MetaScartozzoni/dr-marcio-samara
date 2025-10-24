// src/utils/db.js
// Database utility functions for UUID handling and query helpers

/**
 * Casts a parameter to UUID type in SQL queries
 * @param {number} paramIndex - The parameter index (1-based)
 * @returns {string} - The parameter with UUID cast (e.g., "$1::uuid")
 */
function uuidParam(paramIndex) {
    return `$${paramIndex}::uuid`;
}

/**
 * Builds a WHERE clause with UUID casting for id parameter
 * @param {string} columnName - The column name (default: 'id')
 * @param {number} paramIndex - The parameter index (default: 1)
 * @returns {string} - The WHERE clause with UUID cast
 */
function whereUuid(columnName = 'id', paramIndex = 1) {
    return `WHERE ${columnName} = ${uuidParam(paramIndex)}`;
}

/**
 * Validates if a string is a valid UUID format
 * @param {string} uuid - The UUID string to validate
 * @returns {boolean} - True if valid UUID format
 */
function isValidUuid(uuid) {
    if (typeof uuid !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

/**
 * Generates a SQL query with UUID casting support
 * Replaces placeholders like {uuid:1} with $1::uuid
 * @param {string} query - The SQL query template
 * @returns {string} - The processed query
 */
function processUuidQuery(query) {
    return query.replace(/\{uuid:(\d+)\}/g, (match, index) => `$${index}::uuid`);
}

/**
 * Wraps a query execution with optional UUID parameter casting
 * @param {Object} client - The database client or pool
 * @param {string} query - The SQL query
 * @param {Array} params - Query parameters
 * @param {Object} options - Options object
 * @param {Array<number>} options.uuidParams - Array of parameter indices (1-based) that should be cast to UUID
 * @returns {Promise} - The query result
 */
async function queryWithUuid(client, query, params = [], options = {}) {
    const { uuidParams = [] } = options;
    
    // If uuidParams specified, modify the query to cast those parameters
    if (uuidParams.length > 0) {
        // Create a map of parameter indices to cast
        const castMap = new Set(uuidParams);
        
        // Replace parameter placeholders with UUID-cast versions
        let processedQuery = query;
        let paramCount = (query.match(/\$\d+/g) || []).length;
        
        for (let i = paramCount; i >= 1; i--) {
            if (castMap.has(i)) {
                const regex = new RegExp(`\\$${i}(?!::uuid)(?![0-9])`, 'g');
                processedQuery = processedQuery.replace(regex, `$${i}::uuid`);
            }
        }
        
        return client.query(processedQuery, params);
    }
    
    return client.query(query, params);
}

module.exports = {
    uuidParam,
    whereUuid,
    isValidUuid,
    processUuidQuery,
    queryWithUuid
};
