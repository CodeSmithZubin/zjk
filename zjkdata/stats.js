document.addEventListener('DOMContentLoaded', async function() {
    // 菜单与登录校验
    if (!checkLoginStatus()) return;
    // 统一由 zjk.js 初始化菜单
    initMobileMenu();

    try {
        window.__ALL_EXPERTS__ = await DB.getAllExperts();
        window.__DESIGNATED__ = await DB.getDesignatedExpert();

        bindFilterEvents();
        updateAll();
    } catch (err) {
        showMessage('加载统计数据失败: ' + err.message, true);
        console.error(err);
    }
});

function byId(id){ return document.getElementById(id); }

function bindFilterEvents() {
    const affSel = byId('affiliationFilter');
    const kwInput = byId('keyword');
    const applyBtn = byId('applyFilter');
    const resetBtn = byId('resetFilter');
    const seedBtn = byId('seedDataBtn');

    // 应用筛选
    applyBtn.addEventListener('click', updateAll);
    // 回车快速筛选
    kwInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') updateAll(); });
    // 重置筛选
    resetBtn.addEventListener('click', ()=>{
        affSel.value = 'all';
        kwInput.value = '';
        updateAll();
    });

    // 生成测试数据
    if (seedBtn) {
        seedBtn.addEventListener('click', handleSeedData);
    }
}

function applyFilters(experts) {
    const affVal = (byId('affiliationFilter').value || 'all').trim();
    const kw = (byId('keyword').value || '').trim().toLowerCase();
    return experts.filter(e => {
        if (affVal === 'internal' && e.zjsc !== '内部专家') return false;
        if (affVal === 'external' && e.zjsc !== '外部专家') return false;
        if (kw) {
            const values = Object.values(e).map(v => (v==null? '' : String(v)).toLowerCase());
            if (!values.some(v => v.includes(kw))) return false;
        }
        return true;
    });
}

function updateAll() {
    const expertsAll = window.__ALL_EXPERTS__ || [];
    const filtered = applyFilters(expertsAll);

    // 统计卡片
    const internalCount = filtered.filter(e => e.zjsc === '内部专家').length;
    const externalCount = filtered.filter(e => e.zjsc === '外部专家').length;
    const unitCount = new Set(filtered.map(e => e.zjdw || '未填写单位')).size;
    const completenessRatio = calcCompleteness(filtered);

    byId('totalCount').textContent = filtered.length;
    byId('internalCount').textContent = internalCount;
    byId('externalCount').textContent = externalCount;
    byId('designatedStatus').textContent = window.__DESIGNATED__ ? window.__DESIGNATED__.zjname : '无';
    byId('unitCount').textContent = unitCount;
    byId('dataCompleteness').textContent = `${Math.round(completenessRatio*100)}%`;

    // 图表
    renderDonut(byId('donutChart'), internalCount, externalCount);
    renderBarTopUnits(byId('barChart'), filtered);
}

function calcCompleteness(experts) {
    if (!experts.length) return 0;
    let ok = 0;
    for (const e of experts) {
        if (validatePhone(e.zjphone) && validateEmail(e.zjemail)) ok++;
    }
    return ok / experts.length;
}

function randomPick(arr) { return arr[Math.floor(Math.random()*arr.length)]; }

function buildMockExperts(count = 150) {
    const surnames = ['张','李','王','赵','刘','陈','杨','黄','吴','周','徐','孙','马','朱','胡','郭','何','高','林','罗'];
    const givenNames = ['伟','芳','娜','敏','静','秀英','丽','强','磊','军','洋','勇','杰','娟','涛','明','超','艳','峰','霞'];
    const units = ['智达科技','山西大学','西安电子科技大学','北京理工大学','清华大学','阿里云','华为海思','腾讯研究院','百度研究院','字节跳动','微软亚洲研究院','国家电网','中国移动','中国联通','华中科技大学','哈尔滨工业大学','浙江大学','南京大学','中科院自动化所','中科院计算所'];
    const degrees = ['本科','硕士','博士','高级工程师','研究员','讲师','副教授','教授','架构师','产品经理'];

    const experts = [];
    for (let i = 0; i < count; i++) {
        const surname = randomPick(surnames);
        const given = randomPick(givenNames);
        const name = surname + given + (Math.random() < 0.2 ? '伟' : '');
        const zjsc = Math.random() < 0.6 ? '内部专家' : '外部专家';
        const unit = randomPick(units);
        const degree = randomPick(degrees);
        const phone = '1' + (3 + Math.floor(Math.random()*7)) + String(Math.floor(Math.random()*1e9)).padStart(9,'0');
        const email = `user${i+1}@example.com`;
        const id = String(Math.floor(Math.random()*1e17)).padStart(18,'0');
        experts.push({
            zjno: `zj${String(i+1).padStart(3,'0')}`,
            zjname: name,
            zjsfno: id,
            zjphone: phone,
            zjemail: email,
            zjdw: unit,
            zjbz: degree,
            zjsc: zjsc,
            zjzd: '否'
        });
    }
    return experts;
}

async function handleSeedData() {
    try {
        const experts = buildMockExperts(150);
        await DB.importFromJSON(experts);
        window.__ALL_EXPERTS__ = await DB.getAllExperts();
        window.__DESIGNATED__ = await DB.getDesignatedExpert();
        showMessage('已生成150条测试数据');
        updateAll();
    } catch (err) {
        showMessage('生成测试数据失败: ' + err.message, true);
        console.error(err);
    }
}

function renderDonut(svg, internal, external) {
    const total = internal + external;
    const cx = 200, cy = 160, r = 90, thickness = 30;
    svg.innerHTML = '';

    const mkArc = (startAngle, endAngle, color) => {
        const toXY = angle => [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
        const toXYInner = angle => [cx + Math.cos(angle) * (r - thickness), cy + Math.sin(angle) * (r - thickness)];
        const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
        const [sx, sy] = toXY(startAngle);
        const [ex, ey] = toXY(endAngle);
        const [sxi, syi] = toXYInner(endAngle);
        const [exi, eyi] = toXYInner(startAngle);
        const path = `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey} L ${sxi} ${syi} A ${r-thickness} ${r-thickness} 0 ${largeArc} 0 ${exi} ${eyi} Z`;
        const p = document.createElementNS('http://www.w3.org/2000/svg','path');
        p.setAttribute('d', path);
        p.setAttribute('fill', color);
        return p;
    };

    const start = -Math.PI/2;
    const internalAngle = total ? (internal / total) * Math.PI*2 : 0;
    const externalAngle = total ? (external / total) * Math.PI*2 : 0;
    svg.appendChild(mkArc(start, start + internalAngle, '#3498db'));
    svg.appendChild(mkArc(start + internalAngle, start + internalAngle + externalAngle, '#e67e22'));

    // 标签
    const label = document.createElementNS('http://www.w3.org/2000/svg','text');
    label.setAttribute('x', cx);
    label.setAttribute('y', cy);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('dominant-baseline', 'middle');
    label.setAttribute('font-size', '16');
    label.textContent = `内部:${internal} 外部:${external}`;
    svg.appendChild(label);
}

function renderBarTopUnits(svg, experts) {
    svg.innerHTML = '';
    const counts = {};
    for (const e of experts) {
        const key = e.zjdw || '未填写单位';
        counts[key] = (counts[key] || 0) + 1;
    }
    const arr = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, 10);

    const width = 800, height = 320, left = 150, right = 20, top = 20, bottom = 20;
    const barAreaWidth = width - left - right;
    const barHeight = (height - top - bottom) / arr.length - 8;
    const maxVal = Math.max(1, ...arr.map(a => a[1]));

    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    arr.forEach((item, idx) => {
        const [label, value] = item;
        const y = top + idx * (barHeight + 8) + 4;
        const barW = barAreaWidth * (value / maxVal);

        const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
        rect.setAttribute('x', left);
        rect.setAttribute('y', y);
        rect.setAttribute('width', barW);
        rect.setAttribute('height', barHeight);
        rect.setAttribute('fill', '#2ecc71');
        svg.appendChild(rect);

        const textLabel = document.createElementNS('http://www.w3.org/2000/svg','text');
        textLabel.setAttribute('x', 8);
        textLabel.setAttribute('y', y + barHeight/2);
        textLabel.setAttribute('dominant-baseline', 'middle');
        textLabel.setAttribute('class', 'bar-label');
        textLabel.textContent = label.length > 22 ? label.slice(0,22) + '…' : label;
        svg.appendChild(textLabel);

        const textVal = document.createElementNS('http://www.w3.org/2000/svg','text');
        textVal.setAttribute('x', left + barW + 8);
        textVal.setAttribute('y', y + barHeight/2);
        textVal.setAttribute('dominant-baseline', 'middle');
        textVal.setAttribute('class', 'bar-value');
        textVal.textContent = value;
        svg.appendChild(textVal);
    });
}