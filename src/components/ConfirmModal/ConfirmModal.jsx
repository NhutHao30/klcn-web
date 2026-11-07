import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import './ConfirmModal.css';

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
  const [dialogState, setDialogState] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialogState({
        title: options.title || 'Xác nhận thao tác',
        subtitle: options.subtitle || 'Givral Bakery System',
        message: options.message || 'Bạn có chắc chắn muốn thực hiện thao tác này?',
        note: options.note || '',
        confirmText: options.confirmText || 'Xác nhận',
        cancelText: options.cancelText || 'Hủy bỏ',
        type: options.type || 'warning', // 'danger' | 'warning' | 'info' | 'success' | 'primary'
        icon: options.icon || null,
      });
    });
  }, []);

  const handleConfirm = () => {
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
    setDialogState(null);
  };

  const handleCancel = () => {
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
    setDialogState(null);
  };

  const getIcon = (type, customIcon) => {
    if (customIcon) return customIcon;
    switch (type) {
      case 'danger':
        return <i className="fa-solid fa-triangle-exclamation"></i>;
      case 'warning':
        return <i className="fa-solid fa-lock"></i>;
      case 'success':
        return <i className="fa-solid fa-circle-check"></i>;
      case 'info':
        return <i className="fa-solid fa-circle-info"></i>;
      default:
        return <i className="fa-solid fa-shield-halved"></i>;
    }
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialogState && (
        <div className="confirm-modal-overlay" onClick={handleCancel}>
          <div className="confirm-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-header">
              <div className={`confirm-modal-icon-wrap confirm-modal-icon-${dialogState.type}`}>
                {getIcon(dialogState.type, dialogState.icon)}
              </div>
              <div className="confirm-modal-title-wrap">
                <h3 className="confirm-modal-title">{dialogState.title}</h3>
                <div className="confirm-modal-subtitle">{dialogState.subtitle}</div>
              </div>
              <button
                type="button"
                className="confirm-modal-close"
                onClick={handleCancel}
                title="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="confirm-modal-body">
              <p className="confirm-modal-message">{dialogState.message}</p>
              {dialogState.note && (
                <div className="confirm-modal-highlight-box">
                  💡 {dialogState.note}
                </div>
              )}
            </div>

            <div className="confirm-modal-actions">
              <button
                type="button"
                className="confirm-modal-btn confirm-modal-btn-cancel"
                onClick={handleCancel}
              >
                {dialogState.cancelText}
              </button>
              <button
                type="button"
                className={`confirm-modal-btn confirm-modal-btn-confirm-${dialogState.type}`}
                onClick={handleConfirm}
                autoFocus
              >
                {dialogState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    // Fallback if used outside ConfirmProvider
    return async (options) => {
      const msg = typeof options === 'string' ? options : (options.message || options.title);
      return window.confirm(msg);
    };
  }
  return context;
};

export default ConfirmProvider;
