/**
 * 页面通用初始化：登录校验、菜单与移动端切换初始化。
 */
document.addEventListener('DOMContentLoaded', function() {
    // 检查登录状态
    checkLoginStatus();
    // 初始化菜单
    initMenu();
    // 初始化移动端菜单切换
    initMobileMenu();
});

// 检查登录状态，如果未登录则跳转至登录页
/**
 * 检查登录状态，未登录则跳转登录页。
 * @returns {boolean} 已登录返回 true，未登录返回 false
 */
function checkLoginStatus() {
    if (!localStorage.getItem('isLoggedIn')) {
        window.location.href = '../index.html';
        return false;
    }
    return true;
}

// 根据用户角色初始化菜单
/**
 * 根据用户角色初始化顶部导航菜单（幂等）。
 * 会在每次调用前清空菜单，避免重复渲染。
 */
function initMenu() {
    const navMenu = document.getElementById('navMenu');
    if (!navMenu) return;

    // 防重复：每次初始化前清空菜单内容
    navMenu.innerHTML = '';

    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    let menuItems = [];

    // 根据角色生成不同菜单
    switch(role) {
        case 'admin':
            menuItems = [
                { name: '主页', url: 'home.html' },
                { name: '专家库', url: 'expert.html' },
                { name: '指定专家', url: 'designated.html' },
                { name: '专家组名单', url: 'group.html' },
                { name: '数据统计', url: 'stats.html' }
            ];
            break;
        case 'maintainer':
            menuItems = [
                { name: '主页', url: 'home.html' },
                { name: '专家库', url: 'expert.html' },
                { name: '专家组名单', url: 'group.html' },
                { name: '数据统计', url: 'stats.html' }
            ];
            break;
        case 'expert':
            menuItems = [
                { name: '主页', url: 'home.html' },
                { name: '专家组名单', url: 'group.html' }
            ];
            break;
        default:
            // 未知角色，退出登录
            logout();
            return;
    }

    // 添加菜单项
    menuItems.forEach(item => {
        const li = document.createElement('li');
        li.className = 'nav-item';
        li.innerHTML = `<a href="${item.url}" class="nav-link">${item.name}</a>`;
        navMenu.appendChild(li);
    });

    // 添加用户信息和退出按钮
    const userInfo = document.createElement('li');
    userInfo.className = 'nav-item';
    userInfo.innerHTML = `<span class="nav-link">欢迎, ${username}</span>`;
    navMenu.appendChild(userInfo);

    const logoutItem = document.createElement('li');
    logoutItem.className = 'nav-item';
    logoutItem.innerHTML = `<a href="javascript:logout()" class="nav-link">退出登录</a>`;
    navMenu.appendChild(logoutItem);
}

// 初始化移动端菜单切换
/**
 * 初始化移动端菜单切换（防重复绑定）。
 */
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    if (menuToggle && navMenu) {
        // 防重复绑定：若已绑定过，则直接返回
        if (menuToggle.dataset.bound === '1') return;
        menuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
        menuToggle.dataset.bound = '1';
    }
}

// 退出登录
/**
 * 退出登录并跳转登录页。
 */
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    window.location.href = '../index.html';
}

// 通用工具函数 - 显示消息提示
/**
 * 显示全局消息提示。
 * @param {string} message 文本消息
 * @param {boolean} [isError=false] 是否为错误消息
 */
function showMessage(message, isError = false) {
    const messageEl = document.createElement('div');
    messageEl.className = isError ? 'error-message' : 'success-message';
    messageEl.textContent = message;
    messageEl.style.position = 'fixed';
    messageEl.style.top = '20px';
    messageEl.style.left = '50%';
    messageEl.style.transform = 'translateX(-50%)';
    messageEl.style.padding = '10px 20px';
    messageEl.style.borderRadius = '4px';
    messageEl.style.color = 'white';
    messageEl.style.backgroundColor = isError ? '#e74c3c' : '#2ecc71';
    messageEl.style.zIndex = '1000';

    document.body.appendChild(messageEl);

    setTimeout(() => {
        messageEl.remove();
    }, 3000);
}

// 通用工具函数 - 验证身份证格式
/**
 * 验证身份证格式（15/18位，支持末位 X）。
 * @param {string} id 身份证号
 * @returns {boolean} 是否有效
 */
function validateIdCard(id) {
    const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    return reg.test(id);
}

// 通用工具函数 - 验证手机号格式
/**
 * 验证手机号格式（大陆手机号段）。
 * @param {string} phone 手机号
 * @returns {boolean} 是否有效
 */
function validatePhone(phone) {
    const reg = /^1[3-9]\d{9}$/;
    return reg.test(phone);
}

// 通用工具函数 - 验证邮箱格式
/**
 * 验证邮箱格式。
 * @param {string} email 邮箱
 * @returns {boolean} 是否有效
 */
function validateEmail(email) {
    const reg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return reg.test(email);
}

// 通用工具函数 - 获取当前日期时间字符串
/**
 * 获取当前日期时间字符串（ISO 精简格式）。
 * @returns {string} 形如 2025-09-29_16-00-00 的字符串
 */
function getCurrentDateTime() {
    const now = new Date();
    return now.toISOString().replace(/T/, '_').replace(/:/g, '-').replace(/\..+/, '');
}