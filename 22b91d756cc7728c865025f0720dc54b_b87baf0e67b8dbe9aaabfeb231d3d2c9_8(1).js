function checkout() {
    if (cartItems.length === 0) {
        alert('购物车为空，无法结算');
        return;
    }
    alert('正在跳转到结算页面...');
    window.location.href = 'caa.html'; // 跳转到付款页面
}