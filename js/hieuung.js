// Cài đặt thông số và tự căn chỉnh lớp của <canva> khi thu hẹp cửa sổ
(function () {
  const CONFIG = {
    snowflakeCount: 20,
    color: "228, 213, 232",
    minOpacity: 0.5,
    maxOpacity: 1,
    minSize: 15,
    maxSize: 30,
    minSpeedY: 1,
    maxSpeedY: 3,
    speedX: 2.5,
    swingStrength: 1.5,
    rotationSpeed: 0.05,
  };

  const canvas = document.getElementById("pinkSnowCanvas");
  const ctx = canvas.getContext("2d"); // Mọi nét vẽ đều do ctx ( context ) thực hiện

  let width = window.innerWidth;
  let height = window.innerHeight;

  canvas.width = width;
  canvas.height = height;

  window.addEventListener("resize", function () {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  });

  // Hàm khỏi tạo và tái sinh ( random )

  let flakes = [];

  class Flake {
    constructor() {
      //Khởi tạo
      this.reset(true);
    }

    reset(initial = false) {
      this.size =
        Math.random() * (CONFIG.maxSize - CONFIG.minSize) + CONFIG.minSize;
      this.speedY =
        Math.random() * (CONFIG.maxSpeedY - CONFIG.minSpeedY) +
        CONFIG.minSpeedY;

      this.speedX = CONFIG.speedX + (Math.random() - 0.5);

      this.swing = Math.random() * Math.PI * 2;
      this.swingStep = Math.random() * 0.02 + 0.01;
      this.opacity =
        Math.random() * (CONFIG.maxOpacity - CONFIG.minOpacity) +
        CONFIG.minOpacity;

      this.rotation = Math.random() * Math.PI * 2;
      this.rotationDirection = Math.random() > 0.5 ? 1 : -1;
      this.rotationSpeed =
        Math.random() * CONFIG.rotationSpeed * this.rotationDirection;

      if (initial) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
      } else {
        if (Math.random() > 0.5) {
          this.x = Math.random() * width + width * 0.2;
          this.y = -this.size - 10;
        } else {
          this.x = width + this.size + 10;
          this.y = Math.random() * (height * 0.8);
        }
      }
    }

    update() {
      this.swing += this.swingStep;
      this.rotation += this.rotationSpeed;

      this.y += this.speedY;

      this.x -= this.speedX + Math.sin(this.swing) * CONFIG.swingStrength;

      if (this.y > height + this.size || this.x < -this.size) {
        this.reset();
      }
    }
    // Vẽ lên màn hình
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);

      ctx.fillStyle = `rgba(${CONFIG.color}, ${this.opacity})`;
      ctx.font = `${this.size}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("❤", 0, 0);

      ctx.restore();
    }
  }

  function init() {
    // Khởi tạo
    flakes = [];
    for (let i = 0; i < CONFIG.snowflakeCount; i++) {
      flakes.push(new Flake());
    }
    animate();
  }

  function animate() {
    //animate() -> Xóa màn hình -> Tính vị trí mới -> Vẽ lại -> Lặp lại
    ctx.clearRect(0, 0, width, height);
    for (let flake of flakes) {
      flake.update();
      flake.draw();
    }
    requestAnimationFrame(animate);
  }

  init();
})();
