var mov = 0,  
	physics, 
	lastFrame = new Date().getTime(),
	beams = {obj:[], img:new Image()},
	player = {obj:null, hits:0, life:3, balls:[new Image(), new Image(), new Image(), new Image()], openBall: new Image(), scores: {pt:0, mt: 0}},
	walls = {},
	coins = {obj:[], img:[]},
	destroyObj = [],
	btnActions, is_started = false;
var docBody = document.getElementById('container'),
	scoresObj = document.getElementById('scores'),
	scoreMtObj = scoresObj.querySelector('.mt'),
	scorePtObj = scoresObj.querySelector('.pt'),
	pauseObj = document.getElementById('pause-menu'),
	btnObj = document.querySelectorAll('button'),
	loaderObj = document.getElementById('loader'),
	menuObj = document.getElementById('game-menu'),
	overObj = document.getElementById('over-menu'),
	cvObj = document.getElementById("canvas"),
	bangObj = document.getElementById("bang"),
	tipObj = document.getElementById("tip-menu");

(function() {
	var b2Vec2 = Box2D.Common.Math.b2Vec2,
		b2BodyDef = Box2D.Dynamics.b2BodyDef,
		b2Body = Box2D.Dynamics.b2Body,
		b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
		b2Fixture = Box2D.Dynamics.b2Fixture,
		b2World = Box2D.Dynamics.b2World,
		b2MassData = Box2D.Collision.Shapes.b2MassData,
		b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
		b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
		b2DebugDraw = Box2D.Dynamics.b2DebugDraw;


	var Physics = window.Physics = function(element,scale) {
		var gravity = new b2Vec2(0,9.8);
		this.world = new b2World(gravity, true);
		this.element = element;
		this.context = element.getContext("2d");
		this.scale = scale || 20;
		this.dtRemaining = 0;
		this.stepAmount = 1/60;
		this.isPause = false;
		this.gaveOver = false;
	};

	Physics.prototype.debug = function() {
		this.debugDraw = new b2DebugDraw();
		this.debugDraw.SetSprite(this.context);
		this.debugDraw.SetDrawScale(this.scale);
		this.debugDraw.SetFillAlpha(0.3);
		this.debugDraw.SetLineThickness(1.0);
		this.debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
		this.world.SetDebugDraw(this.debugDraw);
	};

	Physics.prototype.step = function(dt) {
		if(this.isPause) return false;

		this.dtRemaining += dt;
		while(this.dtRemaining > this.stepAmount) {
			this.dtRemaining -= this.stepAmount;
			this.world.Step(this.stepAmount, 
							10, // velocity iterations
							10);// position iterations
		}
		if(this.debugDraw) {
			this.world.DrawDebugData();
		} else {
			var obj = this.world.GetBodyList();
			for (var i in destroyObj) {
				this.world.DestroyBody(destroyObj[i]);
			}
			// Reset the array
			destroyObj.length = 0;
			
			this.context.setTransform(1,0,0,1,0,0);//reset the transform matrix as it is cumulative
			this.context.clearRect(0,0,this.element.width,this.element.height);
			
			var v = player.obj.GetPosition();
			var posX = -v.x * this.scale + this.element.width / 2;
			var posY = -v.y * this.scale + this.element.height / 2;
			
			scoresObj.style.left = -posX + (this.element.width / 2) - 70 +'px';
			if(v.x < (this.element.width/this.scale)/2){
				posX = 0;
			}else{
				scoresObj.style.left = (screen.availWidth/2) - 70 + 'px';
			}
			
			scoresObj.style.top = -posY + (this.element.height / 2) +'px';
			
			this.context.translate(posX, 0); //posY

			this.context.save();
			this.context.scale(this.scale,this.scale);
			while(obj) {
				var body = obj.GetUserData();
				if(body) {
					body.draw(this.context);
				}

				obj = obj.GetNext();
			}
			this.context.restore();
		}
	};


	Physics.prototype.click = function(callback) {
		var self = this;

		function handleClick(e) {
			e.preventDefault();
			var point = {
				x: (e.offsetX || e.layerX) / self.scale,
				y: (e.offsetY || e.layerY) / self.scale
			};

			self.world.QueryPoint(function(fixture) {
				callback(fixture.GetBody(), fixture, point);
			}, point);
		}
	};


	Physics.prototype.collision = function() {
		this.listener = new Box2D.Dynamics.b2ContactListener();

		this.listener.BeginContact = function(contact,impulse) {
			if(physics.getGaveOver()) return false;
			if(contact.GetFixtureB().GetBody().GetUserData().details.userData.name == 'coins'){
				destroyObj.push(contact.GetFixtureB().GetBody());

				var x = player.obj.GetUserData();
				x.details.image = player.openBall;
				player.obj.SetUserData(x);

				player.scores.pt++;
				scorePtObj.innerText = player.scores.pt;
			}

			if(contact.GetFixtureA().GetBody().GetUserData().details.userData.name == 'pillar' || contact.GetFixtureA().GetBody().GetUserData().details.userData.name == 'wall'){
				//return false;
				if(physics.getGaveOver()) return false;
				if(contact.GetFixtureA().GetBody().GetUserData().details.userData.name == 'pillar')
					player.hits++;
				else
					player.hits = player.life; //set game over

				btnActions.speeder = 0;

				var x = player.obj.GetUserData();
				x.details.image = player.balls[player.hits]; //openBall
				x.fixtureDef.density = 1;
				x.fixtureDef.restitution = 1;
				x.fixtureDef.friction = 4
				player.obj.SetUserData(x);

				showHiteffect();

				if(player.hits >= player.life){
					physics.setGaveOver();
					window.removeEventListener("keydown", btnActions.keyActions, false);
					overObj.style.display = 'block';
					var collectedObj = overObj.querySelector('.collected');
					collectedObj.innerHTML = 'Fruits Collected: <span>'+player.scores.pt+'</span>';
					collectedObj.style.display = 'block';
					return false;
				}
				
			}
		}
		this.listener.EndContact = function (contact) {
			if(contact.GetFixtureB().GetBody().GetUserData().details.userData.name == 'coins'){
				//physics.world.DestroyBody(contact.GetFixtureB().GetBody());
				setTimeout(function(){
					var x = player.obj.GetUserData();
					x.details.image = player.balls[player.hits];
					player.obj.SetUserData(x);
				}, 200);
			}
		};
		this.listener.PreSolve = function (contact, oldManifold) {
			//console.log('hit')
		};
		
		this.listener.PostSolve = function(contact,impulse) {
			var bodyA = contact.GetFixtureA().GetBody().GetUserData(),
				bodyB = contact.GetFixtureB().GetBody().GetUserData();

			if(bodyA.contact) { bodyA.contact(contact,impulse,true) }
			if(bodyB.contact) { bodyB.contact(contact,impulse,false) }

			//console.log('XXXXXX');console.log(contact);console.log(bodyA);console.log(bodyB);console.log('XXXXXX');
		};
		
		this.world.SetContactListener(this.listener);
	};

	Physics.prototype.resume = function() {
		this.isPause = false;
	}

	Physics.prototype.pause = function() {
		this.isPause = true;
	}

	Physics.prototype.setGaveOver = function() {
		this.gaveOver = true;
	}

	Physics.prototype.getGaveOver = function() {
		return this.gaveOver;
	}

	Physics.prototype.getPlayStatus = function() {
		return this.isPause;
	}

	var Body = window.Body = function(physics,details) {
		this.details = details = details || {};

		// Create the definition
		this.definition = new b2BodyDef();

		// Set up the definition
		for(var k in this.definitionDefaults) {
		  this.definition[k] = details[k] || this.definitionDefaults[k];
		}
		this.definition.position = new b2Vec2(details.x || 0, details.y || 0);
		this.definition.linearVelocity = new b2Vec2(details.vx || 0, details.vy || 0);
		this.definition.userData = this;
		this.definition.type = details.type == "static" ? b2Body.b2_staticBody : b2Body.b2_dynamicBody;

		// Create the Body
		this.body = physics.world.CreateBody(this.definition);

		// Create the fixture
		this.fixtureDef = new b2FixtureDef();
		for(var l in this.fixtureDefaults) {
			this.fixtureDef[l] = details[l] || this.fixtureDefaults[l];
		}


		details.shape = details.shape || this.defaults.shape;

		switch(details.shape) {
			case "circle":
				details.radius = details.radius || this.defaults.radius;
				this.fixtureDef.shape = new b2CircleShape(details.radius);
				break;
			case "circle2":
				details.radius = details.radius || this.defaults.radius;
				this.fixtureDef.shape = new b2CircleShape(details.radius);
				this.fixtureDef.isSensor = true;
				/*coin.fixtureDef.friction = 0;
				coin.fixtureDef.density = 0;
				coin.fixtureDef.restitution = 0;
				coin.fixtureDef.filter.categoryBits = 4;
				coin.fixtureDef.filter.maskBits = 9;*/
				break;
			case "polygon":
				this.fixtureDef.shape = new b2PolygonShape();
				this.fixtureDef.shape.SetAsArray(details.points,details.points.length);
				break;
			case "block":
			default:
				details.width = details.width || this.defaults.width;
				details.height = details.height || this.defaults.height;

				this.fixtureDef.shape = new b2PolygonShape();
				this.fixtureDef.shape.SetAsBox(details.width/2, details.height/2);
				if(details.sensor) this.fixtureDef.isSensor = true;
				break;
		}
		this.body.CreateFixture(this.fixtureDef);
	};


	Body.prototype.defaults = {
		shape: "block",
		width: 4,
		height: 4,
		radius: 1
	};

	Body.prototype.fixtureDefaults = {
		density: 2,
		friction: 1,
		restitution: 0.2
	};

	Body.prototype.definitionDefaults = {
		active: true,
		allowSleep: true,
		angle: 0,
		angularVelocity: 0,
		awake: true,
		bullet: false,
		fixedRotation: false
	};


	Body.prototype.draw = function(context) {
		var pos = this.body.GetPosition(),
			angle = this.body.GetAngle();

		context.save();
		context.translate(pos.x,pos.y);
		context.rotate(angle);

		if(this.details.color) {
			context.fillStyle = this.details.color;

			switch(this.details.shape) {
				case "circle":
					context.beginPath();
					context.arc(0,0,this.details.radius,0,Math.PI*2);
					context.fill();
					break;
				case "circle2":
					context.beginPath();
					context.arc(0,0,this.details.radius,0,Math.PI*2);
					context.fill();
					break;
				case "polygon":
					var points = this.details.points;
					context.beginPath();
					context.moveTo(points[0].x,points[0].y);
					for(var i=1;i<points.length;i++) {
						context.lineTo(points[i].x,points[i].y);
					}
					context.fill();
					break;
				case "block":
					context.fillRect(-this.details.width/2,
									-this.details.height/2,
									this.details.width,
									this.details.height);
				default:
					break;
			}
		}

		if(this.details.image) {
			context.drawImage(this.details.image,
								-this.details.width/2,
								-this.details.height/2,
								this.details.width,
								this.details.height);
		}
		context.restore();
	}

	window.gameLoop = function() {
		var tm = new Date().getTime();
		requestAnimationFrame(gameLoop);
		var dt = (tm - lastFrame) / 1000;
		if(dt > 1/15) { dt = 1/15; }
		physics.step(dt);
		lastFrame = tm;
		player.scores.mt = player.scores.mt+dt;
		scoreMtObj.innerText = Math.round(player.scores.mt*10);
	};

	function createWorld() {
		physics = window.physics = new Physics(cvObj);
		physics.collision();

		var inner_width = physics.element.width / physics.scale;
		var inner_height = physics.element.height / physics.scale;

		setPillarsAndWalls(physics);
		setCoins(physics);

		player.obj = new Body(physics, {shape: 'circle', image:player.balls[player.hits], x: 5, y: 20, width: 2, height:2, radius:1, userData:{name:'player'} }).body;
		
/* 		setInterval(function(){
			//btnActions.keyActions();
			var im = {x : 10.0, y : 1.0}
			player.obj.ApplyImpulse(im, player.obj.GetPosition());
		}, 100); */

		/*Event Bindings*/
		//window.addEventListener("keydown", btnActions.keyActions, false);

		for(var i=0; i<btnObj.length; i++){
			btnObj[i].addEventListener("click", function(e){
				switch(this.getAttribute('data-action')){
					case 'resume':
						btnActions.pauseOrResume();
						break;
					case 'start':
						menuObj.style.display = 'none';
						tipObj.style.display = 'block';
						btnActions.pauseOrResume(true);
						/*Event Bindings*/
						window.addEventListener("keydown", btnActions.keyActions, false);
						break;
				}
			});
		}
	}

	btnActions = {
		speeder:0,
		keyActions: function(e){
			if(e && e.which == 27){
				btnActions.pauseOrResume();
				return false;
			}
			if(is_started && physics.getPlayStatus()) return false;
			if(player.hits == player.life){
				return false;
			}
			
			if(e && !is_started){
				tipObj.style.display = 'none';
				physics.resume();
				is_started = true;
			}
			var vel = player.obj.GetLinearVelocity();
			vel.x = (player.hits) ? 10 - (player.hits*2) : 10;
			btnActions.speeder = btnActions.speeder+0.2;
			vel.x = vel.x+btnActions.speeder++;
			vel.y = -10;
			player.obj.SetLinearVelocity(vel);
			var im = {x : 24.0, y : 0.0}
			player.obj.ApplyImpulse(im, player.obj.GetPosition());
			//console.log(player.obj)
		},
		pauseOrResume: function(is_pause){
			if(!physics.getPlayStatus()){
				physics.pause();
				pauseObj.style.display = 'block';
			}else{ 
				physics.resume();
				pauseObj.style.display = 'none';
			}
			if(is_pause){
				physics.pause();
				return false;
			}
		}
	}

	function setPillarsAndWalls(physics){
		var inner_height = physics.element.height/physics.scale;
		var wt = 4, orig_ht = ht = inner_height/1.4;
		var bool = 1;
		var x, y, pad = 1;
		var arr = [];
		
		for (var i = -6 ; i <= ht-10; i++) {
			arr.push(i);
		}
		//arr[Math.floor(Math.random()*arr.length)];
		for (var i = 5; i < 3000; i++){
			ht = ht - arr[Math.floor(Math.random()*arr.length)];
			//console.log('ov: '+ht)
			if(ht > orig_ht){
				ht = orig_ht;
			}else if(ht <= 15){
				ht = 15;
			}
			//console.log('nv: '+ht)
			if(bool){
				x = (wt+pad)*(i);
				y = 0;
				bool = 0;
			}else{
				x = (wt+pad)*(i-1);
				y = inner_height; //25
				bool = 1;
			}
			beams.obj.push(new Body(physics, { image: beams.img, type: "static", x: x, y: y, height: ht,  width: wt, userData:{name:'pillar'}, sensor: false }));
		}

		var beamWidth = beams.obj[beams.obj.length-1].details.x+8;
		// Create some walls
		walls.left = new Body(physics, { color: "rgb(93, 198, 250)", type: "static", x: 0, y: 0, height: physics.element.height,  width: 0.5, userData:{name:'wall'} });
		walls.right = new Body(physics, { color: "red", type: "static", x: beamWidth, y: 0, height: physics.element.height,  width: 0.5, userData:{name:'wall'}});
		walls.top = new Body(physics, { color: "rgb(93, 198, 250)", type: "static", x: 0, y: 0, height: 0.5, width: beamWidth, userData:{name:'wall'} });
		walls.bottom = new Body(physics, { color: "rgb(72, 76, 77)", type: "static", x: beamWidth/2, y:inner_height, height: 0.5, width: beamWidth, userData:{name:'wall'} });
	}
	
	function setCoins(physics){
		var x, y;
		var counter = 0;
		// 100 iterations
		var increase = Math.PI * 2 / 100;

		for (var i = 25; i <= 15000; i +=6 ) {
			x = i;
			y = Math.sin(counter) / 2 + 18;
			counter += increase * i;
			var coin = new Body(physics, { shape: 'circle2', image: coins.img[Math.floor(Math.random()*coins.img.length)], type: "static", x: x, y: y, height: 1.4,  width: 1.4, radius:1.4/2, userData:{name:'coins', value:1, i:i}});
			coins.obj.push(coin);
		}
	}

	function init() {
		var preloader = [];
		var imgArray = ['images/flappy-pacman-logo.png', 'images/log.png', 'images/smily-40.png', 'images/smily-40-1.png', 'images/smily-40-2.png', 'images/smily-40-3.png', 'images/coins/c1.png', 'images/coins/c2.png', 'images/coins/c3.png', 'images/coins/c4.png', 'images/coins/c5.png', 'images/coins/c6.png', 'images/coins/c7.png', 'images/coins/c8.png', 'images/coins/c9.png', 'images/coins/c10.png', 'images/coins/c11.png', 'images/coins/c12.png', 'images/coins/c13.png', 'images/coins/c14.png', 'images/coins/c15.png', 'images/coins/c16.png', 'images/coins/c17.png', 'images/coins/c18.png', 'images/coins/c19.png', 'images/coins/c20.png', 'images/coins/c21.png', 'images/bang-hit.png'];

		var $i = 0;
		function loadImg(){
			preloader[$i] = new Image();
			preloader[$i].src = imgArray[$i];
			preloader[$i].onload = function(){
				$i++;
				if($i == imgArray.length){
					for(var i = 0; i<=21-1; i++){
						coins.img[i] = new Image();
						coins.img[i].src = 'images/coins/c'+(i+1)+'.png';
					}

					beams.img.src = 'images/log.png';
					player.balls[0].src = 'images/smily-40.png';
					player.balls[1].src = 'images/smily-40-1.png';
					player.balls[2].src = 'images/smily-40-2.png';
					player.balls[3].src = 'images/smily-40-3.png';
					player.openBall.src = 'images/smily-40-eat.png';

					createWorld();
					requestAnimationFrame(gameLoop);
					setTimeout(function(){physics.pause();}, 1000);
					loaderObj.style.display = 'none';
					menuObj.style.display = 'block';
					return true;
				}
				loadImg();
			}
		}
		loadImg();
	}

	window.addEventListener("load",init);
}());


function showHiteffect(){
	var v = player.obj.GetPosition();
	var posX = -v.x * physics.scale + physics.element.width / 2;
	var posY = -v.y * physics.scale + physics.element.height / 2;
	bangObj.style.display = 'block';
	bangObj.style.left = -posX + (physics.element.width / 2) - 10+'px';
	if(v.x < (physics.element.width/physics.scale)/2){
		posX = 0;
	}else{
		bangObj.style.left = (screen.availWidth/2) - 10 + 'px';
	}
	bangObj.style.top = -posY + (physics.element.height / 2) - 20 +'px';
	setTimeout(function(){bangObj.style.display = 'none';}, 200);
}

function setWindowSize(){
	var cloud = document.getElementById("sky-layer");


	docBody.style.width = window.screen.availWidth + 'px';
	docBody.style.height = window.screen.availHeight-61 + 'px';
	
	cvObj.width = window.screen.availWidth;
	cvObj.height = window.screen.availHeight-61;
	
	cloud.style.width = cvObj.width + 'px';
	cloud.style.height = cvObj.height + 'px';
}
setWindowSize();

// Lastly, add in the `requestAnimationFrame` shim, if necessary. Does nothing 
// if `requestAnimationFrame` is already on the `window` object.
(function() {
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
	}
	if (!window.requestAnimationFrame) {
		window.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
	}
 
	if (!window.cancelAnimationFrame) {
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
	}
}());