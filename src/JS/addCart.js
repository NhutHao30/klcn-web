

document.addEventListener("DOMContentLoaded", function () {
    let cartList = JSON.parse(localStorage.getItem("cart")) || [];
    const cartContainer = document.querySelector(".cart-container-detail__product-list-js");
    const tongTienEl = document.getElementById("tong-tien-toan-bo");
    const btnThanhToan = document.getElementById("btn-thanh-toan");

    if (cartList.length === 0) {
        cartContainer.innerHTML = `<p>Giỏ hàng của bạn đang trống.</p>`;
        tongTienEl.textContent = "0₫";
        btnThanhToan.disabled = true;
        return;
    }

    cartList = cartList.map(item => ({
        ...item,
        quantity: item.quantity || 1
    }));

    renderCart();

    function renderCart() {
        cartContainer.innerHTML = "";
        let tongTienTatCa = 0;

        cartList.forEach((item, index) => {
            const gia = parseInt(item.price.replace("₫", "").replace(/\./g, ""));
            const thanhTien = gia * item.quantity;
            tongTienTatCa += thanhTien;

            const cartItemHTML = `
                <div class="cart-container-detail__product-item" data-index="${index}">
                    <a href="#" class="cart-container-detail__product-item-img">
                        <img src="${item.img}" alt="${item.name}">
                    </a>
                    <div class="cart-container-detail__product-item-des">
                        <div>
                            <b>${item.name}</b> 
                            <b class="highligh deleteProduct" style="cursor:pointer">Xóa</b>
                        </div>
                        <div>
                            <b class="highligh hide-on-mobile">${item.price}</b>
                        </div>
                        <div>
                            <ul class="CustomizeQuantity">
                                <li class="CustomizeQuantity-remove" style="cursor:pointer">
                                    <i class="fa-solid fa-minus"></i>
                                </li>
                                <li class="CustomizeQuantity-number">${item.quantity}</li>
                                <li class="CustomizeQuantity-add" style="cursor:pointer">
                                    <i class="fa-solid fa-plus"></i>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <b class="highligh">${thanhTien.toLocaleString("vi-VN")}₫</b>
                        </div>
                    </div>
                </div>
            `;
            cartContainer.insertAdjacentHTML("beforeend", cartItemHTML);
        });

        tongTienEl.textContent = `${tongTienTatCa.toLocaleString("vi-VN")}₫`;
        localStorage.setItem("cart", JSON.stringify(cartList));
        handleQuantityEvents();
    }

    function handleQuantityEvents() {
        const removeBtns = document.querySelectorAll(".CustomizeQuantity-remove");
        const addBtns = document.querySelectorAll(".CustomizeQuantity-add");
        const deleteBtns = document.querySelectorAll(".deleteProduct");

        addBtns.forEach((btn, index) => {
            btn.addEventListener("click", () => {
                cartList[index].quantity += 1;
                renderCart();
            });
        });

        removeBtns.forEach((btn, index) => {
            btn.addEventListener("click", () => {
                if (cartList[index].quantity > 1) {
                    cartList[index].quantity -= 1;
                    renderCart();
                }
            });
        });

        deleteBtns.forEach((btn, index) => {
            btn.addEventListener("click", () => {
                cartList.splice(index, 1);
                renderCart();
            });
        });
    }

    // Sự kiện nút "Thanh toán"
    btnThanhToan.addEventListener("click", () => {
        if (cartList.length === 0) {
            alert("Giỏ hàng trống!");
            return;
        }

        let summary = "🧁 Thông tin đơn hàng:\n\n";
        let tongTien = 0;

        cartList.forEach(item => {
            const gia = parseInt(item.price.replace("₫", "").replace(/\./g, ""));
            const thanhTien = gia * item.quantity;
            tongTien += thanhTien;

            summary += `- ${item.name} × ${item.quantity} = ${thanhTien.toLocaleString("vi-VN")}₫\n`;
        });

        summary += `\n🧾 Tổng tiền: ${tongTien.toLocaleString("vi-VN")}₫`;

        alert(summary);
    });
});