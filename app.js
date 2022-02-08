/**
 * Query for WebXR support. If there's no support for the `immersive-ar` mode,
 * show an error.
 */

(async function () {
  const isArSessionSupported =
    // Checking for the presence of xr object on the navigator object.
    navigator.xr &&
    // Checking for existence of the function isSessionSupported.
    navigator.xr.isSessionSupported &&
    // Checking for the 'immersive-AR' session mode [The immersive-ar session mode guarantees that the user's environment will be visible and aligned with the rendered content]
    (await navigator.xr.isSessionSupported("immersive-ar"));

  // If all goes well and we find that everything's set-up and ready here, We'll add an event listener to the button that has been given the id "enter-ar", and we'll be using the activateXR Function.
  if (isArSessionSupported) {
    document
      .getElementById("enter-ar")
      .addEventListener("click", window.app.activateXR);
  } else {
    onNoXRDevice();
  }
})();

/**
 * Container class to manage connecting to the WebXR Device API
 * and handle rendering on every frame.
 */

class App {
  /**
   * Run when the Start AR button is pressed.
   */

  activateXR = async () => {
    try {
      // Initialize a WebXR session using "immersive-ar" mode
      this.xrSession = await navigator.xr.requestSession("immersive-ar", {
        // Alternatively, intialize a WebXR session using extra required features - the ones used here are 'hit-test' & 'dom-overplay'. 'Hit-test' functionality checks for how to place an object using ray tracing. Visualize this as a ray being sent out of your mobile devince and the very first interaction with the physical geometry is how we interact with the real world to know about the surface and consequently place our marker point. Hit tests are used to calculate Ray Intersections, in this case, from our Mobile device to a detected plane.
        // The 'dom-overlay' is what guides our UX. DOM Overlay allows us to show interactive 2D web content during an immersive WebXR session. Let's say a button to exit from our session and go back to the main page.

        // Also, AR works best when the scene is understood properly. And to do that information is gathered from multiple sources so one could be deppth from motion and the other can be active hardware sensor like a time-of-flight sensor and what this is going to do is it's going to display some ux instructing the user to move their device around in order to create great hit test results and to do that we're going to be showing the 'document.body' element here on top of the camera display.
        requiredFeatures: ["hit-test", "dom-overlay"],

        domOverlay: { root: document.body },
      });

      // Create the canvas that will contain our camera's background and our virtual scene.
      // The canvas will be used to draw the AR object on.c
      this.createXRCanvas();

      // With everything set up, start the app.
      await this.onSessionStarted();
    } catch (e) {
      console.log(e);
      onNoXRDevice();
    }
  };

  /**
   * Add a canvas element and initialize a WebGL context that is compatible with WebXR.
   */

  // Here is the createXRcanvas method. What this is going to do is it's going to create a canvas that we'll be using to draw on.
  createXRCanvas() {
    this.canvas = document.createElement("canvas");
    document.body.appendChild(this.canvas);

    // We'll be using webgl to draw our rendered content,
    this.gl = this.canvas.getContext("webgl", { xrCompatible: true });

    // And also, we'll be using the session's base layer. The session's base layer is the layer that the camera view will be drawn on. And this is also what we'll be using to draw on top of with our rendered content
    this.xrSession.updateRenderState({
      baseLayer: new XRWebGLLayer(this.xrSession, this.gl),
    });
  }

  /**
   * Called when the XRSession has begun. Here we set up our three.js
   * renderer, scene, and camera and attach our XRWebGLLayer to the
   * XRSession and kick off the render loop.
   */

  onSessionStarted = async () => {
    // Add the `ar` class to our body, which will hide our 2D components
    document.body.classList.add("ar");

    // To help with working with 3D on the web, we'll use three.js.
    this.setupThreeJs();

    // After setting up three.js, we'll create a reference space. A reference space is used to define a coordinate system and an origin point. And in our case, we'll be creating a local reference space.

    // Setup an XRReferenceSpace using the "local" coordinate system.
    this.localReferenceSpace = await this.xrSession.requestReferenceSpace(
      "local"
    );

    // The "local" reference space has this origin that's located near the viewer's position at the time that the session is created. Therefore, it's going to be ideal for laying the content near the user.

    // Create another XRReferenceSpace that has the viewer as the origin.
    // The reference space that we'll be using this time is the viewer. So the viewer reference space has to do with the camera orientation so the direction that it's going to be looking down is down the camera's view view.
    this.viewerSpace = await this.xrSession.requestReferenceSpace("viewer");

    // Perform hit testing using the viewer as origin.
    // Here we'll be creating a hit test source. This hit test source will be the object that we're going to be using to query for hit test results. So basically you can ask it "hey is there a hit-test result at this location?"
    this.hitTestSource = await this.xrSession.requestHitTestSource({
      // We're using the viewer space to perform hit testing.
      space: this.viewerSpace,
    });

    // Start a rendering loop using this.onXRFrame.
    // Using this.onXRFrame function we're requesting our first animation frame
    this.xrSession.requestAnimationFrame(this.onXRFrame);

    // The "select" event has to do with the primary action in webXR. In Mobile AR, this is tapping the screen. So whenever the user taps the screen, we'll call this callback which is in this case 'onSelect()' and you can find the implementation of 'onSelect' on the 120th line in this code file.
    this.xrSession.addEventListener("select", this.onSelect);
  };

  /** Place a sunflower when the screen is tapped. */
  onSelect = () => {
    // In the background the page is loading an object called 'sunflower' on window which is a 3D Model which we'll be using to disply our sunflower.
    if (window.sunflower) {
      // Now, we're using clone to make a copy of this sunflower. And then we'll be moving the clone's postion to be the same as the reticle's position which will move our sunflower right on the top of our targeting reticle.
      const clone = window.sunflower.clone();

      // After this we'll move this clone into the seen
      clone.position.copy(this.reticle.position);
      this.scene.add(clone);

      // In here we're going to use a shadow mesh to give the sunflower as realistic look as possible. The 'Shadow Mesh' is a plane that we'll be using to cast the shadow of our AR Object on the surface but it seems invisible. The 'Shadow Mesh' has no appearance but it can only receive shadows. You can enable shadows by going to line 224 and setting the value equalt to true
      const shadowMesh = this.scene.children.find(
        (c) => c.name === "shadowMesh"
      );
      shadowMesh.position.y = clone.position.y;
    }
  };

  /**
   * Called on the XRSession's requestAnimationFrame.
   * Called with the time and XRPresentationFrame.
   */

  onXRFrame = (time, frame) => {
    // Queue up the next draw request.
    // So basically when we're starting to render a function we're going to tell the browser that "hey we're immediately ready to go again! So browser when you're ready, make sure to call the onXRFrame again."
    this.xrSession.requestAnimationFrame(this.onXRFrame);

    // Bind the graphics framebuffer to the baseLayer's framebuffer.
    // This just ensures that your camera is going to be drawn onto your canvas.
    const framebuffer = this.xrSession.renderState.baseLayer.framebuffer;
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
    this.renderer.setFramebuffer(framebuffer);

    // RETRIEVING THE POSE OF THE VIEWER [which in this case is going to be the viewer's device]
    // This is one of the core functions in WebXR where we're going to be getting the viewer pose from the frame and we're going to be using the local reference space to do so.  The viewer pose is going to indicate how the camera is positioned in the 3D Space and also what the orientation & rotation is going to be like.

    // 'XRFrame.getViewerPose' can return null while the AR System is being initialized and session attempts to establish tracking. Therefore, we're going to make sure that the poses are initialized even before we continue.
    const pose = frame.getViewerPose(this.localReferenceSpace);
    if (pose) {
      // After that, we're going to take the first view from the poses view array.
      // This is because in mobile AR, we only have one view. But since WebXR also supports VR applications, you can imagine that VR headsets supports two views - one for the left eye and one for the right eye in order to simulate depth perspective. But in mobile AR, there's only one view therefore, only the first element is taken off this array.
      const view = pose.views[0];

      // After that, we make sure that the viewPort is set to the correct size to ensure that the display is displaying over the entire canvas.
      const viewport = this.xrSession.renderState.baseLayer.getViewport(view);
      this.renderer.setSize(viewport.width, viewport.height);

      // Then, we're going to use the data stored in view to tranform our camera. So we're going to move our virtual camera in sync with the physical (or the device's camera).
      // Use the view's transform matrix and projection matrix to configure the THREE.camera.
      this.camera.matrix.fromArray(view.transform.matrix);

      // We're going to be changing the position values and rotation values and also the projection values as well.
      this.camera.projectionMatrix.fromArray(view.projectionMatrix);

      this.camera.updateMatrixWorld(true);

      // Conduct hit test.
      // In here, we're using the 'frame.getHitTestResults() method to ask for the results from the hit test source.
      const hitTestResults = frame.getHitTestResults(this.hitTestSource);

      // If we have results, we'll consider the environment stabilized. This means that we've retrieved enough information in order to make some accurate test results.
      if (!this.stabilized && hitTestResults.length > 0) {
        this.stabilized = true;
        document.body.classList.add("stabilized");
      }

      // After that, we're going to check for the length of hit test results. So if there is at least one value hidden or in the hit test results array then we'll be using this as our hit pose. And, the hit pose is basically the rotation and the position of the object that was intersected with our array
      if (hitTestResults.length > 0) {
        const hitPose = hitTestResults[0].getPose(this.localReferenceSpace);

        // Updating the reticle position using the reticle.position.set() and we'll be using the hit poses transforms - x,y, and z value
        this.reticle.visible = true;
        this.reticle.position.set(
          hitPose.transform.position.x,
          hitPose.transform.position.y,
          hitPose.transform.position.z
        );
        this.reticle.updateMatrixWorld(true);
      }

      // Render the scene with THREE.WebGLRenderer.
      // In here, we're going to instruct the three.js renderer to render the scene using the camera that we've configured earlier.
      this.renderer.render(this.scene, this.camera);
    }
  };

  /**
   * Initialize three.js specific rendering code, including a WebGLRenderer,
   * a demo scene, and a camera for viewing the 3D content.
   */

  setupThreeJs() {
    // To help with working with 3D on the web, we'll use three.js.
    // Set up the WebGLRenderer, which handles rendering to our session's base layer.

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      preserveDrawingBuffer: true,
      canvas: this.canvas,
      context: this.gl,
    });

    this.renderer.autoClear = false;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // After initializing the WebGL renderer, here we're creating a demo scene.
    // The 'createLitScene() method' is what actually contains some lighting, in order to make sure that we can see our object properly.
    this.scene = DemoUtils.createLitScene();

    // This is the point where the reticle has been coming from.
    this.reticle = new Reticle();
    this.scene.add(this.reticle);

    // -> Here below, we're creating a camera which we'll be using to sync up with your physical camera in order to make sure that your rendered content look real.

    // We'll update the camera matrices directly from API, so
    // disable matrix auto updates so three.js doesn't attempt
    // to handle the matrices independently.
    this.camera = new THREE.PerspectiveCamera();
    this.camera.matrixAutoUpdate = false;
  }
}

window.app = new App();
