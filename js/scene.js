// Setting scene for 3D Object
var scene = new THREE.Scene();
scene.background = new THREE.Color('skyblue');
var camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
var vector = new THREE.Vector3();
var loader = new THREE.TextureLoader();
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var vertexShader = `
    varying vec3 vPos;
    void main()	{
      vPos = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `;

var fragmentShader = `

    varying vec3 vPos;
    uniform vec3 size;
    uniform float thickness;
    uniform float smoothness;

    void main() {

      float a = smoothstep(thickness, thickness + smoothness, length(abs(vPos.xy) - size.xy));
      a *= smoothstep(thickness, thickness + smoothness, length(abs(vPos.yz) - size.yz));
      a *= smoothstep(thickness, thickness + smoothness, length(abs(vPos.xz) - size.xz));

      vec3 c = mix(vec3(1), vec3(0), a);

      gl_FragColor = vec4(c, 1.0);
    }
  `;


// Creating 3D object
var geometry = new THREE.BoxBufferGeometry(1, 1, 1);

var material = new THREE.ShaderMaterial({
  uniforms: {
    size: {
      value: new THREE.Vector3(geometry.parameters.width, geometry.parameters.height, geometry.parameters.depth).multiplyScalar(0.5)
    },
    thickness: {
    	value: 0.01
    },
    smoothness: {
    	value: 0.2
    }
  },
  vertexShader: vertexShader,
  fragmentShader: fragmentShader
});


var cube = new THREE.Mesh(geometry, material);

scene.add(cube);

// var geometry = new THREE.SphereGeometry( 5, 15, 15 );
// var material = new THREE.MeshBasicMaterial( {
//   color: "rgb(3,197,221)",
//   wireframe: true,
//   wireframeLinewidth: 1
// });
// var sphere = new THREE.Mesh( geometry, material );
// scene.add( sphere );

camera.position.z = 5;

// Optional animation to rotate the element
var animate = function() {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
};

animate();

// Creating Canavs for video Input
const video = document.getElementById("myvideo");
const handimg = document.getElementById("handimage");
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
let trackButton = document.getElementById("trackbutton");
let updateNote = document.getElementById("updatenote");

let imgindex = 1;
let isVideo = false;
let model = null;

// Params to initialize Handtracking js
const modelParams = {
  flipHorizontal: true,
  maxNumBoxes: 1,
  iouThreshold: 0.5,
  scoreThreshold: 0.7
};

handTrack.load(modelParams).then(lmodel => {
  model = lmodel;
  updateNote.innerText = "Loaded Model!";
  trackButton.disabled = false;
});

// Method to start a video
function startVideo() {
  handTrack.startVideo(video).then(function(status) {
    if (status) {
      updateNote.innerText = "Video started. Now tracking";
      isVideo = true;
      runDetection();
    } else {
      updateNote.innerText = "Please enable video";
    }
  });
}

// Method to toggle a video
function toggleVideo() {
  if (!isVideo) {
    updateNote.innerText = "Starting video";
    startVideo();
  } else {
    updateNote.innerText = "Stopping video";
    handTrack.stopVideo(video);
    isVideo = false;
    updateNote.innerText = "Video stopped";
  }
}

//Method to detect movement
function runDetection() {
  model.detect(video).then(predictions => {
    model.renderPredictions(predictions, canvas, context, video);
    if (isVideo) {
      requestAnimationFrame(runDetection);
    }
    if (predictions.length > 0) {
      changeData(predictions[0].bbox);
    }
  });
}

//Method to Change prediction data into useful information
function changeData(value) {
  let midvalX = value[0] + value[2] / 2;
  let midvalY = value[1] + value[3] / 2;

  document.querySelector(".hand-1 #hand-x span").innerHTML = midvalX;
  document.querySelector(".hand-1 #hand-y span").innerHTML = midvalY;

  moveTheBox({ x: (midvalX - 300) / 600, y: (midvalY - 250) / 500 });
}

//Method to use prediction data to render cude accordingly
function moveTheBox(value) {
  cube.position.x = ((window.innerWidth * value.x) / window.innerWidth) * 5;
  cube.position.y = -((window.innerHeight * value.y) / window.innerHeight) * 5;
  renderer.render(scene, camera);
}
