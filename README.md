# Household Budget Manager

A modern, beautiful household budget tracking application with real-time expense monitoring and member-based spending analytics.

## Features

- 💰 Set monthly budgets and track spending
- 👥 Add household members and track individual expenses
- 📊 Real-time budget utilization visualization
- 📁 Date-based transaction storage in JSON files
- 🔄 Automatic cleanup of data older than 35 days
- 📥 Export all data as JSON backup
- 🎨 Modern, gradient-based UI with smooth animations
- 📱 Fully responsive design

## Tech Stack

- Pure HTML, CSS, and JavaScript (no frameworks)
- Netlify Functions for serverless API
- localStorage for offline data persistence
- JSON file storage for transaction history

## Local Development

1. Clone this repository
2. Install Netlify CLI (if not already installed):
   ```bash
   npm install -g netlify-cli
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run locally with Netlify Dev:
   ```bash
   netlify dev
   ```

5. Open your browser to `http://localhost:8888`

## Deployment to Netlify

### Method 1: Netlify CLI (Recommended)

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```bash
   netlify login
   ```

3. Initialize your site:
   ```bash
   netlify init
   ```

4. Deploy:
   ```bash
   netlify deploy --prod
   ```

### Method 2: Netlify Web Interface

1. Go to [Netlify](https://app.netlify.com/)
2. Click "Add new site" → "Deploy manually"
3. Drag and drop the entire project folder
4. Your site will be deployed instantly!

### Method 3: GitHub Integration

1. Push your code to a GitHub repository
2. Go to [Netlify](https://app.netlify.com/)
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub account
5. Select your repository
6. Configure build settings:
   - **Build command:** Leave empty or use `echo 'No build step'`
   - **Publish directory:** `.` (root directory)
7. Click "Deploy site"

## File Structure

```
budget-app/
├── index.html              # Main HTML file
├── script.js               # Application logic
├── styles.css              # Styling
├── netlify.toml           # Netlify configuration
├── package.json           # Project metadata
├── netlify/
│   └── functions/
│       └── transactions.js # Serverless function for JSON storage
└── README.md              # This file
```

## How It Works

### Data Storage

The app uses a **hybrid storage approach**:

1. **localStorage**: For offline access and backward compatibility
2. **JSON Files** (via Netlify Functions): Transactions are saved to date-specific JSON files
   - Format: `transactions_YYYY-MM-DD.json`
   - Each file contains all transactions for that specific date
   - Automatically managed via serverless API

### Transaction Structure

Each transaction file looks like:
```json
{
  "date": "2026-02-07",
  "transactions": [
    {
      "id": "unique-id",
      "date": "2026-02-07",
      "amount": 500,
      "category": "Groceries",
      "description": "Weekly shopping",
      "memberId": "member-id",
      "createdAt": "2026-02-07T10:30:00.000Z"
    }
  ]
}
```

### API Endpoints

When deployed on Netlify, the following API endpoint is available:

- `POST /api/transactions` - Save a new transaction
- `GET /api/transactions` - Get all transactions
- `DELETE /api/transactions` - Delete a transaction

**Note:** When running locally without Netlify Functions, the app automatically falls back to localStorage-only mode.

## Configuration

The app is configured via `netlify.toml`:

```toml
[build]
  publish = "."
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

This configuration:
- Publishes the root directory
- Sets up serverless functions
- Redirects API calls to Netlify Functions

## Features Explained

### Auto-Cleanup
- Automatically removes transaction data older than 35 days
- Runs on page load and every 24 hours
- Helps keep the app performant and storage minimal

### Export Functionality
- Download all data as a consolidated JSON backup
- Includes all transactions from all dates
- Includes configuration (budget, members)

### Member Tracking
- Add/remove household members
- Track spending per member
- View individual transaction counts

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Functions not working locally
- Make sure you're using `netlify dev` instead of opening the HTML file directly
- Check that Node.js is installed (`node --version`)

### Data not persisting after deployment
- Netlify Functions use `/tmp` storage which is ephemeral
- For production use, consider integrating a database like:
  - Netlify Blobs
  - Firebase
  - Supabase
  - FaunaDB

### localStorage quota exceeded
- The app automatically cleans old data (35+ days)
- You can manually clear data via Settings → Clear All Data
- Export your data before clearing if you want to keep records

## Future Enhancements

- [ ] Database integration for persistent storage across sessions
- [ ] User authentication
- [ ] Multiple budget periods (weekly, yearly)
- [ ] Category budgets
- [ ] Spending analytics and charts
- [ ] Receipt photo uploads
- [ ] Multi-currency support
- [ ] CSV import/export

## License

MIT License - Feel free to use this project for personal or commercial purposes.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Netlify Functions documentation: https://docs.netlify.com/functions/overview/
3. Check browser console for error messages

---

Made with ❤️ for better household budget management
