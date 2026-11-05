import { formatImageUrl } from '../../utils/imageUtils';
import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axiosClient from '../../services/axiosClient';
import '../../css/admin.css';
import { useToast } from '../../components/Toast/Toast';

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

// Component hiển thị Thẻ Tương Tác Rich Card trong Chat
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
        width: '260px',
        color: '#1e293b',
        textAlign: 'left'
      }}>
        <div style={{ position: 'relative', width: '100%', height: '130px', backgroundColor: '#f1f5f9' }}>
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
          <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>
            {p.tenSanPham}
          </h4>
          <div style={{ color: '#d82d8b', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>
            {Number(p.giaBan || 0).toLocaleString('vi-VN')} đ
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`/san-pham/${p.id}`, '_blank');
            }}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: 'var(--admin-primary, #c81f34)',
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
        width: '260px',
        color: '#1e293b',
        boxShadow: '0 2px 8px rgba(220, 38, 38, 0.08)',
        textAlign: 'left'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>
          <i className="fa-solid fa-gift"></i> Voucher Ưu Đãi Givral
        </div>
        <div style={{
          backgroundColor: '#fee2e2',
          padding: '6px 10px',
          borderRadius: '6px',
          textAlign: 'center',
          fontWeight: '800',
          fontSize: '16px',
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
            alert(`Đã sao chép mã ${v.maVoucher}!`);
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
        width: '260px',
        color: '#1e293b',
        boxShadow: '0 2px 8px rgba(22, 163, 74, 0.08)',
        textAlign: 'left'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>
          <i className="fa-solid fa-receipt"></i> Đơn hàng vừa đặt thành công
        </div>
        <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#15803d', marginBottom: '4px' }}>
          #{o.maDonHang}
        </div>
        <div style={{ fontSize: '12px', color: '#334155', marginBottom: '4px' }}>
          Tổng thanh toán: <b style={{ color: '#dc2626', fontSize: '13px' }}>{Number(o.tongThanhToan || 0).toLocaleString('vi-VN')} đ</b>
        </div>
        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', lineHeight: 1.4 }}>
          Giao tới: {o.diaChiGiaoHang || 'Địa chỉ của khách'}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            window.open(`/admin/don-hang-online`, '_blank');
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
          <i className="fa-solid fa-truck-fast"></i> Xem trên hệ thống
        </button>
      </div>
    );
  }

  // Text message mặc định
  return <span>{content}</span>;
};

const AdminChatPage = () => {
  const pollMsgsIntervalRef = useRef(null);
    const toast = useToast();
const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);

  const initEcho = () => {
    if (typeof window === 'undefined' || window.Echo) return;
    try {
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
    } catch (e) {
      console.warn('Lỗi khởi tạo Echo:', e);
    }
  };

  useEffect(() => {
    initEcho();
    import('../../services/authService').then(({ getCurrentUser }) => {
      getCurrentUser().then(user => {
        setCurrentUser(user);
      }).catch(() => {});
    });

    fetchConversations(true);
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchConversations(false);
      }
    }, 4000);
    return () => {
      clearInterval(interval);
      if (pollMsgsIntervalRef.current) clearInterval(pollMsgsIntervalRef.current);
    };
  }, []);

  const [isCustomerTyping, setIsCustomerTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const fetchConversations = async (autoSelect = false) => {
    try {
      const res = await axiosClient.get('/chat/conversations');
      const convList = Array.isArray(res.data) ? res.data : [];
      setConversations(convList);
      if (autoSelect && convList.length > 0) {
        handleSelectConversation(convList[0]);
      }
    } catch (error) {
      console.error('Lỗi lấy danh sách hội thoại:', error);
    }
  };

  const handleSelectConversation = async (conv) => {
    if (!conv) return;
    // Rời kênh cũ (nếu có)
    if (activeConversation && window.Echo?.leave) {
      try {
        window.Echo.leave(`chat.${activeConversation.MACUOCTROCHUYEN || activeConversation.id}`);
      } catch (_) {}
    }

    setActiveConversation(conv);
    const convId = conv.MACUOCTROCHUYEN || conv.id;
    if (pollMsgsIntervalRef.current) clearInterval(pollMsgsIntervalRef.current);
    pollMsgsIntervalRef.current = setInterval(async () => {
      if (!document.hidden) {
        try {
          const pollRes = await axiosClient.get(`/chat/conversations/${convId}/messages`);
          if (Array.isArray(pollRes.data) && pollRes.data.length > 0) {
            setMessages(pollRes.data);
          }
        } catch (_) {}
      }
    }, 3000);
    try {
      const res = await axiosClient.get(`/chat/conversations/${convId}/messages`);
      setMessages(Array.isArray(res.data) ? res.data : []);

      // Đăng ký nghe kênh mới
      if (window.Echo?.private) {
        const channel = window.Echo.private(`chat.${convId}`);
        channel.listen('.MessageSent', (e) => {
            setMessages(prev => {
              const msgId = e.message?.MATINNHAN || e.message?.id;
              const exists = prev.find(m => (m.MATINNHAN || m.id) === msgId);
              if (exists) {
                return prev.map(m => (m.MATINNHAN || m.id) === msgId ? e.message : m);
              }
              return [...prev, e.message];
            });
          })
          .listenForWhisper('typing', (e) => {
            setIsCustomerTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setIsCustomerTyping(false), 2000);
          });
      }
    } catch (error) {
      console.error('Lỗi lấy tin nhắn:', error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isCustomerTyping]);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (activeConversation && window.Echo?.private) {
      const convId = activeConversation.MACUOCTROCHUYEN || activeConversation.id;
      const uname = currentUser?.USERNAME || currentUser?.username || 'CSKH';
      try {
        window.Echo.private(`chat.${convId}`).whisper('typing', { username: uname });
      } catch (_) {}
    }
  };

  const sendChatText = async (text) => {
    if (!text || !activeConversation) return;
    try {
      const convId = activeConversation.MACUOCTROCHUYEN || activeConversation.id;
      const res = await axiosClient.post(`/chat/conversations/${convId}/messages`, {
        NOIDUNG: text
      });
      setMessages(prev => {
        const msgId = res.data.MATINNHAN || res.data.id;
        if (prev.find(m => (m.MATINNHAN || m.id) === msgId)) return prev;
        return [...prev, res.data];
      });
      toast.success("Đã gửi thông tin vào cuộc trò chuyện!");
    } catch (error) {
      console.error("Lỗi gửi tin nhắn tư vấn:", error);
      toast.error("Không thể gửi tin nhắn vào chat.");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || !currentUser) return;

    const messageText = newMessage;
    setNewMessage('');

    try {
      const res = await axiosClient.post(`/chat/conversations/${activeConversation.MACUOCTROCHUYEN}/messages`, {
        NOIDUNG: messageText
      });
      setMessages(prev => [...prev, res.data]);
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
    }
  };

  const handleRecall = async (msgId) => {
    try {
      const res = await axiosClient.delete(`/chat/conversations/${activeConversation.MACUOCTROCHUYEN}/messages/${msgId}`);
      setMessages(prev => prev.map(m => m.MATINNHAN === msgId ? res.data : m));
    } catch (error) {
      toast.error("Không thể thu hồi tin nhắn này.");
    }
  };

    // Lọc trùng lặp tin nhắn
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
    <AdminLayout>
      <div className="admin-header">
        <h1>Hỗ trợ trực tuyến</h1>
      </div>

      <div className="admin-card" style={{ display: 'flex', height: '75vh', padding: 0, overflow: 'hidden', boxSizing: 'border-box' }}>
        
        {/* Sidebar Danh sách khách hàng */}
        <div style={{ flex: '0 0 25%', maxWidth: '300px', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
          <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
            Đoạn chat gần đây
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.length === 0 ? (
              <p style={{ padding: '15px', color: '#888', textAlign: 'center' }}>Chưa có tin nhắn nào</p>
            ) : (
              conversations.map(conv => (
                <div 
                  key={conv.MACUOCTROCHUYEN}
                  onClick={() => handleSelectConversation(conv)}
                  style={{
                    padding: '15px',
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    backgroundColor: activeConversation?.MACUOCTROCHUYEN === conv.MACUOCTROCHUYEN ? '#e3f2fd' : 'white',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: '#333' }}>Khách hàng: {conv.MAKH}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    {conv.tinnhans && conv.tinnhans.length > 0 
                      ? (conv.tinnhans[0].NOIDUNG || conv.tinnhans[0].noiDung || '').substring(0, 30) + '...'
                      : 'Bắt đầu trò chuyện mới...'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cửa sổ Chat chính */}
        <div style={{ flex: 1, minWidth: '400px', display: 'flex', flexDirection: 'column', backgroundColor: '#f4f7f6', borderRight: '1px solid #eee' }}>
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: '15px', backgroundColor: 'white', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#bbdefb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '15px', fontWeight: 'bold', color: '#1976d2' }}>
                  KH
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px' }}>Khách hàng {activeConversation.MAKH}</h3>
                  <span style={{ fontSize: '12px', color: '#4cd137' }}>● Đang kết nối</span>
                </div>
              </div>

              {/* Chat Messages */}
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {uniqueMessages.map(msg => {
                  const isMine = msg.LOAINGUOIGUI === 'nhanvien';
                  const isBot = msg.LOAINGUOIGUI === 'bot' || msg.nguoiGuiType === 2 || msg.isBot;
                  const text = msg.NOIDUNG || msg.noiDung;
                  const isRecalled = text === '🚫 Tin nhắn đã bị thu hồi';
                  const isCard = typeof text === 'string' && text.trim().startsWith('{') && text.trim().endsWith('}');

                  return (
                    <div key={msg.MATINNHAN || msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', position: 'relative' }} className="msg-hover-wrap">
                      <div style={{
                        maxWidth: isCard ? '300px' : '70%',
                        padding: isCard ? '0' : '10px 14px',
                        borderRadius: isCard ? '12px' : '16px',
                        backgroundColor: isCard ? 'transparent' : (isRecalled ? '#f1f5f9' : (isMine ? 'var(--admin-primary)' : 'white')),
                        color: isRecalled ? '#94a3b8' : (isMine ? 'white' : '#1e293b'),
                        fontStyle: isRecalled ? 'italic' : 'normal',
                        boxShadow: isCard ? 'none' : '0 2px 6px rgba(0,0,0,0.06)',
                        borderBottomRightRadius: isMine ? '2px' : '16px',
                        borderBottomLeftRadius: isMine ? '16px' : '2px',
                        position: 'relative'
                      }}>
                        {isBot && (
                          <div style={{ fontSize: '11px', color: '#6366f1', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <i className="fa-solid fa-robot"></i> Trợ lý AI (Tự động)
                          </div>
                        )}
                        <ChatCardMessage content={text} isMine={isMine} />
                        {isMine && !isRecalled && !isCard && (
                          <button 
                            title="Thu hồi tin nhắn"
                            onClick={() => handleRecall(msg.MATINNHAN || msg.id)}
                            style={{ position: 'absolute', left: '-28px', top: '8px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', opacity: 0.7 }}
                          >
                            <i className="fa-solid fa-rotate-left"></i>
                          </button>
                        )}
                      </div>

                      {/* Thời gian và Trạng thái tin nhắn */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '3px',
                        fontSize: '10px',
                        color: '#94a3b8',
                        padding: '0 4px'
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
                })}
                {isCustomerTyping && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ padding: '8px 15px', borderRadius: '18px', backgroundColor: '#e4e6eb', color: '#555', fontSize: '12px', fontStyle: 'italic' }}>
                      Khách hàng đang soạn tin...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} style={{ padding: '15px', backgroundColor: 'white', borderTop: '1px solid #eee', display: 'flex' }}>
                <input 
                  type="text" 
                  placeholder="Nhập câu trả lời..." 
                  value={newMessage}
                  onChange={handleTyping}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    border: '1px solid #ddd',
                    borderRadius: '25px',
                    outline: 'none',
                    fontSize: '14px'
                  }}
                />
                <button type="submit" style={{
                  backgroundColor: 'var(--admin-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  padding: '0 25px',
                  marginLeft: '10px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}>
                  Gửi ➔
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', flexDirection: 'column' }}>
              <i className="fa-regular fa-comments" style={{ fontSize: '50px', marginBottom: '15px', color: '#ddd' }}></i>
              <h2>Chọn một đoạn chat để bắt đầu</h2>
            </div>
          )}
        </div>

        {/* Cột Công cụ CSKH */}
        <div style={{ flex: '0 0 35%', maxWidth: '420px', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
          <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
            Công cụ Hỗ trợ
          </div>
          <div style={{ padding: '15px', overflowY: 'auto', flex: 1 }}>
            {activeConversation ? (
              <CskhPanel makh={activeConversation.khachHangId || activeConversation.khachhang_id || activeConversation.khachhang?.id || activeConversation.MAKH || activeConversation.id} conversationId={activeConversation.MACUOCTROCHUYEN || activeConversation.id} onSendChatText={sendChatText} />
            ) : (
              <p style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>Vui lòng chọn khách hàng để tra cứu</p>
            )}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

// Component con hiển thị Bảng Công cụ CSKH Nâng Cao
const CskhPanel = ({ makh, conversationId, onSendChatText }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('khachhang'); // 'khachhang' | 'sanpham' | 'voucher' | 'dathang'
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);

  // Danh mục & Sản phẩm
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [allProducts, setAllProducts] = useState([]);
  const [searchSp, setSearchSp] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockResult, setStockResult] = useState([]);
  const [loadingStock, setLoadingStock] = useState(false);

  // Vouchers
  const [vouchers, setVouchers] = useState([]);
  const [loadingVoucher, setLoadingVoucher] = useState(false);

  // Đặt hàng giùm khách
  const [orderItems, setOrderItems] = useState([]);
  const [orderCategory, setOrderCategory] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderProduct, setOrderProduct] = useState('');
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderStore, setOrderStore] = useState('');
  const [orderAddress, setOrderAddress] = useState('');
  const [shippingFee, setShippingFee] = useState(30000);
  const [stores, setStores] = useState([]);
  const [placingOrder, setPlacingOrder] = useState(false);

  // GHN State
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedWard, setSelectedWard] = useState('');

  // Tải dữ liệu khách hàng
  const fetchCustomerInfo = async () => {
    if (!makh) return;
    setLoadingCustomer(true);
    try {
      const res = await axiosClient.get(`/cskh/customer-info/${encodeURIComponent(makh)}`);
      setCustomerInfo(res.data);
      if (res.data.khachhang?.DIACHI && res.data.khachhang.DIACHI !== 'Chưa lưu địa chỉ giao hàng') {
        setOrderAddress(res.data.khachhang.DIACHI);
      }
    } catch (e) {
      console.error('Lỗi lấy TT Khách hàng:', e);
      toast.error('Không thể tải hồ sơ khách hàng.');
    } finally {
      setLoadingCustomer(false);
    }
  };

  // Tải danh mục loại bánh
  const fetchCategories = async () => {
    try {
      const res = await axiosClient.get('/cskh/categories');
      setCategories(res.data || []);
    } catch (e) {
      console.error('Lỗi lấy danh mục loại sản phẩm:', e);
    }
  };

  // Tải danh sách tất cả sản phẩm
  const fetchAllProducts = async () => {
    try {
      const res = await axiosClient.get('/cskh/products');
      const list = res.data.data || res.data || [];
      setAllProducts(list);
      if (list.length > 0 && !selectedProduct) {
        setSelectedProduct(list[0]);
        loadProductStock(list[0].id || list[0].MASP);
      }
    } catch (e) {
      console.error('Lỗi lấy danh mục sản phẩm:', e);
    }
  };

  // Tải tồn kho chi nhánh cho sản phẩm
  const loadProductStock = async (prodId) => {
    if (!prodId) return;
    setLoadingStock(true);
    try {
      const res = await axiosClient.get(`/cskh/product-stock?masp=${prodId}`);
      setStockResult(res.data || []);
    } catch (e) {
      console.error('Lỗi lấy tồn kho:', e);
    } finally {
      setLoadingStock(false);
    }
  };

  // Tải danh sách cửa hàng
  const fetchStores = async () => {
    try {
      const res = await axiosClient.get('/cskh/nearby-stores');
      setStores(res.data || []);
    } catch (e) {
      console.error('Lỗi lấy danh sách cửa hàng:', e);
    }
  };

  // Tải danh sách Voucher
  const fetchVouchers = async () => {
    setLoadingVoucher(true);
    try {
      const res = await axiosClient.get('/cskh/vouchers');
      setVouchers(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Lỗi lấy vouchers:', e);
      setVouchers([]);
    } finally {
      setLoadingVoucher(false);
    }
  };

  useEffect(() => {
    fetchCustomerInfo();
    fetchCategories();
    fetchAllProducts();
    fetchStores();
    fetchVouchers();
  }, [makh]);

  // Load GHN Provinces
  useEffect(() => {
    axiosClient.get('/ghn/provinces').then(res => {
      if (res.data?.data) setProvinces(res.data.data);
    }).catch(() => {});
  }, []);

  // Load Districts
  useEffect(() => {
    if (selectedProvince) {
      axiosClient.get(`/ghn/districts?province_id=${selectedProvince}`).then(res => {
        if (res.data?.data) {
          setDistricts(res.data.data);
          setWards([]);
          setSelectedDistrict('');
          setSelectedWard('');
          setShippingFee(0);
        }
      }).catch(() => {});
    }
  }, [selectedProvince]);

  // Load Wards
  useEffect(() => {
    if (selectedDistrict) {
      axiosClient.get(`/ghn/wards?district_id=${selectedDistrict}`).then(res => {
        if (res.data?.data) {
          setWards(res.data.data);
          setSelectedWard('');
          setShippingFee(0);
        }
      }).catch(() => {});
    }
  }, [selectedDistrict]);

  // Lọc sản phẩm cho Tab 2 (Tồn kho bánh)
  const filteredProducts = allProducts.filter(p => {
    const matchCat = (selectedCategory === 'all') || String(p.loaiId) === String(selectedCategory);
    const q = (searchSp || '').trim().toLowerCase();
    const name = (p.TENSP || p.tenSanPham || '').toLowerCase();
    const id = String(p.id || p.MASP || '');
    const matchSearch = !q || name.includes(q) || id.includes(q);
    return matchCat && matchSearch;
  });

  // Tự động chọn sản phẩm đầu tiên khi bộ lọc thay đổi
  useEffect(() => {
    if (filteredProducts.length > 0) {
      const currentStillValid = selectedProduct && filteredProducts.some(p => (p.id || p.MASP) === (selectedProduct.id || selectedProduct.MASP));
      if (!currentStillValid) {
        setSelectedProduct(filteredProducts[0]);
        loadProductStock(filteredProducts[0].id || filteredProducts[0].MASP);
      }
    } else {
      setSelectedProduct(null);
      setStockResult([]);
    }
  }, [selectedCategory, searchSp, allProducts]);

  // Lọc sản phẩm cho Tab 4 (Đặt hàng giùm khách)
  const orderAvailableProducts = allProducts.filter(p => {
    const matchCat = (orderCategory === 'all') || String(p.loaiId) === String(orderCategory);
    const q = (orderSearch || '').trim().toLowerCase();
    const name = (p.TENSP || p.tenSanPham || '').toLowerCase();
    const id = String(p.id || p.MASP || '');
    const matchSearch = !q || name.includes(q) || id.includes(q);
    return matchCat && matchSearch;
  });

  // Gửi tư vấn sản phẩm vào khung chat
  const handleSendProductToChat = (product) => {
    if (!product) return;
    const stockAvailableStores = stockResult.filter(s => s.SOLUONG_TON > 0);
    const stockStatus = stockAvailableStores.length > 0
      ? `Còn ${stockAvailableStores.reduce((acc, s) => acc + Number(s.SOLUONG_TON), 0)} bánh tại ${stockAvailableStores.length} chi nhánh`
      : 'Tạm hết hàng tại các chi nhánh';

    const payload = JSON.stringify({
      type: 'PRODUCT_CARD',
      data: {
        id: product.id || product.MASP,
        tenSanPham: product.TENSP || product.tenSanPham,
        giaBan: product.GIABAN || product.giaBan,
        hinhAnh: product.HINHANH || product.hinhAnh,
        stockSummary: stockStatus,
        moTa: product.moTa || ''
      }
    });

    if (onSendChatText) {
      onSendChatText(payload);
    }
  };

  // Gửi mã Voucher vào khung chat cho khách
  const handleSendVoucherToChat = (voucher) => {
    if (!voucher) return;
    const payload = JSON.stringify({
      type: 'VOUCHER_CARD',
      data: {
        maVoucher: voucher.MA_VOUCHER,
        tenVoucher: voucher.TEN_VOUCHER,
        loaiGiam: voucher.LOAI_GIAM,
        giaTri: voucher.GIA_TRI,
        donToiThieu: voucher.DON_TOI_THIEU,
        ngayKetThuc: voucher.NGAY_KET_THUC
      }
    });

    if (onSendChatText) {
      onSendChatText(payload);
    }
  };

  // Tặng Voucher vào ví của khách
  const handleGiftVoucher = async (voucher) => {
    if (!customerInfo?.khachhang?.id) {
      toast.warning('Chưa có thông tin khách hàng để tặng voucher.');
      return;
    }
    try {
      const res = await axiosClient.post('/cskh/gift-voucher', {
        nguoidungId: customerInfo.khachhang.id,
        maVoucher: voucher.MA_VOUCHER
      });
      toast.success(res.data.message || 'Đã tặng voucher vào ví khách hàng!');
      fetchCustomerInfo();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Không thể tặng voucher.');
    }
  };

  // Thêm sản phẩm vào giỏ hàng đặt giùm
  const handleAddItem = () => {
    if (!orderProduct) {
      toast.warning('Vui lòng chọn sản phẩm!');
      return;
    }
    const productDetail = allProducts.find(p => (p.id || p.MASP) == orderProduct);
    if (!productDetail) return;

    const existingIdx = orderItems.findIndex(i => (i.MASP || i.id) === (productDetail.MASP || productDetail.id));
    if (existingIdx >= 0) {
      const newItems = [...orderItems];
      newItems[existingIdx].SOLUONG += parseInt(orderQuantity);
      setOrderItems(newItems);
    } else {
      setOrderItems([...orderItems, { ...productDetail, SOLUONG: parseInt(orderQuantity) }]);
    }
    setOrderProduct('');
    setOrderQuantity(1);
    toast.success(`Đã thêm "${productDetail.TENSP || productDetail.tenSanPham}" vào đơn!`);
  };

  const handlePlaceOrder = async () => {
    if (orderItems.length === 0) {
      toast.warning('Vui lòng thêm ít nhất một sản phẩm!');
      return;
    }
    if (!orderStore) {
      toast.warning('Vui lòng chọn chi nhánh xuất hàng!');
      return;
    }
    let fullAddress = orderAddress.trim();
    if (selectedWard && selectedDistrict && selectedProvince) {
      const pName = provinces.find(p => p.ProvinceID == selectedProvince)?.ProvinceName || '';
      const dName = districts.find(d => d.DistrictID == selectedDistrict)?.DistrictName || '';
      const wName = wards.find(w => w.WardCode == selectedWard)?.WardName || '';
      fullAddress = `${fullAddress}, ${wName}, ${dName}, ${pName}`;
    }
    if (!fullAddress) {
      toast.warning('Vui lòng nhập địa chỉ giao hàng!');
      return;
    }

    setPlacingOrder(true);
    try {
      const res = await axiosClient.post(`/cskh/place-order/${makh}`, {
        MACUAHANG: orderStore,
        DIACHIGIAO: fullAddress,
        shippingFee: parseInt(shippingFee) || 0,
        items: orderItems.map(i => ({ MASP: i.MASP || i.id, SOLUONG: i.SOLUONG }))
      });
      toast.success(`Đặt hàng thành công! Mã đơn: ${res.data.mahd}`);
      setOrderItems([]);
      setOrderStore('');

      if (onSendChatText) {
        const orderPayload = JSON.stringify({
          type: 'ORDER_CARD',
          data: {
            maDonHang: res.data.mahd,
            tongThanhToan: orderItems.reduce((acc, i) => acc + (i.SOLUONG * (i.GIABAN || i.giaBan || 0)), 0) + (parseInt(shippingFee) || 0),
            diaChiGiaoHang: fullAddress
          }
        });
        onSendChatText(orderPayload);
      }
      fetchCustomerInfo();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi khi đặt hàng giùm khách.');
    } finally {
      setPlacingOrder(false);
    }
  };

  const kh = customerInfo?.khachhang;
  const recentOrders = customerInfo?.donhangs || [];
  const walletVouchers = customerInfo?.viVoucher || [];
  const systemVouchers = vouchers || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontSize: '13px' }}>
      
      {/* Tab Navigation */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc', padding: '4px 6px', gap: '4px' }}>
        <button
          onClick={() => setActiveTab('khachhang')}
          style={{
            flex: 1,
            padding: '8px 4px',
            fontSize: '11px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            backgroundColor: activeTab === 'khachhang' ? 'var(--admin-primary)' : 'transparent',
            color: activeTab === 'khachhang' ? '#fff' : '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <i className="fa-solid fa-user"></i> Khách hàng
        </button>
        <button
          onClick={() => setActiveTab('sanpham')}
          style={{
            flex: 1,
            padding: '8px 4px',
            fontSize: '11px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            backgroundColor: activeTab === 'sanpham' ? 'var(--admin-primary)' : 'transparent',
            color: activeTab === 'sanpham' ? '#fff' : '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <i className="fa-solid fa-cake-candles"></i> Tồn kho bánh
        </button>
        <button
          onClick={() => setActiveTab('voucher')}
          style={{
            flex: 1,
            padding: '8px 4px',
            fontSize: '11px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            backgroundColor: activeTab === 'voucher' ? 'var(--admin-primary)' : 'transparent',
            color: activeTab === 'voucher' ? '#fff' : '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <i className="fa-solid fa-ticket"></i> Voucher
        </button>
        <button
          onClick={() => setActiveTab('dathang')}
          style={{
            flex: 1,
            padding: '8px 4px',
            fontSize: '11px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            backgroundColor: activeTab === 'dathang' ? 'var(--admin-primary)' : 'transparent',
            color: activeTab === 'dathang' ? '#fff' : '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <i className="fa-solid fa-cart-shopping"></i> Đặt hàng
        </button>
      </div>

      {/* Tab 1: Khách hàng */}
      {activeTab === 'khachhang' && (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
          {loadingCustomer ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
              <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ marginBottom: '8px', color: 'var(--admin-primary)' }}></i>
              <p style={{ margin: 0 }}>Đang tải thông tin khách hàng...</p>
            </div>
          ) : !kh ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
              Chưa có thông tin khách hàng.
            </div>
          ) : (
            <>
              {/* Thẻ hồ sơ */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', backgroundColor: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}>{kh.HOTEN}</span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    backgroundColor: '#fef3c7',
                    color: '#b45309'
                  }}>
                    {kh.HANGTHANHVIEN || 'Thành viên'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#475569' }}>
                  <div><i className="fa-solid fa-phone" style={{ width: '18px', color: '#64748b' }}></i> {kh.SDT}</div>
                  <div><i className="fa-solid fa-envelope" style={{ width: '18px', color: '#64748b' }}></i> {kh.EMAIL}</div>
                  <div><i className="fa-solid fa-location-dot" style={{ width: '18px', color: '#64748b' }}></i> {kh.DIACHI}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', fontSize: '11px' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Điểm tích lũy:</span>
                    <div style={{ fontWeight: 'bold', color: '#d97706', fontSize: '13px' }}>{kh.DIEMTICHLUY} điểm</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Tổng chi tiêu:</span>
                    <div style={{ fontWeight: 'bold', color: '#16a34a', fontSize: '13px' }}>{Number(kh.tongChiTieu || 0).toLocaleString('vi-VN')} đ</div>
                  </div>
                </div>
              </div>

              {/* Lịch sử đơn hàng gần đây */}
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#334155', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                  <span><i className="fa-solid fa-clock-rotate-left"></i> Đơn hàng gần đây ({recentOrders.length}):</span>
                </div>
                {recentOrders.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', padding: '8px 0' }}>Khách hàng chưa có đơn hàng nào.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {recentOrders.map(order => (
                      <div key={order.id} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 10px', backgroundColor: '#fff', fontSize: '11px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '2px' }}>
                          <span style={{ color: 'var(--admin-primary)' }}>#{order.maDonHang || order.id}</span>
                          <span style={{ color: '#16a34a' }}>{Number(order.tongThanhToan || 0).toLocaleString('vi-VN')} đ</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                          <span>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                          <span style={{ padding: '1px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', fontWeight: '500' }}>
                            {order.trangThaiDonHang || 'Hoàn tất'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 2: Sản phẩm & Tồn kho đa chi nhánh */}
      {activeTab === 'sanpham' && (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
          
          {/* Bộ lọc Loại sản phẩm & Ô tìm kiếm */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Lọc theo Loại sản phẩm */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                <i className="fa-solid fa-filter" style={{ marginRight: '4px' }}></i> Lọc theo loại bánh:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', backgroundColor: '#fff', outline: 'none' }}
              >
                <option value="all">-- Tất cả loại bánh ({allProducts.length}) --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.tenLoai}
                  </option>
                ))}
              </select>
            </div>

            {/* Tìm kiếm nhanh */}
            <div style={{ display: 'flex', gap: '6px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Tìm tên bánh, từ khóa..."
                value={searchSp}
                onChange={(e) => setSearchSp(e.target.value)}
                style={{ flex: 1, padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', outline: 'none' }}
              />
              {searchSp && (
                <button
                  type="button"
                  onClick={() => setSearchSp('')}
                  style={{ position: 'absolute', right: '10px', top: '7px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px' }}
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* Danh mục sản phẩm đã lọc */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Chọn sản phẩm ({filteredProducts.length} kết quả):</span>
            </div>
            <select
              value={selectedProduct ? (selectedProduct.id || selectedProduct.MASP) : ''}
              onChange={(e) => {
                const prod = filteredProducts.find(p => (p.id || p.MASP) == e.target.value);
                if (prod) {
                  setSelectedProduct(prod);
                  loadProductStock(prod.id || prod.MASP);
                }
              }}
              style={{ width: '100%', padding: '7px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', backgroundColor: '#fff', outline: 'none' }}
            >
              {filteredProducts.length === 0 ? (
                <option value="">Không tìm thấy bánh phù hợp</option>
              ) : (
                filteredProducts.map(p => (
                  <option key={p.id || p.MASP} value={p.id || p.MASP}>
                    {p.TENSP || p.tenSanPham} - {Number(p.GIABAN || p.giaBan || 0).toLocaleString('vi-VN')} đ
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Chi tiết sản phẩm đang chọn & nút Gửi vào Chat */}
          {selectedProduct ? (
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h5 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>
                    {selectedProduct.TENSP || selectedProduct.tenSanPham}
                  </h5>
                  <div style={{ color: '#d82d8b', fontWeight: 'bold', fontSize: '13px', marginTop: '2px' }}>
                    {Number(selectedProduct.GIABAN || selectedProduct.giaBan || 0).toLocaleString('vi-VN')} đ
                  </div>
                </div>
                <button
                  onClick={() => handleSendProductToChat(selectedProduct)}
                  className="admin-btn admin-btn-success"
                  style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Gửi thông tin bánh này vào khung chat cho khách xem"
                >
                  <i className="fa-solid fa-paper-plane"></i> Gửi vào chat
                </button>
              </div>

              {/* Bảng tồn kho từng chi nhánh */}
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                  <i className="fa-solid fa-shop"></i> Tồn kho tại các chi nhánh:
                </div>
                {loadingStock ? (
                  <div style={{ textAlign: 'center', padding: '10px', color: '#94a3b8' }}>Đang kiểm kho...</div>
                ) : stockResult.length === 0 ? (
                  <div style={{ fontSize: '11px', color: '#ef4444', fontStyle: 'italic' }}>Chưa có bản ghi tồn kho cho sản phẩm này.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {stockResult.map((stk, idx) => {
                      const isHighStock = idx === 0 && stk.SOLUONG_TON > 0;
                      return (
                        <div key={idx} style={{
                          border: isHighStock ? '1px solid #16a34a' : '1px solid #e2e8f0',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          backgroundColor: isHighStock ? '#f0fdf4' : '#fff',
                          fontSize: '11px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold', color: '#1e293b' }}>
                              {stk.TENCUAHANG}
                              {isHighStock && <span style={{ marginLeft: '4px', color: '#16a34a', fontSize: '10px' }}>⭐ Tồn nhiều nhất</span>}
                            </span>
                            <span style={{
                              fontWeight: 'bold',
                              color: stk.SOLUONG_TON > 0 ? '#16a34a' : '#ef4444',
                              backgroundColor: stk.SOLUONG_TON > 0 ? '#dcfce7' : '#fee2e2',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {stk.SOLUONG_TON > 0 ? `Còn ${stk.SOLUONG_TON}` : 'Hết hàng'}
                            </span>
                          </div>
                          <div style={{ color: '#64748b', fontSize: '10px', marginTop: '2px' }}>
                            {stk.DIACHI} {stk.SDT && `• 📞 ${stk.SDT}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '12px' }}>
              Vui lòng chọn loại bánh khác hoặc xóa từ khóa tìm kiếm.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Voucher */}
      {activeTab === 'voucher' && (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
          
          {/* Ví voucher của khách */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="fa-solid fa-wallet" style={{ color: 'var(--admin-primary)' }}></i> Ví voucher của khách hàng ({walletVouchers.length}):
            </div>
            {walletVouchers.length === 0 ? (
              <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', padding: '4px 0' }}>Khách hàng chưa có mã giảm giá nào trong ví.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {walletVouchers.map(v => (
                  <div key={v.viVoucherId || v.id} style={{ border: '1px solid #fed7aa', borderRadius: '6px', padding: '6px 8px', backgroundColor: '#fffaf5', fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--admin-primary)' }}>{v.MA_VOUCHER}</span>
                      <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: v.trangThaiVi == 0 ? '#dcfce7' : '#f1f5f9', color: v.trangThaiVi == 0 ? '#16a34a' : '#64748b', fontWeight: 'bold' }}>
                        {v.trangThaiVi == 0 ? 'Chưa dùng' : 'Đã sử dụng'}
                      </span>
                    </div>
                    <div style={{ color: '#64748b', fontSize: '10px' }}>{v.TEN_VOUCHER}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Các Voucher hệ thống đang mở */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="fa-solid fa-gift" style={{ color: '#dc2626' }}></i> Chương trình Khuyến mãi hệ thống ({systemVouchers.length}):
            </div>
            {loadingVoucher ? (
              <div style={{ textAlign: 'center', padding: '10px', color: '#94a3b8' }}>Đang tải vouchers...</div>
            ) : systemVouchers.length === 0 ? (
              <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Không có chương trình khuyến mãi nào đang mở.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {systemVouchers.map((vc, idx) => {
                  const discountLabel = vc.LOAI_GIAM === 'PHAN_TRAM'
                    ? `Giảm ${vc.GIA_TRI}%`
                    : `Giảm ${Number(vc.GIA_TRI).toLocaleString('vi-VN')} đ`;

                  return (
                    <div key={idx} style={{
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      backgroundColor: '#fff8f6',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#991b1b' }}>{vc.MA_VOUCHER}</span>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#16a34a' }}>{discountLabel}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#475569' }}>{vc.TEN_VOUCHER}</div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>
                        Đơn tối thiểu: <b>{Number(vc.DON_TOI_THIEU || 0).toLocaleString('vi-VN')} đ</b>
                        {vc.NGAY_KET_THUC && ` • HSD: ${new Date(vc.NGAY_KET_THUC).toLocaleDateString('vi-VN')}`}
                      </div>

                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                        <button
                          onClick={() => handleGiftVoucher(vc)}
                          className="admin-btn admin-btn-secondary"
                          style={{ flex: 1, padding: '4px 8px', fontSize: '11px', borderRadius: '4px' }}
                          title="Tặng mã này trực tiếp vào ví của khách hàng"
                        >
                          <i className="fa-solid fa-plus"></i> Tặng vào ví
                        </button>
                        <button
                          onClick={() => handleSendVoucherToChat(vc)}
                          className="admin-btn admin-btn-success"
                          style={{ flex: 1, padding: '4px 8px', fontSize: '11px', borderRadius: '4px' }}
                          title="Gửi mã ưu đãi này vào khung chat cho khách"
                        >
                          <i className="fa-solid fa-paper-plane"></i> Gửi vào chat
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab 4: Đặt hàng giùm khách */}
      {activeTab === 'dathang' && (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>
              <i className="fa-solid fa-cart-plus" style={{ marginRight: '4px' }}></i> Thêm sản phẩm vào đơn hàng:
            </label>
            
            {/* Lọc loại sản phẩm & tìm kiếm khi đặt hàng */}
            <div style={{ display: 'flex', gap: '6px', margin: '4px 0 6px 0' }}>
              <select
                value={orderCategory}
                onChange={(e) => setOrderCategory(e.target.value)}
                style={{ flex: 1, padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', backgroundColor: '#fff', outline: 'none' }}
              >
                <option value="all">Tất cả loại bánh</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.tenLoai}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Tìm bánh..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                style={{ flex: 1, padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', outline: 'none' }}
              />
            </div>

            {/* Dropdown chọn bánh từ danh sách toàn bộ sản phẩm */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <select
                value={orderProduct}
                onChange={(e) => setOrderProduct(e.target.value)}
                style={{ flex: 1, padding: '6px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '11px', outline: 'none' }}
              >
                <option value="">-- Chọn bánh ({orderAvailableProducts.length} sản phẩm) --</option>
                {orderAvailableProducts.map(p => (
                  <option key={p.id || p.MASP} value={p.id || p.MASP}>
                    {p.TENSP || p.tenSanPham} ({Number(p.GIABAN || p.giaBan || 0).toLocaleString('vi-VN')} đ)
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(e.target.value)}
                style={{ width: '45px', padding: '6px', border: '1px solid #ccc', borderRadius: '4px', textAlign: 'center' }}
              />
              <button
                type="button"
                onClick={handleAddItem}
                className="admin-btn admin-btn-primary"
                style={{ padding: '4px 10px', fontSize: '11px', whiteSpace: 'nowrap' }}
              >
                + Thêm
              </button>
            </div>
          </div>

          {/* Giỏ hàng đặt giùm (Hiển thị nhiều sản phẩm) */}
          {orderItems.length > 0 && (
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px', backgroundColor: '#f8fafc', fontSize: '11px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#1e293b' }}>
                Danh sách bánh đã chọn ({orderItems.length} loại bánh):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {orderItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: '500' }}>{item.TENSP || item.tenSanPham} x<b>{item.SOLUONG}</b></span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#16a34a', fontWeight: 'bold' }}>
                        {(item.SOLUONG * (item.GIABAN || item.giaBan || 0)).toLocaleString('vi-VN')} đ
                      </span>
                      <button
                        type="button"
                        onClick={() => setOrderItems(orderItems.filter((_, i) => i !== idx))}
                        style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}
                        title="Xóa bánh này khỏi đơn"
                      >
                        &times;
                      </button>
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>Tiền hàng ({orderItems.reduce((acc, i) => acc + i.SOLUONG, 0)} cái):</span>
                <span style={{ color: '#dc2626' }}>
                  {orderItems.reduce((acc, i) => acc + (i.SOLUONG * (i.GIABAN || i.giaBan || 0)), 0).toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Chi nhánh xuất hàng:</label>
            <select
              value={orderStore}
              onChange={(e) => setOrderStore(e.target.value)}
              style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '4px', fontSize: '11px', outline: 'none' }}
            >
              <option value="">-- Chọn chi nhánh giao hàng --</option>
              {stores.map(st => (
                <option key={st.id} value={st.id}>
                  {st.tenCuaHang || st.name} ({st.diaChiChiTiet || st.diaChi})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Địa chỉ giao hàng:</label>
            
            {/* Tỉnh / Huyện / Xã GHN */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', margin: '4px 0' }}>
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                style={{ padding: '4px', fontSize: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                <option value="">-- Tỉnh/TP --</option>
                {provinces.map(p => (
                  <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>
                ))}
              </select>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                disabled={!selectedProvince}
                style={{ padding: '4px', fontSize: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                <option value="">-- Quận/Huyện --</option>
                {districts.map(d => (
                  <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>
                ))}
              </select>
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                disabled={!selectedDistrict}
                style={{ padding: '4px', fontSize: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                <option value="">-- Phường/Xã --</option>
                {wards.map(w => (
                  <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>
                ))}
              </select>
            </div>

            <textarea
              rows="2"
              value={orderAddress}
              onChange={(e) => setOrderAddress(e.target.value)}
              placeholder="Số nhà, tên đường cụ thể..."
              style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '11px', boxSizing: 'border-box' }}
            />
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={placingOrder || orderItems.length === 0}
            className="admin-btn admin-btn-primary"
            style={{ width: '100%', padding: '10px', fontWeight: 'bold', fontSize: '13px', marginTop: '6px' }}
          >
            {placingOrder ? 'Đang tạo đơn...' : 'Tạo Đơn Hàng COD Cho Khách'}
          </button>
        </div>
      )}

    </div>
  );
};

export default AdminChatPage;
