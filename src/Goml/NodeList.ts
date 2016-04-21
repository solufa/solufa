import * as THREE from "three";
import BaseNode from "./BaseNode";
import errorMessage from "../utils/errorMessage";
import string2Json from "../utils/string2Json";
import { updateJ3 as update } from "../update";

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
  public cameraObject;

  public render(): void {
    if ( this.cameraObject ) {
      this.coreObject.render( this.cameraObject.sceneObject, this.cameraObject );
    }
  }

  public resize( e ): void {
    this.coreObject.setSize( e.target.innerWidth, e.target.innerHeight );
    this.setAspect();
  }

  public setAspect(): void {
    if ( this.cameraObject && this.canvas ) {
      this.cameraObject.aspect = this.canvas.width / this.canvas.height;
      this.cameraObject.updateProjectionMatrix();
    }
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
    }
  }

}

class CanvasNode extends BaseNode {
  public coreObject;
  private updateFn;

  public appendHook( childNode ) {
    const value = ( childNode.attrList.init || { value: { clearColor: "#fff" } } ).value;
    let param = string2Json( value );
    param.canvas = childNode.canvas = this.coreObject;
    childNode.coreObject = new THREE.WebGLRenderer( param );

    this.updateFn = childNode.render.bind( childNode );
    update( this.updateFn );

  }

  public removeHook( childNode ) {
    childNode.coreObject.resetGLState();
    childNode.coreObject.dispose();
    childNode.canvas = null;
    childNode.coreObject = null;

    update( this.updateFn, false );
    this.updateFn = null;
  }
}

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

  canvas: class extends CanvasNode {

    constructor( gomlDoc ) {
      super( "canvas", gomlDoc );
    }
  },

  head: BaseNode,

  mesh: class extends GomlNode {

    public attrHook( name: string, value ): void {
      value = string2Json( value );
      super.attrHook( name, value );

      switch ( name ) {
      case "geo":
        this.coreObject.geometry = new THREE[ value.type + "Geometry" ](
          value.value[ 0 ],
          value.value[ 1 ],
          value.value[ 2 ],
          value.value[ 3 ],
          value.value[ 4 ],
          value.value[ 5 ] );
        break;

      case "mtl":
        this.coreObject.material = new THREE[ value.type + "Material" ]( value.value );
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

  vp: class extends RdrNode {

    constructor( gomlDoc ) {
      super( "vp", gomlDoc );
    }
  },
};
