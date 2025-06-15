
import { Physics, BoxCollider, world } from "./physics";
import { Player } from "./player";
import { HealthBar, Timer } from "./ui";
import { Input } from "./input";
import { RemoteInput } from "./remoteInput";

class Ground{

    physics: Physics = new Physics();
    collider: BoxCollider = new BoxCollider(this.physics, 2000, 20, -100, 0);

    constructor(){
        this.physics.transform.x = 10;
        this.physics.transform.y = 105;
        this.physics.gravity = 0;
        this.collider.tag = 'Ground';
    }

    render(ctx: CanvasRenderingContext2D, dt: number){
        this.collider.render(ctx);
    }
}

class LeftWall{
    physics: Physics = new Physics();
    collider: BoxCollider = new BoxCollider(this.physics, 20, 500, 0, 0);

    constructor(){
        this.physics.transform.x = -18;
        this.physics.transform.y = 0;
        this.physics.gravity = 0;
        this.collider.tag = 'left-wall';
    }
    render(ctx: CanvasRenderingContext2D, dt: number){
        this.collider.render(ctx);
    }
}

class RightWall{
    physics: Physics = new Physics();
    collider: BoxCollider = new BoxCollider(this.physics, 20, 500, 100, 0);


    constructor(){
        this.physics.transform.x = 155;
        this.physics.transform.y = 0;
        this.physics.gravity = 0;
        this.collider.tag = 'left-wall';
    }
    render(ctx: CanvasRenderingContext2D, dt: number){
        this.collider.render(ctx);
    }
}

class Background{
    image: HTMLImageElement
    constructor(){
        this.image = document.createElement('img');
        this.image.src = 'background.png';
    }
    render(ctx: CanvasRenderingContext2D, dt: Number){
        ctx.drawImage(this.image, 0, 0, 320, 180, 0, 0, 320, 120);
    }
}

export default class GameWindow{

    ctx : CanvasRenderingContext2D;
    height: number;
    width: number;
    player: Player = new Player('player1');
    player2: Player = new Player('player2');
    localPlay: boolean = false;
    ground: Ground = new Ground();
    leftWall: LeftWall = new LeftWall();
    rightWall: RightWall = new RightWall();
    background: Background = new Background();
    healthBarPlayer1: HealthBar;
    timer: Timer ;
    input: Input;
    remoteInput: RemoteInput;
    
    tipDiv: HTMLDivElement

    constructor(localPlay: boolean = false){
        this.height = 128;
        this.width = 256;
        this.localPlay = localPlay;
        this.init();
        
        this.player2.flipHorizontally();
        this.player2.physics.transform.x = 200;
        this.player.physics.transform.x = 50; 

        if (this.localPlay) {
            // Local play mode
            this.input = new Input(this.player.inputBuffer, null, 1); // Player 1
            new Input(this.player2.inputBuffer, null, 2);          // Player 2

            this.player.ready = true;
            this.player2.ready = true;
            this.tipDiv.style.display = 'none'; // Players are ready, no need for "Press space"
            this.startGameLoop();
        } else {
            // Remote play logic
            // RemoteInput constructor likely takes the buffer of the player whose actions are TO BE SENT.
            // this.input will be for the locally controlled player on this client.
            // RemoteInput's internal 'inputBuffer' property will be for the player whose actions are RECEIVED.
            this.remoteInput = new RemoteInput(this.player.inputBuffer); // Default for player1 if creator, will be re-assigned if joiner

            this.remoteInput.onconnection = () => {
                if (this.remoteInput.creator) {
                    // CREATOR: Player 1 is LOCAL, Player 2 is REMOTE
                    // RemoteInput sends data from player.inputBuffer (P1)
                    // this.remoteInput an instance of RemoteInput was already created with this.player.inputBuffer

                    // Local keyboard handler for Player 1 (creator), sends data over channel. Uses P1 keys.
                    this.input = new Input(this.player.inputBuffer, this.remoteInput.dataChannel, 1);
                    // RemoteInput must be configured to update player2.inputBuffer upon receiving data.
                    this.remoteInput.inputBuffer = this.player2.inputBuffer;
                } else {
                    // JOINER: Player 2 is LOCAL, Player 1 is REMOTE
                    // RemoteInput needs to send data from player2.inputBuffer (P2)
                    // Re-initialize or update RemoteInput to use player2's buffer for sending.
                    // This is tricky without knowing RemoteInput's internals.
                    // For now, let's assume RemoteInput's constructor argument is final for sending.
                    // This implies the initial `new RemoteInput(this.player.inputBuffer)` might be an issue for the joiner.
                    // However, changing RemoteInput is out of scope. We focus on Input class usage.

                    // The joiner controls Player 2 locally.
                    // Local keyboard handler for Player 2 (joiner), sends data over channel. Uses P1 keys by default.
                    this.input = new Input(this.player2.inputBuffer, this.remoteInput.dataChannel, 1);
                    // RemoteInput must be configured to update player1.inputBuffer upon receiving data.
                    this.remoteInput.inputBuffer = this.player.inputBuffer;
                }
                this.remoteInput.hideDomElements();
                this.startGameLoop();
                this.tipDiv.style.display = 'block';
            }
        }

        // Commented out old test code
        // this.startGameLoop();
        // this.player.ready = true;
        // this.input = new Input(this.player2.inputBuffer, null);
        // this.player2.ready = true;
    }

    init(){
        let body = document.getElementsByTagName('body')[0];

        let mainDiv = document.createElement('div');
        mainDiv.id = 'canvas-container'
        body.appendChild(mainDiv);

        let resultDiv = document.createElement('div');
        resultDiv.id = 'result-container';
        body.appendChild(resultDiv);
        resultDiv.innerText = 'You Won';

        this.tipDiv = document.createElement('div');
        body.appendChild(this.tipDiv);
        this.tipDiv.innerText = 'Press space to start!';
        this.tipDiv.id = 'tip';

        let canvas = document.createElement('canvas');
        canvas.height = this.height;
        canvas.width = this.width;
        mainDiv.appendChild(canvas);

        this.healthBarPlayer1 = new HealthBar(mainDiv);
        this.timer = new Timer(mainDiv);

        let ctx = canvas.getContext('2d');
        if(ctx != null){
            this.ctx = ctx;
        }
    }

    

    render(dt: number){
        this.background.render(this.ctx, dt);
        this.ground.render(this.ctx, dt);
        this.leftWall.render(this.ctx, dt);
        this.rightWall.render(this.ctx, dt);
        this.player.render(this.ctx, dt);
        this.player2.render(this.ctx, dt);
    }

    update(dt: number){
        this.healthBarPlayer1.udpate(this.player.health, this.player2.health);
        if(
            (this.player2.flipx && this.player2.physics.transform.x < this.player.physics.transform.x) 
            || (!this.player2.flipx && this.player2.physics.transform.x > this.player.physics.transform.x)
        ){
            this.player.flipHorizontally();
            this.player2.flipHorizontally();
        }
        this.player.update(dt);
        this.player2.update(dt);
    }

    displayResult(){
        let text = 'Player Won';
        if(this.player.health > this.player2.health){
            if(this.remoteInput.creator){
                text = 'You Won!';
            }else{
                text = 'You Lost...';
            }
        }else if(this.player2.health > this.player.health){
            if(this.remoteInput.creator){
                text = 'You Lost...';
            }else{
                text = 'You Won!';
            }
        }else{
            text = 'Draw';
        }

        document.getElementById('result-container').innerText = text;
        document.getElementById('result-container').style.display = 'block';

        setTimeout(() => {
            this.tipDiv.style.display = 'block'; 
            this.player.ready = false; 
            this.player2.ready = false;
            this.player2.health = 100;
            this.player2.physics.transform.x = 200;
            this.player.physics.transform.x = 20;
            this.player.health = 100;
            this.timer.time = 60;
            this.startGameLoop();
        }, 2000);
    }

    startGameLoop(){
        //wait for 0.5 sec and wait if the players are not ready
        if(!this.player.ready || !this.player2.ready){
            this.player.updateReadyStatus();
            this.player2.updateReadyStatus();
            setTimeout(() => {this.startGameLoop()}, 50);
            return;
        }
        this.tipDiv.style.display = 'none';
        document.getElementById('result-container').style.display = 'none';

        let prevTime = 0;
        let deadWaitTime = 0;

        let animate = (timestamp: number) =>{

            let dt = timestamp - prevTime;

            if( dt > 20 || prevTime == 0){
                world.checkCollision();
                this.render(dt);
                this.update(20);
                this.timer.update(dt);
                if(this.timer.time <=0 || this.player.health <= 0 || this.player2.health <= 0){
                    deadWaitTime += dt;
                    if(deadWaitTime > 2000){
                        this.displayResult();
                        this.player2.ready = false;
                        this.player.ready = false;
                        return;
                    }
                }
                prevTime = timestamp;
            }

            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
    }

};
