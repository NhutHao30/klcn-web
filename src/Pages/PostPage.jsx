import React, { useEffect, useState } from "react";
import { getTinTuc } from "../services/tinTucService";
import Footer from "../Layout/Footer";

function PostPage() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await getTinTuc();
        setPosts(data);
      } catch (error) {
        console.error("Error fetching news:", error);
      }
    };
    fetchPosts();
  }, []);

  return (
    <>
      <main>
        <section className="product-post mt-30">
          <div className="container">
            <div className="row">
              <div className="product-post-background" style={{ width: "100%" }}>
                <ul className="product-post-list-level-1 mt-30">
                  <li className="product-post-item">
                    <p className="product-post-title product-sale-title-js">
                      <a href="#">
                        Tin Tức
                      </a>
                    </p>
                    <div className="productImg">
                      <img src="../../assets/IMG/productSale--.webp" alt="" className="product-Img-post" />
                    </div>
                  </li>
                  <li className="product-post-item" style={{ display: "flex", flexWrap: "wrap" }}>
                    {posts.map((post, index) => {
                      const image = post.hinhAnh || post.HINHANH || "../../assets/IMG/post_img-1.webp";
                      const imgPath = image.startsWith("http") ? image : `../../assets/IMG/${image.split('/').pop()}`;
                      
                      return (
                        <div key={index} className="product-post-block col-lg-4 col-md-4 col-12 mb-30" style={{ marginBottom: "30px" }}>
                          <ul className="product-post-block-list">
                            <li className="product-post-block-item_img">
                              <a href="#" className="product-post-block-item_img-link">
                                <img src={imgPath} alt={post.tieuDe || post.TieuDe} className="product-post_img" />
                              </a>
                            </li>
                            <li className="product-post-block-item_info">
                              <h3 className="product-post_title-h3">
                                <a href="#" className="product-post-title-link">
                                  {post.tieuDe || post.TieuDe}
                                </a>
                              </h3>
                              <p className="product-post-block-item_des" style={{ marginTop: "10px", color: "#666", fontSize: "14px", display: "-webkit-box", WebkitLineClamp: "3", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {post.moTa || post.MoTa}
                              </p>
                            </li>
                          </ul>
                        </div>
                      );
                    })}
                  </li>
                </ul>
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