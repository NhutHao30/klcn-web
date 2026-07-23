import { useEffect, useState } from "react";
import { getProducts } from "../services/productService";
import Footer from "../Layout/Footer";


function StorePage() {

  return (
    <>
      <main>
        <section className="about-section">
          <div className="container">
            <h1>Về Chúng Tôi</h1>
            <p>Đây là nội dung về trang About.</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default StorePage;