// logic/aviatorCanvas.js

// ১. নতুন প্লেন ইমেজ লোড করা
const planeImg = typeof window !== 'undefined' ? new Image() : { complete: false, src: 'https://i.ibb.co/Xkz6ptFB/plane.png' };
if (typeof window !== 'undefined') {
    planeImg.src = 'https://i.ibb.co/Xkz6ptFB/plane.png'; // নতুন প্লেন ছবির ডাইরেক্ট লিঙ্ক
}

// ২. ক্যানভাসে আঁকার ফাংশন (drawPlane / render)
function drawPlane(ctx, x, y, size = 50) {
    if (planeImg && planeImg.complete) {
        // প্লেনের সাইজ ক্যানভাসে ৫০x৫০ পিক্সেল করে দেওয়া হলো
        ctx.drawImage(planeImg, x - 25, y - 25, 50, 50); 
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { planeImg, drawPlane };
}
