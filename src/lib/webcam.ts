import { EventEmitter } from 'eventemitter3';


export default class Webcam extends EventEmitter {
  private readonly context: CanvasRenderingContext2D;
  private readonly video: HTMLVideoElement;
  private animationHandle: number;

  constructor(private canvas: HTMLCanvasElement) {
    super();
    this.context = canvas.getContext('2d');
    this.video = document.createElement('video');
    
    navigator.mediaDevices
      .getUserMedia({video: {facingMode: 'environment'}})
      .then((stream) => this.setupVideo(stream))
      .catch((error) => this.onError(error));
  }

  public play(): void {
    this.scheduleFrame();
    this.video.play();
  }

  public pause(): void {
    this.video.pause();
  }

  public isPlaying(): boolean {
    return !this.video.paused;
  }

  public on(event: 'error', listener: (error: Error) => void): this;
  public on(event: 'render', listener: (context: CanvasRenderingContext2D) => void): this;
  public on(event: string, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }

  private setupVideo(stream: MediaStream): void {
    this.video.src = URL.createObjectURL(stream);
    this.video.onpause = () => this.cancelFrame();
    this.play();
  }

  private onError(error: Error): void {
    this.emit('error', error);
  }

  private scheduleFrame(): void {
    this.animationHandle = requestAnimationFrame(() => this.loop());
  }

  private cancelFrame(): void {
    cancelAnimationFrame(this.animationHandle);
  }

  protected loop(): void {
    this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    this.emit('render', this.context);
    this.scheduleFrame();
  }
};
