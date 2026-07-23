import * as skinview3d from 'skinview3d';

// Attach to window so any legacy or inline scripts can access it safely
(window as any).skinview3d = skinview3d;

// Helper to generate Kyranzo's custom skin PNG data URL
export function createKyranzoSkinPNG(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, 64, 64);

  const fill = (x: number, y: number, w: number, h: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, h);
  };

  const SKIN = '#e0a075';
  const HAIR = '#1f1a17';
  const MASK = '#111827';
  const BLUE_MAIN = '#3882ff';
  const BLUE_LIGHT = '#6db2ff';
  const PANTS = '#1a2332';
  const SHOES = '#6db2ff';
  const WHITE = '#ffffff';

  // Head Base
  fill(0, 0, 32, 16, HAIR);
  fill(8, 8, 8, 8, SKIN);
  fill(8, 8, 8, 3, HAIR);
  fill(8, 12, 8, 4, MASK);
  fill(9, 11, 2, 1, WHITE);
  fill(10, 11, 1, 1, BLUE_MAIN);
  fill(13, 11, 2, 1, WHITE);
  fill(13, 11, 1, 1, BLUE_MAIN);

  // Head Layer 2 Hoodie
  fill(32, 0, 32, 16, BLUE_MAIN);
  ctx.clearRect(40, 8, 8, 8);
  fill(40, 8, 8, 1, BLUE_LIGHT);
  fill(40, 8, 1, 8, BLUE_LIGHT);
  fill(47, 8, 1, 8, BLUE_LIGHT);

  // Body Torso
  fill(16, 16, 24, 16, BLUE_MAIN);
  fill(20, 20, 8, 12, BLUE_MAIN);
  fill(20, 20, 8, 2, BLUE_LIGHT);
  fill(20, 24, 8, 2, BLUE_LIGHT);
  fill(23, 21, 1, 5, WHITE);
  fill(24, 21, 1, 5, WHITE);
  fill(16, 28, 24, 4, MASK);

  // Right Arm
  fill(40, 16, 16, 16, BLUE_MAIN);
  fill(40, 28, 16, 2, MASK);
  fill(40, 30, 16, 2, WHITE);
  fill(44, 28, 4, 4, SKIN);

  // Left Arm
  fill(32, 48, 16, 16, BLUE_MAIN);
  fill(32, 60, 16, 2, MASK);
  fill(32, 62, 16, 2, WHITE);

  // Right Leg
  fill(0, 16, 16, 16, PANTS);
  fill(0, 28, 16, 4, SHOES);
  fill(4, 28, 4, 2, WHITE);

  // Left Leg
  fill(16, 48, 16, 16, PANTS);
  fill(16, 60, 16, 4, SHOES);
  fill(20, 60, 4, 2, WHITE);

  return canvas.toDataURL('image/png');
}

(window as any).createKyranzoSkinPNG = createKyranzoSkinPNG;

function enableViewerControls(viewer: any) {
  try {
    if (typeof (skinview3d as any).createOrbitControls === 'function') {
      (skinview3d as any).createOrbitControls(viewer);
    } else if (viewer.controls) {
      if ('enableZoom' in viewer.controls) {
        viewer.controls.enableZoom = false;
      }
    } else if (typeof (skinview3d as any).OrbitControls === 'function') {
      new (skinview3d as any).OrbitControls(viewer.camera, viewer.canvas);
    }
  } catch (e) {
    console.warn('Controls setup warning:', e);
  }
}

// Auto-initialize index gateway viewer if element present
function initGatewayViewer() {
  const canvas = document.getElementById('gateway-skin-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;

  try {
    const viewer = new skinview3d.SkinViewer({
      canvas: canvas,
      width: canvas.parentElement?.clientWidth || 320,
      height: canvas.parentElement?.clientHeight || 400,
      skin: '/minecraft.png'
    });

    enableViewerControls(viewer);
    viewer.autoRotate = false;
    viewer.animation = null;

    const handleResize = () => {
      if (canvas.parentElement) {
        viewer.width = canvas.parentElement.clientWidth;
        viewer.height = canvas.parentElement.clientHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 150);
  } catch (err) {
    console.error('Failed to init gateway skin viewer:', err);
  }
}

// Auto-initialize minecraft.html 3D viewers if elements present
const minecraftViewers: Record<string, any> = {};
const runStates: Record<string, boolean> = { java: false, bedrock: false, multicraft: false };

function initMinecraftViewers() {
  const javaCanvas = document.getElementById('java-skin-canvas');
  if (!javaCanvas) return; // Not on minecraft page

  const setup = (id: string, animType: string, skinUrl: string) => {
    const canvas = document.getElementById(`${id}-skin-canvas`) as HTMLCanvasElement | null;
    if (!canvas) return;

    try {
      const viewer = new skinview3d.SkinViewer({
        canvas: canvas,
        width: canvas.parentElement?.clientWidth || 320,
        height: canvas.parentElement?.clientHeight || 380,
        skin: skinUrl
      });

      enableViewerControls(viewer);
      viewer.autoRotate = false;
      viewer.animation = null;

      minecraftViewers[id] = viewer;
    } catch (e) {
      console.error(`Error setting up ${id} viewer:`, e);
    }
  };

  setup('java', 'walk', '/minecraft.png');
  setup('bedrock', 'run', '/minecraft.png');
  setup('multicraft', 'run', '/multicraft.png');

  const handleResize = () => {
    Object.keys(minecraftViewers).forEach(key => {
      const v = minecraftViewers[key];
      if (v && v.canvas && v.canvas.parentElement) {
        v.width = v.canvas.parentElement.clientWidth;
        v.height = v.canvas.parentElement.clientHeight;
      }
    });
  };
  window.addEventListener('resize', handleResize);
  setTimeout(handleResize, 150);
}

// Toggle run/stop handler for minecraft page
(window as any).toggleRun = function(key: string) {
  const v = minecraftViewers[key];
  const labelEl = document.getElementById(`label-${key}`);
  if (!v) return;

  runStates[key] = !runStates[key];

  if (runStates[key]) {
    v.animation = key === 'java' ? new skinview3d.WalkingAnimation() : new skinview3d.RunningAnimation();
    v.autoRotate = true;
    if (labelEl) labelEl.textContent = 'Pause';
    showToast(`${key.toUpperCase()} animation started!`);
  } else {
    v.animation = null;
    v.autoRotate = false;
    if (labelEl) labelEl.textContent = 'Run';
    showToast(`${key.toUpperCase()} animation paused.`);
  }
};

function showToast(msg: string) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message') || document.getElementById('toast-msg');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = msg;
  toast.classList.remove('translate-y-20', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 2500);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initGatewayViewer();
    initMinecraftViewers();
  });
} else {
  initGatewayViewer();
  initMinecraftViewers();
}
