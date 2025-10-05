// Energy Bill Manager Application with Admin System
class EnergyBillManager {
    constructor() {
        this.currentUser = null;
        this.charts = {};
        this.editingBill = null;
        this.editingUser = null;
        this.deleteCallback = null;
        this.jsonEditor = null;
        this.selectedUsers = new Set();
        
        this.init();
    }

    init() {
        this.initializeData();
        this.bindEvents();
        this.checkAuthentication();
        this.initializeTheme();
    }

    // Data Management - Updated with status field
    initializeData() {
        // Initialize sample data if not exists
        if (!localStorage.getItem('ebm_users')) {
            const sampleUsers = [
                {
                    id: "user-1",
                    username: "john_doe",
                    email: "john@example.com",
                    password: "password123", // In real app, this would be hashed
                    role: "user",
                    status: "approved",
                    createdAt: "2024-01-15T10:00:00Z",
                    lastLogin: "2024-10-02T18:30:00Z",
                    approvedBy: "user-2",
                    approvedAt: "2024-01-15T11:00:00Z"
                },
                {
                    id: "user-2",
                    username: "admin_user",
                    email: "admin@example.com",
                    password: "admin123",
                    role: "admin",
                    status: "approved",
                    createdAt: "2024-01-01T09:00:00Z",
                    lastLogin: "2024-10-02T19:00:00Z",
                    approvedBy: "user-2",
                    approvedAt: "2024-01-01T09:00:00Z"
                },
                {
                    id: "user-3",
                    username: "maria_silva",
                    email: "maria@example.com",
                    password: "password123",
                    role: "user",
                    status: "pending",
                    createdAt: "2024-10-01T14:00:00Z",
                    lastLogin: null
                },
                {
                    id: "user-4",
                    username: "carlos_santos",
                    email: "carlos@example.com",
                    password: "password123",
                    role: "user",
                    status: "rejected",
                    createdAt: "2024-09-28T10:00:00Z",
                    lastLogin: null,
                    rejectedBy: "user-2",
                    rejectedAt: "2024-09-28T15:00:00Z",
                    rejectionReason: "Invalid email domain"
                }
            ];
            localStorage.setItem('ebm_users', JSON.stringify(sampleUsers));
        }

        if (!localStorage.getItem('ebm_bills')) {
            const sampleBills = [
                {
                    id: "bill-1",
                    userId: "user-1",
                    provider: "Electric Company A",
                    accountNumber: "ACC-123456789",
                    meterNumber: "MTR-987654321",
                    billingPeriodStart: "2024-08-01",
                    billingPeriodEnd: "2024-08-31",
                    previousReading: 1000,
                    currentReading: 1347,
                    usage: 347,
                    ratePerKwh: 0.16288,
                    baseCharge: 12.50,
                    totalAmount: 68.27,
                    dueDate: "2024-09-15",
                    paymentStatus: "paid",
                    paymentDate: "2024-09-10",
                    additionalCharges: {
                        taxes: {
                            stateTax: 4.25,
                            federalTax: 2.10,
                            cityTax: 1.15
                        },
                        fees: [
                            {
                                name: "Environmental Fee",
                                amount: 1.52,
                                mandatory: true
                            },
                            {
                                name: "Grid Maintenance Fee",
                                amount: 0.75,
                                mandatory: true
                            }
                        ],
                        adjustments: {
                            discount: -2.00,
                            lateFee: 0,
                            credits: ["efficiency_bonus"]
                        }
                    },
                    notes: "Higher usage due to summer heat wave",
                    createdAt: "2024-09-01T10:00:00Z",
                    updatedAt: "2024-09-10T14:30:00Z"
                },
                {
                    id: "bill-2",
                    userId: "user-1",
                    provider: "Electric Company A",
                    accountNumber: "ACC-123456789",
                    meterNumber: "MTR-987654321",
                    billingPeriodStart: "2024-07-01",
                    billingPeriodEnd: "2024-07-31",
                    previousReading: 720,
                    currentReading: 1000,
                    usage: 280,
                    ratePerKwh: 0.15950,
                    baseCharge: 12.50,
                    totalAmount: 59.16,
                    dueDate: "2024-08-15",
                    paymentStatus: "paid",
                    paymentDate: "2024-08-12",
                    additionalCharges: {
                        taxes: {
                            stateTax: 3.42,
                            federalTax: 1.68
                        },
                        fees: [
                            {
                                name: "Environmental Fee",
                                amount: 1.24,
                                mandatory: true
                            }
                        ],
                        adjustments: {
                            discount: 0,
                            lateFee: 0,
                            credits: []
                        }
                    },
                    notes: "Normal summer usage",
                    createdAt: "2024-08-01T10:00:00Z",
                    updatedAt: "2024-08-12T16:45:00Z"
                }
            ];
            localStorage.setItem('ebm_bills', JSON.stringify(sampleBills));
        }
    }

    // Authentication - Updated with status checking
    checkAuthentication() {
        const token = localStorage.getItem('ebm_token');
        if (token) {
            try {
                const userData = JSON.parse(atob(token.split('.')[1]));
                if (userData.exp > Date.now()) {
                    this.currentUser = userData;
                    this.showMainApp();
                    return;
                }
            } catch (error) {
                localStorage.removeItem('ebm_token');
            }
        }
        this.showAuthPage();
    }

    async login_test(email, password) {
        const response = await fetch(
            "http://localhost:8000/users/login", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ email, password })
            }
        );

        if (!response.ok) {
            const err = await response.json();
            alert(err.detail || "Login failed");
            throw new Error(err.detail);
        }

        const data = await response.json();
        
        // Save JWT token (e.g. localStorage)
        localStorage.setItem("ebm_token", data.access_token);
        this.currentUser = data.user;

        // Save user info if needed
        localStorage.setItem("user", JSON.stringify(data.user));
        this.showToast('Login successful!', 'success');
        
        console.log('3')
        // Clear login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.reset();
        }
        
        console.log('1')
        // Show main app after successful login with slight delay to ensure DOM is ready
        setTimeout(() => {
            this.showMainApp();
        }, 100);
        
        console.log('2')
        return true;
    }

    login(email, password) {
        const users = JSON.parse(localStorage.getItem('ebm_users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            this.showToast('Invalid email or password', 'error');
            return false;
        }

        // Check user status
        if (user.status === 'pending') {
            this.showToast('Your account is pending admin approval', 'warning');
            return false;
        }

        if (user.status === 'rejected') {
            this.showToast('Your account has been rejected. Contact administrator.', 'error');
            return false;
        }

        if (user.status !== 'approved') {
            this.showToast('Your account status is invalid. Contact administrator.', 'error');
            return false;
        }

        // Update last login
        user.lastLogin = new Date().toISOString();
        localStorage.setItem('ebm_users', JSON.stringify(users));
        
        // Create simple JWT-like token
        const tokenData = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status,
            exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };
        const token = 'header.' + btoa(JSON.stringify(tokenData)) + '.signature';
        localStorage.setItem('ebm_token', token);
        
        this.currentUser = tokenData;
        this.showToast('Login successful!', 'success');
        
        // Clear login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.reset();
        }
        
        // Show main app after successful login with slight delay to ensure DOM is ready
        setTimeout(() => {
            this.showMainApp();
        }, 100);
        
        return true;
    }

    register(username, email, password) {
        const users = JSON.parse(localStorage.getItem('ebm_users') || '[]');
        
        if (users.find(u => u.email === email)) {
            this.showToast('Email already exists', 'error');
            return false;
        }
        
        if (users.find(u => u.username === username)) {
            this.showToast('Username already exists', 'error');
            return false;
        }
        
        const newUser = {
            id: 'user-' + Date.now(),
            username,
            email,
            password,
            role: 'user',
            status: 'pending', // All new users start as pending
            createdAt: new Date().toISOString(),
            lastLogin: null
        };
        
        users.push(newUser);
        localStorage.setItem('ebm_users', JSON.stringify(users));
        
        this.showToast('Registration successful! Your account is pending admin approval. You will be notified once approved.', 'success');
        return true;
    }

    // Logout function
    logout() {
        localStorage.removeItem('ebm_token');
        this.currentUser = null;
        this.selectedUsers.clear();
        
        // Clear any modals that might be open
        this.closeBillModal();
        this.closeUserEditModal();
        this.closeRejectModal();
        
        // Destroy charts to prevent memory leaks
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
        
        // Reset JSON editor
        this.jsonEditor = null;
        
        // Show authentication page and hide main app
        this.showAuthPage();
        
        // Show logout success message
        this.showToast('Logged out successfully', 'info');
        
        // Reset form fields to prevent data persistence
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.reset();
        }
    }

    // UI Management - FIXED with better error handling and debugging
    showAuthPage() {
        const authContainer = document.getElementById('auth-container');
        const appContainer = document.getElementById('app-container');
        
        if (authContainer && appContainer) {
            // Force show auth container and hide app container
            authContainer.classList.remove('hidden');
            authContainer.style.display = 'flex'; // Ensure it's visible
            appContainer.classList.add('hidden');
            appContainer.style.display = 'none'; // Ensure it's hidden
            
            // Ensure login page is shown (not register page)
            const loginPage = document.getElementById('login-page');
            const registerPage = document.getElementById('register-page');
            if (loginPage && registerPage) {
                loginPage.classList.remove('hidden');
                registerPage.classList.add('hidden');
            }
            
            console.log('Auth page shown successfully');
        } else {
            console.error('Could not find auth or app containers');
        }
    }

    showMainApp() {
        const authContainer = document.getElementById('auth-container');
        const appContainer = document.getElementById('app-container');
        
        console.log('showMainApp called', {
            authContainer: !!authContainer,
            appContainer: !!appContainer,
            currentUser: !!this.currentUser
        });
        
        if (authContainer && appContainer && this.currentUser) {
            // Force hide auth and show main app
            authContainer.classList.add('hidden');
            authContainer.style.display = 'none'; // Ensure it's hidden
            appContainer.classList.remove('hidden');
            appContainer.style.display = 'grid'; // Restore grid layout
            
            // Update user info
            const userNameEl = document.getElementById('user-name');
            if (userNameEl) {
                userNameEl.textContent = this.currentUser.username;
            }
            
            // Show/hide admin elements
            const adminElements = document.querySelectorAll('.admin-only');
            adminElements.forEach(el => {
                if (this.currentUser.role === 'admin') {
                    el.classList.remove('hidden');
                } else {
                    el.classList.add('hidden');
                }
            });
            
            // Update pending badge for admin
            if (this.currentUser.role === 'admin') {
                this.updatePendingBadge();
            }
            
            // Close user menu if open
            const userMenu = document.getElementById('user-menu');
            if (userMenu) {
                userMenu.classList.add('hidden');
            }
            
            console.log('Main app shown successfully');
            
            // Load dashboard by default with delay to ensure DOM is ready
            setTimeout(() => {
                this.showDashboard();
            }, 200);
        } else {
            console.error('Could not show main app:', {
                authContainer: !!authContainer,
                appContainer: !!appContainer,
                currentUser: !!this.currentUser
            });
        }
    }

    updatePendingBadge() {
        const users = JSON.parse(localStorage.getItem('ebm_users') || '[]');
        const pendingCount = users.filter(u => u.status === 'pending').length;
        const badge = document.getElementById('pending-badge');
        
        if (badge) {
            if (pendingCount > 0) {
                badge.textContent = pendingCount;
                badge.classList.remove('hidden');
                badge.classList.add('pulse');
            } else {
                badge.classList.add('hidden');
                badge.classList.remove('pulse');
            }
        }
    }

    showView(viewId) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.add('hidden');
        });
        
        // Show selected view
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.remove('hidden');
        }
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
    }

    // Dashboard - Updated with admin stats
    showDashboard() {
        this.showView('dashboard-view');
        const dashboardNav = document.querySelector('#nav-dashboard');
        if (dashboardNav) {
            dashboardNav.classList.add('active');
        }
        
        this.loadDashboardData();
        
        if (this.currentUser && this.currentUser.role === 'admin') {
            this.loadAdminStats();
        }
        
        setTimeout(() => {
            this.initializeCharts();
        }, 200);
    }

    loadDashboardData() {
        const bills = this.getUserBills();
        const period = document.getElementById('dashboard-period')?.value || 'all';
        const filteredBills = this.filterBillsByPeriod(bills, period);
        
        // Calculate stats
        const totalConsumption = filteredBills.reduce((sum, bill) => sum + bill.usage, 0);
        const totalCost = filteredBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
        const averageCost = totalConsumption > 0 ? totalCost / totalConsumption : 0;
        const outstanding = filteredBills
            .filter(bill => bill.paymentStatus !== 'paid')
            .reduce((sum, bill) => sum + bill.totalAmount, 0);
        
        // Update stat cards
        const totalConsumptionEl = document.getElementById('total-consumption');
        const averageCostEl = document.getElementById('average-cost');
        const totalBillsEl = document.getElementById('total-bills');
        const outstandingBalanceEl = document.getElementById('outstanding-balance');
        
        if (totalConsumptionEl) totalConsumptionEl.textContent = totalConsumption.toLocaleString();
        if (averageCostEl) averageCostEl.textContent = '$' + averageCost.toFixed(4);
        if (totalBillsEl) totalBillsEl.textContent = filteredBills.length.toString();
        if (outstandingBalanceEl) outstandingBalanceEl.textContent = '$' + outstanding.toFixed(2);
    }

    loadAdminStats() {
        const users = JSON.parse(localStorage.getItem('ebm_users') || '[]');
        
        const pendingUsers = users.filter(u => u.status === 'pending').length;
        const totalUsers = users.length;
        const approvedUsers = users.filter(u => u.status === 'approved').length;
        const rejectedUsers = users.filter(u => u.status === 'rejected').length;
        
        // Update admin stat cards
        const pendingUsersEl = document.getElementById('pending-users');
        const totalUsersEl = document.getElementById('total-users');
        const approvedUsersEl = document.getElementById('approved-users');
        const rejectedUsersEl = document.getElementById('rejected-users');
        
        if (pendingUsersEl) pendingUsersEl.textContent = pendingUsers.toString();
        if (totalUsersEl) totalUsersEl.textContent = totalUsers.toString();
        if (approvedUsersEl) approvedUsersEl.textContent = approvedUsers.toString();
        if (rejectedUsersEl) rejectedUsersEl.textContent = rejectedUsers.toString();
    }

    filterBillsByPeriod(bills, period) {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        return bills.filter(bill => {
            const billDate = new Date(bill.billingPeriodStart);
            switch (period) {
                case 'year':
                    return billDate >= startOfYear;
                case 'month':
                    return billDate >= startOfMonth;
                default:
                    return true;
            }
        });
    }

    initializeCharts() {
        this.createConsumptionChart();
        this.createCostChart();
        this.createProviderChart();
        this.createStatusChart();
    }

    createConsumptionChart() {
        const canvas = document.getElementById('consumption-chart');
        if (!canvas) return;
        
        if (this.charts.consumption) {
            this.charts.consumption.destroy();
        }
        
        const bills = this.getUserBills();
        const monthlyData = this.groupBillsByMonth(bills);
        
        this.charts.consumption = new Chart(canvas, {
            type: 'line',
            data: {
                labels: Object.keys(monthlyData),
                datasets: [{
                    label: 'kWh Usage',
                    data: Object.values(monthlyData).map(bills => 
                        bills.reduce((sum, bill) => sum + bill.usage, 0)
                    ),
                    backgroundColor: '#1FB8CD',
                    borderColor: '#1FB8CD',
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    createCostChart() {
        const canvas = document.getElementById('cost-chart');
        if (!canvas) return;
        
        if (this.charts.cost) {
            this.charts.cost.destroy();
        }
        
        const bills = this.getUserBills();
        const monthlyData = this.groupBillsByMonth(bills);
        
        this.charts.cost = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: Object.keys(monthlyData),
                datasets: [{
                    label: 'Total Cost ($)',
                    data: Object.values(monthlyData).map(bills => 
                        bills.reduce((sum, bill) => sum + bill.totalAmount, 0)
                    ),
                    backgroundColor: '#FFC185'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    createProviderChart() {
        const canvas = document.getElementById('provider-chart');
        if (!canvas) return;
        
        if (this.charts.provider) {
            this.charts.provider.destroy();
        }
        
        const bills = this.getUserBills();
        const providers = {};
        bills.forEach(bill => {
            providers[bill.provider] = (providers[bill.provider] || 0) + bill.totalAmount;
        });
        
        this.charts.provider = new Chart(canvas, {
            type: 'pie',
            data: {
                labels: Object.keys(providers),
                datasets: [{
                    data: Object.values(providers),
                    backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    createStatusChart() {
        const canvas = document.getElementById('status-chart');
        if (!canvas) return;
        
        if (this.charts.status) {
            this.charts.status.destroy();
        }
        
        const bills = this.getUserBills();
        const statuses = {};
        bills.forEach(bill => {
            statuses[bill.paymentStatus] = (statuses[bill.paymentStatus] || 0) + 1;
        });
        
        this.charts.status = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: Object.keys(statuses).map(s => s.charAt(0).toUpperCase() + s.slice(1)),
                datasets: [{
                    data: Object.values(statuses),
                    backgroundColor: ['#DB4545', '#1FB8CD', '#D2BA4C']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    groupBillsByMonth(bills) {
        const grouped = {};
        bills.forEach(bill => {
            const date = new Date(bill.billingPeriodStart);
            const monthYear = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short' 
            });
            if (!grouped[monthYear]) {
                grouped[monthYear] = [];
            }
            grouped[monthYear].push(bill);
        });
        return grouped;
    }

    // Bills Management (existing code remains same)
    showBills() {
        this.showView('bills-view');
        const billsNav = document.querySelector('#nav-bills');
        if (billsNav) {
            billsNav.classList.add('active');
        }
        this.loadBillsList();
        this.populateProviderFilter();
    }

    loadBillsList() {
        const bills = this.getUserBills();
        const searchInput = document.getElementById('bills-search');
        const providerFilter = document.getElementById('provider-filter');
        const statusFilter = document.getElementById('status-filter');
        
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const providerFilterValue = providerFilter ? providerFilter.value : '';
        const statusFilterValue = statusFilter ? statusFilter.value : '';
        
        let filteredBills = bills;
        
        if (searchTerm) {
            filteredBills = filteredBills.filter(bill => 
                bill.provider.toLowerCase().includes(searchTerm) ||
                bill.accountNumber.toLowerCase().includes(searchTerm) ||
                bill.notes.toLowerCase().includes(searchTerm)
            );
        }
        
        if (providerFilterValue) {
            filteredBills = filteredBills.filter(bill => bill.provider === providerFilterValue);
        }
        
        if (statusFilterValue) {
            filteredBills = filteredBills.filter(bill => bill.paymentStatus === statusFilterValue);
        }
        
        this.renderBillsTable(filteredBills);
    }

    renderBillsTable(bills) {
        const tbody = document.querySelector('#bills-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        bills.forEach(bill => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${bill.provider}</td>
                <td>${new Date(bill.billingPeriodStart).toLocaleDateString()} - ${new Date(bill.billingPeriodEnd).toLocaleDateString()}</td>
                <td>${bill.usage}</td>
                <td>$${bill.totalAmount.toFixed(2)}</td>
                <td><span class="status-badge status-badge--${bill.paymentStatus}"><span class="status-icon status-icon--${bill.paymentStatus}"></span>${bill.paymentStatus}</span></td>
                <td>${new Date(bill.dueDate).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn action-btn--edit" onclick="app.editBill('${bill.id}')">Edit</button>
                        <button class="action-btn action-btn--delete" onclick="app.deleteBill('${bill.id}')">Delete</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    populateProviderFilter() {
        const bills = this.getUserBills();
        const providers = [...new Set(bills.map(bill => bill.provider))];
        const select = document.getElementById('provider-filter');
        
        if (!select) return;
        
        // Clear existing options except "All Providers"
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        providers.forEach(provider => {
            const option = document.createElement('option');
            option.value = provider;
            option.textContent = provider;
            select.appendChild(option);
        });
    }

    getUserBills() {
        const bills = JSON.parse(localStorage.getItem('ebm_bills') || '[]');
        if (this.currentUser && this.currentUser.role === 'admin') {
            return bills; // Admins see all bills
        }
        return bills.filter(bill => bill.userId === (this.currentUser ? this.currentUser.id : ''));
    }

    showBillModal(bill = null) {
        this.editingBill = bill;
        const modal = document.getElementById('bill-modal');
        const title = document.getElementById('bill-modal-title');
        
        // Initialize JSON editor
        this.jsonEditor = new JSONEditor('json-editor-content');
        
        if (bill) {
            title.textContent = 'Edit Energy Bill';
            this.populateBillForm(bill);
        } else {
            title.textContent = 'Add Energy Bill';
            document.getElementById('bill-form').reset();
            this.jsonEditor.clear();
        }
        
        modal.classList.remove('hidden');
    }

    populateBillForm(bill) {
        const fields = {
            'bill-provider': bill.provider,
            'bill-account': bill.accountNumber,
            'bill-meter': bill.meterNumber,
            'bill-period-start': bill.billingPeriodStart,
            'bill-period-end': bill.billingPeriodEnd,
            'bill-previous-reading': bill.previousReading,
            'bill-current-reading': bill.currentReading,
            'bill-rate': bill.ratePerKwh,
            'bill-base-charge': bill.baseCharge,
            'bill-due-date': bill.dueDate,
            'bill-status': bill.paymentStatus,
            'bill-payment-date': bill.paymentDate || '',
            'bill-notes': bill.notes
        };
        
        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
            }
        });
        
        // Load additional charges into JSON editor
        if (bill.additionalCharges && this.jsonEditor) {
            this.jsonEditor.setJSONValue(bill.additionalCharges);
        }
    }

    saveBill(formData) {
        const bills = JSON.parse(localStorage.getItem('ebm_bills') || '[]');
        
        try {
            const additionalCharges = this.jsonEditor ? this.jsonEditor.getJSONValue() : {};
            
            const usage = formData.currentReading - formData.previousReading;
            let totalAmount = (usage * formData.ratePerKwh) + formData.baseCharge;
            
            // Add additional charges to total
            const addChargesTotal = this.calculateTotalFromJSON(additionalCharges);
            totalAmount += addChargesTotal;
            
            const billData = {
                ...formData,
                usage,
                totalAmount,
                additionalCharges,
                updatedAt: new Date().toISOString()
            };
            
            if (this.editingBill) {
                const index = bills.findIndex(b => b.id === this.editingBill.id);
                if (index >= 0) {
                    bills[index] = { ...bills[index], ...billData };
                }
                this.showToast('Bill updated successfully!', 'success');
            } else {
                const newBill = {
                    id: 'bill-' + Date.now(),
                    userId: this.currentUser.id,
                    createdAt: new Date().toISOString(),
                    ...billData
                };
                bills.push(newBill);
                this.showToast('Bill added successfully!', 'success');
            }
            
            localStorage.setItem('ebm_bills', JSON.stringify(bills));
            this.closeBillModal();
            this.loadBillsList();
            this.loadDashboardData();
            
        } catch (error) {
            this.showToast('Error saving bill: ' + error.message, 'error');
        }
    }

    calculateTotalFromJSON(obj) {
        let total = 0;
        
        const traverse = (value) => {
            if (typeof value === 'number') {
                total += value;
            } else if (Array.isArray(value)) {
                value.forEach(item => traverse(item));
            } else if (typeof value === 'object' && value !== null) {
                Object.values(value).forEach(val => traverse(val));
            }
        };
        
        traverse(obj);
        return total;
    }

    editBill(billId) {
        const bills = JSON.parse(localStorage.getItem('ebm_bills') || '[]');
        const bill = bills.find(b => b.id === billId);
        if (bill) {
            this.showBillModal(bill);
        }
    }

    deleteBill(billId) {
        const bills = JSON.parse(localStorage.getItem('ebm_bills') || '[]');
        const bill = bills.find(b => b.id === billId);
        if (bill) {
            const deleteMessage = document.getElementById('delete-message');
            if (deleteMessage) {
                deleteMessage.textContent = `Are you sure you want to delete the bill from ${bill.provider}?`;
            }
            
            this.deleteCallback = () => {
                const updatedBills = bills.filter(b => b.id !== billId);
                localStorage.setItem('ebm_bills', JSON.stringify(updatedBills));
                this.loadBillsList();
                this.loadDashboardData();
                this.showToast('Bill deleted successfully!', 'success');
            };
            
            const deleteModal = document.getElementById('delete-modal');
            if (deleteModal) {
                deleteModal.classList.remove('hidden');
            }
        }
    }

    closeBillModal() {
        const modal = document.getElementById('bill-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.editingBill = null;
        this.jsonEditor = null;
    }

    // Admin User Management - NEW COMPREHENSIVE IMPLEMENTATION
    showAdmin() {
        if (this.currentUser && this.currentUser.role !== 'admin') return;
        
        this.showView('admin-view');
        const adminNav = document.querySelector('#nav-admin');
        if (adminNav) {
            adminNav.classList.add('active');
        }
        this.loadUsersList();
        this.updateBulkActionButtons();
    }

    loadUsersList() {
        const users = JSON.parse(localStorage.getItem('ebm_users') || '[]');
        const searchInput = document.getElementById('users-search');
        const statusFilter = document.getElementById('user-status-filter');
        const roleFilter = document.getElementById('user-role-filter');
        
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const statusFilterValue = statusFilter ? statusFilter.value : '';
        const roleFilterValue = roleFilter ? roleFilter.value : '';
        
        let filteredUsers = users;
        
        if (searchTerm) {
            filteredUsers = filteredUsers.filter(user => 
                user.username.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm)
            );
        }
        
        if (statusFilterValue) {
            filteredUsers = filteredUsers.filter(user => user.status === statusFilterValue);
        }
        
        if (roleFilterValue) {
            filteredUsers = filteredUsers.filter(user => user.role === roleFilterValue);
        }
        
        this.renderUsersTable(filteredUsers);
    }

    renderUsersTable(users) {
        const tbody = document.querySelector('#users-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.className = `${user.status}-user`;
            if (this.selectedUsers.has(user.id)) {
                row.classList.add('selected-user');
            }
            
            const isCurrentUser = user.id === this.currentUser.id;
            const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never';
            
            row.innerHTML = `
                <td><input type="checkbox" ${isCurrentUser ? 'disabled' : ''} onchange="app.toggleUserSelection('${user.id}', this.checked)"></td>
                <td>${user.id}</td>
                <td>${user.username}${isCurrentUser ? ' (You)' : ''}</td>
                <td>${user.email}</td>
                <td><span class="status-badge status-badge--${user.role}">${user.role}</span></td>
                <td><span class="status-badge status-badge--${user.status}"><span class="status-icon status-icon--${user.status}"></span>${user.status}</span></td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>${lastLogin}</td>
                <td>
                    <div class="action-buttons">
                        ${user.status === 'pending' ? `
                            <button class="action-btn action-btn--approve" onclick="app.approveUser('${user.id}')">Approve</button>
                            <button class="action-btn action-btn--reject" onclick="app.showRejectModal('${user.id}')">Reject</button>
                        ` : user.status === 'rejected' ? `
                            <button class="action-btn action-btn--approve" onclick="app.approveUser('${user.id}')">Approve</button>
                        ` : ''}
                        <button class="action-btn action-btn--edit" onclick="app.showUserEditModal('${user.id}')">Edit</button>
                        <button class="action-btn action-btn--delete" ${isCurrentUser ? 'disabled' : ''} onclick="app.deleteUser('${user.id}')">Delete</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        this.updateSelectAllCheckbox();
    }

    toggleUserSelection(userId, selected) {
        if (selected) {
            this.selectedUsers.add(userId);
        } else {
            this.selectedUsers.delete(userId);
        }
        this.updateBulkActionButtons();
        this.updateSelectAllCheckbox();
        
        // Update row styling
        const row = document.querySelector(`input[onchange*="${userId}"]`).closest('tr');
        if (row) {
            if (selected) {
                row.classList.add('selected-user');
            } else {
                row.classList.remove('selected-user');
            }
        }
    }

    updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('select-all-users');
        const userCheckboxes = document.querySelectorAll('#users-table tbody input[type="checkbox"]:not([disabled])');
        
        if (selectAllCheckbox && userCheckboxes.length > 0) {
            const checkedCount = Array.from(userCheckboxes).filter(cb => cb.checked).length;
            selectAllCheckbox.checked = checkedCount === userCheckboxes.length;
            selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < userCheckboxes.length;
        }
    }

    toggleAllUsers(checked) {
        const userCheckboxes = document.querySelectorAll('#users-table tbody input[type="checkbox"]:not([disabled])');
        userCheckboxes.forEach(checkbox => {
            const userId = checkbox.getAttribute('onchange').match(/'([^']+)'/)[1];
            checkbox.checked = checked;
            this.toggleUserSelection(userId, checked);
        });
    }

    updateBulkActionButtons() {
        const bulkApproveBtn = document.getElementById('bulk-approve-btn');
        const bulkRejectBtn = document.getElementById('bulk-reject-btn');
        
        const hasSelection = this.selectedUsers.size > 0;
        
        if (bulkApproveBtn) {
            bulkApproveBtn.disabled = !hasSelection;
        }
        if (bulkRejectBtn) {
            bulkRejectBtn.disabled = !hasSelection;
        }
    }

    bulkApproveUsers() {
        if (this.selectedUsers.size === 0) return;
        
        const users = JSON.parse(localStorage.getItem('ebm_users') || '[]');
        let approvedCount = 0;
        
        users.forEach(user => {
            if (this.selectedUsers.has(user.id) && user.status !== 'approved') {
                user.status = 'approved';
                user.approvedBy = this.currentUser.id;
                user.approvedAt = new Date().toISOString();
                // Clear rejection data
                delete user.rejectedBy;
                delete user.rejectedAt;
                delete user.rejectionReason;
                approvedCount++;
            }
        });
        
        localStorage.setItem('ebm_users', JSON.stringify(users));
        this.selectedUsers.clear();
        this.loadUsersList();
        this.updatePendingBadge();
        this.loadAdminStats();
        this.updateBulkActionButtons();
        
        this.showToast(`${approvedCount} users approved successfully!`, 'success');
    }

    bulkRejectUsers() {
        if (this.selectedUsers.size === 0) return;
        
        // Show reject modal for bulk action
        this.showRejectModal('bulk');
    }

    approveUser(userId) {
        const users = JSON.parse(localStorage.getItem('ebm_users') || '[]');
        const user = users.find(u => u.id === userId);
        
        if (user) {
            user.status = 'approved';
            user.approvedBy = this.currentUser.id;
            user.approvedAt = new Date().toISOString();
            // Clear rejection data if any
            delete user.rejectedBy;
            delete user.rejectedAt;
            delete user.rejectionReason;
            
            localStorage.setItem('ebm_users', JSON.stringify(users));
            this.loadUsersList();
            this.updatePendingBadge();
            this.loadAdminStats();
            
            this.showToast(`User ${user.username} approved successfully!`, 'success');
            this.showToast(`Email notification sent to ${user.email}`, 'info');
        }
    }

    showRejectModal(userId) {
        this.rejectingUserId = userId;
        const modal = document.getElementById('reject-modal');
        const reasonTextarea = document.getElementById('reject-reason');
        
        if (modal && reasonTextarea) {
            reasonTextarea.value = '';
            modal.classList.remove('hidden');
        }
    }

    rejectUser(reason) {
        if (this.rejectingUserId === 'bulk') {
            this.bulkRejectUsersWithReason(reason);
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('ebm_users') || '[]');
        const user = users.find(u => u.id === this.rejectingUserId);
        
        if (user) {
            user.status = 'rejected';
            user.rejectedBy = this.currentUser.id;
            user.rejectedAt = new Date().toISOString();
            user.rejectionReason = reason;
            // Clear approval data if any
            delete user.approvedBy;
            delete user.approvedAt;
            
            localStorage.setItem('ebm_users', JSON.stringify(users));
            this.loadUsersList();
            this.updatePendingBadge();
            this.loadAdminStats();
            
            this.showToast(`User ${user.username} rejected.`, 'warning');
            this.showToast(`Email notification sent to ${user.email}`, 'info');
        }
    }

    bulkRejectUsersWithReason(reason) {
        const users = JSON.parse(localStorage.getItem('ebm_users') || '[]');
        let rejectedCount = 0;
        
        users.forEach(user => {
            if (this.selectedUsers.has(user.id) && user.status !== 'rejected') {
                user.status = 'rejected';
                user.rejectedBy = this.currentUser.id;
                user.rejectedAt = new Date().toISOString();
                user.rejectionReason = reason;
                // Clear approval data
                delete user.approvedBy;
                delete user.approvedAt;
                rejectedCount++;
            }
        });
        
        localStorage.setItem('ebm_users', JSON.stringify(users));
        this.selectedUsers.clear();
        this.loadUsersList();
        this.updatePendingBadge();
        this.loadAdminStats();
        this.updateBulkActionButtons();
        
        this.showToast(`${rejectedCount} users rejected.`, 'warning');
    }

    showUserEditModal(userId) {
        const users = JSON.parse(localStorage.getItem('ebm_users') || '[]');
        const user = users.find(u => u.id === userId);
        
        if (!user) return;
        
        this.editingUser = user;
        const modal = document.getElementById('user-edit-modal');
        
        // Populate form
        document.getElementById('edit-username').value = user.username;
        document.getElementById('edit-email').value = user.email;
        document.getElementById('edit-role').value = user.role;
        
        modal.classList.remove('hidden');
    }

    saveUserEdit(formData) {
        if (!this.editingUser) return;
        
        const users = JSON.parse(localStorage.getItem('ebm_users') || '[]');
        const userIndex = users.findIndex(u => u.id === this.editingUser.id);
        
        if (userIndex >= 0) {
            // Check for duplicate username/email
            const existingUser = users.find(u => 
                u.id !== this.editingUser.id && 
                (u.username === formData.username || u.email === formData.email)
            );
            
            if (existingUser) {
                this.showToast('Username or email already exists', 'error');
                return false;
            }
            
            users[userIndex] = {
                ...users[userIndex],
                username: formData.username,
                email: formData.email,
                role: formData.role,
                updatedAt: new Date().toISOString()
            };
            
            localStorage.setItem('ebm_users', JSON.stringify(users));
            
            // Update current user if editing self
            if (this.editingUser.id === this.currentUser.id) {
                this.currentUser.username = formData.username;
                this.currentUser.email = formData.email;
                this.currentUser.role = formData.role;
                
                // Update token
                const tokenData = { ...this.currentUser };
                const token = 'header.' + btoa(JSON.stringify(tokenData)) + '.signature';
                localStorage.setItem('ebm_token', token);
                
                // Update UI
                const userNameEl = document.getElementById('user-name');
                if (userNameEl) {
                    userNameEl.textContent = this.currentUser.username;
                }
                
                // Show/hide admin elements if role changed
                const adminElements = document.querySelectorAll('.admin-only');
                adminElements.forEach(el => {
                    if (this.currentUser.role === 'admin') {
                        el.classList.remove('hidden');
                    } else {
                        el.classList.add('hidden');
                    }
                });
            }
            
            this.closeUserEditModal();
            this.loadUsersList();
            this.loadAdminStats();
            this.showToast('User updated successfully!', 'success');
            return true;
        }
        
        return false;
    }

    deleteUser(userId) {
        if (userId === this.currentUser.id) {
            this.showToast('Cannot delete your own account', 'error');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('ebm_users') || '[]');
        const user = users.find(u => u.id === userId);
        
        if (user) {
            const deleteMessage = document.getElementById('delete-message');
            if (deleteMessage) {
                deleteMessage.textContent = `Are you sure you want to delete user "${user.username}"? This action cannot be undone.`;
            }
            
            this.deleteCallback = () => {
                const updatedUsers = users.filter(u => u.id !== userId);
                localStorage.setItem('ebm_users', JSON.stringify(updatedUsers));
                
                // Also delete all bills belonging to this user
                const bills = JSON.parse(localStorage.getItem('ebm_bills') || '[]');
                const updatedBills = bills.filter(b => b.userId !== userId);
                localStorage.setItem('ebm_bills', JSON.stringify(updatedBills));
                
                this.loadUsersList();
                this.updatePendingBadge();
                this.loadAdminStats();
                this.showToast(`User ${user.username} deleted successfully!`, 'success');
            };
            
            const deleteModal = document.getElementById('delete-modal');
            if (deleteModal) {
                deleteModal.classList.remove('hidden');
            }
        }
    }

    closeUserEditModal() {
        const modal = document.getElementById('user-edit-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.editingUser = null;
    }

    closeRejectModal() {
        const modal = document.getElementById('reject-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.rejectingUserId = null;
    }

    // Theme Management
    initializeTheme() {
        const savedTheme = localStorage.getItem('ebm_theme') || 'light';
        this.setTheme(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-color-scheme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-color-scheme', theme);
        localStorage.setItem('ebm_theme', theme);
        
        const themeButton = document.getElementById('theme-toggle');
        if (themeButton) {
            themeButton.textContent = theme === 'light' ? '🌙' : '☀️';
        }
    }

    // Utility Functions
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }

    showLoading(show = true) {
        const loading = document.getElementById('loading');
        if (loading) {
            if (show) {
                loading.classList.remove('hidden');
            } else {
                loading.classList.add('hidden');
            }
        }
    }

    // Event Handlers
    bindEvents() {
        // Authentication
        const showRegisterBtn = document.getElementById('show-register');
        if (showRegisterBtn) {
            showRegisterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('login-page').classList.add('hidden');
                document.getElementById('register-page').classList.remove('hidden');
            });
        }

        const showLoginBtn = document.getElementById('show-login');
        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('register-page').classList.add('hidden');
                document.getElementById('login-page').classList.remove('hidden');
            });
        }

        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                this.login_test(email, password);
            });
        }

        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('register-username').value;
                const email = document.getElementById('register-email').value;
                const password = document.getElementById('register-password').value;
                
                if (this.register(username, email, password)) {
                    document.getElementById('register-page').classList.add('hidden');
                    document.getElementById('login-page').classList.remove('hidden');
                }
            });
        }

        // Navigation
        const navDashboard = document.getElementById('nav-dashboard');
        if (navDashboard) {
            navDashboard.addEventListener('click', (e) => {
                e.preventDefault();
                this.showDashboard();
            });
        }

        const navBills = document.getElementById('nav-bills');
        if (navBills) {
            navBills.addEventListener('click', (e) => {
                e.preventDefault();
                this.showBills();
            });
        }

        const navAdmin = document.getElementById('nav-admin');
        if (navAdmin) {
            navAdmin.addEventListener('click', (e) => {
                e.preventDefault();
                this.showAdmin();
            });
        }

        // User menu
        const userMenuBtn = document.getElementById('user-menu-btn');
        if (userMenuBtn) {
            userMenuBtn.addEventListener('click', () => {
                const menu = document.getElementById('user-menu');
                if (menu) {
                    menu.classList.toggle('hidden');
                }
            });
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Dashboard filters
        const dashboardPeriod = document.getElementById('dashboard-period');
        if (dashboardPeriod) {
            dashboardPeriod.addEventListener('change', () => {
                this.loadDashboardData();
                this.initializeCharts();
            });
        }

        // Bills
        const addBillBtn = document.getElementById('add-bill-btn');
        if (addBillBtn) {
            addBillBtn.addEventListener('click', () => {
                this.showBillModal();
            });
        }

        const billsSearch = document.getElementById('bills-search');
        if (billsSearch) {
            billsSearch.addEventListener('input', () => {
                this.loadBillsList();
            });
        }

        const providerFilter = document.getElementById('provider-filter');
        if (providerFilter) {
            providerFilter.addEventListener('change', () => {
                this.loadBillsList();
            });
        }

        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.loadBillsList();
            });
        }

        // Admin filters
        const usersSearch = document.getElementById('users-search');
        if (usersSearch) {
            usersSearch.addEventListener('input', () => {
                this.loadUsersList();
            });
        }

        const userStatusFilter = document.getElementById('user-status-filter');
        if (userStatusFilter) {
            userStatusFilter.addEventListener('change', () => {
                this.loadUsersList();
            });
        }

        const userRoleFilter = document.getElementById('user-role-filter');
        if (userRoleFilter) {
            userRoleFilter.addEventListener('change', () => {
                this.loadUsersList();
            });
        }

        // Select all users checkbox
        const selectAllUsers = document.getElementById('select-all-users');
        if (selectAllUsers) {
            selectAllUsers.addEventListener('change', (e) => {
                this.toggleAllUsers(e.target.checked);
            });
        }

        // Bulk action buttons
        const bulkApproveBtn = document.getElementById('bulk-approve-btn');
        if (bulkApproveBtn) {
            bulkApproveBtn.addEventListener('click', () => {
                this.bulkApproveUsers();
            });
        }

        const bulkRejectBtn = document.getElementById('bulk-reject-btn');
        if (bulkRejectBtn) {
            bulkRejectBtn.addEventListener('click', () => {
                this.bulkRejectUsers();
            });
        }

        // Bill form
        const billForm = document.getElementById('bill-form');
        if (billForm) {
            billForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = {
                    provider: document.getElementById('bill-provider').value,
                    accountNumber: document.getElementById('bill-account').value,
                    meterNumber: document.getElementById('bill-meter').value,
                    billingPeriodStart: document.getElementById('bill-period-start').value,
                    billingPeriodEnd: document.getElementById('bill-period-end').value,
                    previousReading: parseFloat(document.getElementById('bill-previous-reading').value),
                    currentReading: parseFloat(document.getElementById('bill-current-reading').value),
                    ratePerKwh: parseFloat(document.getElementById('bill-rate').value),
                    baseCharge: parseFloat(document.getElementById('bill-base-charge').value),
                    dueDate: document.getElementById('bill-due-date').value,
                    paymentStatus: document.getElementById('bill-status').value,
                    paymentDate: document.getElementById('bill-payment-date').value,
                    notes: document.getElementById('bill-notes').value
                };
                this.saveBill(formData);
            });
        }

        // User edit form
        const userEditForm = document.getElementById('user-edit-form');
        if (userEditForm) {
            userEditForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = {
                    username: document.getElementById('edit-username').value,
                    email: document.getElementById('edit-email').value,
                    role: document.getElementById('edit-role').value
                };
                this.saveUserEdit(formData);
            });
        }

        // Reject form
        const rejectForm = document.getElementById('reject-form');
        if (rejectForm) {
            rejectForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const reason = document.getElementById('reject-reason').value.trim();
                if (!reason) {
                    this.showToast('Please provide a rejection reason', 'error');
                    return;
                }
                this.rejectUser(reason);
                this.closeRejectModal();
            });
        }

        // Modal controls
        const closeBillModal = document.getElementById('close-bill-modal');
        if (closeBillModal) {
            closeBillModal.addEventListener('click', () => {
                this.closeBillModal();
            });
        }

        const cancelBill = document.getElementById('cancel-bill');
        if (cancelBill) {
            cancelBill.addEventListener('click', () => {
                this.closeBillModal();
            });
        }

        const closeUserEditModal = document.getElementById('close-user-edit-modal');
        if (closeUserEditModal) {
            closeUserEditModal.addEventListener('click', () => {
                this.closeUserEditModal();
            });
        }

        const cancelUserEdit = document.getElementById('cancel-user-edit');
        if (cancelUserEdit) {
            cancelUserEdit.addEventListener('click', () => {
                this.closeUserEditModal();
            });
        }

        const closeRejectModal = document.getElementById('close-reject-modal');
        if (closeRejectModal) {
            closeRejectModal.addEventListener('click', () => {
                this.closeRejectModal();
            });
        }

        const cancelReject = document.getElementById('cancel-reject');
        if (cancelReject) {
            cancelReject.addEventListener('click', () => {
                this.closeRejectModal();
            });
        }

        // Delete confirmation
        const closeDeleteModal = document.getElementById('close-delete-modal');
        if (closeDeleteModal) {
            closeDeleteModal.addEventListener('click', () => {
                document.getElementById('delete-modal').classList.add('hidden');
            });
        }

        const cancelDelete = document.getElementById('cancel-delete');
        if (cancelDelete) {
            cancelDelete.addEventListener('click', () => {
                document.getElementById('delete-modal').classList.add('hidden');
            });
        }

        const confirmDelete = document.getElementById('confirm-delete');
        if (confirmDelete) {
            confirmDelete.addEventListener('click', () => {
                if (this.deleteCallback) {
                    this.deleteCallback();
                    this.deleteCallback = null;
                }
                document.getElementById('delete-modal').classList.add('hidden');
            });
        }

        // Click outside to close menus/modals
        document.addEventListener('click', (e) => {
            // Close user menu
            if (!e.target.closest('.user-dropdown')) {
                const userMenu = document.getElementById('user-menu');
                if (userMenu) {
                    userMenu.classList.add('hidden');
                }
            }

            // Close modals
            if (e.target.classList.contains('modal-backdrop')) {
                const modal = e.target.parentElement;
                if (modal && modal.classList.contains('modal')) {
                    modal.classList.add('hidden');
                }
            }
        });
    }
}

// JSON Editor Class (keeping existing implementation with minor fixes)
class JSONEditor {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.data = {};
        this.nextId = 1;
        
        if (this.container) {
            this.init();
        }
    }

    init() {
        this.bindEditorEvents();
        this.render();
    }

    bindEditorEvents() {
        // Add root key button
        const addRootBtn = document.getElementById('add-root-key');
        if (addRootBtn) {
            addRootBtn.addEventListener('click', () => {
                this.addKeyValue(this.data, '', '', 'string');
                this.render();
            });
        }

        // Import JSON button
        const importBtn = document.getElementById('import-json');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this.showImportModal();
            });
        }

        // Export JSON button
        const exportBtn = document.getElementById('export-json');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportJSON();
            });
        }

        // Clear JSON button
        const clearBtn = document.getElementById('clear-json');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clear();
            });
        }

        // Import modal events
        const closeImportModal = document.getElementById('close-json-import-modal');
        if (closeImportModal) {
            closeImportModal.addEventListener('click', () => {
                document.getElementById('json-import-modal').classList.add('hidden');
            });
        }

        const cancelImport = document.getElementById('cancel-json-import');
        if (cancelImport) {
            cancelImport.addEventListener('click', () => {
                document.getElementById('json-import-modal').classList.add('hidden');
            });
        }

        const confirmImport = document.getElementById('confirm-json-import');
        if (confirmImport) {
            confirmImport.addEventListener('click', () => {
                this.importJSON();
            });
        }
    }

    addKeyValue(parent, key, value, type, index = null) {
        const fieldId = 'field-' + this.nextId++;
        const field = {
            id: fieldId,
            key: key,
            value: value,
            type: type,
            collapsed: false
        };

        if (type === 'object') {
            field.children = {};
        } else if (type === 'array') {
            field.children = [];
        }

        if (Array.isArray(parent)) {
            if (index !== null) {
                parent.splice(index, 0, field);
            } else {
                parent.push(field);
            }
        } else {
            parent[key || `field_${fieldId}`] = field;
        }

        return field;
    }

    removeKeyValue(parent, key) {
        if (Array.isArray(parent)) {
            parent.splice(key, 1);
        } else {
            delete parent[key];
        }
        this.render();
    }

    render() {
        if (!this.container) return;

        if (Object.keys(this.data).length === 0) {
            this.container.innerHTML = '<div class="json-editor-empty"><p>No additional charges defined. Click "Add Field" to start.</p></div>';
        } else {
            this.container.innerHTML = this.renderObject(this.data, '');
        }

        this.updatePreview();
        this.updateValidation();
    }

    renderObject(obj, path) {
        let html = '';
        
        Object.entries(obj).forEach(([key, field]) => {
            html += this.renderField(field, obj, key, path);
        });

        return html;
    }

    renderField(field, parent, key, path) {
        const fieldPath = path ? `${path}.${key}` : key;
        const typeIcon = this.getTypeIcon(field.type);
        const canHaveChildren = field.type === 'object' || field.type === 'array';
        
        let html = `
            <div class="json-field" data-field-id="${field.id}">
                <div class="json-field-header">
                    <div class="json-field-type">
                        <span class="json-type-icon ${field.type}">${typeIcon}</span>
                        <span>${field.type}</span>
                    </div>
                    <div class="json-field-controls">
        `;

        if (canHaveChildren) {
            html += `<button class="json-control-btn toggle" onclick="app.jsonEditor.toggleCollapse('${field.id}')">${field.collapsed ? '⊞' : '⊟'}</button>`;
            if (field.type === 'object') {
                html += `<button class="json-control-btn add" onclick="app.jsonEditor.addChildField('${field.id}', 'object')">+ Field</button>`;
            } else {
                html += `<button class="json-control-btn add" onclick="app.jsonEditor.addChildField('${field.id}', 'array')">+ Item</button>`;
            }
        }

        html += `
                        <button class="json-control-btn remove" onclick="app.jsonEditor.removeField('${fieldPath}')">✕</button>
                    </div>
                </div>
                <div class="json-field-inputs">
                    <input type="text" class="json-field-key" value="${field.key}" onchange="app.jsonEditor.updateKey('${fieldPath}', this.value)" placeholder="Key">
        `;

        if (!canHaveChildren) {
            html += `<input type="text" class="json-field-value" value="${field.value}" onchange="app.jsonEditor.updateValue('${fieldPath}', this.value)" placeholder="Value">`;
        } else {
            html += `<span class="json-field-value">${field.type === 'object' ? '{ }' : '[ ]'}</span>`;
        }

        html += `
                    <select class="json-field-type-select" onchange="app.jsonEditor.updateType('${fieldPath}', this.value)">
                        <option value="string" ${field.type === 'string' ? 'selected' : ''}>String</option>
                        <option value="number" ${field.type === 'number' ? 'selected' : ''}>Number</option>
                        <option value="boolean" ${field.type === 'boolean' ? 'selected' : ''}>Boolean</option>
                        <option value="object" ${field.type === 'object' ? 'selected' : ''}>Object</option>
                        <option value="array" ${field.type === 'array' ? 'selected' : ''}>Array</option>
                    </select>
                </div>
        `;

        if (canHaveChildren && field.children && !field.collapsed) {
            html += `<div class="json-field-children">`;
            if (field.type === 'object') {
                html += this.renderObject(field.children, fieldPath);
            } else {
                html += this.renderArray(field.children, fieldPath);
            }
            html += `</div>`;
        }

        html += `</div>`;
        return html;
    }

    renderArray(arr, path) {
        let html = '';
        
        arr.forEach((item, index) => {
            const itemPath = `${path}[${index}]`;
            html += `
                <div class="json-array-item">
                    <span class="json-array-index">[${index}]</span>
                    <input type="text" class="json-field-value" value="${item.value || ''}" onchange="app.jsonEditor.updateArrayItem('${itemPath}', this.value)" placeholder="Value">
                    <select class="json-field-type-select" onchange="app.jsonEditor.updateArrayItemType('${itemPath}', this.value)">
                        <option value="string" ${item.type === 'string' ? 'selected' : ''}>String</option>
                        <option value="number" ${item.type === 'number' ? 'selected' : ''}>Number</option>
                        <option value="boolean" ${item.type === 'boolean' ? 'selected' : ''}>Boolean</option>
                        <option value="object" ${item.type === 'object' ? 'selected' : ''}>Object</option>
                    </select>
                    <button class="json-control-btn remove" onclick="app.jsonEditor.removeArrayItem('${path}', ${index})">✕</button>
                </div>
            `;
        });

        return html;
    }

    getTypeIcon(type) {
        const icons = {
            string: 'S',
            number: '#',
            boolean: 'B',
            object: '{}',
            array: '[]'
        };
        return icons[type] || 'S';
    }

    // Event handlers for UI interactions
    updateKey(path, newKey) {
        const field = this.getFieldByPath(path);
        if (field) {
            field.key = newKey;
            this.render();
        }
    }

    updateValue(path, newValue) {
        const field = this.getFieldByPath(path);
        if (field) {
            field.value = this.convertValue(newValue, field.type);
            this.render();
        }
    }

    updateType(path, newType) {
        const field = this.getFieldByPath(path);
        if (field) {
            field.type = newType;
            if (newType === 'object') {
                field.children = {};
                delete field.value;
            } else if (newType === 'array') {
                field.children = [];
                delete field.value;
            } else {
                delete field.children;
                field.value = this.convertValue(field.value || '', newType);
            }
            this.render();
        }
    }

    convertValue(value, type) {
        switch (type) {
            case 'number':
                const num = parseFloat(value);
                return isNaN(num) ? 0 : num;
            case 'boolean':
                return value === 'true' || value === true;
            default:
                return String(value);
        }
    }

    addChildField(fieldId, parentType) {
        const field = this.findFieldById(fieldId, this.data);
        if (field && field.children) {
            if (parentType === 'object') {
                this.addKeyValue(field.children, '', '', 'string');
            } else if (parentType === 'array') {
                field.children.push({
                    id: 'field-' + this.nextId++,
                    value: '',
                    type: 'string'
                });
            }
            this.render();
        }
    }

    removeField(path) {
        const pathParts = path.split('.');
        const fieldKey = pathParts.pop();
        let parent = this.data;
        
        for (const part of pathParts) {
            if (parent[part] && parent[part].children) {
                parent = parent[part].children;
            }
        }
        
        this.removeKeyValue(parent, fieldKey);
    }

    toggleCollapse(fieldId) {
        const field = this.findFieldById(fieldId, this.data);
        if (field) {
            field.collapsed = !field.collapsed;
            this.render();
        }
    }

    updateArrayItem(path, value) {
        const match = path.match(/^(.+)\[(\d+)\]$/);
        if (match) {
            const [, fieldPath, indexStr] = match;
            const index = parseInt(indexStr);
            const field = this.getFieldByPath(fieldPath);
            if (field && field.children && field.children[index]) {
                field.children[index].value = this.convertValue(value, field.children[index].type);
                this.render();
            }
        }
    }

    updateArrayItemType(path, type) {
        const match = path.match(/^(.+)\[(\d+)\]$/);
        if (match) {
            const [, fieldPath, indexStr] = match;
            const index = parseInt(indexStr);
            const field = this.getFieldByPath(fieldPath);
            if (field && field.children && field.children[index]) {
                field.children[index].type = type;
                field.children[index].value = this.convertValue(field.children[index].value || '', type);
                this.render();
            }
        }
    }

    removeArrayItem(fieldPath, index) {
        const field = this.getFieldByPath(fieldPath);
        if (field && field.children && Array.isArray(field.children)) {
            field.children.splice(index, 1);
            this.render();
        }
    }

    // Utility methods
    getFieldByPath(path) {
        const pathParts = path.split('.');
        let current = this.data;
        
        for (const part of pathParts) {
            if (current[part] && current[part].children !== undefined) {
                current = current[part].children;
            } else if (current[part]) {
                current = current[part];
            } else {
                return null;
            }
        }
        
        return current;
    }

    findFieldById(id, obj) {
        for (const [key, field] of Object.entries(obj)) {
            if (field.id === id) {
                return field;
            }
            if (field.children) {
                const found = Array.isArray(field.children) ? 
                    field.children.find(child => child.id === id) :
                    this.findFieldById(id, field.children);
                if (found) return found;
            }
        }
        return null;
    }

    // Import/Export functionality
    showImportModal() {
        const modal = document.getElementById('json-import-modal');
        const textarea = document.getElementById('json-import-textarea');
        const errorDiv = document.getElementById('json-import-error');
        
        if (modal && textarea && errorDiv) {
            textarea.value = '';
            errorDiv.classList.add('hidden');
            modal.classList.remove('hidden');
        }
    }

    importJSON() {
        const textarea = document.getElementById('json-import-textarea');
        const errorDiv = document.getElementById('json-import-error');
        const modal = document.getElementById('json-import-modal');
        
        if (!textarea || !errorDiv || !modal) return;

        try {
            const jsonData = JSON.parse(textarea.value);
            this.setJSONValue(jsonData);
            modal.classList.add('hidden');
            if (window.app) {
                window.app.showToast('JSON imported successfully!', 'success');
            }
        } catch (error) {
            errorDiv.textContent = 'Invalid JSON: ' + error.message;
            errorDiv.classList.remove('hidden');
        }
    }

    exportJSON() {
        const jsonData = this.getJSONValue();
        const jsonString = JSON.stringify(jsonData, null, 2);
        
        // Copy to clipboard
        navigator.clipboard.writeText(jsonString).then(() => {
            if (window.app) {
                window.app.showToast('JSON copied to clipboard!', 'success');
            }
        }).catch(() => {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = jsonString;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            if (window.app) {
                window.app.showToast('JSON copied to clipboard!', 'success');
            }
        });
    }

    // Main API methods
    setJSONValue(jsonObj) {
        this.data = {};
        this.nextId = 1;
        this.parseJSONToFields(jsonObj, this.data);
        this.render();
    }

    parseJSONToFields(obj, parent, parentKey = '') {
        if (Array.isArray(obj)) {
            const field = this.addKeyValue(parent, parentKey, null, 'array');
            obj.forEach((item, index) => {
                if (typeof item === 'object' && item !== null) {
                    const childField = {
                        id: 'field-' + this.nextId++,
                        type: 'object',
                        children: {}
                    };
                    field.children.push(childField);
                    this.parseJSONToFields(item, {temp: childField}, 'temp');
                    field.children[index] = childField;
                } else {
                    field.children.push({
                        id: 'field-' + this.nextId++,
                        value: item,
                        type: typeof item
                    });
                }
            });
        } else if (typeof obj === 'object' && obj !== null) {
            Object.entries(obj).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    const field = this.addKeyValue(parent, key, null, 'array');
                    this.parseJSONToFields(value, {temp: field}, 'temp');
                } else if (typeof value === 'object' && value !== null) {
                    const field = this.addKeyValue(parent, key, null, 'object');
                    this.parseJSONToFields(value, field.children);
                } else {
                    this.addKeyValue(parent, key, value, typeof value);
                }
            });
        }
    }

    getJSONValue() {
        return this.fieldsToJSON(this.data);
    }

    fieldsToJSON(fields) {
        const result = {};
        
        Object.entries(fields).forEach(([key, field]) => {
            const fieldKey = field.key || key;
            
            if (field.type === 'object' && field.children) {
                result[fieldKey] = this.fieldsToJSON(field.children);
            } else if (field.type === 'array' && field.children) {
                result[fieldKey] = field.children.map(item => {
                    if (item.type === 'object' && item.children) {
                        return this.fieldsToJSON({temp: item}).temp;
                    }
                    return this.convertValue(item.value, item.type);
                });
            } else {
                result[fieldKey] = this.convertValue(field.value, field.type);
            }
        });
        
        return result;
    }

    validateJSON() {
        try {
            this.getJSONValue();
            return { valid: true, message: 'Valid JSON' };
        } catch (error) {
            return { valid: false, message: error.message };
        }
    }

    updatePreview() {
        const preview = document.getElementById('json-preview');
        if (preview) {
            try {
                const jsonData = this.getJSONValue();
                preview.textContent = JSON.stringify(jsonData, null, 2);
            } catch (error) {
                preview.textContent = 'Invalid JSON structure';
            }
        }
    }

    updateValidation() {
        const validation = document.getElementById('json-validation');
        if (validation) {
            const result = this.validateJSON();
            validation.textContent = result.message;
            validation.className = `json-validation-status ${result.valid ? 'valid' : 'invalid'}`;
        }
    }

    clear() {
        this.data = {};
        this.nextId = 1;
        this.render();
        if (window.app) {
            window.app.showToast('JSON editor cleared', 'info');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.app = new EnergyBillManager();
});