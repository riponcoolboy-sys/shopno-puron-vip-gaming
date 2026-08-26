// src/utils/aviatorCanvas.ts

// ১. নতুন প্লেন ইমেজ লোড করা
export const planeImg: HTMLImageElement | null = typeof window !== 'undefined' ? new Image() : null;
if (planeImg) {
  planeImg.src = "https://i.ibb.co/Xkz6ptFB/plane.png";
}

// ২. ক্যানভাসে আঁকার ফাংশন (drawPlane / render)
export function drawPlane(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  size: number = 50
) {
  if (planeImg && planeImg.complete && planeImg.naturalWidth !== 0) {
    // প্লেনের সাইজ ক্যানভাসে ৫০x৫০ পিক্সেল করে দেওয়া হলো
    ctx.drawImage(planeImg, x - 25, y - 25, 50, 50);
  }
}

