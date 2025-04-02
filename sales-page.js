// 初始化购物车
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function addToCart(productName, price, image) {
    // 查找商品是否已在购物车中
    let existingItem = cart.find(item => item.productName === productName);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ productName, price, quantity: 1, image });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    document.getElementById('success-message').textContent = '加购成功！';
    setTimeout(() => {
        document.getElementById('success-message').textContent = '';
    }, 2000);
    displayCart();
}

function checkout() {
    if (cart.length === 0) {
        alert('购物车为空，无法结算');
        return;
    }
    // 保存购物车数据到 localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    alert('正在跳转到结算页面...');
    // 跳转到付款页面
    window.location.href = '../caa.html';
}

