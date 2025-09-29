(async function(){
    const resultsEl = document.getElementById('results');
    const log = (name, ok, detail='') => {
        const div = document.createElement('div');
        div.className = 'case ' + (ok ? 'pass' : 'fail');
        div.textContent = (ok ? '✓ ' : '✗ ') + name + (detail ? ' - ' + detail : '');
        resultsEl.appendChild(div);
    };

    try {
        // 备份现有数据
        const snapshot = await DB.getAllExperts();

        // 初始化
        await DB.initDB();
        let experts = await DB.getAllExperts();
        log('initDB should create initial records', experts.length === 5, 'count=' + experts.length);

        // addExpert
        const newExpert = { zjno:'zj100', zjname:'测试A', zjsfno:'123456789012345678', zjphone:'13800000000', zjemail:'a@test.com', zjdw:'测试单位', zjbz:'备注', zjsc:'内部专家', zjzd:'否' };
        await DB.addExpert(newExpert);
        experts = await DB.getAllExperts();
        log('addExpert should increase count', experts.length === 6);

        // updateExpert
        newExpert.zjemail = 'updated@test.com';
        await DB.updateExpert(newExpert);
        const updated = (await DB.getAllExperts()).find(e => e.zjno === 'zj100');
        log('updateExpert should change fields', updated && updated.zjemail === 'updated@test.com');

        // queryExperts by zjsc
        const internal = await DB.queryExperts({ zjsc: '内部专家' });
        const external = await DB.queryExperts({ zjsc: '外部专家' });
        log('queryExperts should filter by zjsc', internal.every(e => e.zjsc==='内部专家') && external.every(e => e.zjsc==='外部专家'));

        // queryExperts by keyword
        const kw = await DB.queryExperts({ keyword: '测试单位' });
        log('queryExperts should filter by keyword', kw.some(e => e.zjdw==='测试单位'));

        // setDesignatedExpert
        await DB.setDesignatedExpert('zj100');
        const des = await DB.getDesignatedExpert();
        log('setDesignatedExpert should mark one expert', des && des.zjno === 'zj100');

        // cancel designated by updateExpert
        des.zjzd = '否';
        await DB.updateExpert(des);
        const des2 = await DB.getDesignatedExpert();
        log('getDesignatedExpert should be null after cancel', !des2);

        // 导出 Excel（不可自动验证下载，至少不抛错）
        try {
            const list = await DB.getAllExperts();
            DB.exportToExcel(list, 'test_export');
            log('exportToExcel should not throw', true);
        } catch(e) {
            log('exportToExcel should not throw', false, e.message);
        }

        // 恢复数据
        await DB.importFromJSON(snapshot);
        const restored = await DB.getAllExperts();
        log('importFromJSON should restore snapshot', Array.isArray(restored) && restored.length === snapshot.length);
    } catch (e) {
        log('Tests crashed', false, e.message);
        console.error(e);
    }
})();