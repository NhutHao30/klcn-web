import React from 'react';

/**
 * CookieSpinner Component - Replaces default generic loading spinners with a gold cookie spin animation
 */
const CookieSpinner = ({ size = 44, text = "Đang tải...", fullPage = false }) => {
  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 10px' }}>
      <i 
        className="fa-solid fa-cookie-bite fa-spin" 
        style={{ 
          fontSize: `${size}px`, 
          color: '#d39e00', 
          marginBottom: text ? '12px' : '0',
          filter: 'drop-shadow(0 2px 4px rgba(211,158,0,0.3))'
        }}
      ></i>
      {text && <p style={{ color: '#555', fontSize: '14px', fontWeight: '600', margin: 0 }}>{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', width: '100%' }}>
        {content}
      </div>
    );
  }

  return content;
};

export default CookieSpinner;
