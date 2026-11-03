import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import axiosClient from '../../services/axiosClient';
import { getCurrentUser } from '../../services/authService';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { useToast } from '../../components/Toast/Toast';

window.Pusher = Pusher;

// Helper format thời gian
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

const AdminInternalChatPage = () => {
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Pusher / Echo instance
  const echoRef = useRef(null);
  const internalPollRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await getCurrentUser();
        const res = await axiosClient.get('/me');
        const userDetails = res.data;
        setCurrentUser(userDetails);

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

        const role = Number(userDetails.MAROLE);
        const branchId = userDetails.nhanvien?.MACUAHANG || userDetails.nhanvien?.cuaHangId || userDetails.cuaHangId || 1;
        
        const availableChannels = [];
        
        // Kênh trao đổi chung cho toàn thể nhân sự
        availableChannels.push({ id: 'company_general', name: '📢 Kênh Chung Toàn Công Ty' });

        // Quản lý tổng (role 0), Quản lý chi nhánh (role 1) và Ban giám đốc (role 5)
        if (role === 0 || role === 1 || role === 5) {
          availableChannels.push({ id: 'managers', name: '👔 Nhóm Quản Lý' });
        }
        
        // Admin tổng và Ban giám đốc thấy tất cả chi nhánh
        if (role === 0 || role === 5) {
          try {
            const storesRes = await axiosClient.get('/admin/stores');
            (storesRes.data || []).forEach(store => {
              availableChannels.push({ id: `branch_${store.id}`, name: `🏪 Chi nhánh: ${store.name || store.TEN_CUAHANG || ('Số ' + store.id)}` });
            });
          } catch (_) {
            if (branchId) {
              availableChannels.push({ id: `branch_${branchId}`, name: `🏪 Chi Nhánh ${branchId}` });
            }
          }
        } else if (branchId) {
          availableChannels.push({ id: `branch_${branchId}`, name: `🏪 Chi Nhánh Của Tôi (CN ${branchId})` });
        }

        setChannels(availableChannels);
        if (availableChannels.length > 0) {
          setActiveChannel(availableChannels[0].id);
        }

      } catch (error) {
        console.error("Lỗi xác thực:", error);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!activeChannel || !currentUser) return;

    // Xóa tin nhắn cũ trước khi lấy mới để không bị nhầm lẫn UI
    setMessages([]);

    // Lấy tin nhắn
    const fetchMessages = async () => {
      try {
        const res = await axiosClient.get(`/chat/internal/${activeChannel}/messages`);
        setMessages(res.data || []);
        scrollToBottom();
      } catch (error) {
        console.error("Lỗi lấy tin nhắn nội bộ:", error);
      }
    };

    fetchMessages();
    if (internalPollRef.current) clearInterval(internalPollRef.current);
    internalPollRef.current = setInterval(() => {
      const isConnected = window.Echo?.connector?.pusher?.connection?.state === 'connected';
      if (!document.hidden && !isConnected) {
        fetchMessages();
      }
    }, 15000);

    // Subscribe to Pusher (Tránh trùng lặp tin nhắn)
    if (window.Echo) {
      echoRef.current = window.Echo;
      const channelName = `internal.${activeChannel}`;
      const channel = window.Echo.private(channelName);
      
      channel.listen('InternalMessageSent', (e) => {
        setMessages(prev => {
          const msgId = e.message.id;
          if (prev.find(m => m.id === msgId)) {
            return prev.map(m => m.id === msgId ? e.message : m);
          }
          // Kiểm tra nếu có tin nhắn tạm (optimistic)
          const tempIdx = prev.findIndex(m => m.isTemp && m.sender_username === e.message.sender_username && m.message === e.message.message);
          if (tempIdx >= 0) {
            const next = [...prev];
            next[tempIdx] = e.message;
            return next;
          }
          return [...prev, e.message];
        });
        scrollToBottom();
      });
    }

    return () => {
      if (internalPollRef.current) clearInterval(internalPollRef.current);
      if (echoRef.current) {
        echoRef.current.leave(`internal.${activeChannel}`);
      }
    };
  }, [activeChannel, currentUser]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChannel) return;

    const msgText = newMessage.trim();
    setNewMessage("");

    const tempId = Date.now();
    const tempMessage = {
      id: tempId,
      isTemp: true,
      sender_username: currentUser.username || currentUser.USERNAME,
      HOTEN: currentUser.nhanvien?.HOTEN || currentUser.nguoidung?.hoTen || 'Tôi',
      message: msgText,
      daDoc: 0,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMessage]);
    scrollToBottom();

    try {
      const res = await axiosClient.post(`/chat/internal/${activeChannel}/messages`, {
        NOIDUNG: msgText
      });
      
      setMessages(prev => {
        // Nếu Echo đã kịp thêm res.data trước khi axios trả về
        if (prev.find(m => m.id === res.data.id)) {
          return prev.filter(m => m.id !== tempId);
        }
        return prev.map(m => m.id === tempId ? res.data : m);
      });
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
      const errorMsg = error.response?.data?.error || error.message || "Lỗi không xác định";
      toast.error("Không thể gửi tin nhắn! " + errorMsg);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const handleRecall = async (msgId) => {
    try {
      const res = await axiosClient.delete(`/chat/internal/${activeChannel}/messages/${msgId}`);
      setMessages(prev => prev.map(m => m.id === msgId ? res.data : m));
      toast.success("Đã thu hồi tin nhắn thành công!");
    } catch (error) {
      toast.error("Không thể thu hồi tin nhắn này.");
    }
  };

  if (!currentUser) {
    return (
      <AdminLayout>
        <div style={{ padding: '20px' }}>Đang tải dữ liệu...</div>
      </AdminLayout>
    );
  }

  // Khử trùng lặp ID tin nhắn trước khi hiển thị (Chống 1 tin hiển thị thành 2 tin)
  const uniqueMessages = [];
  const seenIds = new Set();
  for (const m of messages) {
    const key = m.id;
    if (!seenIds.has(key)) {
      seenIds.add(key);
      uniqueMessages.push(m);
    }
  }

  return (
    <AdminLayout>
      <div style={{ padding: '20px', height: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
        <h2 className="admin-title" style={{ color: 'var(--admin-primary)', marginBottom: '15px' }}>Chat nội bộ</h2>
        
        <div style={{ display: 'flex', flex: 1, backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          {/* Sidebar Channels */}
          <div style={{ width: '260px', borderRight: '1px solid #eee', backgroundColor: '#f9f9f9', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '15px', fontWeight: 'bold', borderBottom: '1px solid #eee', backgroundColor: '#f1f1f1' }}>
              Kênh Trò Chuyện
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {channels.map(ch => (
                <div 
                  key={ch.id}
                  onClick={() => setActiveChannel(ch.id)}
                  style={{ 
                    padding: '14px 15px', 
                    cursor: 'pointer', 
                    borderBottom: '1px solid #eee',
                    backgroundColor: activeChannel === ch.id ? '#e1f5fe' : 'transparent',
                    borderLeft: activeChannel === ch.id ? '4px solid #03a9f4' : '4px solid transparent',
                    fontWeight: activeChannel === ch.id ? 'bold' : 'normal',
                    fontSize: '13px'
                  }}
                >
                  {ch.name}
                </div>
              ))}
              {channels.length === 0 && (
                <div style={{ padding: '15px', color: '#888', fontSize: '13px', textAlign: 'center' }}>
                  Bạn không có quyền truy cập kênh nội bộ nào.
                </div>
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {activeChannel ? (
              <>
                <div style={{ padding: '15px', borderBottom: '1px solid #eee', fontWeight: 'bold', backgroundColor: '#fff', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{channels.find(c => c.id === activeChannel)?.name}</span>
                  <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 'normal' }}>● Đang hoạt động</span>
                </div>
                
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#f4f7f6', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {uniqueMessages.map((msg) => {
                    const isMe = (msg.sender_username === currentUser.username) || (msg.sender_username === currentUser.USERNAME);
                    const isRecalled = msg.message === '🚫 Tin nhắn đã bị thu hồi';

                    return (
                      <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', position: 'relative' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px', padding: '0 4px', fontWeight: '500' }}>
                          {isMe ? 'Bạn' : (msg.HOTEN || msg.sender_username)}
                        </span>
                        
                        <div style={{ position: 'relative', maxWidth: '70%' }}>
                          <div style={{ 
                            padding: '9px 14px', 
                            borderRadius: '14px', 
                            backgroundColor: isRecalled ? '#f1f5f9' : (isMe ? '#0284c7' : 'white'),
                            color: isRecalled ? '#94a3b8' : (isMe ? 'white' : '#1e293b'),
                            fontStyle: isRecalled ? 'italic' : 'normal',
                            border: isRecalled ? '1px dashed #cbd5e1' : 'none',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                            fontSize: '13px',
                            lineHeight: '1.4',
                            borderBottomRightRadius: isMe ? '2px' : '14px',
                            borderBottomLeftRadius: isMe ? '14px' : '2px',
                          }}>
                            {msg.message}
                          </div>

                          {/* Nút thu hồi tin nhắn */}
                          {isMe && !isRecalled && !msg.isTemp && (
                            <button
                              title="Thu hồi tin nhắn"
                              onClick={() => handleRecall(msg.id)}
                              style={{
                                position: 'absolute',
                                left: '-26px',
                                top: '8px',
                                background: 'none',
                                border: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontSize: '12px',
                                opacity: 0.65
                              }}
                            >
                              <i className="fa-solid fa-rotate-left"></i>
                            </button>
                          )}
                        </div>

                        {/* Thời gian & Trạng thái đã gửi / đã xem */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginTop: '3px',
                          fontSize: '10px',
                          color: '#94a3b8',
                          padding: '0 4px',
                          justifyContent: isMe ? 'flex-end' : 'flex-start'
                        }}>
                          <span>{formatMsgTime(msg.created_at || msg.createdAt)}</span>
                          {isMe && !msg.isTemp && (
                            (msg.daDoc == 1) ? (
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
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} style={{ padding: '12px 15px', borderTop: '1px solid #eee', backgroundColor: 'white', display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Nhập tin nhắn nội bộ..." 
                    style={{ flex: 1, padding: '10px 16px', border: '1px solid #cbd5e1', borderRadius: '20px', outline: 'none', fontSize: '13px' }}
                  />
                  <button type="submit" disabled={!newMessage.trim()} style={{ backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '20px', padding: '0 20px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-paper-plane"></i> Gửi
                  </button>
                </form>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#888' }}>
                Vui lòng chọn một kênh trò chuyện để bắt đầu.
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminInternalChatPage;
