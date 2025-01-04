const mysql = require('mysql2/promise');

const { RUN_SQL_TOOL_HOST, RUN_SQL_TOOL_USERNAME, RUN_SQL_TOOL_PASSWORD, RUN_SQL_TOOL_DEFAULT_DATABASE } = process.env;

module.exports = async function generateChartTool(socketId, data) {
    console.log('Generating chart with data:', data);

    if (!data.query) {
        console.error('No SQL query provided');
        return { error: 'Chart generation failed: No SQL query provided' };
    }

    try {
        // Create the connection
        const connection = await mysql.createConnection({
            host: RUN_SQL_TOOL_HOST,
            user: RUN_SQL_TOOL_USERNAME,
            password: RUN_SQL_TOOL_PASSWORD,
            database: RUN_SQL_TOOL_DEFAULT_DATABASE,
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

        if (rows.length === 0) {
            return { error: 'Chart generation failed: No data returned from query' };
        }

        // Prepare chart configuration
        const chartConfig = {
            id: Math.random().toString(36).substring(2, 6),
            type: 'chart',
            title: data.title || 'Chart Results',
            data: rows,
            chartOptions: {
                type: data.chartType || 'bar', // bar, line, etc.
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: data.title || 'Chart Results'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                },
                data: {
                    labels: rows.map(row => row[data.labelColumn || Object.keys(rows[0])[0]]),
                    datasets: data.datasets || [{
                        label: data.datasetLabel || 'Value',
                        data: rows.map(row => row[data.valueColumn || Object.keys(rows[0])[1]]),
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.5)'
                    }]
                }
            }
        };

        console.log('Chart configuration:', chartConfig);

        // Emit the chart configuration to the client
        global.io.to(socketId).emit('requestChartItemComplete', chartConfig);

        return { success: 'Chart configuration sent to client' };
    } catch (error) {
        console.error('Chart generation error:', {
            message: error.message,
            stack: error.stack
        });
        return { error: `Chart generation failed: ${error.message}` };
    }
};
