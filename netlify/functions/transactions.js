// Netlify Function to handle transaction storage
// This function saves transactions to a JSON file structure

const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const dataDir = '/tmp/budget-data'; // Netlify functions can write to /tmp
    
    // Ensure directory exists
    await fs.mkdir(dataDir, { recursive: true });

    // Handle different operations
    if (event.httpMethod === 'POST') {
      // Save transaction
      const transaction = JSON.parse(event.body);
      const dateKey = `transactions_${transaction.date}`;
      const filePath = path.join(dataDir, `${dateKey}.json`);

      let fileData = { date: transaction.date, transactions: [] };
      
      try {
        const existingData = await fs.readFile(filePath, 'utf8');
        fileData = JSON.parse(existingData);
      } catch (err) {
        // File doesn't exist yet, use default
      }

      fileData.transactions.push(transaction);
      
      await fs.writeFile(filePath, JSON.stringify(fileData, null, 2));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Transaction saved' })
      };
    }

    if (event.httpMethod === 'GET') {
      // Get all transactions
      const files = await fs.readdir(dataDir);
      const transactionFiles = files.filter(f => f.startsWith('transactions_'));
      
      const allData = {};
      
      for (const file of transactionFiles) {
        const filePath = path.join(dataDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const date = file.replace('transactions_', '').replace('.json', '');
        allData[date] = JSON.parse(content);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(allData)
      };
    }

    if (event.httpMethod === 'DELETE') {
      // Delete transaction
      const { date, transactionId } = JSON.parse(event.body);
      const dateKey = `transactions_${date}`;
      const filePath = path.join(dataDir, `${dateKey}.json`);

      try {
        const existingData = await fs.readFile(filePath, 'utf8');
        const fileData = JSON.parse(existingData);
        
        fileData.transactions = fileData.transactions.filter(
          t => t.id !== transactionId
        );

        if (fileData.transactions.length === 0) {
          await fs.unlink(filePath);
        } else {
          await fs.writeFile(filePath, JSON.stringify(fileData, null, 2));
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Transaction deleted' })
        };
      } catch (err) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Transaction file not found' })
        };
      }
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid request method' })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
