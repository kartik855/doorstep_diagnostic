/* ══════════════════════════════════════════════
   DOORSTEP DIAGNOSTICS – COMMON JS
   Shared utilities, data model, localStorage helpers
   ══════════════════════════════════════════════ */

// ─── CONSTANTS ───
const COUPONS = {
    'FIRST20': { disc: 20, type: 'percent', label: '20% OFF', min: 0 },
    'HEALTH10': { disc: 10, type: 'percent', label: '10% OFF', min: 300 },
    'FAMILY15': { disc: 15, type: 'percent', label: '15% OFF', min: 500 },
    'FLAT100': { disc: 100, type: 'flat', label: '₹100 OFF', min: 400 },
    'SAVE200': { disc: 200, type: 'flat', label: '₹200 OFF', min: 999 }
};

const PHLEBOTOMISTS = [
    { name: 'Ravi Kumar', phone: '+91 98765 43210', rating: 4.9, vehicle: 'Bike', avatar: 'RK' },
    { name: 'Suresh Patel', phone: '+91 98765 43211', rating: 4.8, vehicle: 'Bike', avatar: 'SP' },
    { name: 'Anita Sharma', phone: '+91 98765 43212', rating: 4.9, vehicle: 'Scooter', avatar: 'AS' },
    { name: 'Deepak Verma', phone: '+91 98765 43213', rating: 4.7, vehicle: 'Bike', avatar: 'DV' },
    { name: 'Priya Singh', phone: '+91 98765 43214', rating: 5.0, vehicle: 'Scooter', avatar: 'PS' }
];

const TRACKING_STAGES = [
    { id: 'confirmed', icon: '✅', title: 'Booking Confirmed', subtitle: 'Your test has been scheduled' },
    { id: 'assigned', icon: '👨‍⚕️', title: 'Phlebotomist Assigned', subtitle: 'Preparing for your visit' },
    { id: 'on-the-way', icon: '🚗', title: 'On the Way', subtitle: 'Heading to your location' },
    { id: 'arrived', icon: '📍', title: 'Arrived', subtitle: 'At your location' },
    { id: 'collected', icon: '🧪', title: 'Sample Collected', subtitle: 'Heading to the lab' },
    { id: 'report-ready', icon: '📊', title: 'Report Ready', subtitle: 'Download your results' }
];

const BANKS = [
    { name: 'State Bank of India', code: 'SBI', color: '#1a237e' },
    { name: 'HDFC Bank', code: 'HDFC', color: '#004c8c' },
    { name: 'ICICI Bank', code: 'ICICI', color: '#f57c00' },
    { name: 'Axis Bank', code: 'AXIS', color: '#800020' },
    { name: 'Kotak Mahindra', code: 'KOTAK', color: '#ed1c24' },
    { name: 'Punjab National Bank', code: 'PNB', color: '#1565c0' },
    { name: 'Bank of Baroda', code: 'BOB', color: '#f4511e' },
    { name: 'Yes Bank', code: 'YES', color: '#0060aa' }
];

// ─── DOM HELPERS ───
const qs = (s, ctx = document) => ctx.querySelector(s);
const qsa = (s, ctx = document) => ctx.querySelectorAll(s);

// ─── LOCAL STORAGE HELPERS ───
const Storage = {
    get(key, fallback = null) {
        try {
            const val = localStorage.getItem(key);
            return val ? JSON.parse(val) : fallback;
        } catch { return fallback; }
    },
    set(key, val) {
        localStorage.setItem(key, JSON.stringify(val));
    },
    remove(key) {
        localStorage.removeItem(key);
    }
};

// ─── BOOKING DATA MODEL ───
const BookingStore = {
    KEY: 'dd_bookings',

    getAll() {
        return Storage.get(this.KEY, []);
    },

    getById(id) {
        return this.getAll().find(b => b.id === id) || null;
    },

    add(booking) {
        const bookings = this.getAll();
        booking.createdAt = new Date().toISOString();
        booking.updatedAt = booking.createdAt;
        booking.status = booking.status || 'confirmed';
        booking.statusHistory = [{ status: 'confirmed', time: booking.createdAt }];
        booking.phlebotomist = PHLEBOTOMISTS[Math.floor(Math.random() * PHLEBOTOMISTS.length)];
        bookings.unshift(booking);
        Storage.set(this.KEY, bookings);
        return booking;
    },

    update(id, updates) {
        const bookings = this.getAll();
        const idx = bookings.findIndex(b => b.id === id);
        if (idx === -1) return null;
        
        if (updates.status && updates.status !== bookings[idx].status) {
            bookings[idx].statusHistory = bookings[idx].statusHistory || [];
            bookings[idx].statusHistory.push({ status: updates.status, time: new Date().toISOString() });
        }
        
        Object.assign(bookings[idx], updates, { updatedAt: new Date().toISOString() });
        Storage.set(this.KEY, bookings);
        return bookings[idx];
    },

    delete(id) {
        const bookings = this.getAll().filter(b => b.id !== id);
        Storage.set(this.KEY, bookings);
    },

    getStats() {
        const bookings = this.getAll();
        const today = new Date().toDateString();
        return {
            total: bookings.length,
            today: bookings.filter(b => new Date(b.createdAt).toDateString() === today).length,
            revenue: bookings.reduce((sum, b) => sum + (b.total || 0), 0),
            completed: bookings.filter(b => b.status === 'report-ready').length,
            active: bookings.filter(b => !['report-ready', 'cancelled'].includes(b.status)).length,
            cancelled: bookings.filter(b => b.status === 'cancelled').length
        };
    }
};

// ─── TEST DATA ───
const TestStore = {
    KEY: 'dd_tests',
    DEFAULTS: [
        { id: 'cbc', name: 'Complete Blood Count (CBC)', price: 399, params: 'Hemoglobin,WBC Count,RBC Count,Platelet Count,Hematocrit', category: 'Blood', active: true },
        { id: 'thyroid', name: 'Thyroid Profile', price: 499, params: 'TSH,T3,T4,Free T3,Free T4', category: 'Hormone', active: true },
        { id: 'diabetes', name: 'Diabetes Panel', price: 599, params: 'Fasting Glucose,PP Glucose,HbA1c,Insulin', category: 'Metabolic', active: true },
        { id: 'lipid', name: 'Lipid Profile', price: 449, params: 'Total Cholesterol,HDL,LDL,Triglycerides,VLDL', category: 'Heart', active: true },
        { id: 'liver', name: 'Liver Function Test', price: 699, params: 'SGOT,SGPT,Bilirubin,ALP,GGT,Albumin', category: 'Organ', active: true },
        { id: 'kidney', name: 'Kidney Function Test', price: 649, params: 'Creatinine,BUN,Uric Acid,eGFR,Electrolytes', category: 'Organ', active: true },
        { id: 'vitamin', name: 'Vitamin Panel', price: 899, params: 'Vitamin D,Vitamin B12,Folate,Iron,Calcium', category: 'Nutrition', active: true },
        { id: 'full-body', name: 'Full Body Checkup', price: 1999, params: 'CBC,Thyroid,Lipid,Liver,Kidney,Sugar,Vitamin D,B12,Iron,Urine', category: 'Package', active: true },
        { id: 'allergy', name: 'Allergy Panel', price: 1499, params: 'Total IgE,Specific IgE Panel,Eosinophil Count', category: 'Immune', active: true },
        { id: 'hormone', name: 'Hormone Panel', price: 1299, params: 'Testosterone,Estrogen,Progesterone,LH,FSH,Prolactin', category: 'Hormone', active: true }
    ],

    getAll() {
        let tests = Storage.get(this.KEY);
        if (!tests) {
            Storage.set(this.KEY, this.DEFAULTS);
            tests = this.DEFAULTS;
        }
        return tests;
    },

    getActive() {
        return this.getAll().filter(t => t.active);
    },

    add(test) {
        const tests = this.getAll();
        test.id = test.id || test.name.toLowerCase().replace(/\s+/g, '-').slice(0, 20);
        tests.push(test);
        Storage.set(this.KEY, tests);
        return test;
    },

    update(id, updates) {
        const tests = this.getAll();
        const idx = tests.findIndex(t => t.id === id);
        if (idx === -1) return null;
        Object.assign(tests[idx], updates);
        Storage.set(this.KEY, tests);
        return tests[idx];
    },

    delete(id) {
        const tests = this.getAll().filter(t => t.id !== id);
        Storage.set(this.KEY, tests);
    }
};

// ─── COUPON STORE ───
const CouponStore = {
    KEY: 'dd_coupons',

    getAll() {
        let coupons = Storage.get(this.KEY);
        if (!coupons) {
            const defaults = Object.entries(COUPONS).map(([code, c]) => ({
                code, ...c, active: true, usageCount: 0
            }));
            Storage.set(this.KEY, defaults);
            coupons = defaults;
        }
        return coupons;
    },

    validate(code, amount) {
        const coupon = this.getAll().find(c => c.code === code.toUpperCase() && c.active);
        if (!coupon) return { valid: false, message: '❌ Invalid coupon code' };
        if (amount < coupon.min) return { valid: false, message: `Min order ₹${coupon.min} required` };
        const discount = coupon.type === 'percent' ? Math.round(amount * coupon.disc / 100) : coupon.disc;
        return { valid: true, discount, label: coupon.label, message: `✅ ${coupon.label} applied!` };
    },

    add(coupon) {
        const coupons = this.getAll();
        coupon.usageCount = 0;
        coupons.push(coupon);
        Storage.set(this.KEY, coupons);
    },

    update(code, updates) {
        const coupons = this.getAll();
        const idx = coupons.findIndex(c => c.code === code);
        if (idx === -1) return;
        Object.assign(coupons[idx], updates);
        Storage.set(this.KEY, coupons);
    },

    delete(code) {
        const coupons = this.getAll().filter(c => c.code !== code);
        Storage.set(this.KEY, coupons);
    },

    incrementUsage(code) {
        const coupons = this.getAll();
        const c = coupons.find(c => c.code === code);
        if (c) { c.usageCount++; Storage.set(this.KEY, coupons); }
    }
};

// ─── GENERATE ORDER ID ───
function generateOrderId() {
    return 'DDX' + Date.now().toString(36).toUpperCase().slice(-6) + Math.random().toString(36).toUpperCase().slice(2, 5);
}

// ─── GENERATE TXN ID ───
function generateTxnId() {
    return 'TXN' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).toUpperCase().slice(2, 6);
}

// ─── FORMAT CURRENCY ───
function formatCurrency(amount) {
    return '₹' + amount.toLocaleString('en-IN');
}

// ─── FORMAT DATE ───
function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function formatRelativeTime(dateStr) {
    const now = new Date();
    const d = new Date(dateStr);
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return formatDate(dateStr);
}

// ─── TOAST SYSTEM ───
class ToastManager {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    show(title, message, type = 'info', duration = 4000) {
        const icons = { info: '💬', success: '✅', error: '❌', warning: '⚠️' };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.classList.add('removing'); setTimeout(()=>this.parentElement.remove(), 300)">✕</button>
        `;
        this.container.appendChild(toast);

        if (duration > 0) {
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.classList.add('removing');
                    setTimeout(() => toast.remove(), 300);
                }
            }, duration);
        }
    }

    success(title, msg) { this.show(title, msg, 'success'); }
    error(title, msg) { this.show(title, msg, 'error'); }
    warning(title, msg) { this.show(title, msg, 'warning'); }
    info(title, msg) { this.show(title, msg, 'info'); }
}

// Global toast instance - initialize after DOM ready
let toast;
document.addEventListener('DOMContentLoaded', () => {
    toast = new ToastManager();
});

// ─── SEED DEMO DATA ───
function seedDemoBookings(count = 15) {
    const existing = BookingStore.getAll();
    if (existing.length >= count) return;

    const names = ['Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Reddy', 'Vikram Singh', 
                   'Anjali Gupta', 'Rahul Verma', 'Meera Iyer', 'Karthik Nair', 'Neha Agarwal',
                   'Suresh Yadav', 'Divya Joshi', 'Arjun Mehta', 'Pooja Mishra', 'Rohit Saxena'];
    const tests = TestStore.getAll();
    const statuses = ['confirmed', 'assigned', 'on-the-way', 'arrived', 'collected', 'report-ready', 'report-ready', 'report-ready'];
    const labs = ['Thyrocare (NABL)', 'Redcliffe Labs (NABL)', 'Healthians'];
    const times = ['6:00 AM – 8:00 AM', '8:00 AM – 10:00 AM', '10:00 AM – 12:00 PM', '4:00 PM – 6:00 PM'];
    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad'];

    for (let i = existing.length; i < count; i++) {
        const test = tests[Math.floor(Math.random() * tests.length)];
        const daysAgo = Math.floor(Math.random() * 30);
        const createdDate = new Date(Date.now() - daysAgo * 86400000);
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const hasDiscount = Math.random() > 0.6;
        const discount = hasDiscount ? Math.round(test.price * 0.1) : 0;

        const booking = {
            id: generateOrderId(),
            name: names[i % names.length],
            phone: '9' + Math.floor(Math.random() * 900000000 + 100000000),
            age: Math.floor(Math.random() * 60 + 18),
            gender: Math.random() > 0.5 ? 'Male' : 'Female',
            test: { value: test.id, name: test.name, price: test.price },
            lab: labs[Math.floor(Math.random() * labs.length)],
            date: createdDate.toISOString().split('T')[0],
            time: times[Math.floor(Math.random() * times.length)],
            address: `${Math.floor(Math.random() * 500 + 1)}, Sample Street, ${cities[Math.floor(Math.random() * cities.length)]}`,
            notes: '',
            coupon: hasDiscount ? 'HEALTH10' : null,
            discount: discount,
            total: test.price - discount,
            payment: {
                method: ['upi', 'card', 'netbanking', 'cash'][Math.floor(Math.random() * 4)],
                transactionId: generateTxnId(),
                status: 'success'
            },
            status: status,
            phlebotomist: PHLEBOTOMISTS[Math.floor(Math.random() * PHLEBOTOMISTS.length)],
            createdAt: createdDate.toISOString(),
            updatedAt: createdDate.toISOString(),
            statusHistory: [{ status: 'confirmed', time: createdDate.toISOString() }]
        };

        const bookings = BookingStore.getAll();
        bookings.push(booking);
        Storage.set(BookingStore.KEY, bookings);
    }
}
