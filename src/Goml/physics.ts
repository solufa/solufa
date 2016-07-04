import { updateS as update } from "../update";
import * as THREE from "three";
import generateFullPath from "../utils/generateFullPath";
import generateWorker from "../utils/generateWorker";

function workerScript() {
  self.onmessage = function( e ) {
    if ( e.data.init ) {
      importScripts( e.data.init );
      self.postMessage({
        isInit: "CANNON" in self,
        url: e.data.init,
      });

      if ( "CANNON" in self ) {
        self.onmessage = onmessage;
      }
    }
  };

  const worldList = [];

  function onmessage( e ) {
    switch ( e.data.type ) {
    case "createWorld":
      let world;
      if ( e.data.index === -1 ) {
        world = new CANNON.World;
        world.broadphase = new CANNON.NaiveBroadphase;
        worldList.push( world );
      } else {
        world = worldList[ e.data.index ];
      }

      world.gravity.set( 0, typeof e.data.gravity === "number" ? e.data.gravity : -9.8, 0 );
      if ( e.data.solver ) {
        for ( let key in e.data.solver ) {
          if ( key ) { // tslint...
            world.solver[ key ] = e.data.solver[ key ];
          }
        }
      }

      const groundBody = new CANNON.Body({ mass: 0 });
      groundBody.addShape( new CANNON.Plane );
      groundBody.position.y = e.data.groundLevel || 0;
      groundBody.quaternion.setFromAxisAngle( new CANNON.Vec3( 1, 0, 0 ), -Math.PI / 2 );
      world.addBody( groundBody );
      break;
    case "update":
      const buffers = [];
      e.data.remove.forEach( function( data ) {
        data.target = worldList[ data.sceneIndex ].bodies[ data.objectIndex ];
      });
      e.data.remove.forEach( function( data ) {
        worldList[ data.sceneIndex ].removeBody( data.target );
      });

      e.data.add.forEach( function( data, index ) {
        let shape;
        switch ( data.type ) {
        case "Sphere":
          shape = new CANNON.Sphere( data.size * data.scale.x );
          break;
        case "Box":
          shape = new CANNON.Box(
            new CANNON.Vec3( data.size[ 0 ] * data.scale.x / 2,
              data.size[ 1 ] * data.scale.y / 2,
              data.size[ 2 ] * data.scale.z / 2
          ) );
          break;
        case "Plane":
          shape = new CANNON.ConvexPolyhedron([                                          // vertices
            new CANNON.Vec3( -data.size[ 0 ] / 2, data.size[ 1 ] / 2, 0 ),
            new CANNON.Vec3( data.size[ 0 ] / 2, data.size[ 1 ] / 2, 0 ),
            new CANNON.Vec3( data.size[ 0 ] / 2, -data.size[ 1 ] / 2, 0 ),
            new CANNON.Vec3(-data.size[ 0 ] / 2, -data.size[ 1 ] / 2, 0 ),
          ],
          [  // Faces
            [ 3, 2, 1, 0 ],
          ]);
          break;
        case "Cylinder":
          shape = new CANNON.Cylinder(
            data.size[ 0 ] * data.scale.x,
            data.size[ 1 ] * data.scale.x,
            data.size[ 2 ] * data.scale.x,
            data.size[ 3 ] || 8
          );
        }

        const body = new CANNON.Body({ mass: e.data.paramList[ index ].mass });
        body.addShape(shape);
        body.position.set( data.position.x, data.position.y, data.position.z );
        body.quaternion.set( data.quaternion.x, data.quaternion.y, data.quaternion.z, data.quaternion.w );
        worldList[ data.sceneIndex ].addBody( body );
      });

      e.data.styleUpdateList.forEach( function( param ) {
        const target = worldList[ param.sceneIndex ].bodies[ param.objectIndex + 1 ];
        target.position.set( param.position.x, param.position.y, param.position.z );
        target.quaternion.set(
          param.quaternion.x,
          param.quaternion.y,
          param.quaternion.z,
          param.quaternion.w
        );
      });

      worldList.forEach( function( world, worldIdx ) {
        world.step( e.data.delta );
        world.bodies.forEach( function( body, bodyIdx ) {
          e.data.dataList[ worldIdx ].positions[ 3 * bodyIdx ] = body.position.x;
          e.data.dataList[ worldIdx ].positions[ 3 * bodyIdx + 1 ] = body.position.y;
          e.data.dataList[ worldIdx ].positions[ 3 * bodyIdx + 2 ] = body.position.z;

          e.data.dataList[ worldIdx ].quaternions[ 4 * bodyIdx ] = body.quaternion.x;
          e.data.dataList[ worldIdx ].quaternions[ 4 * bodyIdx + 1 ] = body.quaternion.y;
          e.data.dataList[ worldIdx ].quaternions[ 4 * bodyIdx + 2 ] = body.quaternion.z;
          e.data.dataList[ worldIdx ].quaternions[ 4 * bodyIdx + 3 ] = body.quaternion.w;

        });

        buffers.push( e.data.dataList[ worldIdx ].positions.buffer, e.data.dataList[ worldIdx ].quaternions.buffer );
      });

      self.postMessage({
        dataList: e.data.dataList,
        type: "updated",
      }, buffers );
    }
  }

}

let worker;
const sceneList = [];
const dataList = [];
const objectList = [];

const addedList = [];
const paramList = [];
const removedList = [];
const cylinderQuat = new THREE.Quaternion().setFromAxisAngle( new THREE.Vector3( 1, 0, 0 ), -Math.PI / 2 );
const rotateQuat = new THREE.Quaternion;
const rotateVec = new THREE.Vector3( 0, 0, 1 );
const tmpQuat = new THREE.Quaternion;

const styleUpdateList = [];

function cylinderAngle( n ) {
  let tmp = n || 8;
  if ( tmp % 2 === 1 ) { // n = 3 -> -6, n = 5 -> 10, n = 7 -> -14, n = 9 -> 18,
    tmp = ( ( tmp + 1 ) / 2 % 2 ? -1 : 1 ) * tmp * 2;
  } else if ( tmp % 4 === 0 ) {
    tmp = 1;
  } else {
    tmp = tmp;
  }
  // n = 4 -> 0, n = 6 -> 6, n = 8 -> 0,
  return tmp;
}

let needsUpdate = true;

function onmessage( e ) {
  if ( e.data.type === "updated" ) {
    needsUpdate = true;
    objectList.forEach( function( objects, index ) {
      objects.forEach( function( object, I ) {
        if ( object.getAttribute( "physics" ).mass === 0 ) { return; }

        let i = I + 1; // index of GroundPlane == 0

        object.coreObject.position.set(
          e.data.dataList[ index ].positions[ 3 * i ],
          e.data.dataList[ index ].positions[ 3 * i + 1 ],
          e.data.dataList[ index ].positions[ 3 * i + 2 ]
        );

        object.coreObject.quaternion.set(
          e.data.dataList[ index ].quaternions[ 4 * i ],
          e.data.dataList[ index ].quaternions[ 4 * i + 1 ],
          e.data.dataList[ index ].quaternions[ 4 * i + 2 ],
          e.data.dataList[ index ].quaternions[ 4 * i + 3 ]
        );

        if ( /^Cylinder/.test( object.getAttribute( "geo" ).type ) ) {
          object.coreObject.quaternion.multiply( tmpQuat.multiplyQuaternions(
            cylinderQuat,
            rotateQuat.setFromAxisAngle( rotateVec, Math.PI / cylinderAngle( object.getAttribute( "geo" ).value[ 3 ] ) )
          ).inverse() );
        }

      });

      dataList[ index ].positions = e.data.dataList[ index ].positions;
      dataList[ index ].quaternions = e.data.dataList[ index ].quaternions;
    });
  }
}

let delta = 0;
let buffers = [];
let exportData;

function checkData( data, index ) {

  const objectLength = objectList[ index ].length + 1;
  if ( objectLength === 1 /*only ground*/ || objectLength !== data.positions.length ) {
    data.positions = new Float32Array( objectLength * 3 );
    data.quaternions = new Float32Array( objectLength * 4 );
  }

  buffers.push( data.positions.buffer, data.quaternions.buffer );
}

function addElement( elem ) {
  const scene = elem.getScene();

  const geo = elem.getAttribute( "geo" );
  const type = geo.type.split( "Buffer" )[ 0 ];
  let sceneIndex = sceneList.indexOf( scene );

  if ( sceneIndex === -1 ) {
    exportData.createWorld( scene );
    sceneIndex = sceneList.indexOf( scene );
  }

  objectList[ sceneIndex ].push( elem );

  const position = elem.coreObject.getWorldPosition();
  const quaternion = elem.coreObject.getWorldQuaternion();
  const scale = elem.coreObject.getWorldScale();

  if ( type === "Cylinder" ) {
    quaternion.multiply( tmpQuat.multiplyQuaternions(
      cylinderQuat,
      rotateQuat.setFromAxisAngle( rotateVec, Math.PI / cylinderAngle( geo.value[ 3 ] ) )
    ) );
  }

  return {
    position: { x: position.x, y: position.y, z: position.z },
    quaternion: { w: quaternion.w, x: quaternion.x, y: quaternion.y, z: quaternion.z },
    scale: { x: scale.x, y: scale.y, z: scale.z },
    sceneIndex,
    size: geo.value.slice( 0, type === "Cylinder" ? 4 : type === "Box" ? 3 : type === "Plane" ? 2 : 1/*Sphere*/ ),
    type,
  };
}

function removeElement( elem ) {
  const sceneIndex = sceneList.indexOf( elem.getScene() );

  return {
    objectIndex: objectList[ sceneIndex ].indexOf( elem ),
    sceneIndex,
  };
}

function removeFromList( elem ) {
  objectList.splice( objectList.indexOf( elem ), 1 );
}

function sendData( d ) {
  delta += d;

  if ( needsUpdate ) {

    buffers.length = 0;
    const remove = removedList.map( removeElement );
    removedList.forEach( removeFromList );
    const add = addedList.map( addElement );

    dataList.forEach( checkData );

    if ( delta > .05 ) {
      delta = .05;
    }

    worker.postMessage({
      add,
      dataList,
      delta,
      paramList,
      remove,
      styleUpdateList: styleUpdateList.map( function( elem ) {
        elem.physicsStyleNeedsUpdate = false;
        const sceneIndex = sceneList.indexOf( elem.getScene() );
        const position = elem.coreObject.getWorldPosition();
        const quaternion = elem.coreObject.getWorldQuaternion();

        return {
          objectIndex: objectList[ sceneIndex ].indexOf( elem ),
          position: { x: position.x, y: position.y, z: position.z },
          quaternion: { w: quaternion.w, x: quaternion.x, y: quaternion.y, z: quaternion.z },
          sceneIndex,
        };
      }),
      type: "update",
    }, buffers );

    addedList.length = removedList.length = paramList.length = 0;

    styleUpdateList.length = 0;
    needsUpdate = false;
    delta = 0;
  }
}

exportData = {

  addElement: function( elem, param ) {
    addedList.push( elem );
    paramList.push( param );
  },

  createWorld: function( elem, value? ) {
    const index = sceneList.indexOf( elem );
    const param = value || {};
    worker.postMessage({
      gravity: param.gravity,
      groundLevel: param.groundLevel,
      index: index,
      solver: param.solver,
      type: "createWorld",
    });

    if ( index === -1 ) {
      sceneList.push( elem );
      dataList.push({
        positions: new Float32Array( 0 ),
        quaternions: new Float32Array( 0 ),
      });
      objectList.push([]);
    }
  },

  init: function( url, onLoad, onError ) {

    worker = generateWorker( workerScript );
    worker.onmessage = function( e ) {
      if ( e.data.isInit === true ) {
        worker.onmessage = onmessage;
        if ( onLoad ) {
          onLoad( e.data.url );
        }

        update( sendData );
      } else if ( e.data.isInit === false ) {
        console.error( '"' + e.data.url + '" is not path of cannon.js.' );
        if ( onError ) {
          onError( e.data.url );
        }
      }
    };

    worker.postMessage({
      init: generateFullPath( url ),
    });
  },

  removeElement: function( elem ) {
    removedList.push( elem );
  },

  styleUpdate: function( elem ) {
    if ( styleUpdateList.indexOf( elem ) === -1 ) {
      styleUpdateList.push( elem );
    }
  },

};

export default exportData;
