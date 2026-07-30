import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../Layout/Header';
import Footer from '../Layout/Footer';
import axiosClient from '../services/axiosClient';
import { getProductById } from '../services/productService'; // We'll need to make sure this exists or fetch via axiosClient

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductAndReviews = async () => {
      try {
        const [productRes, reviewsRes] = await Promise.all([
          axiosClient.get(`/products/${id}`),
          axiosClient.get(`/products/${id}/reviews`)
        ]);
        setProduct(productRes.data);
        setReviews(reviewsRes.data);
      } catch (error) {
        console.error("Lỗi khi tải thông tin sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductAndReviews();
  }, [id]);

  if (loading) {
    return (
      <>
        <div style={{ textAlign: 'center', padding: '100px' }}>Đang tải thông tin sản phẩm...</div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <div style={{ textAlign: 'center', padding: '100px' }}>Không tìm thấy sản phẩm!</div>
      </>
    );
  }

  // Helper to format image URL
  const formatImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://127.0.0.1:8000/storage/${url}`;
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

  return (
    <>
      <main style={{ backgroundColor: '#f8f9fa', padding: '40px 0', minHeight: '70vh' }}>
        <div className="grid wide">
          
          {/* Thông tin sản phẩm cơ bản */}
          <div className="row" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
            <div className="col l-4 m-12 c-12">
              <img 
                src={formatImageUrl(product.HINHANH)} 
                alt={product.TENSP} 
                style={{ width: '80%', borderRadius: '8px', objectFit: 'cover' }}
              />
            </div>
            <div className="col l-7 m-12 c-12">
              <h1 style={{ fontSize: '28px', color: '#333', marginBottom: '15px' }}>{product.TENSP}</h1>
              <p style={{ color: '#666', marginBottom: '20px' }}>Mã sản phẩm: <span style={{ fontWeight: 'bold' }}>{product.MASP}</span></p>
              
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '20px' }}>
                {Number(product.GIABAN).toLocaleString('vi-VN')} ₫
              </div>

              <div style={{ marginBottom: '20px', lineHeight: '1.6', color: '#555' }}>
                <h4 style={{ marginBottom: '10px' }}>Mô tả sản phẩm:</h4>
                <p>{product.MOTA || 'Đang cập nhật mô tả...'}</p>
              </div>
            </div>
          </div>

          {/* Đánh giá sản phẩm */}
          <div className="row" style={{ backgroundColor: '#fff', padding: '30px 20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <div className="col l-12">
              <h3 style={{ fontSize: '22px', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
                Đánh Giá Sản Phẩm ({reviews.length})
              </h3>

              {reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                  <i className="fa-regular fa-comment-dots" style={{ fontSize: '40px', marginBottom: '15px', color: '#ddd' }}></i>
                  <p>Chưa có đánh giá nào cho sản phẩm này.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {reviews.map((review) => (
                    <div key={review.MADG} style={{ display: 'flex', gap: '15px', paddingBottom: '20px', borderBottom: '1px solid #f1f1f1' }}>
                      {/* Avatar */}
                      <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#eee', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#888', fontWeight: 'bold' }}>
                        {review.AVATAR ? (
                          <img src={formatImageUrl(review.AVATAR)} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          review.TEN_KHACH_HANG.charAt(0).toUpperCase()
                        )}
                      </div>
                      
                      {/* Content */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{review.TEN_KHACH_HANG}</span>
                          <span style={{ fontSize: '12px', color: '#999' }}>{review.NGAY_DG}</span>
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                          {renderStars(review.SO_SAO)}
                        </div>
                        <div style={{ color: '#444', lineHeight: '1.5', marginBottom: '10px', whiteSpace: 'pre-line' }}>
                          {review.NOI_DUNG}
                        </div>
                        
                        {/* Attached Image */}
                        {review.HINH_ANH && (
                          <div style={{ marginTop: '10px' }}>
                            <img 
                              src={formatImageUrl(review.HINH_ANH)} 
                              alt="Review" 
                              style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd', cursor: 'pointer' }}
                              onClick={() => window.open(formatImageUrl(review.HINH_ANH), '_blank')}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
};

export default ProductDetailPage;
