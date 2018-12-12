//var motionUnit = { top: {moveX: 0, moveY: -1, direction: "top", opposite: "bottom",}, left: {moveX: -1, moveY: 0, direction: "left", opposite: "right",}, bottom: {moveX: 0, moveY: 1, direction: "bottom", opposite: "top",}, right: {moveX: 1, moveY: 0, direction: "right", opposite: "left",}, none: {moveX: 0, moveY: 0, direction: "none", opposite: "none",}, }

//https://p5js.org/examples/typography-words.html
//Also, make cursor bigger

var canvasDimension = { width: 1200, height: 640, };

document.body.style.backgroundImage = "url('Images/Background/Attack.jpg')";
document.body.style.cursor = "url('Images/Icons/Cursor.png') 23 23, crosshair";
var mouseCursor = { width: 46, height: 46, };

var gameStatus = "active";

var missileBase = { x: 280, y: 610, directionX: 1, directionY: 1, rotation: -0.5, };

var missile = { data: [], width: 56, height: 30, };
var chargeMeter = { current: 0, max: 100, meterOverLoad: 0, meterOverLoadMax: 15, maxWidth: mouseCursor.width, height: 5, activity: false, };
var gravity = 0.98;

var enemy = { data: [],
              airplane: {width: 86, height: 52, speed: 1},
              propeller: {width: 80, height: 42, speed: 3},
              helicopter: {width: 74, height: 39, speed: 5}, };

var explosion = { data: [], duration: 20,
                  small: {width: 31, height: 27,},
                  big: {width: 93, height: 81,}, };

var killCount = { current:0, toNextLevel: 1, };

var imageSrc = new Object;

function preload() {
    imageSrc["sky"] = loadImage("Images/Background/Sky.jpg");
    //imageSrc["camoflage"] = loadImage("Images/Icons/Camoflage.jpg");
    imageSrc["skyscraper"] = loadImage("Images/Icons/Skyscraper.png");
    imageSrc["missile"] = loadImage("Images/Icons/Missile.png");
    imageSrc["explosion"] = loadImage("Images/Icons/Explosion.png");
    imageSrc["airplane"] = loadImage("Images/Icons/Airplane.png");
    imageSrc["propeller"] = loadImage("Images/Icons/Propeller.png");
    imageSrc["helicopter"] = loadImage("Images/Icons/Helicopter.png");
}

function setup() {
    createCanvas(canvasDimension.width, canvasDimension.height);
    background("skyblue");
    image(imageSrc["sky"], 0, 0, 1200, 640);
    
    strokeWeight(3);
    drawBase();
    
    spawnEnemy(1, "propeller");
}

function draw() {
    background("skyblue");
    image(imageSrc["sky"], 0, 0, 1200, 640);

    var length = missile.data.length;
    if(chargeMeter.activity){
        length -= 1;
    }
    for(var i=0; i<length && missile.data.length>0; i++){
        push();
        if(gameStatus == "active"){
            if(missile.data[i].affectedByGravity){
                missile.data[i].moveY += gravity;
            }

            missile.data[i].x += missile.data[i].moveX;
            missile.data[i].y += missile.data[i].moveY;
        }
        
        var missileRotation = findRotation(missile.data[i].moveX, missile.data[i].moveY);

        translate(missile.data[i].x, missile.data[i].y);
        rotate(missileRotation);
        image(imageSrc["missile"], 0, missile.height/2*-1, missile.width, missile.height);
        pop();


        var scaleFactor = Math.sqrt(Math.pow(missile.width, 2)/(Math.pow(missile.data[i].moveX, 2)+Math.pow(missile.data[i].moveY, 2)));
        var perpendicular = Math.sqrt(Math.pow(missile.height/2, 2)/(Math.pow(missile.data[i].moveX, 2)+Math.pow(missile.data[i].moveY, 2)));

        var x11 = missile.data[i].x+(missile.data[i].moveY*perpendicular);
        var y11 = missile.data[i].y+(missile.data[i].moveX*perpendicular);
        var x12 = missile.data[i].x+(missile.data[i].moveY*perpendicular)+(missile.data[i].moveX*scaleFactor);
        var y12 = missile.data[i].y+(missile.data[i].moveX*perpendicular)+(missile.data[i].moveY*scaleFactor);

        var x21 = missile.data[i].x-(missile.data[i].moveY*perpendicular);
        var y21 = missile.data[i].y-(missile.data[i].moveX*perpendicular);
        var x22 = missile.data[i].x-(missile.data[i].moveY*perpendicular)+(missile.data[i].moveX*scaleFactor);
        var y22 = missile.data[i].y-(missile.data[i].moveX*perpendicular)+(missile.data[i].moveY*scaleFactor);


        //line(missile.data[i].x+(missile.data[i].moveY*perpendicular), missile.data[i].y+(missile.data[i].moveX*perpendicular), missile.data[i].x+(missile.data[i].moveY*perpendicular)+(missile.data[i].moveX*scaleFactor), missile.data[i].y+(missile.data[i].moveX*perpendicular)+(missile.data[i].moveY*scaleFactor));
        //line(missile.data[i].x-(missile.data[i].moveY*perpendicular), missile.data[i].y-(missile.data[i].moveX*perpendicular), missile.data[i].x-(missile.data[i].moveY*perpendicular)+(missile.data[i].moveX*scaleFactor), missile.data[i].y-(missile.data[i].moveX*perpendicular)+(missile.data[i].moveY*scaleFactor));


        if(gameStatus == "active"){
            var exploded = false;
            for(var h=0, enemyLength=enemy.data.length; h<enemyLength; h++){
                if(collideLineRect(x11, y11, x12, y12, enemy.data[h].x, enemy.data[h].y, enemy[enemy.data[h].type].width, enemy[enemy.data[h].type].height) || collideLineRect(x21, y21, x22, y22, enemy.data[h].x, enemy.data[h].y, enemy[enemy.data[h].type].width, enemy[enemy.data[h].type].height)){
                    explosion.data[explosion.data.length] = { x: x12, y: y12, time: 0, type: "small", };
                    enemy.data.splice(h, 1);
                    h -= 1;
                    enemyLength -= 1;
                    killCount.current += 1;
                    if(killCount.current % 9 == 0 && killCount.current % 11 == 0){
                        spawnEnemy(2, "propeller");
                        spawnEnemy(1, "helicopter");
                    }
                    else if(killCount.current % 9 == 0){
                        spawnEnemy(1, "propeller");
                    }
                    else if(killCount.current % 11 == 0){
                        spawnEnemy(1, "helicopter");
                    }
                    else{
                        spawnEnemy(1, "airplane");
                    }
                    if(killCount.current == killCount.toNextLevel){
                        killCount.toNextLevel *= 3;
                        spawnEnemy(1, "airplane");
                    }
                    exploded = true;
                }
            }
            if(exploded || y12 > canvasDimension.height){
                missile.data.splice(i, 1);
                i -= 1;
                length -= 1;
            }
            else if(collideLineRect(x11, y11, x12, y12, 30, 30, 170, 610)){
                explosion.data[explosion.data.length] = {x: x12, y: y12, time: 0, type: "big", };
                missile.data.splice(i, 1);
                i -= 1;
                length -= 1;
            }
        }
    }

    var length = enemy.data.length;
    for(var h=0; h<length; h++){
        if(gameStatus == "active"){
            enemy.data[h].x += enemy.data[h].moveX;
            enemy.data[h].y += enemy.data[h].moveY;

            if(collideRectRect(enemy.data[h].x, enemy.data[h].y, enemy[enemy.data[h].type].width, enemy[enemy.data[h].type].height, 30, 30, 170, 610)){
                explosion.data[explosion.data.length] = {x: enemy.data[h].x, y: enemy.data[h].y + enemy[enemy.data[h].type].height/2, time: 0, type: "big", };
                enemy.data.splice(h, 1);
                h -= 1;
                spawnEnemy(1, "helicopter");
            }
            else if(!collideRectRect(enemy.data[h].x, enemy.data[h].y, enemy[enemy.data[h].type].width, enemy[enemy.data[h].type].height, 0, 0, canvasDimension.width+20, canvasDimension.height)){
                enemy.data.splice(h, 1);
                h -= 1;
                spawnEnemy(1, "helicopter");
            }
        }
        image(imageSrc[enemy.data[h].type], enemy.data[h].x, enemy.data[h].y, enemy[enemy.data[h].type].width, enemy[enemy.data[h].type].height);
    }

    drawBase();

    var length = explosion.data.length;
    for(var e=0; e<length; e++){
        image(imageSrc["explosion"], explosion.data[e].x - explosion[explosion.data[e].type].width/2, explosion.data[e].y - explosion[explosion.data[e].type].height/2, explosion[explosion.data[e].type].width, explosion[explosion.data[e].type].height);
        
        if(gameStatus == "active"){
            if(explosion.data[e].time < explosion.duration){
                explosion.data[e].time += 1;
            }
            else{
                explosion.data.splice(e, 1);
                e -= 1;
                length -= 1;
            }
        }
    }

    if(chargeMeter.activity && missile.data.length > 0){
        push();
        translate(missile.data[missile.data.length-1].x, missile.data[missile.data.length-1].y);
        rotate(missileBase.rotation);
        image(imageSrc["missile"], 0, missile.height/2*-1, missile.width, missile.height);
        pop();

        if(chargeMeter.current < chargeMeter.max){
            chargeMeter.current += 5;
        }
        /*
        else{
            if(chargeMeter.meterOverLoad < chargeMeter.meterOverLoadMax){
                chargeMeter.meterOverLoad += 1;
            }
            else{
                chargeMeter.current = 0;
                chargeMeter.meterOverLoad = 0;
            }
        }
        */
        fill("white");
        rect(mouseX-(chargeMeter.maxWidth/2), mouseY+chargeMeter.height-mouseCursor.height, chargeMeter.maxWidth, chargeMeter.height);
        fill("green");
        rect(mouseX-(chargeMeter.maxWidth/2), mouseY+chargeMeter.height-mouseCursor.height, (chargeMeter.current*chargeMeter.maxWidth)/chargeMeter.max, chargeMeter.height);
    }
}

function drawBase(){
    //imageSrc["skyscraper"].filter("gray");
    image(imageSrc["skyscraper"], -50, -30, 370, 700);
    fill("darkgreen");
    push();
    translate(missileBase.x, missileBase.y);
    rotate(missileBase.rotation);
    rect(0, -5, 50, 10);
    pop();
    ellipse(missileBase.x, missileBase.y, 30, 25);
    //image(imageSrc["camoflage"], missileBase.x - 30, 610, 70, 30);
    rect(missileBase.x - 13, 610, 26, 30);
    rect(missileBase.x - 18, 610, 36, 10);
}

function findRotation(dx, dy){
    var dh = Math.sqrt(Math.pow(dy, 2) + Math.pow(dx, 2));
    var rotationRadian = Math.acos(dx/dh);
    if(dy < 0){
        rotationRadian *= -1;
    } 
    return rotationRadian;
}

function spawnEnemy(amount, type){
    for(var c=0; c<amount; c++){
        enemy.data[enemy.data.length] = new Object;
        enemy.data[enemy.data.length-1].x = canvasDimension.width+20;
        enemy.data[enemy.data.length-1].y = Math.floor(Math.random()*(canvasDimension.height-(enemy[type].height*2)))+enemy[type].height;
        enemy.data[enemy.data.length-1].moveX = -1*enemy[type].speed;
        enemy.data[enemy.data.length-1].moveY = 0;
        enemy.data[enemy.data.length-1].hp = 1;
        enemy.data[enemy.data.length-1].type = type;
        enemy.data[enemy.data.length-1].affectedByGravity = false;
        
        if(type == "propeller" || type == "helicopter"){
		    var differenceX = 0 - enemy.data[enemy.data.length-1].x;
		    var differenceY = Math.floor(Math.random()*(canvasDimension.height-(enemy[type].height*2)))+enemy[type].height - enemy.data[enemy.data.length-1].y;
		    var differenceY = differenceY / Math.abs(differenceX);
		    var differenceX = differenceX / Math.abs(differenceX);
		    var velocity = enemy[type].speed;
		    
		    var scaleFactor = Math.sqrt(Math.pow(velocity, 2)/(Math.pow(differenceX, 2)+Math.pow(differenceY, 2)));
		    
		    enemy.data[enemy.data.length-1].moveX = differenceX * scaleFactor;
		    enemy.data[enemy.data.length-1].moveY = differenceY * scaleFactor;
        }
    }
}

function mouseMoved(){
    var differenceX = mouseX - missileBase.x;
    var differenceY = mouseY - missileBase.y;
    var differenceY = differenceY / Math.abs(differenceX);
    var differenceX = differenceX / Math.abs(differenceX);
    
    missileBase.directionX = differenceX;
    missileBase.directionY = differenceY;
    
    missileBase.rotation = findRotation(missileBase.directionX, missileBase.directionY);
}

function mouseDragged(){
    var differenceX = mouseX - missileBase.x;
    var differenceY = mouseY - missileBase.y;
    var differenceY = differenceY / Math.abs(differenceX);
    var differenceX = differenceX / Math.abs(differenceX);
    
    missileBase.directionX = differenceX;
    missileBase.directionY = differenceY;
    
    missileBase.rotation = findRotation(missileBase.directionX, missileBase.directionY);
}

function mousePressed(){
    if(gameStatus == "active"){
        chargeMeter.activity = true;
        missile.data[missile.data.length] = { x: 280, y: 610, moveX: 0, moveY: 0, affectedByGravity: false, };
        push();
        var differenceX = mouseX - missile.data[missile.data.length-1].x;
        var differenceY = mouseY - missile.data[missile.data.length-1].y;
        var differenceY = differenceY / Math.abs(differenceX);
        var differenceX = differenceX / Math.abs(differenceX);

        var missileRotation = findRotation(differenceX, differenceY);

        translate(missile.data[missile.data.length-1].x, missile.data[missile.data.length-1].y);
        rotate(missileRotation);
        image(imageSrc["missile"], 0, missile.height/2*-1, missile.width, missile.height);
        pop();
    }
}

function mouseReleased(){
    if(gameStatus == "active"){
        push();
        var differenceX = mouseX - missile.data[missile.data.length-1].x;
        var differenceY = mouseY - missile.data[missile.data.length-1].y;
        var differenceY = differenceY / Math.abs(differenceX);
        var differenceX = differenceX / Math.abs(differenceX);
        var initialVelocity = 10 + (chargeMeter.current / 2.5);

        var missileRotation = findRotation(differenceX, differenceY);

        var scaleFactor = Math.sqrt(Math.pow(initialVelocity, 2)/(Math.pow(differenceX, 2)+Math.pow(differenceY, 2)));

        missile.data[missile.data.length-1].moveX = differenceX * scaleFactor;
        missile.data[missile.data.length-1].moveY = differenceY * scaleFactor;
        missile.data[missile.data.length-1].affectedByGravity = true;

        translate(missile.data[missile.data.length-1].x, missile.data[missile.data.length-1].y);
        rotate(missileRotation);
        image(imageSrc["missile"], 0, missile.height/2*-1, missile.width, missile.height);
        pop();

        chargeMeter.activity = false;
        chargeMeter.current = 0;
        chargeMeter.meterOverLoad = 0;
    }
}

function keyPressed(){
    if(keyCode == 32 && gameStatus == 'active'){
        if(chargeMeter.activity){
            missile.data.pop();
            chargeMeter.activity = false;
            chargeMeter.current = 0;
            chargeMeter.meterOverLoad = 0;
            gameStatus = "inactive";
        }
        else{
            gameStatus = "inactive";
        }
    }
    else if(keyCode == 32){
        gameStatus = "active";
        if(mouseIsPressed){
            mousePressed();
        }
    }
}