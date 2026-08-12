import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axiosClient from '../../services/axiosClient';
import '../../css/admin.css';
import { useToast } from '../../components/Toast/Toast';

window.Pusher = Pusher;

const AdminChatPage = () => {
    const toast = useToast();
const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    import('../../services/authService').then(({ getCurrentUser }) => {
      getCurrentUser().then(user => {
        setCurrentUser(user);
        initEcho();
      });
    });

    fetchConversations();
  }, []);

  const [isCustomerTyping, setIsCustomerTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const initEcho = () => {
    if (window.Echo) return;
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
  };

  const fetchConversations = async () => {
    try {
      const res = await axiosClient.get('/chat/conversations');
      setConversations(res.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách hội thoại:", error);
    }
  };

  const handleSelectConversation = async (conv) => {
    // Rời kênh cũ (nếu có)
    if (activeConversation) {
      window.Echo.leave(`chat.${activeConversation.MACUOCTROCHUYEN}`);
    }

    setActiveConversation(conv);
    try {
      const res = await axiosClient.get(`/chat/conversations/${conv.MACUOCTROCHUYEN}/messages`);
      setMessages(res.data);

      // Đăng ký nghe kênh mới
      const channel = window.Echo.private(`chat.${conv.MACUOCTROCHUYEN}`);
      channel.listen('.MessageSent', (e) => {
          setMessages(prev => {
            const exists = prev.find(m => m.MATINNHAN === e.message.MATINNHAN);
            if (exists) {
              return prev.map(m => m.MATINNHAN === e.message.MATINNHAN ? e.message : m);
            }
            return [...prev, e.message];
          });
        })
        .listenForWhisper('typing', (e) => {
          setIsCustomerTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsCustomerTyping(false), 2000);
        });
    } catch (error) {
      console.error("Lỗi lấy tin nhắn:", error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isCustomerTyping]);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (activeConversation) {
      window.Echo.private(`chat.${activeConversation.MACUOCTROCHUYEN}`).whisper('typing', { username: currentUser.USERNAME });
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

  return (
    <AdminLayout>
      <div className="admin-header">
        <h1>Hỗ trợ trực tuyến (Live Chat)</h1>
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
                      ? conv.tinnhans[0].NOIDUNG.substring(0, 30) + '...'
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
                {messages.map(msg => {
                  const isMine = msg.LOAINGUOIGUI === 'nhanvien';
                  const isRecalled = msg.NOIDUNG === '🚫 Tin nhắn đã bị thu hồi';
                  return (
                    <div key={msg.MATINNHAN} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', position: 'relative' }} className="msg-hover-wrap">
                      <div style={{
                        maxWidth: '70%',
                        padding: '12px 16px',
                        borderRadius: '18px',
                        backgroundColor: isRecalled ? '#eee' : (isMine ? 'var(--admin-primary)' : 'white'),
                        color: isRecalled ? '#999' : (isMine ? 'white' : '#333'),
                        fontStyle: isRecalled ? 'italic' : 'normal',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                        borderBottomRightRadius: isMine ? '4px' : '18px',
                        borderBottomLeftRadius: isMine ? '18px' : '4px',
                        position: 'relative'
                      }}>
                        {msg.NOIDUNG}
                        {isMine && !isRecalled && (
                          <button 
                            title="Thu hồi tin nhắn"
                            onClick={() => handleRecall(msg.MATINNHAN)}
                            style={{ position: 'absolute', left: '-30px', top: '10px', background: 'none', border: 'none', color: '#ff4757', cursor: 'pointer', fontSize: '14px', opacity: 0.6 }}
                          >
                            <i className="fa-solid fa-rotate-left"></i>
                          </button>
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
        <div style={{ flex: '0 0 30%', maxWidth: '350px', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
          <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
            Công cụ Hỗ trợ
          </div>
          <div style={{ padding: '15px', overflowY: 'auto', flex: 1 }}>
            {activeConversation ? (
              <CskhPanel makh={activeConversation.MAKH} conversationId={activeConversation.MACUOCTROCHUYEN} />
            ) : (
              <p style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>Vui lòng chọn khách hàng để tra cứu</p>
            )}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

// Component con hiển thị Bảng Công cụ CSKH
const CskhPanel = ({ makh, conversationId }) => {
  const [customerInfo, setCustomerInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [searchSp, setSearchSp] = useState('');
  const [stockResult, setStockResult] = useState([]);
  
  // State Đặt hàng nhiều sản phẩm
  const [orderItems, setOrderItems] = useState([]);
  const [orderProduct, setOrderProduct] = useState('');
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderStore, setOrderStore] = useState('');
  const [orderAddress, setOrderAddress] = useState('');
  const [shippingFee, setShippingFee] = useState(30000);
  const [stores, setStores] = useState([]);
  
  // State GHN
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  
  useEffect(() => {
    fetchCustomerInfo();
    fetchProducts();
    fetchStores();
  }, [makh]);

  const fetchCustomerInfo = async () => {
    try {
      const res = await axiosClient.get(`/cskh/customer-info/${makh}`);
      setCustomerInfo(res.data);
      if (res.data.khachhang?.DIACHI) {
        setOrderAddress(res.data.khachhang.DIACHI);
      }
    } catch (e) {
      console.log('Lỗi lấy TT Khách hàng', e);
    }
  };

  // Load Provinces
  useEffect(() => {
    import('../../services/axiosClient.js').then(m => {
        m.default.get('/ghn/provinces').then(res => {
            if (res.data && res.data.data) {
                setProvinces(res.data.data);
            }
        });
    });
  }, []);

  // Load Districts
  useEffect(() => {
      if (selectedProvince) {
          import('../../services/axiosClient.js').then(m => {
              m.default.get('/ghn/districts?province_id=' + selectedProvince).then(res => {
                  if (res.data && res.data.data) {
                      setDistricts(res.data.data);
                      setWards([]);
                      setSelectedDistrict("");
                      setSelectedWard("");
                      setShippingFee(0);
                  }
              });
          });
      }
  }, [selectedProvince]);

  // Load Wards
  useEffect(() => {
      if (selectedDistrict) {
          import('../../services/axiosClient.js').then(m => {
              m.default.get('/ghn/wards?district_id=' + selectedDistrict).then(res => {
                  if (res.data && res.data.data) {
                      setWards(res.data.data);
                      setSelectedWard("");
                      setShippingFee(0);
                  }
              });
          });
      }
  }, [selectedDistrict]);

  // Calc Fee
  useEffect(() => {
      if (selectedWard && selectedDistrict && orderItems.length > 0) {
          import('../../services/axiosClient.js').then(m => {
              m.default.post('/ghn/fee', {
                  to_ward_code: String(selectedWard),
                  to_district_id: parseInt(selectedDistrict),
                  weight: orderItems.length * 500 // estimate 500g/sp
              }).then(res => {
                  if (res.data && res.data.code === 200 && res.data.data && res.data.data.total) {
                      setShippingFee(res.data.data.total);
                  } else {
                      setShippingFee(30000);
                  }
              }).catch(e => {
                  setShippingFee(30000);
              });
          });
      }
  }, [selectedWard, selectedDistrict, orderItems.length]);

  const fetchProducts = async () => {
    try {
      const res = await axiosClient.get('/products');
      setProducts(res.data.data || res.data);
    } catch (e) {
      console.log('Lỗi lấy DS Sản phẩm', e);
    }
  };

  const fetchStores = async () => {
    try {
      const res = await axiosClient.get('/cskh/nearby-stores');
      setStores(res.data);
    } catch (e) {
      console.log('Lỗi lấy DS Cửa hàng', e);
    }
  };

  const handleSearchStock = async () => {
    if (!searchSp) return;
    try {
      const res = await axiosClient.get(`/cskh/product-stock?masp=${searchSp}`);
      setStockResult(res.data);
    } catch (e) {
      console.log('Lỗi lấy tồn kho', e);
    }
  };

  const handleAddItem = () => {
    if (!orderProduct || orderQuantity < 1) {
      toast.warning("Vui lòng chọn sản phẩm và số lượng hợp lệ!");
      return;
    }
    const productDetail = products.find(p => p.MASP === parseInt(orderProduct) || p.MASP === orderProduct);
    if (!productDetail) return;

    // Check if item already exists
    const existingIdx = orderItems.findIndex(i => i.MASP === productDetail.MASP);
    if (existingIdx >= 0) {
      const newItems = [...orderItems];
      newItems[existingIdx].SOLUONG += parseInt(orderQuantity);
      setOrderItems(newItems);
    } else {
      setOrderItems([...orderItems, { ...productDetail, SOLUONG: parseInt(orderQuantity) }]);
    }
    
    // Reset inputs
    setOrderProduct('');
    setOrderQuantity(1);
  };

  const handleRemoveItem = (masp) => {
    setOrderItems(orderItems.filter(i => i.MASP !== masp));
  };

  const handlePlaceOrder = async () => {
    if (orderItems.length === 0) {
      toast.warning("Vui lòng thêm ít nhất một sản phẩm vào đơn hàng!");
      return;
    }
    if (!orderStore) {
      toast.warning("Vui lòng chọn chi nhánh xuất hàng!");
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
      toast.warning("Vui lòng nhập địa chỉ giao hàng!");
      return;
    }

    try {
      const res = await axiosClient.post(`/cskh/place-order/${makh}`, {
        MACUAHANG: orderStore,
        DIACHIGIAO: fullAddress,
        shippingFee: parseInt(shippingFee) || 0,
        items: orderItems.map(i => ({ MASP: i.MASP, SOLUONG: i.SOLUONG }))
      });
      toast.success(`Đặt hàng thành công! Mã hóa đơn: ${res.data.mahd}`);
      
      // Reset
      setOrderItems([]);
      setOrderStore('');
      
      // Gửi tin nhắn thông báo cho khách qua Chat
      await axiosClient.post(`/chat/conversations/${conversationId}/messages`, {
        NOIDUNG: `CSKH đã đặt giúp bạn 1 đơn hàng (Mã: ${res.data.mahd}). Phương thức thanh toán: COD. Xin cảm ơn quý khách!`
      });
    } catch (error) {
      toast.error(error.response?.data?.error || "Lỗi khi đặt hàng giùm khách.");
    }
  };

  if (!customerInfo) return <p>Đang tải dữ liệu khách hàng...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {/* 1. Thông tin Khách hàng */}
      <div>
        <h4 style={{ margin: '0 0 8px 0', color: 'var(--admin-primary)', fontSize: '14px' }}>1. Thông tin Khách hàng</h4>
        <div style={{ fontSize: '13px', lineHeight: '1.6', padding: '10px', backgroundColor: '#f4f7f6', borderRadius: '8px' }}>
          <strong>Họ tên:</strong> {customerInfo.khachhang?.HOTEN}<br />
          <strong>SĐT:</strong> {customerInfo.khachhang?.SDT}<br />
          <strong>Địa chỉ:</strong> {customerInfo.khachhang?.DIACHI}<br />
          <strong>Điểm tích lũy:</strong> <span style={{ color: 'orange', fontWeight: 'bold' }}>{customerInfo.diemtichluy} điểm</span>
        </div>
      </div>

      {/* 2. Tra cứu Tồn kho */}
      <div>
        <h4 style={{ margin: '0 0 8px 0', color: 'var(--admin-primary)', fontSize: '14px' }}>2. Tra cứu Tồn kho</h4>
        <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
          <select 
            value={searchSp} 
            onChange={(e) => setSearchSp(e.target.value)}
            style={{ flex: 1, padding: '6px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px', minWidth: 0 }}
          >
            <option value="">-- Chọn sản phẩm --</option>
            {products.map(p => (
              <option key={p.MASP} value={p.MASP}>{p.TENSP}</option>
            ))}
          </select>
          <button 
            onClick={handleSearchStock}
            style={{ backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', padding: '0 10px', cursor: 'pointer', fontSize: '12px' }}
          >Tìm</button>
        </div>

        {stockResult.length > 0 && (
          <div style={{ fontSize: '12px', maxHeight: '150px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '4px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#eee', textAlign: 'left', position: 'sticky', top: 0 }}>
                  <th style={{ padding: '5px' }}>Chi nhánh</th>
                  <th style={{ padding: '5px', width: '30px' }}>Tồn</th>
                </tr>
              </thead>
              <tbody>
                {stockResult.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '5px' }}>{item.TENCUAHANG}<br/><i style={{fontSize:'10px', color:'#777'}}>{item.DIACHI}</i></td>
                    <td style={{ padding: '5px', fontWeight: 'bold', color: item.SOLUONG_TON > 0 ? 'green' : 'red' }}>
                      {item.SOLUONG_TON}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Đặt hàng COD */}
      <div>
        <h4 style={{ margin: '0 0 8px 0', color: 'var(--admin-primary)', fontSize: '14px' }}>3. Đặt hàng COD giùm khách</h4>
        
        {/* Form thêm SP vào đơn */}
        <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
          <select 
            title="Chọn sản phẩm"
            value={orderProduct} 
            onChange={(e) => setOrderProduct(e.target.value)}
            style={{ flex: 1, padding: '6px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px', minWidth: 0 }}
          >
            <option value="">-- SP --</option>
            {products.map(p => (
              <option key={p.MASP} value={p.MASP}>{p.TENSP} ({(Number(p.GIABAN) || 0).toLocaleString()}đ)</option>
            ))}
          </select>
          <input 
            type="number" 
            title="Số lượng"
            min="1" 
            value={orderQuantity} 
            onChange={e => setOrderQuantity(e.target.value)}
            style={{ width: '45px', padding: '6px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }}
          />
          <button 
            onClick={handleAddItem}
            style={{ backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', padding: '0 10px', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}
          >Thêm</button>
        </div>

        {/* Danh sách SP đã thêm */}
        {orderItems.length > 0 && (
          <div style={{ border: '1px solid #eee', borderRadius: '4px', marginBottom: '10px', padding: '5px', fontSize: '12px', backgroundColor: '#fdfdfd' }}>
            {orderItems.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: idx < orderItems.length - 1 ? '1px dashed #ccc' : 'none' }}>
                <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <span style={{ fontWeight: 'bold' }}>{item.SOLUONG}x</span> {item.TENSP}
                </div>
                <div style={{ marginRight: '10px', color: '#e17055', fontWeight: 'bold' }}>
                  {((Number(item.GIABAN) || 0) * item.SOLUONG).toLocaleString()}đ
                </div>
                <button 
                  onClick={() => handleRemoveItem(item.MASP)}
                  style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', padding: '0 5px' }}
                >✖</button>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #ccc', marginTop: '5px', paddingTop: '5px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
              Tạm tính: {(orderItems.reduce((acc, item) => acc + (Number(item.GIABAN) || 0) * item.SOLUONG, 0)).toLocaleString()}đ<br/>
              Tổng (Gồm phí ship): <span style={{ color: '#e17055' }}>
                {(orderItems.reduce((acc, item) => acc + (Number(item.GIABAN) || 0) * item.SOLUONG, 0) + (parseInt(shippingFee) || 0)).toLocaleString()}đ
              </span>
            </div>
          </div>
        )}

        {/* Form chốt đơn */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' }}>
          <select value={selectedProvince} onChange={(e) => setSelectedProvince(e.target.value)} style={{ padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px' }}>
            <option value="">-- Chọn Tỉnh/Thành phố --</option>
            {provinces.map(p => <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>)}
          </select>
          <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} disabled={!selectedProvince} style={{ padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px' }}>
            <option value="">-- Chọn Quận/Huyện --</option>
            {districts.map(d => <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>)}
          </select>
          <select value={selectedWard} onChange={(e) => setSelectedWard(e.target.value)} disabled={!selectedDistrict} style={{ padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px' }}>
            <option value="">-- Chọn Phường/Xã --</option>
            {wards.map(w => <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>)}
          </select>
          <textarea 
            placeholder="Số nhà, tên đường (Địa chỉ cụ thể)..."
            value={orderAddress}
            onChange={(e) => setOrderAddress(e.target.value)}
            rows="2"
            style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px', resize: 'none' }}
          ></textarea>
        </div>

        <select 
          value={orderStore} 
          onChange={(e) => setOrderStore(e.target.value)}
          style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px', marginBottom: '10px' }}
        >
          <option value="">-- Chọn chi nhánh kho xuất hàng --</option>
          {stores.map(s => (
            <option key={s.MACUAHANG} value={s.MACUAHANG}>{s.TENCUAHANG} - {s.DIACHI}</option>
          ))}
        </select>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '10px' }}>
          <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>Phí vận chuyển (đ):</span>
          <input 
            type="number" 
            min="0"
            value={shippingFee}
            onChange={(e) => setShippingFee(e.target.value)}
            style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }}
          />
        </div>

        <button 
          onClick={handlePlaceOrder}
          disabled={orderItems.length === 0}
          style={{ width: '100%', padding: '10px', backgroundColor: orderItems.length === 0 ? '#ccc' : '#e17055', color: 'white', border: 'none', borderRadius: '4px', cursor: orderItems.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '13px' }}
        >
          Tạo đơn hàng COD ({orderItems.length} SP)
        </button>
      </div>
    </div>
  );
};

export default AdminChatPage;
