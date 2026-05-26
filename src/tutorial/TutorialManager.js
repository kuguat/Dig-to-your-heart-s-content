/**
 * TutorialManager — 教程状态机
 * 管理所有三层教程的触发、流程和标记
 */
class TutorialManager {
    constructor(scene) {
        this.scene = scene;
        this.state = scene.state;
        this.saveManager = scene.saveManager;
        this.tutorialUI = new TutorialUI(scene);
        this.currentBasicStep = 0; // 0=未开始, 1-8=步骤编号
    }

    /** 获取标记 */
    flag(key) {
        return this.state.tutorialFlags && this.state.tutorialFlags[key];
    }

    /** 设置标记并保存 */
    setFlag(key, value) {
        if (this.state.tutorialFlags) {
            this.state.tutorialFlags[key] = value;
            this.saveManager.savePermanent();
        }
    }

    /** 保存永久存档（教程完成后调用） */
    _save() {
        this.saveManager.savePermanent();
    }

    // ═══════════════════════════════════════════════
    //  第一层：入门必修（8步，不可跳过）
    // ═══════════════════════════════════════════════

    /** 检查是否需要启动入门教程 */
    shouldStartBasic() {
        return !this.flag('basic_complete');
    }

    /** 启动入门教程 */
    startBasic() {
        if (!this.shouldStartBasic()) return;
        this.currentBasicStep = 1;
        this._step1_welcome();
    }

    // ── Step 1: 欢迎 ──
    _step1_welcome() {
        this.tutorialUI.show(
            '欢迎来到考古队，小伙子！我是老陈，干了三十年考古了。\n来，先认认咱们的工作台。',
            null,
            { onNext: () => this._step2_topbar() }
        );
    }

    // ── Step 2: 顶栏认知 ──
    _step2_topbar() {
        const w = this.scene.config.width;
        this.tutorialUI.hide();
        this.tutorialUI.show(
            '顶上左侧是咱们的家底：声望等级、基金点、资金。发掘次数和发现的文物也在这儿。',
            { x: 10, y: 2, width: 520, height: 68 },
            { onNext: () => this._step3_eras() }
        );
    }

    // ── Step 3: 朝代按钮（Header 右侧，x 从 540 开始） ──
    _step3_eras() {
        const w = this.scene.config.width;
        this.tutorialUI.hide();
        this.tutorialUI.show(
            '右边这一排是各个时代的遗址入口。目前你从新石器时代开始，往后的商周、秦汉……越往后出土的文物越值钱，但赝品也多。点击一个试试切换时代。',
            { x: 530, y: 2, width: w - 540, height: 68 },
            { onNext: () => this._step4_excavate() }
        );
    }

    // ── Step 4: 首次发掘（等待玩家点击） ──
    _step4_excavate() {
        const w = this.scene.config.width;
        const ex = this.scene.config.excavation;
        this.tutorialUI.hide();
        // 设置标记，让 MainScene 知道当前等待点击发掘区
        window._tutorialWaitingClick = true;
        // noMask 模式：不创建遮罩，不拦截任何点击，只显示提示气泡
        this.tutorialUI.show(
            '来，点一下下面的层位按钮，咱们挖一铲子试试！',
            null,
            { onNext: () => {}, noMask: true, forceBubbleY: 72 }
        );
        if (this.tutorialUI._nextBtn) this.tutorialUI._nextBtn.setVisible(false);
        if (this.tutorialUI._btnGfx) this.tutorialUI._btnGfx.setVisible(false);
        this.currentBasicStep = 4;
    }

    /** 由 MainScene 调用：玩家点击了发掘区 */
    onExcavationClicked() {
        if (this.currentBasicStep === 4) {
            window._tutorialWaitingClick = false;
            this.tutorialUI.hide();
            window._tutorialPendingStep = 5;
            // 让 MainScene 自行执行发掘逻辑（打开 ExcavationScene）
            // 返回 true 表示正常进入发掘
            return true;
        }
        return true; // 非教程状态，正常通过
    }

    // ── Step 5: 刮土教学（发掘开始后触发） ──
    /** 在发掘开始后调用 */
    showStep5_excavateGuide(scene) {
        if (window._tutorialPendingStep !== 5 && this.currentBasicStep !== 4) return;
        window._tutorialPendingStep = 6; // 推进到步骤6
        this.currentBasicStep = 5;

        const ex = scene.config.excavation;
        // 使用当前场景创建 TutorialUI，高亮发掘区域
        this.tutorialUI = new TutorialUI(scene);
        this.scene = scene;
        this.tutorialUI.show(
            '按住鼠标在土上面拖——像用刷子清扫文物表面一样。\n把土层刮开，底下的东西就露出来了。',
            { x: ex.x - 4, y: ex.y - 4, width: ex.width + 8, height: ex.height + 8 },
            { onNext: () => {
                this.tutorialUI.hide();
            }}
        );
    }

    // ── Step 6: 鉴定结果（在 MainScene 发掘完成弹窗出现后触发） ──
    /** 在发掘结果弹窗出现后调用，需传入 MainScene 引用 */
    showStep6_appraisal(mainScene) {
        if (window._tutorialPendingStep !== 6) return;
        window._tutorialPendingStep = 0; // 清除
        this.currentBasicStep = 6;

        // 切回主场景（Step5 在 ExcavationScene，现已返回 MainScene）
        if (mainScene) this.scene = mainScene;

        // 先清理上一步(Step5)的 UI，避免残留
        this.tutorialUI.hide();
        this.tutorialUI = new TutorialUI(this.scene);

        const w = this.scene.config.width;
        const h = this.scene.config.height;
        // 鉴定弹窗面板: pw=500, ph=520(有图标)/450(无图标), 居中
        const pw = 500, ph = 520, px = (w - pw) / 2, py = (h - ph) / 2;
        this.tutorialUI.show(
            '出土了！这是件真品。看左上角的标签：稀有度、品相、估价。\n品相越好越值钱。如果是珍品及以上稀有度的文物，会弹出"上交国家"和"私人收藏"——\n上交吃基金点，收藏拿去拍卖。点弹窗里的按钮收下它。',
            { x: px - 4, y: py - 4, width: pw + 8, height: ph + 8 },
            { onNext: () => {
                // 只关闭气泡，不推进步骤——等玩家点击面板按钮后由 onAppraisalContinue 推进
                this.tutorialUI.hide();
            }, forceBubbleY: 72 }
        );
    }

    /** 玩家点击了结果弹窗的按钮，推进教程流程 */
    onAppraisalContinue() {
        // 隐藏可能残留的教程气泡
        if (this.tutorialUI.isShowing()) {
            this.tutorialUI.hide();
        }
        // 从步骤6推进到步骤7
        if (this.currentBasicStep === 6) {
            this._step7_upgrades();
        }
    }

    // ── Step 7: 升级引导 ──
    _step7_upgrades() {
        this.currentBasicStep = 7;
        this.tutorialUI.show(
            '卖文物赚的钱干什么用？升级！左边面板下部的五个按钮，每级都有不同的加成。\n先升一级"文物倍率"，以后每件文物多卖12%。试试看！',
            { x: 18, y: 408, width: 284, height: 218 },
            { onNext: () => {
                this.tutorialUI.hide();
                // 不管玩家有没有真的升级，继续
                this._step8_prestige();
            }}
        );
    }

    /** 玩家在教程中完成了升级，可提前推进 */
    onUpgradeDone() {
        if (this.currentBasicStep === 7 && this.tutorialUI.isShowing()) {
            this.tutorialUI.hide();
            this._step8_prestige();
        }
    }

    // ── Step 8: 声望引导 + 完结 ──
    _step8_prestige() {
        this.currentBasicStep = 8;
        this.tutorialUI.show(
            '左上角是你的声望等级和基金点(JP)。JP通过上交国宝、卖出珍品获得。\n\n' +
            '📈 声望升级机制: 每1JP = ¥500经费, 自行选择投入多少JP\n' +
            '  等级达到阈值自动晋升, 解锁新时代和新能力:\n' +
            '  Lv.0→1: 100JP 解锁鉴定之眼 | Lv.1→2: 500JP 解锁博物馆\n' +
            '  Lv.2→3: 2000JP 解锁科技考古 | Lv.3→4: 10000JP 解锁文物修复\n' +
            '  Lv.4→5: 50000JP 解锁学术休假(转生)\n\n' +
            '🔄 转生: Lv.5才能用! 点击学术休假重置进度换取永久加成:\n' +
            '  升级等级、文物图鉴、发掘记录全部重置\n' +
            '  但换来永久加成, 每次转生越变越强:\n' +
            '    第1转: 所有文物价值 +25%\n' +
            '    第2转: 新档开局 +¥5,000 经费\n' +
            '    第3转: 国宝出土概率 +5%\n' +
            '    第4转: 开局自带挖掘设备\n' +
            '    每次转生永久 +2% 全属性\n\n' +
            '🎯 循环成长: 冲Lv.5 → 转生变强 → 更快冲到Lv.5 → 再转生!\n\n' +
            '好了, 你现在出师了! 去挖吧。',
            { x: 40, y: 1, width: 225, height: 70 },
            { onNext: () => {
                this.tutorialUI.hide();
                this._completeBasic();
            }}
        );
        this.scene.time.delayedCall(500, () => {
            if (this.tutorialUI._nextBtn) this.tutorialUI._nextBtn.setText('出师！');
        });
    }

    /** 完成入门教程 */
    _completeBasic() {
        this.setFlag('basic_complete', true);
        this.currentBasicStep = 0;
        this.scene.showMessage('🎓 入门教程完成！去探索考古世界吧~', 'success');
    }

    // ═══════════════════════════════════════════════
    //  第二层：进阶触发（可跳过）
    // ═══════════════════════════════════════════════

    /** 声望升级时触发第二层教程 */
    onPrestigeLevelUp(newLevel) {
        switch (newLevel) {
            case 1: return this._triggerTier2('tier2_lv1',
                '晋升初级考古学家了！从现在开始，出土文物时鉴定之眼会自动标出真伪。\n不过——也得留神了，赝品会开始出现。鉴定精度升得越高，越不容易看走眼。');
            case 2: return this._triggerTier2('tier2_lv2',
                '中级考古学家了！现在可以建博物馆了。你发现的每件文物都会收录进去。\n集齐一个朝代的全部文物，那个朝代所有文物价值永久+5%，每个朝代都可以叠加！');
            case 3: return this._triggerTier2('tier2_lv3',
                '高级考古学家！给你两件好东西：科技考古升级线——可以一键自动发掘；高风险遗址——出土文物等级更高，但赝品率翻倍。要不要赌一把，看你自己。');
            case 4: return this._triggerTier2('tier2_lv4',
                '资深考古学家！文物修复工坊开放了。发掘时偶尔会遇到损坏的文物，拿到工坊修好，价值能翻倍。修复成功率跟你的手艺等级挂钩。');
            case 5: return this._triggerTier2_lv5();
        }
    }

    /** 转生教程（Lv.5，最长） */
    _triggerTier2_lv5() {
        if (this.flag('tier2_lv5')) return;
        const text = '首席考古学家！恭喜你站在了学术之巅。现在解锁终极系统——学术休假，又叫"转生"。\n\n具体是这样的：\n① 转生会重置你的资金、等级、升级——一切归零从头开始。\n② 但这局攒的基金点不会浪费，会按比例转化成永久加成。\n③ 第1次转生：所有文物 +25% 价值。第2次：新档多 ¥5,000 启动金。第3次延：国宝概率 +5%。第4次：开局送两级设备。\n④ 每次转生还额外永久 +2% 全属性。\n⑤ 转生后，文物图鉴保留——你发现过的文物永远记录在博物馆里。\n\n简单说：转生就是拿这一局的积累，换一个更强的下一局。';
        this._triggerTier2('tier2_lv5', text);
    }

    /** 首次切换朝代 */
    onDynastySwitch() {
        if (this.flag('tier2_dynasty_switch')) return;
        this._triggerTier2('tier2_dynasty_switch',
            '换个时代挖了？每个朝代有自己的文物池——新石器的彩陶、商周的青铜器、秦汉的兵马俑……不同时代有不同国宝。集齐了博物馆套装还有加成！');
    }

    /** 通用第二层触发 */
    _triggerTier2(flagKey, text) {
        if (this.flag(flagKey)) return;
        if (this.tutorialUI.isShowing()) return; // 已有教程在显示

        const hoverTarget = this.scene.prestigeHoverTarget || null;
        const highlight = hoverTarget ? {
            x: hoverTarget.x - 30,
            y: hoverTarget.y - 20,
            width: 140,
            height: 60
        } : null;

        this.tutorialUI.show(text, highlight, {
            allowSkip: true,
            onNext: () => {
                this.tutorialUI.hide();
                this.setFlag(flagKey, true);
            },
            onSkip: () => {
                this.tutorialUI.hide();
                this.setFlag(flagKey, true);
            }
        });
    }

    // ═══════════════════════════════════════════════
    //  第三层：零活选学（可跳过）
    // ═══════════════════════════════════════════════

    onOddjobClean() {
        if (this.flag('oddjob_clean')) return;
        if (this.tutorialUI.isShowing()) return;
        this._triggerTier3('oddjob_clean',
            '清理探方是个稳赚的零活——按住鼠标擦掉泥土就行，没有风险，一次能赚 ¥300~500。缺钱的时候就来这儿。');
    }

    onOddjobRepair() {
        if (this.flag('oddjob_repair')) return;
        if (this.tutorialUI.isShowing()) return;
        this._triggerTier3('oddjob_repair',
            '修复陶片比清理难一点——碎片散落各处需要找出来拼好。不过报酬也更丰厚。练手艺的好地方。');
    }

    /** 通用第三层触发 */
    _triggerTier3(flagKey, text) {
        if (this.flag(flagKey)) return;
        if (this.tutorialUI.isShowing()) return;
        this.tutorialUI.show(text, null, {
            allowSkip: true,
            onNext: () => {
                this.tutorialUI.hide();
                this.setFlag(flagKey, true);
            },
            onSkip: () => {
                this.tutorialUI.hide();
                this.setFlag(flagKey, true);
            }
        });
    }

    /** 重置教程UI引用（场景切换后调用） */
    rebindScene(scene) {
        this.scene = scene;
        // TutorialUI 在每次 show 时重新创建，不需要 rebind
    }
}

window.TutorialManager = TutorialManager;
