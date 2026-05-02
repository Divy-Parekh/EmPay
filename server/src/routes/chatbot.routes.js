/**
 * EmPay AI Chatbot Routes
 * POST /api/chat — Send a message, get AI response
 */
const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const ChatbotService = require('../services/chatbot.service');

const router = Router();

/**
 * POST /api/chat
 * Body: { message: string, history?: [{ role: 'user'|'assistant', content: string }] }
 * Response: { success: true, data: { reply: string, actions: Array } }
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Message is required' },
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Message is too long (max 2000 characters)' },
      });
    }

    const result = await ChatbotService.chat(
      req.user,
      message.trim(),
      Array.isArray(history) ? history : []
    );

    return res.json({
      success: true,
      data: {
        reply: result.reply,
        actions: result.actions,
      },
    });
  } catch (err) {
    console.error('Chatbot error:', err.message);

    // Friendly error for rate limiting
    if (err.message && err.message.includes('429')) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'The AI assistant is temporarily busy. Please try again in a few seconds.',
        },
      });
    }

    // Friendly error for API key issues
    if (err.message && (err.message.includes('API_KEY') || err.message.includes('401'))) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'AI_UNAVAILABLE',
          message: 'The AI assistant is currently unavailable. Please try again later.',
        },
      });
    }

    return res.status(err.status || 500).json({
      success: false,
      error: {
        code: err.code || 'CHATBOT_ERROR',
        message: err.message || 'An error occurred while processing your request',
      },
    });
  }
});

module.exports = router;
