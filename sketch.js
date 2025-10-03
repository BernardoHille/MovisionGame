// p5.js + ml5.js (PoseNet) – compatível com iPhone
let video, poseNet, poses = [];
let started = false, startBtn;

function setup() {
  pixelDensity(1); // iOS pode ficar instável com densidade > 1
  createCanvas(windowWidth, windowHeight);

  // Botão para garantir gesto do usuário antes de abrir a câmera
  startBtn = createButton('Ativar câmera');
  startBtn.style('padding', '12px 18px');
  startBtn.style('font-size', '16px');
  startBtn.mousePressed(startCamera);
}

function startCamera() {
  if (started) return;
  started = true;
  startBtn.remove();

  // Pedir câmera com preferências (troque para 'environment' se quiser traseira)
  const constraints = {
    audio: false,
    video: { facingMode: 'user', width: 360, height: 270 }
  };

  video = createCapture(constraints, () => {
    // atributos exigidos no iOS
    video.elt.setAttribute('playsinline', ''); // não entrar em fullscreen
    video.elt.setAttribute('autoplay', '');    // autoplay permitido
    video.elt.muted = true;                    // autoplay só rola mutado no iOS
    video.size(360, 270);
    video.hide();
  });

  // Só inicializa o PoseNet quando o vídeo puder tocar
  const initModel = () => {
    poseNet = ml5.poseNet(video, { detectionType: 'single' }, () => {
      // modelo carregado
      // opcional: console.log('PoseNet pronto');
    });
    poseNet.on('pose', (results) => (poses = results));
  };

  if (video && video.elt) {
    if (video.elt.readyState >= 2) {
      initModel();
    } else {
      video.elt.addEventListener('canplay', initModel, { once: true });
    }
  }
}

function draw() {
  background(0);
  if (video) {
    // Preenche a tela mantendo proporção
    const aspect = video.width / video.height;
    let w = width, h = w / aspect;
    if (h < height) { h = height; w = h * aspect; }
    image(video, (width - w) / 2, (height - h) / 2, w, h);

    // Desenha pontos/articulações
    noStroke();
    fill(0, 255, 0);
    if (poses.length > 0) {
      const kp = poses[0].pose.keypoints;
      for (const k of kp) {
        if (k.score > 0.3) {
          const sx = map(k.position.x, 0, video.width, (width - w) / 2, (width + w) / 2);
          const sy = map(k.position.y, 0, video.height, (height - h) / 2, (height + h) / 2);
          circle(sx, sy, 8);
        }
      }
    }
  } else {
    // instrução inicial
    push();
    fill(255);
    textAlign(CENTER, CENTER);
    text('Toque em "Ativar câmera" para iniciar', width / 2, height / 2);
    pop();
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
