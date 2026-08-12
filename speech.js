// ===== 语音播放队列 =====
// 核心原则：同一时刻只播放一条语音；题目朗读最高优先级但仍需排队，不允许打断/叠加

class SpeechQueue {
  constructor() {
    this.queue = [];
    this.speaking = false;
    this.currentUtteranceId = 0;
    this.enabled = true; // 自动朗读开关
  }

  // 停止当前所有语音（用于题目切换时的"生命周期"清理）
  stopAll() {
    window.speechSynthesis.cancel();
    this.queue = [];
    this.speaking = false;
    this.currentUtteranceId++; // 让之前的回调失效
  }

  // 加入队列播放；priority='title'|'question'|'settlement'
  enqueue(text, { rate = 1, pitch = 1, onEnd = null } = {}) {
    const id = this.currentUtteranceId;
    this.queue.push({ text, rate, pitch, onEnd, id });
    this._processNext();
  }

  // 立即播放（清空之前排队内容，仅用于"切题时朗读新题"这种需要打断旧队列的场景）
  speakImmediate(text, { rate = 1, pitch = 1, onEnd = null } = {}) {
    this.stopAll();
    this.enqueue(text, { rate, pitch, onEnd });
  }

  _processNext() {
    if (this.speaking) return;
    const item = this.queue.shift();
    if (!item) return;
    this.speaking = true;
    const myId = item.id;

    if (!('speechSynthesis' in window)) {
      this.speaking = false;
      if (item.onEnd) item.onEnd();
      this._processNext();
      return;
    }

    const utter = new SpeechSynthesisUtterance(item.text);
    utter.lang = 'zh-CN';
    utter.rate = item.rate;
    utter.pitch = item.pitch;

    const finish = () => {
      // 若队列已被stopAll重置（题目已切换），旧回调不再触发下一题逻辑，防止旧语音影响新题
      if (myId !== this.currentUtteranceId) return;
      this.speaking = false;
      if (item.onEnd) item.onEnd();
      this._processNext();
    };
    utter.onend = finish;
    utter.onerror = finish;

    window.speechSynthesis.speak(utter);
  }
}

window.speechQueue = new SpeechQueue();
