//**************************************************************
//*  3DMAR.js         by   X.Dorel         		               *
//*															   *
var M3DAR_mVersion = "181016" 
//*             		                                       * 
//*  Javascript code used in the 3D Mockup Studio for AR       *
//
//  181016 : Creation
//*             		                                       * 
//**************************************************************


M3DAR_mRatio = 30;   // ratio of resize

//THREE.VRController.verbosity = 1;
var M3DVR_mController_1 = 0;
var M3DVR_mController_2 = 0;

var m3dvr_mGuiSettings = 0;
var m3dvr_mbGuiDisplayed = false;

var	m3dvr_mControllerColorOff = color_PapayaWhip;
var	m3dvr_mControllerColorTrigger  = color_Red;
var	m3dvr_mControllerColorThumpad  = color_Yellow;
var	m3dvr_mControllerColorThumpadPress  = color_White;
var	m3dvr_mControllerColorMenu  = color_Blue;
var	m3dvr_mControllerColorGrip  = color_Black;


//______________________________________________________________________________________________
function M3DAR_DisplayLog(msg)
{
	M3D_DisplayLog(msg);
}

//______________________________________________________________________________________________
function M3DAR_GetApiVersion()
{
	M3DAR_DisplayLog("M3DAR_GetApiVersion() --> " + M3DAR_mVersion);
	if ('M3DAR_ApiVersion' in window.external)   // undefined si lancement en direct
	{
		window.external.M3DAR_ApiVersion(M3DAR_mVersion);
	}
}


//## INITIALISATION SCENE ##############################################################################################

//______________________________________________________________________________________________
function M3DAR_InitThreeJsForAR(bDirectLight, bShadows, ratio)
{
	M3DVR_DisplayLog("M3DAR_InitThreeJsForAR(" + bDirectLight + ", " + bShadows + ") V " + M3DVR_mVersion + "  3DM V " + M3D_mVersion + " ********");
	
	M3D_OnAR = true;
	M3DVR_mRatio = ratio;
	M3D_UseOrbitControls = false;
	M3D_UseViewControler = false;

	M3D_InitThreeJsFor3DM(bDirectLight, bShadows, false);
}


//______________________________________________________________________________________________
var m3dar_Animate = function ()     // internal function launched by M3D_Animate if on Vive
{
	M3D_mElapsedTime = M3D_mClock.getElapsedTime();  
	M3D_mDeltaTime = M3D_mElapsedTime - M3D_mPrevElapsedTime;
	
	for (var i = 0; i < m3d_mTabAnimMeshsPosition.length; i++)
		m3d_mTabAnimMeshsPosition[i].ApplyAnimation();
	
	for (var i = 0; i < m3d_mTabAnimMeshsRotation.length; i++)
		m3d_mTabAnimMeshsRotation[i].ApplyAnimation();
	
	for (var i = 0; i < m3d_mTabControlerTouchEvents.length; i++)
		m3d_mTabControlerTouchEvents[i].Eval();
	
	m3d_RunTimers();
	m3d_RunModel();
	
	THREE.VRController.update();

	if (typeof OnAnimationLoop !== 'undefined') 
		OnAnimationLoop();
	
	M3D_mRenderer.render(M3D_mScene, M3D_mCamera);
	
	M3D_mPrevElapsedTime = M3D_mElapsedTime;
};

	


//## Class CONTROLLER ##############################################################################################

	//______________________________________________________________________________________________
	function m3dar_CController(no, controller) 
	{
		this.mNo = no;								// no du controller
		this.mName = "Controller " + no;			// nom du controller
		this.mController = controller;				// VR controller associé
		this.mCtrlMesh = 0;							// mesh visual principal 
		this.mGuiInputHelper = 0;					// gui helper associé
		this.mbButTriggerPressed = false;
		this.mbButThumpadTouched = false;
		this.mbButThumpadPressed = false;
		this.mbButGripPressed = false;
		this.mbButMenuPressed = false;
		
		this.DisplayLog(" connection : '" + controller.name + "' id:" + controller.uuid);
		M3D_mScene.add( controller )

		// set the matrix
		controller.standingMatrix = M3D_mRenderer.vr.getStandingMatrix();
		// associate with camera
		controller.head = window.camera;
		
		// create a visual 
		var	controllerMaterial = new THREE.MeshStandardMaterial({ color: m3dvr_mControllerColorOff });
		this.mCtrlMesh = new THREE.Mesh(new THREE.SphereGeometry( 0.5/M3DVR_mRatio, 32, 32 ),controllerMaterial);
		var	ctrlMesh2 = new THREE.Mesh(new THREE.BoxGeometry( 0.7/M3DVR_mRatio, 0.7/M3DVR_mRatio, 2/M3DVR_mRatio ),controllerMaterial);
		ctrlMesh2.position.z = 1/M3DVR_mRatio;

	//	controllerMaterial.flatShading = true;
		this.mCtrlMesh.add( ctrlMesh2 );
		controller.userData.mesh = this.mCtrlMesh; //  So we can change the color later.
		controller.add( this.mCtrlMesh );
		
		if ((no == 1) && (typeof(dat) !== 'undefined'))
		{
			// le controller 1 interagit avec les gui
			this.mGuiInputHelper = dat.GUIVR.addInputObject(controller);
			M3D_mScene.add( this.mGuiInputHelper );
		}
	}
	
	//______________________________________________________________________________________________
	m3dvr_CController.prototype.DisplayLog = function(msg) 
	{
		M3DVR_DisplayLog("-----m3dvr_CController " + this.mNo + ": " + msg);
	};
	
	//______________________________________________________________________________________________
	m3dvr_CController.prototype.OnButton = function(butName, bPress, evt) 
	{
		this.DisplayLog("OnButton (" + butName + ", " + bPress + ", " + evt + ")");
		
		// si il y a un gui de settings déclaré
		if ((this.mGuiInputHelper) && (m3dvr_mGuiSettings))
		{
			// la touche menu est réservée à afficher ou pas le gui
			if (butName == "Menu")
			{
				if (bPress)
				{
					m3dvr_mbGuiDisplayed = ! m3dvr_mbGuiDisplayed;
					m3dvr_mGuiSettings.visible = m3dvr_mbGuiDisplayed;
				}
				return;
			}
			// si le gui est affiché
			if (m3dvr_mbGuiDisplayed)
			{
				// si appui sur la touche trigger, on previent le gui
				if (butName == "Trigger")
					this.mGuiInputHelper.pressed(bPress);
				// les autres touches sont ignorées
				return;
			}
		}
		
		// le gui n'est pas affiché ou inexistant : on traite les touches 
		switch (butName)
		{
			case "Trigger" :
				this.mbButTriggerPressed = bPress;
				break;
			case "Grip" :
				this.mbButGripPressed = bPress;
				break;
			case "Thumpad" :
				this.mbButThumpadTouched = bPress;
				break;
			case "ThumpadPress" :
				this.mbButThumpadPressed = bPress;
				break;
			case "Menu" : 
				this.mbButMenuPressed = bPress;
				break;
		}
		
		// envoi aux animations
		m3d_ControllerButtonsEventsConf.EvalEvent(evt);
		
		// envoi à la fonction user
		if (typeof OnViveButton !== 'undefined') 
			OnViveButton(this.mNo, butName, bPress);
	};
	
	//______________________________________________________________________________________________
	m3dvr_CController.prototype.IsButtonPressed = function(butName) 
	{
		//this.DisplayLog("IsButtonPressed (" + butName + ")");
		switch (butName)
		{
			case "Trigger" :
				return this.mbButTriggerPressed;
				break;
			case "Grip" :
				return this.mbButGripPressed;
				break;
			case "Thumpad" :
				return this.mbButThumpadTouched;
				break;
			case "ThumpadPress" :
				return this.mbButThumpadPressed;
				break;
			case "Menu" : 
				return this.mbButMenuPressed;
				break;
		}
		return false;
	};
	
	//______________________________________________________________________________________________
	m3dvr_CController.prototype.IsButtonsCombinaison = function(combinaison) 
	{
		//M3DVR_DisplayLog("-----m3dvr_CController " + this.mNo + " IsButtonsCombinaison(" + combinaison + ")");
		
		if (combinaison.includes("OnTriggerPress"))
			if (! controller.mbButTriggerPressed)
				return false;

		if (combinaison.includes("OnThumpadTouch"))
			if (! controller.mbButThumpadTouched)
				return false;
		
		if (combinaison.includes("OnThumpadPress"))
			if (! controller.mbButThumpadPressed)
				return false;
		
		if (combinaisons.includes("OnMenuPress"))
			if (! controller.mbButMenuPressed)
				return false;
		
		if (combinaison.includes("OnGripPress"))
			if (! controller.mbButGripPressed)
				return false;
			
		return true;
	};


	//______________________________________________________________________________________________
	m3dvr_CController.prototype.OnDisconnected = function(name, bPress) 
	{
		this.DisplayLog("OnDisconnected ()");
	};
	
	
	
	
	
//## GUI SETTINGS ##############################################################################################
//__CLASS AUDIO _______________________________________________________________________________
function CM3DVR_Settings()
{
	this.mScale = 1.0;
	this.mRotation = 0;
	this.mShowAxes = false;
	this.mShowGrid = false;
	this.mMuteSounds = false;
}
	//______________________________________________________________________________________________
	CM3DVR_Settings.prototype.Rotation = function() 
	{
		M3D_DisplayLog("CM3DVR_Settings.Rotation : " + this.mRotation);
		if (m3dvr_mMeschScene == 0)
			return;
		m3dvr_mMeschScene.rotation.y = Math.PI * this.mRotation / 180;
	};

	//______________________________________________________________________________________________
	CM3DVR_Settings.prototype.Scale = function() 
	{
		M3D_DisplayLog("CM3DVR_Settings.Scale : " + this.mScale);
		if (m3dvr_mMeschScene == 0)
			return;
		if (this.mScale >= 0)
			taux = (1 + this.mScale) / M3DVR_mRatio;
		else
			taux = 1 / ((1 - this.mScale) * M3DVR_mRatio);
		m3dvr_mMeschScene.scale.set(taux, taux, taux);
	};

	//______________________________________________________________________________________________
	CM3DVR_Settings.prototype.ShowAxes = function() 
	{
		M3D_DisplayLog("CM3DVR_Settings.ShowAxes : " + this.mShowAxes);
		if (this.mShowAxes)
			M3D_DisplayHelpAxis(5);
		else
			M3D_HideHelpAxis();
	};

	//______________________________________________________________________________________________
	CM3DVR_Settings.prototype.ShowGrid = function() 
	{
		M3D_DisplayLog("CM3DVR_Settings.ShowGrid : " + this.mShowGrid);
		if (this.mShowGrid)
			M3D_DisplayHelpGrid(5, 5);
		else
			M3D_HideHelpGrid();
	};

	//______________________________________________________________________________________________
	CM3DVR_Settings.prototype.MuteSounds = function() 
	{
		M3D_DisplayLog("CM3DVR_Settings.MuteSounds : " + this.mMuteSounds);
		M3D_AudioMute(this.mMuteSounds);
	};

var m3dvr_mSettings = new CM3DVR_Settings();
var m3dvr_mMeschScene = 0;



	//______________________________________________________________________________________________
	function M3DVR_CreateGuiSettings(scene)
	{
		M3DVR_DisplayLog("M3DVR_CreateGuiSettings(...)");
		if (m3dvr_mGuiSettings != 0)
		{
			M3DVR_DisplayLog("   ---> error M3DVR_CreateGuiSettings already done");
			return;
		}

		if (typeof(dat) == 'undefined')
		{
			M3DVR_DisplayLog("   ---> error dat undefined (necessary to include js/dat_guivr.js)");
			return;
		}
		
		dat.GUIVR.enableMouse(M3D_mCamera);
		m3dvr_mGuiSettings = dat.GUIVR.create( 'Settings' );
		m3dvr_mGuiSettings.position.set( 0.2, 0.8, -1 );
		m3dvr_mGuiSettings.rotation.set( Math.PI / -6, 0, 0 );
		m3dvr_mGuiSettings.visible = false;
		M3D_mScene.add( m3dvr_mGuiSettings );

		m3dvr_mMeschScene = M3D_GetMesh(scene);
		m3dvr_mGuiSettings.add( m3dvr_mMeschScene.position, 'x', -2, 2 ).step( 0.01 ).name( 'Position X' );
		m3dvr_mGuiSettings.add( m3dvr_mMeschScene.position, 'y', 0, 2 ).step( 0.01 ).name( 'Position Y' );
		m3dvr_mGuiSettings.add( m3dvr_mMeschScene.position, 'z', -2, 2 ).step( 0.01 ).name( 'Position Z' );
		m3dvr_mGuiSettings.add( m3dvr_mSettings, 'mRotation', -180, 180 ).step( 1 ).name( 'Rotation' ).onChange( function(val) { m3dvr_mSettings.Rotation(); });
		m3dvr_mGuiSettings.add( m3dvr_mSettings, 'mScale', -5, 5 ).step( 0.01 ).name( 'Scale' ).onChange( function(val) { m3dvr_mSettings.Scale(); });
		m3dvr_mGuiSettings.add( m3dvr_mSettings, "mShowAxes").name( 'Show axes' ).onChange( function(val) { m3dvr_mSettings.ShowAxes(); });
		m3dvr_mGuiSettings.add( m3dvr_mSettings, "mShowGrid").name( 'Show grid' ).onChange( function(val) { m3dvr_mSettings.ShowGrid(); });
		m3dvr_mGuiSettings.add( m3dvr_mSettings, "mMuteSounds").name( 'Mute sounds' ).onChange( function(val) { m3dvr_mSettings.MuteSounds(); });
	}

	
	
	
	
//## LISTENERS ##############################################################################################
	
	//______________________________________________________________________________________________
	function m3dvr_OnButton(controller, butName, bPress, evt)
	{
		if (controller == M3DVR_mController_1.mController)
			M3DVR_mController_1.OnButton(butName, bPress, evt);
		else if (controller == M3DVR_mController_2.mController)
			M3DVR_mController_2.OnButton(butName, bPress, evt);
	}
	
	//______________________________________________________________________________________________
	function m3dvr_OnDisconnected(controller)
	{
		if (controller == M3DVR_mController_1.mController)
			M3DVR_mController_1.OnDisconnected();
		else if (controller == M3DVR_mController_2)
			M3DVR_mController_1.OnDisconnected();
	}
	
	//______________________________________________________________________________________________
	function m3dvr_AddListeners(controller)
	{
		//  Allow this controller to interact with DAT GUI.
		//var guiInputHelper = dat.GUIVR.addInputObject( controller )
		//M3D_mScene.add( guiInputHelper )

		// TRIGGER
		controller.addEventListener( 'trigger press began', function( event ){
			//M3DVR_DisplayLog("Vive Controller - trigger press began");
			event.target.userData.mesh.material.color.setHex( m3dvr_mControllerColorTrigger );
			m3dvr_OnButton(event.target, "Trigger", true, "OnTriggerPress");
		});
		controller.addEventListener( 'trigger press ended', function( event ){
			//M3DVR_DisplayLog("Vive Controller - trigger press ended");
			event.target.userData.mesh.material.color.setHex( m3dvr_mControllerColorOff );
			m3dvr_OnButton(event.target, "Trigger", false, "OnTriggerRelease");
		});

		// GRIP
		controller.addEventListener( 'grip press began', function( event ){
			//M3DVR_DisplayLog("Vive Controller - grip press began");
			event.target.userData.mesh.material.color.setHex( m3dvr_mControllerColorGrip );
			m3dvr_OnButton(event.target, "Grip", true, "OnGripPress");
		});
		controller.addEventListener( 'grip press ended', function( event ){
			//M3DVR_DisplayLog("Vive Controller - grip press ended");
			event.target.userData.mesh.material.color.setHex( m3dvr_mControllerColorOff );
			m3dvr_OnButton(event.target, "Grip", false, "OnGripRelease");
		});

		// THUMBPAD TOUCH
		controller.addEventListener( 'thumbpad touch began', function( event ){
			//M3DVR_DisplayLog("Vive Controller - thumbpad touch began");
			event.target.userData.mesh.material.color.setHex( m3dvr_mControllerColorThumpad );
			m3dvr_OnButton(event.target, "Thumpad", true, "OnThumpadTouch");
		});
		controller.addEventListener( 'thumbpad touch ended', function( event ){
			//M3DVR_DisplayLog("Vive Controller - thumbpad touch ended");
			event.target.userData.mesh.material.color.setHex( m3dvr_mControllerColorOff );
			m3dvr_OnButton(event.target, "Thumpad", false, "OnThumpadUntouch");
		});

		// THUMBPAD PRESS
		controller.addEventListener( 'thumbpad press began', function( event ){
			//M3DVR_DisplayLog("Vive Controller - thumbpad press began");
			event.target.userData.mesh.material.color.setHex( m3dvr_mControllerColorThumpadPress );
			m3dvr_OnButton(event.target, "ThumpadPress", true, "OnThumpadPress");
		});
		controller.addEventListener( 'thumbpad press ended', function( event ){
			//M3DVR_DisplayLog("Vive Controller - thumbpad press ended");
			event.target.userData.mesh.material.color.setHex( m3dvr_mControllerColorOff );
			m3dvr_OnButton(event.target, "ThumpadPress", false, "OnThumpadRelease");
		});

		// MENU
		controller.addEventListener( 'menu press began', function( event ){
			//M3DVR_DisplayLog("M3DVR controller - menu press began");
			event.target.userData.mesh.material.color.setHex( m3dvr_mControllerColorMenu );
			m3dvr_OnButton(event.target, "Menu", true, "OnMenuPress");
		});
		controller.addEventListener( 'menu press ended', function( event ){
			//M3DVR_DisplayLog("Vive Controller - menu press ended");
			event.target.userData.mesh.material.color.setHex( m3dvr_mControllerColorOff );
			m3dvr_OnButton(event.target, "Menu", false, "OnMenuRelease");
		});

		//  Daddy, what happens when we die?
		controller.addEventListener( 'disconnected', function( event ){
			m3dvr_OnDisconnected(event.target);
			controller.parent.remove(event.target);
		});
	}

	//______________________________________________________________________________________________
	window.addEventListener( 'vr controller connected', function( event )
	{
		controller = event.detail;
	//	M3DVR_DisplayLog("-----VR controller connected: " + controller.name + "' id:" + controller.uuid);
		
		if (M3DVR_mController_1 == 0)
		{
			M3DVR_mController_1 = new m3dvr_CController("1", controller);
			m3dvr_AddListeners(controller);
		}
		else if (M3DVR_mController_2 == 0)
		{
			M3DVR_mController_2 = new m3dvr_CController("2", controller);
			m3dvr_AddListeners(controller);
		}
	});

	

	

//## UTILITAIRES  ##################################################################################################

	var m3dvr_mPosCtrl = new THREE.Vector3(0,0,0);
	var m3dvr_mPosBase = new THREE.Vector3(0,0,0);
	
	
	//______________________________________________________________________________________________
	function M3DVR_GetDistanceControllerMesh(controller, mesh)
	{
		if (! controller)
			return 1000000;
		
		m3dvr_mPosCtrl.set(0,0,0);
		controller.mController.localToWorld(m3dvr_mPosCtrl);	
		m3dvr_mPosBase.set(0,0,0);
		mesh.localToWorld(m3dvr_mPosBase);	

		return (m3dvr_mPosBase.distanceTo(m3dvr_mPosCtrl) * M3DVR_mRatio);
	}

	//______________________________________________________________________________________________
	function M3DVR_IsControllerNearMesh(controller, mesh, distance)
	{
		if (! controller)
			return false;
		return (M3DVR_GetDistanceControllerMesh(controller, mesh) < distance);
	}

	
	

	//______________________________________________________________________________________________
	function M3DVR_IsControllerOk(idController)
	{
		if (idController == 1)
			return (M3DVR_mController_1 != 0);
		if (idController == 2)
			return (M3DVR_mController_2 != 0);
		return false;
	}
	
	//______________________________________________________________________________________________
	function M3DVR_IsControllerButtonPressed(idController, butName)
	{
		if (! M3DVR_IsControllerOk(idController))
			return false;
		if (idController == 1)
			return M3DVR_mController_1.IsButtonPressed(butName);
		if (idController == 2)
			return M3DVR_mController_2.IsButtonPressed(butName);
		return false;
	}
	
	//______________________________________________________________________________________________
	function M3DVR_GetDistanceControllerObject(idController, object)
	{
		mesh = M3D_GetMesh(object);
		if (mesh == 0)
			return 1000000;
		if (idController == 1)
			return (M3DVR_GetDistanceControllerMesh(M3DVR_mController_1, mesh));
		if (idController == 2)
			return (M3DVR_GetDistanceControllerMesh(M3DVR_mController_2, mesh));
		return 1000000;
	}
	
	//______________________________________________________________________________________________
	function M3DVR_IsControllerNearObject(idController, object, distance)
	{
		return (M3DVR_GetDistanceControllerObject(idController, object) < distance);
	}

	//______________________________________________________________________________________________
	function M3DVR_IsControllerButtonsCombinaison(idController, combinaison)
	{
		if (! M3DVR_IsControllerOk(idController))
			return false;
		if (idController == 1)
			return M3DVR_mController_1.IsButtonsCombinaison(combinaison);
		if (idController == 2)
			return M3DVR_mController_2.IsButtonsCombinaison(combinaison);
		return false;
	}



