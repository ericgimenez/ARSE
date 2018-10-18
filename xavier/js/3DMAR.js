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


var	m3dar_mAR  = null;

//______________________________________________________________________________________________
function M3DAR_DisplayLog(msg)
{
//	M3D_DisplayLog(msg);
	console.log("3DM****** " + msg);

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

M3D_mVersion = "todo";

//______________________________________________________________________________________________
function M3DAR_InitThreeJsForAR(bDirectLight, bShadows, modelSize)
{
	M3DAR_DisplayLog("M3DAR_InitThreeJsForAR(" + bDirectLight + ", " + bShadows + ") AR V " + M3DAR_mVersion + "  3DM V " + M3D_mVersion + " ********");
	
	M3D_OnAR = true;
	M3D_UseOrbitControls = false;
	M3D_UseViewControler = false;
	
	m3dar_mAR = new CM3DAR_AR(modelSize);

	//M3D_InitThreeJsFor3DM(bDirectLight, bShadows, false);
}

//______________________________________________________________________________________________
function M3DAR_AddGroup(id, graphicsGroup)     
{
	M3DAR_DisplayLog("M3DAR_AddGroup(" + id + ", ...)");
	m3dar_mAR.AddGroup(id, graphicsGroup);
};


//______________________________________________________________________________________________
var M3DAR_Animate = function ()     // internal function launched by M3D_Animate if M3D_OnAR
{
	requestAnimationFrame(M3DAR_Animate);
	
	if (m3dar_mAR != null)
		m3dar_mAR.Animate();
};

	


//## Class CM3DAR_AR ##############################################################################################

	//______________________________________________________________________________________________
	function CM3DAR_AR(modelSize) 
	{
		this.DisplayLog("Initialisation");
		
		this.mVideo = null;				// objet video dans la page html
		this.mCanvas = null;			// objet canvas dans la page html
		this.mContext = null;			// context de l'objet canvas (pour dessiner dedans)
		this.mDetector = null;			// détecteur des markers
		this.mPosit = null;				// pour contenir la position des markers
		this.mSceneVideo = null;		// scene threejs qui contient la video
		this.mCameraVideo = null;		// camera threejs pour la video
		this.mTextureVideo = null;		// objet graphic qui contient le plan texture ou sera dessiner la video
		this.mModelSize = modelSize;	// taille des markers 
		
		this.mMaxNbNoMarkers = 100;		// nb max d'animate ou ne trouve pas de marker avant d'effacer l'objet
		
		this.mTabGraphicsGroups = [];	// tableau des group de graphiques
		
		
		// recup des zones de la page html
		this.mVideo = document.getElementById("video");
		this.mCanvas = document.getElementById("canvas");
		this.mContext = this.mCanvas.getContext("2d");

		this.mCanvas.width = parseInt(this.mCanvas.style.width);
		this.mCanvas.height = parseInt(this.mCanvas.style.height);

		// parametrage navigator pour avoir la caméra
		this.SetNavigatorWithCamera();

		// création du detecteur de markers
		this.mDetector = new AR.Detector();
		this.mPosit = new POS.Posit(this.mModelSize, this.mCanvas.width);

		// création du rendu
		M3D_mRenderer = new THREE.WebGLRenderer();
		M3D_mRenderer.setClearColor(0xffffff, 1);
		width = window.innerWidth - 20; 
		height = window.innerHeight - 20; 

		M3D_mRenderer.setSize(width, height);
		document.body.appendChild(M3D_mRenderer.domElement);

		// création des scenes
		this.mSceneVideo = new THREE.Scene();
		this.mCameraVideo = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5);
		this.mSceneVideo.add(this.mCameraVideo);

		M3D_mScene = new THREE.Scene();
		M3D_mCamera = new THREE.PerspectiveCamera(40, width / height, 1, 1000);
		M3D_mScene.add(M3D_mCamera);

		// Création de la texture et de la scene video
		this.CreateSceneVideo();
		
		this.DisplayLog("Initialisation done");
	}
	
	//______________________________________________________________________________________________
	CM3DAR_AR.prototype.DisplayLog = function(msg) 
	{
		M3DAR_DisplayLog("-----CM3DAR_AR: " + msg);
	};
	
	//______________________________________________________________________________________________
	CM3DAR_AR.prototype.SetNavigatorWithCamera = function() 
	{
		this.DisplayLog("SetNavigatorWithCamera()");

		if (navigator.mediaDevices === undefined) 
			navigator.mediaDevices = {};

		if (navigator.mediaDevices.getUserMedia === undefined) 
		{
			navigator.mediaDevices.getUserMedia = function(constraints) 
			{
				var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

				if (!getUserMedia)
					return Promise.reject(new Error('getUserMedia is not implemented in this browser'));

				return new Promise(function(resolve, reject) {
					getUserMedia.call(navigator, constraints, resolve, reject);
				});
			}
		}

		navigator.mediaDevices
			.getUserMedia({ video: true })
			.then( function(stream) 
			{
				if ("srcObject" in m3dar_mAR.mVideo)
					m3dar_mAR.mVideo.srcObject = stream;
				else
					m3dar_mAR.mVideo.src = window.URL.createObjectURL(stream);
			})
			.catch(function(err) {	console.log(err.name + ": " + err.message);	}
			);
	};
	
	//______________________________________________________________________________________________
	CM3DAR_AR.prototype.CreateSceneVideo = function() 
	{
		this.DisplayLog("CreateSceneVideo()");

		var texture = new THREE.Texture(this.mVideo);
		var geometry = new THREE.PlaneGeometry(1.0, 1.0, 0.0);
		var material = new THREE.MeshBasicMaterial( {map: texture, depthTest: false, depthWrite: false} );
		var mesh = new THREE.Mesh(geometry, material);
		
		this.mTextureVideo = new THREE.Object3D(),
		this.mTextureVideo.position.z = -1;
		this.mTextureVideo.add(mesh);
		this.mSceneVideo.add(this.mTextureVideo);
	};
	
	//______________________________________________________________________________________________
	CM3DAR_AR.prototype.Animate = function() 
	{
		if (this.mVideo.readyState === this.mVideo.HAVE_ENOUGH_DATA)
		{
			// snapshot de la caméra
			this.mContext.drawImage(this.mVideo, 0, 0, this.mCanvas.width, this.mCanvas.height);
			imageData = this.mContext.getImageData(0, 0, this.mCanvas.width, this.mCanvas.height);

			// détection des markers
			var markers = this.mDetector.detect(imageData);
			
			// mise à jour de la scene
			this.UpdateScenes(markers);

			// rendu
			M3D_mRenderer.autoClear = false;
			M3D_mRenderer.clear();
			M3D_mRenderer.render(this.mSceneVideo, this.mCameraVideo);
			M3D_mRenderer.render(M3D_mScene, M3D_mCamera);
		}
	};
	
	//______________________________________________________________________________________________
	CM3DAR_AR.prototype.UpdateScenes = function(markers) 
	{
		this.DisplayLog("UpdateScenes (" + markers + ")");
		
		var corners, corner, pose, i;

		if (markers.length > 0)
		{
			for (no = 0; no < markers.length; no++)
			{
				this.DisplayLog("Marker id: " + markers[no].id + " detected");
				
				// on définit la zone
				corners = markers[no].corners;
				for (i = 0; i < corners.length; ++ i)
				{
					corner = corners[i];
					corner.x = corner.x - (this.mCanvas.width / 2);
					corner.y = (this.mCanvas.height / 2) - corner.y;
				}
				pose = this.mPosit.pose(corners);
				
				// on boucle sur les groupes
				for (grp = 0; grp < this.mTabGraphicsGroups.length; grp++)
					this.mTabGraphicsGroups[grp].OnMarker(markers[no].id, pose);
			}
		}
		else
			this.DisplayLog("  ----> Mo marker detected");
		
		// on actualise les groupes dont le marker n'a pas été vu
		for (grp = 0; grp < this.mTabGraphicsGroups.length; grp++)
			this.mTabGraphicsGroups[grp].EndOfUpdates();

		// mise à jour de la texture pour afficher la video
		this.mTextureVideo.children[0].material.map.needsUpdate = true;
	};

	//______________________________________________________________________________________________
	CM3DAR_AR.prototype.AddGroup = function(id, group)     
	{
		this.DisplayLog("AddGroup(" + id + ", ...)");
		graphicsGroup = new CM3DAR_GraphicsGroup(id, group, this.mModelSize, this.mMaxNbNoMarkers);
		this.mTabGraphicsGroups.push(graphicsGroup);
	};

	


	


//## Class CM3DAR_GraphicsGroup ##############################################################################################

	//______________________________________________________________________________________________
	function CM3DAR_GraphicsGroup(id, group, modelSize, maxNbNoMarkers) 
	{
		this.mId = id;					// id du marker  (0 tout les markers sont acceptés)
		this.DisplayLog("Initialisation ");
		
		this.mGroup = group;			// group de graphismes
		
		this.mModelSize = modelSize;	// taille du marker
		this.mbUpdated = false;         // pour vérifier si son marker a été vu...
		this.mNbNoMarkers = 0;			// nb de fois ou le marker du groupe n'a pas été vu
		this.mMaxNbNoMarkers = maxNbNoMarkers;		// nb max d'animate ou on ne trouve pas de marker avant d'effacer l'objet
	};

	//______________________________________________________________________________________________
	CM3DAR_GraphicsGroup.prototype.DisplayLog = function(msg) 
	{
		M3DAR_DisplayLog("-----CM3DAR_GraphicsGroup " + this.mId + " : " + msg);
	};
	
	//______________________________________________________________________________________________
	CM3DAR_GraphicsGroup.prototype.EndOfUpdates = function() 
	{
		this.DisplayLog("EndOfUpdates()");
		
		if (this.mbUpdated)   // le group a été updaté
		{
			this.mbUpdated = false;
			return;
		}
		
		// le marker n'a pas été vu : on va effacer l'objet au bout d'un certain temps
		if (this.mGroup.visible == true)
		{
			this.mNbNoMarkers++;
			if (this.mNbNoMarkers == this.mMaxNbNoMarkers)
			{
				this.DisplatLog("-----EndUpdates() set visible to false");
				this.mGroup.visible = false;
			}
		}
	};
	
	//______________________________________________________________________________________________
	CM3DAR_GraphicsGroup.prototype.OnMarker = function(id, pose) 
	{
		this.DisplayLog("OnMarker " + this.mId);
		
		if ((this.mId != 0) && (this.mId != id))
			return;

		this.mbUpdated = true;    // le group a été vu
		
		if (this.mGroup.visible == false)		// on l'affiche si il était caché
		{
			this.mNbNoMarkers = 0;
			this.mGroup.visible = true;
		}
		
		this.UpdateObject(pose.bestRotation, pose.bestTranslation);   // on le pose sur le marker

		step += 0.025;
		this.mGroup.rotation.z -= step;
	};

	//______________________________________________________________________________________________
	CM3DAR_GraphicsGroup.prototype.UpdateObject = function(rotation, translation) 
	{
		this.DisplayLog("UpdateObject (...)");
		
		this.mGroup.scale.x = this.mModelSize;
		this.mGroup.scale.y = this.mModelSize;
		this.mGroup.scale.z = this.mModelSize;

		this.mGroup.rotation.x = -Math.asin(-rotation[1][2]);
		this.mGroup.rotation.y = -Math.atan2(rotation[0][2], rotation[2][2]);
		this.mGroup.rotation.z = Math.atan2(rotation[1][0], rotation[1][1]);

		this.mGroup.position.x = translation[0];
		this.mGroup.position.y = translation[1];
		this.mGroup.position.z = -translation[2];
	};


