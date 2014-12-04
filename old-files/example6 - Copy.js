(function() {
  var b2Vec2 = Box2D.Common.Math.b2Vec2;
  var b2BodyDef = Box2D.Dynamics.b2BodyDef;
  var b2Body = Box2D.Dynamics.b2Body;
  var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
  var b2Fixture = Box2D.Dynamics.b2Fixture;
  var b2World = Box2D.Dynamics.b2World;
  var b2MassData = Box2D.Collision.Shapes.b2MassData;
  var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
  var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
  var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;


  var Physics = window.Physics = function(element,scale) {
    var gravity = new b2Vec2(0,9.8);
    this.world = new b2World(gravity, true);
    this.element = element;
    this.context = element.getContext("2d");
    this.scale = scale || 20;
    this.dtRemaining = 0;
    this.stepAmount = 1/60;
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

  var mov = 0;
  Physics.prototype.step = function(dt) {
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
	  //var ctx = this.context;
		this.context.setTransform(1,0,0,1,0,0);//reset the transform matrix as it is cumulative
      this.context.clearRect(0,0,this.element.width,this.element.height);

	  
		/* var pattern = this.context.createPattern(img_bkg, 'repeat');
		this.context.rect(0, 0, this.element.width, this.element.height);
		this.context.fillStyle = pattern;
		this.context.fill(); */
	  
	  
	  
	  mov = mov-3;
	  this.context.translate(mov, 0 );
      this.context.save();
      this.context.scale(this.scale,this.scale);
      while(obj) {
        var body = obj.GetUserData();
        if(body) {  body.draw(this.context); }

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
        callback(fixture.GetBody(),
                 fixture,
                 point);
      },point);
    }

    this.element.addEventListener("mousedown",handleClick);
    this.element.addEventListener("touchstart",handleClick);
  };

  Physics.prototype.dragNDrop = function() {
    var self = this;
    var obj = null;
    var joint = null;

    function calculateWorldPosition(e) {
      return point = {
        x: (e.offsetX || e.layerX) / self.scale,
        y: (e.offsetY || e.layerY) / self.scale
      };
    }

    this.element.addEventListener("mousedown",function(e) {
      e.preventDefault();
      var point = calculateWorldPosition(e);
      self.world.QueryPoint(function(fixture) {
        obj = fixture.GetBody().GetUserData();
      },point);
    });

    this.element.addEventListener("mousemove",function(e) {
      if(!obj) { return; }
      var point = calculateWorldPosition(e);

      if(!joint) {
        var jointDefinition = new Box2D.Dynamics.Joints.b2MouseJointDef();

        jointDefinition.bodyA = self.world.GetGroundBody();
        jointDefinition.bodyB = obj.body;
        jointDefinition.target.Set(point.x,point.y);
        jointDefinition.maxForce = 100000;
        jointDefinition.timeStep = self.stepAmount;
        joint = self.world.CreateJoint(jointDefinition);
      }

      joint.SetTarget(new b2Vec2(point.x,point.y));
    });

    this.element.addEventListener("mouseup",function(e) {
      obj = null;
      if(joint) {
        self.world.DestroyJoint(joint);
        joint = null;
      }
    });

  };


  Physics.prototype.collision = function() {
    this.listener = new Box2D.Dynamics.b2ContactListener();
    this.listener.PostSolve = function(contact,impulse) {
      var bodyA = contact.GetFixtureA().GetBody().GetUserData(),
          bodyB = contact.GetFixtureB().GetBody().GetUserData();

      if(bodyA.contact) { bodyA.contact(contact,impulse,true) }
      if(bodyB.contact) { bodyB.contact(contact,impulse,false) }

    };
    this.world.SetContactListener(this.listener);
  };

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
    this.definition.type = details.type == "static" ? b2Body.b2_staticBody :
                                                      b2Body.b2_dynamicBody;

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
      case "polygon":
        this.fixtureDef.shape = new b2PolygonShape();
        this.fixtureDef.shape.SetAsArray(details.points,details.points.length);
        break;
      case "block":
      default:
        details.width = details.width || this.defaults.width;
        details.height = details.height || this.defaults.height;

        this.fixtureDef.shape = new b2PolygonShape();
        this.fixtureDef.shape.SetAsBox(details.width/2,
                                       details.height/2);
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


  var physics,
      lastFrame = new Date().getTime();

	window.gameLoop = function() {
		var tm = new Date().getTime();
		requestAnimationFrame(gameLoop);
		var dt = (tm - lastFrame) / 1000;
		if(dt > 1/15) { dt = 1/15; }
		physics.step(dt);
		lastFrame = tm;
	};

	var img, img_bkg;
	var beams = [];
	var player;

	function createWorld() {
		var cv = document.getElementById("b2dCanvas");
		var cloud = document.getElementById("container");
		
		cv.width = window.screen.availWidth;
		cv.height = window.screen.availHeight-60;
		
		cloud.style.width = cv.width + 'px';
		cloud.style.height = cv.height + 'px';
		
		
		physics = window.physics = new Physics(cv);
		
		var inner_height = physics.element.height/physics.scale;

		// Remove any old event handlers
		physics.element.removeEventListener("mousedown");
		physics.element.removeEventListener("mousemove");
		physics.element.removeEventListener("mouseup");
console.log(physics.element.height)
		// Create some walls
		new Body(physics, { color: "red", type: "static", x: 0, y: 0, height: 50,  width: 0.5 });
		//new Body(physics, { color: "red", type: "static", x:51, y: 0, height: 50,  width: 0.5});
		new Body(physics, { color: "red", type: "static", x: 0, y: 0, height: 0.5, width: 12000 });
		new Body(physics, { color: "red", type: "static", x: 0, y:inner_height, height: 0.5, width: 12000 });

		//setPillars(physics);

		physics.dragNDrop();
		player = new Body(physics, { color:"red", x: 15, y: 12, width: 2, height:2 }).body;

		
		console.log(player);
		window.addEventListener("keydown", function(){
			var vel = player.GetLinearVelocity();
			vel.x = 10;
			vel.y = -10;
			player.SetLinearVelocity(vel);
		});
	}

	
	function setPillars(physics){
		var inner_height = physics.element.height/physics.scale;
		var wt = 4, orig_ht = ht = inner_height/1.4;
		var bool = 1;
		var x, y, pad = 1;
		var arr = [];
		
		for (var i = -6 ; i <= ht-10; i++) {
			arr.push(i);
		}
		//arr[Math.floor(Math.random()*arr.length)];
		for (var i = 2; i < 3000; i++){
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
			new Body(physics, { image: img, type: "static", x: x, y: y, height: ht,  width: wt });
		}
	}
	
	
	

  var currentJoint = -1;
  var jointTypes  = [ "Distance Joint (solid)",
                      "Distance Joint (springy)",
                      "Revolute Joint",
                      "Prismatic Joint",
                      "Pulley Joint",
                      "Gear Joint"];

  function setupJoint(physics) {
    //currentJoint = (currentJoint + 1) % jointTypes.length;
	currentJoint = 1;

    //var detailElement = document.getElementById("joint-type");
    //detailElement.innerHTML = jointTypes[currentJoint];

    var world = physics.world;
    var def, body1, body2;

    switch(currentJoint) {
      case 0: //  Distance Joint (solid)
        body1 = new Body(physics, { color:"red", x: 15, y: 12 }).body;
        body2 = new Body(physics, { image: img, x: 35, y: 12 }).body;
        def = new Box2D.Dynamics.Joints.b2DistanceJointDef();
        def.Initialize(body1,
                       body2,
                       body1.GetWorldCenter(),
                       body2.GetWorldCenter());
        break;
      case 1: // Distance Joint (springy)
        body1 = new Body(physics, { color:"red", x: 15, y: 12, width: 2, height:2 }).body;
        //body2 = new Body(physics, { image: img, x: 35, y: 12 }).body;
        //def = new Box2D.Dynamics.Joints.b2DistanceJointDef();
        //def.Initialize(body1,
          //             body2,
            //           body1.GetWorldCenter(),
              //         body2.GetWorldCenter());
        //def.dampingRatio = 0.05;
        //def.frequencyHz = 1;
		return body1;
        break;       
      case 2: // Revolute joint
        body1 = new Body(physics, { color:"red", x: 20, y: 12 }).body;
        body2 = new Body(physics, { image: img, x: 24, y: 12 }).body;
        def = new Box2D.Dynamics.Joints.b2RevoluteJointDef();
        def.Initialize(body1,body2,
                       new b2Vec2(22,14));
        break;
      case 3: // Prismatic joint
        body1 = new Body(physics, { color:"red", x: 15, y: 12 }).body;
        body2 = new Body(physics, { image: img, x: 25, y: 12 }).body;
        def = new Box2D.Dynamics.Joints.b2PrismaticJointDef();
        def.Initialize(body1,body2,
                       new b2Vec2(20,14),
                       new b2Vec2(1,0));
        def.enableLimit = true;
        def.lowerTranslation = 4;
        def.upperTranslation = 15;
        break;
      case 4: // Pulley joint
        body1 = new Body(physics, { color:"red", x: 15, y: 12 }).body;
        body2 = new Body(physics, { image: img, x: 25, y: 12 }).body;
        def = new Box2D.Dynamics.Joints.b2PulleyJointDef();

        def.Initialize(body1, body2,
                       new b2Vec2(13,0),
                       new b2Vec2(25,0),
                       body1.GetWorldCenter(),
                       body2.GetWorldCenter(),
                       1);
        break;
      case 5: // Gear Joint
        body1 = new Body(physics, { color:"red", x: 15, y: 12 }).body;
        body2 = new Body(physics, { image: img, x: 25, y: 12 }).body;
        
        var def1 = new Box2D.Dynamics.Joints.b2RevoluteJointDef();
        def1.Initialize(physics.world.GetGroundBody(),
                        body1,
                        body1.GetWorldCenter());
        var joint1 = physics.world.CreateJoint(def1);

        var def2 = new Box2D.Dynamics.Joints.b2RevoluteJointDef();
        def2.Initialize(physics.world.GetGroundBody(),
                        body2,
                        body2.GetWorldCenter());
        var joint2 = physics.world.CreateJoint(def2);

        def = new Box2D.Dynamics.Joints.b2GearJointDef();

        def.bodyA = body1;
        def.bodyB = body2;

        def.joint1 = joint1;
        def.joint2 = joint2;
        def.ratio = 2;
        break;
    }

    //var joint = world.CreateJoint(def);

    //return joint;

  };

  function init() {
    img = new Image(), img_bkg = new Image();

    // Wait for the image to load
    img.addEventListener("load", function() {

      //img_bkg.onload = function() {

		createWorld();
		//window.addEventListener("keydown",createWorld);
		requestAnimationFrame(gameLoop);
      //};
      //img_bkg.src = 'images/wood-pattern.png';
    });

    img.src = "images/log.png";
  }

  window.addEventListener("load",init);
}());




// Lastly, add in the `requestAnimationFrame` shim, if necessary. Does nothing 
// if `requestAnimationFrame` is already on the `window` object.
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = 
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
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


