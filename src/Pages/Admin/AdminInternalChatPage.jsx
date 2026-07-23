import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import axiosClient from '../../services/axiosClient';
import { getCurrentUser } from '../../services/authService';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
window.Pusher = Pusher;

const AdminInternalChatPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Pusher / Echo instance
  const echoRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await getCurrentUser();
        // Cần lấy thêm thông tin chi tiết nhân viên (như MACUAHANG)
        const res = await axiosClient.get('/me');
        const userDetails = res.data;
        setCurrentUser(userDetails);

        // Khởi tạo Echo
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
        const branchId = userDetails.nhanvien?.MACUAHANG;
        
        const availableChannels = [];
        
        // Quản lý tổng & Quản lý chi nhánh được vào nhóm Managers
        if (role === 0 || role === 1) {
          availableChannels.push({ id: 'managers', name: 'Nhóm Quản Lý' });
        }
        
        // Admin tổng có thể thấy tất cả chi nhánh
        if (role === 0) {
          const storesRes = await axiosClient.get('/admin/stores');
          storesRes.data.forEach(store => {
            availableChannels.push({ id: `branch_${store.id}`, name: `Chi nhánh: ${store.name}` });
          });
        } else if (branchId) {
          availableChannels.push({ id: `branch_${branchId}`, name: 'Nhóm Chi Nhánh Của Tôi' });
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

    // Lấy tin nhắn cũ
    const fetchMessages = async () => {
      try {
        const res = await axiosClient.get(`/chat/internal/${activeChannel}/messages`);
        setMessages(res.data);
        scrollToBottom();
      } catch (error) {
        console.error("Lỗi lấy tin nhắn nội bộ:", error);
      }
    };
    fetchMessages();

    // Subscribe to Pusher
    if (window.Echo) {
      echoRef.current = window.Echo;
      
      const channelName = `internal.${activeChannel}`;
      const channel = window.Echo.private(channelName);
      
      channel.listen('InternalMessageSent', (e) => {
        setMessages(prev => {
          // Tránh duplicate nếu là người gửi
          if (prev.find(m => m.id === e.message.id)) return prev;
          return [...prev, e.message];
        });
        scrollToBottom();
      });
    }

    return () => {
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

    const tempMessage = {
      id: Date.now(),
      sender_username: currentUser.USERNAME,
      HOTEN: currentUser.nhanvien?.HOTEN || 'Tôi',
      message: newMessage,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage("");
    scrollToBottom();

    try {
      const res = await axiosClient.post(`/chat/internal/${activeChannel}/messages`, {
        NOIDUNG: tempMessage.message
      });
      
      setMessages(prev => prev.map(m => m.id === tempMessage.id ? res.data : m));
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
      const errorMsg = error.response?.data?.error || error.message || "Lỗi không xác định";
      alert("Không thể gửi tin nhắn! Lỗi: " + errorMsg);
      // Xóa tin nhắn tạm nếu gửi thất bại
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    }
  };

  if (!currentUser) {
    return (
      <AdminLayout>
        <div style={{ padding: '20px' }}>Đang tải dữ liệu...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ padding: '20px', height: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
        <h2 style={{ color: 'var(--admin-primary)', marginBottom: '15px' }}>Chat Nội Bộ Nhóm</h2>
        
        <div style={{ display: 'flex', flex: 1, backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          {/* Sidebar Channels */}
          <div style={{ width: '250px', borderRight: '1px solid #eee', backgroundColor: '#f9f9f9', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '15px', fontWeight: 'bold', borderBottom: '1px solid #eee', backgroundColor: '#f1f1f1' }}>
              Kênh Trò Chuyện
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {channels.map(ch => (
                <div 
                  key={ch.id}
                  onClick={() => setActiveChannel(ch.id)}
                  style={{ 
                    padding: '15px', 
                    cursor: 'pointer', 
                    borderBottom: '1px solid #eee',
                    backgroundColor: activeChannel === ch.id ? '#e1f5fe' : 'transparent',
                    borderLeft: activeChannel === ch.id ? '4px solid #03a9f4' : '4px solid transparent',
                    fontWeight: activeChannel === ch.id ? 'bold' : 'normal',
                    fontSize: '14px'
                  }}
                >
                  <i className={ch.id === 'managers' ? "fa-solid fa-user-tie" : "fa-solid fa-users"} style={{ marginRight: '8px', color: '#555' }}></i>
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
                <div style={{ padding: '15px', borderBottom: '1px solid #eee', fontWeight: 'bold', backgroundColor: '#fff', fontSize: '16px' }}>
                  {channels.find(c => c.id === activeChannel)?.name}
                </div>
                
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#f4f7f6', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {messages.map((msg, idx) => {
                    const isMe = msg.sender_username === currentUser.USERNAME;
                    return (
                      <div key={msg.id || idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                        <span style={{ fontSize: '11px', color: '#888', marginBottom: '3px', marginLeft: '5px', marginRight: '5px' }}>
                          {isMe ? 'Bạn' : (msg.HOTEN || msg.sender_username)}
                        </span>
                        <div style={{ 
                          maxWidth: '70%', 
                          padding: '10px 15px', 
                          borderRadius: '15px', 
                          backgroundColor: isMe ? '#0084ff' : 'white',
                          color: isMe ? 'white' : 'black',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          fontSize: '14px',
                          lineHeight: '1.4'
                        }}>
                          {msg.message}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} style={{ padding: '15px', borderTop: '1px solid #eee', backgroundColor: 'white', display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..." 
                    style={{ flex: 1, padding: '10px 15px', border: '1px solid #ccc', borderRadius: '20px', outline: 'none', fontSize: '14px' }}
                  />
                  <button type="submit" style={{ backgroundColor: '#0084ff', color: 'white', border: 'none', borderRadius: '20px', padding: '0 20px', cursor: 'pointer', fontWeight: 'bold' }}>
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
