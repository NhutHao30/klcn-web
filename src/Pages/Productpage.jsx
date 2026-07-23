import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getProducts } from "../services/productService";
import Footer from "../Layout/Footer";

const parsePrice = (priceStr) => {
  // loại bỏ ký tự ₫ và dấu chấm, sau đó chuyển thành số
  return Number(priceStr.replace("₫", "").replace(/\./g, ""));
};

function ProductPage() {

  const [Products, setProducts] = useState([]);
  const [sortType, setSortType] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get("search")?.toLowerCase() || "";

  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, selectedCategory, sortType]);

  useEffect(() => {
    const fetchProducts = async () => {
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
        // Laravel trả về data.data cho danh sách sản phẩm phân trang
        const productList = data.data || data; 

        if (data.last_page !== undefined) {
          setTotalPages(data.last_page);
        }

        const formattedProducts = productList.map(p => {
          const maSP = p.maSP || p.MaSP || p.MASP;

          const name = p.tenSP || p.TenSP || p.TENSP || "Sản phẩm";
          const price = p.giaban || p.GIABAN || 0;
          const image = p.hinhanh || p.HINHANH || "../../assets/IMG/productnew2.webp";
          const category = p.loaisp || p.LOAISP || "";

          return {
            maSP: maSP,
            Name: name,
            priceOriginal: "",
            priceSale: price.toLocaleString('vi-VN') + "₫",
            Image: image.startsWith("http")
              ? image
              : `../../assets/IMG/${image.split('/').pop()}`,
            Category: category,
            rawPrice: price,
            soluong: p.TONKHO_THUCTE !== undefined ? p.TONKHO_THUCTE : (p.soluong || p.SOLUONG || 0),
            tonkhoChitiet: p.TONKHO_CHITIET || "[]"
          };
        });
        setProducts(formattedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, [currentPage, searchQuery, selectedCategory, sortType]);

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
                        <img src="../../assets/IMG/category_1.webp" alt="" className="category_1-img" />
                        <ul className="category-des-list">
                          <li className="category-des-item">Bánh kếp</li>
                          <li className="category-des-item">
                            <a href="#" className="category-des-item-link">
                              Xem ngay
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </li>
                </ul>
                <ul className="category-list col-lg-3 col-md-4 col-6 col-custom">
                  <li className="category-item">
                    <div className="category-item__block">
                      <div className="category-img">
                        <img src="../../assets/IMG/category_2.webp" alt="" className="category_1-img" />
                        <ul className="category-des-list">
                          <li className="category-des-item">Bánh su kem</li>
                          <li className="category-des-item">
                            <a href="#" className="category-des-item-link">
                              Xem ngay
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </li>
                </ul>
                <ul className="category-list col-lg-3 col-md-4 col-6 col-custom">
                  <li className="category-item">
                    <div className="category-item__block">
                      <div className="category-img">
                        <img src="../../assets/IMG/category_3.webp" alt="" className="category_1-img" />
                        <ul className="category-des-list">
                          <li className="category-des-item">Bánh mì nướng</li>
                          <li className="category-des-item">
                            <a href="#" className="category-des-item-link">
                              Xem ngay
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </li>
                </ul>
                <ul className="category-list col-lg-3 col-md-4 col-6 col-custom">
                  <li className="category-item">
                    <div className="category-item__block">
                      <div className="category-img">
                        <img src="../../assets/IMG/category_4.webp" alt="" className="category_1-img" />
                        <ul className="category-des-list">
                          <li className="category-des-item">Bánh khác</li>
                          <li className="category-des-item">
                            <a href="#" className="category-des-item-link">
                              Xem ngay
                            </a>
                          </li>
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
                      <a href="#">
                        Tất cả sản phẩm
                      </a>
                    </p>
                    <div className="productImg">
                      <img src="../../assets/IMG/productSale--.webp" alt="" className="product-Img-new" />
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div className="row">
              <div className="product-all">
                <div className="product-all__menu col-lg-3 col-md-4 hide-on-mobile">
                  <div className="product-all__menu-block1">
                    <div className="product-all__menu-title">
                      Danh mục sản phẩm
                    </div>
                    <ul className="product-all__menu-list">
                      <li onClick={() => setSelectedCategory("LSP001")} className="product-all__menu-item product-all__menu-item-js">
                        <div>
                          Bánh kem
                          <i className="fa-solid fa-plus rotate-icon"></i>
                        </div>
                        <div>
                          <a href="#" className="menu-item__submenu-item-link">
                            Bánh sinh nhật
                          </a>
                          <a href="#" className="menu-item__submenu-item-link">
                            Bánh sự kiện
                          </a>
                          <a href="#" className="menu-item__submenu-item-link">
                            Bánh dành cho trẻ em
                          </a>
                          <a href="#" className="menu-item__submenu-item-link">
                            Bánh kem đặt trước
                          </a>
                        </div>
                      </li>
                      <li onClick={() => setSelectedCategory("LSP003")} className="product-all__menu-item product-all__menu-item-js">
                        <div>
                          Bánh mì
                          <i className="fa-solid fa-plus rotate-icon"></i>
                        </div>
                        <div>
                          <a href="#" className="menu-item__submenu-item-link">
                            Bánh mì kẹp
                          </a>
                          <a href="#" className="menu-item__submenu-item-link">
                            Bánh cán lớp
                          </a>
                          <a href="#" className="menu-item__submenu-item-link">
                            Bánh mì gối
                          </a>
                          <a href="#" className="menu-item__submenu-item-link">
                            Bánh mì baguette
                          </a>
                          <a href="#" className="menu-item__submenu-item-link">
                            Bánh mì mặn
                          </a>
                          <a href="#" className="menu-item__submenu-item-link">
                            Bánh mì ngọt
                          </a>
                        </div>
                      </li>
                      <li onClick={() => setSelectedCategory("LSP002")} className="product-all__menu-item product-all__menu-item-js">
                        <div>
                          Bánh ngọt
                          <i className="fa-solid fa-plus rotate-icon"></i>
                        </div>
                        <div>
                          <a href="#" className="menu-item__submenu-item-link">
                            Bánh bông lan
                          </a>
                          <a href="#" className="menu-item__submenu-item-link">
                            Bánh Chiffon
                          </a>
                          <a href="#" className="menu-item__submenu-item-link">
                            Bánh cuộn
                          </a>
                          <a href="#" className="menu-item__submenu-item-link">
                            Bánh su kem
                          </a>
                        </div>
                      </li>
                      <li onClick={() => setSelectedCategory("LSP004")} className="product-all__menu-item product-all__menu-item-js">
                        <div>
                          Bánh tráng miệng
                          <i className="fa-solid fa-plus rotate-icon"></i>
                        </div>
                        <div>
                          <a href="#" className="menu-item__submenu-item-link">
                            Bánh miếng
                          </a>
                          <a href="#" className="menu-item__submenu-item-link">
                            Bánh mousse
                          </a>
                          <a href="#" className="menu-item__submenu-item-link">
                            Tiramisu/ Caramel/ Sữa chua
                          </a>
                          <a href="#" className="menu-item__submenu-item-link">
                            Panna cotta & Pudding
                          </a>
                        </div>
                      </li>
                      <li onClick={() => setSelectedCategory("LSP005")} className="product-all__menu-item product-all__menu-item-js">
                        <div>
                          Bánh khô
                          <i className="fa-solid fa-plus rotate-icon"></i>
                        </div>
                        <div>
                          <a href="#" className="menu-item__submenu-item-link">
                            Bánh quy
                          </a>
                          <a href="#" className="menu-item__submenu-item-link">
                            Bánh mì nướng
                          </a>
                          <a href="#" className="menu-item__submenu-item-link">
                            Bánh sừng bò mini
                          </a>
                        </div>
                      </li>
                      <li onClick={() => setSelectedCategory("LSP006")} className="product-all__menu-item product-all__menu-item-js">
                        <div>
                          Bánh đông lạnh
                          <i className="fa-solid fa-plus rotate-icon"></i>
                        </div>
                        <div>
                          <a href="#" className="menu-item__submenu-item-link">
                            Bánh bao
                          </a>
                          <a href="#" className="menu-item__submenu-item-link">
                            Bánh pizza
                          </a>
                        </div>
                      </li>
                      <li onClick={() => setSelectedCategory("LSP007")} className="product-all__menu-item product-all__menu-item-js">
                        <div>
                          Bánh theo mùa
                          <i className="fa-solid fa-plus rotate-icon"></i>
                        </div>
                        <div>
                          <a href="#" className="menu-item__submenu-item-link">
                            Bánh quy Tết
                          </a>
                          <a href="#" className="menu-item__submenu-item-link">
                            Bánh Trung Thu
                          </a>
                          <a href="#" className="menu-item__submenu-item-link">
                            Bánh dành quy Noel
                          </a>
                          <a href="#" className="menu-item__submenu-item-link">
                            Bánh kem Noel
                          </a>
                        </div>
                      </li>
                      <li onClick={() => setSelectedCategory("Đồ uống")} className="product-all__menu-item product-all__menu-item-js">
                        <div>
                          Đồ uống
                        </div>
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

                <div className="product-all__item col-lg-9 col-md-8 col-12">
                  <div className="product-all__item-filter">
                    <ul className="product-all__item-filter-list">
                      <li className="product-all__item-filter-item col-3 col-md-3 col-lg-2 col-custom">
                        <i className="fa-solid fa-arrow-down-a-z"></i>
                        Xếp theo:
                      </li>
                      <li onClick={() => setSortType("az")} className="product-all__item-filter-item col-3 col-md-3 col-lg-2 col-custom" >
                        <span href="#" className="product-all__item-filter-item-link">Tên A - Z</span>
                      </li>
                      <li onClick={() => setSortType("za")} className="product-all__item-filter-item col-3 col-md-3 col-lg-2 col-custom" >
                        <span href="#" className="product-all__item-filter-item-link">Tên Z - A</span>
                      </li>
                      <li onClick={() => setSortType("new")} className="product-all__item-filter-item col-3 col-md-3 col-lg-2 col-custom" >
                        <span href="#" className="product-all__item-filter-item-link">Hàng mới</span>
                      </li>
                      <li onClick={() => setSortType("price-asc")} className="product-all__item-filter-item col-5 col-md-4 col-lg-2 col-custom" >
                        <span href="#" className="product-all__item-filter-item-link">Giá thấp đến cao</span>
                      </li>
                      <li onClick={() => setSortType("price-desc")} className="product-all__item-filter-item col-5 col-md-4 col-lg-2 col-custom" >
                        <span href="#" className="product-all__item-filter-item-link">Giá cao đến thấp</span>
                      </li>
                    </ul>
                  </div>

                  <ul className="product-list-level-2 product-sale-list-level-2-js mt-30" id="product-list">
                    <div className="row sm-gutter" style={{ display: "flex", flexWrap: "wrap", width: "100%" }}>
                      {getFilteredAndSortedProducts().map((product, index) => (
                        <li
                          key={index}
                          data-masp={product.maSP || product.MASP}
                          data-soluong={product.soluong}
                          data-tonkho-chitiet={product.tonkhoChitiet}
                          className="product-sale-item-level2 col-lg-3 col-custom col-md-4 col-6"
                          style={{ marginBottom: "20px", listStyle: "none" }}
                        >
                          <div className="product-sale-item__img product-sale-item__img-js" style={{ width: "100%" }}>
                            <img src={product.Image} alt="" className=" product-sale_img product-sale_img-js" style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "8px" }} />
                            <ul className="product-bestSale-tag-list">
                              <li className="product-bestSale-tag-item">
                                -20%
                              </li>
                              <li className="product-bestSale-tag-item product-bestSale__tag-icon--noLike-js">
                                <i className="product-bestSale__tag-icon--noLike fa-regular fa-heart"></i>
                              </li>
                              <li className="product-bestSale-tag-item product-bestSale__tag-icon--Like-js">
                                <i className="product-bestSale__tag-icon--Like fa-solid fa-heart"></i>
                              </li>
                            </ul>
                            <ul className="product-sale-tag-list-2 product-sale-tag-list-2-js">
                              <li className="product-sale-tag-item-2 product-sale-tag-item-2-cart-js"  >
                                <i className="product-sale__tag-icon-2 fa-solid fa-cart-shopping"></i>
                              </li>
                              <li className="product-sale-tag-item-2 product-sale-tag-item-2-search-js">
                                <i className="product-sale__tag-icon-2 fa-solid fa-magnifying-glass"></i>
                              </li>
                            </ul>
                          </div>
                          <div className="product-sale-des-2">
                            <div className="product-sale__name product-sale__name-js">
                              {product.Name}
                            </div>
                            <ul className="product-sale__price">
                              <li className="product-sale__price-sale product-sale__price-sale-js">{product.priceSale}</li>
                              <li className="product-sale__price-original product-sale__price-original-js">{product.priceOriginal}</li>
                            </ul>
                          </div>
                        </li>
                      ))}

                    </div>
                  </ul>

                  <div className="product-all-page" style={{display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px'}}>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <a 
                        key={i} 
                        href="#" 
                        className={`product-all-page-${i + 1}`} 
                        style={{
                          padding: '5px 12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          color: currentPage === i ? 'white' : '#333',
                          backgroundColor: currentPage === i ? 'var(--primary-color)' : 'transparent',
                          textDecoration: 'none'
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(i);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        {i + 1}
                      </a>
                    ))}
                  </div>
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