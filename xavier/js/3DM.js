//**************************************************************
//*  3DM.js         by   X.Dorel         		               *
//*															   *
var M3D_mVersion = "181015" 
//*             		                                       * 
//*  Javascript code used in the 3D Mockup Studio              * 
//
//  181015 : STL, 3DMS.php (drafts)
//  181012 : Path, TubePath
//  181011 : mouse right control, stats, sprite text
//  181009 : Text on Sprite
//  181001 : debug CMA_AnimMoveStep eval : bug if hided
//  180927 : M3D_DisplayMsg
//  180924 : debug Under3DMS (clickable en execution)
//  180920 : debug position tube
//  180918 : debugs text2D Vive
//  180917 : debugs
//  180914 : controller touch and button animation
//  180913 : Hide not clickable
//  180912 : PositionMove RotationMove RotationStep tabAnimPos&Rot
//  180824 : Text2D test canvas, DisplayError, entete console
//  180820 : M3D_SetText2D... Font, Colors, Alignements
//  180810 : debug pb var, Text2D
//  180809 : log error, M3D_MeshScale
//  180808 : animations audio & controller
//  180807 : bug VR, merge VR & 3DMS versions
//  180806 : CM3D_AudioPlay with bLoop
//  180802 : class CM3D_Audio
//  180801 : creation bib 3DMVR.js, IsHelp...Displayed()
//  180725 : Vive
//  180717 : Extrude
//*             		                                       * 
//**************************************************************

//______________________________________________________________________________________________
function M3D_DisplayLog(msg)
{
	console.log("3DM****** " + msg);
	if ('M3D_DisplayLog' in window.external)   // undefined si lancement en direct
		window.external.M3D_DisplayLog(msg);
}

//______________________________________________________________________________________________
function M3D_DisplayMsg(msg)
{
	console.log("* " + msg);
	if ('M3D_DisplayMsg' in window.external)   // undefined si lancement en direct
		window.external.M3D_DisplayMsg(msg);
}

//______________________________________________________________________________________________
function M3D_DisplayRun(msg)
{
	if (M3D_mbMuteRun)
		return;
	console.log("3DM****** " + msg);
	if ('M3D_DisplayLog' in window.external)   // undefined si lancement en direct
		window.external.M3D_DisplayLog(msg);
}

//______________________________________________________________________________________________
function M3D_DisplayError(msg)
{
	msg = "   ERROR ------- " + msg;
	console.error("3DM****** " + msg);
	if ('M3D_DisplayLog' in window.external)   // undefined si lancement en direct
		window.external.M3D_DisplayLog(msg);
}

//______________________________________________________________________________________________
function M3D_DisplayDebug(msg)
{
	msg = "   DEBUG ------- " + msg;
	console.info("3DM****** " + msg);
	if ('M3D_DisplayLog' in window.external)   // undefined si lancement en direct
		window.external.M3D_DisplayLog(msg);
}

//______________________________________________________________________________________________
function M3D_IsDefined(obj, title)
{
	if (typeof(maVar) == 'undefined')
	{
		M3D_DisplayError(title + "is undefined");
		return false;
	}
	return true;
}



// Basic
var M3D_mScene;
var M3D_mRenderer;

var m3d_StereoEffect = null;
var m3d_StlLoader = null;
var M3D_OnVive = false;

var M3D_mHelpGrid = 0;
var M3D_mHelpAxis = 0;
var M3D_mbInEdition = false;
var M3D_mbMuteRun = false;

var M3D_mStats = null;

// Camera
var M3D_mCamera;
var	M3D_mCameraAngle = 90;  // degrees
var	M3D_mCameraY = 8; // distance
var	M3D_mCameraZoom = 10;   // distance
var M3D_mCameraFixed = false;
var M3D_mPtLookAt = new THREE.Vector3(0,0,0);
var M3D_mHelpLookAt = 0;

// Audio
var m3d_mAudio = 0;

// lumieres
var M3D_mPointLight;
var M3D_mDirectionalLight;
var M3D_mbDirectLight;
var M3D_mbShadows;
var M3D_mHelpLight = 0;
var M3D_mHelpShadows = 0;
var M3D_mShadowsFar = 500;
var M3D_mShadowsHeight = 100;
var M3D_mShadowsWidth = 100;

// Creation des tableaux des objets
var m3d_mTabMeshs = new Array();
var m3d_mTabAnimMeshsPosition = [];
var m3d_mTabAnimMeshsRotation = [];
var m3d_mTabControlerTouchEvents = [];
var M3D_mTabMeshClickables = [];
var M3D_mTabNoClickables = [];
var m3d_mXWhenHided = 10000;
var m3d_mTabShapes = new Array();
var m3d_mTabPaths = new Array();
var m3d_ControllerButtonsEventsConf = new CMA_ControllerButtonsEventsConf();

// mouse
var M3D_mRaycaster = new THREE.Raycaster();
var M3D_mMousePosRenderer = new THREE.Vector2();
var M3D_mMouseClicOnX = 0;
var M3D_mMouseClicOnY = 0;
var M3D_mbLeftClick = false;	// il y a un click gauche en cours
var M3D_mbRightClick = false;	// il y a un click droit en cours
var M3D_mMeshSelected = -1;

// clock and Timers
var M3D_mClock = new THREE.Clock(true);   // start the clock
var M3D_mElapsedTime = 0;				 // seconds elapsed since start
var M3D_mPrevElapsedTime = 0;			 // seconds elapsed of the previous animation
var M3D_mDeltaTime = 0;					 // delta seconds with previous animation
var m3d_mTabTimers = new Array(); 

// model running
var m3D_DeltaSinceLastRun = 0;


//______________________________________________________________________________________________
function M3D_GetApiVersion()
{
	M3D_DisplayLog("M3D_GetApiVersion() --> " + M3D_mVersion);
	if ('M3D_ApiVersion' in window.external)   // undefined si lancement en direct
	{
		window.external.M3D_ApiVersion(M3D_mVersion);
	}
}


//______________________________________________________________________________________________
// 0  FPS Frames rendered in the last second. The higher the number the better.
// 1  MS  Milliseconds needed to render a frame. The lower the number the better.
// 2  MB  MBytes of allocated memory. 
function M3D_InitThreeJsStats(no)   
{
	if ( (no < 0) || (no > 2))
		return;
	M3D_mStats = new Stats();
	M3D_mStats.showPanel(no);
	document.body.appendChild(M3D_mStats.dom);
}

//______________________________________________________________________________________________
function M3D_InitThreeJsFor3DM(bDirectLight, bShadows, bVR)
{
	if (! M3D_OnVive)
	{
		M3D_DisplayLog("*******************************************************************************************");
		M3D_DisplayLog("    3DM.js  (Xavier Dorel Schneider-Electric) ");
		M3D_DisplayLog("        3DM version  " + M3D_mVersion);
		M3D_DisplayLog("        Anim version " + MA_mVersion);
		M3D_DisplayLog("*******************************************************************************************");
		M3D_DisplayLog("M3D_InitThreeJsFor3DM(" + bDirectLight + ", " + bShadows + ", " + bVR + ")");
	}
	
	if (typeof M3D_mbUnder3DMS === 'undefined')
	{
		M3D_DisplayLog("  --> Not launched under 3D Mockup Studio");
		M3D_mbInEdition = false;
		M3D_mbUnder3DMS = false;
	}
	M3D_mbDirectLight = bDirectLight;
	M3D_mbShadows = bShadows;
	if ( ! M3D_mbDirectLight)
		M3D_mbShadows = false;
			
	// creation de la scene et de la camera
	M3D_mScene = new THREE.Scene();
	M3D_mCamera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
	
	// lights
	M3D_mScene.add(new THREE.AmbientLight(0x736F6E));                // pour éviter les ombres totalement noires
	if (M3D_mbDirectLight)
	{
		M3D_DisplayLog("   --> with DirectionalLight...");
		M3D_mDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.5, 100);
		M3D_mDirectionalLight.castShadow = true;
		if (M3D_mbShadows)
		{
			M3D_DisplayLog("   --> with shadows...");
			M3D_mDirectionalLight.shadow.mapSize.width = 512;  // default
			M3D_mDirectionalLight.shadow.mapSize.height = 512; // default
			M3D_mDirectionalLight.shadow.camera.near = 0.1;    // default
			M3D_mDirectionalLight.shadow.camera.far = M3D_mShadowsFar;     // default
			M3D_mDirectionalLight.shadow.camera.left = -M3D_mShadowsWidth / 2;  
			M3D_mDirectionalLight.shadow.camera.right = M3D_mShadowsWidth; 
			M3D_mDirectionalLight.shadow.camera.top = M3D_mShadowsHeight / 2;    
			M3D_mDirectionalLight.shadow.camera.bottom = -M3D_mShadowsHeight / 2;     
		}
		M3D_mScene.add(M3D_mDirectionalLight);
	}
	else
	{	
		M3D_DisplayLog("   --> with PointLight...");
		M3D_mPointLight = new THREE.PointLight( 0xffffff, 1, 100 );  // pour forcer les ombres
		M3D_mScene.add( M3D_mPointLight );
	}

	// Spheres des helpers 
	var geometry = new THREE.SphereGeometry( 0.5, 32, 32 );
	var material = new THREE.MeshPhongMaterial( {color: 0xFF0000} );
	M3D_mHelpLookAt = new THREE.Mesh( geometry, material );
	M3D_mHelpLookAt.visible = false;
	M3D_mScene.add(M3D_mHelpLookAt);
	material = new THREE.MeshPhongMaterial( {color: 0xFFFF00} );
	M3D_mHelpLight = new THREE.Mesh( geometry, material );
	M3D_mHelpLight.visible = false;
	M3D_mScene.add(M3D_mHelpLight);

	// audio
	if (! M3D_mbUnder3DMS)
		m3d_mAudio = new CM3D_Audio();
	
	// creation du rendu
	M3D_mRenderer = new THREE.WebGLRenderer();
	if (bVR)
		M3D_mRenderer.autoClear = false;
	if (bVR || M3D_OnVive)
		M3D_mRenderer.vr.enabled = true;
	M3D_mRenderer.setSize( window.innerWidth, window.innerHeight-4);
	document.body.appendChild(M3D_mRenderer.domElement);
	if (M3D_OnVive)
		document.body.appendChild( WEBVR.createButton( M3D_mRenderer ) );
	
	if (M3D_mbShadows)
	{
		M3D_mRenderer.shadowMap.enabled = true;
		M3D_mRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
	}
	
	if (bVR)
		m3d_StereoEffect = new THREE.StereoEffect(M3D_mRenderer);

	// catch mouse event 
	M3D_mRenderer.domElement.addEventListener("mousedown", M3D_OnMouseDown);
	M3D_mRenderer.domElement.addEventListener("mouseup", M3D_OnMouseUp);
	M3D_mRenderer.domElement.addEventListener("mousemove", M3D_OnMouseMove);
	M3D_mRenderer.domElement.addEventListener("wheel", M3D_OnWheelChange);
	
	// position par défaut
	M3D_ResetScene();

	//M3D_DisplayHelpAxis(10);
	
	M3D_DisplayLog("Init OK ******************************");
}



//#################################################################################################
// ANIMATE FUNCTION

//______________________________________________________________________________________________
var M3D_Animate = function ()      // animate function 
{
	if (M3D_OnVive)
		M3D_mRenderer.setAnimationLoop( m3dvr_Animate );
	else
	{
		requestAnimationFrame( M3D_Animate );

		if (M3D_mStats != null)
			M3D_mStats.begin();
		
		M3D_mElapsedTime = M3D_mClock.getElapsedTime();  
		M3D_mDeltaTime = M3D_mElapsedTime - M3D_mPrevElapsedTime;
		
		for (var i = 0; i < m3d_mTabAnimMeshsPosition.length; i++)
			m3d_mTabAnimMeshsPosition[i].ApplyAnimation();
		
		for (var i = 0; i < m3d_mTabAnimMeshsRotation.length; i++)
			m3d_mTabAnimMeshsRotation[i].ApplyAnimation();
		
		m3d_RunTimers();
		m3d_RunModel();
		
		if (typeof OnAnimationLoop !== 'undefined') 
			OnAnimationLoop();

		if (m3d_StereoEffect == null)
			M3D_mRenderer.render(M3D_mScene, M3D_mCamera);
		else
			m3d_StereoEffect.render(M3D_mScene, M3D_mCamera);
		
		M3D_mPrevElapsedTime = M3D_mElapsedTime;

		if (M3D_mStats != null)
			M3D_mStats.end();
	}
};

	

//______________________________________________________________________________________________
function M3D_ResetScene()
{
	M3D_DisplayLog("M3D_ResetScene()");
	for (var i = 0; i < m3d_mTabMeshs.length; i++)
		M3D_mScene.remove(M3D_GetMesh(i)); 
	m3d_mTabMeshs = new Array();
	m3d_mTabAnimMeshsPosition = [];
	m3d_mTabAnimMeshsRotation = [];
	m3d_mTabControlerTouchEvents = [];
	m3d_ControllerButtonsEventsConf = new CMA_ControllerButtonsEventsConf();
	M3D_mTabNoClickables = [];
	M3D_mTabMeshClickables = [];
	m3d_mTabShapes = new Array();
	m3d_mTabPaths = new Array();
	M3D_SetCameraLookAt(M3D_mPtLookAt.x, M3D_mPtLookAt.y, M3D_mPtLookAt.z);
	M3D_SetLightPosition( 10, 5, 3 );
	M3D_SetCameraValues(M3D_mCameraAngle, M3D_mCameraY, M3D_mCameraZoom);
}
			


//______________________________________________________________________________________________
function CM3D_MeshConf(mesh) 
{
	this.mesh = mesh;
	this.mText2D = 0;
	this.mTabMouseEvent = [];
	this.mX = 0;
}

CM3D_MeshConf.prototype.AddMouseEvent = function(evt) 
{
	this.mTabMouseEvent.push(evt);
};

CM3D_MeshConf.prototype.EvalMouseEvent = function(evtType) 
{
	M3D_DisplayLog(" ------ Mesh -- EvalMouseEvent(" + evtType  + ")");
	for (noevt = 0; noevt < this.mTabMouseEvent.length; noevt++)
		this.mTabMouseEvent[noevt].Eval(evtType);
};


//______________________________________________________________________________________________
function CM3D_ConfAnimMesh(nomesh) 
{
	this.no = nomesh;
	this.x = 0.0;
	this.y = 0.0;
	this.z = 0.0;
	this.rotx = 0.0;
	this.roty = 0.0;
	this.rotz = 0.0;
	this.mAnimation = null;
}

CM3D_ConfAnimMesh.prototype.ApplyAnimation = function() 
{
	m3d_mTabMeshs[this.no].mesh.position.x += this.x;
	m3d_mTabMeshs[this.no].mesh.position.y += this.y;
	m3d_mTabMeshs[this.no].mesh.position.z += this.z;
	m3d_mTabMeshs[this.no].mesh.rotation.x += this.rotx;
	m3d_mTabMeshs[this.no].mesh.rotation.y += this.roty;
	m3d_mTabMeshs[this.no].mesh.rotation.z += this.rotz;
	
	if (this.mAnimation != null)
		this.mAnimation.OnApplyAnimation();
};

CM3D_ConfAnimMesh.prototype.IsNull = function() 
{
	return ( (this.x == 0) && (this.y == 0) && (this.z == 0) && (this.rotx == 0) && (this.roty == 0) && (this.rotz == 0) );
};











//###################################################################################################
// UTILITAIRES
			
	//______________________________________________________________________________________________
	function M3D_SceneSetBackground(color)
	{
		M3D_mScene.background = new THREE.Color( color );
	}
			
	//______________________________________________________________________________________________
	function m3d_SetClickable(no, bClickable)
	{
		if (bClickable)
		{
			M3D_mTabNoClickables.push(no); 
			M3D_mTabMeshClickables.push(m3d_mTabMeshs[no].mesh);
		}
		else
		{
			indNo = M3D_mTabNoClickables.indexOf(no);
			M3D_mTabNoClickables.splice(indNo, 1);
			indMesh = M3D_mTabMeshClickables.indexOf(m3d_mTabMeshs[no].mesh);
			M3D_mTabMeshClickables.splice(indMesh, 1);
		}
	}
			
			
	//______________________________________________________________________________________________
	function M3D_SetInEdition(bEdition)
	{
		if (bEdition == M3D_mbInEdition)
			return;
		M3D_mbInEdition = bEdition;
		
		// on reinitialise la liste des clickables
		M3D_mTabNoClickables = [];
		M3D_mTabMeshClickables = [];
		if ( ! M3D_mbInEdition)
			return;
		for (var i = 0; i < m3d_mTabMeshs.length; i++)
			m3d_AddClickable(i, M3D_GetMesh(i));
	}
			
	//______________________________________________________________________________________________
	function DisplayCamera()
	{
		var str = "x: " + M3D_mCamera.position.x;
		str += " y: " + M3D_mCamera.position.y;
		str += " z: " + M3D_mCamera.position.z;
		str += " rotX: " + M3D_mCamera.rotation.x;
		str += " rotY: " + M3D_mCamera.rotation.y;
		str += " rotZ: " + M3D_mCamera.rotation.z;
		M3D_DisplayLog("Camera:  " + str);
	}

	
	//______________________________________________________________________________________________
	function M3D_DisplayHelpLight(bVisible)
	{
		M3D_DisplayLog("M3D_DisplayHelpLight(" + bVisible  + ")");
		M3D_mHelpLight.visible = bVisible;
	}
	//______________________________________________________________________________________________
	function M3D_IsHelpLightDisplayed()
	{
		return (M3D_mHelpLight.visible);
	}

	//______________________________________________________________________________________________
	function M3D_DisplayHelpShadows(bVisible)
	{
		M3D_DisplayLog("M3D_DisplayHelpShadows(" + bVisible  + ")");
		if ( ! M3D_mbShadows)
		{
			M3D_DisplayLog("   --> error shadows not visible");
			return;
		}
		if (bVisible)
		{
			if (M3D_mHelpShadows != 0)
				return;
			M3D_mHelpShadows = new THREE.CameraHelper( M3D_mDirectionalLight.shadow.camera );
			M3D_mScene.add( M3D_mHelpShadows );
		}
		else
		{
			M3D_mScene.remove( M3D_mHelpShadows );
			M3D_mHelpShadows = 0;
		}
	}
	//______________________________________________________________________________________________
	function M3D_IsHelpShadowsDisplayed()
	{
		if ( ! M3D_mbShadows)
			return false;
		return (M3D_mHelpShadows != 0);
	}


	//______________________________________________________________________________________________
	function M3D_DisplayHelpLookAt(bVisible)
	{
		M3D_DisplayLog("M3D_DisplayHelpLookAt(" + bVisible  + ")");
		M3D_mHelpLookAt.visible = bVisible;
	}

			

	
	//______________________________________________________________________________________________
	function M3D_DisplayHelpAxis(size)
	{
		M3D_HideHelpAxis();
		M3D_DisplayLog("M3D_DisplayHelpAxis(" + size  + ")");
		if (size == 0)
			return;
		M3D_mHelpAxis = new THREE.AxesHelper(size);
		M3D_mScene.add(M3D_mHelpAxis);
	}
	//______________________________________________________________________________________________
	function M3D_HideHelpAxis()  
	{
		M3D_DisplayLog("M3D_HideHelpAxis()");
		if (M3D_mHelpAxis != 0)
		{
			M3D_mScene.remove(M3D_mHelpAxis);
			M3D_mHelpAxis = 0;
		}
	}
	//______________________________________________________________________________________________
	function M3D_IsHelpAxisDisplayed()
	{
		return (M3D_mHelpAxis != 0);
	}
	
	//______________________________________________________________________________________________
	function M3D_DisplayHelpGrid(width, depth)    
	{ 
		M3D_HideHelpGrid();
		M3D_DisplayLog("M3D_DisplayHelpGrid(" + width + "," + depth + ")");
		if ((width == 0) || (depth == 0))
			return;
		M3D_mHelpGrid = new THREE.GridHelper( width, depth );
		M3D_mScene.add( M3D_mHelpGrid );
	}
	//______________________________________________________________________________________________
	function M3D_HideHelpGrid()  
	{
		M3D_DisplayLog("M3D_HideHelpGrid()");
		if (M3D_mHelpGrid != 0)
		{
			M3D_mScene.remove(M3D_mHelpGrid);
			M3D_mHelpGrid = 0;
		}
	}
	//______________________________________________________________________________________________
	function M3D_IsHelpGridDisplayed()
	{
		return (M3D_mHelpGrid != 0);
	}
	

	//______________________________________________________________________________________________
	function M3D_SetLightPosition(x, y, z)
	{
		M3D_DisplayLog("M3D_SetLightPosition(" + x + "," + y + "," + z + ")");
		if (M3D_mbDirectLight)
			M3D_mDirectionalLight.position.set(x,y,z);
		else
			M3D_mPointLight.position.set(x, y, z);
		M3D_mHelpLight.position.set(x, y, z);
	}
	
		
	//____________________________________
	function M3D_SetCameraValues(angleDeg, Y, zoom)
	{
		M3D_DisplayLog("M3D_SetCameraValues(" + angleDeg + "," + Y + "," + zoom + ")");
		M3D_mCameraAngle = angleDeg * Math.PI / 180;
		M3D_mCameraY = Y;
		M3D_mCameraZoom = zoom;
		
		M3D_CalculateCamera();
	}
	
	//____________________________________
	function M3D_SetCameraFixed(bFixed)
	{
		M3D_DisplayLog("M3D_SetCameraFixed(" + bFixed + ")");
		M3D_mCameraFixed = bFixed;
	}

	//____________________________________
	function M3D_SetCameraLookAt(x, y, z)
	{
		M3D_DisplayLog("M3D_SetCameraLookAt(" + x + "," + y + "," + z + ")");
		M3D_mPtLookAt.set(x, y, z);
		M3D_mCamera.lookAt(M3D_mPtLookAt);
		M3D_mHelpLookAt.position.set(x, y, z);
	}
	
	//____________________________________
	function M3D_AnimateCamera(angleDeg)
	{
		M3D_DisplayLog("M3D_AnimateCamera(" + angleDeg + ")");
		M3D_AnimateCamera(angleDeg, CameraY, CameraZoom);
	}
	
	//______________________________________________________________________________________________
	function M3D_AnimateCamera(rotx, roty, rotz)
	{
		M3D_DisplayLog("M3D_AnimateCamera(" + rotx + "," + roty + "," + rotz + ")");
		M3D_mCamera.rotation.x = rotx;
		M3D_mCamera.rotation.y = roty;
		M3D_mCamera.rotation.z = rotz;
		M3D_mCamera.lookAt(M3D_mPtLookAt);
	}
			
	


	
//###################################################################################################
// AJOUT DE MESHS

var m3d_mTmpGeometry;
var m3d_mTmpMaterial;
var m3d_mTmpExtrudeSettings;

		
	//______________________________________________________________________________________________
	function M3D_VerifMeshNo(no)
	{
		//M3D_DisplayLog("M3D_VerifMeshNo(" + no + ")");
		if ( (no < 0) || (no >= m3d_mTabMeshs.length) )
		{
			var min = m3d_mTabMeshs.length - 1;
			M3D_DisplayError("M3D_VerifMeshNo(" + no + ") no must be between O and " + min);
			return false;
		}
		return true;
	}
	
	//______________________________________________________________________________________________
	function M3D_AddMesh(no)
	{
		if ( ! M3D_VerifMeshNo(no))
			return false;
		M3D_mScene.add(m3d_mTabMeshs[no].mesh);
		return true;
	}
	
	//______________________________________________________________________________________________
	function M3D_CreateMesh(mesh, x, y, z)
	{
		mesh.position.set(x, y, z);
		no = m3d_mTabMeshs.length;
		m3d_mTabMeshs[no] = new CM3D_MeshConf(mesh);
		m3d_mTabMeshs[no].mX = x;
		if (M3D_mbInEdition)
			m3d_SetClickable(no, true);
		if (M3D_mbShadows)
		{
			mesh.castShadow = true;
			mesh.receiveShadow = true;
		}
		M3D_DisplayLog("    M3D_CreateMesh--> " + no);
		return no;
	}
	
	//______________________________________________________________________________________________
	function M3D_CreateMeshNoPosition(mesh)
	{
		no = m3d_mTabMeshs.length;
		m3d_mTabMeshs[no] = new CM3D_MeshConf(mesh);
		if (M3D_mbInEdition)
			m3d_SetClickable(no, true);
		if (M3D_mbShadows)
		{
			mesh.castShadow = true;
			mesh.receiveShadow = true;
		}
		M3D_DisplayLog("    M3D_CreateMesh--> " + no);
		return no;
	}
	
	//______________________________________________________________________________________________
	function M3D_CreateImageTexture(texture)
	{
		var img = new Image();
		img.src = texture;
		return img;
	}
	
	//______________________________________________________________________________________________
	function M3D_GetMaterialTexture(imgTexture, width, height)
	{
		var texture = new THREE.Texture();
		texture.image = imgTexture;
		imgTexture.onload = function() {	texture.needsUpdate = true; };
		texture.repeat.set(width, height);
		texture.wrapS = texture.wrapT = THREE.MirroredRepeatWrapping;
		return ( new THREE.MeshPhongMaterial( { map: texture } ) );
	}
	

	//______________________________________________________________________________________________
	function M3D_SendMeshLoaded(no)
	{
		M3D_DisplayLog("M3D_SendMeshLoaded(" + no + ")");
		if (typeof M3D_OnMeshLoaded === 'undefined')
		{
			if ('M3D_OnMeshLoaded' in window.external)   
			{
				window.external.M3D_OnMeshLoaded(no);	// on est en édition : on appelle 3DMS
			}
		}
		else
			M3D_OnMeshLoaded(no);						// mockup générée : on appelle la fonction 
	}
	
	
	//***********************************************************
	
	//______________________________________________________________________________________________
	function M3D_CreateGroup(x, y, z)
	{
		M3D_DisplayLog("M3D_CreateGroup(" + x + "," + y + "," + z + ")");
		var mesh = new THREE.Object3D();
		return M3D_CreateMesh(mesh, x, y, z);
	}
	
	//______________________________________________________________________________________________
	function M3D_AddMeshToGroup(noMesh, noGroup)
	{
		M3D_DisplayLog("M3D_AddMeshToGroup(" + noMesh + "," + noGroup + ")");
		if (( ! M3D_VerifMeshNo(noMesh)) || ( ! M3D_VerifMeshNo(noGroup)))
			return false;
		m3d_mTabMeshs[noGroup].mesh.add(m3d_mTabMeshs[noMesh].mesh);
		return true;
	}
	
	//______________________________________________________________________________________________
	function M3D_AddGroup(noGroup)
	{
		M3D_DisplayLog("M3D_AddGroup(" + noGroup + ")");
		if ( ! M3D_VerifMeshNo(noGroup))
			return false;
		M3D_mScene.add(m3d_mTabMeshs[noGroup].mesh);
		return true;
	}
	
	//______________________________________________________________________________________________
	function M3D_CreateAndAddGroup(x, y, z)
	{
		M3D_DisplayLog("M3D_CreateAndAddGroup(" + x + "," + y + "," + z + ")");
		no = M3D_CreateGroup(x, y, z);
		return M3D_AddGroup(no);
	}
	
	
	//***********************************************************
	
	//______________________________________________________________________________________________
	function M3D_CreateCube(x, y, z, width, height, depth, color, opacity)
	{
		M3D_DisplayLog("M3D_CreateCube(" + x + "," + y + "," + z + ", ...)");
		m3d_mTmpGeometry = new THREE.BoxGeometry(width, height, depth);
		if (opacity == 1)
			m3d_mTmpMaterial = new THREE.MeshPhongMaterial( {color: color} );
		else
			m3d_mTmpMaterial = new THREE.MeshPhongMaterial( {color: color, transparent: true, opacity: opacity} );
		var mesh = new THREE.Mesh( m3d_mTmpGeometry, m3d_mTmpMaterial );
		return M3D_CreateMesh(mesh, x, y, z);
	}
	
	//______________________________________________________________________________________________
	function M3D_CreateCubeTexture(x, y, z, width, height, depth, imgTexture, sty_width, sty_height)
	{
		M3D_DisplayLog("M3D_CreateCubeTexture(" + x + "," + y + "," + z + ", ... ," + imgTexture + "," + sty_width + "," + sty_height + ")");
		m3d_mTmpMaterial = M3D_GetMaterialTexture(imgTexture, sty_width, sty_height);
		if (m3d_mTmpMaterial == null)
			return M3D_CreateCube(x, y, z, width, height, depth, color_Red);
		m3d_mTmpGeometry = new THREE.BoxGeometry(width, height, depth);
		var mesh = new THREE.Mesh( m3d_mTmpGeometry, m3d_mTmpMaterial );
		return M3D_CreateMesh(mesh, x, y, z);
	}
	
	//______________________________________________________________________________________________
	function M3D_AddCube(x, y, z, width, height, depth, color, opacity)
	{
		M3D_DisplayLog("M3D_AddCube(" + x + "," + y + "," + z + ", ...)");
		no = M3D_CreateCube(x, y, z, width, height, depth, color, opacity);
		if (M3D_AddMesh(no))
			return no;
		else
			return -1;
	}

	//______________________________________________________________________________________________
	function M3D_AddCubeTexture(x, y, z, width, height, depth, imgTexture, sty_width, sty_height)
	{
		M3D_DisplayLog("M3D_AddCubeTexture(" + x + "," + y + "," + z + ",...," + imgTexture + ", ...)");
		no = M3D_CreateCubeTexture(x, y, z, width, height, depth, imgTexture, sty_width, sty_height);
		if (M3D_AddMesh(no))
			return no;
		else
			return -1;
	}
	
	
	
	//***********************************************************
	
	//______________________________________________________________________________________________
	function M3D_CreateSphere(x, y, z, radius, color, opacity)
	{
		M3D_DisplayLog("M3D_CreateSphere(" + x + "," + y + "," + z + ", ...)");
		m3d_mTmpGeometry = new THREE.SphereGeometry( radius, 32, 32 );
		if (opacity == 1)
			m3d_mTmpMaterial = new THREE.MeshPhongMaterial( {color: color} );
		else
			m3d_mTmpMaterial = new THREE.MeshPhongMaterial( {color: color, transparent: true, opacity: opacity} );
		var mesh = new THREE.Mesh( m3d_mTmpGeometry, m3d_mTmpMaterial );
		return M3D_CreateMesh(mesh, x, y, z);
	}
	
	//______________________________________________________________________________________________
	function M3D_CreateSphereTexture(x, y, z, radius, imgTexture, sty_width, sty_height)
	{
		M3D_DisplayLog("M3D_CreateSphereTexture(" + x + "," + y + "," + z + ", ... ," + imgTexture + "," + sty_width + "," + sty_height + ")");
		m3d_mTmpMaterial = M3D_GetMaterialTexture(imgTexture, sty_width, sty_height);
		if (m3d_mTmpMaterial == null)
			return M3D_CreateSphere(x, y, z, radius, color_Red);
		m3d_mTmpGeometry = new THREE.SphereGeometry( radius, 32, 32 );
		var mesh = new THREE.Mesh( m3d_mTmpGeometry, m3d_mTmpMaterial );
		return M3D_CreateMesh(mesh, x, y, z);
	}
	
	//______________________________________________________________________________________________
	function M3D_AddSphere(x, y, z, radius, color, opacity)
	{
		M3D_DisplayLog("M3D_AddSphere(" + x + "," + y + "," + z + ", ...)");
		no = M3D_CreateSphere(x, y, z, radius, color, opacity);
		if (M3D_AddMesh(no))
			return no;
		else
			return -1;
	}
	
	//______________________________________________________________________________________________
	function M3D_AddSphereTexture(x, y, z, radius, imgTexture, sty_width, sty_height)
	{
		M3D_DisplayLog("M3D_AddSphereTexture(" + x + "," + y + "," + z + ", ...)");
		no = M3D_CreateSphereTexture(x, y, z, radius, imgTexture, sty_width, sty_height);
		if (M3D_AddMesh(no))
			return no;
		else
			return -1;
	}
	
	
	//***********************************************************
	
	//______________________________________________________________________________________________
	function M3D_CreateCone(x, y, z, radiusTop, radiusBottom, height, color, opacity)
	{
		M3D_DisplayLog("M3D_CreateCone(" + x + "," + y + "," + z + ", ...)");
		m3d_mTmpGeometry = new THREE.CylinderGeometry( radiusTop, radiusBottom, height, 32 );
		if (opacity == 1)
			m3d_mTmpMaterial = new THREE.MeshPhongMaterial( {color: color} );
		else
			m3d_mTmpMaterial = new THREE.MeshPhongMaterial( {color: color, transparent: true, opacity: opacity} );
		var mesh = new THREE.Mesh( m3d_mTmpGeometry, m3d_mTmpMaterial );
		return M3D_CreateMesh(mesh, x, y, z);
	}
	
	//______________________________________________________________________________________________
	function M3D_CreateConeTexture(x, y, z, radiusTop, radiusBottom, height, imgTexture, sty_width, sty_height)
	{
		M3D_DisplayLog("M3D_CreateConeTexture(" + x + "," + y + "," + z + ", ...)");
		m3d_mTmpGeometry = new THREE.CylinderGeometry( radiusTop, radiusBottom, height, 32 );
		m3d_mTmpMaterial = M3D_GetMaterialTexture(imgTexture, sty_width, sty_height);
		if (m3d_mTmpMaterial == null)
			return M3D_CreateCone(x, y, z, radiusTop, radiusBottom, height, color_Red);
		var mesh = new THREE.Mesh( m3d_mTmpGeometry, m3d_mTmpMaterial );
		return M3D_CreateMesh(mesh, x, y, z);
	}
	
	//______________________________________________________________________________________________
	function M3D_AddCone(x, y, z, radiusTop, radiusBottom, height, color, opacity)
	{
		M3D_DisplayLog("M3D_AddCone(" + x + "," + y + "," + z + ", ...)");
		no = M3D_CreateCone(x, y, z, radiusTop, radiusBottom, height, color, opacity);
		if (M3D_AddMesh(no))
			return no;
		else
			return -1;
	}
	
	//______________________________________________________________________________________________
	function M3D_AddConeTexture(x, y, z, radiusTop, radiusBottom, height, imgTexture, sty_width, sty_height)
	{
		M3D_DisplayLog("M3D_AddConeTexture(" + x + "," + y + "," + z + ", ...)");
		no = M3D_CreateCone(x, y, z, radiusTop, radiusBottom, height, imgTexture, sty_width, sty_height);
		if (M3D_AddMesh(no))
			return no;
		else
			return -1;
	}
	
	
	
	//***********************************************************
	
	//______________________________________________________________________________________________
	function M3D_CreateCylinder(x, y, z, radius, height, color, opacity)
	{
		M3D_DisplayLog("M3D_CreateCylinder(" + x + "," + y + "," + z + ", ...)");
		return M3D_CreateCone(x, y, z, radius, radius, height, color, opacity);
	}
	
	//______________________________________________________________________________________________
	function M3D_CreateCylinderTexture(x, y, z, radius, height, imgTexture, sty_width, sty_height)
	{
		M3D_DisplayLog("M3D_CreateCylinder(" + x + "," + y + "," + z + ", ...)");
		return M3D_CreateConeTexture(x, y, z, radius, radius, height, imgTexture, sty_width, sty_height);
	}
	
	//______________________________________________________________________________________________
	function M3D_AddCylinder(x, y, z, radius, height, color, opacity)
	{
		M3D_DisplayLog("M3D_AddCylinder(" + x + "," + y + "," + z + ", ...)");
		return M3D_AddCone(x, y, z, radius, radius, height, color, opacity);
	}
	
	//______________________________________________________________________________________________
	function M3D_AddCylinderTexture(x, y, z, radius, height, imgTexture, sty_width, sty_height)
	{
		M3D_DisplayLog("M3D_AddCylinder(" + x + "," + y + "," + z + ", ...)");
		return M3D_AddConeTexture(x, y, z, radius, radius, height, imgTexture, sty_width, sty_height);
	}
	
	
	
	//***********************************************************
	
	//______________________________________________________________________________________________
	function M3D_CreatePlan(x, y, z, width, height, color, opacity)
	{
		M3D_DisplayLog("M3D_CreatePlan(" + x + "," + y + "," + z + ", ...)");
		m3d_mTmpGeometry = new THREE.PlaneGeometry( width, height, 32 );
		if (opacity == 1)
			m3d_mTmpMaterial = new THREE.MeshPhongMaterial( {color: color, side: THREE.DoubleSide} );
		else
			m3d_mTmpMaterial = new THREE.MeshPhongMaterial( {color: color, transparent: true, opacity: opacity, side: THREE.DoubleSide} );
		var mesh = new THREE.Mesh( m3d_mTmpGeometry, m3d_mTmpMaterial );
		return M3D_CreateMesh(mesh, x, y, z);
	}
	
	//______________________________________________________________________________________________
	function M3D_CreatePlanTexture(x, y, z, width, height, imgTexture, sty_width, sty_height)
	{
		M3D_DisplayLog("M3D_CreatePlanTexture(" + x + "," + y + "," + z + ", ...)");
		m3d_mTmpGeometry = new THREE.PlaneGeometry( width, height, 32 );
		m3d_mTmpMaterial = M3D_GetMaterialTexture(imgTexture, sty_width, sty_height);
		if (m3d_mTmpMaterial == null)
			return M3D_CreatePlan(x, y, z, width, height, color_Red);
		var mesh = new THREE.Mesh( m3d_mTmpGeometry, m3d_mTmpMaterial );
		return M3D_CreateMesh(mesh, x, y, z);
	}
	
	//______________________________________________________________________________________________
	function M3D_AddPlan(x, y, z, width, height, color, opacity)
	{
		M3D_DisplayLog("M3D_AddPlan(" + x + "," + y + "," + z + ", ...)");
		no = M3D_CreatePlan(x, y, z, width, height, color, opacity);
		if (M3D_AddMesh(no))
			return no;
		else
			return -1;
	}
	
	//______________________________________________________________________________________________
	function M3D_AddPlanTexture(x, y, z, width, height, imgTexture, sty_width, sty_height)
	{
		M3D_DisplayLog("M3D_AddPlanTexture(" + x + "," + y + "," + z + ", ...)");
		no = M3D_CreatePlan(x, y, z, width, height, imgTexture, sty_width, sty_height);
		if (M3D_AddMesh(no))
			return no;
		else
			return -1;
	}
	
	
	//***********************************************************
	
	//______________________________________________________________________________________________
	function M3D_CreateLine(x, y, z, x2, y2, z2, color, opacity)
	{
		M3D_DisplayLog("M3D_CreateLine(" + x + "," + y + "," + z + ", ...)");
		if (opacity == 1)
			m3d_mTmpMaterial = new THREE.LineBasicMaterial( {color: color} );
		else
			m3d_mTmpMaterial = new THREE.LineBasicMaterial( {color: color, transparent: true, opacity: opacity} );
		var geometry = new THREE.Geometry();
		geometry.vertices.push( new THREE.Vector3( x, y, z ), new THREE.Vector3( x2, y2, z2 ) );
		var mesh = new THREE.Line( geometry, m3d_mTmpMaterial );
		
		// il ne faut pas faire de mesh.position.set(x, y, z); sur une ligne 
		no = m3d_mTabMeshs.length;
		m3d_mTabMeshs[no] = new CM3D_MeshConf(mesh);
		if (M3D_mbInEdition)
			m3d_SetClickable(no, true);
		if (M3D_mbShadows)
		{
			mesh.castShadow = true;
			mesh.receiveShadow = true;
		}
		M3D_DisplayLog("M3D_CreateLine--> " + no);
		return no;
	}
	
	//______________________________________________________________________________________________
	function M3D_AddLine(x, y, z, x2, y2, z2, color, opacity)
	{
		M3D_DisplayLog("M3D_AddLine(" + x + "," + y + "," + z + ", ...)");
		var no = M3D_CreateLine(x, y, z, x2, y2, z2, color, opacity);
		if (M3D_AddMesh(no))
			return no;
		else
			return -1;
	}
	
	
	//***********************************************************
	
	fontHelvetikerRegular = new THREE.Font(data_helvetiker_regular);
	//______________________________________________________________________________________________
	function M3D_CreateText(x, y, z, txt, size, depth, color, opacity)
	{
		M3D_DisplayLog("M3D_AddText(" + x + "," + y + "," + z + ", '" + txt + "',...)");
		var font = fontHelvetikerRegular;
		var ratio = size / 40;
	
		m3d_mTmpGeometry = new THREE.TextGeometry( txt, {
			font: fontHelvetikerRegular,
			size: size,
			height: depth,
			curveSegments: 12,
			bevelEnabled: true,
			bevelThickness: ratio,
			bevelSize: ratio,
			bevelSegments: 5
		} );
		if (opacity == 1)
			m3d_mTmpMaterial = new THREE.MeshPhongMaterial( {color: color} );
		else
			m3d_mTmpMaterial = new THREE.MeshPhongMaterial( {color: color, transparent: true, opacity: opacity} );
		var mesh = new THREE.Mesh( m3d_mTmpGeometry, m3d_mTmpMaterial );
		return M3D_CreateMesh(mesh, x, y, z);
	}
	
	//______________________________________________________________________________________________
	function M3D_AddText(x, y, z, txt, size, depth, color, opacity)
	{
		M3D_DisplayLog("M3D_AddText(" + x + "," + y + "," + z + ", '" + txt + "',...)");
		var no = M3D_CreateText(x, y, z, txt, size, depth, color, opacity);
		if (M3D_AddMesh(no))
			return no;
		else
			return -1;
	}
	
	
	//***********************************************************
	
	
	function CM3D_Text2D(type, width, height, canvasId, txt, sizePt, textColor, backColor)
	{
		M3D_DisplayLog("CM3D_Text2D() : initialisation class CM3D_Text2D " + type);
		this.mType = type;
		this.mNoMesh = -1;
		this.mRatio = 32;
		this.mWidth = width * this.mRatio;
		this.mHeight = height * this.mRatio;
		this.mText = txt;
		this.SetFont(sizePt, "Arial");
		this.SetColors(textColor, backColor);
		this.SetAlignements("center", "middle");
				
		// recup du canvas
		this.mCanvas = document.getElementById(canvasId);
		if (this.mCanvas == null)
		{
			M3D_DisplayError("CM3D_Text2D init : canvas '" + canvasId + "' not founded");
			return;
		}			

		this.mCanvas.width = this.mWidth; 
		this.mCanvas.height = this.mHeight;
		this.mContext = this.mCanvas.getContext('2d');
	}

		//______________________________________________________________________________________________
		// Size en Pt : 12, 20, ...
		// fontName : 'Arial', ...
		CM3D_Text2D.prototype.SetFont = function(sizePt, fontName, bUpdateScene) 
		{
			//M3D_DisplayDebug("CM3D_Text2D.SetFont(" + sizePt + ", " + fontName + ",...)...");
			this.mSizePt = sizePt;
			this.mFontName = fontName;
			this.mFont = sizePt + "pt " + fontName;   // "20pt Arial"
			
			if (typeof bUpdateScene === 'undefined')
				return;
			this.SetText(this.mText, bUpdateScene);
		};
		
		//______________________________________________________________________________________________
		// colors : 'white', 'black', ...
		CM3D_Text2D.prototype.SetColors = function(textColor, backColor, bUpdateScene) 
		{
			//M3D_DisplayDebug("CM3D_Text2D.SetColors(" + textColor + ", " + backColor + ",...)...");
			this.mTextColor = textColor;
			this.mBackColor = backColor;
			
			if (typeof bUpdateScene === 'undefined')
				return;
			this.SetText(this.mText, bUpdateScene);
		};
		
		//______________________________________________________________________________________________
		// horizontalAlign : "left", "center", "right"
		// verticalAlign : "top", "middle", "bottom"
		CM3D_Text2D.prototype.SetAlignements = function(horizontalAlign, verticalAlign, bUpdateScene) 
		{
			//M3D_DisplayDebug("CM3D_Text2D.SetColors(" + horizontalAlign + ", " + verticalAlign + ",...)...");
			this.mHorizontalAlign = horizontalAlign;
			this.mVerticalAlign = verticalAlign;
			
			if (typeof bUpdateScene === 'undefined')
				return;
			this.SetText(this.mText, bUpdateScene);
		};
		
		//______________________________________________________________________________________________
		CM3D_Text2D.prototype.SetText = function(txt, bUpdateScene) 
		{
			M3D_DisplayDebug("CM3D_Text2D.SetText(" + txt + ",...)...");
			if (this.mCanvas == null)
			{
				M3D_DisplayError("CM3D_Text2D.SetText : canvas null");
				return;
			}
			this.mContext.font = this.mFont;
			this.mContext.fillStyle = this.mBackColor;
			this.mContext.fillRect(0, 0, this.mWidth, this.mHeight);
			this.mContext.fillStyle = this.mTextColor;
			this.mContext.textAlign = this.mHorizontalAlign;
			this.mContext.textBaseline = this.mVerticalAlign;
			this.mText = txt;
			this.mContext.fillText(txt, this.mWidth / 2, this.mHeight / 2);
			
			if (typeof bUpdateScene === 'undefined')
				return;
			if (bUpdateScene == false)
				return;
			this.mTexture.needsUpdate = true;
		};
		
	
		//______________________________________________________________________________________________
		CM3D_Text2D.prototype.CreateMesh = function(x, y, z)
		{
			M3D_DisplayLog("CM3D_Text2D.CreateMesh(" + x + "," + y + "," + z + ")");
		
			this.mTexture = new THREE.Texture(this.mCanvas);

			if (this.mType == "Text")
			{
				M3D_DisplayLog("    --> creation of Text");
				var material = new THREE.MeshBasicMaterial({ map: this.mTexture });
				geometry = new THREE.PlaneGeometry(this.mWidth, this.mHeight);
				this.mMesh = new THREE.Mesh( geometry, material );
				scale = (this.mRatio - 0.8)/ 1000;
				this.mMesh.scale.set(scale, scale, scale);
			}
			else
			{
				M3D_DisplayLog("    --> creation of Sprite");
				m3d_mTmpMaterial = new THREE.SpriteMaterial( {map: this.mTexture, color: this.mBackColor} );
				this.mMesh = new THREE.Sprite(m3d_mTmpMaterial );
				scale = (this.mRatio - 0.8)/ 1000;
				this.mMesh.scale.set(this.mWidth*scale, this.mHeight*scale, 1);
			}
			this.mNoMesh = M3D_CreateMesh(this.mMesh, x, y, z);
			m3d_mTabMeshs[this.mNoMesh].mText2D = this;
			return this.mNoMesh;
		}
	
	
	//______________________________________________________________________________________________
	function m3D_Create_CM3D_Text2D(type, x, y, z, width, height, canvasId, txt, sizePt, textColor, backColor)
	{
		M3D_DisplayLog("m3D_Create_CM3D_Text2D(" + type + ", " + x + "," + y + "," + z + ", '" + txt + "', '" + canvasId + "',...)");
    
		text2D = new CM3D_Text2D(type, width, height, canvasId, txt, sizePt, textColor, backColor);
		nomesh = text2D.CreateMesh(x, y, z);
		text2D.SetText(txt, true);
		return nomesh;
	}
	
	//______________________________________________________________________________________________
	function M3D_CreateText2D(x, y, z, width, height, canvasId, txt, sizePt, textColor, backColor)
	{
		M3D_DisplayLog("M3D_CreateText2D(" + x + "," + y + "," + z + ", '" + txt + "',...)");
		return m3D_Create_CM3D_Text2D("Text", x, y, z, width, height, canvasId, txt, sizePt, textColor, backColor);
	}
	
	//______________________________________________________________________________________________
	function M3D_AddText2D(x, y, z, width, height, canvasId, txt, sizePt, textColor, backColor)
	{
		M3D_DisplayLog("M3D_AddText2D(" + x + "," + y + "," + z + ", '" + txt + "',...)");
		var no = M3D_CreateText2D(x, y, z, width, height, canvasId, txt, sizePt, textColor, backColor);
		if (M3D_AddMesh(no))
			return no;
		else
			return -1;
	}
	

	
	//***********************************************************

	//______________________________________________________________________________________________
	function m3d_CreateDigit(x, size, depth, color, opacity)
	{
		M3D_DisplayLog("   m3d_CreateDigit(" + x + "," + size + "," + depth + "',...)");
		var font = fontHelvetikerRegular;
		var ratio = size / 40;
		
		var nodigit = M3D_CreateGroup(x, 0, 0);
		for (noval = 0; noval < 10; noval++)
		{
			noDigitValue = M3D_CreateText(0, 0, 0, "" + noval, size, depth, color, opacity);
			if (noval != 0)
				M3D_SetVisible(noDigitValue, false);
			M3D_AddMeshToGroup(noDigitValue, nodigit);
		}
		return nodigit;
	}
	
	//______________________________________________________________________________________________
	function M3D_CreateDisplayValue(x, y, z, nbDigit, unit, size, depth, color, opacity)
	{
		M3D_DisplayLog("M3D_CreateDisplayValue(" + x + "," + y + "," + z + "',...)");

		var noGroupDisplay = M3D_CreateGroup(x, y, z);
		for (nodigit = 0; nodigit < nbDigit; nodigit++)
		{
			noMeshDigit = m3d_CreateDigit(nodigit * 3 * size/4, size, depth, color, opacity);
			M3D_AddMeshToGroup(noMeshDigit, noGroupDisplay);
		}
		if (unit != "")
		{
			noMeshUnit = M3D_CreateText(nodigit * 3 * size/4, 0, 0, unit, size, depth, color, opacity);
			M3D_AddMeshToGroup(noMeshUnit, noGroupDisplay);
		}
		return noGroupDisplay;
	}
	
	//______________________________________________________________________________________________
	function M3D_AddDisplayValue(x, y, z, nbDigit, unit, size, depth, color, opacity)
	{
		M3D_DisplayLog("M3D_AddDisplayValue(" + x + "," + y + "," + z + "',...)");
		var nomesh = M3D_CreateDisplayValue(x, y, z, nbDigit, unit, size, depth, color, opacity);
		if (M3D_AddMesh(nomesh))
			return nomesh;
		else
			return -1;
	}
	
	
	
	//***********************************************************
		
	//______________________________________________________________________________________________
	function M3D_CreateTorus(x, y, z, radius, tubeRadius, angle, color, opacity)
	{
		M3D_DisplayLog("M3D_CreateTorus(" + x + "," + y + "," + z + ", ...)");
		m3d_mTmpGeometry = new THREE.TorusGeometry( radius, tubeRadius, 64, 64, angle * Math.PI / 180 );
		if (opacity == 1)
			m3d_mTmpMaterial = new THREE.MeshPhongMaterial( {color: color} );
		else
			m3d_mTmpMaterial = new THREE.MeshPhongMaterial( {color: color, transparent: true, opacity: opacity} );
		var mesh = new THREE.Mesh( m3d_mTmpGeometry, m3d_mTmpMaterial );
		return M3D_CreateMesh(mesh, x, y, z);
	}
	
	//______________________________________________________________________________________________
	function M3D_CreateTorusTexture(x, y, z, radius, tubeRadius, angle, imgTexture, sty_width, sty_height)
	{
		M3D_DisplayLog("M3D_CreateTorusTexture(" + x + "," + y + "," + z + ", ... ," + imgTexture + "," + sty_width + "," + sty_height + ")");
		m3d_mTmpMaterial = M3D_GetMaterialTexture(imgTexture, sty_width, sty_height);
		if (m3d_mTmpMaterial == null)
			return M3D_CreateTorus(x, y, z, radius, color_Red, 1);
		m3d_mTmpGeometry = new THREE.TorusGeometry( radius, tubeRadius, 64, 64, angle * Math.PI / 180 );
		var mesh = new THREE.Mesh( m3d_mTmpGeometry, m3d_mTmpMaterial );
		return M3D_CreateMesh(mesh, x, y, z);
	}
	
	//______________________________________________________________________________________________
	function M3D_AddTorus(x, y, z, radius, tubeRadius, angle, color, opacity)
	{
		M3D_DisplayLog("M3D_AddTorus(" + x + "," + y + "," + z + ", ...)");
		no = M3D_CreateTorus(x, y, z, radius, tubeRadius, angle, color, opacity);
		if (M3D_AddMesh(no))
			return no;
		else
			return -1;
	}
	
	//______________________________________________________________________________________________
	function M3D_AddTorusTexture(x, y, z, radius, tubeRadius, angle, imgTexture, sty_width, sty_height)
	{
		M3D_DisplayLog("M3D_AddTorusTexture(" + x + "," + y + "," + z + ", ...)");
		no = M3D_CreateTorusTexture(x, y, z, radius, tubeRadius, angle, imgTexture, sty_width, sty_height);
		if (M3D_AddMesh(no))
			return no;
		else
			return -1;
	}
	
	
	//***********************************************************
		
	//______________________________________________________________________________________________
	function M3D_CreateSprite(x, y, z, width, height, depth, color)
	{
		M3D_DisplayLog("M3D_CreateSprite(" + x + "," + y + "," + z + ", ...)");
		m3d_mTmpMaterial = new THREE.SpriteMaterial( {color: color} );
		var mesh = new THREE.Sprite(m3d_mTmpMaterial);
		mesh.scale.set(width, height, depth);
		return M3D_CreateMesh(mesh, x, y, z);
	}
	
	//______________________________________________________________________________________________
	function M3D_CreateSpriteText(x, y, z, width, height, canvasId, txt, sizePt, textColor, backColor)
	{
		M3D_DisplayLog("M3D_CreateSpriteText(" + x + "," + y + "," + z + ", '" + txt + "',...)");
		return m3D_Create_CM3D_Text2D("Sprite", x, y, z, width, height, canvasId, txt, sizePt, textColor, backColor);
	}
	
	//______________________________________________________________________________________________
	function M3D_CreateSpriteTexture(x, y, z, width, height, depth, color, imgTexture, sty_width, sty_height)
	{
		M3D_DisplayLog("M3D_CreateSpriteTexture(" + x + "," + y + "," + z + ", ... ," + imgTexture + "," + sty_width + "," + sty_height + ")");

		var texture = new THREE.Texture();
		texture.image = imgTexture;
		imgTexture.onload = function() {	texture.needsUpdate = true; };
		texture.repeat.set(sty_width, sty_height);
		texture.wrapS = texture.wrapT = THREE.MirroredRepeatWrapping;
		m3d_mTmpMaterial = new THREE.SpriteMaterial( {map: texture, color: color} );
		var mesh = new THREE.Sprite(m3d_mTmpMaterial );
		mesh.scale.set(width, height, depth);
		return M3D_CreateMesh(mesh, x, y, z);
	}
	
	//______________________________________________________________________________________________
	function M3D_AddSprite(x, y, z, width, height, depth, color)
	{
		M3D_DisplayLog("M3D_AddSprite(" + x + "," + y + "," + z + ", ...)");
		no = M3D_CreateSprite(x, y, z, width, height, depth, color);
		if (M3D_AddMesh(no))
			return no;
		else
			return -1;
	}
	
	//______________________________________________________________________________________________
	function M3D_AddSpriteText(x, y, z, width, height, canvasId, txt, sizePt, textColor, backColor)
	{
		M3D_DisplayLog("M3D_AddSpriteText(" + x + "," + y + "," + z + ", '" + txt + "',...)");
		var no = M3D_CreateSpriteText(x, y, z, width, height, canvasId, txt, sizePt, textColor, backColor);
		if (M3D_AddMesh(no))
			return no;
		else
			return -1;
	}
	
	//______________________________________________________________________________________________
	function M3D_AddSpriteTexture(x, y, z, width, height, depth, color, imgTexture, sty_width, sty_height)
	{
		M3D_DisplayLog("M3D_AddSpriteTexture(" + x + "," + y + "," + z + ", ...)");
		no = M3D_CreateSpriteTexture(x, y, z, width, height, depth, color, imgTexture, sty_width, sty_height);
		if (M3D_AddMesh(no))
			return no;
		else
			return -1;
	}
	
	
	//***********************************************************

	//______________________________________________________________________________________________
	function M3D_CreateTetrahedron(x, y, z, width, height, depth, nbSide, color, opacity)
	{
		M3D_DisplayLog("M3D_CreateTetrahedron(" + x + "," + y + "," + z + ", ...)");
		m3d_mTmpGeometry = new THREE.TetrahedronGeometry( nbSide, 0 );
		if (opacity == 1)
			m3d_mTmpMaterial = new THREE.MeshPhongMaterial( {color: color} );
		else
			m3d_mTmpMaterial = new THREE.MeshPhongMaterial( {color: color, transparent: true, opacity: opacity} );
		var mesh = new THREE.Mesh( m3d_mTmpGeometry, m3d_mTmpMaterial );
		mesh.scale.set(width, height, depth);
		return M3D_CreateMesh(mesh, x, y, z);
	}
	
	//______________________________________________________________________________________________
	function M3D_CreateTetrahedronTexture(x, y, z, width, height, depth, nbSide, imgTexture, sty_width, sty_height)
	{
		M3D_DisplayLog("M3D_CreateTetrahedronTexture(" + x + "," + y + "," + z + ", ... ," + imgTexture + "," + sty_width + "," + sty_height + ")");
		m3d_mTmpMaterial = M3D_GetMaterialTexture(imgTexture, sty_width, sty_height);
		if (m3d_mTmpMaterial == null)
			return M3D_CreateTetrahedron(x, y, z, width, height, depth, nbSide, color_Red, 1);
		m3d_mTmpGeometry = new THREE.TetrahedronGeometry( nbSide, 0 );
		var mesh = new THREE.Mesh( m3d_mTmpGeometry, m3d_mTmpMaterial );
		mesh.scale.set(width, height, depth);
		return M3D_CreateMesh(mesh, x, y, z);
	}
	
	//______________________________________________________________________________________________
	function M3D_AddTetrahedron(x, y, z, width, height, depth, nbSide, color, opacity)
	{
		M3D_DisplayLog("M3D_AddTetrahedron(" + x + "," + y + "," + z + ", ...)");
		no = M3D_CreateTetrahedron(x, y, z, width, height, depth, nbSide, color, opacity);
		if (M3D_AddMesh(no))
			return no;
		else
			return -1;
	}
	
	//______________________________________________________________________________________________
	function M3D_AddTetrahedronTexture(x, y, z, width, height, depth, nbSide, imgTexture, sty_width, sty_height)
	{
		M3D_DisplayLog("M3D_AddTetrahedronTexture(" + x + "," + y + "," + z + ", ...)");
		no = M3D_CreateTetrahedronTexture(x, y, z, width, height, depth, nbSide, imgTexture, sty_width, sty_height);
		if (M3D_AddMesh(no))
			return no;
		else
			return -1;
	}
	
	
	//***********************************************************
	//______________________________________________________________________________________________
	function M3D_CreateTube(x, y, z, x2, y2, z2, radius, color, opacity)
	{
		M3D_DisplayLog("M3D_CreateTube(" + x + "," + y + "," + z + ", ...)");
		var pathLine = new THREE.LineCurve( new THREE.Vector3(x, y, z), new THREE.Vector3(x2, y2, z2) );
		m3d_mTmpGeometry = new THREE.TubeGeometry( pathLine, 64, radius, 48, true );
		if (opacity == 1)
			m3d_mTmpMaterial = new THREE.MeshPhongMaterial( {color: color} );
		else
			m3d_mTmpMaterial = new THREE.MeshPhongMaterial( {color: color, transparent: true, opacity: opacity} );
		var mesh = new THREE.Mesh( m3d_mTmpGeometry, m3d_mTmpMaterial );
		return M3D_CreateMeshNoPosition(mesh);
	}
	
	//______________________________________________________________________________________________
	function M3D_CreateTubeTexture(x, y, z, x2, y2, z2, radius, imgTexture, sty_width, sty_height)
	{
		M3D_DisplayLog("M3D_CreateTubeTexture(" + x + "," + y + "," + z + ", ... ," + imgTexture + "," + sty_width + "," + sty_height + ")");
		m3d_mTmpMaterial = M3D_GetMaterialTexture(imgTexture, sty_width, sty_height);
		if (m3d_mTmpMaterial == null)
			return M3D_CreateTube(x, y, z, x2, y2, z2, radius, color_Red, 1);
		var pathLine = new THREE.LineCurve( new THREE.Vector3(x, y, z), new THREE.Vector3(x2, y2, z2) );
		m3d_mTmpGeometry = new THREE.TubeGeometry( pathLine, 64, radius, 20, true );
		var mesh = new THREE.Mesh( m3d_mTmpGeometry, m3d_mTmpMaterial );
		return M3D_CreateMeshNoPosition(mesh);
	}
	
	//______________________________________________________________________________________________
	function M3D_AddTube(x, y, z, x2, y2, z2, radius, color, opacity)
	{
		M3D_DisplayLog("M3D_AddTube(" + x + "," + y + "," + z + ", ...)");
		no = M3D_CreateTube(x, y, z, x2, y2, z2, radius, color, opacity);
		if (M3D_AddMesh(no))
			return no;
		else
			return -1;
	}
	
	//______________________________________________________________________________________________
	function M3D_AddTubeTexture(x, y, z, x2, y2, z2, radius, imgTexture, sty_width, sty_height)
	{
		M3D_DisplayLog("M3D_AddTubeTexture(" + x + "," + y + "," + z + ", ...)");
		no = M3D_CreateTubeTexture(x, y, z, x2, y2, z2, radius, imgTexture, sty_width, sty_height);
		if (M3D_AddMesh(no))
			return no;
		else
			return -1;
	}
	
	
	
	//***********************************************************
	//______________________________________________________________________________________________
	function m3d_VerifPathNo(no)
	{
		if ( (no < 0) || (no >= m3d_mTabPaths.length) )
		{
			var min = m3d_mTabPaths.length - 1;
			M3D_DisplayError("m3d_VerifPathNo(" + no + ") no must be between O and " + min);
			return false;
		}
		return true;
	}
	
	//______________________________________________________________________________________________
	function M3D_CreatePath()
	{
		M3D_DisplayLog("M3D_CreatePath()");
		no = m3d_mTabPaths.length;
		m3d_mTabPaths[no] = [];
		return no;
	}

	//______________________________________________________________________________________________
	function M3D_AddPtToPath(x, y, z, noPath)
	{
		M3D_DisplayLog("M3D_AddPtToPath(" + x + "," + y + "," + z + "," + noPath + ", ...)");
		if (! m3d_VerifPathNo(noPath))
			return false;
		m3d_mTabPaths[noPath].push(new THREE.Vector3(x, y, z));
		return true;
	}

	//______________________________________________________________________________________________
	function M3D_ClosePath(noPath)
	{
		M3D_DisplayLog("M3D_ClosePath(" + noPath + ")");
		return true;
	}


	
	//***********************************************************
	//______________________________________________________________________________________________
	function M3D_CreateTubePath(x, y, z, noPath, radius, color, opacity)
	{
		M3D_DisplayLog("M3D_CreateTubePath(" + x + "," + y + "," + z + ", ...)");
		if (! m3d_VerifPathNo(noPath))
			return null;
		
		// le groupe qui contient les tubes
		noGrp = M3D_CreateGroup(x, y, z);
		
		for (var i = 0; i < m3d_mTabPaths[noPath].length; i++)
		{
			if (i > 0)
			{
				curPt = m3d_mTabPaths[noPath][i].clone();
				noTube = M3D_CreateTube(precPt.x, precPt.y, precPt.z, curPt.x, curPt.y, curPt.z, radius, color, opacity);
				M3D_AddMeshToGroup(noTube, noGrp);
				if (i < m3d_mTabPaths[noPath].length - 1)
				{	// la sphere pour la continuité
					noSphere = M3D_CreateSphere(curPt.x, curPt.y, curPt.z, radius, color, opacity);
					M3D_AddMeshToGroup(noSphere, noGrp);
				}
			}
			var precPt = m3d_mTabPaths[noPath][i];
		}
		
		return noGrp;
	}
	
	//______________________________________________________________________________________________
	function M3D_CreateTubePathTexture(x, y, z, noPath, radius, imgTexture, sty_width, sty_height)
	{
		if (! m3d_VerifPathNo(noPath))
			return null;
		
		// le groupe qui contient les tubes
		noGrp = M3D_CreateGroup(x, y, z);
		
		for (var i = 0; i < m3d_mTabPaths[noPath].length; i++)
		{
			if (i > 0)
			{
				curPt = m3d_mTabPaths[noPath][i].clone();
				noTube = M3D_CreateTubeTexture(precPt.x, precPt.y, precPt.z, curPt.x, curPt.y, curPt.z, radius, imgTexture, sty_width, sty_height);
				M3D_AddMeshToGroup(noTube, noGrp);
				if (i < m3d_mTabPaths[noPath].length - 1)
				{	// la sphere pour la continuité
					noSphere = M3D_CreateSphere(curPt.x, curPt.y, curPt.z, radius, imgTexture, sty_width, sty_height);
					M3D_AddMeshToGroup(noSphere, noGrp);
				}
			}
			var precPt = m3d_mTabPaths[noPath][i];
		}
		
		return noGrp;
	}
	
	//______________________________________________________________________________________________
	function M3D_AddTubePath(x, y, z, noPath, radius, color, opacity)
	{
		M3D_DisplayLog("M3D_AddTubePath(" + x + "," + y + "," + z + ", ...)");
		no = M3D_CreateTubePath(x, y, z, noPath, radius, color, opacity);
		if (M3D_AddMesh(no))
			return no;
		else
			return -1;
	}
	
	//______________________________________________________________________________________________
	function M3D_AddTubePathTexture(x, y, z, noPath, radius, imgTexture, sty_width, sty_height)
	{
		M3D_DisplayLog("M3D_AddTubePathTexture(" + x + "," + y + "," + z + ", ...)");
		no = M3D_CreateTubePathTexture(x, y, z, noPath, radius, imgTexture, sty_width, sty_height);
		if (M3D_AddMesh(no))
			return no;
		else
			return -1;
	}
	
	
	
	


	//***********************************************************
	//______________________________________________________________________________________________
	function m3d_VerifShapeNo(no)
	{
		if ( (no < 0) || (no >= m3d_mTabShapes.length) )
		{
			var min = m3d_mTabShapes.length - 1;
			M3D_DisplayError("M3D_VerifShapeNo(" + no + ") no must be between O and " + min);
			return false;
		}
		return true;
	}
	
	//______________________________________________________________________________________________
	function M3D_CreateShape()
	{
		M3D_DisplayLog("M3D_CreateShape()");
		no = m3d_mTabShapes.length;
		m3d_mTabShapes[no] = new THREE.Shape();
		m3d_mTabShapes[no].moveTo( 0, 0 );
		return no;
	}

	//______________________________________________________________________________________________
	function M3D_AddPtToShape(x, y, noShape)
	{
		M3D_DisplayLog("M3D_AddPtToShape(" + x + "," + y + "," + noShape + ", ...)");
		if (! m3d_VerifShapeNo(noShape))
			return false;
		m3d_mTabShapes[noShape].lineTo(x, y);
		return true;
	}

	//______________________________________________________________________________________________
	function M3D_CloseShape(noShape)
	{
		M3D_DisplayLog("M3D_CloseShape(" + noShape + ")");
		return M3D_AddPtToShape(0, 0, noShape);
	}

	//______________________________________________________________________________________________
	function M3D_CreateExtrude(x, y, z, noShape, depth, color, opacity)
	{
		M3D_DisplayLog("M3D_CreateExtrude(" + x + "," + y + "," + z + "," + noShape + "," + depth + ", ...)");
		if (! m3d_VerifShapeNo(noShape))
			return -1;
		m3d_mTmpExtrudeSettings = {	steps: 0, amount: depth, bevelEnabled: true, bevelThickness: 0, bevelSize: 0, bevelSegments: 1};
		m3d_mTmpGeometry = new THREE.ExtrudeGeometry( m3d_mTabShapes[noShape], m3d_mTmpExtrudeSettings);
		if (opacity == 1)
			m3d_mTmpMaterial = new THREE.MeshPhongMaterial( {color: color} );
		else
			m3d_mTmpMaterial = new THREE.MeshPhongMaterial( {color: color, transparent: true, opacity: opacity} );
		var mesh = new THREE.Mesh( m3d_mTmpGeometry, m3d_mTmpMaterial );
		return M3D_CreateMesh(mesh, x, y, z);
	}
	
	//______________________________________________________________________________________________
	function M3D_CreateExtrudeTexture(x, y, z, noShape, depth, imgTexture, sty_width, sty_height)
	{
		M3D_DisplayLog("M3D_CreateExtrudeTexture(" + x + "," + y + "," + z + "," + noShape + "," + depth + ", " + imgTexture + "," + sty_width + "," + sty_height + ")");
		if (! m3d_VerifShapeNo(noShape))
			return -1;
		m3d_mTmpMaterial = M3D_GetMaterialTexture(imgTexture, sty_width, sty_height);
		if (m3d_mTmpMaterial == null)
			return M3D_CreateExtrude(x, y, z, noShape, depth, color_Red, 1);
		var m3d_mTmpExtrudeSettings = {	steps: 0, amount: depth, bevelEnabled: true, bevelThickness: 0, bevelSize: 0, bevelSegments: 1};
		m3d_mTmpGeometry = new THREE.ExtrudeGeometry( m3d_mTabShapes[noShape], m3d_mTmpExtrudeSettings);
		var mesh = new THREE.Mesh( m3d_mTmpGeometry, m3d_mTmpMaterial );
		return M3D_CreateMesh(mesh, x, y, z);
	}
	
	//______________________________________________________________________________________________
	function M3D_AddExtrude(x, y, z, noShape, depth, color, opacity)
	{
		M3D_DisplayLog("M3D_AddExtrude(" + x + "," + y + "," + z + ", ...)");
		no = M3D_CreateExtrude(x, y, z, noShape, depth, color, opacity);
		if (no == -1)
			return -1;
		if (M3D_AddMesh(no))
			return no;
		else
			return -1;
	}
	
	//______________________________________________________________________________________________
	function M3D_AddExtrudeTexture(x, y, z, noShape, depth, imgTexture, sty_width, sty_height)
	{
		M3D_DisplayLog("M3D_AddExtrudeTexture(" + x + "," + y + "," + z + ", ...)");
		no = M3D_CreateExtrudeTexture(x, y, z, noShape, depth, imgTexture, sty_width, sty_height);
		if (no == -1)
			return -1;
		if (M3D_AddMesh(no))
			return no;
		else
			return -1;
	}
	
	
	
	
	//***********************************************************
	
	//______________________________________________________________________________________________
	function m3d_LoadStl(no, x, y, z, name, scale, color, bAddToScene)
	{
		M3D_DisplayLog("m3d_LoadStl(" + no + ", ...)");
		
        m3d_StlLoader.load("STL/" + name + ".stl", function (geometry) 
		{
			M3D_DisplayLog('STL created ' + name + " " + no);
            var mat = new THREE.MeshLambertMaterial({color: color});
            mesh = new THREE.Mesh(geometry, mat);
			m3d_mTabMeshs[no].mesh = mesh;
			mesh.position.set(x, y, z);
            mesh.scale.set(scale, scale, scale);
			if (M3D_mbInEdition)
				m3d_SetClickable(no, true);
			if (M3D_mbShadows)
			{
				mesh.castShadow = true;
				mesh.receiveShadow = true;
			}
			if (bAddToScene)
				M3D_AddMesh(no)
			M3D_SendMeshLoaded(no);
        });
	}
	
	//______________________________________________________________________________________________
	function m3d_CreateStl(x, y, z, name, scale, color, bAddToScene)
	{
		M3D_DisplayLog("m3d_CreateStl(" + x + "," + y + "," + z + ", " + name + ", ...)");
		if (m3d_StlLoader == null)
		{
			M3D_DisplayError(" ---> m3d_StlLoader is null");
			return -1;
		}
        
		// creation objet
		var mesh = new THREE.Object3D();
		no = m3d_mTabMeshs.length;
		m3d_mTabMeshs[no] = new CM3D_MeshConf(mesh);
		m3d_mTabMeshs[no].mX = x;
		
		// on lance le chargement
		m3d_LoadStl(no, x, y, z, name, scale, color, bAddToScene);
		
		M3D_DisplayLog("    ---> no: " + no);
		return no;
	}
	
	//______________________________________________________________________________________________
	function M3D_CreateStl(x, y, z, name, scale, color)
	{
		M3D_DisplayLog("M3D_CreateSTL(" + x + "," + y + "," + z + ", " + name + ", ...)");
		return m3d_CreateStl(x, y, z, name, scale, color, false);
	}
	
	//______________________________________________________________________________________________
	function M3D_AddStl(x, y, z, name, scale, color)
	{
		M3D_DisplayLog("M3D_AddStl(" + x + "," + y + "," + z + ", " + name + ", ...)");
		return m3d_CreateStl(x, y, z, name, scale, color, true);
	}

	
	
	
	

//###################################################################################################
// MODIFICATION OF MESHS

	//______________________________________________________________________________________________
	function M3D_GetMesh(no)
	{
		//M3D_DisplayLog("M3D_GetMesh(" + no + ")");
		if ( ! M3D_VerifMeshNo(no))
			return 0;
		
		return m3d_mTabMeshs[no].mesh;
	}
	
	//______________________________________________________________________________________________
	function M3D_GetPosition(no)
	{
		//M3D_DisplayLog("M3D_GetPosition(" + no + ")");
		if ( ! M3D_VerifMeshNo(no))
			return 0;
		
		return m3d_mTabMeshs[no].mesh.position;
	}
	
	//______________________________________________________________________________________________
	function M3D_GetRotation(no)
	{
		//M3D_DisplayLog("M3D_GetRotation(" + no + ")");
		if ( ! M3D_VerifMeshNo(no))
			return 0;
		
		rot = new THREE.Vector3(m3d_mTabMeshs[no].mesh.rotation.x, m3d_mTabMeshs[no].mesh.rotation.y, m3d_mTabMeshs[no].mesh.rotation.z);
		rot.x = rot.x * 180 / Math.PI;
		rot.y = rot.y * 180 / Math.PI;
		rot.z = rot.z * 180 / Math.PI;
		
		return rot;
	}
	
	//______________________________________________________________________________________________
	function M3D_SetClickable(no, bClickable)
	{
		M3D_DisplayLog("M3D_SetClickable(" + no + "," + bClickable + ")");
		if ( ! M3D_VerifMeshNo(no))
			return;
		m3d_SetClickable(no, bClickable);
	}
	
	//______________________________________________________________________________________________
	function M3D_SetVisible(no, bVisible)
	{
		M3D_DisplayLog("M3D_SetVisible(" + no + "," + bVisible + ")");
		if ( ! M3D_VerifMeshNo(no))
			return;
		
		if (m3d_mTabMeshs[no].mesh.visible == bVisible)
			return;
		
		if (bVisible)
		{
			m3d_mTabMeshs[no].mesh.position.x = m3d_mTabMeshs[no].mX;
			m3d_mTabMeshs[no].mesh.visible = true;
		}
		else
		{
			m3d_mTabMeshs[no].mesh.visible = false;
			m3d_mTabMeshs[no].mX = m3d_mTabMeshs[no].mesh.position.x;
			m3d_mTabMeshs[no].mesh.position.x = m3d_mXWhenHided;
		}
	}
	
	//______________________________________________________________________________________________
	function M3D_SetPosition(no, x, y, z)
	{
		M3D_DisplayLog("M3D_SetPosition(" + no + "," + x + "," + y + "," + z + ")");
		if ( ! M3D_VerifMeshNo(no))
			return;
		m3d_mTabMeshs[no].mX = x;
		if (m3d_mTabMeshs[no].mesh.visible)
			m3d_mTabMeshs[no].mesh.position.set(x, y, z);
		else
			m3d_mTabMeshs[no].mesh.position.set(m3d_mXWhenHided, y, z);
	}
	
	//______________________________________________________________________________________________
	function M3D_SetSize(no, width, height, depth)
	{
		M3D_DisplayLog("M3D_SetSize(" + no + "," + width + "," + height + "," + depth + ")");
		if ( ! M3D_VerifMeshNo(no))
			return;
		
		m3d_mTabMeshs[no].mesh.scale.set(width, height, depth);
	}
	
	//______________________________________________________________________________________________
	function M3D_SetScale(no, scale)
	{
		M3D_DisplayLog("M3D_SetScale(" + no + "," + scale + "," + scale + "," + scale + ")");
		if ( ! M3D_VerifMeshNo(no))
			return;
		
		m3d_mTabMeshs[no].mesh.scale.set(scale, scale, scale);
	}
	
	//______________________________________________________________________________________________
	function M3D_SetColor(no, color)
	{
		M3D_DisplayLog("M3D_SetColor(" + no + "," + color + ")");
		if ( ! M3D_VerifMeshNo(no))
			return;
		
		m3d_mTabMeshs[no].mesh.material.color.setHex(color);
	}
	
	//______________________________________________________________________________________________
	function M3D_SetText(no, txt)
	{
		M3D_DisplayLog("M3D_SetText(" + no + ", '" + txt + "')");
		if ( ! M3D_VerifMeshNo(no))
			return;
		
		if (m3d_mTabMeshs[no].mText2D != 0)
		{
			m3d_mTabMeshs[no].mText2D.SetText(txt, true);
			return;
		}
		
		x = m3d_mTabMeshs[no].mX;
		y = m3d_mTabMeshs[no].mesh.position.y;
		z = m3d_mTabMeshs[no].mesh.position.z;
		// quid recup size, depth, color, opacity ?
		size = 1;
		depth = 0.1;
		color = color_PapayaWhite;
		opacity = 1;
		// on supprime l'ancien 
		M3D_mScene.remove(m3d_mTabMeshs[no].mesh);
		// on cree un nouveau
		var font = fontHelvetikerRegular;
		var ratio = size / 40;
		var m3d_mTmpGeometry = new THREE.TextGeometry( txt, {
			font: fontHelvetikerRegular,
			size: size,
			height: depth,
			curveSegments: 12,
			bevelEnabled: true,
			bevelThickness: ratio,
			bevelSize: ratio,
			bevelSegments: 5
		} );
		m3d_mTmpMaterial = new THREE.MeshPhongMaterial( {color: color} );
		var mesh = new THREE.Mesh( m3d_mTmpGeometry, m3d_mTmpMaterial );
		mesh.position.set(x, y, z);
		m3d_mTabMeshs[no].mX = x;
		if (M3D_mbInEdition)
			m3d_SetClickable(no, true);
		if (M3D_mbShadows)
		{
			mesh.castShadow = true;
			mesh.receiveShadow = true;
		}
		M3D_mScene.add(mesh);
		// if (M3D_mbInEdition) m3d_SetClickable(no, mesh);
		m3d_mTabMeshs[no].mesh = mesh;
	}
			
	
	
	//______________________________________________________________________________________________
	function M3D_SetText2DColors(no, TextColor, BackColor)
	{
		M3D_DisplayLog("M3D_SetText2DColors(" + no + ", " + TextColor + ", " + BackColor + ")");
		if ( ! M3D_VerifMeshNo(no))
			return;
		
		if (m3d_mTabMeshs[no].mText2D == 0)
			return;
		
		m3d_mTabMeshs[no].mText2D.SetColors(TextColor, BackColor, true);
	}
			
	//______________________________________________________________________________________________
	function M3D_SetText2DFont(no, size, font)
	{
		M3D_DisplayLog("M3D_SetText2DFont(" + no + ", " + size + ", '" + font + "')");
		if ( ! M3D_VerifMeshNo(no))
			return;
		
		if (m3d_mTabMeshs[no].mText2D == 0)
			return;
		
		m3d_mTabMeshs[no].mText2D.SetFont(size, font, true);
	}
			
	//______________________________________________________________________________________________
	function M3D_SetText2DAlignements(no, horizontalAlign, verticalAlign)
	{
		M3D_DisplayLog("M3D_SetText2DAlignements(" + no + ", '" + horizontalAlign + "', '" + verticalAlign + "')");
		if ( ! M3D_VerifMeshNo(no))
			return;
		
		if (m3d_mTabMeshs[no].mText2D == 0)
			return;
		
		m3d_mTabMeshs[no].mText2D.SetAlignements(horizontalAlign, verticalAlign, true);
	}
			
	
	
	//______________________________________________________________________________________________
	function m3d_SetDigitValue(meshDigit, value)
	{
		M3D_DisplayLog("   m3d_SetDigitValue(..., " + value + ")");
		for (noChildDigit = 0; noChildDigit < 10; noChildDigit++)
			meshDigit.children[noChildDigit].visible = (noChildDigit == value);
	}
	
	//______________________________________________________________________________________________
	function M3D_SetDisplayValue(no, value, nbDigit)
	{
		M3D_DisplayLog("M3D_SetDisplayValue(" + no + "," + value + "," + nbDigit + ")");
		if ( ! M3D_VerifMeshNo(no))
			return;
		
		noChild = 0;
		if (nbDigit > 3)
		{
			valDigit = (value - (value %1000)) / 1000;
			m3d_SetDigitValue(m3d_mTabMeshs[no].mesh.children[noChild], valDigit);
			value = value % 1000;
			noChild++;
		}
		if (nbDigit > 2)
		{
			valDigit = (value - (value %100)) / 100;
			m3d_SetDigitValue(m3d_mTabMeshs[no].mesh.children[noChild], valDigit);
			value = value % 100;
			noChild++;
		}
		if (nbDigit > 1)
		{
			valDigit = (value - (value %10)) / 10;
			m3d_SetDigitValue(m3d_mTabMeshs[no].mesh.children[noChild], valDigit);
			value = value % 10;
			noChild++;
		}
		m3d_SetDigitValue(m3d_mTabMeshs[no].mesh.children[noChild], value);
	}
	
	//______________________________________________________________________________________________
	function M3D_SetRotation(no, rotx, roty, rotz)
	{
		M3D_DisplayLog("M3D_SetRotation(" + no + "," + rotx + "," + roty + "," + rotz + ")");
		if ( ! M3D_VerifMeshNo(no))
			return;
		
		m3d_mTabMeshs[no].mesh.rotation.x = rotx * Math.PI / 180;
		m3d_mTabMeshs[no].mesh.rotation.y = roty * Math.PI / 180;
		m3d_mTabMeshs[no].mesh.rotation.z = rotz * Math.PI / 180;
	}
	
	//______________________________________________________________________________________________
	function M3D_GetNoAnimMeshPosition(nomesh)
	{
		M3D_DisplayLog("M3D_GetNoAnimMeshPosition(" + nomesh + ")");
		
		for (noconf = 0; noconf < m3d_mTabAnimMeshsPosition.length; noconf++)
			if (m3d_mTabAnimMeshsPosition[noconf].no == nomesh)
				return noconf;
			
		M3D_DisplayLog(" ----> -1");
		return -1;
	}
	
	//______________________________________________________________________________________________
	function M3D_GetNoAnimMeshRotation(nomesh)
	{
		M3D_DisplayLog("M3D_GetNoAnimMeshRotation(" + nomesh + ")");
		
		for (noconf = 0; noconf < m3d_mTabAnimMeshsRotation.length; noconf++)
			if (m3d_mTabAnimMeshsRotation[noconf].no == nomesh)
				return noconf;
			
		M3D_DisplayLog(" ----> -1");
		return -1;
	}
	
	//______________________________________________________________________________________________
	function M3D_SetPositionMove(no, x, y, z)
	{
		M3D_DisplayLog("M3D_SetPositionMove(" + no + "," + x + "," + y + "," + z + ")");

		// get the existing conf (or create it)
		noconf = M3D_GetNoAnimMeshPosition(no);
		if (noconf == -1)
			noconf = m3d_mTabAnimMeshsPosition.push(new CM3D_ConfAnimMesh(no)) - 1;  // push retourne length

		// modify the configuration
		m3d_mTabAnimMeshsPosition[noconf].x = x;
		m3d_mTabAnimMeshsPosition[noconf].y = y;
		m3d_mTabAnimMeshsPosition[noconf].z = z;
		
		// remove it if there is no animations
		if (m3d_mTabAnimMeshsPosition[noconf].IsNull())
			m3d_mTabAnimMeshsPosition.splice(noconf, 1);
		
		return noconf;
	}
	
	//______________________________________________________________________________________________
	function M3D_SetRotationMove(no, rotx, roty, rotz)
	{
		M3D_DisplayLog("M3D_SetRotationMove(" + no + "," + rotx + "," + roty + "," + rotz + ")");
		if ( ! M3D_VerifMeshNo(no))
			return;
		
		// get the existing conf (or create it)
		noconf = M3D_GetNoAnimMeshRotation(no);
		if (noconf == -1)
			noconf = m3d_mTabAnimMeshsRotation.push(new CM3D_ConfAnimMesh(no)) - 1;  // push retourne length

		// modify the configuration
		m3d_mTabAnimMeshsRotation[noconf].rotx = rotx * Math.PI / 180;
		m3d_mTabAnimMeshsRotation[noconf].roty = roty * Math.PI / 180;
		m3d_mTabAnimMeshsRotation[noconf].rotz = rotz * Math.PI / 180;
		
		// remove it if there is no animations
		if (m3d_mTabAnimMeshsRotation[noconf].IsNull())
			m3d_mTabAnimMeshsRotation.splice(noconf, 1);
		
		return noconf;
	}
	
	
	
	
	
//#################################################################################################
// SEND EVENTS to 3D Mockup Studio
	
	//______________________________________________________________________________________________
	function M3D_SendMouseClicEvent(evt, param)
	{
		M3D_DisplayLog("M3D_SendMouseClicEvent --> M3D_OnMouseClicEvent(" + evt + "," + param + ")");
		if ('M3D_OnMouseClicEvent' in window.external)   // undefined si lancement en direct
		{
			window.external.M3D_OnMouseClicEvent(evt, param + "");
		}
	}
	
	//______________________________________________________________________________________________
	function M3D_SendPositionEvent(evt, posX, posY, posZ)
	{
		M3D_DisplayLog("M3D_SendPositionEvent --> M3D_OnPositionEvent(" + evt + "," + posX + "," + posY + "," + posZ + ")");
		if ('M3D_OnPositionEvent' in window.external)   // undefined si lancement en direct
		{
			window.external.M3D_OnPositionEvent(evt, posX + "", posY + "", posZ + "");
		}
	}
	
	//______________________________________________________________________________________________
	function M3D_SendTimerEvent(no)
	{
		M3D_DisplayLog("M3D_SendTimerEvent --> M3D_OnTimerEvent(" + no + ")");
		if ('M3D_OnTimerEvent' in window.external)   // undefined si lancement en direct
		{
			window.external.M3D_OnTimerEvent(no);
		}
	}
	
	
	
	
//#################################################################################################
// CLICK ON OBJECT AND CONTROL CAMERA WITH MOUSE
	
	
	//______________________________________________________________________________________________
	function M3D_DetectMeshUnderClic(evt)
	{
		M3D_DisplayLog("M3D_DetectMeshUnderClic(" + evt + ")");
		event.preventDefault();
		M3D_mMousePosRenderer.x = ( evt.clientX / M3D_mRenderer.domElement.clientWidth ) * 2 - 1;
		M3D_mMousePosRenderer.y = - ( evt.clientY / M3D_mRenderer.domElement.clientHeight ) * 2 + 1;
		M3D_mRaycaster.setFromCamera( M3D_mMousePosRenderer, M3D_mCamera );
		var intersects = M3D_mRaycaster.intersectObjects( M3D_mTabMeshClickables ); 
		
		if ( intersects.length == 0 )
		{
			M3D_DisplayLog("  --> M3D_DetectMeshUnderClic no object founded");
			return -1;
		}
		
		// if there is one (or more) intersections
		var intersection = intersects[0],
		obj = intersection.object;

		var index = M3D_mTabMeshClickables.indexOf(obj);
		return M3D_mTabNoClickables[index];
	}
	
	//____________________________________
	function M3D_OnMouseDown( evt ) 
	{   
		M3D_mMouseClicOnX = evt.clientX;
		M3D_mMouseClicOnY = evt.clientY;
		M3D_DisplayLog("M3D_OnMouseDown(" + evt.buttons + ")  " + M3D_mMouseClicOnX + " " + M3D_mMouseClicOnY);
		
		if (evt.buttons == 2)
		{
			M3D_mbRightClick = true;
			return;
		}

		if (evt.buttons != 1)
			return;
		
		M3D_mMeshSelected = M3D_DetectMeshUnderClic(evt);
		if (M3D_mMeshSelected != -1)
		{
			m3d_mTabMeshs[M3D_mMeshSelected].EvalMouseEvent("OnMouseDown");
			M3D_SendMouseClicEvent("OnMouseDown", M3D_mMeshSelected);	// send event to 3D mockup studio
			if (typeof OnMouseEvent !== 'undefined') 
				OnMouseEvent("OnMouseDown", M3D_mMeshSelected);  	// call mockup function
		}
		
		M3D_mbLeftClick = true;
	}
	
	//____________________________________
	function M3D_OnMouseUp( evt ) 
	{  
		if (M3D_mbRightClick)
		{
			M3D_mbRightClick = false;
			return;
		}
		
		if (M3D_mbLeftClick)
		{
			M3D_DisplayLog("M3D_OnMouseUp(" + evt.buttons + ")");
			//M3D_DetectMeshUnderClic(event);
			if (M3D_mMeshSelected != -1)
			{
				m3d_mTabMeshs[M3D_mMeshSelected].EvalMouseEvent("OnMouseUp");
				M3D_SendMouseClicEvent("OnMouseUp", M3D_mMeshSelected);	// send event to 3D mockup studio
				if (typeof OnMouseEvent !== 'undefined') 
					OnMouseEvent("OnMouseUp", M3D_mMeshSelected);  	// call mockup function
				M3D_mMeshSelected = -1;
			}
			else
				M3D_SendPositionEvent("OnCameraChange", M3D_mCameraAngle * 180 / Math.PI, M3D_mCameraY, M3D_mCameraZoom);

			M3D_mbLeftClick = false;
		}
	}		
	

	
	
	//#################################################################################################
	// CONTROL CAMERA WITH MOUSE

	
	//____________________________________
	function M3D_CalculateCamera()
	{
		M3D_mCamera.position.x = M3D_mCameraZoom * Math.cos(M3D_mCameraAngle) + M3D_mPtLookAt.x;
		M3D_mCamera.position.y = M3D_mCameraY;
		M3D_mCamera.position.z = M3D_mCameraZoom * Math.sin(M3D_mCameraAngle) + M3D_mPtLookAt.z;
		M3D_mCamera.lookAt(M3D_mPtLookAt); //M3D_mScene.position);
	}
	
	//____________________________________
	function M3D_OnMouseMove(e) 
	{
		if (M3D_mCameraFixed)	// on ne déplace pas la caméra
			return;
		
		if (M3D_mMeshSelected != -1)	// on est entrain de sélectionner un mesh
			return;
		
		if (M3D_mbRightClick)
			M3D_DisplayLog("M3D_OnMouseMove M3D_mbRightClick");
		
		if ( ! M3D_mbLeftClick && ! M3D_mbRightClick) 			// pas de click en cours
			return;

		var deltaX = M3D_mMouseClicOnX - e.clientX;
		var deltaY = M3D_mMouseClicOnY - e.clientY;
		
		if (M3D_mbLeftClick) 			//  click gauche
		{
			M3D_DisplayLog("M3D_OnMouseMove Left click : " + deltaX + " " + deltaY);
			
			M3D_mCameraAngle += Math.PI/180 * deltaX;
			if (M3D_mCameraAngle > Math.PI * 2)
				M3D_mCameraAngle -= Math.PI * 2;
			if (M3D_mCameraAngle < 0)
				M3D_mCameraAngle += Math.PI * 2;
				
			M3D_mCameraY += 0.1 * deltaY;
		}
		else							// click droit
		{
			M3D_DisplayLog("M3D_OnMouseMove Right click : " + deltaX + " " + deltaY);
			angle = M3D_mCameraAngle - Math.PI/2;
			slow = 20;// / M3D_mCameraAngle.z;	// sinon le mouvement est trop rapide
			M3D_mPtLookAt.x += (deltaX * Math.cos(angle)) / slow;
			M3D_mPtLookAt.z += (deltaX * Math.sin(angle)) / slow;
			M3D_mPtLookAt.y += -deltaY / slow;
			M3D_mCameraY += -deltaY / slow;
			M3D_mHelpLookAt.position.set(M3D_mPtLookAt.x, M3D_mPtLookAt.y, M3D_mPtLookAt.z);
		}
		
		M3D_mMouseClicOnX = e.clientX;
		M3D_mMouseClicOnY = e.clientY;
		
		M3D_CalculateCamera();
	}
	
	//____________________________________
	function M3D_OnWheelChange(e) 
	{
		M3D_mCameraZoom += M3D_mCameraZoom * (e.deltaY / 1500);
		
		M3D_CalculateCamera();
		M3D_SendPositionEvent("OnCameraChange", M3D_mCameraAngle * 180 / Math.PI, M3D_mCameraY, M3D_mCameraZoom);
	}

	

	
	
//#################################################################################################
// TIMERS

	//______________________________________________________________________________________________
	function CM3D_Timer(noTimer, duration) 
	{
		this.mDuration = duration;
		this.mbRunning = false;
		this.mElapsedTime = 0;
		this.mId = noTimer;
		this.mbFinished = true;
	}

		//______________________________________________________________________________________________
		CM3D_Timer.prototype.Start = function() 
		{
			this.mElapsedTime = 0;
			this.mbRunning = true;
			this.mbFinished = false;
		};

		//______________________________________________________________________________________________
		CM3D_Timer.prototype.Stop = function() 
		{
			this.mbRunning = false;
			this.mbFinished = true;
		};

		//______________________________________________________________________________________________
		CM3D_Timer.prototype.Run = function() 
		{
			if (! this.mbRunning)
				return;
			this.mElapsedTime += M3D_mDeltaTime;
			if (this.mElapsedTime < this.mDuration)
				return;
			// timer echu
			this.mbRunning = false;
			this.mbFinished = true;
			M3D_SendTimerEvent(this.mId);
			
			if (typeof OnTimerEvent !== 'undefined') 
				OnTimerEvent(this.mId);	
		};

	
	
	
	//______________________________________________________________________________________________
	function m3d_VerifTimer(noTimer)
	{
		if ( (noTimer < 0) || (noTimer >= m3d_mTabTimers.length) )
		{
			var min = m3d_mTabTimers.length - 1;
			M3D_DisplayError("m3d_VerifTimer(" + noTimer + ") no must be between O and " + min);
			return false;
		}
		return true;
	}
	
	//____________________________________
	function M3D_CreateTimer(duration)
	{
		noTimer = m3d_mTabTimers.length;
		m3d_mTabTimers[noTimer] = new CM3D_Timer(noTimer, duration);
		M3D_DisplayLog("M3D_CreateTimer("+ duration + ") --> " + noTimer);
		return noTimer;
	}
	
	//____________________________________
	function M3D_StartTimer(noTimer)
	{
		M3D_DisplayRun("M3D_StartTimer(" + noTimer + ")");
		if ( ! m3d_VerifTimer(noTimer))
			return;
		m3d_mTabTimers[noTimer].Start();
	}
	
	//____________________________________
	function M3D_StopTimer(noTimer)
	{
		M3D_DisplayRun("M3D_StopTimer(" + noTimer + ")");
		if ( ! m3d_VerifTimer(noTimer))
			return;
		m3d_mTabTimers[noTimer].Stop();
	}
	
	//____________________________________
	function M3D_IsTimerFinished(noTimer)
	{
		M3D_DisplayRun("M3D_IsTimerFinished(" + noTimer + ")");
		if ( ! m3d_VerifTimer(noTimer))
			return false;
		return m3d_mTabTimers[noTimer].mbFinished;
	}
	
	
	
	//____________________________________
	function m3d_RunTimers()
	{
		//M3D_DisplayLog("m3d_RunTimers()");
		for (noTimer = 0; noTimer < m3d_mTabTimers.length; noTimer++)
			m3d_mTabTimers[noTimer].Run(); 
	}
	
	//____________________________________
	function m3d_RunModel()
	{
		if (typeof SM_Run == 'undefined') 
			return
		
		//M3D_DisplayLog("m3d_RunModel()");
		m3D_DeltaSinceLastRun += M3D_mDeltaTime;
		
		// on execute le model toutes les 100 ms
		if (m3D_DeltaSinceLastRun < 0.1)
			return;
		
		m3D_DeltaSinceLastRun = 0;
		SM_Run();
	}
	

	
	
	
	
	
//**************************************************************
//*  AUDIO     by   X.Dorel             		               *
//*															   *
//*             		                                       * 
//*  Javascript code used for audio                            * 
//*             		                                       * 
//**************************************************************

//__CLASS AUDIO _______________________________________________________________________________
function CM3D_Audio()
{
	M3D_DisplayLog("CM3D_Audio() : initialisation class CM3D_Audio");
	this.mListener = new THREE.AudioListener();
	M3D_mCamera.add( this.mListener );
	
	this.mAudioLoader = new THREE.AudioLoader();
	this.mTabSounds = new Array(); 
	this.mTabSoundsVolume = new Array(); 
	this.mMuted = false;
}

	//______________________________________________________________________________________________
	CM3D_Audio.prototype.AddSound = function(file, bPlay) 
	{
		// charger le son
		var sound = new THREE.Audio( this.mListener );
		this.mAudioLoader.load( file, function( buffer ) {
			sound.setBuffer( buffer );
			sound.setLoop(false);
			sound.setVolume(0.5);
			if (bPlay)
				sound.play();
		});
		// ajout au tableau
		noSound = this.mTabSounds.length;
		this.mTabSounds[noSound] = sound;
		// gestion du volume
		this.mTabSoundsVolume[noSound] = 0.5;  // val par défaut
		if (this.mMuted)
			sound.setVolume(0);
		
		M3D_DisplayLog("CM3D_Audio.AddSound(" + file + ") --> " + noSound);
		return noSound;
	};
	
	//______________________________________________________________________________________________
	CM3D_Audio.prototype.VerifSoundNo = function(noSound)
	{
		//M3D_DisplayLog("CM3D_Audio.VerifSoundNo(" + noSound + ")");
		if ( (noSound < 0) || (noSound >= this.mTabSounds.length) )
		{
			var min = this.mTabSounds.length - 1;
			M3D_DisplayError("CM3D_Audio.VerifSoundNo(" + noSound + ") no must be between O and " + min);
			return false;
		}
		return true;
	}
	
	//______________________________________________________________________________________________
	CM3D_Audio.prototype.GetSound = function(noSound) 
	{
		//M3D_DisplayLog("CM3D_Audio.GetSound(" + noSound + ")");
		if (! this.VerifSoundNo(noSound))
			return 0;
		return this.mTabSounds[noSound];
	};
	
	//______________________________________________________________________________________________
	CM3D_Audio.prototype.Play = function(noSound, bLoop) 
	{
		//M3D_DisplayLog("CM3D_Audio.Play(" + noSound + ")");
		sound = this.GetSound(noSound);
		if (sound == 0)
			return;
		if (bLoop === undefined )
			bLoop = false;
		sound.setLoop(bLoop);
		sound.play();
	};
	
	//______________________________________________________________________________________________
	CM3D_Audio.prototype.Stop = function(noSound) 
	{
		//M3D_DisplayLog("CM3D_Audio.Stop(" + noSound + ")");
		sound = this.GetSound(noSound);
		if (sound == 0)
			return;
		sound.stop();
	};
	
	//______________________________________________________________________________________________
	CM3D_Audio.prototype.SetVolume = function(noSound, volume) 
	{
		//M3D_DisplayLog("CM3D_Audio.SetVolume(" + noSound + ", " + volume + ")");
		sound = this.GetSound(noSound);
		if (sound == 0)
			return;
		if (! this.mMuted)
			sound.setVolume(volume);
		this.mTabSoundsVolume[noSound] = volume;
	};
	
	//______________________________________________________________________________________________
	CM3D_Audio.prototype.SetLoop = function(noSound, bLoop) 
	{
		//M3D_DisplayLog("CM3D_Audio.SetLoop(" + noSound + ", " + bLoop + ")");
		sound = this.GetSound(noSound);
		if (sound == 0)
			return;
		sound.setLoop(bLoop);
	};
	
	//______________________________________________________________________________________________
	CM3D_Audio.prototype.ApplyMute = function() 
	{
		M3D_DisplayLog("CM3D_Audio.ApplyMute : " + this.mMuted);
		for (i = 0; i < this.mTabSounds.length; i++) 
		{ 
			if (this.mMuted)
				this.GetSound(i).setVolume(0);
			else
				this.GetSound(i).setVolume(this.mTabSoundsVolume[i]);
		}
	};
	
	
	
	
//______________________________________________________________________________________________
function M3D_AudioAddSound(file, bPlay)
{
	M3D_DisplayLog("M3D_AudioAddSound(" + file + ", " + bPlay + ")");
	return m3d_mAudio.AddSound(file, bPlay);
}

//______________________________________________________________________________________________
function M3D_AudioVerifSoundNo(noSound)
{
	return m3d_mAudio.VerifSoundNo(noSound);
}
	
//______________________________________________________________________________________________
function M3D_AudioPlay(noSound, bLoop)
{
	M3D_DisplayLog("M3D_AudioPlay(" + noSound + ", " + bLoop + ")");
	if (bLoop === undefined )
		bLoop = false;
	M3D_DisplayLog("---> M3D_AudioPlay(" + noSound + ", " + bLoop + ")");
	m3d_mAudio.Play(noSound, bLoop);
}

//______________________________________________________________________________________________
function M3D_AudioStop(noSound)
{
	M3D_DisplayLog("M3D_AudioStop(" + noSound + ")");
	m3d_mAudio.Stop(noSound);
}

//______________________________________________________________________________________________
function M3D_AudioSetVolume(noSound, volume)
{
	M3D_DisplayLog("M3D_AudioSetVolume(" + noSound + ", " + volume + ")");
	m3d_mAudio.SetVolume(noSound, volume);
}

//______________________________________________________________________________________________
function M3D_AudioSetLoop(noSound, bLoop)
{
	M3D_DisplayLog("M3D_AudioSetLoop(" + noSound + ", " + bLoop + ")");
	m3d_mAudio.SetLoop(noSound, bLoop);
}

//______________________________________________________________________________________________
function M3D_AudioMute(bMute)
{
	M3D_DisplayLog("M3D_AudioMute(" + bMute + ")");
	if (bMute == this.mMuted)
	{
		M3D_DisplayError("no change");
		return;
	}
	m3d_mAudio.mMuted = bMute;
	m3d_mAudio.ApplyMute();
}

	
	
	
	
	
//**************************************************************
//*  MockupAnimation.js      by   X.Dorel  		               *
//*															   *
var MA_mVersion = "180925" 
//*
//   181003 MA_AddAnimMove with endVar
//   180925 MA_Add... retourne l'ojet animation
//   180914 controller touch and button animation
//   180912 MA_AddAnimRotationStep 
//   180910 MA_SetVariable for simulation
//   180907 MA_AddAnimMoveStep
//   180824 evolution variable mockup, anim text et textvalue
//   180808 Animation Controller & sound
//   180522 version 
//
//*  Javascript code used for mockup animation                 * 
//*             		                                       * 
//**************************************************************


//______________________________________________________________________________________________
function MA_DisplayLog(msg)
{
	console.log("MA******* " + msg);
	if ('SM_DisplayLog' in window.external)   // undefined si lancement en direct
		window.external.SM_DisplayLog(msg);
}

SM_mMuteRun = false;
//______________________________________________________________________________________________
function MA_DisplayRun(msg)
{
	if (SM_mMuteRun)
		return;
	msg = "----- RUN ---- " + msg;
	MA_DisplayLog(msg);
}

//______________________________________________________________________________________________
function MA_DisplayDebug(msg)
{
	msg = "----- DEBUG ---- " + msg;
	MA_DisplayLog(msg);
}



//#################################################################################################
// UTILITAIRES
	
	//______________________________________________________________________________________________
	function MA_GetApiVersion()
	{
		SM_DisplayLog("MA_ApiVersion() --> " + MA_mVersion);
		if ('MA_ApiVersion' in window.external)   // undefined si lancement en direct
		{
			window.external.MA_ApiVersion(MA_mVersion);
		}
	}


	
	
//#################################################################################################
// VARIABLES

	MA_mTabVariables = []; 

	//______________________________________________________________________________________________
	function MA_AddVariable(name, fullName)
	{
		MA_DisplayLog("MA_AddVariable (" + name + ", " + fullName + ")");
		
		newVar = new CMA_Variable(name, fullName);
		MA_mTabVariables.push(newVar);
		return newVar;
	}

	//______________________________________________________________________________________________
	function MA_VerifVarNo(no)
	{
		//M3D_DisplayLog("M3D_VerifMeshNo(" + no + ")");
		if ( (no < 0) || (no >= MA_mTabVariables.length) )
		{
			var min = MA_mTabVariables.length - 1;
			M3D_DisplayError("MA_VerifVarNo(" + no + ") no must be between O and " + min);
			return false;
		}
		return true;
	}
	
	//______________________________________________________________________________________________
	function MA_SetVariable(no, value)
	{
		MA_DisplayLog("MA_SetVariable (" + no + ", " + value + ")");
		if (! MA_VerifVarNo(no))
			return;
		
		MA_mTabVariables[no].SetValue(value);
	}


	//______________________________________________________________________________________________
	function CMA_Variable(name, fullName) 
	{
		this.mName = name;
		this.mFullName = fullName;
		this.mCurValue = -1;
		this.mTabAnimations = [];
		this.mbIn = false;
		this.mModelVar = null;
	}

	//______________________________________________________________________________________________
	CMA_Variable.prototype.IsSignal = function() 
	{
//		MA_DisplayRun("CMA_Variable.IsSignal " + this.mName + " --> " + (this.mName.charAt(0) == 's'));
		return (this.mName.charAt(0) == 's');
	};

	//______________________________________________________________________________________________
	CMA_Variable.prototype.AddAnimation = function(anim) 
	{
		MA_DisplayRun("CMA_Variable.AddAnimation");
		this.mTabAnimations.push(anim);
	};

	//______________________________________________________________________________________________
	CMA_Variable.prototype.SetModelVar = function(modelVar) 
	{
		MA_DisplayRun("CMA_Variable.SetModelVar");
		this.mModelVar = modelVar;
	};

	//______________________________________________________________________________________________
	CMA_Variable.prototype.GetValue = function() 
	{
		MA_DisplayRun("CMA_Variable.GetValue " + this.mName + " --> " + this.mCurValue);
		return this.mCurValue;
	};
	
	//______________________________________________________________________________________________
	// set value réalisé par le model -> on evalue les animations associées
	CMA_Variable.prototype.SetValue = function(value) 
	{
		MA_DisplayRun("CMA_Variable.SetValue: " + this.mFullName + " = " + value);

		if (this.mCurValue == value)  // le model n'envoie jamais des signaux...
		{
			MA_DisplayLog("--> same value");
			return false;
		}
		this.mCurValue = value;

	    // on évalue les animations
		for (noanim = 0; noanim < this.mTabAnimations.length; noanim++)
			this.mTabAnimations[noanim].Eval(value);
	};
	
	//______________________________________________________________________________________________
	// set value issu d'un clic user -> on envoi la valeur au model
	CMA_Variable.prototype.SetValueFromUser = function(value) 
	{
		MA_DisplayRun("CMA_Variable.SetValueFromUser: " + this.mFullName + " = " + value);

		if ( ! this.IsSignal() && (this.mCurValue == value) )
		{
			MA_DisplayLog("--> same value");
			return false;
		}
		this.mCurValue = value;

		// on envoi la valeur au model
		if (this.mModelVar == null)
			M3D_DisplayError("No model var associated");
		else
			this.mModelVar.SetValue(value);
	};
	
	
	

//#################################################################################################
// ADD ANIMATION

	//______________________________________________________________________________________________
	function MA_AddAnimMove(noMesh, maVar, value, x, y, z, maVar2, value2)
	{
		MA_DisplayLog("MA_AddAnimMove (" + noMesh + ", " + maVar.mName + ", " + value + ", ...)");
		if (! M3D_VerifMeshNo(noMesh))
			return false;
		
		anim = new CMA_AnimMoveStep(value, noMesh, x, y, z, 0, maVar2, value2);
		maVar.AddAnimation(anim);
		return anim;
	}

	//______________________________________________________________________________________________
	function MA_AddAnimMoveStep(noMesh, maVar, value, x, y, z, step, maVar2, value2)
	{
		MA_DisplayLog("MA_AddAnimMoveStep (" + noMesh + ", " + maVar.mName + ", " + value + ", ...)");
		if (! M3D_VerifMeshNo(noMesh))
			return false;
		
		anim = new CMA_AnimMoveStep(value, noMesh, x, y, z, step, maVar2, value2);
		maVar.AddAnimation(anim);
		return anim;
	}

	
	//______________________________________________________________________________________________
	function MA_AddAnimRotation(noMesh, maVar, value, x, y, z)
	{
		MA_DisplayLog("MA_AddAnimRotation (" + noMesh + ", " + maVar.mName + ", " + value + ", ...)");
		if (! M3D_VerifMeshNo(noMesh))
			return false;
		
		anim = new CMA_AnimRotationStep(value, noMesh, x, y, z, 0, 0,0,0);
		maVar.AddAnimation(anim);
		return anim;
	}

	//______________________________________________________________________________________________
	function MA_AddAnimRotationStep(noMesh, maVar, value, x, y, z, step, maVar2, value2)
	{
		MA_DisplayLog("MA_AddAnimRotationStep (" + noMesh + ", " + maVar.mName + ", " + value + ", ...)");
		if (! M3D_VerifMeshNo(noMesh))
			return false;
		
		anim = new CMA_AnimRotationStep(value, noMesh, x, y, z, step, maVar2, value2);
		maVar.AddAnimation(anim);
		return anim;
	}

	
	//______________________________________________________________________________________________
	function MA_AddAnimColor(noMesh, maVar, value, color)
	{
		MA_DisplayLog("MA_AddAnimColor (" + noMesh + ", " + maVar.mName + ", " + value + ", ...)");
		if (! M3D_VerifMeshNo(noMesh))
			return false;
		
		anim = new CMA_AnimColor(value, noMesh, color);
		maVar.AddAnimation(anim);
		return anim;
	}
	
	//______________________________________________________________________________________________
	function MA_AddAnimShow(noMesh, maVar, value, bShow)
	{
		MA_DisplayLog("MA_AddAnimShow (" + noMesh + ", " + maVar.mName + ", " + value + ", ...)");
		if (! M3D_VerifMeshNo(noMesh))
			return false;
		
		anim = new CMA_AnimShow(value, noMesh, bShow);
		maVar.AddAnimation(anim);
		return anim;
	}
		
	//______________________________________________________________________________________________
	function MA_AddAnimText(noMesh, maVar, value, txt)
	{
		MA_DisplayLog("MA_AddAnimText (" + noMesh + ", " + maVar.mName + ", " + value + ", ...)");
		if (! M3D_VerifMeshNo(noMesh))
			return false;
		
		anim = new CMA_AnimText(value, noMesh, txt);
		maVar.AddAnimation(anim);
		return anim;
	}
		
	//______________________________________________________________________________________________
	function MA_AddAnimTextValue(noMesh, maVar, before, intPart, decPart, after)
	{
		MA_DisplayLog("MA_AddAnimTextValue (" + noMesh + ", " + maVar.mName + ", ...)");
		if (! M3D_VerifMeshNo(noMesh))
			return false;
		
		anim = new CMA_AnimTextValue(noMesh, before, intPart, decPart, after);
		maVar.AddAnimation(anim);
		return anim;
	}
	
	//______________________________________________________________________________________________
	function MA_AddAnimDisplayValue(noMesh, maVar, nbDigit)
	{
		MA_DisplayLog("MA_AddAnimDisplayValue (" + noMesh + ", " + maVar.mName + ", " + nbDigit + ")");
		if (! M3D_VerifMeshNo(noMesh))
			return false;
		
		anim = new CMA_AnimDisplayValue(noMesh, nbDigit);
		maVar.AddAnimation(anim);
		return anim;
	}
	
	//______________________________________________________________________________________________
	function MA_AddAnimSoundPlay(noSound, maVar, value, volume, bLoop)
	{
		MA_DisplayLog("MA_AddAnimSoundPlay (" + noSound + ", " + maVar.mName + ", " + value + ", " + volume + ", " + bLoop + ")");
		if (! M3D_AudioVerifSoundNo(noSound))
			return false;
		
		anim = new CMA_AnimSound(value, noSound, true, volume, bLoop);
		maVar.AddAnimation(anim);
		return anim;
	}
	
	//______________________________________________________________________________________________
	function MA_AddAnimSoundStop(noSound, maVar, value)
	{
		MA_DisplayLog("MA_AddAnimSoundStop (" + noSound + ", " + maVar.mName + ", " + value + ")");
		if (! M3D_AudioVerifSoundNo(noSound))
			return false;
		
		anim = new CMA_AnimSound(value, noSound, false, 0, false);
		maVar.AddAnimation(anim);
		return anim;
	}
	
	//______________________________________________________________________________________________
	function MA_AddAnimMouseEvent(noMesh, evtType, maVar, value)
	{
		MA_DisplayLog("MA_AddAnimMouseEvent (" + noMesh + ", '" + evtType + "', " + maVar.mName + ", " + value + ")");
		if (! M3D_VerifMeshNo(noMesh))
			return false;
		
		evt = new CMA_MouseEvent(evtType, maVar, value);
		m3d_mTabMeshs[noMesh].AddMouseEvent(evt);
		return evt;
	}


	//______________________________________________________________________________________________
	function MA_AddAnimControllerTouchEvent(noMesh, events, dist, maVar, value)
	{
		MA_DisplayLog("MA_AddAnimControllerTouchEvent (" + noMesh + ", '" + events + "', " + dist + ", " + maVar.mName + ", " + value + ")");
		if (! M3D_VerifMeshNo(noMesh))
			return false;
		
		evt = new CMA_ControllerTouchEvent(noMesh, events, dist, maVar, value);
		m3d_mTabControlerTouchEvents.push(evt);
		return evt;
	}
	
	//______________________________________________________________________________________________
	function MA_AddAnimControllerButtonEvent(events, maVar, value)
	{
		MA_DisplayLog("MA_AddAnimControllerButtonEvent ('" + events + "', " + maVar.mName + ", " + value + ")");
		if (! M3D_VerifMeshNo(noMesh))
			return false;
		
		evt = new CMA_ControllerButtonsEvent(events, maVar, value);
		m3d_ControllerButtonsEventsConf.AddEvent(evt);
		return evt;
	}
	

	
	
//#################################################################################################
// ANIM MOVE STEP

	//______________________________________________________________________________________________
	function CMA_AnimMoveStep(value, noMesh, x, y, z, step, var2, value2) 
	{
		this.mValue = value;
		this.mNoMesh = noMesh;
		this.mX = x;
		this.mY = y;
		this.mZ = z;
		this.mStep = Math.abs(step);
		this.mStepAnimX = 0;
		this.mStepAnimY = 0;
		this.mStepAnimZ = 0;
		this.mVar2 = var2;
		this.mValueTo = value2;
	}

	//______________________________________________________________________________________________
	CMA_AnimMoveStep.prototype.Eval = function(value) 
	{
		MA_DisplayRun("CMA_AnimMoveStep.Eval: " + value);
		if (this.mValue != value)
			return false;
				
		if (this.mStep == 0)  // simple déplacement
			return M3D_SetPosition(this.mNoMesh, this.mX, this.mY, this.mZ);
		
		
		// déplacement avec animation
		
		position = M3D_GetPosition(this.mNoMesh);
				
		if (position.x == m3d_mXWhenHided)   // le composant est caché...
		{	
			MA_DisplayRun("------> Move elt (" + this.mNoMesh + ") hided");
			M3D_SetPosition(this.mNoMesh, m3d_mXWhenHided, this.mY, this.mZ);
			m3d_mTabMeshs[this.mNoMesh].mX = this.mX;
			if (this.mVar2 != null)
				this.mVar2.SetValueFromUser(this.mValueTo);
			return;
		}

		dx = this.mX - position.x;
		dy = this.mY - position.y;
		dz = this.mZ - position.z;
		adx = Math.abs(dx);
		ady = Math.abs(dy);
		adz = Math.abs(dz);
		
		//MA_DisplayRun("------> dx: " + dx + " dy: " + dy + " dz: " + dz);
		
		// calcul de la plus longue distance
		if (adx > ady)
		{
			if (adx > adz)
				dist = adx;
			else 
				dist = adz;
		}
		else
		{
			if (ady > adz)
				dist = ady;
			else 
				dist = adz;
		}
		
		// pas de distance à parcourir
		if (dist == 0)
			return;
		
		ratio = this.mStep/dist;

		this.mStepAnimX = ratio * dx;
		this.mStepAnimY = ratio * dy;
		this.mStepAnimZ = ratio * dz;
		
		//MA_DisplayRun("------> dist: " + dist + " ratio: " + ratio + " this.mStepAnimX: " + this.mStepAnimX);
		
		noConf = M3D_SetPositionMove(this.mNoMesh, this.mStepAnimX, this.mStepAnimY, this.mStepAnimZ);
		m3d_mTabAnimMeshsPosition[noConf].mAnimation = this;
	};
	
	//______________________________________________________________________________________________
	CMA_AnimMoveStep.prototype.OnApplyAnimation = function() 
	{
		MA_DisplayRun("CMA_AnimMoveStep.OnApplyAnimation");
		
		bStopAnimation = false;
		position = M3D_GetPosition(this.mNoMesh);

		bStopAnimation = (position.x == m3d_mXWhenHided);
		
		// As t on atteint la position souhaitée ?
		
		if (!bStopAnimation && (this.mStepAnimX != 0))
		{
			if (this.mStepAnimX > 0)  
				bStopAnimation = (position.x >= this.mX);
			else
				bStopAnimation = (position.x <= this.mX);
		}

		if (!bStopAnimation && (this.mStepAnimY != 0) )
		{
			if (this.mStepAnimY > 0)  
				bStopAnimation = (position.y >= this.mY);
			else
				bStopAnimation = (position.y <= this.mY);
		}
			
		if (!bStopAnimation && (this.mStepAnimZ != 0) )
		{
			if (this.mStepAnimZ > 0)  
				bStopAnimation = (position.z >= this.mZ);
			else
				bStopAnimation = (position.z <= this.mZ);
		}

		if (bStopAnimation)
		{
			M3D_SetPositionMove(this.mNoMesh, 0, 0, 0);
			M3D_SetPosition(this.mNoMesh, this.mX, this.mY, this.mZ);
			if (this.mVar2 != null)
				this.mVar2.SetValueFromUser(this.mValueTo);
		}
	};
	
	

//#################################################################################################
// ANIM ROTATION STEP

	//______________________________________________________________________________________________
	function CMA_AnimRotationStep(value, noMesh, x, y, z, step, var2, value2) 
	{
		this.mValue = value;
		this.mNoMesh = noMesh;
		this.mX = x;
		this.mY = y;
		this.mZ = z;
		this.mStep = Math.abs(step);
		this.mStepAnimX = 0;
		this.mStepAnimY = 0;
		this.mStepAnimZ = 0;
		this.mVar2 = var2;
		this.mValueTo = value2;
	}

	//______________________________________________________________________________________________
	CMA_AnimRotationStep.prototype.Eval = function(value) 
	{
		MA_DisplayRun("CMA_AnimRotationStep.Eval: " + value);
		if (this.mValue != value)
			return false;
		
		if (this.mStep == 0)  // simple rotation
			return M3D_SetRotation(this.mNoMesh, this.mX, this.mY, this.mZ);
			
		// déplacement avec animation

		rotation = M3D_GetRotation(this.mNoMesh);

		dx = this.mX - rotation.x;
		dy = this.mY - rotation.y;
		dz = this.mZ - rotation.z;
		adx = Math.abs(dx);
		ady = Math.abs(dy);
		adz = Math.abs(dz);
		
		//MA_DisplayRun("------> dx: " + dx + " dy: " + dy + " dz: " + dz);
		
		// calcul de la plus longue rotation
		if (adx > ady)
		{
			if (adx > adz)
				rot = adx;
			else 
				rot = adz;
		}
		else
		{
			if (ady > adz)
				rot = ady;
			else 
				rot = adz;
		}
		
		// pas de distance à parcourir
		if (rot == 0)
			return;
		
		ratio = this.mStep/rot;

		this.mStepAnimX = ratio * dx;
		this.mStepAnimY = ratio * dy;
		this.mStepAnimZ = ratio * dz;
		
		//MA_DisplayRun("------> rot: " + rot + " ratio: " + ratio + " this.mStepAnimX: " + this.mStepAnimX);
		
		noConf = M3D_SetRotationMove(this.mNoMesh, this.mStepAnimX, this.mStepAnimY, this.mStepAnimZ);
		m3d_mTabAnimMeshsRotation[noConf].mAnimation = this;
	};
	
	//______________________________________________________________________________________________
	CMA_AnimRotationStep.prototype.OnApplyAnimation = function() 
	{
		MA_DisplayRun("CMA_AnimRotationStep.OnApplyAnimation");
		
		bStopAnimation = false;
		rotation = M3D_GetRotation(this.mNoMesh);

		// As t on atteint la rotation souhaitée ?
		
		MA_DisplayRun("------> rotation.x " + rotation.x);
		if (this.mStepAnimX != 0)
		{
			if (this.mStepAnimX > 0)  
				bStopAnimation = (rotation.x >= this.mX);
			else
				bStopAnimation = (rotation.x <= this.mX);
		}

		if (!bStopAnimation && (this.mStepAnimY != 0) )
		{
			if (this.mStepAnimY > 0)  
				bStopAnimation = (rotation.y >= this.mY);
			else
				bStopAnimation = (rotation.y <= this.mY);
		}
			
		if (!bStopAnimation && (this.mStepAnimZ != 0) )
		{
			if (this.mStepAnimZ > 0)  
				bStopAnimation = (rotation.z >= this.mZ);
			else
				bStopAnimation = (rotation.z <= this.mZ);
		}

		if (bStopAnimation)
		{
			MA_DisplayRun("------> stop animation");
			M3D_SetRotationMove(this.mNoMesh, 0, 0, 0);
			M3D_SetRotation(this.mNoMesh, this.mX, this.mY, this.mZ);
			if (this.mVar2 != null)
				this.mVar2.SetValueFromUser(this.mValueTo);
		}
	};
	
	

//#################################################################################################
// ANIM COLOR

	//______________________________________________________________________________________________
	function CMA_AnimColor(value, noMesh, color) 
	{
		this.mValue = value;
		this.mNoMesh = noMesh;
		this.mColor = color;
	}

	//______________________________________________________________________________________________
	CMA_AnimColor.prototype.Eval = function(value) 
	{
		MA_DisplayRun("CMA_AnimColor.Eval: " + value);
		if (this.mValue != value)
			return false;
		return M3D_SetColor(this.mNoMesh, this.mColor);
	};

	
	
//#################################################################################################
// ANIM SHOW

	//______________________________________________________________________________________________
	function CMA_AnimShow(value, noMesh, bShow) 
	{
		this.mValue = value;
		this.mNoMesh = noMesh;
		this.mbShow = bShow;
	}

	//______________________________________________________________________________________________
	CMA_AnimShow.prototype.Eval = function(value) 
	{
		MA_DisplayRun("CMA_AnimShow.Eval: " + value);
		if (this.mValue != value)
			return false;
		return M3D_SetVisible(this.mNoMesh, this.mbShow);
	};

	
	
//#################################################################################################
// ANIM TEXT

	//______________________________________________________________________________________________
	function CMA_AnimText(value, noMesh, txt) 
	{
		this.mValue = value;
		this.mNoMesh = noMesh;
		this.mText = txt;
	}

	//______________________________________________________________________________________________
	CMA_AnimText.prototype.Eval = function(value) 
	{
		MA_DisplayRun("CMA_AnimText.Eval: " + value);
		if (this.mValue != value)
			return false;
		return M3D_SetText(this.mNoMesh, this.mText);
	};

	
	
//#################################################################################################
// ANIM TEXT VALUE

	//______________________________________________________________________________________________
	function CMA_AnimTextValue(noMesh, before, intPart, decPart, after) 
	{
		this.mNoMesh = noMesh;
		this.mBefore = before;
		this.mInteger = intPart;
		this.mDecimal = decPart;
		if ((this.mDecimal == -1) || (this.mDecimal > 8) )  // au maximum precision de 8 digits
			this.mDecimal = 8;
		this.mAfter = after;
	}

	//______________________________________________________________________________________________
	CMA_AnimTextValue.prototype.Eval = function(value) 
	{
		MA_DisplayRun("CMA_AnimTextValue.Eval: " + value);
		
		str = this.mBefore; 
		
		if (this.mDecimal == 0)   // que la partie entiere
		{
			str += this.JustifInteger(value, this.mInteger);
		}
		else   // il faut formater les decimales 
		{
			sign = "";
			if (value < 0)
			{
				sign = "-";
				value = -value;
			}
		
			integer = Math.ceil(value) - 1;
			decimal = value - integer;
			
			mult = Math.pow(10, this.mDecimal);
			decimal = decimal * mult;
			intdec = Math.ceil(decimal);
 			
			// chaine complete
			str += sign + this.JustifInteger(value, this.mInteger) + "." + this.JustifInteger(intdec, this.mDecimal);
		}
		
		str += this.mAfter;
		
		return M3D_SetText(this.mNoMesh, str);
	};

	//______________________________________________________________________________________________
	CMA_AnimTextValue.prototype.JustifInteger = function(value, nbdigits) 
	{
		//MA_DisplayRun("CMA_AnimTextValue.JustifInteger: " + value + ", " + nbdigits);
		
		integer = Math.round(value);
		
		if (nbdigits <= 1)
			return integer;
		
		multj = Math.pow(10, nbdigits-1);
		
		strj = "";
		while((multj >= integer) && (multj > 1))
		{
			strj += "0";
			multj = multj / 10;
		}
		
		return strj + integer;
	};

	
	
//#################################################################################################
// ANIM DISPLAY VALUE

	//______________________________________________________________________________________________
	function CMA_AnimDisplayValue(noMesh, nbDigit) 
	{
		this.mNoMesh = noMesh;
		this.mNbDigit = nbDigit;
	}

	//______________________________________________________________________________________________
	CMA_AnimDisplayValue.prototype.Eval = function(value) 
	{
		MA_DisplayRun("CMA_AnimDisplayValue.Eval: " + value);
		return M3D_SetDisplayValue(this.mNoMesh, value, this.mNbDigit);
	};

	

//#################################################################################################
// ANIM SOUND

	//______________________________________________________________________________________________
	function CMA_AnimSound(value, noSound, bPlay, volume, bLoop) 
	{
		this.mValue = value;
		this.mNoSound = noSound;
		this.mbPLay = bPlay;
		this.mVolume = volume;
		this.mbLoop = bLoop;
	}

	//______________________________________________________________________________________________
	CMA_AnimSound.prototype.Eval = function(value) 
	{
		MA_DisplayRun("CMA_AnimSound.Eval: " + value);
		if (this.mValue != value)
			return false;
		
		if (this.mbPLay)
		{
			M3D_AudioSetVolume(this.mNoSound, this.mVolume);
			M3D_AudioPlay(this.mNoSound, this.mbLoop);
		}
		else
			M3D_AudioStop(this.mNoSound);
		
		return true;
	};

	

//#################################################################################################
// MOUSE EVENT

	//______________________________________________________________________________________________
	function CMA_MouseEvent(evtType, variable, value) 
	{
		this.mEvtType = evtType;
		this.mVar = variable;
		this.mValue = value;
	}

	//______________________________________________________________________________________________
	CMA_MouseEvent.prototype.Eval = function(evtType) 
	{
		MA_DisplayRun("CMA_MouseEvent.Eval: " + evtType);
		if (this.mEvtType != evtType)
			return false;
		return this.mVar.SetValueFromUser(this.mValue);
	};

	
	
//#################################################################################################
// CONTROLLER TOUCH EVENT

	//______________________________________________________________________________________________
	function CMA_ControllerTouchEvent(noMesh, events, dist, maVar, value) 
	{
		this.mController = 1;
		this.mNoMesh = noMesh;
		this.mVar = maVar;
		this.mValue = value;
		this.mDist = dist;
		this.mbTouching = false;   // est ce qu'on touche ou pas l'objet
		
		this.mbTouchEvent = events.includes("OnTouch");  // event Touch ou UnTouch
		
		this.mCombinaison = "";
		if (events.includes("OnTriggerPress"))
			this.mCombinaison += "OnTriggerPress";
		if (events.includes("OnThumpadTouch"))
			this.mCombinaison += "OnThumpadTouch";
		if (events.includes("OnThumpadPress"))
			this.mCombinaison += "OnThumpadPress";
		if (events.includes("OnMenuPress"))
			this.mCombinaison += "OnMenuPress";
		if (events.includes("OnGripPress"))
			this.mCombinaison += "OnGripPress";
	}

	//______________________________________________________________________________________________
	CMA_ControllerTouchEvent.prototype.Eval = function(evtType) 
	{
		MA_DisplayRun("CMA_ControllerTouchEvent.Eval: " + evtType);
		
		bNear = M3DVR_IsControllerNearObject(this.mController, this.mNoMesh, this.mDist);
		
		controller = M3DVR_mController_1;
		if (this.mController == 2)
			controller = M3DVR_mController_2;
		
		if (bNear)		// on touche l'objet
		{   
			if (this.mbTouching)   // si on était entrain de le toucher
				return false;
			if (! this.mbTouchEvent)     // si il ne faut pas le toucher
			{
				this.mbTouching = true;	     // on est entrain de le toucher
				return false;
			}
			if (this.mCombinaison != "")   // il faut une combinaison de boutons
				if (! M3DVR_IsControllerButtonsCombinaison(this.mController, this.mCombinaison))
					return false;
				
			// on commence à le toucher avec les bons boutons : on génére l'événement
			this.mbTouching = true;
			return this.mVar.SetValueFromUser(this.mValue);
		}
		
		// on ne touche pas l'objet
		
		if (this.mbTouching)        // si on était entrain de le toucher
		{
			this.mbTouching = false;     // on ne le touche plus
			
			if (this.mbTouchEvent)       // si il fallait le toucher
				return false; 
			if (this.mCombinaison != "")   // il faut une combinaison de boutons
				if (! M3DVR_IsControllerButtonsCombinaison(this.mController, this.mCombinaison))
					return false;			 // si on n'a pas les boutons demandés

			// on arrete de le toucher avec les bons boutons : on génére l'événement
			return this.mVar.SetValueFromUser(this.mValue);
		}
		return false;
	};
	
	
	
//#################################################################################################
// CONTROLLER BUTTON EVENT

//______________________________________________________________________________________________
function CMA_ControllerButtonsEventsConf() 
{
	this.mTabEvents = [];
}

CMA_ControllerButtonsEventsConf.prototype.AddEvent = function(evt) 
{
	this.mTabEvents.push(evt);
};

CMA_ControllerButtonsEventsConf.prototype.EvalEvent = function(evtType) 
{
	M3D_DisplayLog(" ------ CMA_ControllerButtonsEventsConf -- EvalEvent(" + evtType  + ")");
	for (noevt = 0; noevt < this.mTabEvents.length; noevt++)
		this.mTabEvents[noevt].Eval(evtType);
};

//______________________________________________________________________________________________
function CMA_ControllerButtonsEvent(events, maVar, value) 
{
	this.mControler = 1;
	this.mDistance = 1;
	this.mVar = maVar;
	this.mValue = value;
	this.mSimpleEvent = "";
	this.mCombinaison = "";
	if (! events.includes(" ")) // c'est un event simple
		this.mSimpleEvent = events;
	else                        // c'est une combinaison de boutons
	{                           
		if (events.includes("OnTriggerPress"))
			this.mCombinaison += "OnTriggerPress";
		if (events.includes("OnThumpadTouch"))
			this.mCombinaison += "OnThumpadTouch";
		if (events.includes("OnThumpadPress"))
			this.mCombinaison += "OnThumpadPress";
		if (events.includes("OnMenuPress"))
			this.mCombinaison += "OnMenuPress";
		if (events.includes("OnGripPress"))
			this.mCombinaison += "OnGripPress";
	}
}

CMA_ControllerButtonsEvent.prototype.Eval = function(evtType) 
{
	M3D_DisplayLog(" ------ CMA_ControllerButtonsEvent -- EvalEvent(" + evtType  + ")");
	if (this.mSimpleEvent != "")   // c'est un event simple
	{
		if (this.mSimpleEvent != evtType)
			return false;
		// sinon on génére
	}
	else              			   // c'est une combinaison
	{
		if (! M3DVR_IsControllerButtonsCombinaison(this.mController, this.mCombinaison))
			return false;
		// sinon on génére
	}

	return this.mVar.SetValueFromUser(this.mValue);
};

	
	
	
		
