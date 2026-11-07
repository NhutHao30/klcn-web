import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getProducts } from "../services/productService";
import { addToCart } from "../services/cartService";
import { useToast } from "../components/Toast/Toast";
import Footer from "../Layout/Footer";
import { formatImageUrl } from "../utils/imageUtils";
import CookieSpinner from "../components/CookieSpinner";

// Format đơn giá theo chuẩn Việt Nam (VND): 15.000 đ
const formatPriceVND = (amount) => {
  if (amount === null || amount === undefined || amount === "") return "0 đ";
  const num = Number(amount);
  if (isNaN(num)) return amount + " đ";
  return num.toLocaleString("vi-VN") + " đ";
};

function ProductPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [Products, setProducts] = useState([]);
  const [sortType, setSortType] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);

  const categoryOptions = [
    { label: "Tất cả bánh", value: null },
    { label: "Bánh kem", value: 1 },
    { label: "Bánh ngọt", value: 2 },
    { label: "Bánh mì", value: 3 },
    { label: "Bánh khô", value: 4 },
    { label: "Bánh tráng miệng", value: 5 },
    { label: "Bánh theo mùa", value: 6 },
  ];

  const sortOptions = [
    { label: "Tên A - Z", value: "az" },
    { label: "Tên Z - A", value: "za" },
    { label: "Hàng mới", value: "new" },
    { label: "Giá thấp đến cao", value: "price-asc" },
    { label: "Giá cao đến thấp", value: "price-desc" },
  ];

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get("search")?.toLowerCase() || "";

  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, selectedCategory, sortType]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {
          page: currentPage,
          size: 12
        };

        if (searchQuery) params.keyword = searchQuery;
        if (selectedCategory) params.category = selectedCategory;

        if (sortType) {
          if (sortType === "az") { params.sortBy = "TenSP"; params.direction = "asc"; }
          if (sortType === "za") { params.sortBy = "TenSP"; params.direction = "desc"; }
          if (sortType === "price-asc") { params.sortBy = "GIABAN"; params.direction = "asc"; }
          if (sortType === "price-desc") { params.sortBy = "GIABAN"; params.direction = "desc"; }
        }

        const data = await getProducts(params);
        const productList = data.data || (Array.isArray(data) ? data : []);

        if (data.last_page !== undefined) {
          setTotalPages(data.last_page);
        }

        const formattedProducts = productList.map(p => {
          const maSP = p.id || p.maSP || p.MaSP || p.MASP;
          const name = p.tenSP || p.TenSP || p.TENSP || p.tenSanPham || "Sản phẩm";
          const price = Number(p.giaban || p.GIABAN || p.giaBan || 0);
          const image = p.hinh_anh || p.hinhanh || p.HINHANH || p.hinhAnh || "/assets/IMG/productnew2.webp";
          const category = p.loaisp || p.LOAISP || "";
          const isNew = p.is_new || p.IS_NEW || p.isNew || false;
          const discountPercent = parseInt(p.phan_tram_giam || p.PHAN_TRAM_GIAM || p.phanTramGiam || 0);

          let finalPrice = price;
          let originalPriceStr = "";

          if (discountPercent > 0) {
            finalPrice = price - (price * discountPercent / 100);
            originalPriceStr = formatPriceVND(price);
          }

          return {
            id: p.id,
            maSP: maSP,
            Name: name,
            priceOriginal: originalPriceStr,
            priceSale: formatPriceVND(finalPrice),
            isNew: isNew,
            discountPercent: discountPercent,
            Image: formatImageUrl(image),
            Category: category,
            rawPrice: price,
            soluong: p.TONKHO_THUCTE !== undefined ? p.TONKHO_THUCTE : (p.soluong || p.SOLUONG || 0),
            tonkhoChitiet: p.TONKHO_CHITIET || "[]"
          };
        });
        setProducts(formattedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, searchQuery, selectedCategory, sortType]);

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    const maSP = product.id || product.maSP || product.MASP;
    if (!maSP) return;

    try {
      await addToCart(maSP, 1);
      toast.success(`Đã thêm "${product.Name}" vào giỏ hàng!`);
      document.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      console.error("Lỗi thêm vào giỏ:", err);
      if (err.response?.status === 401) {
        toast.warning("Vui lòng đăng nhập để thực hiện thêm giỏ hàng!");
      } else {
        toast.error(err.response?.data?.message || err.response?.data?.error || "Không thể thêm sản phẩm vào giỏ!");
      }
    }
  };

  const getFilteredAndSortedProducts = () => {
    return Products;
  };

  return (
    <>
      <main>
        <div className="category mt-30">
          <div className="container">
            <div className="row">
              <div className="category-background">
                <ul className="category-list col-lg-3 col-md-4 col-6 col-custom">
                  <li className="category-item">
                    <div className="category-item__block">
                      <div className="category-img">
                        <img src="/assets/IMG/category_1.webp" alt="Bánh kếp" className="category_1-img" />
                        <ul className="category-des-list">
                          <li className="category-des-item">Bánh kếp</li>
                        </ul>
                      </div>
                    </div>
                  </li>
                </ul>
                <ul className="category-list col-lg-3 col-md-4 col-6 col-custom">
                  <li className="category-item">
                    <div className="category-item__block">
                      <div className="category-img">
                        <img src="/assets/IMG/category_2.webp" alt="Bánh su kem" className="category_1-img" />
                        <ul className="category-des-list">
                          <li className="category-des-item">Bánh su kem</li>
                        </ul>
                      </div>
                    </div>
                  </li>
                </ul>
                <ul className="category-list col-lg-3 col-md-4 col-6 col-custom">
                  <li className="category-item">
                    <div className="category-item__block">
                      <div className="category-img">
                        <img src="/assets/IMG/category_3.webp" alt="Bánh mì nướng" className="category_1-img" />
                        <ul className="category-des-list">
                          <li className="category-des-item">Bánh mì nướng</li>
                        </ul>
                      </div>
                    </div>
                  </li>
                </ul>
                <ul className="category-list col-lg-3 col-md-4 col-6 col-custom">
                  <li className="category-item">
                    <div className="category-item__block">
                      <div className="category-img">
                        <img src="/assets/IMG/category_4.webp" alt="Bánh khác" className="category_1-img" />
                        <ul className="category-des-list">
                          <li className="category-des-item">Bánh khác</li>
                        </ul>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="product-new">
          <div className="container">
            <div className="row">
              <div className="product-new-background">
                <ul className="product-new-list-level-1">
                  <li className="product-new-item">
                    <p className="product-new-title product-sale-title-js">
                      <span
                        style={{ cursor: "pointer" }}
                        onClick={() => { setSelectedCategory(null); setSortType(null); }}
                      >
                        Tất cả sản phẩm
                      </span>
                    </p>
                    <div className="productImg">
                      <img src="/assets/IMG/productSale--.webp" alt="" className="product-Img-new" />
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div className="row">
              <div className="product-all">
                {/* SIDEBAR DANH MỤC */}
                <div className="product-all__menu col-lg-3 col-md-4 hide-on-mobile">
                  <div className="product-all__menu-block1">
                    <div className="product-all__menu-title">
                      Danh mục sản phẩm
                    </div>
                    <ul className="product-all__menu-list">
                      <li onClick={() => setSelectedCategory(null)} className={`product-all__menu-item product-all__menu-item-js ${!selectedCategory ? "active" : ""}`} style={{ cursor: "pointer" }}>
                        <div>Tất cả bánh</div>
                      </li>
                      <li onClick={() => setSelectedCategory(1)} className={`product-all__menu-item product-all__menu-item-js ${selectedCategory === 1 || selectedCategory === "LSP001" ? "active" : ""}`} style={{ cursor: "pointer" }}>
                        <div>Bánh kem</div>
                      </li>
                      <li onClick={() => setSelectedCategory(2)} className={`product-all__menu-item product-all__menu-item-js ${selectedCategory === 2 || selectedCategory === "LSP002" ? "active" : ""}`} style={{ cursor: "pointer" }}>
                        <div>Bánh ngọt</div>
                      </li>
                      <li onClick={() => setSelectedCategory(3)} className={`product-all__menu-item product-all__menu-item-js ${selectedCategory === 3 || selectedCategory === "LSP003" ? "active" : ""}`} style={{ cursor: "pointer" }}>
                        <div>Bánh mì</div>
                      </li>
                      <li onClick={() => setSelectedCategory(4)} className={`product-all__menu-item product-all__menu-item-js ${selectedCategory === 4 || selectedCategory === "LSP004" ? "active" : ""}`} style={{ cursor: "pointer" }}>
                        <div>Bánh khô</div>
                      </li>
                      <li onClick={() => setSelectedCategory(5)} className={`product-all__menu-item product-all__menu-item-js ${selectedCategory === 5 || selectedCategory === "LSP005" ? "active" : ""}`} style={{ cursor: "pointer" }}>
                        <div>Bánh tráng miệng</div>
                      </li>
                      <li onClick={() => setSelectedCategory(6)} className={`product-all__menu-item product-all__menu-item-js ${selectedCategory === 6 || selectedCategory === "LSP006" ? "active" : ""}`} style={{ cursor: "pointer" }}>
                        <div>Bánh theo mùa</div>
                      </li>
                    </ul>
                  </div>

                  <div className="product-filter">
                    <span className="product-filter-title">
                      Bộ lọc sản phẩm
                    </span>
                    <span className="product-filter-des">
                      Giúp bạn tìm sản phẩm nhanh hơn
                    </span>
                  </div>

                  <div className="product-filter-container">
                    <div className="product-filter-container-title">
                      Chọn mức giá
                    </div>
                    <ul className="product-filter-container-list">
                      <li className="product-filter-container-item">
                        <input type="checkbox" className="product-filter-container-item__check" />
                        <span>Dưới 10.000đ</span>
                      </li>
                      <li className="product-filter-container-item">
                        <input type="checkbox" className="product-filter-container-item__check" />
                        <span>Từ 10.000đ - 50.000đ</span>
                      </li>
                      <li className="product-filter-container-item">
                        <input type="checkbox" className="product-filter-container-item__check" />
                        <span>Từ 50.000đ - 100.000đ</span>
                      </li>
                      <li className="product-filter-container-item">
                        <input type="checkbox" className="product-filter-container-item__check" />
                        <span>Từ 100.000đ - 200.000đ</span>
                      </li>
                      <li className="product-filter-container-item">
                        <input type="checkbox" className="product-filter-container-item__check" />
                        <span>Từ 200.000đ - 300.000đ</span>
                      </li>
                      <li className="product-filter-container-item">
                        <input type="checkbox" className="product-filter-container-item__check" />
                        <span>Từ 300.000đ - 1 triệu</span>
                      </li>
                      <li className="product-filter-container-item">
                        <input type="checkbox" className="product-filter-container-item__check" />
                        <span>Trên 1 triệu</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* DANH SÁCH SẢN PHẨM */}
                <div className="product-all__item col-lg-9 col-md-8 col-12">

                  {/* MOBILE FILTER DROPDOWNS - chỉ hiển thị trên mobile */}
                  <div className="mobile-filter-bar">
                    {/* Dropdown Danh mục */}
                    <div className="mobile-filter-dropdown">
                      <button
                        className="mobile-filter-btn"
                        onClick={() => { setMobileCategoryOpen(o => !o); setMobileSortOpen(false); }}
                      >
                        <i className="fa-solid fa-layer-group"></i>
                        {categoryOptions.find(c => c.value === selectedCategory)?.label || "Danh mục"}
                        <i className={`fa-solid fa-chevron-${mobileCategoryOpen ? "up" : "down"}`} style={{ marginLeft: "auto" }}></i>
                      </button>
                      {mobileCategoryOpen && (
                        <ul className="mobile-filter-options">
                          {categoryOptions.map(opt => (
                            <li
                              key={opt.value}
                              className={`mobile-filter-option ${selectedCategory === opt.value ? "active" : ""}`}
                              onClick={() => { setSelectedCategory(opt.value); setMobileCategoryOpen(false); }}
                            >
                              {opt.label}
                              {selectedCategory === opt.value && <i className="fa-solid fa-check"></i>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Dropdown Sắp xếp */}
                    <div className="mobile-filter-dropdown">
                      <button
                        className="mobile-filter-btn"
                        onClick={() => { setMobileSortOpen(o => !o); setMobileCategoryOpen(false); }}
                      >
                        <i className="fa-solid fa-arrow-down-a-z"></i>
                        {sortOptions.find(s => s.value === sortType)?.label || "Sắp xếp"}
                        <i className={`fa-solid fa-chevron-${mobileSortOpen ? "up" : "down"}`} style={{ marginLeft: "auto" }}></i>
                      </button>
                      {mobileSortOpen && (
                        <ul className="mobile-filter-options">
                          <li
                            className={`mobile-filter-option ${!sortType ? "active" : ""}`}
                            onClick={() => { setSortType(null); setMobileSortOpen(false); }}
                          >
                            Mặc định
                            {!sortType && <i className="fa-solid fa-check"></i>}
                          </li>
                          {sortOptions.map(opt => (
                            <li
                              key={opt.value}
                              className={`mobile-filter-option ${sortType === opt.value ? "active" : ""}`}
                              onClick={() => { setSortType(opt.value); setMobileSortOpen(false); }}
                            >
                              {opt.label}
                              {sortType === opt.value && <i className="fa-solid fa-check"></i>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* DESKTOP SORT FILTER - ẩn trên mobile */}
                  <div className="product-all__item-filter desktop-filter">
                    <ul className="product-all__item-filter-list">
                      <li className="product-all__item-filter-item col-3 col-md-3 col-lg-2 col-custom">
                        <i className="fa-solid fa-arrow-down-a-z"></i>
                        Xếp theo:
                      </li>
                      <li onClick={() => setSortType("az")} className={`product-all__item-filter-item col-3 col-md-3 col-lg-2 col-custom ${sortType === "az" ? "active" : ""}`} style={{ cursor: "pointer" }}>
                        <span className="product-all__item-filter-item-link">Tên A - Z</span>
                      </li>
                      <li onClick={() => setSortType("za")} className={`product-all__item-filter-item col-3 col-md-3 col-lg-2 col-custom ${sortType === "za" ? "active" : ""}`} style={{ cursor: "pointer" }}>
                        <span className="product-all__item-filter-item-link">Tên Z - A</span>
                      </li>
                      <li onClick={() => setSortType("new")} className={`product-all__item-filter-item col-3 col-md-3 col-lg-2 col-custom ${sortType === "new" ? "active" : ""}`} style={{ cursor: "pointer" }}>
                        <span className="product-all__item-filter-item-link">Hàng mới</span>
                      </li>
                      <li onClick={() => setSortType("price-asc")} className={`product-all__item-filter-item col-5 col-md-4 col-lg-2 col-custom ${sortType === "price-asc" ? "active" : ""}`} style={{ cursor: "pointer" }}>
                        <span className="product-all__item-filter-item-link">Giá thấp đến cao</span>
                      </li>
                      <li onClick={() => setSortType("price-desc")} className={`product-all__item-filter-item col-5 col-md-4 col-lg-2 col-custom ${sortType === "price-desc" ? "active" : ""}`} style={{ cursor: "pointer" }}>
                        <span className="product-all__item-filter-item-link">Giá cao đến thấp</span>
                      </li>
                    </ul>
                  </div>

                  {loading ? (
                    <CookieSpinner text="Đang tải danh sách sản phẩm..." />
                  ) : getFilteredAndSortedProducts().length === 0 ? (
                    /* KHÔNG CÓ SẢN PHẨM NÀO KHẢ DỤNG */
                    <div style={{
                      textAlign: "center",
                      padding: "60px 20px",
                      backgroundColor: "#fff",
                      borderRadius: "12px",
                      border: "1px dashed #e0e0e0",
                      margin: "20px 0",
                      width: "100%"
                    }}>
                      <i className="fa-solid fa-cookie-bite" style={{ fontSize: "56px", color: "var(--primary-color)", marginBottom: "15px", opacity: 0.7 }}></i>
                      <h3 style={{ fontSize: "18px", color: "#333", fontWeight: "600", marginBottom: "8px" }}>
                        Không có sản phẩm nào khả dụng
                      </h3>
                      <p style={{ color: "#777", fontSize: "14px", marginBottom: "20px" }}>
                        {selectedCategory || searchQuery
                          ? "Hiện tại không tìm thấy sản phẩm phù hợp với danh mục hoặc từ khóa bạn chọn."
                          : "Hiện tại chưa có sản phẩm nào trong hệ thống."}
                      </p>
                      {(selectedCategory || searchQuery || sortType) && (
                        <button
                          style={{
                            padding: "9px 22px",
                            backgroundColor: "var(--primary-color)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "14px",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
                          }}
                          onClick={() => {
                            setSelectedCategory(null);
                            setSortType(null);
                            if (searchQuery) navigate("/san-pham");
                          }}
                        >
                          <i className="fa-solid fa-rotate-left" style={{ marginRight: "6px" }}></i>
                          Xem tất cả sản phẩm
                        </button>
                      )}
                    </div>
                  ) : (
                    <ul className="product-list-level-2 product-sale-list-level-2-js mt-30" id="product-list">
                      <div className="row sm-gutter" style={{ display: "flex", flexWrap: "wrap", width: "100%" }}>
                        {getFilteredAndSortedProducts().map((product, index) => (
                          <li
                            key={index}
                            data-masp={product.maSP}
                            data-soluong={product.soluong}
                            data-tonkho-chitiet={product.tonkhoChitiet}
                            className="product-sale-item-level2 col-lg-3 col-custom col-md-4 col-6"
                            style={{ marginBottom: "20px", listStyle: "none" }}
                          >
                            <div
                              className="product-sale-item__img product-sale-item__img-js"
                              style={{ width: "100%", cursor: "pointer" }}
                              onClick={() => navigate(`/san-pham/${product.maSP}`)}
                            >
                              <img src={product.Image} alt={product.Name} className="product-sale_img product-sale_img-js" style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "8px" }} />
                              <ul className="product-bestSale-tag-list">
                                {product.discountPercent > 0 && (
                                  <li className="product-bestSale-tag-item" style={{ backgroundColor: "#e74c3c", padding: "4px 8px", borderRadius: "4px", marginBottom: "5px", width: "max-content" }}>
                                    - {product.discountPercent}%
                                  </li>
                                )}
                                {product.isNew && (
                                  <li className="product-bestSale-tag-item" style={{ backgroundColor: "#f39c12", padding: "4px 8px", borderRadius: "4px", clear: "both" }}>
                                    New
                                  </li>
                                )}
                                <li className="product-bestSale-tag-item product-bestSale__tag-icon--noLike-js" style={{ marginTop: "5px", clear: "both", backgroundColor: "transparent" }}>
                                  <i className="product-bestSale__tag-icon--noLike fa-regular fa-heart"></i>
                                </li>
                                <li className="product-bestSale-tag-item product-bestSale__tag-icon--Like-js">
                                  <i className="product-bestSale__tag-icon--Like fa-solid fa-heart"></i>
                                </li>
                              </ul>
                              <ul className="product-sale-tag-list-2 product-sale-tag-list-2-js">
                                <li
                                  className="product-sale-tag-item-2 product-sale-tag-item-2-cart-js"
                                  title="Thêm vào giỏ hàng"
                                  onClick={(e) => handleAddToCart(e, product)}
                                  style={{ cursor: "pointer" }}
                                >
                                  <i className="product-sale__tag-icon-2 fa-solid fa-cart-shopping"></i>
                                </li>
                                <li
                                  className="product-sale-tag-item-2 product-sale-tag-item-2-search-js"
                                  title="Xem chi tiết"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/san-pham/${product.maSP}`);
                                  }}
                                  style={{ cursor: "pointer" }}
                                >
                                  <i className="product-sale__tag-icon-2 fa-solid fa-magnifying-glass"></i>
                                </li>
                              </ul>
                            </div>
                            <div className="product-sale-des-2">
                              <div
                                className="product-sale__name product-sale__name-js"
                                style={{ cursor: "pointer" }}
                                onClick={() => navigate(`/san-pham/${product.maSP}`)}
                              >
                                {product.Name}
                              </div>
                              <ul className="product-sale__price">
                                <li className="product-sale__price-sale product-sale__price-sale-js" style={{ color: "#d35400", fontWeight: "bold" }}>{product.priceSale}</li>
                                {product.priceOriginal && (
                                  <li className="product-sale__price-original product-sale__price-original-js" style={{ textDecoration: "line-through", color: "#7f8c8d", fontSize: "0.9em", marginLeft: "10px" }}>{product.priceOriginal}</li>
                                )}
                              </ul>
                            </div>
                          </li>
                        ))}
                      </div>
                    </ul>
                  )}

                  {!loading && totalPages > 1 && (
                    <div className="product-all-page" style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "30px", flexWrap: "nowrap", overflowX: "auto", width: "100%", padding: "10px 0" }}>
                      {currentPage > 0 && (
                        <button
                          type="button"
                          className="product-all-page-btn"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: "36px",
                            height: "36px",
                            padding: "0 10px",
                            border: "1px solid #ddd",
                            borderRadius: "6px",
                            color: "#333",
                            backgroundColor: "#fff",
                            cursor: "pointer",
                            fontSize: "14px",
                            boxSizing: "border-box",
                            lineHeight: "1"
                          }}
                          onClick={() => {
                            setCurrentPage(prev => Math.max(0, prev - 1));
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          title="Trang trước"
                        >
                          <i className="fa-solid fa-chevron-left" style={{ fontSize: "11px" }}></i>
                        </button>
                      )}

                      {Array.from({ length: totalPages }, (_, i) => {
                        const isActive = currentPage === i;
                        return (
                          <button
                            key={i}
                            type="button"
                            className={`product-all-page-btn ${isActive ? "active" : ""}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              minWidth: "36px",
                              height: "36px",
                              padding: "0 10px",
                              border: `1px solid ${isActive ? "var(--primary-color)" : "#ddd"}`,
                              borderRadius: "6px",
                              color: isActive ? "#fff" : "#333",
                              backgroundColor: isActive ? "var(--primary-color)" : "#fff",
                              fontWeight: isActive ? "600" : "normal",
                              cursor: "pointer",
                              fontSize: "14px",
                              boxSizing: "border-box",
                              lineHeight: "1"
                            }}
                            onClick={() => {
                              setCurrentPage(i);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                          >
                            <span style={{ color: isActive ? "#fff" : "#333", fontWeight: isActive ? "600" : "normal" }}>{i + 1}</span>
                          </button>
                        );
                      })}

                      {currentPage < totalPages - 1 && (
                        <button
                          type="button"
                          className="product-all-page-btn"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: "36px",
                            height: "36px",
                            padding: "0 10px",
                            border: "1px solid #ddd",
                            borderRadius: "6px",
                            color: "#333",
                            backgroundColor: "#fff",
                            cursor: "pointer",
                            fontSize: "14px",
                            boxSizing: "border-box",
                            lineHeight: "1"
                          }}
                          onClick={() => {
                            setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          title="Trang sau"
                        >
                          <i className="fa-solid fa-chevron-right" style={{ fontSize: "11px" }}></i>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default ProductPage;