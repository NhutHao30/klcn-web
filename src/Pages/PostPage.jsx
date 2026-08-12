import { BASE_URL } from '../services/axiosClient';
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getNews } from "../services/newsService";
import Footer from "../Layout/Footer";
import "./PostPage.css"; // Create this CSS file next

function PostPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const data = await getNews(1);
                // API trả về paginate: { data: [...], ... } hoặc plain array [...]
                setPosts(Array.isArray(data) ? data : (data.data || []));
            } catch (error) {
                console.error("Error fetching news:", error);
            }
            setLoading(false);
        };
        fetchPosts();
    }, []);

    // Helper to format date if needed
    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        // Assuming YYYY-MM-DD
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    };

    return (
        <>
            <main>
                {/* <section className="news-banner">
                    <div className="news-banner-content">
                        <h1>Tin tức</h1>
                        <p><Link to="/">Trang chủ</Link> &gt; <span>Tin tức</span></p>
                    </div>
                </section> */}

                <section className="news-content-section container mt-4 mb-5">
                    <div className="row">
                        {/* Main News Grid */}
                        <div className="col-lg-8 col-md-12">
                            {loading ? (
                                <div>Đang tải tin tức...</div>
                            ) : (
                                <div className="row">
                                    {posts.map(post => (
                                        <div className="col-md-6 mb-4" key={post.MATINTUC}>
                                            <div className="news-card">
                                                <div className="news-img-wrapper">
                                                    <span className="news-date-badge">{formatDate(post.NGAYDANG)}</span>
                                                    <Link to={`/tin-tuc/${post.MATINTUC}`}>
                                                        <img 
                                                            src={(post.HINHANH?.startsWith('http') || post.HINHANH?.startsWith('/api/')) ? post.HINHANH : `${BASE_URL}/images/news/${post.HINHANH}`} 
                                                            alt={post.TIEUDE} 
                                                            onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                                                        />
                                                    </Link>
                                                </div>
                                                <div className="news-card-body">
                                                    <h3 className="news-title truncate-text">
                                                        <Link to={`/tin-tuc/${post.MATINTUC}`}>{post.TIEUDE}</Link>
                                                    </h3>
                                                    <p className="news-excerpt">{post.MOTA}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
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
                                        {posts.slice(0, 4).map((post, index) => (
                                            <div className="featured-item" key={post.MATINTUC}>
                                                <div className="featured-img">
                                                    <span className="featured-index">{index + 1}</span>
                                                    <Link to={`/tin-tuc/${post.MATINTUC}`}>
                                                        <img 
                                                            src={(post.HINHANH?.startsWith('http') || post.HINHANH?.startsWith('/api/')) ? post.HINHANH : `${BASE_URL}/images/news/${post.HINHANH}`} 
                                                            alt={post.TIEUDE}
                                                            onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                                                        />
                                                    </Link>
                                                </div>
                                                <div className="featured-info">
                                                    <h4><Link to={`/tin-tuc/${post.MATINTUC}`}>{post.TIEUDE}</Link></h4>
                                                    <span className="featured-date">{formatDate(post.NGAYDANG)}</span>
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

export default PostPage;