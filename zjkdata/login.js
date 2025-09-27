document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const viewRegistrationBtn = document.getElementById('view-registration-btn');


    // 绑定按钮点击事件
    viewRegistrationBtn.addEventListener('click', openRegistrationView);
    /**
     * 打开注册信息视图-注册授权信息_查看页
     */
    function openRegistrationView() {
        window.open('zc/registration-view.html');
    }

    // 预定义用户角色信息
    const users = {
        'zjk_admin': { password: 'zjk_admin', role: 'admin' },
        'zjk_wh': { password: 'zjk_wh', role: 'maintainer' },
        'zjk': { password: 'zjk', role: 'expert' }
    };

    // 检查是否已登录，已登录则跳转主页
    if (localStorage.getItem('isLoggedIn')) {
        window.location.href = 'zjkdata/home.html';
        return;
    }

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 优先检查授权状态
        const licenseStatus = LicenseUtils.checkLicenseStatus();
        
        if (licenseStatus.isAuthorized) {
            if (licenseStatus.authType === '永久授权' || licenseStatus.daysRemaining > 7) {
                // 授权正常，执行登录验证
                performLoginValidation();
            } else {
                showExpiringSoonDialog(licenseStatus.daysRemaining);
            }
        } else {
            licenseStatus.status === '未授权' ? showUnauthorizedDialog() : showExpiredDialog();
        }
    });

    function showExpiringSoonDialog(daysRemaining) {
    const dialog = createDialog(
        '授权临期提醒',
        `授权已临期，剩余${daysRemaining}天，请及时更新注册授权许可信息`,
        [
            { text: '查看注册信息', action: () => { window.open('zc/registration-view.html'); dialog.remove(); } },
            { text: '关闭', action: () => { dialog.remove(); performLoginValidation(); } }
        ]
    );
    document.body.appendChild(dialog);
    dialog.showModal();
    }

    function showUnauthorizedDialog() {
        const dialog = createDialog(
            '未授权',
            '系统尚未授权，请及时注册与激活授权许可信息，否则无法正常使用系统',
            [
                { text: '查看注册信息', action: () => { window.open('zc/registration-view.html'); dialog.remove(); } },
                { text: '关闭', action: () => { dialog.remove(); } }
            ]
        );
        document.body.appendChild(dialog);
        dialog.showModal();
    }

    function performLoginValidation() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const errorMessage = document.getElementById('errorMessage');

        if (users.hasOwnProperty(username) && users[username].password === password) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', username);
            localStorage.setItem('role', users[username].role);
            window.location.href = 'zjkdata/home.html';
        } else {
            const dialog = createDialog(
    '登录错误',
    '用户名或密码错误，请重新输入',
    [{ text: '关闭', action: (dialog) => dialog.remove() }]
);
document.body.appendChild(dialog);
dialog.showModal();
        }
    }

    function showExpiredDialog() {
        const dialog = createDialog(
            '授权已过期',
            '系统授权已过期，请及时更新注册授权许可信息，否则无法正常使用系统',
            [
                { text: '查看注册信息', action: () => { window.open('zc/registration-view.html'); dialog.close(); } },
                { text: '关闭', action: () => { dialog.close(); } }
            ]
        );
        document.body.appendChild(dialog);
        dialog.showModal();
    }


    function createDialog(title, message, buttons) {
        const dialog = document.createElement('dialog');
        dialog.className = 'modal';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-btn';
        closeBtn.ariaLabel = '关闭';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => dialog.close());
        
        const titleElement = document.createElement('h2');
        titleElement.textContent = title;
        
        const messageElement = document.createElement('p');
        messageElement.textContent = message;
        
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'button-group';
        
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = 'dialog-btn';
            button.textContent = btn.text;
            const dialogRef = dialog;
              button.addEventListener('click', () => btn.action(dialog));
            buttonGroup.appendChild(button);
        });
        
        modalContent.appendChild(closeBtn);
        modalContent.appendChild(titleElement);
        modalContent.appendChild(messageElement);
        modalContent.appendChild(buttonGroup);
        dialog.appendChild(modalContent);
        
        return dialog;
    }
});