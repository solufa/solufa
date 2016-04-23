import * as THREE from "three";
import BaseNode from "./BaseNode";
import errorMessage from "../utils/errorMessage";
import string2Json from "../utils/string2Json";
import { updateJ3 as update } from "../update";
import createCanvas from "./createCanvas";

class GomlNode extends BaseNode {
  public coreObject;
  public sceneObject; // use only camera

  public appendHook( childNode ) {
    this.coreObject.add( childNode.coreObject );
  }

  public removeHook( childNode ) {
    this.coreObject.remove( childNode.coreObject );
  }

  public attrHook( name: string, value ) {
    if ( typeof value === "string" && /^(\{|\[)/.test( value ) ) {
      value = string2Json( value );
    }

    switch ( name ) {
    case "position":
      THREE.Vector3.prototype.set.apply( this.coreObject.position, value );
      break;
    }
  }
}

class RdrNode extends BaseNode {
  public coreObject;
  public canvas;
  private updateFn;

  public attrHook( name: string, value ) {
    if ( name === "init" ) {

      if ( this.coreObject ) {
        this.coreObject.resetGLState();
        this.coreObject.dispose();
        this.canvas = null;
        this.coreObject = null;

        update( this.updateFn, false );
        this.updateFn = null;
      }

      value = string2Json( value );

      const frame = document.querySelector( value.frame );
      if ( !frame ) {
        errorMessage( 'HTML element can not be found by the selector of "' + value.frame + '".' );
        return;
      }

      const canvasData = createCanvas();
      frame.appendChild( canvasData.container );
      this.canvas = value.canvas = canvasData.canvas;
      window.frames[ window.frames.length - 1 ].addEventListener( "resize", this.resize.bind( this ), false );

      this.coreObject = new THREE.WebGLRenderer( value );
      this.coreObject.autoClear = false;

      this.updateFn = this.render.bind( this );
      update( this.updateFn );
    }
  }

  public render(): void {
    this.coreObject.clear();
    for ( let i = 0; i < this.childNodes.length; i++ ) {
      this.childNodes[ i ].render( this.coreObject );
    }
  }

  public resize( e ): void {
    this.coreObject.setSize( e.target.innerWidth, e.target.innerHeight );
    for ( let i = 0; i < this.childNodes.length; i++ ) {
      this.childNodes[ i ].setSize( this.canvas.width, this.canvas.height );
    }
  }

}

class VpNode extends BaseNode {
  public cameraObject;
  private width: number;
  private height: number;

  public render( renderer ): void {
    if ( this.cameraObject && +this.getAttribute( "width" ) && +this.getAttribute( "height") ) {
      renderer.setViewport(
        +this.getAttribute( "left" ) * this.width,
        +this.getAttribute( "top" ) * this.height,
        +this.getAttribute( "width" ) * this.width,
        +this.getAttribute( "height") * this.height
      );
      renderer.render( this.cameraObject.sceneObject, this.cameraObject );
    }
  }

  public setSize( width: number, height: number ): void {
    this.width = width;
    this.height = height;
    this.setAspect();
  }

  public attrHook( name: string, value ): void {
    switch ( name ) {
    case "camera":
      const cam = this.ownerDocument.body.querySelector( value );
      if ( !cam ) {
        errorMessage( 'The camera of rdr element can not be found in the selector "' + value + '".' );
      } else {
        cam.setScene();
        this.cameraObject = cam.coreObject;
        this.setAspect();
      }

      break;
    case "width":
    case "height":
      this.setAspect();
      break;
    }
  }

  public setAspect(): void {
    if ( this.cameraObject ) {
      this.cameraObject.aspect = +this.getAttribute( "width" ) * this.width / ( +this.getAttribute( "height" ) * this.height );
      this.cameraObject.updateProjectionMatrix();
    }
  }

}

let lightType = {};
for ( let key in THREE ) {
  if ( /.+?Light$/.test( key ) ) {
    lightType[ key.slice( 0, 3 ) ] = key;
  }
}

const geoPool = [];
const mtlPool = [];

export default {
  body: BaseNode,

  camera: class extends GomlNode {

    public setScene() {
      let scene = this.parentNode;
      while ( scene.tagName !== "scene" ) {
        scene = scene.parentNode;
      }
      this.coreObject.sceneObject = scene.coreObject;
    }

    constructor( gomlDoc ) {
      super( "camera", gomlDoc );
      this.coreObject = new THREE.PerspectiveCamera;
    }
  },

  head: BaseNode,

  light: class extends GomlNode {

    public attrHook( name: string, value ): void {
      super.attrHook( name, value );

      if ( name === "type" ) {
        this.coreObject = new THREE[ lightType[ value ] ];
      }
    }

    constructor( gomlDoc ) {
      super( "light", gomlDoc );
    }
  },

  mesh: class extends GomlNode {

    public attrHook( name: string, value ): void {
      value = string2Json( value );
      super.attrHook( name, value );

      switch ( name ) {
      case "geo":
        if ( value.cacheId !== undefined ) {
          this.coreObject.geometry = geoPool[ value.cacheId ];
        } else {
          value.cacheId = geoPool.length;
          this.coreObject.geometry = new THREE[ value.type + "Geometry" ](
            value.value[ 0 ],
            value.value[ 1 ],
            value.value[ 2 ],
            value.value[ 3 ],
            value.value[ 4 ],
            value.value[ 5 ] );
          geoPool.push( this.coreObject.geometry );
        }
        break;

      case "mtl":
        if ( value.cacheId !== undefined ) {
          this.coreObject.material = mtlPool[ value.cacheId ];
        } else {
          value.cacheId = mtlPool.length;
          this.coreObject.material = new THREE[ value.type + "Material" ]( value.value );
          mtlPool.push( this.coreObject.material );
        }
        break;
      }
    }

    constructor( gomlDoc ) {
      super( "mesh", gomlDoc );
      this.coreObject = new THREE.Mesh;
    }
  },

  obj: class extends GomlNode {

    constructor( gomlDoc ) {
      super( "obj", gomlDoc );
      this.coreObject = new THREE.Object3D;
    }
  },

  rdr: class extends RdrNode {

    constructor( gomlDoc ) {
      super( "rdr", gomlDoc );
    }
  },

  scene: class extends GomlNode {

    constructor( gomlDoc ) {
      super( "scene", gomlDoc );
      this.coreObject = new THREE.Scene;
    }
  },

  scenes: BaseNode,

  vp: class extends VpNode {

    constructor( gomlDoc ) {
      super( "vp", gomlDoc );
      this.setAttribute( "width", 1 );
      this.setAttribute( "height", 1 );
      this.setAttribute( "top", 0 );
      this.setAttribute( "left", 0 );
    }
  },
};
