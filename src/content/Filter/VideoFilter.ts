import { PredictionRequest } from '../../utils/messages'

import { Filter } from './Filter'

type videoFilterSettingsType = {
    filterEffect: 'blur' | 'hide' | 'grayscale'
}

export type IVideoFilter = {
    analyzeVideo: (video: HTMLVideoElement, srcAttribute: boolean) => void
    setSettings: (settings: videoFilterSettingsType) => void
}

export class VideoFilter extends Filter implements IVideoFilter {
    private readonly MIN_IMAGE_SIZE: number
    private settings: videoFilterSettingsType
  
    constructor () {
      super()
      this.MIN_IMAGE_SIZE = 41
  
      this.settings = { filterEffect: 'hide' }
    }
  
    public setSettings (settings: videoFilterSettingsType): void {
      this.settings = settings
    }
  
    public analyzeVideo (video: HTMLVideoElement, srcAttribute: boolean = false): void {
      if (
        (srcAttribute || video.dataset.nsfwAnalysis === undefined) &&
        (
          (video.width > this.MIN_IMAGE_SIZE && video.height > this.MIN_IMAGE_SIZE) ||
          video.height === 0 ||
          video.width === 0
        )
      ) {
        this._startVideoAnalysis(video);
      }
    }

    private _startVideoAnalysis(video: HTMLVideoElement): void {
      video.dataset.nsfwAnalysis = "analyzing"
      const canvas = document.createElement('canvas');
      canvas.width = 224;
      canvas.height = 224;
      var ctx = canvas.getContext('2d');

      let ts = Date.now();
      const frameHandler = () => {
        // Update only once a second
        const now = Date.now()
        if (now - ts < 1000) {
          video.requestVideoFrameCallback(frameHandler); 
          return
        }
        ts = now;

        // Run image detection
        const img = this._getImageFromVideo(video, canvas, ctx);
        if (img !== undefined){
          const request = new PredictionRequest(img, false /*Use Cache*/);
          this.requestToAnalyzeImage(request).
          then(({result}) => {
            if (result){
              this._blurVideo(video);
            } else {
              this._unblurVideo(video);
            }
          });
        }
        // video.requestVideoFrameCallback(frameHandler);
      }
      video.addEventListener("timeupdate", frameHandler);
      // video.requestVideoFrameCallback(frameHandler);
    }

    private _getImageFromVideo(video: HTMLVideoElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D | null) {
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", 0.8);
    }

    private _blurVideo(video: HTMLVideoElement): void {
        video.style.filter = 'blur(25px)'
        // if (this.settings.filterEffect === 'blur') {
        // } else if (this.settings.filterEffect === 'grayscale') {
        //     video.style.filter = 'grayscale(1)'
        // }
    }

    private _unblurVideo(video: HTMLVideoElement): void {
        video.style.filter = "";
    }
  }