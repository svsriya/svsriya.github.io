
var scene, camera, renderer;
var controls;
var objects = [];
var raycaster;
var moveForward = false;
var moveBack = false;
var moveRight = false;
var moveLeft = false;
var mouse = new THREE.Vector2();
// interactive objects
var interactObjs = [];
var lamp;
var lightsOn = [];
var lightPuzzleSolved = false;
var bookClickedOn = false;
var bookpage;
var desks;
var map_instructions;
var mapInstructsClickedOn = false;
// animations for animating
var animations = [];
var mixer;
var rotate_bookshelf;
var have_battery = false;
var batteredup = false;
// variables for objects the user picks up
var pickupable = [];
var doorKey;
var clicked = false;
var pickedUp = false;
var pickedUpObject;
var objOgLocation = new THREE.Vector3();
//Shows whether or not the player has won the game
var winner = false;
var winScreen = document.getElementById('win');
//Shows whether or not the player is entering the clock's time
var clocking = false;
var have_key = false;
var clockScreen = document.getElementById('set-clock');
//Keeps track of time and physics elements of the game
var prevTime = performance.now();
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var vertex = new THREE.Vector3();
// for sound effects
var soundEffects = [];

function init()
{
  // setting the scene
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 100);

  //Changed initial position of player
  camera.lookAt( new THREE.Vector3(0,0,-10) );
  camera.position.z = 3;
  scene.add(camera);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  // add this in case the window is resized
  window.addEventListener( 'resize', function(){
    var width = window.innerWidth;
    var height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width/height;
    camera.updateProjectionMatrix();
  });

  //camera target
  var targetGeometry = new THREE.RingGeometry(0.01,0.02,18);
  var targetMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: false });
  var target = new THREE.Mesh(targetGeometry, targetMaterial);
  scene.add(target);
  camera.add(target);
  target.position.set(0,0,-1);

  // pointer lock controls
  controls = new THREE.PointerLockControls( camera, document.body );

  var blocker = document.getElementById('blocker');
  var instructions = document.getElementById('instructions');
  var clock_button = document.getElementById('button');
  var time1 = document.getElementById('time1');
  var time2 = document.getElementById('time2');
  var incorrect = document.getElementById('incorrect');

  instructions.addEventListener( 'click', function(){
    controls.lock();
  }, false);

  button.addEventListener( 'click', function() {
	  if (time1.value.startsWith('12') && time2.value.startsWith('46')){
		  keyDrop();
		  clocking = false;
		  clockScreen.style.display = 'none';
		  scene.visible = true;
		  controls.lock();
	  } else {
		  incorrect.style.visibility = 'visible';
	  }
  });

  controls.addEventListener( 'lock', function(){
    if (!winner && !clocking){
		instructions.style.display = 'none';
		blocker.style.display = 'none';
		winScreen.style.display = 'none';
		clockScreen.style.display = 'none';
		scene.visible = true;
		clocking = false;
	}
  });

  controls.addEventListener( 'unlock', function(){
	if (!winner && !clocking){
		blocker.style.display = 'block';
		instructions.style.display = '';
		winScreen.style.display = 'none';
		clockScreen.style.display = 'none';
		scene.visible = false;
	}
  });

  scene.add( controls.getObject() );

  // this is for checking what key was clicked
  var onKeyDown = function(event){
	if (!bookClickedOn){
		switch( event.keyCode )
		{
			case 38: // up arrow key
				moveForward = true;
				break;
			case 37:  // left arrow key
				moveLeft = true;
				break;
			case 40:  // down arrow key
				moveBack = true;
				break;
			case 39:  // right arrow key
				moveRight = true;
				break;
		}
	}
  };

  // after the key is released
  var onKeyUp = function(event){

    switch( event.keyCode )
    {
      case 38: // up arrow key
        moveForward = false;
        break;
      case 37:  // left arrow key
        moveLeft = false;
        break;
      case 40:  // down arrow key
        moveBack = false;
        break;
      case 39:  // right arrow key
        moveRight = false;
        break;
	  case 27: //escape key
	   if (clocking){
		   clocking = false;
		   controls.lock();
	   }
	  case 68:  // D key pressed, dropping object
        if(pickedUp)
        {
          // set object to its original location
          camera.remove(pickedUpObject);
          pickedUpObject.position.set(objOgLocation.x, objOgLocation.y, objOgLocation.z);
          scene.add(pickedUpObject);
          console.log(pickedUpObject.position);
          pickedUp = false;
        }
        else if(bookClickedOn)
        {
          bookClickedOn = false;
          camera.remove(bookpage);
          playSound('bkclose');
        } else if (mapInstructsClickedOn){
		    	mapInstructsClickedOn = false;
			    camera.remove(map_instructions);
		 }
        break;
	  /*case 82:
		if (winner){
			winner = false;
			blocker.style.display = 'none';
			winScreen.style.display = 'none';

			init();
		}
		break;*/
    }
  };

  var onclick = function(event) {
		if (document.pointerLockElement != null){
			clicked = true;
		}
  };

  var onmousemove = function (event) {
		if (document.pointerLockElement != null){
			mouse.x = 0.48 * 2 - 1;
			mouse.y = 0.48 * 2 - 1;
		} else {
			mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
			mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
		}
    // for changing the target color
    var rayray  = new THREE.Raycaster();
    rayray.setFromCamera( mouse, camera );
    var intersects = rayray.intersectObjects(interactObjs, true);
    if( intersects.length > 0 )
    {
      var obj = getAncestor(intersects[0].object);
      target.material.color.setHex(0xff0000);
      target.scale.set(1.2,1.2,1.2);
    }
    else
    {
      target.material.color.setHex(0x000000);
      target.scale.set(5.0/6,5.0/6,5.0/6);
    }
	};

  document.addEventListener( 'keydown', onKeyDown, false );
  document.addEventListener( 'keyup', onKeyUp, false );
  document.addEventListener( 'click', onclick, false );
  document.addEventListener( 'mousemove', onmousemove, false );

  raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(0,-1,0), 0, 10);

  // create the empty room

  // floor
  var floorGeometry = new THREE.CubeGeometry(30, 1, 40);
  var floorMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: false, map: new THREE.TextureLoader().load('images/floor.jpg') });
  var floorCube = new THREE.Mesh(floorGeometry, floorMaterial);
  floorCube.position.y = -5;
  scene.add( floorCube );

  // ceiling
  var ceilingGeometry = new THREE.CubeGeometry(30, 1, 40);
  var ceilingMaterial = new THREE.MeshBasicMaterial({ color: 0xdfdfdf, wireframe: false, map: new THREE.TextureLoader().load('./images/ceiling.jpg') });
  var ceilingCube = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceilingCube.position.y = 5;
  scene.add( ceilingCube );

  // left wall
  var leftWallGeometry = new THREE.CubeGeometry(1, 10, 40);
  var leftWallMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: false, map: new THREE.TextureLoader().load('./images/wall.jpg') });
  var leftWallCube = new THREE.Mesh(leftWallGeometry, leftWallMaterial);
  leftWallCube.position.x = -15;
  scene.add( leftWallCube );

  // right wall
  var rightWallGeometry = new THREE.CubeGeometry(1, 10, 40);
  var rightWallMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: false, map: new THREE.TextureLoader().load('./images/wall.jpg') });
  var rightWallCube = new THREE.Mesh(rightWallGeometry, rightWallMaterial);
  rightWallCube.position.x = 15;
  scene.add( rightWallCube );

  // front wall
  var frontWallGeometry = new THREE.CubeGeometry(30, 10, 1);
  var frontWallMaterial = new THREE.MeshBasicMaterial({ color: 0xfdfdfd, wireframe: false, map: new THREE.TextureLoader().load('./images/wall.jpg') });
  var frontWallCube = new THREE.Mesh(frontWallGeometry, frontWallMaterial);
  frontWallCube.position.z = -20;
  scene.add( frontWallCube );

  // back wall
  var backWallGeometry = new THREE.CubeGeometry(30, 10, 1);
  var backWallMaterial = new THREE.MeshBasicMaterial({ color: 0xfdfdfd, wireframe: false, map: new THREE.TextureLoader().load('./images/wall.jpg') });
  var backWallCube = new THREE.Mesh(backWallGeometry, backWallMaterial);
  backWallCube.position.z = 20;
  scene.add( backWallCube );

  // lighting
  var ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);
  var spotLight1 = new THREE.SpotLight( 0xffffff, 10, 100 );
  spotLight1.position.set(0, 3, 0);
  var light1 = new THREE.PointLight( 0xffffff, 4, 10 );
  light1.position.set(4, -2, 18);
  scene.add( light1 );
  var light2 = new THREE.PointLight( 0xffffff, 4, 10 );
  light2.position.set(-0.5, -2, 18);
  scene.add( light2 );
  var light3 = new THREE.PointLight( 0xffffff, 4, 10 );
  light3.position.set(-5, -2, 18);
  scene.add( light3 );
  var light4 = new THREE.PointLight( 0xffffff, 4, 10 );
  light4.position.set(-9.5, -2, 18);
  scene.add( light4 );
  var light5 = new THREE.PointLight( 0xffffff, 4, 10 );
  light5.position.set(0, 0, 0);
  scene.add( light5 );

  // symbols painting
  var loader = new THREE.GLTFLoader();
  loader.load('./models/symbols_painting/scene.gltf', function(gltf){
    var symbolPainting = new THREE.Object3D();
    symbolPainting = gltf.scene;
    symbolPainting.scale.set(0.1,0.1,0.1);
    symbolPainting.position.set(-14.25, 0, 0);
    scene.add(symbolPainting);
  });

  // desks
  desks = new THREE.Object3D();
  desks.deskList = [];
  loader.load('./models/computerdesk/scene.gltf', function(gltf){
    var desk = new THREE.Object3D();
    desk = gltf.scene;
    desk.scale.set(0.02,0.02,0.02);
    for(var i = 0; i < 4; i++)
    {
      var cloneDesk = desk.clone();
      cloneDesk.position.set(4-i*4.5,-4.5,18.8);
      desks.add(cloneDesk);
      desks.deskList.push(cloneDesk);
    }
  });
  scene.add(desks);

  // desk chairs
  var chairs = new THREE.Object3D();
  loader.load('./models/deskchair/scene.gltf', function(gltf){
    var chair = new THREE.Object3D();
    chair = gltf.scene;
    chair.scale.set(0.08,0.08,0.08);
    for( var i = 0; i < 4; i++ )
    {
      var cloneChair = chair.clone();
      cloneChair.position.set(4-i*4.5, -1.7, 18);
      // orient chair correctly
      cloneChair.rotation.y = -Math.PI/2;
      chairs.add(cloneChair);
    }
  });
  scene.add(chairs);

  // book table
  var bookTable = new THREE.Object3D();
  loader.load('./models/table/scene.gltf', function(gltf){
    bookTable = gltf.scene;
    bookTable.position.set(9,-5,0);
    bookTable.scale.set(3, 3, 3);
    bookTable.rotation.y = Math.PI/2;
    scene.add(bookTable);
  });

  // symbolBook + lightBook
  loader.load('./models/book/scene.gltf', function(gltf){
      var symbolBook = new THREE.Object3D();
      symbolBook = gltf.scene;
      symbolBook.scale.set(0.3,0.3,0.3);
      symbolBook.position.set(9, -2.5, 0);
      symbolBook.rotation.y = Math.PI/2;
      symbolBook.name = 'symbolBook';
      scene.add(symbolBook);
      interactObjs.push(symbolBook);
      var lightBook = symbolBook.clone();
      lightBook.position.set(9, -2.5, 2);
      lightBook.name = 'lightBook';
      scene.add(lightBook);
      interactObjs.push(lightBook);
      var finalBook = symbolBook.clone();
      // final book for the order of the digits
      finalBook.position.set(10, -2.5, 0);
      finalBook.name = 'finalBook';
      scene.add(finalBook);
      interactObjs.push(finalBook);
  });



  // instruction book
  loader.load('./models/fancybook/scene.gltf', function(gltf){
    var instructionBook = new THREE.Object3D();
    instructionBook = gltf.scene;
    instructionBook.position.set(0,-1.7,-2);
    instructionBook.scale.set(0.4,0.4,0.4);
    instructionBook.rotation.y = -Math.PI/2;
    instructionBook.name = 'instructionBook';
    scene.add(instructionBook);
    interactObjs.push(instructionBook);
  });

  // round table for instruction book
  loader.load('./models/roundtable/scene.gltf', function(gltf){
    var roundTable = new THREE.Object3D();
    roundTable = gltf.scene;
    roundTable.position.set(0,-5,-2);
    roundTable.scale.set(0.25,0.5,0.25);
    scene.add(roundTable);
  });

  // bookshelf models 
  loader.load('./models/swing_bookshelf/bookshelf.gltf', function(gltf){
	  var bookshelfB = new THREE.Object3D();
	  bookshelfB = gltf.scene;
	  bookshelfB.position.set(13.75, -4.5, 0);
	  bookshelfB.scale.set(0.7, 0.7, 0.7);
	  bookshelfB.rotation.y = -Math.PI / 2;
	  bookshelfB.name = 'shelf';
	  animations.push(gltf.animations);
	  interactObjs.push(bookshelfB);
	  scene.add(bookshelfB);
  });

  loader.load('./models/bookshelves/bookshelf_black.gltf', function(gltf){
	  var bookshelfB = new THREE.Object3D();
	  bookshelfB = gltf.scene;
	  bookshelfB.position.set(-13.75, -4.5, 10);
	  bookshelfB.scale.set(0.65, 0.65, 0.65);
	  bookshelfB.rotation.y = Math.PI / 2;
	  scene.add(bookshelfB);
  });
  loader.load('./models/bookshelves/bookshelf_black.gltf', function(gltf){
	  var bookshelfB = new THREE.Object3D();
	  bookshelfB = gltf.scene;
	  bookshelfB.position.set(-13.75, -4.5, -10);
	  bookshelfB.scale.set(0.65, 0.65, 0.65);
	  bookshelfB.rotation.y = Math.PI / 2;
	  scene.add(bookshelfB);
  });

  loader.load('./models/bookshelves/bookshelf_black.gltf', function(gltf){
	  var bookshelfB = new THREE.Object3D();
	  bookshelfB = gltf.scene;
	  bookshelfB.position.set(-13.75, -4.5, 7);
	  bookshelfB.scale.set(0.65, 0.65, 0.65);
	  bookshelfB.rotation.y = Math.PI / 2;
	  scene.add(bookshelfB);
  });

  loader.load('./models/bookshelves/bookshelf_black.gltf', function(gltf){
	  var bookshelfB = new THREE.Object3D();
	  bookshelfB = gltf.scene;
	  bookshelfB.position.set(-13.75, -4.5, -7);
	  bookshelfB.scale.set(0.65, 0.65, 0.65);
	  bookshelfB.rotation.y = Math.PI / 2;
	  scene.add(bookshelfB);
  });

  loader.load('./models/bookshelves/bookshelf_black.gltf', function(gltf){
	  var bookshelfB = new THREE.Object3D();
	  bookshelfB = gltf.scene;
	  bookshelfB.position.set(13.75, -4.5, 10);
	  bookshelfB.scale.set(0.65, 0.65, 0.65);
	  bookshelfB.rotation.y = -Math.PI / 2;
	  scene.add(bookshelfB);
  });
  loader.load('./models/bookshelves/bookshelf_black.gltf', function(gltf){
	  var bookshelfB = new THREE.Object3D();
	  bookshelfB = gltf.scene;
	  bookshelfB.position.set(13.75, -4.5, -10);
	  bookshelfB.scale.set(0.65, 0.65, 0.65);
	  bookshelfB.rotation.y = -Math.PI / 2;
	  scene.add(bookshelfB);
  });

  loader.load("models/door.gltf", function(gltf){
	  var niceDoor = new THREE.Object3D();
	  niceDoor = gltf.scene;
	  niceDoor.position.set(0, -3.25, -19.25);
	  niceDoor.scale.set(0.8, 0.8, 0.8);
	  niceDoor.name = 'door';
	  interactObjs.push(niceDoor);
	  scene.add(niceDoor);
  });

  //map
  loader.load('./models/puzzle_map/puzzle-map.gltf', function(gltf){
	  var map = new THREE.Object3D();
	  map = gltf.scene;
	  map.position.set(8, 0, -19.25);
	  map.rotation.y = Math.PI / 2;
	  map.rotation.z = Math.PI / 2;
	//  interactObjs.push(map);
	  map.name = 'map';
	  scene.add(map);
  });

  //plaque
  loader.load('./models/plaque.gltf', function(gltf){
	  var plaque = new THREE.Object3D();
	  plaque = gltf.scene;
	  plaque.scale.set(0.5, 0.5, 0.5);
	  plaque.position.set(5, 0, -19.25);
	  plaque.rotation.y = -Math.PI / 2;
	  interactObjs.push(plaque);
	  plaque.name = 'plaque';
	  scene.add(plaque);
  });

  //alarm
  loader.load('./models/digital-clock.gltf', function(gltf){
	  var clock = new THREE.Object3D();
	  clock = gltf.scene;
	  interactObjs.push(clock);
	  clock.position.set(7.75, -2, -2);
	  clock.scale.set(0.5, 0.5, 0.5);
	  clock.rotation.y = -Math.PI / 2;
	  clock.name = 'clock';
	  scene.add(clock);
  });

	// desk lamps and lights
  loader.load('./models/desk_lamp/scene.gltf', function(gltf){
    lamp = new THREE.Object3D();
    lamp = gltf.scene;
    lamp.scale.set(0.5,0.5,0.5);
    var lightColors = [0x00ff00, 0xff0000, 0x0000ff, 0xffff00];
    for( var i = 0; i < 4; i++ )
    {
      var lampClone = lamp.clone();
      lampClone.position.set(5-i*4.5,-2,18.8);
      lampClone.name = 'lamp' + (i+1);
      lampClone.turnedOn = false;
      // orient lamp
      var newDir = new THREE.Vector3(1,0,-1);
      var pos = new THREE.Vector3();
      pos.addVectors(newDir, lampClone.position);
      lampClone.lookAt(pos);
      interactObjs.push(lampClone);
      scene.add(lampClone);
      // desks directional lights
      var pl = new THREE.PointLight(lightColors[i], 10, 1, 2);
      pl.intensity = 0;
      pl.position.set(0.5,1,0);
      lampClone.add(pl);
      lampClone.light = pl;
      //var helper = new THREE.PointLightHelper( d1, 1 );
      //scene.add(helper);
    }
  });

  // loading sound effects
  var listener = new THREE.AudioListener();
  camera.add( listener );
  var audioLoader = new THREE.AudioLoader();

  audioLoader.load( 'audio/lampon.aiff', function(buffer){
    var sound = new THREE.Audio(listener);
    sound.setBuffer(buffer);
    sound.name = 'lamp';
    soundEffects.push(sound); // 0
  });
  audioLoader.load( 'audio/computeron.wav', function(buffer){
    var sound = new THREE.Audio(listener);
    sound.setBuffer(buffer);
    sound.name = 'comp';
    soundEffects.push(sound); // 1
  });
  audioLoader.load( 'audio/bookopen.mp3', function(buffer){
    var sound = new THREE.Audio(listener);
    sound.setBuffer(buffer);
    sound.name = 'bkopen';
    soundEffects.push(sound); // 2
  });
  audioLoader.load( 'audio/bookclose.wav', function(buffer){
    var sound = new THREE.Audio(listener);
    sound.setBuffer(buffer);
    sound.setVolume(0.5);
    sound.name = 'bkclose';
    soundEffects.push(sound); // 3
  });

  // initial display is only the instructions
	winScreen.style.display = 'none';
	clockScreen.style.display = 'none';
	scene.visible = false;

  GameLoop();
}

window.onload = init;

// checks if object is in list
function containsObj( obj, list )
{
  for( var i = 0; i < list.length; i++ )
  {
    if( list[i].name == obj.name )
      return true;
  }
  return false;
}

// finds the senior most parent of the object (ie the whole model rather than its parts)
function getAncestor(obj)
{
  while( !containsObj(obj, interactObjs) )
    obj = obj.parent;
  return obj;
}

// plays the sound for the given sound name
function playSound(soundName)
{
  for(var i = 0; i < soundEffects.length; i++)
  {
    if( soundEffects[i].name == soundName ){
      soundEffects[i].play();
      break;
    }
  }
}


function update()
{
  // for pointerlock controls
	var time = performance.now();
    var delta = (time - prevTime) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 100.0 * delta;  // 100.0 = mass

    direction.z = Number( moveForward ) - Number( moveBack );
    direction.x = Number( moveRight ) - Number( moveLeft );
    direction.normalize(); // this ensures consistent movements in all directions

    if( moveForward || moveBack ) velocity.z -= direction.z * 400.0 * delta;
    if( moveLeft || moveRight ) velocity.x -= direction.x * 400.0 * delta;

    controls.moveRight( -velocity.x * delta );
    controls.moveForward( -velocity.z * delta );

  // this is used to sense any objects that the mouse has clicked on
	var rayray  = new THREE.Raycaster();
	rayray.setFromCamera( mouse, camera );
	var intersects = rayray.intersectObjects(interactObjs, true);

	if (mixer) {
		mixer.update(delta);
	}

	if (clicked){
		if (pickedUp){
			if (intersects.length > 1) {
				var obj = intersects[0].object;
				obj = getAncestor(obj);
				if (obj.name.startsWith('door') && pickedUpObject.name.startsWith('Torus_1')){
					win();
				}
			}
		} else if(!bookClickedOn) {
      console.log('intersects length: ' + intersects.length);
      // check if a gltf model was selected
      if(intersects.length > 1)
      {
        var obj = intersects[0].object;
        obj = getAncestor(obj);
        console.log('object selected: ' + obj.name);

        // LAMP PUZZLE interaction for the lamps (turning on and off)
        if( obj.name.startsWith('lamp') )
        {
          // play sound
          playSound('lamp');
          // flip the lamp's switch
          obj.turnedOn = !obj.turnedOn;
          console.log('light on: ' + obj.turnedOn );
          if( obj.turnedOn ){
            // add to list of lights turned on
            lightsOn.push(obj);
            // blue light is kinda weak, so it needs more intensity
            if(obj.name == 'lamp3')
              obj.light.intensity = 100;
            else
              obj.light.intensity = 10
          }
          else {
            // check if lights need to be reset
            if( lightsOn.length == 4 )
            {
              // reset the puzzle and turn off lights
              lightsOn.forEach(l => {l.light.intensity = 0;l.turnedOn=false;});
              lightsOn = [];
            }
            else
            {
              // remove from list of lights turned on
              lightsOn = lightsOn.filter(function(l){
                if( l != obj ) return l;
              });
              obj.light.intensity = 0;
            }
          }
          // check if the puzzle has been solved
          if( lightsOn.length == 4 && !lightPuzzleSolved )
          {
            var correctOrder = ['lamp4','lamp2','lamp3','lamp1'];
            var solved = true;
            for( var i = 0; i < 4; i++ )
            {
              if( lightsOn[i].name != correctOrder[i] )
                solved = false;
            }
            if(solved)
            {
              console.log('lights puzzle solved!!');
              // play sound
              playSound('comp');
              lightPuzzleSolved = true;
              // display the number
              var geometry = new THREE.PlaneGeometry(0.5,0.5);
              var texture = new THREE.TextureLoader().load('./models/computerdesk/computerscreen.jpg');
              var material1 = new THREE.MeshBasicMaterial( {map: texture, color:0xffffff} );
              var compScreen = new THREE.Mesh(geometry, material1);
              compScreen.position.set(4.05,-1.45,18.62);
              compScreen.rotateY(Math.PI);
              scene.add(compScreen);
            }
            else
            {
              console.log('incorrect order, click to reset');
            }
          }
        }
        else if( obj.name.endsWith('Book') )
        {
          if(!bookClickedOn)
          {
            // play sound
            playSound('bkopen');
            bookClickedOn = true;
            var material = new THREE.SpriteMaterial( { map: new THREE.TextureLoader().load( "images/" + obj.name+".png"), color: 0xffffff } );
            bookpage = new THREE.Sprite( material );
            camera.add( bookpage );
            bookpage.position.set(0,0,-0.7);
            console.log('clicked on book');
          }
        } else if (obj.name.startsWith('clock')){
			if (!have_key){
				clocksetter();
			}
		} else if (obj.name.startsWith('shelf')){
			mixer = new THREE.AnimationMixer(obj);
			var anim = THREE.AnimationClip.findByName(animations[0], 'BookshelfAction');
			rotate_bookshelf = mixer.clipAction(anim);
			rotate_bookshelf.setLoop(THREE.LoopOnce);
			rotate_bookshelf.clampWhenFinished = true;
			rotate_bookshelf.play();
		}
		else if (obj.name.startsWith('plaque')){
			if (!mapInstructsClickedOn){
			mapInstructsClickedOn = true;
			 var material = new THREE.SpriteMaterial( { map: new THREE.TextureLoader().load( "images/markson.png" ), color: 0xffffff } );
			 map_instructions = new THREE.Sprite( material );
            camera.add( map_instructions );
            map_instructions.position.set(0,0,-1);
			}
		 }
   }
      // logic for picking up objects
			for ( var i = 0; i < intersects.length; i++ ) {
        // check if the object in the raycaster is pickupable, and if so pick it up
        if( containsObj(getAncestor(intersects[i].object), pickupable) )
        {
          // save the original location of object so user drops in the original place if they want to drop an object
          objOgLocation.x = getAncestor(intersects[i].object).position.x;
          objOgLocation.y = getAncestor(intersects[i].object).position.y;
          objOgLocation.z = getAncestor(intersects[i].object).position.z;
  				// intersects[i].object.position.y = camera.position.y;
          // add to camera to simulate picking up
  				camera.add(getAncestor(intersects[i].object));
  				getAncestor(intersects[i].object).position.set(2,-2,-5);
				pickedUpObject = intersects[0].object;
				console.log(pickedUpObject.name);
				pickedUp = true;
        }
        //console.log('intersect object position' + intersects[i].object.position);
			}

		}
		clicked = false;
	}

    prevTime = time;
}

function keyDrop (){

  if (!have_key){
		var loader = new THREE.GLTFLoader();
	//key

  loader.load('./models/low-poly-key.gltf', function(gltf){
	  var niceKey = new THREE.Object3D();
	  niceKey = gltf.scene;
	  niceKey.scale.set(0.005, 0.005, 0.005);
	  niceKey.position.set(6, -4, 1);
	  scene.add(niceKey);
	  niceKey.name = 'niceKey';
	  interactObjs.push(niceKey);
	  pickupable.push(niceKey);
  });

	have_key = true;
	}
}

function clocksetter(){
	clocking = true;
	blocker.style.display = 'block';
	clockScreen.style.display = '';
	controls.unlock();
	scene.visible = false;
}

function win (){
	winner = true;
	blocker.style.display = 'block';
    winScreen.style.display = '';
	controls.unlock();
	scene.visible = false;
}

function render()
{
  renderer.render(scene, camera);
}

function GameLoop()
{
  requestAnimationFrame( GameLoop );
  update();
  render();
}
