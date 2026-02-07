// Budget Manager Application
class BudgetManager {
    constructor() {
        this.data = this.loadData();
        this.initializeEventListeners();
        this.setTodayDate();
        this.updateUI();
        this.cleanOldData();
    }

    // Load data from localStorage (simulating JSON file storage per date)
    loadData() {
        const defaultData = {
            budget: 0,
            members: [],
            lastCleanup: new Date().toISOString()
        };

        try {
            // Load base configuration (budget and members)
            const configData = localStorage.getItem('budgetConfig');
            const config = configData ? JSON.parse(configData) : defaultData;
            
            return config;
        } catch (error) {
            console.error('Error loading data:', error);
            return defaultData;
        }
    }

    // Get all transactions from all date-specific JSON files
    getAllTransactions() {
        const allTransactions = [];
        
        try {
            // Get list of all date keys
            const dateKeys = Object.keys(localStorage).filter(key => 
                key.startsWith('transactions_')
            );

            // Load transactions from each date file
            dateKeys.forEach(key => {
                const dateData = localStorage.getItem(key);
                if (dateData) {
                    const parsed = JSON.parse(dateData);
                    if (parsed.transactions && Array.isArray(parsed.transactions)) {
                        allTransactions.push(...parsed.transactions);
                    }
                }
            });

            // Sort by date (newest first)
            allTransactions.sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );
        } catch (error) {
            console.error('Error loading transactions:', error);
        }

        return allTransactions;
    }

    // Save base configuration (budget and members)
    saveConfig() {
        try {
            const config = {
                budget: this.data.budget,
                members: this.data.members,
                lastCleanup: this.data.lastCleanup
            };
            localStorage.setItem('budgetConfig', JSON.stringify(config));
        } catch (error) {
            console.error('Error saving config:', error);
            alert('Error saving configuration. Please try again.');
        }
    }

    // Save transaction to date-specific JSON file
    async saveTransactionToDateFile(transaction) {
        try {
            const dateKey = `transactions_${transaction.date}`; // e.g., transactions_2026-02-07
            
            // Save to localStorage (for backward compatibility and offline access)
            let dateData = localStorage.getItem(dateKey);
            let dateTransactions = dateData ? JSON.parse(dateData) : { date: transaction.date, transactions: [] };
            dateTransactions.transactions.push(transaction);
            localStorage.setItem(dateKey, JSON.stringify(dateTransactions, null, 2));
            
            // Also save to JSON file via API (if deployed on Netlify)
            try {
                const response = await fetch('/api/transactions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(transaction)
                });
                
                if (response.ok) {
                    console.log(`Transaction saved to ${dateKey}.json via API`);
                } else {
                    console.log('API not available, using localStorage only');
                }
            } catch (apiError) {
                // API not available (running locally), just use localStorage
                console.log('Running in local mode, using localStorage only');
            }
            
        } catch (error) {
            console.error('Error saving transaction:', error);
            alert('Error saving transaction. Please try again.');
        }
    }

    // Delete transaction from its date-specific file
    async deleteTransactionFromDateFile(transaction) {
        try {
            const dateKey = `transactions_${transaction.date}`;
            
            // Delete from localStorage
            let dateData = localStorage.getItem(dateKey);
            if (dateData) {
                let dateTransactions = JSON.parse(dateData);
                dateTransactions.transactions = dateTransactions.transactions.filter(
                    t => t.id !== transaction.id
                );

                if (dateTransactions.transactions.length === 0) {
                    localStorage.removeItem(dateKey);
                    console.log(`Deleted empty file: ${dateKey}.json`);
                } else {
                    localStorage.setItem(dateKey, JSON.stringify(dateTransactions, null, 2));
                }
            }

            // Also delete from JSON file via API (if deployed on Netlify)
            try {
                const response = await fetch('/api/transactions', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        date: transaction.date,
                        transactionId: transaction.id
                    })
                });
                
                if (response.ok) {
                    console.log(`Transaction deleted from ${dateKey}.json via API`);
                }
            } catch (apiError) {
                console.log('API not available, using localStorage only');
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
        }
    }

    // Clean data older than 35 days
    cleanOldData() {
        const thirtyFiveDaysAgo = new Date();
        thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 35);
        const cutoffDateStr = thirtyFiveDaysAgo.toISOString().split('T')[0];

        let deletedFiles = 0;
        let deletedTransactions = 0;

        try {
            // Get all transaction date keys
            const dateKeys = Object.keys(localStorage).filter(key => 
                key.startsWith('transactions_')
            );

            dateKeys.forEach(key => {
                // Extract date from key (format: transactions_YYYY-MM-DD)
                const dateStr = key.replace('transactions_', '');
                
                // Check if this date is older than 35 days
                if (dateStr < cutoffDateStr) {
                    const dateData = localStorage.getItem(key);
                    if (dateData) {
                        const parsed = JSON.parse(dateData);
                        deletedTransactions += parsed.transactions?.length || 0;
                    }
                    
                    // Delete the entire date file
                    localStorage.removeItem(key);
                    deletedFiles++;
                    console.log(`Deleted old file: ${key}.json (date: ${dateStr})`);
                }
            });

            if (deletedFiles > 0) {
                console.log(`Cleanup complete: Deleted ${deletedFiles} files containing ${deletedTransactions} transactions older than 35 days`);
                this.data.lastCleanup = new Date().toISOString();
                this.saveConfig();
                
                // Show notification to user
                this.showNotification(`Auto-cleanup: Removed ${deletedTransactions} old transactions from ${deletedFiles} days`);
            }
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }

    // Export all data as consolidated JSON
    exportToJSON() {
        const allData = {
            config: {
                budget: this.data.budget,
                members: this.data.members,
                lastCleanup: this.data.lastCleanup
            },
            transactionsByDate: {}
        };

        // Get all date files
        const dateKeys = Object.keys(localStorage).filter(key => 
            key.startsWith('transactions_')
        );

        dateKeys.forEach(key => {
            const dateStr = key.replace('transactions_', '');
            const dateData = localStorage.getItem(key);
            if (dateData) {
                allData.transactionsByDate[dateStr] = JSON.parse(dateData);
            }
        });

        return allData;
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // Settings modal
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('closeSettings').addEventListener('click', () => this.closeSettings());
        
        // Budget
        document.getElementById('setBudgetBtn').addEventListener('click', () => this.setBudget());
        
        // Members
        document.getElementById('addMemberBtn').addEventListener('click', () => this.addMember());
        
        // Transaction
        document.getElementById('transactionForm').addEventListener('submit', (e) => this.addTransaction(e));
        
        // Data management
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAllData());
        document.getElementById('exportBtn').addEventListener('click', () => this.downloadJSON());

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('settingsModal');
            if (e.target === modal) {
                this.closeSettings();
            }
        });
    }

    // Set today's date as default
    setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }

    // Open settings modal
    openSettings() {
        document.getElementById('settingsModal').classList.add('active');
        this.updateMembersSettingsList();
        this.updateStorageInfo();
        document.getElementById('budgetInput').value = this.data.budget || '';
    }

    // Close settings modal
    closeSettings() {
        document.getElementById('settingsModal').classList.remove('active');
    }

    // Set budget
    setBudget() {
        const budgetInput = document.getElementById('budgetInput');
        const budget = parseFloat(budgetInput.value);

        if (isNaN(budget) || budget < 0) {
            alert('Please enter a valid budget amount');
            return;
        }

        this.data.budget = budget;
        this.saveConfig();
        this.updateUI();
        
        this.showNotification('Budget updated successfully!');
    }

    // Add member
    addMember() {
        const memberInput = document.getElementById('memberNameInput');
        const memberName = memberInput.value.trim();

        if (!memberName) {
            alert('Please enter a member name');
            return;
        }

        if (this.data.members.some(m => m.name.toLowerCase() === memberName.toLowerCase())) {
            alert('Member already exists');
            return;
        }

        this.data.members.push({
            id: Date.now().toString(),
            name: memberName
        });

        this.saveConfig();
        this.updateMembersSettingsList();
        this.updateMemberSelect();
        memberInput.value = '';
        
        this.showNotification(`${memberName} added successfully!`);
    }

    // Delete member
    deleteMember(memberId) {
        if (!confirm('Are you sure? This will delete all transactions for this member from all dates.')) {
            return;
        }

        // Remove member from config
        this.data.members = this.data.members.filter(m => m.id !== memberId);
        
        // Remove all transactions for this member from all date files
        const dateKeys = Object.keys(localStorage).filter(key => 
            key.startsWith('transactions_')
        );

        dateKeys.forEach(key => {
            const dateData = localStorage.getItem(key);
            if (dateData) {
                let parsed = JSON.parse(dateData);
                const originalLength = parsed.transactions.length;
                parsed.transactions = parsed.transactions.filter(t => t.memberId !== memberId);
                
                if (parsed.transactions.length === 0) {
                    // Delete empty file
                    localStorage.removeItem(key);
                } else if (parsed.transactions.length !== originalLength) {
                    // Update file with remaining transactions
                    localStorage.setItem(key, JSON.stringify(parsed, null, 2));
                }
            }
        });
        
        this.saveConfig();
        this.updateMembersSettingsList();
        this.updateMemberSelect();
        this.updateUI();
        
        this.showNotification('Member deleted successfully!');
    }

    // Update members list in settings
    updateMembersSettingsList() {
        const membersList = document.getElementById('membersListSettings');
        
        if (this.data.members.length === 0) {
            membersList.innerHTML = '<p class="empty-state">No members added yet.</p>';
            return;
        }

        membersList.innerHTML = this.data.members.map(member => `
            <li class="member-item">
                <span>👤 ${member.name}</span>
                <button class="btn-delete" onclick="budgetManager.deleteMember('${member.id}')">🗑️ Delete</button>
            </li>
        `).join('');
    }

    // Get storage statistics
    getStorageStats() {
        const dateKeys = Object.keys(localStorage).filter(key => 
            key.startsWith('transactions_')
        );
        
        const allTransactions = this.getAllTransactions();
        const oldestDate = dateKeys.length > 0 ? dateKeys.sort()[0].replace('transactions_', '') : null;
        const newestDate = dateKeys.length > 0 ? dateKeys.sort().reverse()[0].replace('transactions_', '') : null;
        
        return {
            dateFilesCount: dateKeys.length,
            totalTransactions: allTransactions.length,
            oldestDate,
            newestDate
        };
    }

    // Update storage info display
    updateStorageInfo() {
        const stats = this.getStorageStats();
        const storageInfoElement = document.getElementById('storageInfo');
        
        if (storageInfoElement) {
            if (stats.dateFilesCount === 0) {
                storageInfoElement.innerHTML = `
                    <div style="font-size: 0.875rem; color: var(--gray-600); margin-top: 10px;">
                        📊 No transaction files yet
                    </div>
                `;
            } else {
                storageInfoElement.innerHTML = `
                    <div style="font-size: 0.875rem; color: var(--gray-600); margin-top: 10px;">
                        📊 <strong>${stats.dateFilesCount}</strong> date file${stats.dateFilesCount !== 1 ? 's' : ''} • 
                        <strong>${stats.totalTransactions}</strong> total transaction${stats.totalTransactions !== 1 ? 's' : ''}<br>
                        📅 Range: ${stats.oldestDate ? new Date(stats.oldestDate).toLocaleDateString('en-IN') : 'N/A'} to ${stats.newestDate ? new Date(stats.newestDate).toLocaleDateString('en-IN') : 'N/A'}
                    </div>
                `;
            }
        }
    }

    // Update member select dropdown
    updateMemberSelect() {
        const select = document.getElementById('memberSelect');
        select.innerHTML = '<option value="">Select Member</option>' + 
            this.data.members.map(member => 
                `<option value="${member.id}">${member.name}</option>`
            ).join('');
    }

    // Add transaction
    addTransaction(e) {
        e.preventDefault();

        const memberId = document.getElementById('memberSelect').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        const description = document.getElementById('description').value.trim();
        const date = document.getElementById('date').value;

        if (!memberId || !amount || !category || !description || !date) {
            alert('Please fill in all fields');
            return;
        }

        const transaction = {
            id: Date.now().toString(),
            memberId,
            amount,
            category,
            description,
            date,
            createdAt: new Date().toISOString()
        };

        // Save to date-specific JSON file
        this.saveTransactionToDateFile(transaction);
        this.updateUI();

        // Reset form
        e.target.reset();
        this.setTodayDate();
        
        this.showNotification('Transaction added successfully!');
    }

    // Delete transaction
    deleteTransaction(transactionId) {
        if (!confirm('Are you sure you want to delete this transaction?')) {
            return;
        }

        // Find the transaction to get its date
        const allTransactions = this.getAllTransactions();
        const transaction = allTransactions.find(t => t.id === transactionId);
        
        if (transaction) {
            this.deleteTransactionFromDateFile(transaction);
            this.updateUI();
            this.showNotification('Transaction deleted successfully!');
        }
    }

    // Calculate totals
    calculateTotals() {
        const allTransactions = this.getAllTransactions();
        const totalSpent = allTransactions.reduce((sum, t) => sum + t.amount, 0);
        const totalRemaining = this.data.budget - totalSpent;
        const percentage = this.data.budget > 0 ? (totalSpent / this.data.budget) * 100 : 0;

        return { totalSpent, totalRemaining, percentage };
    }

    // Get spending by member
    getSpendingByMember() {
        const allTransactions = this.getAllTransactions();
        const memberSpending = {};

        this.data.members.forEach(member => {
            memberSpending[member.id] = {
                name: member.name,
                amount: 0,
                count: 0
            };
        });

        allTransactions.forEach(transaction => {
            if (memberSpending[transaction.memberId]) {
                memberSpending[transaction.memberId].amount += transaction.amount;
                memberSpending[transaction.memberId].count++;
            }
        });

        return Object.values(memberSpending);
    }

    // Update UI
    updateUI() {
        this.updateDashboard();
        this.updateMembersOverview();
        this.updateTransactionsList();
        this.updateMemberSelect();
    }

    // Update dashboard
    updateDashboard() {
        const { totalSpent, totalRemaining, percentage } = this.calculateTotals();
        const allTransactions = this.getAllTransactions();

        document.getElementById('totalBudget').textContent = `₹${this.data.budget.toFixed(2)}`;
        document.getElementById('totalSpent').textContent = `₹${totalSpent.toFixed(2)}`;
        document.getElementById('totalRemaining').textContent = `₹${totalRemaining.toFixed(2)}`;

        // Update transaction count
        document.getElementById('spentCount').textContent = `${allTransactions.length} transaction${allTransactions.length !== 1 ? 's' : ''}`;

        // Update remaining percentage
        const remainingPercent = this.data.budget > 0 ? ((totalRemaining / this.data.budget) * 100).toFixed(0) : 0;
        document.getElementById('remainingPercent').textContent = `${remainingPercent}% available`;

        // Update progress bar
        const progressFill = document.getElementById('progressFill');
        progressFill.style.width = `${Math.min(percentage, 100)}%`;
        
        document.getElementById('progressPercentage').textContent = `${percentage.toFixed(1)}%`;
        document.getElementById('progressSpent').textContent = totalSpent.toFixed(2);
        document.getElementById('progressTotal').textContent = this.data.budget.toFixed(2);

        // Update progress status
        const statusElement = document.getElementById('progressStatus');
        if (percentage >= 90) {
            statusElement.textContent = 'Over budget';
            statusElement.style.background = 'var(--danger-50)';
            statusElement.style.color = 'var(--danger-600)';
            progressFill.style.background = 'linear-gradient(90deg, var(--danger-500), var(--danger-600))';
        } else if (percentage >= 70) {
            statusElement.textContent = 'High spending';
            statusElement.style.background = 'var(--warning-50)';
            statusElement.style.color = 'var(--warning-600)';
            progressFill.style.background = 'linear-gradient(90deg, var(--warning-500), var(--danger-500))';
        } else {
            statusElement.textContent = 'On track';
            statusElement.style.background = 'var(--success-50)';
            statusElement.style.color = 'var(--success-600)';
            progressFill.style.background = 'linear-gradient(90deg, var(--success-500), var(--warning-500))';
        }
    }

    // Update members overview
    updateMembersOverview() {
        const membersList = document.getElementById('membersList');
        const spendingByMember = this.getSpendingByMember();

        // Update member count
        document.getElementById('memberCount').textContent = `${this.data.members.length} member${this.data.members.length !== 1 ? 's' : ''}`;

        if (spendingByMember.length === 0) {
            membersList.innerHTML = `
                <div class="empty-state-modern">
                    <div class="empty-icon">
                        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                            <circle cx="40" cy="40" r="38" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/>
                            <circle cx="40" cy="30" r="12" stroke="currentColor" stroke-width="2"/>
                            <path d="M20 60C20 52 28 46 40 46C52 46 60 52 60 60" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </div>
                    <h3>No Members Yet</h3>
                    <p>Add household members in settings to start tracking their expenses</p>
                </div>
            `;
            return;
        }

        membersList.innerHTML = spendingByMember.map(member => `
            <div class="member-card">
                <h4>👤 ${member.name}</h4>
                <p class="member-amount">₹${member.amount.toFixed(2)}</p>
                <p class="member-transactions">${member.count} transaction${member.count !== 1 ? 's' : ''}</p>
            </div>
        `).join('');
    }

    // Update transactions list
    updateTransactionsList() {
        const transactionsList = document.getElementById('transactionsList');
        const allTransactions = this.getAllTransactions();

        if (allTransactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="empty-state-modern">
                    <div class="empty-icon">
                        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                            <rect x="15" y="20" width="50" height="40" rx="4" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/>
                            <line x1="25" y1="30" x2="55" y2="30" stroke="currentColor" stroke-width="2"/>
                            <line x1="25" y1="40" x2="45" y2="40" stroke="currentColor" stroke-width="2"/>
                            <line x1="25" y1="50" x2="50" y2="50" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </div>
                    <h3>No Transactions Yet</h3>
                    <p>Start adding transactions to track your household expenses</p>
                </div>
            `;
            return;
        }

        transactionsList.innerHTML = allTransactions.map(transaction => {
            const member = this.data.members.find(m => m.id === transaction.memberId);
            const memberName = member ? member.name : 'Unknown';
            const formattedDate = new Date(transaction.date).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            return `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <p class="transaction-category">${transaction.category}</p>
                        <p class="transaction-description">${transaction.description}</p>
                        <p class="transaction-member">By: ${memberName} • ${formattedDate}</p>
                    </div>
                    <div class="transaction-amount">₹${transaction.amount.toFixed(2)}</div>
                    <button class="transaction-delete" onclick="budgetManager.deleteTransaction('${transaction.id}')">🗑️</button>
                </div>
            `;
        }).join('');
    }

    // Download JSON backup
    downloadJSON() {
        const allData = this.exportToJSON();
        const dataStr = JSON.stringify(allData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `household-budget-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showNotification('Data exported successfully!');
    }

    // Clear all data
    clearAllData() {
        if (!confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
            return;
        }

        if (!confirm('This will delete all members, transactions (from all dates), and budget data. Are you absolutely sure?')) {
            return;
        }

        // Delete all transaction date files
        const dateKeys = Object.keys(localStorage).filter(key => 
            key.startsWith('transactions_')
        );
        
        dateKeys.forEach(key => {
            localStorage.removeItem(key);
        });

        // Reset config
        this.data = {
            budget: 0,
            members: [],
            lastCleanup: new Date().toISOString()
        };

        this.saveConfig();
        this.updateUI();
        this.closeSettings();
        
        this.showNotification('All data cleared!');
    }

    // Show notification
    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success-color);
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-weight: 500;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the application
let budgetManager;
document.addEventListener('DOMContentLoaded', () => {
    budgetManager = new BudgetManager();
});

// Run cleanup check every day
setInterval(() => {
    if (budgetManager) {
        budgetManager.cleanOldData();
    }
}, 24 * 60 * 60 * 1000); // 24 hours
