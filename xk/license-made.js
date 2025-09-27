/**
 * 许可证授权生成页脚本
 * 处理许可证信息录入、生成和管理功能
 */

document.addEventListener('DOMContentLoaded', function() {
    // 初始化页面
    initPage();
    
    // 绑定事件
    bindEvents();
});

/**
 * 初始化页面
 */
function initPage() {
    // 设置默认日期为今天加30天
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    const formattedDate = defaultDate.toISOString().split('T')[0];
    document.getElementById('expire-date').value = formattedDate;
    
    // 检查授权类型，控制到期日显示
    checkAuthType();
    
    // 加载保存的许可证生成历史
    loadLicenseHistory();
}

/**
 * 绑定页面所有事件
 */
function bindEvents() {
    // 授权类型变化事件
    document.getElementById('auth-type').addEventListener('change', checkAuthType);
    
    // 生成许可证按钮
    document.getElementById('generate-btn').addEventListener('click', generateLicense);
    
    // 重置表单按钮
    document.getElementById('reset-form').addEventListener('click', resetForm);
    
    // 复制许可证内容按钮
    document.getElementById('copy-license-content').addEventListener('click', copyLicenseContent);
    
    // 下载许可证文件按钮
    document.getElementById('download-license').addEventListener('click', downloadLicenseFile);
    
    // 许可证管理按钮
    document.getElementById('manage-licenses').addEventListener('click', function() {
        window.open('license-management.html', '_blank');
    });
    
    // 全选模块事件
    document.getElementById('module-all').addEventListener('change', function(e) {
        const isChecked = e.target.checked;
        document.getElementById('module-a1').checked = isChecked;
        document.getElementById('module-a2').checked = isChecked;
        document.getElementById('module-a3').checked = isChecked;
    });
}

/**
 * 检查授权类型，控制到期日显示
 */
function checkAuthType() {
    const authType = document.getElementById('auth-type').value;
    const expireDateGroup = document.getElementById('expire-date-group');
    
    if (authType === '永久授权') {
        expireDateGroup.style.display = 'none';
        document.getElementById('expire-date').required = false;
    } else {
        expireDateGroup.style.display = 'block';
        document.getElementById('expire-date').required = true;
    }
}

/**
 * 生成许可证
 */
function generateLicense() {
    // 获取表单数据
    const machineCode = document.getElementById('machine-code').value.trim();
    const authType = document.getElementById('auth-type').value;
    const authUser = document.getElementById('auth-user').value.trim();
    const expireDate = authType !== '永久授权' ? document.getElementById('expire-date').value : null;
    
    // 验证必填字段
    if (!machineCode || !authUser) {
        showDialog('错误', '请填写所有必填字段', [{ text: '确定', action: () => {} }]);
        return;
    }
    
    // 验证日期
    if (authType !== '永久授权' && (!expireDate || new Date(expireDate) <= new Date())) {
        showDialog('错误', '请选择有效的授权到期日', [{ text: '确定', action: () => {} }]);
        return;
    }
    
    // 获取选中的授权模块
    const authModules = [];
    if (document.getElementById('module-all').checked) authModules.push('all');
    if (document.getElementById('module-a1').checked) authModules.push('a1');
    if (document.getElementById('module-a2').checked) authModules.push('a2');
    if (document.getElementById('module-a3').checked) authModules.push('a3');
    
    if (authModules.length === 0) {
        showDialog('错误', '请至少选择一个授权模块', [{ text: '确定', action: () => {} }]);
        return;
    }
    
    try {
        // 生成许可证数据
        const today = new Date().toISOString().split('T')[0];
        const licenseData = {
            xkid: generateXkid(),
            machineCode: machineCode,
            authType: authType,
            authUser: authUser,
            authModules: authModules,
            issueDate: today,
            generationDate: today,
            // 永久授权不需要到期日
            ...(authType !== '永久授权' && { expireDate: expireDate }),
            // 生成授权验证码
            authVerificationCode: CryptoUtils.generateAuthVerificationCode(machineCode, authUser, today)
        };
        
        // 转换为JSON字符串
        const licenseJson = JSON.stringify(licenseData, null, 2);
        
        // 显示结果区域
        document.getElementById('license-result').style.display = 'block';
        document.getElementById('generated-license-content').value = licenseJson;
        
        // 保存到本地存储
        saveGeneratedLicense(licenseData);
        
        // 显示成功提示
        showDialog('成功', '许可证生成成功', [{ text: '确定', action: () => {} }]);
    } catch (e) {
        console.error('生成许可证失败:', e);
        showDialog('错误', '生成许可证失败: ' + e.message, [{ text: '确定', action: () => {} }]);
    }
}

/**
 * 生成许可证ID
 */
function generateXkid() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let xkid = '';
    for (let i = 0; i < 12; i++) {
        xkid += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return xkid;
}

/**
 * 保存生成的许可证到本地存储
 */
function saveGeneratedLicense(licenseData) {
    try {
        let licenses = JSON.parse(localStorage.getItem('generatedLicenses') || '[]');
        
        // 添加新许可证
        licenses.push({
            ...licenseData,
            generatedTime: new Date().toISOString()
        });
        
        // 保存回本地存储
        localStorage.setItem('generatedLicenses', JSON.stringify(licenses));
    } catch (e) {
        console.error('保存许可证历史失败:', e);
    }
}

/**
 * 加载许可证生成历史
 */
function loadLicenseHistory() {
    try {
        return JSON.parse(localStorage.getItem('generatedLicenses') || '[]');
    } catch (e) {
        console.error('加载许可证历史失败:', e);
        return [];
    }
}

/**
 * 重置表单
 */
function resetForm() {
    document.querySelector('form') ? document.querySelector('form').reset() : null;
    document.getElementById('license-result').style.display = 'none';
    document.getElementById('generated-license-content').value = '';
    
    // 重新设置默认日期
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    const formattedDate = defaultDate.toISOString().split('T')[0];
    document.getElementById('expire-date').value = formattedDate;
    
    // 重新检查授权类型
    checkAuthType();
}

/**
 * 复制许可证内容到剪贴板
 */
function copyLicenseContent() {
    const content = document.getElementById('generated-license-content').value;
    if (!content) {
        showDialog('提示', '没有可复制的许可证内容', [{ text: '确定', action: () => {} }]);
        return;
    }
    
    navigator.clipboard.writeText(content)
        .then(() => {
            showDialog('成功', '许可证内容已复制到剪贴板', [{ text: '确定', action: () => {} }]);
        })
        .catch(err => {
            console.error('复制失败:', err);
            showDialog('失败', '复制许可证内容失败，请手动复制', [{ text: '确定', action: () => {} }]);
        });
}

/**
 * 下载许可证文件
 */
function downloadLicenseFile() {
    const content = document.getElementById('generated-license-content').value;
    if (!content) {
        showDialog('提示', '没有可下载的许可证内容', [{ text: '确定', action: () => {} }]);
        return;
    }
    
    try {
        // 创建Blob对象
        const blob = new Blob([content], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        
        // 创建下载链接
        const a = document.createElement('a');
        a.href = url;
        a.download = `license-${new Date().getTime()}.lic`;
        document.body.appendChild(a);
        a.click();
        
        // 清理
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error('下载许可证失败:', e);
        showDialog('错误', '下载许可证文件失败: ' + e.message, [{ text: '确定', action: () => {} }]);
    }
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
            btn.action();
            dialog.remove();
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