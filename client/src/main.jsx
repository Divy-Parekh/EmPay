import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster, ToastBar, toast } from 'react-hot-toast';
import { X } from 'lucide-react';
import App from './App';
import { Provider } from 'react-redux';
import { store } from './store';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          containerStyle={{
            top: 74,
          }}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1E293B',
              color: '#F8FAFC',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '12px 16px',
              maxWidth: '400px',
            },
            success: {
              iconTheme: { primary: '#10B981', secondary: '#F8FAFC' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: '#F8FAFC' },
            },
          }}
        >
          {(t) => (
            <ToastBar toast={t}>
              {({ icon, message }) => (
                <>
                  {icon}
                  <div className="flex-1 px-2">{message}</div>
                  {t.type !== 'loading' && (
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      className="ml-2 p-1 rounded-full hover:bg-[var(--bg-card-hover)] transition-colors text-[var(--text-secondary)]"
                    >
                      <X size={14} />
                    </button>
                  )}
                </>
              )}
            </ToastBar>
          )}
        </Toaster>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
