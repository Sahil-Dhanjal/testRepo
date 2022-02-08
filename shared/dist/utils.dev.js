"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

window.gltfLoader = new THREE.GLTFLoader();
/**
 * The Reticle class creates an object that repeatedly calls
 * `xrSession.requestHitTest()` to render a ring along a found
 * horizontal surface.
 */

var Reticle =
/*#__PURE__*/
function (_THREE$Object3D) {
  _inherits(Reticle, _THREE$Object3D);

  function Reticle() {
    var _this;

    _classCallCheck(this, Reticle);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Reticle).call(this));
    _this.loader = new THREE.GLTFLoader();

    _this.loader.load("https://immersive-web.github.io/webxr-samples/media/gltf/reticle/reticle.gltf", function (gltf) {
      _this.add(gltf.scene);
    });

    _this.visible = false;
    return _this;
  }

  return Reticle;
}(THREE.Object3D);

window.gltfLoader.load("https://immersive-web.github.io/webxr-samples/media/gltf/sunflower/sunflower.gltf", function (gltf) {
  var flower = gltf.scene.children.find(function (c) {
    return c.name === "sunflower";
  });
  flower.castShadow = true;
  window.sunflower = gltf.scene;
});
window.DemoUtils = {
  /**
   * Creates a THREE.Scene containing lights that case shadows,
   * and a mesh that will receive shadows.
   *
   * @return {THREE.Scene}
   */
  createLitScene: function createLitScene() {
    var scene = new THREE.Scene(); // The materials will render as a black mesh
    // without lights in our scenes. Let's add an ambient light
    // so our material can be visible, as well as a directional light
    // for the shadow.

    var light = new THREE.AmbientLight(0xffffff, 1);
    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight.position.set(10, 15, 10); // We want this light to cast shadow.

    directionalLight.castShadow = true; // Make a large plane to receive our shadows

    var planeGeometry = new THREE.PlaneGeometry(2000, 2000); // Rotate our plane to be parallel to the floor

    planeGeometry.rotateX(-Math.PI / 2); // Create a mesh with a shadow material, resulting in a mesh
    // that only renders shadows once we flip the `receiveShadow` property.

    var shadowMesh = new THREE.Mesh(planeGeometry, new THREE.ShadowMaterial({
      color: 0x111111,
      opacity: 0.2
    })); // Give it a name so we can reference it later, and set `receiveShadow`
    // to true so that it can render our model's shadow.

    shadowMesh.name = "shadowMesh";
    shadowMesh.receiveShadow = true;
    shadowMesh.position.y = 10000; // Add lights and shadow material to scene.

    scene.add(shadowMesh);
    scene.add(light);
    scene.add(directionalLight);
    return scene;
  },

  /**
   * Creates a THREE.Scene containing cubes all over the scene.
   *
   * @return {THREE.Scene}
   */
  createCubeScene: function createCubeScene() {
    var scene = new THREE.Scene();
    var materials = [new THREE.MeshBasicMaterial({
      color: 0xff0000
    }), new THREE.MeshBasicMaterial({
      color: 0x0000ff
    }), new THREE.MeshBasicMaterial({
      color: 0x00ff00
    }), new THREE.MeshBasicMaterial({
      color: 0xff00ff
    }), new THREE.MeshBasicMaterial({
      color: 0x00ffff
    }), new THREE.MeshBasicMaterial({
      color: 0xffff00
    })];
    var ROW_COUNT = 4;
    var SPREAD = 1;
    var HALF = ROW_COUNT / 2;

    for (var i = 0; i < ROW_COUNT; i++) {
      for (var j = 0; j < ROW_COUNT; j++) {
        for (var k = 0; k < ROW_COUNT; k++) {
          var box = new THREE.Mesh(new THREE.BoxBufferGeometry(0.2, 0.2, 0.2), materials);
          box.position.set(i - HALF, j - HALF, k - HALF);
          box.position.multiplyScalar(SPREAD);
          scene.add(box);
        }
      }
    }

    return scene;
  }
};
/**
 * Toggle on a class on the page to disable the "Enter AR"
 * button and display the unsupported browser message.
 */

function onNoXRDevice() {
  document.body.classList.add("unsupported");
}