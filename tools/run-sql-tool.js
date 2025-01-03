const mysql = require('mysql2/promise');

const { RUN_SQL_TOOL_HOST, RUN_SQL_TOOL_USERNAME, RUN_SQL_TOOL_PASSWORD } = process.env;

module.exports = async function runSqlTool(socketId, data) {
    console.log('Running SQL tool with query:', data.query);

    if (!data.query) {
        console.error('No SQL query provided');
        return { error: 'SQL execution fail: No SQL query provided' };
    }

    try {
        // Create the connection
        const connection = await mysql.createConnection({
            host: RUN_SQL_TOOL_HOST,
            user: RUN_SQL_TOOL_USERNAME,
            password: RUN_SQL_TOOL_PASSWORD,
            ssl: {
                rejectUnauthorized: false
            }
        });

        console.log('Connected to database successfully');

        // Execute the query
        const [rows] = await connection.execute(data.query);
        console.log('Query executed successfully, rows:', rows.length);

        // Close the connection
        await connection.end();
        console.log('Database connection closed');

        // Prepare table configuration
        const tableConfig = {
            id: Math.random().toString(36).substring(2, 6),
            type: 'table',
            title: data.title || 'SQL Query Results',
            data: [],
            query: {
                sql: data.query
            }
        };

        console.log('SQL results:', {
            tableConfig
        });

        // Split data in chunks of 5 items and send "requestTableItemPartial" sequentially
        const chunkSize = 10;
        const chunks = Array.from({ length: Math.ceil(rows.length / chunkSize) }, (v, k) => rows.slice(k * chunkSize, (k + 1) * chunkSize));

        console.log('Sending', chunks.length, 'chunks');

        for (let i = 0; i < chunks.length; i++) {
            console.log(`Sending chunk ${i + 1}/${chunks.length}`);
            global.io.to(socketId).emit('requestTableItemPartial', {
                id: tableConfig.id,
                data: chunks[i]
            });
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Send "requestTableItemComplete" at the end
        console.log('Sending requestTableItemComplete');
        global.io.to(socketId).emit('requestTableItemComplete', tableConfig);


        console.log('Table configuration sent to client');

        return { success: 'SQL executed and table configuration sent to client' };
    } catch (error) {
        console.error('SQL execution error:', {
            message: error.message,
            stack: error.stack
        });
        //return { error: `SQL execution fail: ${error.message}` };
        return `SQL execution fail: ${error.message}`
    }
}
