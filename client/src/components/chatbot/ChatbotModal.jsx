import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, Mic, MicOff } from 'lucide-react';
import { chatbotApi } from '../../api/chatbot.api';
import toast from 'react-hot-toast';

export default function ChatbotModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am the EmPay AI Assistant. How can I help you today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setMessage(prev => (prev + ' ' + transcript).trim());
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Voice input is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e?.preventDefault();
    
    if (!message.trim() || isLoading) return;

    const userMsg = message.trim();
    setMessage('');
    
    // Add user message to state
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Send to backend (pass history excluding the first greeting to save tokens if desired, but passing all is fine)
      const res = await chatbotApi.chat(userMsg, newMessages.slice(0, -1));
      
      if (res.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply, actions: res.data.actions }]);
      } else {
        toast.error(res.error?.message || 'Failed to get response');
        // Optionally remove the user message if it failed, or add an error message
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
      }
    } catch (error) {
      toast.error('Connection error');
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Background Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60] transition-all duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => setIsOpen(false)}
      />

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all duration-300 z-[70] flex items-center justify-center 
          bg-[var(--color-primary)] text-white hover:scale-125 active:scale-95 animate-chatbot
          ${isOpen ? 'opacity-0 pointer-events-none scale-75' : 'opacity-100'}
        `}
        aria-label="Open AI Assistant"
      >
        <MessageSquare size={28} />
      </button>

      {/* Chatbot Modal */}
      <div 
        className={`fixed bottom-6 right-6 w-[380px] h-[600px] max-h-[80vh] flex flex-col rounded-3xl shadow-2xl z-[70] transition-all duration-300 transform origin-bottom-right
          bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden
          ${isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-75 opacity-0 pointer-events-none'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] bg-[var(--color-primary)] text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm">EmPay Assistant</h3>
              <p className="text-[10px] text-white/70 uppercase tracking-wider font-black">AI Powered</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--bg-body)]">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
                  ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-600'}
                `}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                
                <div className={`p-3 rounded-2xl text-sm leading-relaxed w-full overflow-hidden
                  ${msg.role === 'user' 
                    ? 'bg-[var(--color-primary)] text-white rounded-tr-sm' 
                    : 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-tl-sm shadow-sm'
                  }
                `}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  
                  {/* Action Renderers (Semantic Layer Data) */}
                  {msg.actions && msg.actions.map((action, aIdx) => {
                    if (action.tool === 'run_read_query' && action.data && action.data.length > 0) {
                      const columns = Object.keys(action.data[0]);
                      return (
                        <div key={aIdx} className="mt-3 overflow-x-auto rounded-lg border border-[var(--border-color)] bg-[var(--bg-body)]">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-900 text-white uppercase font-bold">
                              <tr>
                                {columns.map(col => (
                                  <th key={col} className="px-3 py-2 whitespace-nowrap">{col.replace(/_/g, ' ')}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/20">
                              {action.data.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-100/10 transition-colors">
                                  {columns.map(col => {
                                    let val = row[col];
                                    if (typeof val === 'boolean') val = val ? 'Yes' : 'No';
                                    else if (val === null || val === undefined) val = '-';
                                    else if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T/)) {
                                      val = new Date(val).toLocaleDateString();
                                    }
                                    return (
                                      <td key={col} className="px-3 py-2 whitespace-nowrap">{String(val)}</td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    }
                    if (action.tool === 'run_read_query' && action.data && action.data.length === 0) {
                      return <div key={aIdx} className="mt-2 text-xs italic opacity-70">No data found.</div>;
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex-shrink-0 flex items-center justify-center">
                  <Bot size={16} />
                </div>
                <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-tl-sm shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[var(--bg-card)] border-t border-[var(--border-color)]">
          <form 
            onSubmit={handleSend}
            className="flex items-center gap-2 bg-[var(--bg-body)] border border-[var(--border-color)] p-1 rounded-2xl focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all"
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 bg-transparent border-none outline-none px-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={toggleListening}
              disabled={isLoading}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50
                ${isListening 
                  ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 animate-pulse' 
                  : 'text-[var(--text-muted)] hover:text-emerald-500 hover:bg-emerald-500/10'
                }
              `}
              title="Voice Input"
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="w-10 h-10 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center disabled:opacity-50 hover:bg-emerald-600 transition-colors"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-1" />}
            </button>
          </form>
          <div className="text-center mt-2">
            <p className="text-[10px] text-[var(--text-muted)] font-medium">AI can make mistakes. Verify important info.</p>
          </div>
        </div>
      </div>
    </>
  );
}
