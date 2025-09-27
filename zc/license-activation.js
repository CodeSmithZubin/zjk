/**
 * 离线注册机_许可激活页脚本
 * 处理许可证上传、内容粘贴和激活验证功能
 */

document.addEventListener('DOMContentLoaded', function() {
    // 页面加载时初始化
    initPage();
    
    // 绑定事件
    bindEvents();
});

/**
 * 初始化页面
 */
function initPage() {
    // 显示机器码
    displayMachineCode();
}

/**
 * 绑定页面所有事件
 */
function bindEvents() {
    // 文件上传事件
    document.getElementById('license-file').addEventListener('change', handleFileUpload);
    
    // 激活按钮事件
    document.getElementById('activate-btn').addEventListener('click', activateLicense);
    
    // 清空按钮事件
    document.getElementById('clear-btn').addEventListener('click', clearForm);
    
    // 返回按钮事件
    document.getElementById('back-btn').addEventListener('click', function() {
        window.location.href = 'registration-view.html';
    });
    
    // 刷新机器码按钮事件
    document.getElementById('refresh-machine-code').addEventListener('click', function() {
        // 重新生成机器码
        localStorage.removeItem('machineCode');
        displayMachineCode();
        showDialog('提示', '机器码已刷新', [{ text: '确定', action: () => {} }]);
    });
}

/**
 * 显示机器码
 */
function displayMachineCode() {
    try {
        // 尝试从本地存储获取机器码
        let machineCode = localStorage.getItem('machineCode');
        
        // 如果本地没有，生成新的机器码
        if (!machineCode) {
            machineCode = CryptoUtils.generateMachineCode();
            localStorage.setItem('machineCode', machineCode);
        }
        
        document.getElementById('machine-code').textContent = machineCode;
    } catch (e) {
        console.error('获取机器码失败:', e);
        document.getElementById('machine-code').textContent = '获取失败';
        showDialog('错误', '获取机器码失败: ' + e.message, [{ text: '确定', action: () => {} }]);
    }
}

/**
 * 处理许可证文件上传
 */
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 验证文件类型
    if (file.name.split('.').pop().toLowerCase() !== 'lic') {
        showDialog('错误', '请上传.lic格式的许可证文件', [{ text: '确定', action: () => {} }]);
        return;
    }
    
    // 读取文件内容
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('license-content').value = e.target.result;
    };
    reader.onerror = function() {
        showDialog('错误', '读取文件失败，请重试', [{ text: '确定', action: () => {} }]);
    };
    reader.readAsText(file);
}

/**
 * 激活许可证
 */
function activateLicense() {
    // 获取机器码
    const machineCode = document.getElementById('machine-code').textContent;
    if (machineCode === '获取失败' || machineCode === '加载中...') {
        showDialog('错误', '无法获取有效的机器码，请刷新后重试', [{ text: '确定', action: () => {} }]);
        return;
    }
    
    // 获取许可证内容
    const licenseContent = document.getElementById('license-content').value.trim();
    if (!licenseContent) {
        showDialog('错误', '请上传许可证文件或粘贴许可证内容', [{ text: '确定', action: () => {} }]);
        return;
    }
    
    try {
        // 验证许可证
        const validationResult = LicenseUtils.validateLicense(licenseContent, machineCode);
        
        // 显示激活结果
        const resultEl = document.getElementById('activation-result');
        const messageEl = document.getElementById('result-message');
        const infoEl = document.getElementById('license-info');
        
        resultEl.style.display = 'block';
        
        if (validationResult.valid) {
            // 激活成功
            messageEl.textContent = '激活成功';
            messageEl.style.color = 'green';
            
            // 保存许可证
            LicenseUtils.saveLicense(validationResult.license);
            
            // 显示许可证信息
            displayLicenseInfo(validationResult.license, infoEl);
            
            // 提示用户
            showDialog('成功', '许可证激活成功', [{
                text: '确定', 
                action: () => {
                    // 关闭对话框后刷新父页面（如果是从注册信息页打开的）
                    if (window.opener && !window.opener.closed) {
                        window.opener.location.reload();
                    }
                    window.location.href = 'registration-view.html';
                }
            }]);
        } else {
            // 激活失败
            messageEl.textContent = '激活失败: ' + validationResult.message;
            messageEl.style.color = 'red';
            infoEl.innerHTML = '';
            
            showDialog('失败', '激活失败: ' + validationResult.message, [{ text: '确定', action: () => {} }]);
        }
    } catch (e) {
        console.error('激活过程出错:', e);
        showDialog('错误', '激活过程中发生错误: ' + e.message, [{ text: '确定', action: () => {} }]);
    }
}

/**
 * 显示许可证信息
 * @param {Object} license - 许可证对象
 * @param {HTMLElement} container - 显示容器
 */
function displayLicenseInfo(license, container) {
    let html = '<div class="license-info">';
    html += '<p><strong>授权类型:</strong> ' + (license.authType || '未知') + '</p>';
    html += '<p><strong>授权用户:</strong> ' + (license.authUser || '未知') + '</p>';
    html += '<p><strong>授权到期日:</strong> ' + (license.authType === '永久授权' ? '永久' : (license.expireDate || '未知')) + '</p>';
    html += '<p><strong>授权模块:</strong> ' + (license.authModules && license.authModules.length ? license.authModules.join(', ') : '无') + '</p>';
    html += '<p><strong>许可证生成日期:</strong> ' + (license.generationDate || '未知') + '</p>';
    html += '</div>';
    
    container.innerHTML = html;
}

/**
 * 清空表单内容
 */
function clearForm() {
    document.getElementById('license-file').value = '';
    document.getElementById('license-content').value = '';
    document.getElementById('activation-result').style.display = 'none';
}

/**
 * 处理文件上传
 */
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('license-content').value = e.target.result;
    };
    reader.readAsText(file);
}

/**
 * 显示对话框
 * @param {string} title - 标题
 * @param {string} message - 消息
 * @param {Array} buttons - 按钮配置
 */
function showDialog(title, message, buttons) {
    // 创建对话框
    const dialog = document.createElement('div');
    dialog.className = 'modal';
    
    const dialogContent = document.createElement('div');
    dialogContent.className = 'modal-content';
    
    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => dialog.remove());
    
    // 标题
    const titleEl = document.createElement('h2');
    titleEl.textContent = title;
    
    // 消息
    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    
    // 按钮组
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'button-group';
    buttonGroup.style.justifyContent = 'flex-end';
    
    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.className = 'btn primary-btn';
        button.textContent = btn.text;
        button.addEventListener('click', () => {
            try {
                btn.action();
            } finally {
                dialog.remove();
            }
        });
        buttonGroup.appendChild(button);
    });
    
    // 组装对话框
    dialogContent.appendChild(closeBtn);
    dialogContent.appendChild(titleEl);
    dialogContent.appendChild(messageEl);
    dialogContent.appendChild(buttonGroup);
    dialog.appendChild(dialogContent);
    
    // 添加到页面
    document.body.appendChild(dialog);
}