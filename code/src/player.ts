import { PlayerAnimator, SpriteSheet, FireBallAnimator} from "./animation";
import { Physics, BoxCollider, Transform, world } from "./physics";
import { InputBuffer } from "./input";

const playerSpriteSheet = new SpriteSheet('sprite', [4, 8, 8, 10, 9, 7, 6, 8, 13, 10, 12, 6, 8, 8, 8, 6], 64, 64, 1024);
const fireSpriteSheet = new SpriteSheet('energy_effect_base', [7], 32, 32, 512);

class FireBall{
    physics : Physics = new Physics();
    collider: BoxCollider = new BoxCollider(this.physics, 7, 7, 4, -4);
    flipx : boolean = false;
    animator: PlayerAnimator;

    constructor(playerPosition: Transform, flip: boolean, speed: number, player: string){
        this.animator = new FireBallAnimator(fireSpriteSheet, new Transform(0, -6, 0.5));
        this.physics.transform.x = playerPosition.x;
        this.physics.transform.y = playerPosition.y;
        this.physics.gravity = 0;
        this.collider.tag = 'fireball'+player;
        this.physics.velocity.x = speed;
        if(flip){
            this.physics.velocity.x = -speed;
            this.flipHorizontally();
        }
    }

    render(ctx: CanvasRenderingContext2D, dt: number){
        this.collider.render(ctx);
        this.animator.render(ctx, dt, this.physics.transform);
    }

    update(dt: number){
        this.physics.update(dt);
    }

    flipHorizontally(){
        this.flipx = true;
        this.animator.flipx = true;
    }
}


class Player {

    physics : Physics = new Physics();
    collider: BoxCollider = new BoxCollider(this.physics, 9, 28, -4.5, -14);
    animator: PlayerAnimator;
    charging: Boolean = false;
    chargingTime: number = 0;
    grouded: Boolean = false;
    inputBuffer: InputBuffer = new InputBuffer();

    // Dash properties
    canDash: boolean = true;
    dashCooldownTime: number = 1000; // milliseconds
    dashDurationTime: number = 150;  // milliseconds
    dashSpeedValue: number = 350;    // pixels per second
    isDashing: boolean = false;
    dashTimerValue: number = 0;      // milliseconds
    originalGravity: number = 0;    // To store gravity before dash


    ready: Boolean = false;

    hitboxes: Map<string, BoxCollider> = new Map();
    flipx : boolean = false;
    health: number = 100;
    name : string;

    fireballs: Array<FireBall>

    constructor(name: string){
        this.name = name;
        this.animator = new PlayerAnimator(playerSpriteSheet, new Transform(-32, -40, 1));
        
        this.physics.gravity = 200;
        this.physics.transform.y = 50;
        this.grouded = false;
        
        this.fireballs = []
        this.createHitboxes();
        
        
        this.collider.onCollision = (col: BoxCollider, overlap: number, direction: string) => {
            if(col.tag == 'Ground'){
                this.grouded = true;
                
            }
            if(col.tag.includes('fireball') ){
                if(col.tag.includes(this.name)){
                    return
                }
                this.health = this.health - 10;
                this.physics.transform.x = Math.ceil(this.physics.transform.x - overlap);
                col.active = false;
            }
            if(direction == 'Y'){
                this.physics.velocity.y = 0;
                this.physics.transform.y = Math.ceil(this.physics.transform.y - overlap);
            }else{
                this.physics.velocity.x = 0;
                this.physics.transform.x = Math.ceil(this.physics.transform.x - overlap);
            }
            if(col.tag == 'upperCut'){
                this.physics.velocity.y = -100;
            }
            if(col.tag == 'upperCut' || col.tag == 'fightKick' || col.tag == 'quickPunch'){
                this.health = this.health - 10;
                col.active = false;
            }
            

        }
    }

    flipHorizontally(){
        this.flipx = !this.flipx;
        this.animator.flipx = this.flipx;
        this.hitboxes.forEach((col: BoxCollider, key: string)=>{
            col.offset.x = -col.offset.x;
        });
    }

    createHitboxes(){
        this.hitboxes.set('quickPunch',  new BoxCollider(this.physics, 7, 7, 14, -2));
        this.hitboxes.get('quickPunch').active = false;
        this.hitboxes.get('quickPunch').tag = 'quickPunch';

        this.hitboxes.set('fightKick',  new BoxCollider(this.physics, 7, 7, 14, -4));
        this.hitboxes.get('fightKick').active = false;
        this.hitboxes.get('fightKick').tag = 'fightKick';

        this.hitboxes.set('upperCut', new BoxCollider(this.physics, 7, 10, 14, -6));
        this.hitboxes.get('upperCut').active = false;
        this.hitboxes.get('upperCut').tag = 'upperCut';
    }

    render(ctx: CanvasRenderingContext2D, dt: number){
        for(let fireball of this.fireballs){
            fireball.render(ctx, dt);
        }
        this.physics.render(ctx);
        this.animator.render(ctx, dt, this.physics.transform);
        this.collider.render(ctx);
    }

    activateHitbox(name: string, delay: number, activeTime: number): boolean{
        setTimeout(() => {
            this.hitboxes.get(name).active=true;
            this.deactivateHitbox(name, activeTime);
        }, delay);
        return true;
    }

    deactivateHitbox(name: string, activeTime: number){
        setTimeout(() => {
            this.hitboxes.get(name).active=false;
        }, activeTime);
    }

    moves(){
        // Dash logic
        if (this.isDashing) {
            // Player is currently dashing, no other moves allowed
            return;
        }

        if (this.inputBuffer.c && this.canDash) {
            this.isDashing = true;
            this.canDash = false;
            this.dashTimerValue = 0;
            this.originalGravity = this.physics.gravity; // Store original gravity
            this.physics.gravity = 0; // Disable gravity during dash
            this.physics.velocity.y = 0; // Stop vertical movement

            // Optional: Play dash animation here
            // this.animator.play('dash_animation_name');

            setTimeout(() => {
                this.canDash = true;
            }, this.dashCooldownTime);
            return; // Dash action taken, skip other moves for this frame
        }

        if(this.charging){
            this.chargingTime += 10;
            if(!this.inputBuffer.y){
                if(this.chargingTime > 200){
                    this.animator.cancelAndPlayMultiple(['charging'], ['fire', 'idle']);
                    setTimeout(()=>{this.fireballs.push(new FireBall(this.physics.transform, this.flipx, 100, this.name))}, 200) ;
                }
                this.animator.cancelAndPlay(['charging', 'chargingStart'], 'idle');
                this.charging = false;
                this.chargingTime = 0;
            }
            return;
        }
        if(this.inputBuffer.a 
            && this.animator.cancelAndPlayMultiple(['idle', 'walk'], ['quickPunch', 'idle']) 
            && this.activateHitbox('quickPunch', 150, 150) )  return;

        if(this.inputBuffer.b 
            && this.animator.cancelAndPlayMultiple(['idle', 'walk'], ['upperCut', 'idle'])
            && this.activateHitbox('upperCut', 250, 150) ) return;

        if(this.inputBuffer.x && this.animator.cancelAndPlayMultiple(['idle', 'walk'], ['fightKick', 'idle']) 
            && this.activateHitbox('fightKick', 200, 150)
        ) return;

        if(this.inputBuffer.y && this.animator.cancelAndPlayMultiple(['idle', 'walk'], ['chargingStart', 'charging'])
        ) {
            this.charging = true;
            return;
        }

        if(this.inputBuffer.up && this.grouded){
            this.physics.velocity.y = - 120;
            this.grouded = false;
            this.animator.playMultiple(['jumpstart', 'jumpair', 'jumpair', 'land', 'idle']);
        }
        if(this.inputBuffer.right ){
            if(this.animator.cancelAndPlay(['idle'], 'walk') || this.animator.currentAnimationName == 'walk' || !this.grouded){
                this.physics.transform.x += 1;
                return;
            }
        }
        if(this.inputBuffer.left ){
            if(this.animator.cancelAndPlay(['idle'], 'walk') || this.animator.currentAnimationName == 'walk' || !this.grouded){
                this.physics.transform.x -= 1;
                return;
            }
        }else{
            if(!this.animator.playing || this.animator.currentAnimationName == 'walk'
            ){
                this.animator.play('idle');
            }
        }
    }

    updateReadyStatus(){
	    
	if(this.inputBuffer.start){
		this.ready = true;
	}
    }

    update(dt: number){
        // Convert dt from milliseconds to seconds for speed calculations
        const dtSeconds = dt / 1000;

        if (this.isDashing) {
            this.dashTimerValue += dt;
            const dashDistance = this.dashSpeedValue * dtSeconds;

            this.physics.velocity.x = this.flipx ? -this.dashSpeedValue : this.dashSpeedValue;

            if (this.dashTimerValue >= this.dashDurationTime) {
                this.isDashing = false;
                this.physics.gravity = this.originalGravity; // Restore gravity
                this.physics.velocity.x = 0; // Stop horizontal dash movement
                // Optional: Revert to idle animation
                // if (this.animator.currentAnimationName === 'dash_animation_name') {
                //     this.animator.play('idle');
                // }
            }
        }

        if(this.health <= 0 ){
            if(this.animator.currentAnimationName != 'die'){
                this.animator.play('die');
            }
            return;
        }
        let indices_to_delete = []
        for(let i = 0; i < this.fireballs.length;  i++){
                if(this.fireballs[i].physics.transform.x > -100 && this.fireballs[i].physics.transform.x < 400){
                this.fireballs[i].update(dt);
            }else{
                indices_to_delete.push(i);
            }
            if(!this.fireballs[i].collider.active){
                this.fireballs[i].physics.velocity.x = 0;
                this.fireballs[i].animator.cancelAndPlay(['fireStart'], 'fireDisappear');
                if(this.fireballs[i].animator.currentAnimationName == 'fireDisappear', !this.fireballs[i].animator.playing){
                    indices_to_delete.push(i);
                }
            }
        }
        this.fireballs  = this.fireballs.filter((_, index)=>{ return !indices_to_delete.includes(index)});

        if (!this.isDashing) { // Process other moves only if not dashing
            this.moves();
        }

        this.physics.update(dt); // Physics update happens regardless (e.g. for gravity restoration)
    }
}

export {Player, FireBall};
