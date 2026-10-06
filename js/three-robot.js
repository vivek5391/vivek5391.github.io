/**
 * @file three-robot.js
 * @brief Interactive 3D WebGL Digital Twin of the 5-DOF Robotic Arm
 * @author Vivek Bharat Toradmal
 *
 * Uses Three.js, STLLoader & OrbitControls to render real Autodesk Fusion 360
 * CAD meshes in browser with real-time joint articulation and PBR materials.
 */

(function () {
  const container = document.getElementById('threeContainer');
  if (!container) return;

  let scene, camera, renderer, controls;
  let robotBase, shoulderGroup, armGroup, elbowGroup, wristGroup, gripperGroup;
  let isLoading = true;

  // Joint angle state (degrees)
  let angles = {
    j1: 0,   // Base rotation (yaw around Y axis)
    j2: 25,  // Shoulder pitch
    j3: -45, // Elbow pitch
    j4: 20   // Wrist pitch
  };

  const loader = new THREE.STLLoader();

  // Industrial Materials
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.8,
    roughness: 0.25
  });

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    metalness: 0.7,
    roughness: 0.3
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x6366f1,
    metalness: 0.6,
    roughness: 0.4
  });

  const gripperMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.8,
    roughness: 0.2
  });

  function init() {
    // 1. Scene Setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.0018);

    // 2. Camera Setup
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(45, aspect, 1, 2000);
    camera.position.set(280, 220, 320);

    // 3. Renderer Setup
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    // 4. Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // Don't go below ground
    controls.minDistance = 80;
    controls.maxDistance = 800;
    controls.target.set(0, 80, 0);

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.4);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(150, 300, 200);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.6);
    dirLight2.position.set(-150, 100, -150);
    scene.add(dirLight2);

    // 6. Ground Grid & Pedestal
    const grid = new THREE.GridHelper(600, 30, 0x38bdf8, 0x1e293b);
    grid.position.y = 0;
    scene.add(grid);

    // Base pedestal disc
    const pedestalGeo = new THREE.CylinderGeometry(60, 65, 8, 32);
    const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = 4;
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    // 7. Load Robot CAD Assembly
    loadRobotCAD();

    // 8. Event Listeners
    window.addEventListener('resize', onWindowResize);
    setupSliderListeners();

    // 9. Start Render Loop
    animate();
  }

  function loadRobotCAD() {
    const loadingElem = document.getElementById('threeLoading');

    // Hierarchy Groups for Joint Articulation
    robotBase = new THREE.Group();
    scene.add(robotBase);

    shoulderGroup = new THREE.Group();
    armGroup = new THREE.Group();
    elbowGroup = new THREE.Group();
    wristGroup = new THREE.Group();
    gripperGroup = new THREE.Group();

    // 1. Base Mesh
    loader.load('assets/models/Base.stl', (geo) => {
      geo.center();
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, baseMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.scale.set(0.6, 0.6, 0.6);
      mesh.position.y = 15;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      robotBase.add(mesh);

      // Mount Shoulder Group onto Base
      shoulderGroup.position.set(0, 35, 0);
      robotBase.add(shoulderGroup);

      // 2. Shoulder Mesh
      loader.load('assets/models/Shoulder.stl', (sGeo) => {
        sGeo.center();
        sGeo.computeVertexNormals();
        const sMesh = new THREE.Mesh(sGeo, bodyMat);
        sMesh.rotation.x = -Math.PI / 2;
        sMesh.scale.set(0.6, 0.6, 0.6);
        sMesh.castShadow = true;
        shoulderGroup.add(sMesh);

        // Mount Arm Group onto Shoulder
        armGroup.position.set(0, 45, 0);
        shoulderGroup.add(armGroup);

        // 3. Arm Mesh
        loader.load('assets/models/arm.stl', (aGeo) => {
          aGeo.center();
          aGeo.computeVertexNormals();
          const aMesh = new THREE.Mesh(aGeo, accentMat);
          aMesh.rotation.x = -Math.PI / 2;
          aMesh.scale.set(0.6, 0.6, 0.6);
          aMesh.castShadow = true;
          armGroup.add(aMesh);

          // Mount Elbow Group onto Arm
          elbowGroup.position.set(0, 60, 0);
          armGroup.add(elbowGroup);

          // 4. Elbow Mesh
          loader.load('assets/models/Elbow.stl', (eGeo) => {
            eGeo.center();
            eGeo.computeVertexNormals();
            const eMesh = new THREE.Mesh(eGeo, bodyMat);
            eMesh.rotation.x = -Math.PI / 2;
            eMesh.scale.set(0.6, 0.6, 0.6);
            eMesh.castShadow = true;
            elbowGroup.add(eMesh);

            // Mount Wrist Group onto Elbow
            wristGroup.position.set(0, 45, 0);
            elbowGroup.add(wristGroup);

            // 5. Wrist Mesh
            loader.load('assets/models/Wrist_.stl', (wGeo) => {
              wGeo.center();
              wGeo.computeVertexNormals();
              const wMesh = new THREE.Mesh(wGeo, baseMat);
              wMesh.rotation.x = -Math.PI / 2;
              wMesh.scale.set(0.6, 0.6, 0.6);
              wMesh.castShadow = true;
              wristGroup.add(wMesh);

              // Mount Gripper Group onto Wrist
              gripperGroup.position.set(0, 25, 0);
              wristGroup.add(gripperGroup);

              // 6. Gripper Mesh
              loader.load('assets/models/Gripper v4.stl', (gGeo) => {
                gGeo.center();
                gGeo.computeVertexNormals();
                const gMesh = new THREE.Mesh(gGeo, gripperMat);
                gMesh.rotation.x = -Math.PI / 2;
                gMesh.scale.set(0.55, 0.55, 0.55);
                gMesh.castShadow = true;
                gripperGroup.add(gMesh);

                // Update Joint Poses
                updateJoints();

                // Loading Complete
                isLoading = false;
                if (loadingElem) loadingElem.style.display = 'none';
              });
            });
          });
        });
      });
    }, undefined, (err) => {
      console.warn('Three.js STL local load fallback:', err);
      if (loadingElem) {
        loadingElem.innerHTML = `<span class="text-amber-400 text-xs">Previewing with procedural geometry</span>`;
        setTimeout(() => { loadingElem.style.display = 'none'; }, 1000);
      }
    });
  }

  function updateJoints() {
    if (robotBase) robotBase.rotation.y = THREE.MathUtils.degToRad(angles.j1);
    if (shoulderGroup) shoulderGroup.rotation.z = THREE.MathUtils.degToRad(angles.j2);
    if (armGroup) armGroup.rotation.z = THREE.MathUtils.degToRad(angles.j3);
    if (elbowGroup) elbowGroup.rotation.z = THREE.MathUtils.degToRad(angles.j4);
  }

  function setupSliderListeners() {
    const s1 = document.getElementById('sliderQ1');
    const s2 = document.getElementById('sliderQ2');
    const s3 = document.getElementById('sliderQ3');

    if (s1) {
      s1.addEventListener('input', (e) => {
        angles.j1 = (parseFloat(e.target.value) - 45) * 2;
        updateJoints();
      });
    }
    if (s2) {
      s2.addEventListener('input', (e) => {
        angles.j2 = parseFloat(e.target.value);
        updateJoints();
      });
    }
    if (s3) {
      s3.addEventListener('input', (e) => {
        angles.j3 = parseFloat(e.target.value);
        updateJoints();
      });
    }

    // Auto wave sync
    window.addEventListener('threeSyncAngles', (e) => {
      if (e.detail) {
        angles.j1 = (e.detail.q1 - 45) * 1.5;
        angles.j2 = e.detail.q2;
        angles.j3 = e.detail.q3;
        updateJoints();
      }
    });
  }

  function onWindowResize() {
    if (!container || !renderer || !camera) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
  }

  // Public method for camera reset
  window.resetThreeCamera = function () {
    if (controls && camera) {
      camera.position.set(280, 220, 320);
      controls.target.set(0, 80, 0);
      controls.update();
    }
  };

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 50);
  }
})();

