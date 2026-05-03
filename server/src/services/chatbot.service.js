/**
 * EmPay AI Chatbot Service
 * Main orchestrator for the AI assistant.
 * Supports Groq (default) and Google Gemini as LLM providers.
 * Handles tool calls, role-based access, and query execution.
 */
const env = require('../config/env');
const { query } = require('../config/db');
const { buildSystemPrompt } = require('../utils/chatbot/systemPrompt');
const { validateQuery } = require('../utils/chatbot/queryValidator');
const EmployeeModel = require('../models/employee.model');
const CompanyModel = require('../models/company.model');
const TimeOffService = require('./timeoff.service');

// ─── Tool Definitions (OpenAI-compatible format, used by Groq) ──
const openAITools = [
  {
    type: 'function',
    function: {
      name: 'run_read_query',
      description: 'Execute a read-only SELECT query against the EmPay PostgreSQL database. Use this to look up employee data, attendance records, time-off balances, payroll info etc. The query MUST be a valid PostgreSQL SELECT statement. Always filter by company_id for security. For employee-role users, always filter by their employee_id.',
      parameters: {
        type: 'object',
        properties: {
          sql: {
            type: 'string',
            description: 'A valid PostgreSQL SELECT query. Must include company_id filter for security.',
          },
        },
        required: ['sql'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'approve_timeoff',
      description: 'Approve a pending time-off request. Only admin, hr_officer, and payroll_officer can use this. Provide the time-off request UUID.',
      parameters: {
        type: 'object',
        properties: {
          request_id: {
            type: 'string',
            description: 'The UUID of the time-off request to approve.',
          },
        },
        required: ['request_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'reject_timeoff',
      description: 'Reject a pending time-off request. Only admin, hr_officer, and payroll_officer can use this. Provide the time-off request UUID.',
      parameters: {
        type: 'object',
        properties: {
          request_id: {
            type: 'string',
            description: 'The UUID of the time-off request to reject.',
          },
        },
        required: ['request_id'],
      },
    },
  },
];

// ─── Tool Execution Handlers ────────────────────────────────

async function handleRunReadQuery(sql, role, companyId, employeeId) {
  const validation = validateQuery(sql, role, companyId, employeeId);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }
  try {
    const result = await query(validation.sanitizedSql);
    return { success: true, row_count: result.rows.length, data: result.rows };
  } catch (err) {
    console.error('Chatbot query error:', err.message);
    return { success: false, error: `Query failed: ${err.message}` };
  }
}

async function handleApproveTimeoff(requestId, userId, role) {
  if (!['admin', 'hr_officer', 'payroll_officer'].includes(role)) {
    return { success: false, error: 'You do not have permission to approve time-off requests.' };
  }
  try {
    const result = await TimeOffService.approveRequest(requestId, userId);
    return { success: true, message: 'Time-off request approved successfully.', data: result };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function handleRejectTimeoff(requestId, userId, role) {
  if (!['admin', 'hr_officer', 'payroll_officer'].includes(role)) {
    return { success: false, error: 'You do not have permission to reject time-off requests.' };
  }
  try {
    const result = await TimeOffService.rejectRequest(requestId, userId);
    return { success: true, message: 'Time-off request rejected successfully.', data: result };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function executeTool(toolName, args, context) {
  switch (toolName) {
    case 'run_read_query':
      return handleRunReadQuery(args.sql, context.role, context.companyId, context.employeeId);
    case 'approve_timeoff':
      return handleApproveTimeoff(args.request_id, context.userId, context.role);
    case 'reject_timeoff':
      return handleRejectTimeoff(args.request_id, context.userId, context.role);
    default:
      return { success: false, error: `Unknown tool: ${toolName}` };
  }
}

// ─── Groq Provider ──────────────────────────────────────────

async function chatWithGroq(systemPrompt, message, conversationHistory, context) {
  const Groq = require('groq-sdk');
  const groq = new Groq({ apiKey: env.groqApiKey });

  // Build messages array
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    })),
    { role: 'user', content: message },
  ];

  const actions = [];
  const MAX_TOOL_ROUNDS = 5;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const completion = await groq.chat.completions.create({
      model: env.groqModel,
      messages,
      tools: openAITools,
      tool_choice: 'auto',
      temperature: 0.3,
      max_tokens: 2048,
    });

    const choice = completion.choices[0];

    // If the model wants to call tools
    if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
      // Add the assistant's tool-call message to history
      messages.push(choice.message);

      for (const toolCall of choice.message.tool_calls) {
        const { name, arguments: argsStr } = toolCall.function;
        let args;
        try {
          args = JSON.parse(argsStr);
        } catch {
          args = {};
        }

        console.log(`🤖 Chatbot tool call: ${name}`, JSON.stringify(args).substring(0, 200));
        const result = await executeTool(name, args, context);
        actions.push({ tool: name, args, data: result.data, result: { success: result.success } });

        const llmResult = name === 'run_read_query' 
          ? { success: result.success, message: "Query executed successfully. Data rendered locally. Do not summarize it." }
          : result;

        // Add the tool result back
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(llmResult),
        });
      }
      // Continue loop — Groq will process the tool results
      continue;
    }

    // No tool calls — we have the final text
    return {
      reply: choice.message.content || 'I couldn\'t generate a response. Please try again.',
      actions,
    };
  }

  // Fallback if max rounds exceeded
  return { reply: 'I processed your request but reached the maximum number of steps. Please try a simpler question.', actions };
}

// ─── Gemini Provider ────────────────────────────────────────

async function chatWithGemini(systemPrompt, message, conversationHistory, context) {
  const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(env.geminiApiKey);

  // Convert tools to Gemini format
  const geminiTools = [{
    functionDeclarations: openAITools.map(t => ({
      name: t.function.name,
      description: t.function.description,
      parameters: {
        type: SchemaType.OBJECT,
        properties: Object.fromEntries(
          Object.entries(t.function.parameters.properties).map(([k, v]) => [k, { type: SchemaType.STRING, description: v.description }])
        ),
        required: t.function.parameters.required,
      },
    })),
  }];

  const model = genAI.getGenerativeModel({
    model: env.geminiModel,
    systemInstruction: systemPrompt,
    tools: geminiTools,
  });

  const history = conversationHistory.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({ history });

  const sendWithRetry = async (msg, retries = 2) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await chat.sendMessage(msg);
      } catch (err) {
        if (err.message && err.message.includes('429') && attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 3000));
        } else {
          throw err;
        }
      }
    }
  };

  let response = await sendWithRetry(message);
  const actions = [];
  const MAX_TOOL_ROUNDS = 5;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const candidate = response.response.candidates?.[0];
    if (!candidate) break;

    const parts = candidate.content?.parts || [];
    const functionCalls = parts.filter(p => p.functionCall);
    if (functionCalls.length === 0) break;

    const toolResponses = [];
    for (const part of functionCalls) {
      const { name, args } = part.functionCall;
      console.log(`🤖 Chatbot tool call: ${name}`, JSON.stringify(args).substring(0, 200));
      const result = await executeTool(name, args, context);
      actions.push({ tool: name, args, data: result.data, result: { success: result.success } });
      
      const llmResult = name === 'run_read_query' 
          ? { success: result.success, message: "Query executed successfully. Data rendered locally. Do not summarize it." }
          : result;

      toolResponses.push({ functionResponse: { name, response: llmResult } });
    }

    response = await sendWithRetry(toolResponses);
  }

  return { reply: response.response.text(), actions };
}

// ─── Main Chat Service ──────────────────────────────────────

const ChatbotService = {
  async chat(user, message, conversationHistory = []) {
    // 1. Determine which provider to use
    const useGroq = !!env.groqApiKey;
    const useGemini = !!env.geminiApiKey && !useGroq; // Groq takes priority if both are set

    if (!useGroq && !useGemini) {
      throw Object.assign(new Error('No AI API key configured. Set GROQ_API_KEY or GEMINI_API_KEY in .env'), { status: 500 });
    }

    // 2. Gather user context
    const employee = await EmployeeModel.findByUserId(user.id);
    if (!employee) {
      throw Object.assign(new Error('Employee profile not found'), { status: 404 });
    }

    const company = await CompanyModel.findById(user.company_id);

    // 3. Build system prompt
    const systemPrompt = buildSystemPrompt({
      role: user.role,
      companyName: company ? company.name : 'Unknown',
      employeeId: employee.id,
      userId: user.id,
      employeeName: `${employee.first_name} ${employee.last_name}`,
      companyId: user.company_id,
    });

    // 4. Build context for tool execution
    const context = {
      role: user.role,
      companyId: user.company_id,
      employeeId: employee.id,
      userId: user.id,
    };

    // 5. Dispatch to provider
    const provider = useGroq ? 'Groq' : 'Gemini';
    console.log(`🤖 Chatbot using ${provider} | User: ${employee.first_name} (${user.role})`);

    if (useGroq) {
      return chatWithGroq(systemPrompt, message, conversationHistory, context);
    } else {
      return chatWithGemini(systemPrompt, message, conversationHistory, context);
    }
  },
};

module.exports = ChatbotService;
