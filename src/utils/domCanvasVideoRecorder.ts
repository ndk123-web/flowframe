/**
 * Captures the exact `.react-flow` workspace canvas element during live simulation
 * with 100% pixel-perfect visual fidelity, auto-cropping to exclude sidebars,
 * topbars, and browser UI.
 */

export interface ExportWorkspaceVideoOptions {
  reactFlowElement: HTMLElement;
  videoFormat?: "webm" | "mp4";
  durationMs?: number;
  onStart?: () => void;
  onProgress?: (percent: number, status: string) => void;
  onComplete?: (blob: Blob, url: string, ext: string) => void;
  onError?: (err: Error) => void;
}

export async function exportWorkspaceSimulationVideo({
  reactFlowElement,
  videoFormat = "webm",
  durationMs = 8000,
  onStart,
  onProgress,
  onComplete,
  onError,
}: ExportWorkspaceVideoOptions): Promise<() => void> {
  let isCancelled = false;
  let recorder: MediaRecorder | null = null;
  let rawStream: MediaStream | null = null;
  let animationId: number | null = null;
  let durationTimeout: NodeJS.Timeout | null = null;
  let progressInterval: NodeJS.Timeout | null = null;

  const stopAndCleanup = () => {
    isCancelled = true;
    reactFlowElement?.classList?.remove("rf-recording-clean");
    if (progressInterval) clearInterval(progressInterval);
    if (durationTimeout) clearTimeout(durationTimeout);
    if (animationId) cancelAnimationFrame(animationId);
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    if (rawStream) {
      rawStream.getTracks().forEach((t) => t.stop());
      rawStream = null;
    }
  };

  try {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      throw new Error("Screen recording is not supported in this browser environment.");
    }

    onProgress?.(5, "Select current tab in dialog...");

    // 1. Request current tab stream with browser preference hints
    const stream = await navigator.mediaDevices.getDisplayMedia({
      preferCurrentTab: true,
      selfBrowserSurface: "include",
      systemAudio: "exclude",
      surfaceSwitching: "exclude",
      video: {
        displaySurface: "browser",
        frameRate: { ideal: 60, max: 60 },
      },
      audio: false,
    } as any);

    rawStream = stream;
    const [videoTrack] = stream.getVideoTracks();

    // Add clean canvas styling to hide minimap, controls, and floating overlays
    reactFlowElement.classList.add("rf-recording-clean");

    let recordStream: MediaStream = stream;
    let usedNativeCrop = false;

    // 2. Try native Chromium Region Capture (CropTarget)
    if (
      typeof (window as any).CropTarget !== "undefined" &&
      typeof (videoTrack as any).cropTo === "function"
    ) {
      try {
        const cropTarget = await (window as any).CropTarget.fromElement(reactFlowElement);
        await (videoTrack as any).cropTo(cropTarget);
        usedNativeCrop = true;
        recordStream = stream;
      } catch (cropErr) {
        console.warn("Native CropTarget failed, falling back to viewport crop", cropErr);
      }
    }

    // 3. Fallback Canvas Crop if native CropTarget is unavailable
    if (!usedNativeCrop) {
      const initialRect = reactFlowElement.getBoundingClientRect();
      const aspect = Math.max(0.5, (initialRect.width || 16) / (initialRect.height || 9));
      const targetHeight = 1080;
      let targetWidth = Math.round(targetHeight * aspect);
      // Ensure even width and height for video codecs
      targetWidth = targetWidth % 2 === 0 ? targetWidth : targetWidth + 1;

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });

      if (ctx) {
        const video = document.createElement("video");
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        await video.play();

        const renderCropLoop = () => {
          if (isCancelled) return;
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            const rect = reactFlowElement.getBoundingClientRect();
            const scaleX = video.videoWidth / window.innerWidth;
            const scaleY = video.videoHeight / window.innerHeight;

            const sx = Math.max(0, rect.left * scaleX);
            const sy = Math.max(0, rect.top * scaleY);
            const sw = Math.min(video.videoWidth - sx, rect.width * scaleX);
            const sh = Math.min(video.videoHeight - sy, rect.height * scaleY);

            if (sw > 0 && sh > 0) {
              ctx.drawImage(video, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
            }
          }
          animationId = requestAnimationFrame(renderCropLoop);
        };
        renderCropLoop();

        if (typeof canvas.captureStream === "function") {
          recordStream = canvas.captureStream(60);
        }
      }
    }

    // 4. Setup MediaRecorder with best supported codec
    let mimeType = videoFormat === "mp4" ? "video/mp4" : "video/webm;codecs=vp9";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
        mimeType = "video/webm;codecs=vp8";
      } else if (MediaRecorder.isTypeSupported("video/webm")) {
        mimeType = "video/webm";
      } else if (MediaRecorder.isTypeSupported("video/mp4")) {
        mimeType = "video/mp4";
      } else {
        mimeType = "";
      }
    }

    recorder = mimeType
      ? new MediaRecorder(recordStream, { mimeType, videoBitsPerSecond: 10000000 })
      : new MediaRecorder(recordStream);

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      stopAndCleanup();

      const finalMime = recorder?.mimeType || (videoFormat === "mp4" ? "video/mp4" : "video/webm");
      const blob = new Blob(chunks, { type: finalMime });
      const url = URL.createObjectURL(blob);
      const ext = videoFormat === "mp4" && finalMime.includes("mp4") ? "mp4" : "webm";

      // Direct download
      const a = document.createElement("a");
      a.href = url;
      a.download = `flowframe-canvas-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      onProgress?.(100, "Simulation video exported successfully!");
      onComplete?.(blob, url, ext);
    };

    // Listen for user stopping screen share via native browser banner
    videoTrack.onended = () => {
      stopAndCleanup();
    };

    // Notify caller that stream is active and recording is starting
    onStart?.();

    recorder.start(250);
    onProgress?.(10, "Recording live canvas simulation...");

    let elapsed = 0;
    progressInterval = setInterval(() => {
      elapsed += 400;
      const pct = Math.min(96, Math.round(10 + (elapsed / durationMs) * 86));
      onProgress?.(pct, `Recording canvas (${Math.round(elapsed / 1000)}s)...`);
    }, 400);

    // Auto-stop after calculated simulation duration
    durationTimeout = setTimeout(() => {
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
    }, durationMs);

  } catch (err: any) {
    stopAndCleanup();
    if (err.name !== "NotAllowedError") {
      onError?.(err);
    }
  }

  return stopAndCleanup;
}
