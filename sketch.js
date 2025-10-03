/*
 * ml5.js + p5.js — BodyPose centralizado e responsivo
 */

let video;
let bodyPose;
let poses = [];
let connections;

// Ajustes de desenho
const MIN_POINT_SIZE = 4;
const BASE_POINT_SIZE = 8;
const MIN_STROKE = 1.5;
const BASE_STROKE = 2.5;

function preload() {
  // Carrega o modelo
  bodyPose = ml5.bodyPose();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1); // ajuda em mobiles com DPR alto

  // Webcam com preferência pela câmera frontal e boa resolução
  const constraints = {
    video: {
      facingMode: "user",
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  };

  video = createCapture(constraints);
  video.hide();

  // Inicia a detecção
  bodyPose.detectStart(video, gotPoses);

  // Compat: algumas versões usam getConnections, outras getSkeleton
  connections = (bodyPose.getConnections && bodyPose.getConnections()) || bodyPose.getSkeleton();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Converte coordenadas do vídeo para o canvas, preservando proporção e centralizando
function computeFit() {
  const vW = video?.elt?.videoWidth || video?.width || 640;
  const vH = video?.elt?.videoHeight || video?.height || 480;

  const s = Math.min(width / vW, height / vH); // "contain"
  const drawW = vW * s;
  const drawH = vH * s;
  const offsetX = (width - drawW) * 0.5;
  const offsetY = (height - drawH) * 0.5;
  return { vW, vH, s, drawW, drawH, offsetX, offsetY };
}

function draw() {
  background(0);

  const { s, drawW, drawH, offsetX, offsetY } = computeFit();

  // 🔁 Espelhar (opcional): ative para “selfie”
  // push();
  // translate(width, 0);
  // scale(-1, 1);

  // Desenha o vídeo centralizado
  image(video, offsetX, offsetY, drawW, drawH);

  // Desenha conexões (ossos) e pontos, já escalando as coordenadas
  const strokeW = max(MIN_STROKE, BASE_STROKE * s);
  const pointSize = max(MIN_POINT_SIZE, BASE_POINT_SIZE * s);

  // Conexões
  stroke(255, 0, 0);
  strokeWeight(strokeW);
  noFill();

  for (let i = 0; i < poses.length; i++) {
    const pose = poses[i];
    for (let j = 0; j < connections.length; j++) {
      const [aIdx, bIdx] = connections[j];
      const A = pose.keypoints[aIdx];
      const B = pose.keypoints[bIdx];
      if (A && B && A.confidence > 0.1 && B.confidence > 0.1) {
        const ax = offsetX + A.x * s;
        const ay = offsetY + A.y * s;
        const bx = offsetX + B.x * s;
        const by = offsetY + B.y * s;
        line(ax, ay, bx, by);
      }
    }
  }

  // Pontos
  noStroke();
  fill(0, 255, 0);
  for (let i = 0; i < poses.length; i++) {
    const pose = poses[i];
    for (let k = 0; k < pose.keypoints.length; k++) {
      const kp = pose.keypoints[k];
      if (kp.confidence > 0.1) {
        const x = offsetX + kp.x * s;
        const y = offsetY + kp.y * s;
        circle(x, y, pointSize);
      }
    }
  }

  // if (espelhado) pop(); // (se usar o push/scale acima)
}

function gotPoses(results) {
  poses = results || [];
}
