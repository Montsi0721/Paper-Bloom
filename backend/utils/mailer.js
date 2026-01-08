import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.MAIL_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    }
});

/**
 * Send order notification to admin
 * @param {Object} order - Order object from database
 * @param {Array} itemDetails - Array of item details with names
 * @returns {Promise<Object>} - Result object with success status
 */
export const sendOrderMail = async (order, itemDetails) => {
    const adminEmail = process.env.MAIL_USER;
    
    const itemsHtml = itemDetails.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${item.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">M${item.price.toFixed(2)}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">M${item.total.toFixed(2)}</td>
        </tr>
    `).join('');

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: #e74c3c; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">New Order Received!</h1>
            </div>
            
            <div style="padding: 30px;">
                <h2 style="color: #2d3748; margin-top: 0;">Order #${order.orderNumber}</h2>
                
                <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #4a5568; margin-top: 0;">Customer Information</h3>
                    <p style="margin: 5px 0;"><strong>Name:</strong> ${order.customerName}</p>
                    <p style="margin: 5px 0;"><strong>Phone:</strong> ${order.phone}</p>
                    <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${order.payment.method}</p>
                    <p style="margin: 5px 0;"><strong>Payment Status:</strong> 
                        <span style="color: #f59e0b; font-weight: bold;">${order.payment.status}</span>
                    </p>
                </div>

                <h3 style="color: #4a5568;">Order Items</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                        <tr style="background: #edf2f7;">
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e0;">Product</th>
                            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #cbd5e0;">Qty</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #cbd5e0;">Price</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #cbd5e0;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div style="background: #ebf8ff; padding: 20px; border-radius: 8px; border-left: 4px solid #4299e1;">
                    <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                        <span><strong>Total Amount:</strong></span>
                        <span style="font-size: 18px; font-weight: bold; color: #2b6cb0;">M${order.total.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 10px 0; color: #059669;">
                        <span><strong>25% Deposit Required:</strong></span>
                        <span style="font-size: 16px; font-weight: bold;">M${order.payment.depositAmount.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                        <span><strong>Balance on Delivery:</strong></span>
                        <span style="font-size: 16px;">M${order.payment.balanceDue.toFixed(2)}</span>
                    </div>
                </div>

                <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <p style="margin: 0; color: #856404;">
                        <strong>Action Required:</strong> Waiting for customer to send 25% deposit via ${order.payment.method}
                    </p>
                </div>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                    <p style="color: #718096; font-size: 14px; margin: 5px 0;">
                        Order created: ${new Date(order.createdAt).toLocaleString()}
                    </p>
                    <p style="color: #718096; font-size: 14px; margin: 5px 0;">
                        <a href="${process.env.ADMIN_URL || 'http://localhost:5000/admin.html'}" 
                           style="color: #e74c3c; text-decoration: none;">
                            View in Admin Panel →
                        </a>
                    </p>
                </div>
            </div>
        </div>
    `;

    try {
        const info = await transporter.sendMail({
            from: '"PaperBloom Orders" <no-reply@paperbloom.com>',
            to: adminEmail,
            subject: `New Order #${order.orderNumber} - ${order.customerName}`,
            html
        });
        
        console.log('Admin notification email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Failed to send admin notification email:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send email with error handling
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @param {string} [text] - Plain text fallback
 * @returns {Promise<Object>} - Result object with success status
 */
export const sendEmail = async (to, subject, html, text = '') => {
    try {
        const info = await transporter.sendMail({
            from: '"PaperBloom" <no-reply@paperbloom.com>',
            to,
            subject,
            text: text || html.replace(/<[^>]*>/g, ''),
            html
        });
        
        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email sending failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send order confirmation template to customer
 * @param {string} to - Customer email
 * @param {Object} order - Order details
 * @returns {Promise<Object>} - Send result
 */
export const sendOrderConfirmation = async (to, order) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a5568;">Order Confirmation</h2>
            <p>Thank you for your order!</p>
            
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px;">
                <h3 style="color: #2d3748;">Order Details</h3>
                <p><strong>Order ID:</strong> ${order.orderNumber}</p>
                <p><strong>Customer:</strong> ${order.customerName}</p>
                <p><strong>Total:</strong> M${order.total.toFixed(2)}</p>
                <p><strong>Status:</strong> ${order.status}</p>
                
                <h4 style="margin-top: 20px;">Items:</h4>
                <ul>
                    ${order.items.map(item => `
                        <li>${item.qty}x Product - M${item.price.toFixed(2)} each</li>
                    `).join('')}
                </ul>
            </div>
            
            <p style="margin-top: 20px;">
                You can track your order status by visiting our website.
            </p>
            
            <p style="color: #718096; font-size: 14px; margin-top: 30px;">
                Best regards,<br>
                The PaperBloom Team
            </p>
        </div>
    `;

    return sendEmail(to, 'Your PaperBloom Order Confirmation', html);
};

/**
 * Send order status update
 * @param {string} to - Customer email
 * @param {Object} order - Order details
 * @param {string} newStatus - Updated status
 * @returns {Promise<Object>} - Send result
 */
export const sendStatusUpdate = async (to, order, newStatus) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a5568;">Order Status Update</h2>
            <p>Your order status has been updated:</p>
            
            <div style="background: #ebf8ff; padding: 20px; border-radius: 8px; border-left: 4px solid #4299e1;">
                <h3 style="color: #2d3748;">Order #${order.orderNumber}</h3>
                <p><strong>New Status:</strong> <span style="color: #2b6cb0; font-weight: bold;">${newStatus}</span></p>
                <p><strong>Customer:</strong> ${order.customerName}</p>
                <p><strong>Phone:</strong> ${order.phone}</p>
            </div>
            
            <p style="margin-top: 20px;">
                ${newStatus === 'Shipped' ? 
                    'Your order has been shipped and is on its way!' :
                    newStatus === 'Delivered' ?
                    'Your order has been delivered. Thank you for shopping with us!' :
                    `Your order is now ${newStatus}. We'll notify you of further updates.`
                }
            </p>
            
            <p style="color: #718096; font-size: 14px; margin-top: 30px;">
                Best regards,<br>
                The PaperBloom Team
            </p>
        </div>
    `;

    return sendEmail(to, `Order #${order.orderNumber} Status Update: ${newStatus}`, html);
};

export const testEmail = async () => {
    try {
        const result = await transporter.verify();
        console.log('Email server is ready:', result);
        return true;
    } catch (error) {
        console.error('Email server connection failed:', error);
        return false;
    }
};

export default transporter;