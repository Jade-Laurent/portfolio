// 刀剣乱舞 カウントダウン JavaScript

// カウントダウン管理
let countdowns = {};
let soundEnabled = true;
let notificationPermission = 'default'; // 通知許可の状態を管理

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== ページ読み込み完了 ===');
    console.log('JavaScriptが実行されています');
    
    loadCountdowns();
    loadSoundSettings();
    updateAllCountdowns();
    setInterval(updateAllCountdowns, 1000);
    
    // 通知許可の状態を確認
    checkNotificationPermission();
    
    // 音声ファイルの読み込みを試行
    preloadAudio();
    
    console.log('初期化完了');
});

// 通知許可の確認
function checkNotificationPermission() {
    if ('Notification' in window) {
        notificationPermission = Notification.permission;
        console.log('通知許可状態:', notificationPermission);
        updateNotificationButton();
    }
}

// 通知許可を要求（初回のみ）
function requestNotificationPermission() {
    if ('Notification' in window && notificationPermission === 'default') {
        Notification.requestPermission().then(permission => {
            notificationPermission = permission;
            console.log('通知許可結果:', permission);
            saveNotificationPermission();
            updateNotificationButton();
        });
    } else if (notificationPermission === 'denied') {
        alert('通知が拒否されています。ブラウザの設定で通知を許可してください。');
    } else if (notificationPermission === 'granted') {
        alert('通知は既に許可されています。');
    }
}

// 通知許可状態を保存
function saveNotificationPermission() {
    localStorage.setItem('notificationPermission', notificationPermission);
}

// 通知許可状態を読み込み
function loadNotificationPermission() {
    const saved = localStorage.getItem('notificationPermission');
    if (saved) {
        notificationPermission = saved;
    }
}

// 通知ボタンの状態を更新
function updateNotificationButton() {
    const notificationBtn = document.getElementById('notification-btn');
    if (notificationBtn) {
        switch (notificationPermission) {
            case 'granted':
                notificationBtn.textContent = '🔔 通知ON';
                notificationBtn.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
                break;
            case 'denied':
                notificationBtn.textContent = '🔕 通知OFF';
                notificationBtn.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
                break;
            default:
                notificationBtn.textContent = '🔔 通知許可';
                notificationBtn.style.background = 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)';
                break;
        }
    }
}

// 音声ファイルの事前読み込み
function preloadAudio() {
    const audio = document.getElementById('notification-sound');
    if (audio) {
        console.log('音声要素を検出しました');
        
        // 音声ファイルの読み込みイベントを設定
        audio.addEventListener('loadstart', () => console.log('音声ファイルの読み込み開始'));
        audio.addEventListener('loadeddata', () => console.log('音声ファイルの読み込み完了'));
        audio.addEventListener('canplay', () => console.log('音声ファイルの再生準備完了'));
        audio.addEventListener('error', (e) => {
            console.log('音声ファイル読み込みエラー:', e);
            console.log('エラー詳細:', audio.error);
        });
        
        // 音声ファイルを読み込み
        audio.load();
        console.log('音声ファイルの読み込みを開始しました');
        
        // ユーザーインタラクション後に音声を有効化
        document.addEventListener('click', function enableAudio() {
            console.log('ユーザーインタラクション検出');
            
            // Web Audio APIを初期化
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('音声機能を初期化しました');
            } catch (e) {
                console.log('音声機能の初期化に失敗しました:', e);
            }
            
            // 音声ファイルの初期化テスト
            if (audio.readyState >= 2) { // HAVE_CURRENT_DATA以上
                audio.play().then(() => {
                    console.log('音声ファイル初期化成功');
                    audio.pause();
                    audio.currentTime = 0;
                }).catch(e => {
                    console.log('音声ファイル初期化エラー:', e);
                });
            } else {
                console.log('音声ファイルの準備ができていません。readyState:', audio.readyState);
            }
            
            document.removeEventListener('click', enableAudio);
        }, { once: true });
    } else {
        console.log('音声要素が見つかりません');
    }
}

// カウントダウン開始
function startCountdown(type, id) {
    const timeInput = document.getElementById(`${type}-time-${id}`);
    const display = document.getElementById(`${type}-${id}`);
    const item = document.querySelector(`[data-type="${type}"][data-id="${id}"]`);

    const timeValue = timeInput.value.trim();

    if (!timeValue) {
        alert('時間を入力してください');
        return;
    }

    // 時間形式の検証
    if (!isValidTimeFormat(timeValue)) {
        alert('正しい時間形式で入力してください（例：01:30）');
        return;
    }

    const [hours, minutes] = timeValue.split(':').map(Number);
    const totalSeconds = hours * 3600 + minutes * 60;

    if (totalSeconds <= 0) {
        alert('有効な時間を入力してください');
        return;
    }

    const endTime = Date.now() + (totalSeconds * 1000);
    const countdownId = `${type}-${id}`;

    countdowns[countdownId] = {
        endTime: endTime,
        type: type,
        id: id,
        label: getLabel(type, id)
    };

    // アクティブ状態の表示
    item.classList.add('active');
    
    // ボタンの表示切り替え
    toggleButtons(type, id, true);

    // ローカルストレージに保存
    saveCountdowns();

    // 即座に更新
    updateCountdown(countdownId);
}

// カウントダウン停止
function stopCountdown(type, id) {
    const countdownId = `${type}-${id}`;
    const item = document.querySelector(`[data-type="${type}"][data-id="${id}"]`);
    
    if (countdowns[countdownId]) {
        delete countdowns[countdownId];
        
        // アクティブ状態を解除
        item.classList.remove('active');
        
        // ボタンの表示切り替え
        toggleButtons(type, id, false);
        
        // 表示をリセット
        const display = document.getElementById(countdownId);
        display.textContent = '--:--:--';
        
        // ローカルストレージから削除
        saveCountdowns();
    }
}

// カウントダウンリセット
function resetCountdown(type, id) {
    const countdownId = `${type}-${id}`;
    const item = document.querySelector(`[data-type="${type}"][data-id="${id}"]`);
    const display = document.getElementById(countdownId);
    
    // カウントダウンを停止
    if (countdowns[countdownId]) {
        delete countdowns[countdownId];
    }
    
    // アクティブ状態を解除
    item.classList.remove('active');
    
    // ボタンの表示切り替え
    toggleButtons(type, id, false);
    
    // 表示をリセット
    display.textContent = '--:--:--';
    
    // ローカルストレージから削除
    saveCountdowns();
}

// ボタンの表示/非表示切り替え
function toggleButtons(type, id, isRunning) {
    const startBtn = document.getElementById(`${type}-start-${id}`);
    const stopBtn = document.getElementById(`${type}-stop-${id}`);
    
    if (isRunning) {
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-block';
    } else {
        startBtn.style.display = 'inline-block';
        stopBtn.style.display = 'none';
    }
}

// 内番開始（20時間固定）
function startInternalDuty() {
    const endTime = Date.now() + (20 * 60 * 60 * 1000); // 20時間
    const countdownId = 'internal-1';
    const item = document.querySelector('[data-type="internal"][data-id="1"]');

    countdowns[countdownId] = {
        endTime: endTime,
        type: 'internal',
        id: 1,
        label: '内番（20時間固定）'
    };

    // アクティブ状態の表示
    item.classList.add('active');
    
    // ボタンの表示切り替え
    toggleButtons('internal', 1, true);

    // ローカルストレージに保存
    saveCountdowns();

    // 即座に更新
    updateCountdown(countdownId);
}

// タイマー開始
function startTimer(id) {
    const timeInput = document.getElementById(`timer-time-${id}`);
    const display = document.getElementById(`timer-${id}`);
    const item = document.querySelector(`[data-type="timer"][data-id="${id}"]`);

    const timeValue = timeInput.value.trim();

    if (!timeValue) {
        alert('時間を入力してください');
        return;
    }

    // 時間形式の検証
    if (!isValidTimeFormat(timeValue)) {
        alert('正しい時間形式で入力してください（例：01:30）');
        return;
    }

    const [hours, minutes] = timeValue.split(':').map(Number);
    const totalSeconds = hours * 3600 + minutes * 60;

    if (totalSeconds <= 0) {
        alert('有効な時間を入力してください');
        return;
    }

    const endTime = Date.now() + (totalSeconds * 1000);
    const countdownId = `timer-${id}`;

    countdowns[countdownId] = {
        endTime: endTime,
        type: 'timer',
        id: id,
        label: getLabel('timer', id)
    };

    // アクティブ状態の表示
    item.classList.add('active');
    
    // ボタンの表示切り替え
    toggleButtons('timer', id, true);

    // ローカルストレージに保存
    saveCountdowns();

    // 即座に更新
    updateCountdown(countdownId);
}

// 時間形式の検証
function isValidTimeFormat(timeString) {
    const timeRegex = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/;
    return timeRegex.test(timeString);
}

// ラベル取得
function getLabel(type, id) {
    if (type === 'custom') {
        const labelInput = document.getElementById(`custom-label-${id}`);
        return labelInput.value || `カスタム${id}`;
    } else if (type === 'timer') {
        const labelInput = document.getElementById(`timer-label-${id}`);
        return labelInput.value || `タイマー${id}`;
    } else if (type === 'expedition') {
        return `第${id}部隊`;
    } else if (type === 'maintenance') {
        return `手入れ${id}`;
    } else if (type === 'forging') {
        return `鍛刀${id}`;
    } else if (type === 'internal') {
        return '内番（20時間固定）';
    }
    return `${type}${id}`;
}

// カウントダウン更新
function updateCountdown(countdownId) {
    const countdown = countdowns[countdownId];
    if (!countdown) return;

    const display = document.getElementById(countdownId);
    const now = Date.now();
    const timeLeft = countdown.endTime - now;

    if (timeLeft <= 0) {
        // カウントダウン完了
        display.textContent = '完了！';
        display.classList.add('completed');
        
        // 通知
        showNotification(countdown.label);
        
        // カウントダウンを削除
        delete countdowns[countdownId];
        
        // アクティブ状態を解除
        const item = document.querySelector(`[data-type="${countdown.type}"][data-id="${countdown.id}"]`);
        item.classList.remove('active');
        
        // ボタンの表示切り替え
        toggleButtons(countdown.type, countdown.id, false);
        
        // ローカルストレージから削除
        saveCountdowns();
    } else {
        // 残り時間を表示
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        display.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        display.classList.remove('completed');
    }
}

// 全カウントダウン更新
function updateAllCountdowns() {
    Object.keys(countdowns).forEach(updateCountdown);
}

// 通知表示
function showNotification(label) {
    // 音声再生
    if (soundEnabled) {
        playNotificationSound();
    }
    
    // ブラウザ通知
    if ('Notification' in window) {
        if (notificationPermission === 'granted') {
            // 許可済みの場合は直接通知
            new Notification('刀剣乱舞 カウントダウン', {
                body: `${label}が完了しました！`,
                icon: 'favicon.png',
                silent: true
            });
        } else if (notificationPermission === 'default') {
            // 初回のみ通知許可を要求
            requestNotificationPermission();
            // 許可要求中はアラートで代替
            showAlertNotification(label);
        } else {
            // 通知が拒否されている場合はアラートで代替
            showAlertNotification(label);
        }
    } else {
        // 通知APIがサポートされていない場合はアラートで代替
        showAlertNotification(label);
    }
}

// アラート通知（フォールバック）
function showAlertNotification(label) {
    // ページがアクティブでない場合のみアラートを表示
    if (!document.hasFocus()) {
        setTimeout(() => {
            alert(`${label}が完了しました！`);
        }, 100);
    }
}

// 通知音再生
function playNotificationSound() {
    const audio = document.getElementById('notification-sound');
    
    if (!audio) {
        console.log('音声要素が見つかりません');
        playBrowserSound();
        return;
    }
    
    // 音声をリセット
    audio.currentTime = 0;
    
    // 音声再生を試行
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            console.log('音声ファイルを再生しました');
        }).catch(e => {
            console.log('音声ファイル再生エラー:', e);
            // 音声ファイル再生に失敗した場合は、ブラウザ音声を使用
            playBrowserSound();
        });
    }
}

// ブラウザの内蔵音声を再生
function playBrowserSound() {
    try {
        // Web Audio APIを使用して音を生成
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // 音の設定
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // 音量設定
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        // 音を再生
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        
        console.log('ブラウザ内蔵音声を再生しました');
    } catch (e) {
        console.log('ブラウザ音声再生エラー:', e);
        // 最後の手段として、アラート音を使用
        playAlertSound();
    }
}

// アラート音を再生（フォールバック）
function playAlertSound() {
    try {
        // 新しいAudioContextを作成して短い音を生成
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.3, audioContext.sampleRate);
        const channelData = buffer.getChannelData(0);
        
        // 簡単なビープ音を生成
        for (let i = 0; i < buffer.length; i++) {
            channelData[i] = Math.sin(i * 0.1) * 0.3 * Math.exp(-i / (audioContext.sampleRate * 0.1));
        }
        
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();
        
        console.log('アラート音を再生しました');
    } catch (e) {
        console.log('アラート音再生エラー:', e);
        // 音声再生が完全に失敗した場合
        console.log('音声再生に失敗しました。音声ファイルを配置するか、ブラウザの音声設定を確認してください。');
    }
}

// 音声切り替え
function toggleSound() {
    soundEnabled = !soundEnabled;
    const toggleBtn = document.getElementById('sound-toggle');
    toggleBtn.textContent = soundEnabled ? '🔊 音ON' : '🔇 音OFF';
    saveSoundSettings();
}

// 全リセット
function resetAll() {
    if (confirm('全てのカウントダウンをリセットしますか？')) {
        countdowns = {};
        
        // 全てのカウントダウンアイテムをリセット
        document.querySelectorAll('.countdown-item').forEach(item => {
            const type = item.dataset.type;
            const id = item.dataset.id;
            const display = document.getElementById(`${type}-${id}`);
            
            item.classList.remove('active');
            display.textContent = '--:--:--';
            display.classList.remove('completed');
            
            // ボタンの表示切り替え
            toggleButtons(type, id, false);
        });
        
        // ローカルストレージをクリア
        localStorage.removeItem('countdowns');
        localStorage.removeItem('soundEnabled');
        
        // 音声設定をリセット
        soundEnabled = true;
        const toggleBtn = document.getElementById('sound-toggle');
        toggleBtn.textContent = '🔊 音ON';
    }
}

// ローカルストレージに保存
function saveCountdowns() {
    localStorage.setItem('countdowns', JSON.stringify(countdowns));
}

// ローカルストレージから読み込み
function loadCountdowns() {
    const saved = localStorage.getItem('countdowns');
    if (saved) {
        countdowns = JSON.parse(saved);
        
        // 保存されたカウントダウンのボタン状態を復元
        Object.keys(countdowns).forEach(countdownId => {
            const [type, id] = countdownId.split('-');
            const item = document.querySelector(`[data-type="${type}"][data-id="${id}"]`);
            if (item) {
                item.classList.add('active');
                toggleButtons(type, id, true);
            }
        });
    }
    
    // 通知許可状態も読み込み
    loadNotificationPermission();
}

// 音声設定を保存
function saveSoundSettings() {
    localStorage.setItem('soundEnabled', soundEnabled);
}

// 音声設定を読み込み
function loadSoundSettings() {
    const saved = localStorage.getItem('soundEnabled');
    if (saved !== null) {
        soundEnabled = JSON.parse(saved);
        const toggleBtn = document.getElementById('sound-toggle');
        toggleBtn.textContent = soundEnabled ? '🔊 音ON' : '🔇 音OFF';
    }
}

// 設定読み込み
function loadSettings() {
    // カスタムラベルの復元
    for (let i = 1; i <= 3; i++) {
        const savedLabel = localStorage.getItem(`custom-label-${i}`);
        if (savedLabel) {
            const labelInput = document.getElementById(`custom-label-${i}`);
            if (labelInput) {
                labelInput.value = savedLabel;
            }
        }
    }
    
    for (let i = 1; i <= 2; i++) {
        const savedLabel = localStorage.getItem(`timer-label-${i}`);
        if (savedLabel) {
            const labelInput = document.getElementById(`timer-label-${i}`);
            if (labelInput) {
                labelInput.value = savedLabel;
            }
        }
    }
}

// ラベル保存（入力時に自動保存）
document.addEventListener('input', function(e) {
    if (e.target.classList.contains('custom-label')) {
        const id = e.target.id.split('-')[2];
        localStorage.setItem(`custom-label-${id}`, e.target.value);
    } else if (e.target.classList.contains('timer-label')) {
        const id = e.target.id.split('-')[2];
        localStorage.setItem(`timer-label-${id}`, e.target.value);
    }
});

// ページ離脱時の保存
window.addEventListener('beforeunload', function() {
    saveCountdowns();
});

// キーボードショートカット
document.addEventListener('keydown', function(e) {
    // Ctrl+R で全リセット
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        resetAll();
    }
    
    // Ctrl+S で音声切り替え
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        toggleSound();
    }
});

// サービスワーカー登録（PWA対応）
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('SW registered: ', registration);
            })
            .catch(function(registrationError) {
                console.log('SW registration failed: ', registrationError);
            });
    });
} 

// 音声テスト
function testSound() {
    if (!soundEnabled) {
        alert('音声がOFFになっています。「🔊 音ON」ボタンをクリックして音声を有効にしてください。');
        return;
    }
    
    const audio = document.getElementById('notification-sound');
    
    if (audio) {
        try {
            audio.currentTime = 0;
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    playBrowserSound();
                });
            }
        } catch (e) {
            playBrowserSound();
        }
    } else {
        playBrowserSound();
    }
} 