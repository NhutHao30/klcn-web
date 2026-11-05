import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import { useToast } from '../../components/Toast/Toast';
import axiosClient from '../../services/axiosClient';
import { formatImageUrl } from '../../utils/imageUtils';

const AdminReviewPage = () => {
  const toast = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  
  // Filters
  const [search, setSearch] = useState('');
  const [filterSoSao, setFilterSoSao] = useState('');
  const [filterTrangThai, setFilterTrangThai] = useState('');
  
  // Modals
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const fetchReviews = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, per_page: 15 });
      if (search) params.append('search', search);
      if (filterSoSao) params.append('soSao', filterSoSao);
      if (filterTrangThai !== '') params.append('trangThai', filterTrangThai);
      
      const res = await axiosClient.get(`/admin/reviews?${params}`);
      const d = res.data;
      setReviews(d.data || []);
      setPagination({
        current_page: d.current_page || 1,
        last_page: d.last_page || 1,
        total: d.total || 0
      });
    } catch (e) {
      console.error("Lỗi tải đánh giá:", e);
      toast.error('Không thể tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  }, [search, filterSoSao, filterTrangThai]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Polling tự động làm mới danh sách đánh giá mỗi 3.5 giây (Realtime)
  useEffect(() => {
    const interval = setInterval(() => {
      axiosClient.get('/admin/reviews', {
        params: {
          page: pagination.current_page || 1,
          search: search || undefined,
          soSao: filterSoSao || undefined,
          trangThai: filterTrangThai !== '' ? filterTrangThai : undefined,
          _t: Date.now()
        }
      }).then(res => {
        const raw = res.data;
        const list = raw.data || (Array.isArray(raw) ? raw : []);
        setReviews(list);
        setPagination(prev => ({
          ...prev,
          current_page: raw.current_page || 1,
          last_page: raw.last_page || 1,
          total: raw.total !== undefined ? raw.total : list.length,
        }));
      }).catch(() => {});
    }, 3500);

    return () => clearInterval(interval);
  }, [search, filterSoSao, filterTrangThai, pagination.current_page]);

  const handleToggleStatus = async (review) => {
    try {
      const res = await axiosClient.put(`/admin/reviews/${review.id}/toggle`);
      toast.success(res.data.message || (review.trangThai ? 'Đã ẩn đánh giá' : 'Đã hiện đánh giá'));
      fetchReviews(pagination.current_page);
    } catch (e) {
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const openReplyModal = (review) => {
    setSelectedReview(review);
    setReplyText(review.phanHoiCskh || '');
    setReplyModalOpen(true);
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) {
      toast.warning('Vui lòng nhập nội dung phản hồi CSKH');
      return;
    }
    setIsSubmitting(true);
    try {
      await axiosClient.post(`/admin/reviews/${selectedReview.id}/reply`, {
        phanHoi: replyText.trim(),
        phanHoiCskh: replyText.trim(),
      });
      toast.success('Đã lưu phản hồi CSKH thành công!');
      setReplyModalOpen(false);
      fetchReviews(pagination.current_page);
    } catch (e) {
      toast.error('Lỗi khi gửi phản hồi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (n) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i
          key={i}
          className={i <= n ? "fa-solid fa-star" : "fa-regular fa-star"}
          style={{ color: '#f39c12', fontSize: '14px', marginRight: '2px' }}
        ></i>
      );
    }
    return stars;
  };

  return (
    <AdminLayout>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="admin-title" style={{ marginBottom: '4px' }}>
            <i className="fa-solid fa-star-half-stroke" style={{ color: '#7a5230', marginRight: '10px' }}></i>
            Quản lý đánh giá sản phẩm (CSKH)
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
            Theo dõi, phản hồi nhận xét của khách hàng và ẩn/hiện đánh giá trên website
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#16a34a', backgroundColor: '#dcfce7', padding: '4px 10px', borderRadius: '14px', fontWeight: '600' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#16a34a', display: 'inline-block' }}></span>
            Realtime
          </span>
          <span style={{ backgroundColor: '#f0ece7', color: '#7a5230', padding: '6px 14px', borderRadius: '20px', fontWeight: '700', fontSize: '13px' }}>
            Tổng: {pagination.total} đánh giá
          </span>
          <button 
            type="button" 
            className="admin-btn admin-btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '13px' }}
            onClick={() => fetchReviews(pagination.current_page)}
          >
            <i className="fa-solid fa-rotate-right" style={{ marginRight: '5px' }}></i> Làm mới
          </button>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="admin-card" style={{ marginBottom: '1.5rem', padding: '16px 20px', backgroundColor: '#fff', borderRadius: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>
              Tìm kiếm
            </label>
            <input
              type="text"
              className="admin-input"
              placeholder="Tên khách hàng, sản phẩm, nội dung..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchReviews(1)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>
              Số sao
            </label>
            <select
              className="admin-select"
              value={filterSoSao}
              onChange={e => setFilterSoSao(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
            >
              <option value="">Tất cả sao</option>
              <option value="5">5 sao ⭐⭐⭐⭐⭐</option>
              <option value="4">4 sao ⭐⭐⭐⭐</option>
              <option value="3">3 sao ⭐⭐⭐</option>
              <option value="2">2 sao ⭐⭐</option>
              <option value="1">1 sao ⭐</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>
              Trạng thái hiển thị
            </label>
            <select
              className="admin-select"
              value={filterTrangThai}
              onChange={e => setFilterTrangThai(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="1">Đang hiển thị trên Website</option>
              <option value="0">Đã ẩn khỏi Website</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => fetchReviews(1)}
              className="admin-btn admin-btn-primary"
              style={{ flex: 1, padding: '8px 14px', borderRadius: '6px', fontWeight: '600', backgroundColor: '#7a5230', borderColor: '#7a5230' }}
            >
              <i className="fa-solid fa-magnifying-glass" style={{ marginRight: '6px' }}></i>
              Lọc
            </button>
            <button
              onClick={() => {
                setSearch('');
                setFilterSoSao('');
                setFilterTrangThai('');
              }}
              className="admin-btn"
              style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: '#f8f9fa' }}
            >
              Đặt lại
            </button>
          </div>
        </div>
      </div>

      {/* Bảng danh sách đánh giá */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '28px', color: '#7a5230', marginBottom: '12px' }}></i>
          <div>Đang tải dữ liệu đánh giá...</div>
        </div>
      ) : (
        <div className="admin-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '8px' }}>
          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>
              <i className="fa-regular fa-comment-dots" style={{ fontSize: '36px', color: '#ccc', marginBottom: '10px' }}></i>
              <p style={{ margin: 0 }}>Không có đánh giá nào phù hợp với bộ lọc</p>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table" style={{ margin: 0 }}>
                <thead>
                  <tr style={{ backgroundColor: '#faf8f5' }}>
                    <th style={{ width: '50px', textAlign: 'center' }}>#</th>
                    <th style={{ minWidth: '180px' }}>Sản phẩm & Khách hàng</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Đánh giá</th>
                    <th style={{ minWidth: '220px' }}>Nội dung & Phản hồi CSKH</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Ảnh thật</th>
                    <th style={{ width: '110px', textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ width: '130px', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r, idx) => (
                    <tr key={r.id}>
                      <td style={{ textAlign: 'center', color: '#888', fontSize: '12px' }}>
                        {(pagination.current_page - 1) * 15 + idx + 1}
                      </td>

                      <td>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#333', marginBottom: '3px' }}>
                          {r.tenSP || 'Sản phẩm bánh'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#555' }}>
                          <i className="fa-solid fa-user" style={{ fontSize: '11px', marginRight: '5px', color: '#7a5230' }}></i>
                          <b>{r.tenKH || 'Khách hàng'}</b>
                        </div>
                        {r.maDonHang && (
                          <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                            Đơn: #{r.maDonHang}
                          </div>
                        )}
                        <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                          {r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : ''}
                        </div>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <div>{renderStars(r.soSao || 5)}</div>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#7a5230' }}>
                          {r.soSao}/5 Sao
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: '13px', color: '#333', lineHeight: '1.5', marginBottom: '6px' }}>
                          "{r.noiDung || <span style={{ color: '#aaa', fontStyle: 'italic' }}>Không để lại bình luận văn bản</span>}"
                        </div>
                        {r.phanHoiCskh ? (
                          <div style={{ padding: '8px 10px', backgroundColor: '#faf6f0', borderLeft: '3px solid #7a5230', borderRadius: '4px', fontSize: '12px', color: '#444' }}>
                            <div style={{ fontWeight: '700', color: '#7a5230', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <i className="fa-solid fa-headset"></i>
                              <span>CSKH đã trả lời:</span>
                              {r.ngayPhanHoi && <span style={{ fontSize: '10px', color: '#888', fontWeight: 'normal' }}>({new Date(r.ngayPhanHoi).toLocaleDateString('vi-VN')})</span>}
                            </div>
                            <div>{r.phanHoiCskh}</div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#d97706', backgroundColor: '#fef3c7', padding: '2px 8px', borderRadius: '4px' }}>
                            Chưa có phản hồi CSKH
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        {r.hinhAnhKemTheo ? (
                          <img
                            src={formatImageUrl(r.hinhAnhKemTheo)}
                            alt="Ảnh feedback"
                            onClick={() => setPreviewImage(formatImageUrl(r.hinhAnhKemTheo))}
                            style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer' }}
                            title="Click để phóng to ảnh"
                          />
                        ) : (
                          <span style={{ color: '#ccc', fontSize: '12px' }}>—</span>
                        )}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          backgroundColor: r.trangThai === 1 || r.trangThai === true ? '#e6f4ea' : '#fce8e6',
                          color: r.trangThai === 1 || r.trangThai === true ? '#1e8e3e' : '#c5221f'
                        }}>
                          {r.trangThai === 1 || r.trangThai === true ? 'Hiển thị' : 'Đã ẩn'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => openReplyModal(r)}
                            className="admin-btn admin-btn-primary"
                            style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: '#7a5230', borderColor: '#7a5230' }}
                            title={r.phanHoiCskh ? "Chỉnh sửa phản hồi" : "Trả lời khách"}
                          >
                            <i className="fa-solid fa-reply" style={{ marginRight: '4px' }}></i>
                            {r.phanHoiCskh ? 'Sửa' : 'Trả lời'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(r)}
                            className={`admin-btn ${r.trangThai === 1 ? 'admin-btn-danger' : 'admin-btn-success'}`}
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            title={r.trangThai === 1 ? "Ẩn khỏi website" : "Hiện lại trên website"}
                          >
                            {r.trangThai === 1 ? (
                              <><i className="fa-solid fa-eye-slash"></i> Ẩn</>
                            ) : (
                              <><i className="fa-solid fa-eye"></i> Hiện</>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Phân trang */}
      {pagination.last_page > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '1.5rem' }}>
          {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => fetchReviews(p)}
              className={`admin-btn ${p === pagination.current_page ? 'admin-btn-primary' : ''}`}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: p === pagination.current_page ? '#7a5230' : '#f8f9fa',
                color: p === pagination.current_page ? '#fff' : '#333',
                border: '1px solid #ddd'
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Modal CSKH Phản hồi */}
      {replyModalOpen && selectedReview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            maxWidth: '520px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#333' }}>
                <i className="fa-solid fa-headset" style={{ color: '#7a5230', marginRight: '8px' }}></i>
                CSKH Phản hồi đánh giá
              </h3>
              <button
                onClick={() => setReplyModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#888' }}
              >
                &times;
              </button>
            </div>

            <div style={{ backgroundColor: '#faf8f5', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
              <div style={{ fontWeight: '700', color: '#333', marginBottom: '4px' }}>
                {selectedReview.tenSP}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ color: '#666' }}>Khách hàng: <b>{selectedReview.tenKH}</b></span>
                <span>•</span>
                <span>{renderStars(selectedReview.soSao || 5)}</span>
              </div>
              <div style={{ color: '#555', fontStyle: 'italic', backgroundColor: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #eee' }}>
                "{selectedReview.noiDung || 'Không có nhận xét'}"
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#333', marginBottom: '6px' }}>
                Nội dung phản hồi từ CSKH:
              </label>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                rows={4}
                placeholder="Cảm ơn quý khách đã tin tưởng và ủng hộ Givral Bakery! Cửa hàng rất ghi nhận ý kiến đóng góp của quý khách..."
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13px', outline: 'none' }}
              ></textarea>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setReplyModalOpen(false)}
                style={{ padding: '8px 16px', backgroundColor: '#f8f9fa', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmitReply}
                disabled={isSubmitting}
                style={{ padding: '8px 18px', backgroundColor: '#7a5230', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
              >
                {isSubmitting ? 'Đang lưu...' : 'Lưu phản hồi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Preview Ảnh */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            cursor: 'pointer'
          }}
        >
          <img
            src={previewImage}
            alt="Review Preview"
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }}
          />
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminReviewPage;

