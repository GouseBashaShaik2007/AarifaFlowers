// Browser only. Never import this file from server code.
//
// Helpers for adding a video in the admin page: check that the browser can play it, take a preview picture
// from it, and upload it with a progress bar.

import { prepareForUpload } from "./clientImages";
import { MAX_VIDEO_BYTES } from "./videos";

export type VideoInfo = {
  duration: number;
  width: number;
  height: number;
  /** A picture taken from the video, for use as the preview picture. Null if it could not be made. */
  poster: Blob | null;
};

const CANNOT_PLAY =
  "This video cannot be played by the browser. Please use an MP4 made with H.264. From an iPhone, choose Most Compatible in the Camera settings, or export the video as MP4.";

/** Loads the video in the browser to prove it plays, then grabs a picture about one second in. */
export function inspectVideo(file: File): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    let finished = false;
    const finish = (run: () => void) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
      run();
    };
    const timer = setTimeout(() => finish(() => reject(new Error(CANNOT_PLAY))), 20_000);

    video.onerror = () => finish(() => reject(new Error(CANNOT_PLAY)));
    video.onloadeddata = () => {
      const target = Math.min(1, (Number.isFinite(video.duration) ? video.duration : 1) / 2);
      video.currentTime = target;
    };
    video.onseeked = () => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      if (!width || !height) return finish(() => reject(new Error(CANNOT_PLAY)));

      // Make the preview picture no wider than 720 pixels.
      const scale = Math.min(1, 720 / width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (poster) => finish(() => resolve({ duration, width, height, poster })),
        "image/jpeg",
        0.85,
      );
    };
    video.src = url;
  });
}

/** Sends the video to the website with a progress report from 0 to 100. Resolves with the video address. */
export function uploadVideoFile(file: File, onProgress: (percent: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_VIDEO_BYTES) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      return reject(new Error(`This video is ${mb} MB. The limit is ${MAX_VIDEO_BYTES / 1024 / 1024} MB. Shorten or compress it and try again.`));
    }
    const form = new FormData();
    form.append("file", file, file.name);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload-video");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () => reject(new Error("The upload was interrupted. Check your connection and try again."));
    xhr.onload = () => {
      let data: { url?: string; error?: string } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // Not JSON, for example an error page from the host. The status code below still tells us what happened.
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.url) return resolve(data.url);
      console.error("Video upload failed", xhr.status, data);
      reject(new Error(data.error || (xhr.status === 401 ? "Please log in again." : `Upload failed (error ${xhr.status}). Please try again.`)));
    };
    xhr.send(form);
  });
}

/** Turns a picture taken from a video into a normal preview picture and uploads it. Resolves with its address. */
export async function uploadPosterBlob(blob: Blob): Promise<string> {
  const { full, thumb } = await prepareForUpload(blob);
  const form = new FormData();
  form.append("file", full, "poster.webp");
  form.append("thumb", thumb, "thumb-poster.webp");
  const res = await fetch("/api/admin/upload", { method: "POST", body: form });
  let data: { url?: string; error?: string } = {};
  try {
    data = await res.json();
  } catch {
    // Not JSON. The generic message below covers it.
  }
  if (!res.ok || !data.url) throw new Error(data.error || `The preview picture could not be saved (error ${res.status}).`);
  return data.url;
}
