let cart = JSON.parse(localStorage.getItem('cart')) || [];
let reviews = [];
let orders = [];
let currentCategory = 'all';
let lastScrollTop = 0;
let hideNavbarTimeout;
let products = [];
let adminSearchTriggered = false;

const API_URL_BASE = 'https://paperbloomback.onrender.com/api';

const galleryImages = [
    '/galleryImages/flower_box.jpeg',
    '/galleryImages/flower_box1.jpeg',
    '/galleryImages/pink_single_rose.jpeg',
    '/galleryImages/flower_box3.jpeg',
    '/galleryImages/single_sunflower1.jpeg',
    '/galleryImages/flower_box4.jpeg'
];

async function trackEvent(type, data = {}) {
    try {
        await fetch(`${API_URL_BASE}/analytics/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type,
                path: window.location.pathname,
                ...data
            })
        });
    } catch (error) {
        console.error('Analytics tracking error:', error);
    }
}

function trackPageView() {
    trackEvent('page_view');
}

function trackProductView(productId) {
    trackEvent('product_view', { productId });
}

function trackAddToCart(productId) {
    trackEvent('add_to_cart', { productId });
}

function trackOrderPlaced(orderId) {
    trackEvent('order_placed', { orderId });
}

function checkForAdminSearch() {
    const searchInput = document.getElementById('search-input');
    const searchValue = searchInput.value.toLowerCase().trim();

    if (searchValue === 'admin' && !adminSearchTriggered) {
        adminSearchTriggered = true;
        showAdminLogin();
        searchInput.value = ''; // Clear the search input
    }
}

function showAdminLogin() {
    const adminSection = document.getElementById('admin-login-section');
    adminSection.style.display = 'flex';

    // Close admin form when clicking outside
    adminSection.addEventListener('click', function (e) {
        if (e.target === this) {
            hideAdminLogin();
        }
    });

    // Add escape key to close
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            hideAdminLogin();
        }
    });
}

function hideAdminLogin() {
    const adminSection = document.getElementById('admin-login-section');
    adminSection.style.display = 'none';
    adminSearchTriggered = false;
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('admin-password');
    const btn = document.querySelector('.password-toggle-btn');

    passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    btn.classList.toggle('visible', passwordInput.type === 'password');
}

async function loadProducts() {
    try {
        const loader = document.getElementById('loader');
        loader.style.display = 'inline-block';

        const res = await fetch(`${API_URL_BASE}/products`);
        console.log('Fetch products response:', res);

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        products = await res.json();

        products = products.map(product => ({
            ...product,
            id: product._id || product.id
        }));

        products.forEach(product => {
            console.log(`• ${product.id} - ${product.name}`);
        });

        console.log('Loaded products:', products.length);
        filterProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        loadSampleProducts();
    } finally {
        const loader = document.getElementById('loader');
        loader.style.display = 'none';
    }
}

function loadSampleProducts() {
    products = [
        {
            id: '1',
            name: 'Rose Bouquet',
            price: 29.99,
            category: 'Bouquet',
            description: 'Beautiful handmade paper roses',
            image: 'https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=400&auto=format&fit=crop'
        },
        {
            id: '2',
            name: 'Sunflower Single',
            price: 12.99,
            category: 'Single Flower',
            description: 'Vibrant paper sunflower',
            image: 'https://images.unsplash.com/photo-1560703650-ef3e0f254ae0?w-400&auto=format&fit=crop'
        },
        {
            id: '3',
            name: 'Mixed Flower Set',
            price: 49.99,
            category: 'Set',
            description: 'Assorted paper flowers set',
            image: 'https://images.unsplash.com/photo-1568259547666-6d3337325a1c?w-400&auto=format&fit=crop'
        }
    ];
    filterProducts();
}

function filterProducts() {
    const searchInput = document.getElementById('search-input');
    const searchValue = searchInput.value.toLowerCase();

    if (searchValue === 'admin') {
        checkForAdminSearch();
        return; // Don't filter products if searching for admin
    }

    let filtered = products.filter(p => currentCategory === 'all' || p.category === currentCategory);
    const search = document.getElementById('search-input').value.toLowerCase();
    if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search));

    const sort = document.getElementById('sort-select').value;
    if (sort === 'price-low') filtered.sort((a, b) => a.price - b.price);
    else if (sort === 'price-high') filtered.sort((a, b) => b.price - a.price);
    else if (sort === 'name-az') filtered.sort((a, b) => a.name.localeCompare(b.name));

    renderProducts(filtered);
}

function setCategory(cat, el) {
    currentCategory = cat;
    document.querySelectorAll('.products-controls button')
        .forEach(btn => btn.classList.remove('active'));
    el.classList.add('active');
    filterProducts();
}

function renderProducts(filtered) {
    const grid = document.getElementById('products-grid');

    if (!grid) {
        console.error('products-grid element not found');
        return;
    }

    if (filtered.length === 0) {
        grid.innerHTML = '<p class="no-products">No products found.</p>';
        return;
    }

    grid.innerHTML = filtered.map(p => `
        <div class="product-card" data-product-id="${p.id}">
            <div class="product-overlay">
                <img 
                    src="${p.image}" 
                    alt="${p.name}" 
                    class="product-image" 
                    loading="lazy"
                    data-modal-type="product"
                    data-modal-src="${p.image}"
                    data-modal-caption="${p.name}"
                >
                <div class="overlay">
                    <div class="product-info">
                        <div class="product-description">
                            <div class="product-name">${p.name}</div>
                            <div class="product-price">M${p.price.toFixed(2)}</div>
                            ${p.description ? `<div class="product-desc">${p.description}</div>` : ''}
                        </div>
                        <button class="btn cart-btn" data-action="add-to-cart" data-product-id="${p.id}" data-product-name="${p.name}" data-product-price="${p.price}">
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderGallery() {
    const galleryContainer = document.getElementById('galleryContainer');
    galleryContainer.innerHTML = galleryImages.map((img, index) => `
        <div class="gallery-item" data-gallery-index="${index}">
            <img src="${img}" alt="Gallery Image ${index + 1}">
            <div class="overlay">
                <span>Paper Flower ${index + 1}</span>
            </div>
        </div>
    `).join('');
}

function openModal(index) {
    const modal = document.getElementById('galleryModal');
    const modalImage = document.getElementById('modalImage');
    modalImage.src = galleryImages[index];
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// function closeModal() {
//     const modal = document.getElementById('galleryModal');
//     modal.classList.remove('active');
//     document.body.style.overflow = 'auto';
// }

function openModal(index, src, caption) {
    // For backward compatibility with gallery
    openImageModal(src, caption);
}

function openImageModal(src, caption) {
    const modal = document.getElementById('galleryModal');
    const modalImg = document.getElementById('modalImage');
    
    // Set image source
    modalImg.src = src;
    modalImg.alt = caption;
    
    // Create or update caption
    let captionEl = modal.querySelector('.modal-caption');
    if (!captionEl) {
        captionEl = document.createElement('p');
        captionEl.className = 'modal-caption';
        modal.querySelector('.modal-content').appendChild(captionEl);
    }
    captionEl.textContent = caption;
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('galleryModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    
    // Clear the image source to prevent showing old image on next open
    const modalImg = document.getElementById('modalImage');
    modalImg.src = '';
}

function addToCart(id, name, price) {
    const item = cart.find(i => i.id === id);
    if (item) item.qty++;
    else cart.push({ id, name, price, qty: 1 });
    saveCart();
    toast(`${name} added to cart`, true);
    trackAddToCart(id);
}

function updateQuantity(id, change) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.qty += change;
        if (item.qty <= 0) removeItem(id);
        else saveCart();
    }
}

function removeItem(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    const count = document.getElementById('cart-count');
    const itemsEl = document.getElementById('cart-items');
    const totalOrder = document.getElementById('order-total');
    const balOnDelivery = document.getElementById('balance-due');
    const totalEl = document.getElementById('cart-total');
    count.textContent = cart.reduce((sum, i) => sum + i.qty, 0);

    if (cart.length === 0) {
        itemsEl.innerHTML = '<p>Your cart is empty.</p>';
        totalEl.textContent = '0.00';
        return;
    }

    let total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const payments = calculatePayments(total);

    totalOrder.textContent = payments.total;
    balOnDelivery.textContent = payments.total - payments.deposit;

    totalEl.textContent = payments.deposit;

    const existingPaymentInfo = document.getElementById('payment-info');
    if (existingPaymentInfo) {
        existingPaymentInfo.remove();
    }

    itemsEl.innerHTML = cart.map(i => `
        <div class="cart-item" data-item-id="${i.id}">
            <div>${i.name} × ${i.qty} - M${(i.price * i.qty).toFixed(2)}</div>
            <div class="cart-item-controls">
                <button data-action="decrease-qty" data-item-id="${i.id}">-</button>
                <span>${i.qty}</span>
                <button data-action="increase-qty" data-item-id="${i.id}">+</button>
                <button data-action="remove-item" data-item-id="${i.id}" style="background:#e74c3c; color:white; margin-left:0.5rem;">✕</button>
            </div>
        </div>
    `).join('');
}

function toggleCart() {
    const cartEl = document.getElementById('cart');
    cartEl.style.display = cartEl.style.display === 'block' ? 'none' : 'block';
    updateCartUI();
}

async function pay(method) {
    if (cart.length === 0) {
        toast('Your cart is empty!');
        return;
    }

    const customerName = document.getElementById('name').value.trim(); 
    const phone = document.getElementById('phone').value.trim();
    if (!customerName || !phone) {
        toast('Please enter your name and phone number.');
        return;
    } 

    try {
        const orderItems = cart.map(item => {
            console.log('Cart item ID:', item.id, 'Type:', typeof item.id);
            
            // Find the corresponding product from the loaded products
            const fullProduct = products.find(p => {
                console.log('Comparing with product:', p.id, 'Type:', typeof p.id);
                return p.id === item.id;
            });
            
            if (!fullProduct) {
                console.warn(`Product with ID ${item.id} not found in loaded products`);
            }
            
            return {
                productId: item.id,
                // name: item.name,
                qty: item.qty
                // price: item.price
            };
        });

        console.log('Sending order items:', JSON.stringify(orderItems, null, 2));

        toggleCart();

        const loader = document.getElementById('order-loader');
        loader.style.display = 'flex';

        const res = await fetch(`${API_URL_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: orderItems,
                customerName,
                phone,
                paymentMethod: method
            })
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error('Order creation failed:', errorData);
            throw new Error(errorData.message || `Order creation failed (${res.status})`);
        }

        const responseData = await res.json();
        console.log('Order creation response:', responseData);
        
        // Extract data from response
        const orderId = responseData.orderId || responseData._id || responseData.id;
        const total = responseData.total || responseData.totalAmount || 0;
        const deposit = responseData.deposit || responseData.depositAmount || (total * 0.25);
        const payment = responseData.payment || responseData.paymentDetails || {};

        if (!orderId) {
            throw new Error('No order ID returned from server');
        }

        loader.style.display = 'none';
        
        trackOrderPlaced(orderId);

        // Update confirmation modal
        const modal = document.getElementById('orderConfirmationModal');
        const orderIdText = document.getElementById('orderIdText');
        const paymentNumberText = document.getElementById('paymentNumberText');
        const paymentInstructions = document.getElementById('paymentInstructions');
        
        orderIdText.textContent = `Order ID: ${orderId}`;
        
        // Set payment number based on method
        const paymentNumber = method === 'MPESA' ? '+26657932975' : '+26662806972';
        const paymentMethodName = method === 'MPESA' ? 'MPESA' : 'ECOCASH';
        paymentNumberText.textContent = `Payment Number: ${paymentNumber} (${paymentMethodName})`;
        
        // Set payment instructions
        paymentInstructions.textContent = payment.instructions || 
            `Please send M${deposit.toFixed(2)} (25% deposit) to ${paymentNumber} and include Order ID: ${orderId} as reference`;
        
        modal.style.display = 'flex';
        
        // Set up copy buttons
        document.getElementById('copyOrderIdBtn').onclick = () => {
            navigator.clipboard.writeText(orderId).then(() => toast('Order ID copied!'));
        };
        
        document.getElementById('copyPaymentNumberBtn').onclick = () => {
            navigator.clipboard.writeText(paymentNumber).then(() => toast('Payment Number copied!'));
        };

        document.getElementById('closeConfirmationBtn').onclick = () => {
            modal.style.display = 'none';
            cart = [];
            localStorage.removeItem('cart');
            updateCartUI();
        };

    } catch (error) {
        console.error('Error creating order:', error);
        toast('Error creating order: ' + error.message);
    }
}

function calculatePayments(total) {
    const deposit = total * 0.25; // 25% down payment
    const balance = total - deposit;
    return {
        total: total.toFixed(2),
        deposit: deposit.toFixed(2),
        balance: balance.toFixed(2)
    };
}

function toggleTrackOrder() {
    const modal = document.getElementById('trackOrderModal');
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';

    // Reset tracking results when opening
    if (modal.style.display === 'block') {
        document.getElementById('tracking-results').style.display = 'none';
        document.getElementById('order-id').value = '';
        document.getElementById('order-phone-no').value = '';
    }
}

function toggleMenu() {
    document.getElementById('nav-links').classList.toggle('active');
}

function hideNavbar() {
    const navbar = document.getElementById('navbar');
    navbar.classList.add('hidden');
}

function showNavbar() {
    const navbar = document.getElementById('navbar');
    navbar.classList.remove('hidden');
    clearTimeout(hideNavbarTimeout);
}

function handleNavbarVisibility() {
    const st = window.pageYOffset || document.documentElement.scrollTop;
    const navbar = document.getElementById('navbar');
    const navLinks = document.getElementById('nav-links');

    // Hide navbar on scroll down, show on scroll up
    if (st > lastScrollTop && st > 100) {
        navbar.classList.add('hidden');
    } else {
        navbar.classList.remove('hidden');
    }
    lastScrollTop = st <= 0 ? 0 : st;

    // Close mobile menu if open
    if (window.innerWidth <= 768 && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
    }
}

function submitReview(e) {
    e.preventDefault();

    const name = document.getElementById('review-name').value.trim();
    const email = document.getElementById('review-email').value.trim();
    const text = document.getElementById('review-text').value.trim();
    const rating = document.querySelector('input[name="rating"]:checked')?.value || '5';

    // Validation
    if (!name || !email || !text) {
        toast('Please fill in all required fields');
        return;
    }

    const newReview = {
        name,
        email,
        text,
        rating,
        stars: getStarsFromRating(rating), // Convert number to stars
        date: new Date().toISOString()
    };

    // Add to local array
    reviews.push(newReview);

    // Save to server
    saveReview(newReview)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save review');
            }
            return response.json();
        })
        .then(data => {
            e.target.reset();
            loadReviews();
            toast('Review submitted successfully!');
        })
        .catch(error => {
            console.error('Error:', error);
            toast('Failed to submit review. Please try again.');
        });
}

async function saveReview(review) {
    return fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review) // Send single review
    });
}

function getStarsFromRating(rating) {
    const numRating = parseInt(rating);
    return '★'.repeat(numRating) + '☆'.repeat(5 - numRating);
}

function loadReviews() {
    const list = document.getElementById('reviews-list');
    list.innerHTML = reviews.map(r => `
        <div class="review-card">
            <strong>${r.name}</strong><span class="stars"> ${r.stars}</span>
            <p>${r.text}</p>
        </div>
    `).join('');
}

async function trackOrder() {
    const orderIdInput = document.getElementById('order-id');
    const phoneInput = document.getElementById('order-phone-no');
    const resultsDiv = document.getElementById('tracking-results');
    const statusDiv = document.getElementById('order-status');
    const detailsDiv = document.getElementById('order-details');
    const timelineDiv = document.getElementById('tracking-timeline');

    const orderNumber = orderIdInput.value.trim();
    const phone = phoneInput.value.trim();

    // Basic client-side validation
    if (!orderNumber || !phone) {
        toast('Please enter both Order ID and phone number.');
        return;
    }

    // Clear previous results
    statusDiv.innerHTML = '';
    detailsDiv.innerHTML = '';
    timelineDiv.innerHTML = '';
    resultsDiv.style.display = 'none';

    try {
        const res = await fetch(`${API_URL_BASE}/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`);

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || 'Order not found or invalid details');
        }

        const order = await res.json();

        // Populate order status
        statusDiv.textContent = `Current Status: ${order.status}`;
        statusDiv.style.color = {
            'Processing': '#f39c12',
            'Shipped': '#3498db',
            'Delivered': '#27ae60',
            'Cancelled': '#e74c3c'
        }[order.status] || '#000';

        // Populate order details
        let itemsHtml = '<h4>Order Items</h4><ul>';
        let total = 0;
        order.items.forEach(item => {
            const subtotal = item.qty * item.price;
            total += subtotal;
            itemsHtml += `
                <li>
                    ${item.product.name} × ${item.qty} 
                    @ M${item.price.toFixed(2)} = M${subtotal.toFixed(2)}
                </li>`;
        });
        itemsHtml += '</ul>';
        itemsHtml += `<p><strong>Total Amount:</strong> M${total.toFixed(2)}</p>`;
        itemsHtml += `<p><strong>Customer:</strong> ${order.customerName}</p>`;
        itemsHtml += `<p><strong>Phone:</strong> ${order.phone}</p>`;
        itemsHtml += `<p><strong>Order ID:</strong> ${order.orderNumber}</p>`;
        itemsHtml += `<p><strong>Payment Method:</strong> ${order.payment.method} (${order.payment.status})</p>`;

        detailsDiv.innerHTML = itemsHtml;

        // Populate tracking timeline
        let timelineHtml = '<h4>Tracking Timeline</h4><div class="timeline">';
        order.tracking.forEach((entry, index) => {
            const date = new Date(entry.date).toLocaleString();
            timelineHtml += `
                <div class="timeline-entry">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <strong>${entry.status}</strong>
                        <p>${entry.description}</p>
                        <small>${date}</small>
                    </div>
                </div>`;
        });
        timelineHtml += '</div>';

        timelineDiv.innerHTML = timelineHtml;

        // Show results
        resultsDiv.style.display = 'block';
        toast('Order found and loaded successfully.');

    } catch (error) {
        console.error('Tracking error:', error);
        toast(`Error: ${error.message}`);
    }
}

function toast(msg, showViewCart = false) {
    const t = document.createElement('div');
    t.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#222; color:#fff; padding:1rem; border-radius:30px; z-index:2000; display:flex; align-items:center; gap:1rem; max-width: 90%; flex-wrap: wrap;';

    // Message text
    const msgSpan = document.createElement('span');
    msgSpan.textContent = msg;
    t.appendChild(msgSpan);

    // If showViewCart is true, add a "View Cart" button
    if (showViewCart) {
        const viewCartBtn = document.createElement('button');
        viewCartBtn.textContent = 'View Cart';
        viewCartBtn.style.cssText = 'background:#e74c3c; color:white; border:none; padding:0.5rem 1rem; border-radius:20px; cursor:pointer; font-weight:bold; transition:all 0.3s;';

        // Use event listener instead of inline onclick
        viewCartBtn.addEventListener('mouseover', function () {
            this.style.background = '#ff7b7f';
        });
        viewCartBtn.addEventListener('mouseout', function () {
            this.style.background = '#e74c3c';
        });
        viewCartBtn.addEventListener('click', function () {
            toggleCart();
            t.remove();
        });

        t.appendChild(viewCartBtn);
    }

    document.body.appendChild(t);

    // Remove toast after 7 seconds
    setTimeout(() => {
        if (t.parentNode) {
            t.remove();
        }
    }, 7000);
}

window.addEventListener('scroll', handleNavbarVisibility);

document.addEventListener('click', (e) => {
    const navbar = document.getElementById('navbar');
    const navLinks = document.getElementById('nav-links');
    const cartEl = document.getElementById('cart');
    const trackOrderModal = document.getElementById('trackOrderModal');
    const hamburger = document.querySelector('.hamburger');

    // Check if click is outside navbar, cart, or hamburger
    if (!navbar.contains(e.target) && !cartEl.contains(e.target) && !trackOrderModal.contains(e.target) && e.target !== hamburger) {
        // Hide navbar on click outside
        if (window.innerWidth <= 768) {
            navLinks.classList.remove('active');
        } else {
            // Schedule navbar hide on desktop
            clearTimeout(hideNavbarTimeout);
            hideNavbarTimeout = setTimeout(hideNavbar, 2000);
        }
    } else {
        showNavbar();
    }

    const target = e.target;

    if (target.matches('[data-action="add-to-cart"]') || target.closest('[data-action="add-to-cart"]')) {
        const btn = target.matches('[data-action="add-to-cart"]') ? target : target.closest('[data-action="add-to-cart"]');
        const id = btn.dataset.productId;
        const name = btn.dataset.productName;
        const price = parseFloat(btn.dataset.productPrice);
        addToCart(id, name, price);
    }

    else if (target.matches('[data-action="increase-qty"]')) {
        const id = target.dataset.itemId;
        updateQuantity(id, 1);
    }
    else if (target.matches('[data-action="decrease-qty"]')) {
        const id = target.dataset.itemId;
        updateQuantity(id, -1);
    }
    else if (target.matches('[data-action="remove-item"]')) {
        const id = target.dataset.itemId;
        removeItem(id);
    }

    else if (target.closest('.gallery-item')) {
        const galleryItem = target.closest('.gallery-item');
        const index = parseInt(galleryItem.dataset.galleryIndex);
        openModal(index);
    }

    else if (target.tagName === 'IMG' && target.hasAttribute('data-modal-src')) {
        const src = target.getAttribute('data-modal-src');
        const caption = target.getAttribute('data-modal-caption') || '';
        
        const modal = document.getElementById('galleryModal');
        const modalImg = document.getElementById('modalImage');
        
        modalImg.src = src;
        modalImg.alt = caption;
        
        // Optional: add caption below image
        let captionEl = modal.querySelector('.modal-caption');
        if (!captionEl) {
            captionEl = document.createElement('p');
            captionEl.className = 'modal-caption';
            captionEl.style.color = 'white';
            captionEl.style.marginTop = '1rem';
            captionEl.style.fontSize = '1.2rem';
            modal.querySelector('.modal-content').appendChild(captionEl);
        }
        captionEl.textContent = caption;
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Handle gallery item clicks
    // else if (target.closest('.gallery-item')) {
    //     const galleryItem = target.closest('.gallery-item');
    //     const index = parseInt(galleryItem.dataset.galleryIndex);
    //     openModal(index, galleryImages[index], ``);
    // }

    // Handle product image clicks (new)
    else if (target.classList.contains('product-image') && target.hasAttribute('data-modal-src')) {
        const src = target.getAttribute('data-modal-src');
        const caption = target.getAttribute('data-modal-caption') || '';
        const productId = target.closest('.product-card')?.dataset.productId;
        
        if (productId) {
            trackProductView(productId);
        }
        
        openImageModal(src, caption);
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        toggleTrackOrder();
    }

    // Handle modal outside click
    const galleryModal = document.getElementById('galleryModal');
    if (galleryModal) {
        galleryModal.addEventListener('click', function (e) {
            if (e.target === this || e.target.classList.contains('modal-close')) {
                closeModal();
            }
        });
    }
});

document.addEventListener('mousemove', (e) => {
    const navbar = document.getElementById('navbar');
    if (navbar.contains(e.target)) {
        showNavbar();
    }
});

window.addEventListener('scroll', () => {
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        backToTop.style.display = window.scrollY > 400 ? 'flex' : 'none';
    }
});

document.getElementById('admin-login').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;

    try {
        const res = await fetch(`${API_URL_BASE}/admin/login`, {  // Fixed here
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        if (res.ok) {
            try {
                const data = await res.json();
                localStorage.setItem('adminToken', data.token);
                window.location.href = '/admin.html';
            } catch (e) {
                alert('Login failed. Please check your credentials.');
                console.error('Login response parsing error:', e);
            }
        } else {
            const errorText = await res.text();
            console.error('Login failed:', res.status, errorText);
            alert(`Login failed (${res.status}): ${errorText || 'Please check your credentials.'}`);
        }
    } catch (error) {
        console.error('Network error during login:', error);
        alert('Network error. Please check if the server is running.');
    }
});

function init() {
    trackPageView();
    loadProducts();
    renderGallery();
    updateCartUI();
    loadReviews();

    // Add event listeners for static elements
    document.getElementById('search-input').addEventListener('input', filterProducts);
    document.getElementById('sort-select').addEventListener('change', filterProducts);

    // Add event listener for category buttons
    document.querySelectorAll('.products-controls button[data-category]').forEach(btn => {
        btn.addEventListener('click', function () {
            const category = this.dataset.category;
            setCategory(category, this);
        });
    });

    // Add event listener for cart toggle
    const cartToggleBtn = document.getElementById('cart-toggle-btn');
    if (cartToggleBtn) {
        cartToggleBtn.addEventListener('click', toggleCart);
    }

    const cartCloseBtn = document.getElementById('cart-close-btn');
    if (cartCloseBtn) {
        cartCloseBtn.addEventListener('click', toggleCart);
    }

    // Add event listener for track order
    const trackOrderBtn = document.getElementById('track-order-btn');
    if (trackOrderBtn) {
        trackOrderBtn.addEventListener('click', toggleTrackOrder);
    }

    const trackOrderCloseBtn = document.getElementById('track-order-close-btn');
    if (trackOrderCloseBtn) {
        trackOrderCloseBtn.addEventListener('click', toggleTrackOrder);
    }

    const trackOrderSubmitBtn = document.getElementById('track-order-submit-btn');
    if (trackOrderSubmitBtn) {
        trackOrderSubmitBtn.addEventListener('click', trackOrder);
    }

    // Add event listener for payment buttons
    document.querySelectorAll('[data-payment-method]').forEach(btn => {
        btn.addEventListener('click', function () {
            const method = this.dataset.paymentMethod;
            pay(method);
        });
    });

    // Add event listener for shop collection button
    const shopCollectionBtn = document.getElementById('shop-collection-btn');
    if (shopCollectionBtn) {
        shopCollectionBtn.addEventListener('click', function () {
            document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Add event listener for modal close button
    const modalCloseBtn = document.getElementById('modal-close-btn');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
    }

    // Add event listener for review form
    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', submitReview);
    }

    // Add event listener for contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            toast('Contact form submitted! We\'ll get back to you soon.');
            this.reset();
        });
    }

    // Add event listener for back to top button
    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Add event listener for hamburger menu
    const hamburgerMenu = document.getElementById('hamburger-menu');
    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', toggleMenu);
    }

    // Handle gallery modal outside click
    const galleryModal = document.getElementById('galleryModal');
    if (galleryModal) {
        galleryModal.addEventListener('click', function (e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }

    const passwordToggleBtn = document.getElementById('password-toggle-btn');
    if (passwordToggleBtn) {
        passwordToggleBtn.addEventListener('click', togglePasswordVisibility);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
