/**
 * 注册授权信息查看页脚本
 * 处理机器码生成、授权信息显示和注册管理功能
 */

document.addEventListener('DOMContentLoaded', function() {
    // 页面加载时初始化
    initPage();

    // 绑定按钮事件
    bindEvents();
});

/**
 * 初始化页面
 */
function initPage() {
    // 生成并显示机器码
    generateAndDisplayMachineCode();
    
    // 加载并显示授权信息
    loadAndDisplayLicenseInfo();
}

/**
 * 绑定页面所有按钮事件
 */
function bindEvents() {
    // 复制机器码按钮
    document.getElementById('copy-machine-code').addEventListener('click', copyMachineCode);
    
    // 重置注册信息按钮
    document.getElementById('reset-registration').addEventListener('click', resetRegistrationInfo);
    
    // 更新信息按钮
    document.getElementById('update-info').addEventListener('click', loadAndDisplayLicenseInfo);
    
    // 返回登录页面按钮
    document.getElementById('back-to-a').addEventListener('click', function() {
        window.location.href = '../index.html';
    });
    
    // 激活许可证按钮
    document.getElementById('activate-license').addEventListener('click', function() {
        window.open('license-activation.html', '_blank', 'width=800,height=600');
    });
}

/**
 * 生成并显示机器码
 */
function generateAndDisplayMachineCode() {
    try {
        const machineCode = CryptoUtils.generateMachineCode();
        document.getElementById('machine-code').textContent = machineCode;
        
        // 保存机器码到本地存储
        localStorage.setItem('machineCode', machineCode);
    } catch (e) {
        console.error('生成机器码失败:', e);
        document.getElementById('machine-code').textContent = '生成失败';
        showDialog('错误', '生成机器码失败: ' + e.message, [{ text: '确定', action: () => {} }]);
    }
}

/**
 * 加载并显示授权信息
 */
function loadAndDisplayLicenseInfo() {
    const license = LicenseUtils.getLicense();
    const lastUpdate = localStorage.getItem('lastUpdateTime');
    const statusEl = document.getElementById('auth-status');
    const typeEl = document.getElementById('auth-type');
    const userEl = document.getElementById('auth-user');
    const expireEl = document.getElementById('expire-date');
    const daysEl = document.getElementById('days-remaining');
    const modulesEl = document.getElementById('auth-modules');
    const updateEl = document.getElementById('last-update');

    // 更新最后更新时间
    updateEl.textContent = lastUpdate ? new Date(lastUpdate).toLocaleString() : '从未更新';

    if (!license) {
        // 未授权状态
        statusEl.textContent = '未授权';
        typeEl.textContent = '-';
        userEl.textContent = '-';
        expireEl.textContent = '-';
        daysEl.textContent = '-';
        modulesEl.textContent = '-';
        return;
    }

    // 检查许可证状态
    const status = LicenseUtils.checkLicenseStatus();
    statusEl.textContent = status.status;
    typeEl.textContent = license.authType || '-';
    userEl.textContent = license.authUser || '-';
    modulesEl.textContent = license.authModules ? license.authModules.join(', ') : '-';

    // 处理授权日期显示
    if (license.authType === '永久授权') {
        expireEl.textContent = '永久';
        daysEl.textContent = '无限';
    } else {
        expireEl.textContent = license.expireDate || '-';
        daysEl.textContent = status.daysRemaining >= 0 ? status.daysRemaining : '已过期';
    }
}

/**
 * 复制机器码到剪贴板
 */
function copyMachineCode() {
    const machineCode = document.getElementById('machine-code').textContent;
    
    if (machineCode === '生成失败' || machineCode === '加载中...') {
        showDialog('提示', '没有可复制的机器码', [{ text: '确定', action: () => {} }]);
        return;
    }
    
    navigator.clipboard.writeText(machineCode)
        .then(() => {
            showDialog('成功', '机器码已复制到剪贴板', [{ text: '确定', action: () => {} }]);
        })
        .catch(err => {
            console.error('复制失败:', err);
            showDialog('失败', '复制机器码失败，请手动复制', [{ text: '确定', action: () => {} }]);
        });
}

/**
 * 重置注册信息
 */
function resetRegistrationInfo() {
    showDialog(
        '确认重置',
        '确定要重置注册信息吗？这将清除所有授权数据并恢复初始状态。',
        [
            { text: '取消', action: () => {} },
            { text: '确定', action: () => {
                LicenseUtils.clearLicense();
                loadAndDisplayLicenseInfo();
                showDialog('成功', '注册信息已重置', [{ text: '确定', action: () => {} }]);
            }}
        ]
    );
}

/**
 * 创建并显示对话框
 * @param {string} title - 标题
 * @param {string} message - 消息内容
 * @param {Array} buttons - 按钮配置数组
 */
function showDialog(title, message, buttons) {
    const dialog = createDialog(title, message, buttons);
    document.body.appendChild(dialog);
}

/**
 * 创建对话框元素
 * @param {string} title - 标题
 * @param {string} message - 消息内容
 * @param {Array} buttons - 按钮配置数组
 * @returns {HTMLElement} 对话框元素
 */
function createDialog(title, message, buttons) {
    const dialog = document.createElement('div');
    dialog.className = 'modal';
    
    const content = document.createElement('div');
    content.className = 'modal-content';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => dialog.remove());
    
    const titleEl = document.createElement('h2');
    titleEl.textContent = title;
    
    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'button-group';
    buttonGroup.style.justifyContent = 'flex-end';

    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.className = 'btn primary-btn';
        button.textContent = btn.text;
        button.addEventListener('click', () => {
            btn.action();
            dialog.remove();
        });
        buttonGroup.appendChild(button);
    });

    content.appendChild(closeBtn);
    content.appendChild(titleEl);
    content.appendChild(messageEl);
    content.appendChild(buttonGroup);
    dialog.appendChild(content);

    return dialog;
}