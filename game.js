// One thing that can be added are slanted platforms, but I don't really want to mess with all the theta shenanigans right now.

var canvas;
var gameStatus = "initiation";
var showInstruction = false;
var daylightDisplay = false;
var aesthetic = {mainColor: "black", subColor: "white",};

var gravity = 1; // should be 0.98 or 9.8, but 1 is a nice rounded number.
var restitution = 0.75;
var velocityDecay = 1; // 1 = no decay.
var leftBoundary = 200;
var betweenGameWait = 3000;
var ballBounceNeed = 3;

var velocityCap = 7;
var velocityChange = 2;
var jumpVelocity = 14;
var velocityStep = 5;

var kickMass = 0.2;

var score = [0, 0];
var ballBounce = 0;
var goalScored = false;
var winnerIndex;

var player, ball, platform, goal;
var dragObject = null;

var playerInput = {player1Name: false, player1Mass: false, player2Name: false, player2Mass: false, ball1MassInput: false,};

var fontSrc = {};
var musicSrc = {};
var imageSrc = {};

// Game Set-Up

function preload() {
    fontSrc["chakraPetch"] = loadFont("Chakra Petch/ChakraPetch-Medium.ttf");
}

function setup() {
    canvas = createCanvas(1200, 640);
    canvas.id('canvas');
    var x = (windowWidth - width) / 2;
    var y = (windowHeight - height) / 2;
    canvas.position(x, y);
    
    playerInput["player1Name"] = createInput('Player 1');
    playerInput["player1Name"].class('blackStyle');
	playerInput["player1Name"].attribute("onfocus", "playerInput['player1Name'].value('')");
	playerInput["player1Name"].attribute("onblur", "dataInput('player1Name')");
	playerInput["player1Name"].attribute("maxLength", "10");
	playerInput["player1Name"].size(100, 15);
    playerInput["player1Name"].position(73+x, 102+y);
    
    playerInput["player1Mass"] = createInput('10');
    playerInput["player1Mass"].class('blackStyle');
	playerInput["player1Mass"].attribute("onfocus", "playerInput['player1Mass'].value('')");
	playerInput["player1Mass"].attribute("onblur", "dataInput('player1Mass')");
	playerInput["player1Mass"].attribute("maxLength", "5");
	playerInput["player1Mass"].size(100, 15);
    playerInput["player1Mass"].position(73+x, 152+y);
    
    playerInput["player2Name"] = createInput('Player 2');
    playerInput["player2Name"].class('blackStyle');
	playerInput["player2Name"].attribute("onfocus", "playerInput['player2Name'].value('')");
	playerInput["player2Name"].attribute("onblur", "dataInput('player2Name')");
	playerInput["player2Name"].attribute("maxLength", "10");
	playerInput["player2Name"].size(100, 15);
    playerInput["player2Name"].position(73+x, 302+y);
    
    playerInput["player2Mass"] = createInput('10');
    playerInput["player2Mass"].class('blackStyle');
	playerInput["player2Mass"].attribute("onfocus", "playerInput['player2Mass'].value('')");
	playerInput["player2Mass"].attribute("onblur", "dataInput('player2Mass')");
	playerInput["player2Mass"].attribute("maxLength", "5");
	playerInput["player2Mass"].size(100, 15);
    playerInput["player2Mass"].position(73+x, 352+y);
    
    playerInput["ball1Mass"] = createInput('1');
    playerInput["ball1Mass"].class('blackStyle');
	playerInput["ball1Mass"].attribute("onfocus", "playerInput['ball1Mass'].value('')");
	playerInput["ball1Mass"].attribute("onblur", "dataInput('ball1Mass')");
	playerInput["ball1Mass"].attribute("maxLength", "5");
	playerInput["ball1Mass"].size(100, 15);
    playerInput["ball1Mass"].position(73+x, 502+y);
    
    reset(true);
}


// Main Loop

function draw() {
    background(aesthetic.mainColor);
    keyboardInput();
    drawPlatform();
    drawPlayer();
    drawBall();
    
    textFont(fontSrc["chakraPetch"]);
    fill(aesthetic.subColor);
    textAlign(CENTER, TOP);
    
    if(gameStatus == "initiation"){
        textSize(64);
        text("2Bit Soccer", (width-leftBoundary)/2 + leftBoundary, 50);
        
        if(sin(frameCount*0.05) > -0.64){
            textSize(20);
            text("Press Space", (width-leftBoundary)/2 + leftBoundary, 150); 
        }
    }
    else if(gameStatus == "gameOver"){
        textSize(64);
        text("Winner: " + player[winnerIndex].name, (width-leftBoundary)/2 + leftBoundary, 50);
        
        if(sin(frameCount*0.05) > -0.64){
            textSize(20);
            text("Press Space", (width-leftBoundary)/2 + leftBoundary, 150); 
        }
    }
    else{
        textSize(64);
        text(score[0] + " - " + score[1], (width-leftBoundary)/2 + leftBoundary, 50);
    }
    
    if(showInstruction){
        drawGameInstruction();
    }

    drawStatusBar();
}


// Secondary Loop

function drawPlatform(){
    for(var current of platform){
        fill(current.color);
        rect(current.location.x, current.location.y, current.dimension.x, current.dimension.y);
    }   
}

function drawPlayer(){
    for(var p=0, currentLength=player.length; p<currentLength; p++){
        var current = player[p];
        fill(current.color);
        noStroke();
        
        if(current.kick.active){
            current.kick.progress += 1;
            if(current.kick.progress > current.kick.complete){
                current.kick.ready = true;
                current.kick.active = false;
                current.kick.progress = 0;
            }
            for(var i=0, platformLength=platform.length; i<platformLength; i++){
                platformKickCollision(platform[i], current);
            }
            
            current.kick.dimension.x = map(current.kick.progress, 0, current.kick.complete, current.dimension.x/5, current.dimension.x/2);
            current.kick.dimension.y = map(current.kick.progress, 0, current.kick.complete, 0, current.dimension.y/2);
            current.kick.location.y =  current.location.y + current.dimension.y - current.kick.dimension.y;
            if(current.direction.x == 1){
                current.kick.location.x =  current.location.x + current.dimension.x + 15;
            }
            else{
                current.kick.location.x = current.location.x - current.kick.dimension.x - 15;
            }
            
            // Draw Kick
            rect(current.kick.location.x, current.kick.location.y, current.kick.dimension.x, current.kick.dimension.y);
        }
        
        // Update Player Kinematic
        current.velocity.y += gravity;
        
        var theta = findRotation(current.velocity.x, current.velocity.y);
        var stepLength = calculateAmountOfStep(current, theta);
        for(var currentStep=0; currentStep<stepLength; currentStep++){
            current.location.x += (current.velocity.x/stepLength);
            current.location.y += (current.velocity.y/stepLength);
            
            for(var i=0; i<currentLength; i++){
                playerPlayerCollision(current, player[i]);
                if(player[i].kick.active){
                    playerKickCollision(current, player[i]);
                }
            }
            for(var i=0, platformLength=platform.length; i<platformLength; i++){
                playerPlatformCollision(current, platform[i]);
            }
            
            playerBoundaryCollision(current);
        }
        
        // Draw Player
        rect(current.location.x, current.location.y, current.dimension.x, current.dimension.y);
    }
}

function drawBall(){
    for(var b=0, currentLength=ball.length; b<currentLength; b++){
        var current = ball[b];
        fill(current.color);
        noStroke();
        
        if(current != dragObject){
            // Update Ball Kinematic
            current.velocity.y += gravity;
            current.velocity.x *= velocityDecay;

            var theta = findRotation(current.velocity.x, current.velocity.y);
            var stepLength = calculateAmountOfStep(current, theta);
            for(var currentStep=0; currentStep<stepLength; currentStep++){
                current.location.x += (current.velocity.x/stepLength);
                current.location.y += (current.velocity.y/stepLength);

                for(var i=0; i<currentLength; i++){
                    ballBallCollision(current, ball[i]);
                }
                for(var i=0, kickLength=player.length; i<kickLength; i++){
                    playerBallCollision(player[i], current);
                    if(player[i].kick.active){
                        ballKickCollision(current, player[i]);
                    }
                }
                for(var i=0, platformLength=platform.length; i<platformLength; i++){
                    ballPlatformCollision(current, platform[i]);
                }
                for(var i=0, goalLength=goal.length; i<goalLength && gameStatus=="active"; i++){
                    ballGoalCollision(current, goal[i]);
                }

                ballBoundaryCollision(current);
            }
        }
    
        if(gameStatus == "active" && ballBounce < ballBounceNeed){
            textFont(fontSrc["chakraPetch"]);
            fill(aesthetic.subColor);
            textAlign(CENTER, BOTTOM);
            textSize(30);
            text(ballBounceNeed - ballBounce, current.location.x, current.location.y - current.dimension.y/2 - 30);
        }
        // Draw ball
        ellipse(current.location.x, current.location.y, current.dimension.x, current.dimension.y);
    }
}

function drawStatusBar(){
    var distanceY = 0;
    fill(aesthetic.mainColor);
    noStroke();
    rect(0, 0, leftBoundary, height);
    
    strokeWeight(5);
    stroke(aesthetic.subColor);
    line(leftBoundary, 0, leftBoundary, height);
    
    textFont(fontSrc["chakraPetch"]);
    noStroke();
    
    // Player 1
    textAlign(CENTER, TOP);
    fill(player[0].color);
    textSize(30);
    distanceY += 30;
    text("Player 1", leftBoundary/2, distanceY);
    
    textAlign(LEFT, TOP);
    fill(aesthetic.subColor);
    textSize(15);
    
    distanceY += 70;
    text("Name: ", 10, distanceY);
    distanceY += 50;
    text("Mass: ", 10, distanceY);
    
    // Player 2
    textAlign(CENTER, TOP);
    fill(player[1].color);
    textSize(30);
    distanceY += 80;
    text("Player 2", leftBoundary/2, distanceY);
    
    textAlign(LEFT, TOP);
    fill(aesthetic.subColor);
    textSize(15);
    
    distanceY += 70;
    text("Name: ", 10, distanceY);
    distanceY += 50;
    text("Mass: ", 10, distanceY);
    
    // Ball
    textAlign(CENTER, TOP);
    fill(aesthetic.subColor);
    textSize(30);
    distanceY += 80;
    text("Ball", leftBoundary/2, distanceY);
    
    textAlign(LEFT, TOP);
    fill(aesthetic.subColor);
    textSize(15);
    
    distanceY += 70;
    text("Mass: ", 10, distanceY);    
    
    // Control
    textAlign(CENTER, TOP);
    fill(aesthetic.subColor);
    textSize(15);
    
    distanceY += 80;
    text("Instruction: I Key", 90, distanceY);   
}

function drawGameInstruction(){
    // Player 1
    drawKey("W", 87, leftBoundary + 100, 200);
    drawKey("A", 65, leftBoundary + 50, 250);
    drawKey("S", 83, leftBoundary + 100, 250);
    drawKey("D", 68, leftBoundary + 150, 250);
    drawKey("F", 70, leftBoundary + 250, 250);
    
    fill(aesthetic.subColor);
    noStroke();
    textFont(fontSrc["chakraPetch"]);
    textSize(30);
    textAlign(CENTER, CENTER);
    text("Move", leftBoundary + 100, 300);
    text("Kick", leftBoundary + 250, 300);
    
    // Player 2
    drawKey("U", 38, width - 100, 200);
    drawKey("L", 37, width - 50, 250);
    drawKey("D", 40, width - 100, 250);
    drawKey("R", 39, width - 150, 250);
    drawKey("0", 96, width - 250, 250);
    
    fill(aesthetic.subColor);
    noStroke();
    textFont(fontSrc["chakraPetch"]);
    textSize(30);
    textAlign(CENTER, CENTER);
    text("Move", width - 100, 300);
    text("Kick", width - 250, 300);
}

function drawKey(letter, code, x, y){
    noFill();
    if (keyIsDown(code)) {
        fill(aesthetic.subColor);
    }
    stroke(aesthetic.subColor);
    strokeWeight(3);
    rect(x - 20, y - 13, 40, 30, 7, 0);

    fill(aesthetic.subColor);
    if (keyIsDown(code)) {
        fill(aesthetic.mainColor);
    }
    noStroke();
    textFont(fontSrc["chakraPetch"]);
    textSize(25);
    textAlign(CENTER, CENTER);
    text(letter, x, y);
}


// Collision

function playerPlayerCollision(player1, player2){
    if(collideRectRect(player1.location.x, player1.location.y, player1.dimension.x, player1.dimension.y, player2.location.x, player2.location.y, player2.dimension.x, player2.dimension.y)){    
        // set variables
        var m1 = player1.mass;
        var v1x = player1.velocity.x;
        var v1y = player1.velocity.y;
        var m2 = player2.mass;
        var v2x = player2.velocity.x;
        var v2y = player2.velocity.y;
        
        // do momentum calculation
        if(v1x > 0 || v1x > 0){
            var v1xP = ((m1*v1x) + m2*(2*v2x-v1x)) / (m1 + m2);
            player1.velocity.x = v1xP;
            var v2xP = v1x + v1xP - v2x;
            player2.velocity.x = v2xP;
        }

        var v1yP = ((m1*v1y) + m2*(2*v2y-v1y)) / (m1 + m2);
        player1.velocity.y = v1yP;
        var v2yP = v1y + v1yP - v2y;    
        player2.velocity.y = v2yP;
        
        // relocate the player
        if(player1.location.y+player1.dimension.y < player2.location.y+player2.dimension.y/5){
            player1.location.y = player2.location.y - player1.dimension.y - 1;
            player1.jump.ready = true;
        }
        else if(player1.location.y+player2.dimension.y/5 > player2.location.y+player2.dimension.y){
            player2.location.y = player1.location.y - player2.dimension.y - 1;
            player2.jump.ready = true;
        }
        else if(player1.location.x < player2.location.x && player1.location.x+player1.dimension.x+player2.dimension.x+1 >= width){
            player1.location.x = player2.location.x - player1.dimension.x - 1;
        }
        else if(player1.location.x < player2.location.x){
            player2.location.x = player1.location.x + player1.dimension.x + 1;
        }
        else if(player1.location.x > player2.location.x && player1.location.x-player2.dimension.x-1 <= leftBoundary){
            player1.location.x = player2.location.x + player2.dimension.x + 1;
        }
        else if(player1.location.x > player2.location.x){
            player2.location.x = player1.location.x - player2.dimension.x - 1;
        }
    }
}

function playerBallCollision(player1, ball1){ 
    if(collideRectCircle(player1.location.x, player1.location.y, player1.dimension.x, player1.dimension.y, ball1.location.x, ball1.location.y, ball1.dimension.x)){    
        // set variables
        var m1 = player1.mass;
        var v1x = player1.velocity.x;
        var v1y = player1.velocity.y;
        var m2 = ball1.mass;
        var v2x = ball1.velocity.x;
        var v2y = ball1.velocity.y;
        
        // do momentum calculation
        var v1xP = ((m1*v1x) + m2*(2*v2x-v1x)) / (m1 + m2);
        player1.velocity.x = v1xP;
        var v2xP = v1x + v1xP - v2x;
        ball1.velocity.x = v2xP;

        var v1yP = ((m1*v1y) + m2*(2*v2y-v1y)) / (m1 + m2);
        player1.velocity.y = v1yP;
        var v2yP = v1y + v1yP - v2y;    
        ball1.velocity.y = v2yP;
        
        // relocate the player
        if(player1.location.y+player1.dimension.y < ball1.location.y/*-ball1.dimension.y*4/5*/){
            player1.location.y = ball1.location.y - ball1.dimension.y/2 - player1.dimension.y - 1;
            player1.jump.ready = true;
            if(ball1.location.y+ball1.dimension.y/2 >= height){
                ball1.velocity.y = 0;
            }
        }
        else if(player1.location.y+player1.dimension.y/5 > ball1.location.y+ball1.dimension.y/2){
            ball1.location.y = player1.location.y - ball1.dimension.y/2 - 1;
        }
        else if(player1.location.x+player1.dimension.x/2 < ball1.location.x/*-ball1.dimension.x*4/5*/){
            //ball1.location.x = player1.location.x + player1.dimension.x + ball1.dimension.x/2 + 1;
            var averageX = (player1.location.x+player1.dimension.x + ball1.location.x-ball1.dimension.x/2) / 2;
            player1.location.x = averageX - player1.dimension.x;
            ball1.location.x = averageX + ball1.dimension.x/2 + 1;
        }
        else if(player1.location.x+player1.dimension.x/2 > ball1.location.x/*+ball1.dimension.x*4/5*/){
            //ball1.location.x = player1.location.x - ball1.dimension.x/2 - 1;
            var averageX = (player1.location.x + ball1.location.x+ball1.dimension.x/2) / 2;
            player1.location.x = averageX;
            ball1.location.x = averageX - ball1.dimension.x/2 - 1;
        }
        
        if(!goalScored && gameStatus == "active" && ballBounce < ballBounceNeed){
            goalScored = true;
            score[player1.scoreIndex] -= 1;
            setTimeout(function(){
                reset();
            }, betweenGameWait);
        }
    }
}

function playerKickCollision(player1, player2){ 
    if(collideRectRect(player1.location.x, player1.location.y, player1.dimension.x, player1.dimension.y, player2.kick.location.x, player2.kick.location.y, player2.kick.dimension.x, player2.kick.dimension.y)){    
        // set variables
        var m1 = player1.mass;
        var v1x = player1.velocity.x;
        var v1y = player1.velocity.y;
        var m2 = player2.kick.mass;
        var v2x = player2.velocity.x + player2.dimension.x/2 * player2.direction.x;
        var v2y = player2.velocity.y - player2.dimension.y/2;
        
        // do momentum calculation
        var v1xP = ((m1*v1x) + m2*(2*v2x-v1x)) / (m1 + m2);
        player1.velocity.x = v1xP;

        var v1yP = ((m1*v1y) + m2*(2*v2y-v1y)) / (m1 + m2);
        player1.velocity.y = v1yP;
        
        player1.location.y = player2.kick.location.y - player1.dimension.y - 1;
        
        player2.kick.ready = true;
        player2.kick.active = false;
        player2.kick.progress = 0;
    }
}

function playerPlatformCollision(player1, platform1){ 
    var p1x = player1.location.x;
    var p1y = player1.location.y;
    var p1w = player1.dimension.x;
    var p1h = player1.dimension.y;
    var g1x = platform1.location.x;
    var g1y = platform1.location.y;
    var g1w = platform1.dimension.x;
    var g1h = platform1.dimension.y;
    if(collideRectRect(p1x, p1y, p1w, p1h, g1x, g1y, g1w, g1h)){
        //left
        if(collideRectRect(p1x, p1y, p1w, p1h, g1x-1, g1y, 4, g1h) && player1.velocity.x > 0){
            player1.location.x = g1x - p1w - 3;
            player1.velocity.x = 0;
        }
        //right
        else if(collideRectRect(p1x, p1y, p1w, p1h, g1x+g1w-3, g1y, 4, g1h) && player1.velocity.x < 0){
            player1.location.x = g1x + g1w + 3;
            player1.velocity.x = 0;
        }
        //up
        else if(collideRectRect(p1x, p1y, p1w, p1h, g1x, g1y, g1w, 1)){
            player1.location.y = g1y - p1h - 1;
            player1.velocity.y = 0;
            player1.jump.ready = true;
        }
        //down
        else if(collideRectRect(p1x, p1y, p1w, p1h, g1x, g1y+g1h-1, g1w, 1)){
            player1.location.y = g1y + g1h + 1;
            player1.velocity.y *= -1 * restitution;
        }
    }
}

function playerBoundaryCollision(player1){ 
    if(player1.location.x < leftBoundary){
        player1.location.x = leftBoundary;
        player1.velocity.x = 0;
    }
    else if(player1.location.x+player1.dimension.x > width){
        player1.location.x = width-player1.dimension.x;
        player1.velocity.x = 0;
    }
    if(player1.location.y < 0){
        player1.location.y = 0;
        player1.velocity.y *= -1 * restitution;
    }
    else if(player1.location.y+player1.dimension.y > height){
        player1.location.y = height-player1.dimension.y;
        player1.velocity.y = 0;
        player1.jump.ready = true;
    }
}

function ballBallCollision(ball1, ball2){ 
    if(collideCircleCircle(ball1.location.x, ball1.location.y, ball1.dimension.x, ball1.dimension.y, ball2.location.x, ball2.location.y, ball2.dimension.x, ball2.dimension.y)){    
        // set variables
        var m1 = ball1.mass;
        var v1x = ball1.velocity.x;
        var v1y = ball1.velocity.y;
        var m2 = ball2.mass;
        var v2x = ball2.velocity.x;
        var v2y = ball2.velocity.y;
        
        // do momentum calculation
        var v1xP = ((m1*v1x) + m2*(2*v2x-v1x)) / (m1 + m2);
        ball1.velocity.x = v1xP;
        var v2xP = v1x + v1xP - v2x;
        ball2.velocity.x = v2xP;

        var v1yP = ((m1*v1y) + m2*(2*v2y-v1y)) / (m1 + m2);
        ball1.velocity.y = v1yP;
        var v2yP = v1y + v1yP - v2y;    
        ball2.velocity.y = v2yP;
        
        // relocate the player
        if(ball1.location.y-ball1.dimension.y/2 < ball2.location.y+ball2.dimension.y/5){
            ball1.location.y = ball2.location.y - ball2.dimension.y/2 - ball1.dimension.y/2 - 1;
            //if(ball2.location.y+ball2.dimension.y/2 >= height){
                //ball2.velocity.y = 0;
            //}
        }
        else if(ball1.location.y+ball1.dimension.y/5 > ball2.location.y-ball2.dimension.y/2){
            ball2.location.y = ball1.location.y - ball1.dimension.y/2 - ball2.dimension.y/2 - 1;
        }
        else if(ball1.location.x < ball2.location.x && ball1.location.x+ball1.dimension.x/2+ball2.dimension.x+1 >= width){
            ball1.location.x = ball2.location.x - ball2.dimension.x/2 - ball1.dimension.x/2 - 1;
        }
        else if(ball1.location.x < ball2.location.x){
            ball2.location.x = ball1.location.x + ball1.dimension.x/2 + ball2.dimension.x/2 + 1;
        }
        else if(ball1.location.x > ball2.location.x && ball1.location.x-ball1.dimension.x/2-ball2.dimension.x-1 <= leftBoundary){
            ball1.location.x = ball2.location.x + ball2.dimension.x/2 + ball1.dimension.x/2 + 1;
        }
        else if(ball1.location.x > ball2.location.x){
            ball2.location.x = ball1.location.x - ball1.dimension.x/2 - ball2.dimension.x/2 - 1;
        }
    }
}

function ballKickCollision(ball1, player1){ 
    if(collideRectCircle(player1.kick.location.x, player1.kick.location.y, player1.kick.dimension.x, player1.kick.dimension.y, ball1.location.x, ball1.location.y, ball1.dimension.x)){    
        // set variables
        var m1 = ball1.mass;
        var v1x = ball1.velocity.x;
        var v1y = ball1.velocity.y;
        var m2 = player1.kick.mass;
        var v2x = player1.velocity.x + player1.dimension.x/2 * player1.direction.x;
        var v2y = player1.velocity.y - player1.dimension.y/3;
        
        // do momentum calculation
        var v1xP = ((m1*v1x) + m2*(2*v2x-v1x)) / (m1 + m2);
        ball1.velocity.x = v1xP;
        var v1yP = ((m1*v1y) + m2*(2*v2y-v1y)) / (m1 + m2);
        ball1.velocity.y = v1yP;
        
        if(!goalScored && gameStatus == "active" && ballBounce < ballBounceNeed){
            goalScored = true;
            score[player1.scoreIndex] -= 1;
            setTimeout(function(){
                reset();
            }, betweenGameWait);
        }
        
        ball1.location.y = player1.kick.location.y - ball1.dimension.y/2 - 1;
        if(player1.direction.x == 1){
            ball1.location.x = player1.kick.location.x + player1.kick.dimension.x + ball1.dimension.x/2 + 1;
        }
        else{
            ball1.location.x = player1.kick.location.x - ball1.dimension.x/2 - 1;
        }
        
        player1.kick.ready = true;
        player1.kick.active = false;
        player1.kick.progress = 0;
    }
}

function ballPlatformCollision(ball1, platform1){
    var b1x = ball1.location.x;
    var b1y = ball1.location.y;
    var b1w = ball1.dimension.x;
    var b1h = ball1.dimension.y;
    var g1x = platform1.location.x;
    var g1y = platform1.location.y;
    var g1w = platform1.dimension.x;
    var g1h = platform1.dimension.y;
    if(collideRectCircle(g1x, g1y, g1w, g1h, b1x, b1y, b1w)){
        //left
        if(collideRectCircle(g1x-1, g1y, 4, g1h, b1x, b1y, b1w, b1h) && ball1.velocity.x > 0){
            ball1.location.x = g1x - b1w - 3;
            ball1.velocity.x *= -1 * restitution;
        }
        //right
        else if(collideRectCircle(g1x+g1w-3, g1y, 4, g1h, b1x, b1y, b1w) && ball1.velocity.x < 0){
            ball1.location.x = g1x + g1w + 3;
            ball1.velocity.x *= -1 * restitution;
        }
        //up
        else if(collideRectCircle(g1x, g1y, g1w, 1, b1x, b1y, b1w)){
            ball1.location.y = g1y - b1h/2 - 1;
            ball1.velocity.y *= -1 * restitution;
            ballBounce += 1;
            if(Math.abs(ball1.velocity.y) < 0.06){
              ball1.velocity.y = 0;  
            }
        }
        //down
        else if(collideRectCircle(g1x, g1y+g1h-1, g1w, 1, b1x, b1y, b1w)){
            ball1.location.y = g1y + g1h + b1h/2 + 1;
            ball1.velocity.y *= -1 * restitution;
        }
    }
}

function ballGoalCollision(ball1, goal1){
    var b1x = ball1.location.x;
    var b1y = ball1.location.y;
    var b1w = ball1.dimension.x;
    var b1h = ball1.dimension.y;
    var g1x = goal1.location.x;
    var g1y = goal1.location.y;
    var g1w = goal1.dimension.x;
    var g1h = goal1.dimension.y;
    if(!goalScored && collideRectCircle(g1x, g1y, g1w, g1h, b1x, b1y, b1w)){
        goalScored = true;
        score[goal1.scoreIndex] += 1;
        if(score[goal1.scoreIndex] >= 7 && score[goal1.scoreIndex] >= score[goal1.antiIndex]+2){
            setTimeout(function(){
                gameStatus = "gameOver";
                winnerIndex = goal1.scoreIndex;
            }, betweenGameWait);   
        }
        else{
            setTimeout(function(){
                reset();
            }, betweenGameWait);
        }
    }
}

function ballBoundaryCollision(ball1){
    if(ball1.location.x-ball1.dimension.x/2 < leftBoundary){
        ball1.location.x = leftBoundary + ball1.dimension.x/2;
        ball1.velocity.x *= -1 * restitution;
    }
    else if(ball1.location.x+ball1.dimension.x/2 > width){
        ball1.location.x = width - ball1.dimension.x/2;
        ball1.velocity.x *= -1 * restitution;
    }
    if(ball1.location.y-ball1.dimension.y/2 < 0){
        ball1.location.y = ball1.dimension.y/2;
        ball1.velocity.y *= -1 * restitution;
    }
    else if(ball1.location.y+ball1.dimension.y/2 > height){
        ball1.location.y = height - ball1.dimension.y/2;
        ball1.velocity.y *= -1 * restitution;
        ballBounce += 1;
        if(Math.abs(ball1.velocity.y) < 0.06){
          ball1.velocity.y = 0;  
        }
    }
}

function platformKickCollision(platform1, player1){ 
    var k1x = player1.kick.location.x;
    var k1y = player1.kick.location.y;
    var k1w = player1.kick.dimension.x;
    var k1h = player1.kick.dimension.y;
    var g1x = platform1.location.x;
    var g1y = platform1.location.y;
    var g1w = platform1.dimension.x;
    var g1h = platform1.dimension.y;
    if(collideRectRect(k1x, k1y, k1w, k1h, g1x, g1y, g1w, g1h)){
        player1.kick.ready = true;
        player1.kick.active = false;
        player1.kick.progress = 0;
    }
}


// Player's Interaction

function keyboardInput(){
  // player 1
    var current = player[0];
    // Key A
    if (keyIsDown(65)) {
        current.velocity.x -= velocityChange;
        if(current.velocity.x < -velocityCap){
            current.velocity.x = -velocityCap;
        }
    }
    // Key S
    if (keyIsDown(83)) {
        current.velocity.y += velocityChange;
        if(current.velocity.y > velocityCap){
            current.velocity.y = velocityCap;
        }
    }
    // Key D
    if (keyIsDown(68)) {
        current.velocity.x += velocityChange;
        if(current.velocity.x > velocityCap){
            current.velocity.x = velocityCap;
        }
    }
    // Inactivity to Reduce Velocity
    if (!keyIsDown(65) && !keyIsDown(68)) {
        if(current.velocity.x > velocityChange/2){
            current.velocity.x -= velocityChange;
        }
        
        else if(current.velocity.x > velocityChange/2){
            current.velocity.x -= velocityChange;
        }
        else{
            current.velocity.x = 0;
        }
    }
    
    if(current.velocity.x < 0){
        current.direction.x = -1;
    }
    else if(current.velocity.x > 0){
        current.direction.x = 1;
    }
    if(current.velocity.y < 0){
        current.direction.y = -1;
    }
    else if(current.velocity.y > 0){
        current.direction.y = 1;
    }
    
  // player 2
    current = player[1];
    // Arrow Left
    if (keyIsDown(37)) {
        current.velocity.x -= velocityChange;
        if(current.velocity.x < -velocityCap){
            current.velocity.x = -velocityCap;
        }
    }
    // Arrow Down
    if (keyIsDown(40)) {
        current.velocity.y += velocityChange;
        if(current.velocity.y > velocityCap){
            current.velocity.y = velocityCap;
        }
    }
    // Arrow Right
    if (keyIsDown(39)) {
        current.velocity.x += velocityChange;
        if(current.velocity.x > velocityCap){
            current.velocity.x = velocityCap;
        }
    }
    // Inactivity to Reduce Velocity
    if (!keyIsDown(37) && !keyIsDown(39)) {
        if(current.velocity.x > velocityChange/2){
            current.velocity.x -= velocityChange;
        }
        
        else if(current.velocity.x > velocityChange/2){
            current.velocity.x -= velocityChange;
        }
        else{
            current.velocity.x = 0;
        }
    }
    
    if(current.velocity.x < 0){
        current.direction.x = -1;
    }
    else if(current.velocity.x > 0){
        current.direction.x = 1;
    }
    if(current.velocity.y < 0){
        current.direction.y = -1;
    }
    else if(current.velocity.y > 0){
        current.direction.y = 1;
    }
}

function keyPressed(){
    // Key W
    var current = player[0];
    if (current.jump.ready && keyCode == 87) {
        current.velocity.y -= jumpVelocity;
        current.jump.ready = false;
    }
    
    // Key F || X 
    if (current.kick.ready && (keyCode == 70 || keyCode == 88)){
        current.kick.ready = false;
        current.kick.active = true;
        current.kick.progress = 0;
    }
    
    // Arrow Up
    current = player[1];
    if (current.jump.ready && keyIsDown(38)) {
        current.velocity.y -= jumpVelocity;
        current.jump.ready = false;
    }
    
    // Key ? || 0
    if (current.kick.ready && (keyCode == 191 || keyCode == 96)){
        current.kick.ready = false;
        current.kick.active = true;
        current.kick.progress = 0;
    }
    
    // Key R
    if (keyCode == 82 && !goalScored && gameStatus == "active") {
        reset(false);
    }
    
    // Key T
    if (keyCode == 84 && !goalScored && gameStatus == "active") {
        reset(true);
    }
    
    // Key I
    if (keyCode == 73) {
        showInstruction = !showInstruction;
    }
    
    // Key O
    if (keyCode == 79) {
        daylightDisplay = !daylightDisplay;
        
        var temporary = aesthetic.mainColor;
        aesthetic.mainColor = aesthetic.subColor;
        aesthetic.subColor = temporary;
        document.body.style.backgroundColor = aesthetic.mainColor; 
        document.getElementById("canvas").style.borderColor = aesthetic.subColor;
        for(var current of ball){
            current.color = aesthetic.subColor;
        }
        for(var current of platform){
            current.color = aesthetic.subColor;
        }
        for(var current in playerInput){
            playerInput[current].removeClass(aesthetic.subColor + 'Style');
            playerInput[current].addClass(aesthetic.mainColor + 'Style');
        }
    }
    
    // Key P
    if (keyCode == 80) {
        fullscreen(!fullscreen());
    }
    
    // Space
    if (keyCode == 32) {
        if(gameStatus != "active"){
            if(gameStatus == "initiation" || gameStatus == "gameOver"){
                reset(true);
            }
            gameStatus = "active";
            loop();
        }
        else{
            gameStatus = "pause";
            dragObject = null;
            noLoop();
        }
    }
    
}

function dataInput(inputId){ 
    if(inputId == "player1Name"){
        if(Number(playerInput[inputId].value()) == 0){
            playerInput[inputId].value("Player 1");
        }
        player[0].name = playerInput[inputId].value();
    }
    else if(inputId == "player2Name"){
        if(Number(playerInput[inputId].value()) == 0){
            playerInput[inputId].value("Player 2");
        }
        player[1].name = playerInput[inputId].value();
    }
    else if(inputId == "player1Mass"){
        if(isNaN(Number(playerInput[inputId].value())) || Number(playerInput[inputId].value()) == 0){
            playerInput[inputId].value(10);
        }
        else if(Number(playerInput[inputId].value()) < 0){
            playerInput[inputId].value(Math.abs(Number(playerInput[inputId].value())));
        }
        player[0].mass = Number(playerInput[inputId].value());
        player[0].kick.mass = Number(playerInput[inputId].value()) * kickMass;
    }
    else if(inputId == "player2Mass"){
        if(isNaN(Number(playerInput[inputId].value())) || Number(playerInput[inputId].value()) == 0){
            playerInput[inputId].value(10);
        }
        else if(Number(playerInput[inputId].value()) < 0){
            playerInput[inputId].value(Math.abs(Number(playerInput[inputId].value())));
        }
        player[1].mass = Number(playerInput[inputId].value());
        player[1].kick.mass = Number(playerInput[inputId].value()) * kickMass;
    }
    else if(inputId == "ball1Mass"){
        if(isNaN(Number(playerInput[inputId].value())) || Number(playerInput[inputId].value()) == 0){
            playerInput[inputId].value(1);
        }
        else if(Number(playerInput[inputId].value()) < 0){
            playerInput[inputId].value(Math.abs(Number(playerInput[inputId].value())));
        }
        ball[0].mass = Number(playerInput[inputId].value());
    }
}


// Support Function

function findRotation(dx, dy){
    var dh = Math.sqrt(Math.pow(dy, 2) + Math.pow(dx, 2));
    if(dh == 0){
        return 0;
    }
    var rotationRadian = Math.acos(dx/dh);
    if(dy < 0){
        rotationRadian *= -1;
    } 
    return rotationRadian;
}

function reset(trueReset){
    player = [
        {
            location: createVector(leftBoundary+300, 560),
            dimension: createVector(40, 80),
            velocity: createVector(0, 0),
            direction: createVector(1, 0),
            mass: Number(playerInput["player1Mass"].value()),
            kick:{ 
                ready: true,
                active: false,
                progress: 0,
                complete: 5,
                location: createVector(0, 0),
                dimension: createVector(0, 0),
                mass: Number(playerInput["player1Mass"].value()) * kickMass,
            },
            jump:{ ready: true, },
            color: "red",
            tag: "player1",
            name: playerInput["player1Name"].value(),
            scoreIndex: 0,
        }, 
        {
            location: createVector(width-340, 560),
            dimension: createVector(40, 80),
            velocity: createVector(0, 0),
            direction: createVector(-1, 0),
            mass: Number(playerInput["player2Mass"].value()),
            kick:{ 
                ready: true,
                active: false,
                progress: 0,
                complete: 5,
                location: createVector(0, 0),
                dimension: createVector(0, 0),
                mass: Number(playerInput["player2Mass"].value()) * kickMass,
            },
            jump:{ ready: true, },
            color: "green",
            tag: "player2",
            name: playerInput["player2Name"].value(),
            scoreIndex: 1,
        }, 
    ];

    ball = [
        {
            location: createVector((width-leftBoundary)/2+leftBoundary, 300),
            dimension: createVector(30, 30),
            velocity: createVector(0, 0),
            mass: Number(playerInput["ball1Mass"].value()),
            color: aesthetic.subColor,
        }, 
    ];

    platform = [
        {
            location: createVector(leftBoundary-10, 400),
            dimension: createVector(210, 7),
            color: aesthetic.subColor,
            tag: "goal",
        }, 
        {
            location: createVector(width-200, 400),
            dimension: createVector(210, 7),
            color: aesthetic.subColor,
            tag: "goal",
        }, 
    ];  
    
    goal = [
        {
            location: createVector(leftBoundary-10, 410),
            dimension: createVector(12, 230),
            scoreIndex: 1,
            antiIndex: 0,
        },
        {
            location: createVector(width-2, 410),
            dimension: createVector(12, 230),
            scoreIndex: 0,
            antiIndex: 1,
        },
    ];
    
    if(trueReset){
        score = [0, 0];
        gameWinner = "";
    }
    ballBounce = 0;
    goalScored = false;
}

function calculateAmountOfStep(object, theta){
    var currentVelocity = Math.sqrt(Math.pow(object.velocity.x, 2) + Math.pow(object.velocity.y, 2));
    var amount = currentVelocity / velocityStep;
    var deductAmount = amount % 1;
    var updateLocation = deductAmount * velocityStep;
    object.location.x = object.location.x + updateLocation * Math.cos(theta);
    object.location.y = object.location.y + updateLocation * Math.sin(theta);
    amount = Math.ceil(amount);
    return amount;
}

function windowResized(){
    var offsetX = 0;
    var offsetY = 0;
    if(windowWidth > width){
        offsetX = (windowWidth - width) / 2;
    }
    if(windowHeight > height){
        offsetY = (windowHeight - height) / 2;
    }
    canvas.position(offsetX, offsetY);
    playerInput["player1Name"].position(73+offsetX, 102+offsetY);
    playerInput["player1Mass"].position(73+offsetX, 152+offsetY);
    playerInput["player2Name"].position(73+offsetX, 302+offsetY);
    playerInput["player2Mass"].position(73+offsetX, 352+offsetY);
    playerInput["ball1Mass"].position(73+offsetX, 502+offsetY);
}


// Drag Ball

function mousePressed() {
    if(gameStatus != "pause"){
        for(var object of ball){
            if(collidePointCircle(mouseX, mouseY, object.location.x, object.location.y, object.dimension.x, object.dimension.y)){
                dragObject = object;
                object.velocity.x = 0;
                object.velocity.y = 0;
            }
        }
    }
}

function mouseDragged() {
    if (dragObject) {
        dragObject.location.x = mouseX;
        dragObject.location.y = mouseY;
        //left
        if(dragObject.location.x < leftBoundary){
            dragObject = null;
        }
        //right
        else if(dragObject.location.x > width){
            dragObject = null;
        }
        //top
        if(dragObject.location.y < 0){
            dragObject = null;
        }
        //bottom
        else if(dragObject.location.y > height){
            dragObject = null;
        }
    }
}

function mouseReleased() {
 	dragObject = null;
}


// Console Instruction

console.clear();

console.log("\nPlayer's Control: \n \n"
            + "Mouse Input: \n"
            + "Mouse Pressed: Select Ball \n"
            + "Mouse Dragged: Move Ball \n"
            + "Mouse Released: Release Ball \n \n"
            + "Keyboard Input: \n"
            + "WASD Keydown: Move Player 1 \n"
            + "F/X Keydown: Player 1 Kick \n"
            + "Arrows Keydown: Move Player 2 \n"
            + "?/0 Keydown: Player 2 Kick \n \n"
            + "Space Keydown: Pause game \n"
            + "R Keydown: Restart \n"
            + "T Keydown: Reset \n"
            + "I Keydown: Instruction Toggle \n"
            + "O Keydown: Daylight Toggle \n"
            + "P Keydown: Fullscreen Toggle \n \n"
           );

console.log("\nGame Rule: \n \n"
            + "Kick the ball, score, and have fun! \n"
            + "First to 7 win by 2! \n"
            + "Don't touch a ball on countdown! \n \n"
           );
