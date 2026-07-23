document.addEventListener("DOMContentLoaded", function () {
    checkLogin();
});

function register() {
    const username = document.getElementById("reg-username").value.trim();
    const password = document.getElementById("reg-password").value.trim();

    if (!username || !password) {
        alert("Vui lòng nhập đầy đủ thông tin.");
        return;
    }

    let users = JSON.parse(localStorage.getItem("users")) || [];
    const exists = users.some(u => u.username === username);

    if (exists) {
        alert("Tên đăng nhập đã tồn tại.");
        return;
    }

    users.push({ username, password });
    localStorage.setItem("users", JSON.stringify(users));
    alert("Đăng ký thành công! Hãy đăng nhập.");
}

function login() {
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value.trim();

    let users = JSON.parse(localStorage.getItem("users")) || [];
    const matched = users.find(u => u.username === username && u.password === password);

    if (matched) {
        localStorage.setItem("currentUser", JSON.stringify(matched));
        alert("Đăng nhập thành công!");
        window.location.href = "http://127.0.0.1:5500/HTML_CSS/DoLa_Bakery/Pages/Trang-Chu.html"; // hoặc trang bạn muốn chuyển đến
    } else {
        alert("Sai tên đăng nhập hoặc mật khẩu.");
    }
}

function logout() {
    localStorage.removeItem("currentUser");
    alert("Đã đăng xuất.");
    checkLogin();
}

function checkLogin() {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    const loginForm = document.querySelector(".login-form");
    const registerForm = document.querySelector(".register-form");
    const authInfo = document.querySelector(".auth-info");

    if (user) {
        loginForm.style.display = "none";
        registerForm.style.display = "none";
        authInfo.style.display = "block";
        document.getElementById("auth-username").textContent = user.username;
    } else {
        loginForm.style.display = "block";
        registerForm.style.display = "block";
        authInfo.style.display = "none";
    }
}