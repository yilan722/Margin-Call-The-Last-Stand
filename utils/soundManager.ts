// 音效管理器
// 使用 Web Audio API 生成音效，无需外部音频文件
// 支持背景音乐播放

class SoundManager {
  private audioContext: AudioContext | null = null;
  private _enabled: boolean = true;
  private volume: number = 0.3; // 默认音量
  private backgroundMusic: HTMLAudioElement | null = null;
  private musicEnabled: boolean = true;
  private musicVolume: number = 0.4; // 背景音乐音量（比音效稍低）

  get enabled(): boolean {
    return this._enabled;
  }

  constructor() {
    // 延迟初始化 AudioContext（需要用户交互后才能创建）
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('AudioContext not supported');
      }
    }

    // 初始化背景音乐
    if (typeof window !== 'undefined') {
      this.initBackgroundMusic();
    }
  }

  // 初始化背景音乐
  private initBackgroundMusic() {
    try {
      this.backgroundMusic = new Audio('/music/background-music.ogg');
      this.backgroundMusic.loop = true; // 循环播放
      this.backgroundMusic.volume = this.musicVolume;
      this.backgroundMusic.preload = 'auto';
      
      // 处理加载错误
      this.backgroundMusic.addEventListener('error', (e) => {
        console.warn('Background music failed to load:', e);
      });
    } catch (e) {
      console.warn('Failed to initialize background music:', e);
    }
  }

  // 播放背景音乐
  playBackgroundMusic() {
    if (!this.musicEnabled || !this.backgroundMusic) return;
    
    try {
      // 需要用户交互后才能播放音频
      const playPromise = this.backgroundMusic!.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('Background music play failed:', error);
        });
      }
    } catch (e) {
      console.warn('Failed to play background music:', e);
    }
  }

  // 停止背景音乐
  stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    }
  }

  // 设置背景音乐开关
  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (enabled) {
      this.playBackgroundMusic();
    } else {
      this.stopBackgroundMusic();
    }
  }

  // 设置背景音乐音量
  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.musicVolume;
    }
  }

  // 初始化 AudioContext（需要在用户交互后调用）
  private initAudioContext() {
    if (!this.audioContext && typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('AudioContext not supported');
      }
    }
    return this.audioContext;
  }

  // 设置音效开关
  setEnabled(enabled: boolean) {
    this._enabled = enabled;
  }

  // 设置音量
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  // 生成音调
  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = this.volume) {
    if (!this._enabled) return;
    
    const ctx = this.initAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }

  // 生成点击音效
  playClick() {
    this.playTone(800, 0.05, 'sine', this.volume * 0.5);
  }

  // 生成成功音效
  playSuccess() {
    const ctx = this.initAudioContext();
    if (!ctx || !this._enabled) return;

    const frequencies = [523.25, 659.25, 783.99]; // C, E, G (C大调和弦)
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.2, 'sine', this.volume * 0.6);
      }, i * 50);
    });
  }

  // 生成失败音效
  playFailure() {
    this.playTone(200, 0.3, 'sawtooth', this.volume * 0.7);
    setTimeout(() => {
      this.playTone(150, 0.3, 'sawtooth', this.volume * 0.7);
    }, 100);
  }

  // 生成警告音效
  playWarning() {
    this.playTone(400, 0.1, 'square', this.volume * 0.6);
    setTimeout(() => {
      this.playTone(300, 0.1, 'square', this.volume * 0.6);
    }, 100);
  }

  // 生成爆仓音效
  playLiquidation() {
    const ctx = this.initAudioContext();
    if (!ctx || !this._enabled) return;

    // 低沉的下降音调
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);

    gainNode.gain.setValueAtTime(this.volume * 0.8, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  }

  // 生成补仓音效
  playMarginAdd() {
    const frequencies = [440, 554.37]; // A, C#
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.15, 'sine', this.volume * 0.5);
      }, i * 80);
    });
  }

  // 生成砍仓音效
  playPositionCut() {
    this.playTone(300, 0.2, 'square', this.volume * 0.6);
    setTimeout(() => {
      this.playTone(250, 0.2, 'square', this.volume * 0.6);
    }, 100);
  }

  // 生成跳车音效
  playExit() {
    this.playTone(600, 0.1, 'sine', this.volume * 0.5);
    setTimeout(() => {
      this.playTone(500, 0.1, 'sine', this.volume * 0.5);
    }, 50);
  }

  // 生成钻石获得音效
  playDiamondEarned() {
    const frequencies = [523.25, 659.25, 783.99, 987.77]; // 上升音阶
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.1, 'sine', this.volume * 0.4);
      }, i * 60);
    });
  }

  // 生成复活音效
  playRevive() {
    const frequencies = [392, 493.88, 587.33]; // G, B, D (G大调和弦)
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.2, 'sine', this.volume * 0.6);
      }, i * 100);
    });
  }

  // 生成购买音效
  playPurchase() {
    this.playTone(880, 0.1, 'sine', this.volume * 0.5);
    setTimeout(() => {
      this.playTone(1108.73, 0.1, 'sine', this.volume * 0.5);
    }, 80);
  }

  // 生成升级音效
  playUpgrade() {
    const frequencies = [523.25, 659.25, 783.99, 987.77, 1174.66]; // 上升五度音阶
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.08, 'sine', this.volume * 0.4);
      }, i * 50);
    });
  }

  // 生成危险音效（接近爆仓）
  playDanger() {
    this.playTone(150, 0.2, 'sawtooth', this.volume * 0.7);
    setTimeout(() => {
      this.playTone(120, 0.2, 'sawtooth', this.volume * 0.7);
    }, 150);
  }

  // 生成市场波动音效
  playMarketShock() {
    const ctx = this.initAudioContext();
    if (!ctx || !this._enabled) return;

    // 快速的不和谐音调
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const freq = 300 + Math.random() * 200;
        this.playTone(freq, 0.05, 'square', this.volume * 0.4);
      }, i * 30);
    }
  }
}

// 导出单例
export const soundManager = new SoundManager();

