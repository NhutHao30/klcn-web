import { formatImageUrl } from '../utils/imageUtils';
import React, { useState, useEffect, useRef } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axiosClient from '../services/axiosClient';
import { useToast } from './Toast/Toast';
import '../css/chat.css';

window.Pusher = Pusher;


// Helper format thời gian tin nhắn
const formatMsgTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

// Component Thẻ Tương Tác Rich Card trong ChatBox khách hàng
const ChatCardMessage = ({ content, isMine }) => {
  let card = null;
  if (typeof content === 'string' && content.trim().startsWith('{') && content.trim().endsWith('}')) {
    try {
      card = JSON.parse(content);
    } catch (_) {}
  }

  if (card && card.type === 'PRODUCT_CARD') {
    const p = card.data;
    return (
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
        border: '1px solid #e2e8f0',
        width: '230px',
        color: '#1e293b',
        textAlign: 'left'
      }}>
        <div style={{ position: 'relative', width: '100%', height: '120px', backgroundColor: '#f1f5f9' }}>
          <img
            src={formatImageUrl(p.hinhAnh)}
            alt={p.tenSanPham}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.target.src = '/assets/IMG/Logo.png'; }}
          />
          <span style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            backgroundColor: '#16a34a',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 'bold',
            padding: '2px 8px',
            borderRadius: '10px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            {p.stockSummary || 'Có sẵn'}
          </span>
        </div>
        <div style={{ padding: '10px' }}>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 'bold', color: '#1e293b', lineHeight: 1.3 }}>
            {p.tenSanPham}
          </h4>
          <div style={{ color: '#d82d8b', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>
            {Number(p.giaBan || 0).toLocaleString('vi-VN')} đ
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              window.open('/san-pham/' + p.id, '_blank');
            }}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: 'var(--primary-color, #c81f34)',
              color: '#fff',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <i className="fa-solid fa-arrow-up-right-from-square"></i> Xem chi tiết bánh
          </button>
        </div>
      </div>
    );
  }

  if (card && card.type === 'VOUCHER_CARD') {
    const v = card.data;
    const discountText = v.loaiGiam === 'PHAN_TRAM'
      ? `Giảm ${v.giaTri}%`
      : `Giảm ${Number(v.giaTri).toLocaleString('vi-VN')} đ`;

    return (
      <div style={{
        backgroundColor: '#fff8f6',
        borderRadius: '10px',
        border: '1px dashed #dc2626',
        padding: '12px',
        width: '230px',
        color: '#1e293b',
        boxShadow: '0 2px 8px rgba(220, 38, 38, 0.08)',
        textAlign: 'left'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>
          <i className="fa-solid fa-gift"></i> Ưu Đãi Dành Riêng Cho Bạn
        </div>
        <div style={{
          backgroundColor: '#fee2e2',
          padding: '6px 10px',
          borderRadius: '6px',
          textAlign: 'center',
          fontWeight: '800',
          fontSize: '15px',
          color: '#991b1b',
          letterSpacing: '1px',
          marginBottom: '6px',
          border: '1px dashed #ef4444'
        }}>
          {v.maVoucher}
        </div>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#16a34a', marginBottom: '4px' }}>
          {discountText}
        </div>
        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', lineHeight: 1.4 }}>
          Đơn tối thiểu: <b>{Number(v.donToiThieu || 0).toLocaleString('vi-VN')} đ</b><br />
          {v.ngayKetThuc && <span>HSD: {new Date(v.ngayKetThuc).toLocaleDateString('vi-VN')}</span>}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(v.maVoucher);
            alert(`Đã sao chép mã ưu đãi ${v.maVoucher}!`);
          }}
          style={{
            width: '100%',
            padding: '6px 10px',
            borderRadius: '6px',
            backgroundColor: '#dc2626',
            color: '#fff',
            border: 'none',
            fontWeight: 'bold',
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <i className="fa-regular fa-copy"></i> Sao chép mã ưu đãi
        </button>
      </div>
    );
  }

  if (card && card.type === 'ORDER_CARD') {
    const o = card.data;
    return (
      <div style={{
        backgroundColor: '#f0fdf4',
        borderRadius: '10px',
        border: '1px solid #16a34a',
        padding: '12px',
        width: '230px',
        color: '#1e293b',
        boxShadow: '0 2px 8px rgba(22, 163, 74, 0.08)',
        textAlign: 'left'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>
          <i className="fa-solid fa-receipt"></i> Đơn hàng của bạn
        </div>
        <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#15803d', marginBottom: '4px' }}>
          #{o.maDonHang}
        </div>
        <div style={{ fontSize: '12px', color: '#334155', marginBottom: '4px' }}>
          Tổng thanh toán: <b style={{ color: '#dc2626', fontSize: '13px' }}>{Number(o.tongThanhToan || 0).toLocaleString('vi-VN')} đ</b>
        </div>
        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', lineHeight: 1.4 }}>
          Giao tới: {o.diaChiGiaoHang || 'Địa chỉ của bạn'}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            window.open('/my-orders', '_blank');
          }}
          style={{
            width: '100%',
            padding: '6px 10px',
            borderRadius: '6px',
            backgroundColor: '#16a34a',
            color: '#fff',
            border: 'none',
            fontWeight: 'bold',
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <i className="fa-solid fa-bag-shopping"></i> Xem đơn hàng của tôi
        </button>
      </div>
    );
  }

  return <span>{content}</span>;
};

const ChatBox = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const toast = useToast();

  const [isStaffTyping, setIsStaffTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Không hiển thị ChatBox khách hàng trong trang quản trị Admin
  const isAdminPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

  // Khởi tạo và đồng bộ tin nhắn khi đã đăng nhập
  useEffect(() => {
    if (isAdminPath || !currentUser) return;

    // Khởi tạo Echo lắng nghe Pusher
    try {
      if (!window.Echo) {
        window.Echo = new Echo({
          broadcaster: 'pusher',
          key: import.meta.env.VITE_PUSHER_APP_KEY || '03aad271ee49f3b2776a',
          cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'ap1',
          forceTLS: true,
          authorizer: (channel, options) => {
            return {
              authorize: (socketId, callback) => {
                axiosClient.post('/broadcasting/auth', {
                  socket_id: socketId,
                  channel_name: channel.name
                })
                .then(response => {
                  callback(false, response.data);
                })
                .catch(error => {
                  callback(true, error);
                });
              }
            };
          }
        });
      }
    } catch (e) {
      console.warn("Pusher echo init warning:", e);
    }

    let activeConvId = null;

    const initChat = async () => {
      try {
        const res = await axiosClient.post('/chat/conversations');
        const conv = res.data;
        const convId = conv.MACUOCTROCHUYEN || conv.id;
        setConversationId(convId);
        activeConvId = convId;

        // Lấy lịch sử tin nhắn
        const histRes = await axiosClient.get(`/chat/conversations/${convId}/messages`);
        setMessages(histRes.data);

        // Đăng ký lắng nghe kênh chat (Private Channel)
        if (window.Echo) {
          window.Echo.private(`chat.${convId}`)
            .listen('.MessageSent', (e) => {
              setMessages(prev => {
                const msgId = e.message.MATINNHAN || e.message.id;
                const exists = prev.find(m => (m.MATINNHAN || m.id) === msgId);
                if (exists) {
                  return prev.map(m => (m.MATINNHAN || m.id) === msgId ? e.message : m);
                }
                return [...prev, e.message];
              });
            })
            .listenForWhisper('typing', (e) => {
              setIsStaffTyping(true);
              if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = setTimeout(() => setIsStaffTyping(false), 2000);
            });
        }
      } catch (error) {
        console.error("Lỗi khởi tạo chat:", error);
      }
    };

    initChat();

    // Fallback polling mỗi 6s để đảm bảo luôn nhận tin nhắn mới ngay cả khi Pusher offline
    // Polling thông minh: Chỉ kích hoạt khi Pusher/Echo chưa kết nối và tab đang hiển thị
    const pollInterval = setInterval(async () => {
      const isConnected = window.Echo?.connector?.pusher?.connection?.state === 'connected';
      if (activeConvId && isOpen && !document.hidden && !isConnected) {
        try {
          const histRes = await axiosClient.get(`/chat/conversations/${activeConvId}/messages`);
          setMessages(histRes.data);
        } catch (_) {}
      }
    }, 15000);

    return () => {
      clearInterval(pollInterval);
      if (activeConvId && window.Echo) {
        window.Echo.leave(`chat.${activeConvId}`);
      }
    };
  }, [currentUser, isOpen, isAdminPath]);

  // Cuộn xuống cuối mỗi khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isStaffTyping]);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (conversationId && window.Echo && currentUser) {
      window.Echo.private(`chat.${conversationId}`).whisper('typing', { username: currentUser.USERNAME || currentUser.username });
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId) return;

    const messageText = newMessage;
    setNewMessage('');

    try {
      const res = await axiosClient.post(`/chat/conversations/${conversationId}/messages`, {
        NOIDUNG: messageText
      });
      setMessages(prev => {
        const msgId = res.data.MATINNHAN || res.data.id;
        let list = prev.find(m => (m.MATINNHAN || m.id) === msgId) ? prev : [...prev, res.data];
        if (res.data.bot_reply) {
          const botId = res.data.bot_reply.MATINNHAN || res.data.bot_reply.id;
          if (!list.find(m => (m.MATINNHAN || m.id) === botId)) {
            list = [...list, res.data.bot_reply];
          }
        }
        return list;
      });
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
      toast.error('Không thể gửi tin nhắn. Vui lòng thử lại.');
    }
  };

  const handleRecall = async (msgId) => {
    try {
      const res = await axiosClient.delete(`/chat/conversations/${conversationId}/messages/${msgId}`);
      setMessages(prev => prev.map(m => (m.MATINNHAN || m.id) === msgId ? res.data : m));
    } catch (error) {
      toast.error("Không thể thu hồi tin nhắn này.");
    }
  };

  // Ẩn hoàn toàn trên giao diện admin
  if (isAdminPath) return null;

    // Lọc trùng lặp ID tin nhắn
  const uniqueMessages = [];
  const seenIds = new Set();
  for (const m of messages) {
    const key = m.MATINNHAN || m.id;
    if (!key || !seenIds.has(key)) {
      if (key) seenIds.add(key);
      uniqueMessages.push(m);
    }
  }

  return (
    <div className="chatbox-container">
      {isOpen ? (
        <div className="chatbox-window">
          {/* Header */}
          <div className="chatbox-header" onClick={() => setIsOpen(false)}>
            <div className="chatbox-title">
              <span className="online-dot"></span> Hỗ trợ Givral Bakery
            </div>
            <button className="chatbox-close" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
              &times;
            </button>
          </div>

          {!currentUser ? (
            /* Khi khách hàng chưa đăng nhập */
            <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: '16px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: 'var(--primary-color, #c81f34)' }}>
                <i className="fa-solid fa-headset"></i>
              </div>
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#1e293b' }}>Xin chào quý khách! 👋</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                  Givral Bakery luôn sẵn sàng hỗ trợ bạn. Vui lòng đăng nhập tài khoản để bắt đầu trò chuyện trực tiếp với nhân viên tư vấn.
                </p>
              </div>
              <button
                className="chatbox-toggle-btn"
                style={{ width: '100%', padding: '10px 16px', fontSize: '14px', borderRadius: '8px' }}
                onClick={() => { window.location.href = '/dang-nhap'; }}
              >
                <i className="fa-solid fa-right-to-bracket" style={{ marginRight: '6px' }}></i> Đăng nhập ngay
              </button>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                <i className="fa-solid fa-phone" style={{ marginRight: '6px' }}></i> Hotline: <b>0903.888.999</b>
              </div>
            </div>
          ) : (
            /* Khi khách hàng đã đăng nhập */
            <>
              <div className="chatbox-messages">
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '30px 15px', fontSize: '13px' }}>
                    <i className="fa-regular fa-comments" style={{ fontSize: '32px', marginBottom: '8px', display: 'block' }}></i>
                    Chào bạn! Hãy gửi câu hỏi hoặc yêu cầu hỗ trợ, nhân viên Givral Bakery sẽ phản hồi ngay nhé.
                  </div>
                ) : (
                  uniqueMessages.map((msg) => {
                    const msgId = msg.MATINNHAN || msg.id;
                    const isMine = msg.LOAINGUOIGUI === 'khachhang' || msg.nguoiGuiType === 0;
                    const isBot = msg.LOAINGUOIGUI === 'bot' || msg.nguoiGuiType === 2 || msg.isBot;
                    const isRecalled = msg.NOIDUNG === '🚫 Tin nhắn đã bị thu hồi' || msg.noiDung === '🚫 Tin nhắn đã bị thu hồi';
                    const text = msg.NOIDUNG || msg.noiDung;
                    const isCard = typeof text === 'string' && text.trim().startsWith('{') && text.trim().endsWith('}');

                    return (
                      <div key={msgId} className={`chatbox-message-wrapper ${isMine ? 'mine' : 'theirs'}`} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', maxWidth: '100%', flexDirection: isMine ? 'row-reverse' : 'row' }}>
                          {!isMine && (
                            <div className="chatbox-avatar" style={{ backgroundColor: isBot ? '#6366f1' : '#c81f34', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <i className={isBot ? "fa-solid fa-robot" : "fa-solid fa-headset"} style={{ fontSize: '12px' }}></i>
                            </div>
                          )}
                          <div className={`chatbox-message ${isMine ? 'mine' : 'theirs'}`} style={{
                            backgroundColor: isCard ? 'transparent' : (isRecalled ? '#f1f5f9' : undefined),
                            color: isRecalled ? '#94a3b8' : undefined,
                            fontStyle: isRecalled ? 'italic' : 'normal',
                            border: isRecalled ? '1px dashed #cbd5e1' : (isCard ? 'none' : undefined),
                            padding: isCard ? 0 : undefined,
                            boxShadow: isCard ? 'none' : undefined,
                            position: 'relative',
                            minWidth: isCard ? undefined : '50px',
                            width: 'fit-content',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'normal',
                            overflowWrap: 'break-word',
                            flexShrink: 0
                          }}>
                            <ChatCardMessage content={text} isMine={isMine} />
                            {isMine && !isRecalled && !isCard && (
                              <button
                                title="Thu hồi tin nhắn"
                                onClick={() => handleRecall(msgId)}
                                style={{ position: 'absolute', left: '-25px', top: '10px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}
                              >
                                <i className="fa-solid fa-rotate-left"></i>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Thời gian và Trạng thái đã gửi / đã xem */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          marginTop: '2px',
                          fontSize: '10px',
                          color: '#94a3b8',
                          padding: isMine ? '0 4px 0 0' : '0 0 0 38px'
                        }}>
                          <span>{formatMsgTime(msg.createdAt || msg.created_at)}</span>
                          {isMine && (
                            (msg.daDoc == 1 || msg.DADOC == 1) ? (
                              <span style={{ color: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 'bold' }}>
                                <i className="fa-solid fa-check-double"></i> Đã xem
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                <i className="fa-solid fa-check"></i> Đã gửi
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                {isStaffTyping && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ padding: '5px 10px', borderRadius: '15px', backgroundColor: '#f1f1f1', color: '#888', fontSize: '11px', fontStyle: 'italic', marginLeft: '35px' }}>
                      Nhân viên đang soạn tin...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="chatbox-input-area" onSubmit={sendMessage}>
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={newMessage}
                  onChange={handleTyping}
                />
                <button type="submit" disabled={!newMessage.trim()}>
                  <i className="fa-solid fa-paper-plane"></i>
                </button>
              </form>
            </>
          )}
        </div>
      ) : (
        <button className="chatbox-toggle-btn" onClick={() => setIsOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="online-dot"></span>
          <i className="fa-solid fa-comments"></i> Hỗ trợ trực tuyến
        </button>
      )}
    </div>
  );
};

export default ChatBox;
