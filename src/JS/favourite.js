document.addEventListener("DOMContentLoaded", function () {
    const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    const container = document.getElementById("wishlist-container");

    if (wishlist.length === 0) {
        container.innerHTML = `<p style="text-align:center; width: 100%">Bạn chưa thêm sản phẩm nào vào yêu thích.</p>`;
        return;
    }

    wishlist.forEach(item => {
        const li = document.createElement("li");
        li.className = "product-sale-item-level2 col-lg-3 col-custom col-md-4 col-6";

        li.innerHTML = `
                        <div class="product-sale-item__img product-sale-item__img-js">
                            <img src="${item.img}" alt="" class="product-sale_img product-sale_img-js">
                            <ul class="product-bestSale-tag-list">
                                <li class="product-bestSale-tag-item">Yêu thích</li>
                            </ul>
                        </div>
                        <div class="product-sale-des-2">
                            <div class="product-sale__name product-sale__name-js">
                                ${item.name}
                            </div>
                            <ul class="product-sale__price">
                                <li class="product-sale__price-sale product-sale__price-sale-js">${item.price}</li>
                            </ul>
                            <b class="remove-wishlist" style="cursor:pointer; color:red; display:block; margin-top: 10px; text-align: center; font-size: 1.6rem;">Xóa</b>
                        </div>
                    `;

        const removeBtn = li.querySelector('.remove-wishlist');
        removeBtn.addEventListener("click", () => {
            const updated = wishlist.filter(w => w.name !== item.name);
            localStorage.setItem("wishlist", JSON.stringify(updated));
            li.remove(); // hoặc location.reload();
            if (updated.length === 0) {
                container.innerHTML = `<p style="text-align:center; width: 100%">Bạn chưa thêm sản phẩm nào vào yêu thích.</p>`;
            }
        });

        container.appendChild(li);
    });
});