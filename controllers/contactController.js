const Contact = require('../models/Contact');
const { asyncHandler } = require('../middleware/errorMiddleware');
const UAParser = require('ua-parser-js');
const geoip = require('geoip-lite');
const requestIp = require('request-ip');

/**
 * @desc Create a contact message (public)
 * @route POST /api/contacts
 * @access Public
 */
const createContact = asyncHandler(async (req, res) => {
  const { fullName, email, contactNumber, qualification, message } = req.body || {};

  if (!fullName || !email) {
    return res.status(400).json({ success: false, message: 'Name and email are required' });
  }

  try {
    // Prevent duplicate submissions: same email OR same message within 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const emailDup = await Contact.findOne({
      email: email,
      createdAt: { $gte: twentyFourHoursAgo }
    }).select('_id createdAt');
    const messageDup = await Contact.findOne({
      message: message,
      createdAt: { $gte: twentyFourHoursAgo }
    }).select('_id createdAt');

    if (emailDup || messageDup) {
      const msg = emailDup
        ? 'You have already submitted from this email recently'
        : 'You have already submitted a similar message recently';
      return res.status(409).json({ success: false, message: msg });
    }

    // Preserve existing raw user-agent and ip behavior, but enrich with parsed fields
    const rawUA = req.get('User-Agent') || '';
    const parser = new UAParser(rawUA);
    const ua = parser.getResult();

    const browser = ua.browser && ua.browser.name ? `${ua.browser.name}${ua.browser.version ? ' ' + ua.browser.version : ''}` : '';
    const os = ua.os && ua.os.name ? `${ua.os.name}${ua.os.version ? ' ' + ua.os.version : ''}` : '';
    let device = 'Desktop';
    if (ua.device && ua.device.type) {
      const t = String(ua.device.type).toLowerCase();
      if (t === 'mobile') device = 'Mobile';
      else if (t === 'tablet') device = 'Tablet';
      else device = t.charAt(0).toUpperCase() + t.slice(1);
    }

    // Determine client IP (prefer request-ip, fallback to req.ip / x-forwarded-for)
    const ip = (requestIp.getClientIp(req) || req.ip || (req.headers['x-forwarded-for'] || '').split(',')[0] || '').trim();

    // Lookup country via geoip-lite (returns country code like 'IN') and convert to full name when possible
    const geo = ip ? geoip.lookup(ip) : null;
    let country = '';
    if (geo && geo.country) {
      try {
        country = typeof Intl !== 'undefined' && Intl.DisplayNames ? new Intl.DisplayNames(['en'], { type: 'region' }).of(geo.country) : geo.country;
      } catch (e) {
        country = geo.country;
      }
    }

    const contact = await Contact.create({
      fullName,
      email,
      contactNumber,
      qualification,
      message,
      ip: ip || req.ip,
      userAgent: rawUA,
      browser,
      os,
      device,
      country
    });

    res.status(201).json({ success: true, message: 'Message received', data: contact });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: Object.values(error.errors).map(e => e.message) });
    }
    throw error;
  }
});

/**
 * @desc Get contacts (admin)
 * @route GET /api/contacts
 * @access Private/Admin
 */
const getContacts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 100 } = req.query;
  const skip = (page - 1) * limit;

  const contacts = await Contact.find()
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .lean();

  const total = await Contact.countDocuments();

  res.status(200).json({ success: true, count: contacts.length, total, data: contacts });
});

/**
 * @desc Delete a contact (admin)
 * @route DELETE /api/contacts/:id
 * @access Private/Admin
 */
const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id);
  if (!contact) {
    return res.status(404).json({ success: false, message: 'Contact not found' });
  }

  await Contact.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Contact deleted' });
});

module.exports = { createContact, getContacts, deleteContact };
