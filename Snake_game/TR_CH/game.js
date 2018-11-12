"use strict";
var disp = $('.disp'),
    msg = $('.msg');

var gameRunning = false;
var gameInterval;
var timeStep, 
    frameStep, 
    currTime;
var FALSE_MOVE = 0, 
    GOOD_MOVE = 1,
    ACE_MOVE = 2;
var availablePixels;
var currentCoin;
var initialLength = 16;
var dispWidthInPixels = 40;

for (var i = 0; i < dispWidthInPixels; i++) 
{
    for (var j = 0; j < dispWidthInPixels; j++) 
    {
        var tmp = $('<div class="pixel" data-x="' + j + '" data-y="' + i + '"></div>');
        disp.append(tmp);
    }
}

var beep = document.createElement('audio'),
    gameover = document.createElement('audio');
if (!!(beep.canPlayType && beep.canPlayType('audio/mpeg;').replace(/no/, ''))) 
{
    beep.src = 'beep.mp3';
    gameover.src = 'gameover.mp3'
} else if (!!(beep.canPlayType && beep.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, ''))) 
{
    beep.src = 'beep.ogg';
    gameover.src = 'gameover.ogg';
}

var showMessage = function (ma, mb) 
{
    msg.find('.msg-a').text(ma);
    msg.find('.msg-b').text(mb);
};


//
var useNextRandomPixelForCoin = function()
{
    var ap = availablePixels;
    if(ap.length === 0)
    {
        return false;
    }
    var idx = Math.floor(Math.random() * ap.length);
    currentCoin = ap.splice(idx,1)[0].split('|');
    $('div.pixel[data-x="'+ currentCoin[0] +'"][data-y="'+ currentCoin[1] +'"]').addClass('taken');
    return true;
};

var releasePixel = function(x,y)
{
    $('div.pixel[data-x="' + x + '"][data-y="' + y + '"]').removeClass('taken');
    availablePixels.push(x + '|' + y);
};

//如果成功回傳True，除此外皆False
var tryAllocatingPixel=function(x,y)
{
    var ap =availablePixels;
    var p = x + '|' + y;
    var idx = ap.indexOf(p);
    if (idx !== -1)
    {
        ap.splice(idx,1);
        $('div.pixel[data-x="'+ x +'"][data-y="'+ y +'"]').addClass('taken')
        return true;
    }
    else
    {
        return false;
    }
};

var adjustSpeed = function(l)
{
    if (l > 500)
    {
        frameStep = 50;
    }
    else if( l >= 400)
    {
        frameStep = 100;
    }
    else if(l >= 300)
    {
        frameStep = 150
    }
    else if(l >= 200)
    {
        frameStep = 200;
    }
};

var DIR_DOWN = 'd',
    DIR_UP = 'u',
    DIR_LEFT = 'l',
    DIR_RIGHT = 'r';

var snake =
{
    direction: 'l',
    bodyPixels:[],
    move: function()
    {
        var head = this.bodyPixels[this.bodyPixels.length - 1];

        //指出下一個位置
        var nextHead = [];
        if (this.direction === DIR_LEFT)
        {
            nextHead.push(head[0] - 1);
        }
        else if (this.direction === DIR_RIGHT)
        {
            nextHead.push(head[0] + 1);
        }
        else
        {
            nextHead.push(head[0]);
        }
        if (this.direction === DIR_UP)
        {
            nextHead.push(head[1] - 1);
        }
        else if (this.direction === DIR_DOWN)
        {
            nextHead.push(head[1] + 1);
        }
        else
        {
            nextHead.push(head[1]);
        }

        //判斷不同移動的結果
        if (nextHead[0] == currentCoin[0] && nextHead[1] == currentCoin[1])
        {
            this.bodyPixels.push(nextHead);
            beep.play();
            adjustSpeed(this.bodyPixels.length);
            if (useNextRandomPixelForCoin())
            {
                return GOOD_MOVE;
            }
            else
            {
                return ACE_MOVE;
            }
        }
        else if (tryAllocatingPixel(nextHead[0], nextHead[1]))
        {
            var tail = this.bodyPixels.splice(0,1)[0];
            this.bodyPixels.push(nextHead);
            releasePixel(tail[0],tail[1]);
            return GOOD_MOVE;
        }
        else
        {
            return FALSE_MOVE;
        }
    }
};

var initializeGame = function()
{
    frameStep = 250;
    timeStep = 50;
    currTime = 0;
    $('.pixel').removeClass('taken');
    //初始化所有pixels
    availablePixels = [];
    for(var i=0;i < dispWidthInPixels;i++)
    {
        for (var j = 0;j < dispWidthInPixels;j++)
        {
            availablePixels.push(i + '|' + j);
        }
    }

    //初始化蛇
    snake.direction='l';
    snake.bodyPixels=[];
    for (var i=29,end =29-16;i>end;i--)
    {
        tryAllocatingPixel(i,25);
        snake.bodyPixels.push([i,25]);
    }

    //初始化硬幣
    useNextRandomPixelForCoin();
};

var startMainLoop = function()
{
    gameInterval = setInterval(function()
    {
        currTime += timeStep;
        if(currTime >= frameStep)
        {
            var m = snake.move();
            if(m === FALSE_MOVE)
            {
                clearInterval(gameInterval);
                gameRunning = false;
                gameover.play();
                showMessage('Game Over','Press space to restart');
            }
            else if(m === ACE_MOVE)
            {
                clearInterval(gameInterval);
                gameRunning = false;
                showMessage('You Won！','Press space to replay');
            }
            currTime %= frameStep;
        }
    }, timeStep);
    showMessage('','');
};

$(window).keydown(function (e)
{
    var k = e.keyCode || e.which;

    //開始
    if (k === 32) 
    {
        e.preventDefault();
        if (!gameRunning)
        {
            initializeGame();
            startMainLoop();
            gameRunning = true;
        }
        
    }

    //暫停
    else if (k === 80) 
    {
        if(gameRunning)
        {
            if(!gameInterval)
            {
                startMainLoop();
            }
            else
            {
                clearInterval(gameInterval);
                gameInterval = null;
                showMessage('Paused','');
            }
        }
    }

    //上
    if (k === 38) 
    {
        e.preventDefault();
        if (snake.direction !== DIR_DOWN)
            snake.direction = DIR_UP;
    }

    //下
    else if (k === 40) 
    {   
        e.preventDefault();
        if (snake.direction !== DIR_UP)
            snake.direction = DIR_DOWN;
    }

    //左
    else if (k === 37) 
    {
        e.preventDefault();
        if (snake.direction !== DIR_RIGHT)
            snake.direction = DIR_LEFT;
    }

    //右
    else if (k === 39) 
    {
        e.preventDefault();
        if (snake.direction !== DIR_LEFT)
            snake.direction = DIR_RIGHT;
    }

    //蛇方向左轉
    if(k === 70) 
    {
        if(snake.direction === DIR_DOWN)
            snake.direction = DIR_RIGHT;
        else if (snake.direction === DIR_UP)
            snake.direction === DIR_LEFT;
        else if (snake.direction === DIR_RIGHT)
            snake.direction === DIR_UP;
        else if (snake.direction === DIR_LEFT)
            snake.direction === DIR_DOWN;
    
    }
    
    //蛇方向右轉
    else if(k === 74)
    {
        if(snake.direction === DIR_DOWN)
            snake.direction = DIR_LEFT;
        else if (snake.direction === DIR_UP)
            snake.direction === DIR_RIGHT;
        else if (snake.direction === DIR_RIGHT)
            snake.direction === DIR_DOWN;
        else if (snake.direction === DIR_LEFT)
            snake.direction === DIR_UP;
    }
});

showMessage('Snake','Press space to start');