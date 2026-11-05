import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Footer from '../Layout/Footer';
import axiosClient from '../services/axiosClient';
import { formatImageUrl } from '../utils/imageUtils';
import { addToCart } from '../services/cartService';
import { addToWishlist } from '../services/wishlistService';
import { useToast } from '../components/Toast/Toast';
import CookieSpinner from '../components/CookieSpinner';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isAddingCart, setIsAddingCart] = useState(false);
  const [isAddingWishlist, setIsAddingWishlist] = useState(false);
  const [replyingReviewId, setReplyingReviewId] = useState(null);
  const [reviewCommentText, setReviewCommentText] = useState('');
  const [submittingReviewComment, setSubmittingReviewComment] = useState(false);
  const [isRefreshingReviews, setIsRefreshingReviews] = useState(false);

  const fetchReviews = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshingReviews(true);
    try {
      const prodId = product?.id || id;
      const reviewsRes = await axiosClient.get(`/products/${prodId}/reviews`, {
        params: { _t: Date.now() }
      });
      if (Array.isArray(reviewsRes.data)) {
        setReviews(reviewsRes.data);
      }
    } catch (e) {
      // silent catch for polling
    } finally {
      if (isManual) setIsRefreshingReviews(false);
    }
  }, [id, product?.id]);

  // Polling tự động làm mới đánh giá & bình luận sản phẩm mỗi 3 giây (Realtime)
  useEffect(() => {
    if (!id) return;
    const interval = setInterval(() => {
      fetchReviews(false);
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchReviews, id]);


  const handleSendReviewComment = async (reviewId) => {
    if (!localStorage.getItem('access_token')) {
      toast.warning('Vui lòng đăng nhập để bình luận vào đánh giá này!');
      return;
    }
    if (!reviewCommentText.trim()) {
      toast.warning('Vui lòng nhập nội dung bình luận!');
      return;
    }
    setSubmittingReviewComment(true);
    try {
      await axiosClient.post(`/reviews/${reviewId}/comments`, {
        noiDung: reviewCommentText.trim()
      });
      toast.success('Bình luận của bạn đã được đăng thành công!');
      setReviewCommentText('');
      setReplyingReviewId(null);
      // Reload reviews realtime
      await fetchReviews(true);
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || e.response?.data?.error || 'Không thể gửi bình luận lúc này!');
    } finally {
      setSubmittingReviewComment(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        const [productRes, reviewsRes] = await Promise.all([
          axiosClient.get(`/products/${id}`),
          axiosClient.get(`/products/${id}/reviews`).catch(() => ({ data: [] }))
        ]);
        
        const prod = productRes.data;
        setProduct(prod);
        setReviews(reviewsRes.data || []);

        // Fetch related products based on category or general product list
        try {
          const categoryId = prod.loai_id || prod.LOAISP || prod.MALOAI;
          const relatedRes = await axiosClient.get('/products', {
            params: { category: categoryId, size: 4 }
          });
          const list = relatedRes.data?.data || (Array.isArray(relatedRes.data) ? relatedRes.data : []);
          // Filter out current product
          const filtered = list.filter(p => (p.id || p.MASP || p.maSP) != id).slice(0, 4);
          setRelatedProducts(filtered);
        } catch (e) {
          console.error("Lỗi lấy sản phẩm liên quan:", e);
        }

      } catch (error) {
        console.error("Lỗi khi tải thông tin sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    const branches = product?.branchAvailability || [];
    const isOutOfStock = Boolean(
      product?.isOutOfStock ||
      (branches.length > 0 && branches.every(b => !b.conHang)) ||
      (product?.soLuongTon !== undefined && Number(product.soLuongTon) <= 0)
    );
    if (isOutOfStock) {
      toast.error("Sản phẩm này hiện đang tạm hết hàng tại tất cả chi nhánh!");
      return;
    }
    const masp = product.id || product.MASP || product.maSP;
    setIsAddingCart(true);
    try {
      await addToCart(masp, quantity);
      toast.success(`Đã thêm ${quantity} "${product.ten_san_pham || product.TENSP}" vào giỏ hàng!`);
      document.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      console.error("Lỗi thêm vào giỏ:", err);
      if (err.response?.status === 401) {
        toast.warning("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
      } else {
        toast.error(err.response?.data?.message || err.response?.data?.error || "Không thể thêm sản phẩm vào giỏ!");
      }
    } finally {
      setIsAddingCart(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!product) return;
    const masp = product.id || product.MASP || product.maSP;
    setIsAddingWishlist(true);
    try {
      const res = await addToWishlist(masp);
      if (res?.already_exists) {
        toast.info("Sản phẩm đã có trong danh sách yêu thích của bạn.");
      } else {
        toast.success(`Đã thêm "${product.ten_san_pham || product.TENSP}" vào danh sách yêu thích!`);
      }
      document.dispatchEvent(new Event("wishlistUpdated"));
    } catch (err) {
      console.error("Lỗi thêm yêu thích:", err);
      if (err.response?.status === 401) {
        toast.warning("Vui lòng đăng nhập để lưu sản phẩm yêu thích!");
      } else {
        toast.error(err.response?.data?.error || err.response?.data?.message || "Có lỗi xảy ra khi thêm vào yêu thích!");
      }
    } finally {
      setIsAddingWishlist(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div style={{ color: '#f39c12', fontSize: '14px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <i key={star} className={star <= rating ? "fa-solid fa-star" : "fa-regular fa-star"}></i>
        ))}
      </div>
    );
  };

  if (loading) {
    return <CookieSpinner fullPage text="Đang tải thông tin chi tiết sản phẩm..." />;
  }

  if (!product) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 20px', backgroundColor: '#faf9f6', minHeight: '60vh' }}>
        <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '48px', color: '#e74c3c', marginBottom: '15px' }}></i>
        <h2 style={{ fontSize: '22px', color: '#333', marginBottom: '10px' }}>Không tìm thấy sản phẩm!</h2>
        <p style={{ color: '#777', marginBottom: '20px' }}>Sản phẩm này không tồn tại hoặc đã bị ngừng kinh doanh.</p>
        <Link to="/san-pham" style={{ padding: '10px 24px', backgroundColor: 'var(--primary-color)', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>
          Xem danh sách sản phẩm
        </Link>
      </div>
    );
  }

  const productName = product.tenSanPham || product.ten_san_pham || product.TENSP || "Sản phẩm Givral Bakery";
  const productPrice = Number(product.giaBan || product.gia_ban || product.GIABAN || 0);
  const formattedPrice = productPrice > 0 ? `${productPrice.toLocaleString('vi-VN')} đ` : "Liên hệ";
  const rawImage = product.hinhAnh || product.hinh_anh || product.HINHANH;
  const productImage = formatImageUrl(rawImage);

  const branches = product?.branchAvailability || [];
  const isOutOfStock = Boolean(
    product?.isOutOfStock ||
    (branches.length > 0 && branches.every(b => !b.conHang)) ||
    (product?.soLuongTon !== undefined && Number(product.soLuongTon) <= 0)
  );

  return (
    <>
      <main style={{ backgroundColor: '#fff', padding: '40px 0 60px 0', minHeight: '70vh' }}>
        <div className="grid wide" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 15px' }}>
          
          {/* PHẦN CHI TIẾT SẢN PHẨM TRÊN */}
          <div className="row" style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', marginBottom: '60px' }}>
            
            {/* CỘT TRÁI: HÌNH ẢNH SẢN PHẨM KHUNG VIỀN MỀM VÀ MŨI TÊN CHUYỂN */}
            <div className="col l-5 m-12 c-12" style={{ flex: '1 1 420px' }}>
              <div style={{
                border: '1px solid #e5e5e5',
                borderRadius: '12px',
                padding: '15px',
                backgroundColor: '#fff',
                boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '380px'
              }}>
                <img 
                  src={productImage} 
                  alt={productName} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/assets/IMG/productnew2.webp';
                  }}
                  style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', borderRadius: '8px' }}
                />
                
                {/* Visual Carousel Arrows */}
                <button 
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.85)',
                    border: '1px solid #ddd',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666'
                  }}
                  onClick={() => toast.info("Xem ảnh sản phẩm")}
                >
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <button 
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.85)',
                    border: '1px solid #ddd',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666'
                  }}
                  onClick={() => toast.info("Xem ảnh sản phẩm")}
                >
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            </div>

            {/* CỘT PHẢI: THÔNG TIN SẢN PHẨM & NÚT HÀNH ĐỘNG & 4 CHÍNH SÁCH */}
            <div className="col l-7 m-12 c-12" style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: '28px', color: '#2c3e50', fontWeight: '700', marginBottom: '10px' }}>
                {productName}
              </h2>
              
              <div style={{ fontSize: '15px', color: '#7f8c8d', marginBottom: '10px' }}>
                Thương hiệu: <span style={{ color: '#d39e00', fontWeight: '600' }}>Givral Bakery</span>
              </div>

              {/* Tình trạng tồn kho tổng thể */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                <span style={{ fontSize: '14px', color: '#555', fontWeight: '500' }}>Tình trạng:</span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '700',
                  backgroundColor: isOutOfStock ? '#fee2e2' : '#dcfce7',
                  color: isOutOfStock ? '#dc2626' : '#16a34a'
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isOutOfStock ? '#dc2626' : '#16a34a' }}></span>
                  {isOutOfStock ? "Tạm hết hàng" : "Còn hàng"}
                </span>
              </div>

              <div style={{
                fontFamily: "'Dancing Script', 'Playfair Display', cursive, serif",
                fontSize: '34px',
                fontWeight: 'bold',
                color: '#d39e00',
                marginBottom: '20px'
              }}>
                {formattedPrice}
              </div>

              {/* TÌNH TRẠNG THEO CỬA HÀNG (CHỈ HIỂN THỊ TRẠNG THÁI, KHÔNG HIỂN THỊ SỐ LƯỢNG TỒN) */}
              {branches.length > 0 && (
                <div style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '22px',
                  backgroundColor: '#f9fafb'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-store" style={{ color: '#d39e00' }}></i>
                    Tình trạng tại các cửa hàng Givral Bakery:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {branches.map((b) => (
                      <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '6px 0', borderBottom: '1px dashed #e5e7eb' }}>
                        <div>
                          <span style={{ fontWeight: '600', color: '#1f2937' }}>{b.tenCuaHang}</span>
                          {b.diaChi && <span style={{ color: '#6b7280', fontSize: '12px', display: 'block' }}>{b.diaChi}</span>}
                        </div>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          backgroundColor: b.conHang ? '#dcfce7' : '#fee2e2',
                          color: b.conHang ? '#16a34a' : '#dc2626',
                          whiteSpace: 'nowrap'
                        }}>
                          {b.conHang ? "🟢 Còn hàng" : "🔴 Tạm hết"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NÚT THÊM GIỎ HÀNG & NÚT YÊU THÍCH (CÂN BẰNG CHIỀU CAO & NỔI BẬT) */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '25px', alignItems: 'center' }}>
                
                {/* Bộ chọn số lượng */}
                <div style={{ display: 'flex', border: '1px solid #ccc', borderRadius: '6px', overflow: 'hidden', height: '46px', opacity: isOutOfStock ? 0.6 : 1 }}>
                  <button 
                    disabled={isOutOfStock}
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    style={{ padding: '0 16px', background: '#f8f9fa', border: 'none', cursor: isOutOfStock ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px' }}
                  >-</button>
                  <input 
                    type="number" 
                    disabled={isOutOfStock}
                    value={quantity} 
                    onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ width: '45px', textAlign: 'center', border: 'none', fontWeight: 'bold', outline: 'none', fontSize: '15px' }}
                  />
                  <button 
                    disabled={isOutOfStock}
                    onClick={() => setQuantity(prev => prev + 1)}
                    style={{ padding: '0 16px', background: '#f8f9fa', border: 'none', cursor: isOutOfStock ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px' }}
                  >+</button>
                </div>

                {/* Nút Thêm Vào Giỏ hàng */}
                <button 
                  onClick={handleAddToCart}
                  disabled={isAddingCart || isOutOfStock}
                  style={{
                    height: '46px',
                    padding: '0 24px',
                    backgroundColor: isOutOfStock ? '#9ca3af' : '#d39e00',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                    fontSize: '15px',
                    boxShadow: isOutOfStock ? 'none' : '0 4px 10px rgba(211, 158, 0, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <i className="fa-solid fa-cart-shopping"></i>
                  {isOutOfStock ? "Tạm hết hàng" : (isAddingCart ? "Đang thêm..." : "Thêm vào giỏ hàng")}
                </button>

                {/* Nút Yêu Thích chuẩn kích thước 46px */}
                <button 
                  onClick={handleAddToWishlist}
                  disabled={isAddingWishlist}
                  style={{
                    height: '46px',
                    padding: '0 20px',
                    backgroundColor: '#fff',
                    color: '#d39e00',
                    border: '2px solid #d39e00',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '14px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <i className="fa-regular fa-heart" style={{ fontSize: '18px' }}></i>
                  {isAddingWishlist ? "Đang lưu..." : "YÊU THÍCH"}
                </button>

              </div>

              {/* 4 KHỐI CHÍNH SÁCH 2X2 GRID (Matching Screenshot #1) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginTop: 'auto' }}>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#fff' }}>
                  <i className="fa-solid fa-box-open" style={{ fontSize: '28px', color: '#d39e00', marginTop: '3px' }}></i>
                  <div>
                    <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#d39e00', fontWeight: 'bold' }}>Miễn phí vận chuyển</h5>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666', lineHeight: '1.4' }}>Áp dụng free ship cho tất cả đơn hàng từ 300 nghìn</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#fff' }}>
                  <i className="fa-solid fa-arrows-rotate" style={{ fontSize: '28px', color: '#d39e00', marginTop: '3px' }}></i>
                  <div>
                    <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#d39e00', fontWeight: 'bold' }}>Đổi trả dễ dàng</h5>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666', lineHeight: '1.4' }}>Đổi ngay trong ngày nếu như bánh không đúng yêu cầu</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#fff' }}>
                  <i className="fa-solid fa-headset" style={{ fontSize: '28px', color: '#d39e00', marginTop: '3px' }}></i>
                  <div>
                    <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#d39e00', fontWeight: 'bold' }}>Hỗ trợ nhanh chóng</h5>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666', lineHeight: '1.4' }}>Gọi Hotline: 19006750 để được hỗ trợ ngay</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#fff' }}>
                  <i className="fa-regular fa-credit-card" style={{ fontSize: '28px', color: '#d39e00', marginTop: '3px' }}></i>
                  <div>
                    <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#d39e00', fontWeight: 'bold' }}>Thanh toán đa dạng</h5>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666', lineHeight: '1.4' }}>Thanh toán khi nhận hàng, Napas, Visa, Chuyển Khoản</p>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* SECTION 2: MÔ TẢ SẢN PHẨM (Matching Screenshot #2) */}
          <div style={{ margin: '60px 0 40px 0', textAlign: 'center' }}>
            <h3 style={{
              fontFamily: "'Dancing Script', 'Playfair Display', cursive, serif",
              fontSize: '36px',
              color: '#d39e00',
              fontWeight: '700',
              marginBottom: '8px'
            }}>
              Mô tả sản phẩm
            </h3>
            
            {/* Thanh gạch dưới màu vàng */}
            <div style={{ width: '80px', height: '2px', backgroundColor: '#d39e00', margin: '0 auto 25px auto' }}></div>

            <div style={{
              maxWidth: '900px',
              margin: '0 auto',
              fontSize: '15px',
              color: '#444',
              lineHeight: '1.8',
              textAlign: 'center',
              padding: '0 15px'
            }}>
              {product.moTa || product.mo_ta || product.MOTA || 'Thành phần: Trứng gà, đường, bột mì, bột ca cao, hương cà phê tổng hợp, hương vani tổng hợp, bột làm bánh Tartar, bơ, mật ong, siro đường, rượu rum.'}
            </div>
          </div>

          {/* SECTION 3: SẢN PHẨM LIÊN QUAN (Matching Screenshot #2) */}
          <div style={{ margin: '60px 0 40px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h3 style={{
                fontFamily: "'Dancing Script', 'Playfair Display', cursive, serif",
                fontSize: '36px',
                color: '#2c3e50',
                fontWeight: '700',
                marginBottom: '8px'
              }}>
                Sản phẩm liên quan
              </h3>

              {/* Họa tiết nhánh lúa mì trang trí (Screenshot #2) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <span style={{ height: '1px', width: '60px', backgroundColor: '#d39e00' }}></span>
                <i className="fa-solid fa-wheat-awn" style={{ color: '#d39e00', fontSize: '18px' }}></i>
                <span style={{ height: '1px', width: '60px', backgroundColor: '#d39e00' }}></span>
              </div>
            </div>

            {/* DANH SÁCH 4 SẢN PHẨM LIÊN QUAN */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
              {relatedProducts.length > 0 ? (
                relatedProducts.map(rel => {
                  const relId = rel.id || rel.MASP || rel.maSP;
                  const relName = rel.ten_san_pham || rel.TENSP || rel.TenSP;
                  const relPrice = Number(rel.gia_ban || rel.GIABAN || 0);
                  const relPriceStr = relPrice > 0 ? `${relPrice.toLocaleString('vi-VN')} d` : 'Liên hệ';
                  const relImg = formatImageUrl(rel.hinh_anh || rel.HINHANH);

                  return (
                    <div 
                      key={relId} 
                      style={{
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        textAlign: 'center',
                        position: 'relative',
                        paddingBottom: '15px'
                      }}
                      onClick={() => navigate(`/san-pham/${relId}`)}
                    >
                      <div style={{ position: 'relative', overflow: 'hidden', height: '200px' }}>
                        <img 
                          src={relImg} 
                          alt={relName} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px 12px 0 0' }}
                        />
                        <button 
                          style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'red',
                            fontSize: '18px'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            addToWishlist(relId);
                            toast.success(`Đã thêm "${relName}" vào yêu thích`);
                          }}
                        >
                          <i className="fa-regular fa-heart"></i>
                        </button>
                      </div>
                      
                      <div style={{ padding: '12px 10px 0 10px' }}>
                        <h4 style={{ fontSize: '15px', color: '#333', fontWeight: 'bold', margin: '0 0 6px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {relName}
                        </h4>
                        <div style={{ color: '#d39e00', fontWeight: 'bold', fontSize: '14px' }}>
                          {relPriceStr}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#888', padding: '20px' }}>
                  Đang tải sản phẩm liên quan...
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: ĐÁNH GIÁ SẢN PHẨM */}
          <div style={{ backgroundColor: '#fff', padding: '30px 20px', borderRadius: '12px', border: '1px solid #eee', marginTop: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '20px', color: '#333', margin: 0, fontWeight: 'bold' }}>
                  Đánh Giá Sản Phẩm ({reviews.length})
                </h3>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#16a34a', backgroundColor: '#dcfce7', padding: '3px 10px', borderRadius: '12px', fontWeight: '600' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a', display: 'inline-block' }}></span>
                  Trực tiếp
                </span>
              </div>
              <button 
                type="button"
                onClick={() => {
                  fetchReviews(true);
                  toast.info("Đã làm mới danh sách đánh giá & bình luận!");
                }}
                disabled={isRefreshingReviews}
                style={{ background: '#f8f9fa', border: '1px solid #ddd', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}
                title="Làm mới danh sách đánh giá"
              >
                <i className={`fa-solid fa-rotate-right ${isRefreshingReviews ? 'fa-spin' : ''}`}></i>
                {isRefreshingReviews ? 'Đang tải...' : 'Làm mới'}
              </button>
            </div>

            {reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                <i className="fa-regular fa-comment-dots" style={{ fontSize: '36px', marginBottom: '10px', color: '#ccc' }}></i>
                <p>Chưa có đánh giá nào cho sản phẩm này.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {reviews.map((review) => (
                  <div key={review.MADG || review.id} style={{ display: 'flex', gap: '15px', paddingBottom: '15px', borderBottom: '1px solid #f1f1f1' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#d39e00', color: '#fff', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                      {review.AVATAR ? (
                        <img src={formatImageUrl(review.AVATAR)} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        (review.TEN_KHACH_HANG || 'K').charAt(0).toUpperCase()
                      )}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>{review.TEN_KHACH_HANG || 'Khách hàng'}</span>
                        <span style={{ fontSize: '12px', color: '#999' }}>{review.NGAY_DG}</span>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        {renderStars(review.SO_SAO || 5)}
                      </div>
                      <div style={{ color: '#444', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                        {review.NOI_DUNG || review.noiDung || review.comment || 'Khách hàng không để lại nhận xét.'}
                      </div>
                      
                      {(review.HINH_ANH || review.hinhAnhKemTheo || review.hinhAnh) && (
                        <div style={{ marginTop: '8px' }}>
                          <img 
                            src={formatImageUrl(review.HINH_ANH || review.hinhAnhKemTheo || review.hinhAnh)} 
                            alt="Review" 
                            style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer' }}
                            onClick={() => window.open(formatImageUrl(review.HINH_ANH || review.hinhAnhKemTheo || review.hinhAnh), '_blank')}
                          />
                        </div>
                      )}

                      {/* Phản hồi từ CSKH cũ nếu có */}
                      {(review.PHAN_HOI_CSKH || review.phanHoiCskh) && (
                        <div style={{ marginTop: '10px', padding: '10px 14px', backgroundColor: '#faf6f0', borderLeft: '3px solid #7a5230', borderRadius: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <i className="fa-solid fa-headset" style={{ color: '#7a5230', fontSize: '13px' }}></i>
                            <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#7a5230' }}>Phản hồi từ CSKH Dola Bakery</span>
                            {(review.NGAY_PHAN_HOI || review.ngayPhanHoi) && (
                              <span style={{ fontSize: '11px', color: '#888' }}>({review.NGAY_PHAN_HOI || review.ngayPhanHoi})</span>
                            )}
                          </div>
                          <div style={{ fontSize: '13px', color: '#444', lineHeight: '1.4' }}>
                            {review.PHAN_HOI_CSKH || review.phanHoiCskh}
                          </div>
                        </div>
                      )}

                      {/* Danh sách các bình luận / thảo luận dưới đánh giá */}
                      {Array.isArray(review.binhLuans || review.comments) && (review.binhLuans || review.comments).length > 0 && (
                        <div style={{ marginTop: '12px', paddingLeft: '15px', borderLeft: '2px solid #e0c9a6', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {(review.binhLuans || review.comments).map((cmt) => (
                            <div key={cmt.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: cmt.isAdmin ? '#d35400' : '#e67e22', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold', flexShrink: 0, overflow: 'hidden' }}>
                                {cmt.avatar ? (
                                  <img src={formatImageUrl(cmt.avatar)} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  (cmt.hoTen || 'K').charAt(0).toUpperCase()
                                )}
                              </div>
                              <div style={{ flex: 1, backgroundColor: '#f9f9f9', padding: '8px 12px', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#333' }}>{cmt.hoTen}</span>
                                  {cmt.isAdmin && (
                                    <span style={{ fontSize: '10px', backgroundColor: '#e74c3c', color: '#fff', padding: '1px 6px', borderRadius: '10px', fontWeight: 'bold' }}>Quản trị viên</span>
                                  )}
                                  <span style={{ fontSize: '11px', color: '#999', marginLeft: 'auto' }}>{cmt.date}</span>
                                </div>
                                <div style={{ fontSize: '13px', color: '#444', marginTop: '3px', lineHeight: '1.4' }}>
                                  {cmt.noiDung}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Nút mở ô bình luận vào đánh giá */}
                      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button
                          onClick={() => {
                            const revId = review.MADG || review.id;
                            if (replyingReviewId === revId) {
                              setReplyingReviewId(null);
                              setReviewCommentText('');
                            } else {
                              setReplyingReviewId(revId);
                              setReviewCommentText('');
                            }
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#d39e00',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: 0
                          }}
                        >
                          <i className="fa-regular fa-comment-dots"></i>
                          {replyingReviewId === (review.MADG || review.id) ? 'Hủy bình luận' : 'Bình luận vào đánh giá'}
                        </button>
                      </div>

                      {/* Khung nhập bình luận inline */}
                      {replyingReviewId === (review.MADG || review.id) && (
                        <div style={{ marginTop: '10px', padding: '12px', backgroundColor: '#fcfcfc', border: '1px solid #e0c9a6', borderRadius: '8px' }}>
                          <textarea
                            value={reviewCommentText}
                            onChange={(e) => setReviewCommentText(e.target.value)}
                            placeholder="Viết câu hỏi hoặc thảo luận về trải nghiệm của đánh giá này..."
                            rows="2"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid #ccc',
                              fontSize: '13px',
                              resize: 'vertical',
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                            <button
                              onClick={() => {
                                setReplyingReviewId(null);
                                setReviewCommentText('');
                              }}
                              style={{
                                padding: '5px 12px',
                                backgroundColor: '#f1f1f1',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Hủy
                            </button>
                            <button
                              onClick={() => handleSendReviewComment(review.MADG || review.id)}
                              disabled={submittingReviewComment}
                              style={{
                                padding: '5px 15px',
                                backgroundColor: '#d39e00',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              {submittingReviewComment ? 'Đang gửi...' : 'Gửi bình luận'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
};

export default ProductDetailPage;
