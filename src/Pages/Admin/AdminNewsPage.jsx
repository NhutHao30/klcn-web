import React, { useState, useEffect } from "react";
import { getAdminNews, createNews, updateNews, deleteNews, getNewsDetail, getNewsComments, postNewsComment, deleteNewsComment } from "../../services/newsService";
import AdminLayout from '../../Layout/AdminLayout';

const AdminNewsPage = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNews, setEditingNews] = useState(null);

    // Detail view state
    const [selectedNews, setSelectedNews] = useState(null);
    const [newsComments, setNewsComments] = useState([]);
    const [detailLoading, setDetailLoading] = useState(false);

    // Comment Reply & Moderation state
    const [replyingCmtId, setReplyingCmtId] = useState(null);
    const [adminReplyContent, setAdminReplyContent] = useState("");
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    // File upload state
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");

    const [formData, setFormData] = useState({
        TIEUDE: "",
        MOTA: "",
        HINHANH: "",
        ARTICLE: ""
    });

    useEffect(() => {
        fetchNews();
    }, [searchTerm]);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const data = await getAdminNews(1, searchTerm);
            setNews(data.data || []);
        } catch (error) {
            console.error("Error fetching news:", error);
        }
        setLoading(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const openAddModal = () => {
        setEditingNews(null);
        setSelectedFile(null);
        setPreviewUrl("");
        setFormData({ TIEUDE: "", MOTA: "", HINHANH: "", ARTICLE: "" });
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingNews(item);
        setSelectedFile(null);
        setPreviewUrl("");
        let articleContent = "";
        if (item.chitiets && item.chitiets.length > 0) {
            articleContent = item.chitiets.map(c => c.ARTICLE).join('\n\n');
        }
        setFormData({
            TIEUDE: item.TIEUDE || "",
            MOTA: item.MOTA || "",
            HINHANH: item.HINHANH || "",
            ARTICLE: articleContent
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const paragraphs = formData.ARTICLE.split('\n\n').filter(p => p.trim() !== "");
            const chitiets = paragraphs.map(p => ({ BOCUC: "paragraph", ARTICLE: p }));

            const payload = new FormData();
            payload.append('TIEUDE', formData.TIEUDE);
            payload.append('MOTA', formData.MOTA || '');
            payload.append('chitiets', JSON.stringify(chitiets));

            if (selectedFile) {
                payload.append('HINHANH', selectedFile);
            } else if (formData.HINHANH) {
                payload.append('HINHANH', formData.HINHANH);
            }

            if (editingNews) {
                await updateNews(editingNews.MATINTUC, payload);
                alert("Cập nhật tin tức thành công!");
            } else {
                await createNews(payload);
                alert("Thêm tin tức thành công!");
            }
            setIsModalOpen(false);
            setSelectedFile(null);
            setPreviewUrl("");
            fetchNews();
        } catch (error) {
            console.error("Submit error:", error);
            alert("Lỗi khi lưu tin tức: " + (error.response?.data?.error || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa tin tức này?")) return;
        try {
            await deleteNews(id);
            alert("Xóa thành công!");
            fetchNews();
            if (selectedNews?.MATINTUC === id) setSelectedNews(null);
        } catch (error) {
            console.error("Delete error:", error);
            alert("Lỗi khi xóa: " + (error.response?.data?.error || error.message));
        }
    };

    // View detail + comments
    const openDetail = async (item) => {
        setDetailLoading(true);
        setSelectedNews(item);
        try {
            const [detail, comments] = await Promise.all([
                getNewsDetail(item.MATINTUC),
                getNewsComments(item.MATINTUC)
            ]);
            setSelectedNews(detail);
            setNewsComments(comments || []);
        } catch (error) {
            console.error("Error fetching detail:", error);
        }
        setDetailLoading(false);
    };

    const closeDetail = () => {
        setSelectedNews(null);
        setNewsComments([]);
    };

    const getAvatarUrl = (cmt) => {
        const avatar = cmt.khachhang?.taikhoan?.AVATAR || cmt.khachhang?.AVATAR || cmt.AVATAR;
        if (!avatar) return null;
        if (avatar.startsWith('http')) return avatar;
        return `http://127.0.0.1:8000/storage/${avatar}`;
    };

    const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='50' fill='%23ccc'%3E%3Crect width='80' height='50' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='10' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E";
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN');
    };

    const handleDeleteComment = async (cmtId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;
        try {
            await deleteNewsComment(cmtId);
            alert("Đã xóa bình luận!");
            const updatedComments = await getNewsComments(selectedNews.MATINTUC);
            setNewsComments(updatedComments || []);
        } catch (error) {
            console.error("Lỗi khi xóa bình luận:", error);
            alert("Lỗi: " + (error.response?.data?.error || error.message));
        }
    };

    const handleAdminReply = async (e, parentId) => {
        e.preventDefault();
        if (!adminReplyContent.trim()) {
            alert("Vui lòng nhập nội dung trả lời.");
            return;
        }
        setIsSubmittingReply(true);
        try {
            await postNewsComment(selectedNews.MATINTUC, adminReplyContent, parentId);
            alert("Đã gửi câu trả lời!");
            setAdminReplyContent("");
            setReplyingCmtId(null);
            const updatedComments = await getNewsComments(selectedNews.MATINTUC);
            setNewsComments(updatedComments || []);
        } catch (error) {
            console.error("Lỗi khi trả lời bình luận:", error);
            alert("Lỗi: " + (error.response?.data?.error || error.message));
        }
        setIsSubmittingReply(false);
    };

    const renderAdminCommentItem = (cmt, isReply = false) => {
        const authorName = cmt.khachhang?.HOTEN || cmt.khachhang?.USERNAME || 'Khách hàng';
        const userRole = cmt.khachhang?.taikhoan?.MAROLE;
        const isAdmin = userRole === 0 || userRole === 1 || userRole === '0' || userRole === '1' || cmt.MAKH?.startsWith('KH_ADMIN') || authorName.includes('Quản trị viên');
        const isReplyingThis = replyingCmtId === cmt.MABL;

        return (
            <div key={cmt.MABL} style={{ 
                padding: '0.8rem 1rem', 
                backgroundColor: isReply ? '#ffffff' : '#f8f9fa', 
                borderRadius: '8px', 
                border: '1px solid #e0e0e0',
                borderLeft: isReply ? '4px solid var(--admin-primary)' : '1px solid #e0e0e0',
                marginLeft: isReply ? '1.5rem' : '0',
                marginTop: isReply ? '0.5rem' : '0'
            }}>
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                    <div style={{ 
                        width: isReply ? '35px' : '42px', 
                        height: isReply ? '35px' : '42px', 
                        borderRadius: '50%', 
                        backgroundColor: isAdmin ? '#d35400' : (isReply ? '#e67e22' : 'var(--admin-primary)'), 
                        color: '#fff', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontWeight: 'bold', 
                        fontSize: isReply ? '0.9rem' : '1rem', 
                        flexShrink: 0 
                    }}>
                        {authorName[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <strong style={{ fontSize: '0.95rem' }}>{authorName}</strong>
                                {isAdmin && (
                                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', backgroundColor: '#ffc107', color: '#000', borderRadius: '10px', fontWeight: 'bold' }}>
                                        🛡️ Admin
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ color: '#999', fontSize: '0.8rem' }}>{formatDate(cmt.NGAYDANG)}</span>
                                <button
                                    type="button"
                                    className="admin-btn admin-btn-secondary"
                                    style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                                    onClick={() => {
                                        if (isReplyingThis) {
                                            setReplyingCmtId(null);
                                            setAdminReplyContent("");
                                        } else {
                                            setReplyingCmtId(cmt.MABL);
                                            setAdminReplyContent("");
                                        }
                                    }}
                                >
                                    💬 {isReplyingThis ? "Hủy" : "Trả lời"}
                                </button>
                                <button
                                    type="button"
                                    className="admin-btn admin-btn-danger"
                                    style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                                    onClick={() => handleDeleteComment(cmt.MABL)}
                                >
                                    🗑️ Xóa
                                </button>
                            </div>
                        </div>
                        <p style={{ margin: 0, color: '#444', fontSize: '0.9rem', lineHeight: '1.5' }}>{cmt.NOIDUNG}</p>

                        {/* Inline Reply Form for Admin */}
                        {isReplyingThis && (
                            <form onSubmit={(e) => handleAdminReply(e, cmt.MABL)} style={{ marginTop: '0.8rem', padding: '0.8rem', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #ddd' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#666', marginBottom: '0.4rem' }}>
                                    Trả lời <strong style={{ color: '#333' }}>@{authorName}</strong> dưới tên Quản trị viên:
                                </div>
                                <textarea
                                    className="admin-input"
                                    rows="2"
                                    placeholder={`Nhập phản hồi cho ${authorName}...`}
                                    value={adminReplyContent}
                                    onChange={(e) => setAdminReplyContent(e.target.value)}
                                    required
                                    autoFocus
                                    style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}
                                ></textarea>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                    <button type="button" className="admin-btn admin-btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => { setReplyingCmtId(null); setAdminReplyContent(""); }}>
                                        Hủy
                                    </button>
                                    <button type="submit" className="admin-btn admin-btn-primary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} disabled={isSubmittingReply}>
                                        {isSubmittingReply ? "Đang gửi..." : "Gửi Phản Hồi"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Child Replies */}
                {cmt.replies && cmt.replies.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                        {cmt.replies.map(reply => renderAdminCommentItem(reply, true))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <AdminLayout>
            {/* Header */}
            <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
                <h1 className="admin-title" style={{ marginBottom: 0 }}>📰 Quản lý Tin tức</h1>
                <div className="admin-flex-gap">
                    <input
                        type="text"
                        placeholder="🔍 Tìm kiếm theo tiêu đề..."
                        className="admin-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '280px' }}
                    />
                    <button className="admin-btn admin-btn-primary" onClick={openAddModal}>
                        + Thêm Tin Tức Mới
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="admin-card" style={{ textAlign: 'center', padding: '1.2rem' }}>
                    <h3 style={{ fontSize: '2rem', color: 'var(--admin-primary)', margin: '0 0 0.3rem 0' }}>{news.length}</h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Tổng bài viết</p>
                </div>
                <div className="admin-card" style={{ textAlign: 'center', padding: '1.2rem' }}>
                    <h3 style={{ fontSize: '2rem', color: '#28a745', margin: '0 0 0.3rem 0' }}>
                        {news.filter(n => {
                            const d = new Date(n.NGAYDANG);
                            const now = new Date();
                            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                        }).length}
                    </h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Bài viết tháng này</p>
                </div>
                <div className="admin-card" style={{ textAlign: 'center', padding: '1.2rem' }}>
                    <h3 style={{ fontSize: '2rem', color: '#17a2b8', margin: '0 0 0.3rem 0' }}>
                        {news.length > 0 ? formatDate(news[0]?.NGAYDANG) : '---'}
                    </h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Bài viết gần nhất</p>
                </div>
            </div>

            {/* Table */}
            <div className="admin-card">
                <h2 className="admin-card-title">Danh sách Tin tức</h2>

                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Mã</th>
                                <th style={{ width: '100px' }}>Hình ảnh</th>
                                <th>Tiêu đề</th>
                                <th>Mô tả</th>
                                <th>Ngày đăng</th>
                                <th style={{ width: '180px' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Đang tải...</td></tr>
                            ) : news.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Chưa có tin tức nào</td></tr>
                            ) : news.map((item) => (
                                <tr key={item.MATINTUC} style={{ cursor: 'pointer' }} onClick={() => openDetail(item)}>
                                    <td><strong>{item.MATINTUC}</strong></td>
                                    <td>
                                        <img
                                            src={item.HINHANH?.startsWith('http') ? item.HINHANH : `http://127.0.0.1:8000/images/news/${item.HINHANH}`}
                                            alt={item.TIEUDE}
                                            style={{ width: '80px', height: '55px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #eee' }}
                                            onError={handleImageError}
                                        />
                                    </td>
                                    <td style={{ maxWidth: '200px', fontWeight: '500' }}>{item.TIEUDE}</td>
                                    <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#666', fontSize: '13px' }}>
                                        {item.MOTA}
                                    </td>
                                    <td style={{ fontSize: '13px' }}>{formatDate(item.NGAYDANG)}</td>
                                    <td>
                                        <div className="admin-flex-gap" onClick={(e) => e.stopPropagation()}>
                                            <button className="admin-btn admin-btn-secondary" style={{ padding: '4px 10px' }} onClick={() => openEditModal(item)}>
                                                ✏️ Sửa
                                            </button>
                                            <button className="admin-btn admin-btn-danger" style={{ padding: '4px 10px' }} onClick={() => handleDelete(item.MATINTUC)}>
                                                🗑️ Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail + Comments Modal */}
            {selectedNews && (
                <div className="admin-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="admin-modal" style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '0.5rem', width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
                            <h2 className="admin-card-title" style={{ marginBottom: 0 }}>
                                📄 Chi tiết bài viết
                            </h2>
                            <button type="button" onClick={closeDetail} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </div>

                        {detailLoading ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải chi tiết...</div>
                        ) : (
                            <>
                                {/* News Content */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>{selectedNews.TIEUDE}</h2>
                                    <div style={{ display: 'flex', gap: '1rem', color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                        <span>📅 {formatDate(selectedNews.NGAYDANG)}</span>
                                        <span>🔑 {selectedNews.MATINTUC}</span>
                                        <span>💬 {newsComments.length} bình luận</span>
                                    </div>

                                    {selectedNews.HINHANH && (
                                        <img
                                            src={selectedNews.HINHANH?.startsWith('http') ? selectedNews.HINHANH : `http://127.0.0.1:8000/images/news/${selectedNews.HINHANH}`}
                                            alt={selectedNews.TIEUDE}
                                            style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }}
                                            onError={handleImageError}
                                        />
                                    )}

                                    <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '6px', marginBottom: '1rem', borderLeft: '4px solid var(--admin-primary)' }}>
                                        <strong>Mô tả:</strong>
                                        <p style={{ margin: '0.5rem 0 0 0', color: '#555' }}>{selectedNews.MOTA}</p>
                                    </div>

                                    {selectedNews.chitiets && selectedNews.chitiets.length > 0 && (
                                        <div style={{ lineHeight: '1.8', color: '#444' }}>
                                            <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Nội dung chi tiết:</strong>
                                            {selectedNews.chitiets.map((ct, idx) => (
                                                <div key={idx} style={{ marginBottom: '0.8rem' }}>
                                                    <p style={{ margin: 0 }}>{ct.ARTICLE}</p>
                                                    {ct.HINHANH && (
                                                        <img src={ct.HINHANH} alt="" style={{ maxWidth: '100%', borderRadius: '6px', marginTop: '0.5rem' }} onError={handleImageError} />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Divider */}
                                <hr style={{ border: 'none', borderTop: '2px solid #eee', margin: '1.5rem 0' }} />

                                {/* Comments Section */}
                                <div>
                                    <h3 className="admin-card-title" style={{ fontSize: '1.1rem' }}>
                                        💬 Bình luận của khách hàng ({newsComments.length})
                                    </h3>

                                    {newsComments.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '2rem', color: '#999', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                                            Chưa có bình luận nào cho bài viết này.
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                            {newsComments.map(cmt => renderAdminCommentItem(cmt))}
                                        </div>
                                    )}
                                </div>

                                {/* Close button */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                                    <button className="admin-btn admin-btn-secondary" onClick={closeDetail}>Đóng</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Modal Add/Edit */}
            {isModalOpen && (
                <div className="admin-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="admin-modal" style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '0.5rem', width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
                            <h2 className="admin-card-title" style={{ marginBottom: 0 }}>
                                {editingNews ? '✏️ Sửa Tin Tức' : '📝 Thêm Tin Tức Mới'}
                            </h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="admin-form-group">
                                <label>Tiêu đề tin tức *</label>
                                <input
                                    type="text"
                                    name="TIEUDE"
                                    value={formData.TIEUDE}
                                    onChange={handleInputChange}
                                    className="admin-input"
                                    required
                                    placeholder="Nhập tiêu đề bài viết..."
                                />
                            </div>

                            <div className="admin-form-group">
                                <label>Hình ảnh đại diện bài viết</label>

                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                                    <label className="admin-btn admin-btn-secondary" style={{ cursor: 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        📷 Upload từ máy tính
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                    <span style={{ fontSize: '13px', color: '#666' }}>
                                        {selectedFile ? `Đã chọn file: ${selectedFile.name}` : "hoặc nhập URL ảnh bên dưới (Ảnh sẽ tự lưu lên MinIO)"}
                                    </span>
                                </div>

                                <input
                                    type="text"
                                    name="HINHANH"
                                    value={selectedFile ? "" : formData.HINHANH}
                                    onChange={(e) => {
                                        setSelectedFile(null);
                                        setPreviewUrl("");
                                        handleInputChange(e);
                                    }}
                                    disabled={!!selectedFile}
                                    className="admin-input"
                                    placeholder="https://example.com/image.jpg hoặc chọn file upload ở trên"
                                />

                                {(previewUrl || formData.HINHANH) && (
                                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <img
                                            src={previewUrl || formData.HINHANH}
                                            alt="Preview"
                                            style={{ maxWidth: '200px', maxHeight: '120px', borderRadius: '6px', border: '1px solid #eee', objectFit: 'cover' }}
                                            onError={handleImageError}
                                        />
                                        {selectedFile && (
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn-danger"
                                                style={{ padding: '4px 10px', fontSize: '12px' }}
                                                onClick={() => {
                                                    setSelectedFile(null);
                                                    setPreviewUrl("");
                                                }}
                                            >
                                                ✕ Bỏ chọn ảnh
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="admin-form-group">
                                <label>Mô tả ngắn</label>
                                <textarea
                                    name="MOTA"
                                    value={formData.MOTA}
                                    onChange={handleInputChange}
                                    className="admin-input"
                                    rows="3"
                                    placeholder="Đoạn giới thiệu ngắn gọn về bài viết..."
                                    style={{ resize: 'vertical' }}
                                ></textarea>
                            </div>

                            <div className="admin-form-group">
                                <label>Nội dung chi tiết <span style={{ color: '#999', fontSize: '12px' }}>(Mỗi đoạn văn cách nhau bởi 1 dòng trống)</span></label>
                                <textarea
                                    name="ARTICLE"
                                    value={formData.ARTICLE}
                                    onChange={handleInputChange}
                                    className="admin-input"
                                    rows="12"
                                    placeholder="Nhập nội dung bài viết chi tiết ở đây..."
                                    style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6' }}
                                ></textarea>
                            </div>

                            <div className="admin-flex-between" style={{ justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
                                <button type="submit" className="admin-btn admin-btn-primary">
                                    {editingNews ? 'Cập nhật bài viết' : 'Đăng bài viết'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminNewsPage;
