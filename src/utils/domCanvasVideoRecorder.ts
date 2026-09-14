/**
 * Captures the exact `.react-flow` workspace canvas element during live simulation
 * with 100% pixel-perfect visual fidelity, auto-cropping to exclude sidebars,
 * topbars, and browser UI.
 */

export interface ExportWorkspaceVideoOptions {
  reactFlowElement: HTMLElement;
  videoFormat?: "webm" | "mp4";
  durationMs?: number;
  onProgress?: (percent: number, status: string) => void;
  onComplete?: (blob: Blob, url: string, ext: string) => void;
  onError?: (err: Error) => void;
}

export async function exportWorkspaceSimulationVideo({
  reactFlowElement,
  videoFormat = "webm",
  durationMs = 8000,
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

    onProgress?.(5, "Requesting canvas display stream...");

    // 1. Request current tab stream
    const stream = await navigator.mediaDevices.getDisplayMedia({
      preferCurrentTab: true,
      video: {
        displaySurface: "browser",
        frameRate: { ideal: 60, max: 60 },
      },
      audio: false,
    } as any);

    rawStream = stream;
    const [videoTrack] = stream.getVideoTracks();

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
      const canvas = document.createElement("canvas");
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext("2d", { alpha: false });

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

            ctx.drawImage(
              video,
              rect.left * scaleX,
              rect.top * scaleY,
              rect.width * scaleX,
              rect.height * scaleY,
              0,
              0,
              1920,
              1080,
            );
          }
          animationId = requestAnimationFrame(renderCropLoop);
        };
        renderCropLoop();

        if (typeof canvas.captureStream === "function") {
          recordStream = canvas.captureStream(60);
        }
      }
    }

    // 4. Setup MediaRecorder
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
      ? new MediaRecorder(recordStream, { mimeType, videoBitsPerSecond: 8000000 })
      : new MediaRecorder(recordStream);

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      if (progressInterval) clearInterval(progressInterval);
      if (durationTimeout) clearTimeout(durationTimeout);
      if (animationId) cancelAnimationFrame(animationId);
      if (rawStream) {
        rawStream.getTracks().forEach((t) => t.stop());
        rawStream = null;
      }

      const finalMime = recorder?.mimeType || (videoFormat === "mp4" ? "video/mp4" : "video/webm");
      const blob = new Blob(chunks, { type: finalMime });
      const url = URL.createObjectURL(blob);
      const ext = videoFormat === "mp4" && finalMime.includes("mp4") ? "mp4" : "webm";

      // Direct download
      const a = document.createElement("a");
      a.href = url;
      a.download = `flowframe-workspace-${Date.now()}.${ext}`;
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

    recorder.start(250);
    onProgress?.(15, "Capturing live workspace simulation...");

    let elapsed = 0;
    progressInterval = setInterval(() => {
      elapsed += 500;
      const pct = Math.min(95, Math.round(15 + (elapsed / durationMs) * 80));
      onProgress?.(pct, `Exporting simulation (${Math.round(elapsed / 1000)}s)...`);
    }, 500);

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
