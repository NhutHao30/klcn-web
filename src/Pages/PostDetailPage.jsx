import { BASE_URL } from '../services/axiosClient';
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getNewsDetail, getNewsComments, postNewsComment, getNews } from "../services/newsService";
import { getCurrentUser } from "../services/authService";
import Footer from "../Layout/Footer";
import "./PostPage.css"; 
import "./PostDetailPage.css"; 
import { useToast } from '../components/Toast/Toast';

function PostDetailPage() {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    const [post, setPost] = useState(null);
    const [recentPosts, setRecentPosts] = useState([]);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Comment Form
    const [commentContent, setCommentContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reply Form
    const [replyingToId, setReplyingToId] = useState(null);
    const [replyContent, setReplyContent] = useState("");
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    useEffect(() => {
        // Fetch current user
        getCurrentUser().then(u => {
            if (u && Object.keys(u).length > 0) {
                setUser(u);
                setIsAuthenticated(true);
            }
        }).catch(err => console.log("Guest User"));

        const fetchDetail = async () => {
            setLoading(true);
            try {
                // Fetch current post detail
                const data = await getNewsDetail(id);
                setPost(data);

                // Fetch comments
                const cmtData = await getNewsComments(id);
                setComments(cmtData);

                // Fetch recent posts for sidebar
                const recentData = await getNews(1); // Do not pass limit directly to fix paginate issue
                const postsArr = Array.isArray(recentData) ? recentData : (recentData.data || []);
                setRecentPosts(postsArr);
            } catch (error) {
                console.error("Error fetching news detail:", error);
            }
            setLoading(false);
        };
        fetchDetail();
    }, [id]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            toast.warning("Bạn cần đăng nhập để bình luận!");
            return;
        }
        if (!commentContent.trim()) {
            toast.warning("Vui lòng nhập nội dung bình luận.");
            return;
        }

        setIsSubmitting(true);
        try {
            await postNewsComment(id, commentContent);
            toast.success("Đã gửi bình luận!");
            setCommentContent("");
            // Refresh comments
            const cmtData = await getNewsComments(id);
            setComments(cmtData);
        } catch (error) {
            console.error("Lỗi khi bình luận:", error);
            toast.error("Lỗi: " + (error.response?.data?.error || error.message));
        }
        setIsSubmitting(false);
    };

    const handleReplySubmit = async (e, parentId) => {
        e.preventDefault();
        if (!isAuthenticated) {
            toast.warning("Bạn cần đăng nhập để trả lời bình luận!");
            return;
        }
        if (!replyContent.trim()) {
            toast.warning("Vui lòng nhập nội dung trả lời.");
            return;
        }

        setIsSubmittingReply(true);
        try {
            await postNewsComment(id, replyContent, parentId);
            toast.success("Đã gửi câu trả lời!");
            setReplyContent("");
            setReplyingToId(null);
            // Refresh comments
            const cmtData = await getNewsComments(id);
            setComments(cmtData);
        } catch (error) {
            console.error("Lỗi khi trả lời bình luận:", error);
            toast.error("Lỗi: " + (error.response?.data?.error || error.message));
        }
        setIsSubmittingReply(false);
    };

    const countTotalComments = (list) => {
          const toast = useToast();
if (!list || !Array.isArray(list)) return 0;
        let count = 0;
        for (const item of list) {
            count += 1;
            if (item.replies && item.replies.length > 0) {
                count += countTotalComments(item.replies);
            }
        }
        return count;
    };
    const totalCommentsCount = countTotalComments(comments);

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    };

    const getAvatarUrl = (cmt) => {
        const avatar = cmt.khachhang?.taikhoan?.AVATAR || cmt.khachhang?.AVATAR || cmt.AVATAR;
        if (!avatar) return null;
        if (avatar.startsWith('http') || avatar.startsWith('/api/')) return avatar;
        return `${BASE_URL}/storage/${avatar}`;
    };

    const renderCommentItem = (cmt, isReply = false) => {
        const authorName = cmt.khachhang?.HOTEN || cmt.khachhang?.USERNAME || 'Khách hàng';
        const userRole = cmt.khachhang?.taikhoan?.MAROLE;
        const isAdmin = userRole === 0 || userRole === 1 || userRole === '0' || userRole === '1' || cmt.MAKH?.startsWith('KH_ADMIN') || authorName.includes('Quản trị viên');
        const isReplyingThis = replyingToId === cmt.MABL;

        return (
            <li className={`comment-item ${isReply ? 'mt-3 ms-4 ps-3 border-start border-2 border-warning' : 'mb-4 pb-3 border-bottom'}`} key={cmt.MABL}>
                <div className="d-flex">
                    <div 
                        className="comment-avatar me-3" 
                        style={{ 
                            width: isReply ? '38px' : '45px', 
                            height: isReply ? '38px' : '45px', 
                            borderRadius: '50%', 
                            backgroundColor: isAdmin ? '#d35400' : (isReply ? '#e67e22' : '#e74c3c'), 
                            color: '#fff', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontWeight: 'bold', 
                            fontSize: isReply ? '0.95rem' : '1.1rem', 
                            flexShrink: 0, 
                            overflow: 'hidden',
                            position: 'relative',
                            border: isAdmin ? '2px solid #f39c12' : 'none'
                        }}
                    >
                        {getAvatarUrl(cmt) && (
                            <img 
                                src={getAvatarUrl(cmt)} 
                                alt="Avatar" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} 
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                        )}
                        <span>{authorName[0].toUpperCase()}</span>
                    </div>
                    <div className="comment-body flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <div className="d-flex alignItems-center flex-wrap">
                                <h6 className="mb-0 fw-bold me-2">{authorName}</h6>
                                {isAdmin && (
                                    <span className="badge bg-warning text-dark fw-bold" style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '12px' }}>
                                        <i className="fa fa-shield me-1"></i>Quản trị viên
                                    </span>
                                )}
                            </div>
                            <button 
                                type="button"
                                className="btn btn-sm btn-link text-decoration-none p-0 text-primary reply-btn ms-2"
                                onClick={() => {
                                    if (isReplyingThis) {
                                        setReplyingToId(null);
                                        setReplyContent("");
                                    } else {
                                        setReplyingToId(cmt.MABL);
                                        setReplyContent("");
                                    }
                                }}
                            >
                                <i className="fa fa-reply me-1"></i>
                                {isReplyingThis ? "Hủy" : "Trả lời"}
                            </button>
                        </div>
                        <small className="text-muted d-block mb-2">{formatDate(cmt.NGAYDANG)}</small>
                        <p className="mb-0 text-break">{cmt.NOIDUNG}</p>

                        {/* Inline Reply Form */}
                        {isReplyingThis && (
                            <form className="reply-form mt-3 p-3 bg-light rounded border" onSubmit={(e) => handleReplySubmit(e, cmt.MABL)}>
                                <div className="mb-2 fw-semibold text-muted" style={{ fontSize: '0.875rem' }}>
                                    Trả lời <span className="text-dark fw-bold">@{authorName}</span>:
                                </div>
                                <textarea 
                                    className="form-control mb-2" 
                                    rows="2" 
                                    placeholder={`Viết phản hồi cho ${authorName}...`}
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    required
                                    autoFocus
                                ></textarea>
                                <div className="text-end">
                                    <button 
                                        type="button" 
                                        className="btn btn-sm btn-outline-secondary me-2"
                                        onClick={() => {
                                            setReplyingToId(null);
                                            setReplyContent("");
                                        }}
                                    >
                                        Hủy
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-sm btn-warning text-white fw-bold" 
                                        disabled={isSubmittingReply}
                                    >
                                        {isSubmittingReply ? "Đang gửi..." : "Gửi trả lời"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Render Child Replies */}
                {cmt.replies && cmt.replies.length > 0 && (
                    <ul className="list-unstyled mt-2">
                        {cmt.replies.map(reply => renderCommentItem(reply, true))}
                    </ul>
                )}
            </li>
        );
    };

    return (
        <>
            <main>
                {/*<section className="news-banner">
                    <div className="news-banner-content">
                        <h1>Tin tức</h1>
                        <p><Link to="/">Trang chủ</Link> &gt; <Link to="/tin-tuc">Tin tức</Link> &gt; <span>{post?.TIEUDE || "Chi tiết"}</span></p>
                    </div>
                </section>*/}

                <section className="news-content-section container mt-4 mb-5">
                    <div className="row">
                        {/* Main Content */}
                        <div className="col-lg-8 col-md-12">
                            {loading ? (
                                <div>Đang tải chi tiết tin tức...</div>
                            ) : post ? (
                                <div className="post-detail-container">
                                    <h1 className="post-detail-title">{post.TIEUDE}</h1>
                                    <div className="post-meta">
                                        <span><i className="fa fa-user"></i> Admin</span>
                                        <span><i className="fa fa-calendar"></i> {formatDate(post.NGAYDANG)}</span>
                                        <span><i className="fa fa-comments"></i> {totalCommentsCount} Bình luận</span>
                                    </div>
                                    
                                    <div className="post-featured-image my-4">
                                        <img 
                                            src={(post.HINHANH?.startsWith('http') || post.HINHANH?.startsWith('/api/')) ? post.HINHANH : `${BASE_URL}/images/news/${post.HINHANH}`} 
                                            alt={post.TIEUDE} 
                                            style={{ width: '100%', borderRadius: '8px' }}
                                        />
                                    </div>

                                    <div className="post-content">
                                        {post.chitiets && post.chitiets.length > 0 ? (
                                            post.chitiets.map((ct, idx) => (
                                                <div key={idx} className="post-paragraph mb-3">
                                                    <p>{ct.ARTICLE}</p>
                                                    {ct.HINHANH && (
                                                        <img 
                                                            src={(ct.HINHANH?.startsWith('http') || ct.HINHANH?.startsWith('/api/')) ? ct.HINHANH : `${BASE_URL}/images/news/${ct.HINHANH}`} 
                                                            alt="Paragraph Image" 
                                                            style={{ width: '100%', marginTop: '10px', borderRadius: '4px' }}
                                                        />
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p>{post.MOTA}</p>
                                        )}
                                    </div>

                                    {/* Comments Section */}
                                    <div className="comments-section mt-5">
                                        <h3 className="comments-title">Viết bình luận của bạn</h3>
                                        {!isAuthenticated ? (
                                            <div className="alert alert-warning">
                                                Bạn cần <Link to="/dang-nhap">đăng nhập</Link> để viết bình luận.
                                            </div>
                                        ) : (
                                            <form className="comment-form" onSubmit={handleCommentSubmit}>
                                                <div className="row">
                                                    <div className="col-md-6 form-group mb-3">
                                                        <input 
                                                            type="text" 
                                                            className="form-control" 
                                                            value={user?.HOTEN || user?.TenKhachHang || user?.TENKH || user?.USERNAME || "Tên của bạn"} 
                                                            disabled 
                                                        />
                                                    </div>
                                                    <div className="col-md-6 form-group mb-3">
                                                        <input 
                                                            type="text" 
                                                            className="form-control" 
                                                            value={user?.EMAIL || "Email của bạn (Đã ẩn)"} 
                                                            disabled 
                                                        />
                                                    </div>
                                                    <div className="col-12 form-group mb-3">
                                                        <textarea 
                                                            className="form-control" 
                                                            rows="4" 
                                                            placeholder="Nội dung bình luận..."
                                                            value={commentContent}
                                                            onChange={(e) => setCommentContent(e.target.value)}
                                                            required
                                                        ></textarea>
                                                    </div>
                                                    <div className="col-12 text-end">
                                                        <button type="submit" className="btn btn-primary px-4" disabled={isSubmitting}>
                                                            {isSubmitting ? "Đang gửi..." : "Gửi Bình Luận"}
                                                        </button>
                                                    </div>
                                                </div>
                                            </form>
                                        )}

                                        <div className="comments-list mt-5">
                                            <h4>Bình luận ({totalCommentsCount})</h4>
                                            {comments.length === 0 ? (
                                                <p className="text-muted mt-3">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                                            ) : (
                                                <ul className="list-unstyled mt-4">
                                                    {comments.map(cmt => renderCommentItem(cmt))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>Không tìm thấy bài viết.</div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="col-lg-4 col-md-12">
                            <div className="news-sidebar">
                                <div className="sidebar-widget">
                                    <h3 className="widget-title">Danh mục tin tức</h3>
                                    <ul className="widget-category-list">
                                        <li><Link to="/">Trang chủ</Link></li>
                                        <li><Link to="/gioi-thieu">Giới thiệu</Link></li>
                                        <li><Link to="/san-pham">Sản phẩm <span className="float-end">+</span></Link></li>
                                        <li><Link to="/tin-tuc" className="active">Tin tức</Link></li>
                                        <li><Link to="/lien-he">Liên hệ</Link></li>
                                        <li><Link to="/he-thong-cua-hang">Hệ thống cửa hàng</Link></li>
                                        <li><Link to="/Cau-hoi-thuong-gap">Câu hỏi thường gặp</Link></li>
                                    </ul>
                                </div>

                                <div className="sidebar-widget mt-4">
                                    <h3 className="widget-title">Tin tức nổi bật</h3>
                                    <div className="widget-featured-list">
                                        {recentPosts.filter(p => p.MATINTUC !== id).slice(0, 4).map((rPost, index) => (
                                            <div className="featured-item" key={rPost.MATINTUC}>
                                                <div className="featured-img">
                                                    <span className="featured-index">{index + 1}</span>
                                                    <Link to={`/tin-tuc/${rPost.MATINTUC}`}>
                                                        <img 
                                                            src={(rPost.HINHANH?.startsWith('http') || rPost.HINHANH?.startsWith('/api/')) ? rPost.HINHANH : `${BASE_URL}/images/news/${rPost.HINHANH}`} 
                                                            alt={rPost.TIEUDE}
                                                            onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                                                        />
                                                    </Link>
                                                </div>
                                                <div className="featured-info">
                                                    <h4><Link to={`/tin-tuc/${rPost.MATINTUC}`}>{rPost.TIEUDE}</Link></h4>
                                                    <span className="featured-date">{formatDate(rPost.NGAYDANG)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}

export default PostDetailPage;
