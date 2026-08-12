require('express-async-errors'); // lets async route handler throws reach error middleware
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const clientRoutes = require('./routes/client.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const itemRoutes = require('./routes/item.routes');
const companyProfileRoutes = require('./routes/companyProfile.routes');
const recurringRoutes = require('./routes/recurring.routes');
const commissionRoutes = require('./routes/commission.routes');
const purchaseInvoiceRoutes = require('./routes/purchaseInvoice.routes');
const { errorHandler, notFound } = require('./middleware/error.middleware');
const { apiLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');

const app = express();

// Behind a reverse proxy (Render/Railway/Heroku/Nginx) so req.ip and
// secure cookies work correctly.
app.set('trust proxy', 1);

// --- Security headers ---
app.use(helmet());

// --- CORS: only allow the configured frontend origin(s), with credentials for cookies ---
const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);

// --- Body parsing (limited size to prevent payload-based DoS) ---
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// --- Sanitization against NoSQL injection & HTTP parameter pollution ---
app.use(mongoSanitize());
app.use(hpp());

// --- Performance ---
app.use(compression());

// --- Logging ---
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
}

// --- Rate limiting on all API routes ---
app.use('/api', apiLimiter);

// --- Health check (for uptime monitors / load balancers) ---
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'ok', uptime: process.uptime() });
});

// --- Routes ---
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/items', itemRoutes);
app.use('/api/v1/company-profiles', companyProfileRoutes);
app.use('/api/v1/recurring', recurringRoutes);
app.use('/api/v1/purchase-invoices', purchaseInvoiceRoutes);
app.use('/api/v1/commissions', commissionRoutes);

app.all('*', notFound);
app.use(errorHandler);

module.exports = app;