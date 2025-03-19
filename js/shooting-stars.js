class ShootingStar {
    constructor(canvas, ctx, options = {}) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.x = 0;
        this.y = 0;
        this.angle = 0;
        this.scale = 1;
        this.speed = options.speed || (Math.random() * 20 + 10);
        this.distance = 0;
        this.starColor = options.starColor || '#9E00FF';
        this.trailColor = options.trailColor || '#2EB9DF';
        this.init();
    }

    init() {
        const side = Math.floor(Math.random() * 4);
        const offset = Math.random() * this.canvas.width;

        switch (side) {
            case 0:
                this.x = offset;
                this.y = 0;
                this.angle = 45;
                break;
            case 1:
                this.x = this.canvas.width;
                this.y = offset;
                this.angle = 135;
                break;
            case 2:
                this.x = offset;
                this.y = this.canvas.height;
                this.angle = 225;
                break;
            case 3:
                this.x = 0;
                this.y = offset;
                this.angle = 315;
                break;
        }
    }

    move() {
        this.x += this.speed * Math.cos((this.angle * Math.PI) / 180);
        this.y += this.speed * Math.sin((this.angle * Math.PI) / 180);
        this.distance += this.speed;
        this.scale = 1 + this.distance / 100;

        if (
            this.x < -20 ||
            this.x > this.canvas.width + 20 ||
            this.y < -20 ||
            this.y > this.canvas.height + 20
        ) {
            this.init();
            this.distance = 0;
            this.scale = 1;
        }
    }

    draw() {
        const gradient = this.ctx.createLinearGradient(
            this.x,
            this.y,
            this.x + 10 * this.scale,
            this.y
        );
        gradient.addColorStop(0, this.trailColor + '00');
        gradient.addColorStop(1, this.starColor);

        this.ctx.save();
        this.ctx.translate(this.x + (10 * this.scale) / 2, this.y + 0.5);
        this.ctx.rotate((this.angle * Math.PI) / 180);
        this.ctx.translate(-(this.x + (10 * this.scale) / 2), -(this.y + 0.5));

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(this.x, this.y, 10 * this.scale, 1);
        this.ctx.restore();
    }
}

class StarryBackground {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.stars = [];
        this.init();
    }

    init() {
        document.body.prepend(this.canvas);
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '-1';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.background = 'radial-gradient(ellipse at center, #1B2735 0%, #090A0F 100%)';

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Create multiple shooting stars with different colors
        for (let i = 0; i < 3; i++) {
            this.stars.push(
                new ShootingStar(this.canvas, this.ctx, {
                    starColor: ['#9E00FF', '#FF0099', '#00FF9E'][i],
                    trailColor: ['#2EB9DF', '#FFB800', '#00B8FF'][i],
                    speed: Math.random() * 20 + 10
                })
            );
        }

        this.createStarryBackground();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createStarryBackground() {
        const stars = 200;
        for (let i = 0; i < stars; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const size = Math.random() * 2;
            const opacity = Math.random() * 0.5 + 0.5;

            this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            this.ctx.fillRect(x, y, size, size);
        }
    }

    animate() {
        this.ctx.fillStyle = 'rgba(9, 10, 15, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.stars.forEach(star => {
            star.move();
            star.draw();
        });

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize the starry background
document.addEventListener('DOMContentLoaded', () => {
    new StarryBackground();
});
