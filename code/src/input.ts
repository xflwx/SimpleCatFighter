 
class InputBuffer{

    up: Boolean = false;
    down: Boolean = false;
    left: Boolean = false;
    right: Boolean = false;

    a: Boolean = false;
    b: Boolean = false;
    x: Boolean = false;
    y: Boolean = false;
    
    start: Boolean = false;
    c: Boolean = false; // For Dash input

    constructor(){
        
    }
}

interface KeyMappings {
    up: string;
    down: string;
    left: string;
    right: string;
    a: string;
    b: string;
    x: string;
    y: string;
    start: string;
    dash?: string; // Dash action key
}

class Input {
    private playerNumber: number;
    private keyMap: KeyMappings;
    private inputBuffer: InputBuffer;

    constructor(inputBuffer: InputBuffer, dataChannel?: RTCDataChannel | null, playerNumber: number = 1) {
        this.inputBuffer = inputBuffer;
        this.playerNumber = playerNumber;
        this.setKeyMappings();

        document.addEventListener('keydown', (event) => {
            if (dataChannel) {
                // Send raw key for remote player, mapping is handled by their client
                dataChannel.send(JSON.stringify({ k: event.key, d: true }));
            }
            // For local players, process input based on keyMap
            this.handleKeyEvent(event.key, true);
        });

        document.addEventListener('keyup', (event) => {
            if (dataChannel) {
                // Send raw key for remote player, mapping is handled by their client
                dataChannel.send(JSON.stringify({ k: event.key, d: false }));
            }
            // For local players, process input based on keyMap
            this.handleKeyEvent(event.key, false);
        });
    }

    private setKeyMappings() {
        if (this.playerNumber === 1) {
            this.keyMap = {
                up: 'w',
                down: 's',
                left: 'a',
                right: 'd',
                a: 'u', // Action A
                b: 'i', // Action B
                x: 'j', // Action X
                y: 'k', // Action Y
                start: ' ', // Space bar
                dash: 'c',
            };
        } else { // Player 2 or any other number for now
            this.keyMap = {
                up: 'ArrowUp',
                down: 'ArrowDown',
                left: 'ArrowLeft',
                right: 'ArrowRight',
                a: 'Numpad4',
                b: 'Numpad5',
                x: 'Numpad1',
                y: 'Numpad2',
                start: 'NumpadEnter', // Or 'Enter' if NumpadEnter is an issue
                dash: 'Numpad3',
            };
        }
    }

    private handleKeyEvent(key: string, isPressed: boolean) {
        const lowerKey = key.toLowerCase(); // Normalize player 1 keys

        // For player 1, check lowercased keys. For player 2, Arrow keys are case sensitive.
        const keyToCheck = this.playerNumber === 1 ? lowerKey : key;

        if (keyToCheck === this.keyMap.up) {
            this.inputBuffer.up = isPressed;
        } else if (keyToCheck === this.keyMap.down) {
            this.inputBuffer.down = isPressed;
        } else if (keyToCheck === this.keyMap.left) {
            this.inputBuffer.left = isPressed;
        } else if (keyToCheck === this.keyMap.right) {
            this.inputBuffer.right = isPressed;
        } else if (keyToCheck === this.keyMap.a) {
            this.inputBuffer.a = isPressed;
        } else if (keyToCheck === this.keyMap.b) {
            this.inputBuffer.b = isPressed;
        } else if (keyToCheck === this.keyMap.x) {
            this.inputBuffer.x = isPressed;
        } else if (keyToCheck === this.keyMap.y) {
            this.inputBuffer.y = isPressed;
        } else if (key === this.keyMap.start) { // Use 'key' directly for Start, as ' ' vs 'NumpadEnter'
            this.inputBuffer.start = isPressed;
        } else if (this.keyMap.dash && keyToCheck === this.keyMap.dash.toLowerCase()) { // Dash key, ensure dash is defined
            this.inputBuffer.c = isPressed;
        }
    }
}




 export {Input, InputBuffer};
