export class Metronome {
  audioContext: AudioContext | null = null;
  isPlaying = false;
  currentBeat = 0;
  tempo = 120;
  lookahead = 25.0; // ms
  scheduleAheadTime = 0.1; // s
  nextNoteTime = 0.0;
  beatsPerMeasure = 4;
  soundType: 'woodblock' | 'beep' | 'click' = 'beep';
  onBeat: (beat: number) => void;
  worker: Worker | null = null;

  constructor(onBeat: (beat: number) => void) {
    this.onBeat = onBeat;
    
    const blob = new Blob([`
      let timerID = null;
      let interval = 25;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          timerID = setInterval(function() {
            postMessage('tick');
          }, interval);
        } else if (e.data === 'stop') {
          clearInterval(timerID);
          timerID = null;
        } else if (e.data.interval) {
          interval = e.data.interval;
          if (timerID) {
            clearInterval(timerID);
            timerID = setInterval(function() {
              postMessage('tick');
            }, interval);
          }
        }
      };
    `], { type: 'application/javascript' });
    
    this.worker = new Worker(URL.createObjectURL(blob));
    this.worker.onmessage = (e) => {
      if (e.data === 'tick') {
        this.scheduler();
      }
    };
    this.worker.postMessage({ interval: this.lookahead });
  }

  nextNote() {
    const secondsPerBeat = 60.0 / this.tempo;
    this.nextNoteTime += secondsPerBeat;
    this.currentBeat++;
    if (this.currentBeat >= this.beatsPerMeasure) {
      this.currentBeat = 0;
    }
  }

  playNote(time: number) {
    if (!this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    const isAccent = this.currentBeat === 0;

    if (this.soundType === 'beep') {
      osc.type = 'sine';
      osc.frequency.value = isAccent ? 880 : 440;
      gainNode.gain.setValueAtTime(1, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      osc.start(time);
      osc.stop(time + 0.1);
    } else if (this.soundType === 'click') {
      osc.type = 'square';
      osc.frequency.value = isAccent ? 600 : 300;
      gainNode.gain.setValueAtTime(0.5, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
      osc.start(time);
      osc.stop(time + 0.02);
    } else if (this.soundType === 'woodblock') {
      osc.type = 'triangle';
      osc.frequency.value = isAccent ? 1000 : 800;
      gainNode.gain.setValueAtTime(1, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      osc.start(time);
      osc.stop(time + 0.05);
    }

    // Schedule UI update
    const timeUntilNote = time - this.audioContext.currentTime;
    const beatToReport = this.currentBeat;
    setTimeout(() => {
      this.onBeat(beatToReport);
    }, Math.max(0, timeUntilNote * 1000));
  }

  scheduler() {
    if (!this.audioContext) return;
    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      this.playNote(this.nextNoteTime);
      this.nextNote();
    }
  }

  start() {
    if (this.isPlaying) return;
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    this.isPlaying = true;
    this.currentBeat = 0;
    this.nextNoteTime = this.audioContext.currentTime + 0.05;
    this.worker?.postMessage('start');
  }

  stop() {
    this.isPlaying = false;
    this.worker?.postMessage('stop');
  }

  setTempo(tempo: number) {
    this.tempo = tempo;
  }

  setBeatsPerMeasure(beats: number) {
    this.beatsPerMeasure = beats;
  }

  setSoundType(sound: 'woodblock' | 'beep' | 'click') {
    this.soundType = sound;
  }

  destroy() {
    this.stop();
    this.worker?.terminate();
    this.audioContext?.close();
  }
}
