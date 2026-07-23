import React, { useState, useEffect, useRef } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axiosClient from '../services/axiosClient';
import '../css/chat.css';

// Để có thể truy cập Pusher toàn cục
window.Pusher = Pusher;

const ChatBox = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const [isStaffTyping, setIsStaffTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Chỉ bật tính năng khi là khách hàng
    if (!currentUser || currentUser.MAROLE !== 3) return;

    // Khởi tạo Echo lắng nghe Pusher
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

    // Bắt đầu hoặc lấy đoạn chat cũ
    const initChat = async () => {
      try {
        const res = await axiosClient.post('/chat/conversations');
        const conv = res.data;
        setConversationId(conv.MACUOCTROCHUYEN);

        // Lấy lịch sử tin nhắn
        const histRes = await axiosClient.get(`/chat/conversations/${conv.MACUOCTROCHUYEN}/messages`);
        setMessages(histRes.data);

        // Đăng ký lắng nghe kênh chat (Private Channel)
        window.Echo.private(`chat.${conv.MACUOCTROCHUYEN}`)
          .listen('.MessageSent', (e) => {
            setMessages(prev => {
              const exists = prev.find(m => m.MATINNHAN === e.message.MATINNHAN);
              if (exists) {
                return prev.map(m => m.MATINNHAN === e.message.MATINNHAN ? e.message : m);
              }
              return [...prev, e.message];
            });
          })
          .listenForWhisper('typing', (e) => {
            setIsStaffTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setIsStaffTyping(false), 2000);
          });
      } catch (error) {
        console.error("Lỗi khởi tạo chat:", error);
      }
    };

    initChat();

    // Dọn dẹp khi unmount
    return () => {
      if (conversationId) {
        window.Echo.leave(`chat.${conversationId}`);
      }
    };
  }, [currentUser]);

  // Cuộn xuống cuối mỗi khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isStaffTyping]);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (conversationId) {
      window.Echo.private(`chat.${conversationId}`).whisper('typing', { username: currentUser.USERNAME });
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId) return;

    const messageText = newMessage;
    setNewMessage(''); // Xóa input ngay lập tức cho mượt

    try {
      const res = await axiosClient.post(`/chat/conversations/${conversationId}/messages`, {
        NOIDUNG: messageText
      });
      setMessages(prev => [...prev, res.data]);
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
      alert('Không thể gửi tin nhắn.');
    }
  };

  const handleRecall = async (msgId) => {
    try {
      const res = await axiosClient.delete(`/chat/conversations/${conversationId}/messages/${msgId}`);
      setMessages(prev => prev.map(m => m.MATINNHAN === msgId ? res.data : m));
    } catch (error) {
      alert("Không thể thu hồi tin nhắn này.");
    }
  };

  if (!currentUser || currentUser.MAROLE !== 3) return null;

  return (
    <div className="chatbox-container">
      {isOpen ? (
        <div className="chatbox-window">
          <div className="chatbox-header" onClick={() => setIsOpen(false)}>
            <div className="chatbox-title">
              <span className="online-dot"></span> Hỗ trợ Dola Bakery
            </div>
            <button className="chatbox-close">✖</button>
          </div>
          
          <div className="chatbox-messages">
            {messages.map((msg) => {
              const isMine = msg.LOAINGUOIGUI === 'khachhang';
              const isRecalled = msg.NOIDUNG === '🚫 Tin nhắn đã bị thu hồi';
              return (
                <div key={msg.MATINNHAN} className={`chatbox-message-wrapper ${isMine ? 'mine' : 'theirs'}`} style={{ position: 'relative' }}>
                  {!isMine && <div className="chatbox-avatar">🍞</div>}
                  <div className={`chatbox-message ${isMine ? 'mine' : 'theirs'}`} style={{
                    backgroundColor: isRecalled ? '#eee' : undefined,
                    color: isRecalled ? '#999' : undefined,
                    fontStyle: isRecalled ? 'italic' : 'normal',
                    border: isRecalled ? 'none' : undefined
                  }}>
                    {msg.NOIDUNG}
                    {isMine && !isRecalled && (
                      <button 
                        title="Thu hồi"
                        onClick={() => handleRecall(msg.MATINNHAN)}
                        style={{ position: 'absolute', left: '-25px', top: '10px', background: 'none', border: 'none', color: '#ff4757', cursor: 'pointer', fontSize: '12px' }}
                      >
                        <i className="fa-solid fa-rotate-left"></i>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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
            <button type="submit">Gửi</button>
          </form>
        </div>
      ) : (
        <button className="chatbox-toggle-btn" onClick={() => setIsOpen(true)}>
          💬 Chat với chúng tôi
        </button>
      )}
    </div>
  );
};

export default ChatBox;
