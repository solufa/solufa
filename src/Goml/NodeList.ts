import * as THREE from "three";
import BaseNode from "./BaseNode";
import errorMessage from "../utils/errorMessage";
import { updateJ3 as update } from "../update";
import createCanvas from "./createCanvas";
import createMaterial from "./createMaterial";
import { setCoreObject as setObject } from "./adminCoreObject";
import { getGomlElement as getElement } from "./adminCoreObject";

class GomlNode extends BaseNode {
  private _coreObject;
  get coreObject() {
    return this._coreObject;
  }
  set coreObject( object ) {
    this._coreObject = object;
    setObject( this );
  }

  public appendHook( childNode ) {// m.redrawとかでMithrilがtextNodeを生成することがある
    if ( childNode.coreObject instanceof THREE.Object3D ) {
      this.coreObject.add( childNode.coreObject );
    }
  }

  public removeHook( childNode ) {
    if ( childNode.coreObject instanceof THREE.Object3D ) {
      this.coreObject.remove( childNode.coreObject );
    }
  }

}

class RdrNode extends BaseNode {
  public coreObject;
  public canvas;
  private updateFn;
  private handlerTypes = [];
  private newHandlerTypes = [];

  private canvasHandler;
  private setNewHandlerType;
  private addCanvasEvent;
  private removeCanvasEvent;

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

    this.childNodes.forEach( child => {
      child.render( this.coreObject ).forEach( this.setNewHandlerType );
    });

    this.newHandlerTypes.forEach( this.addCanvasEvent );

    this.handlerTypes.forEach( this.removeCanvasEvent );

    this.handlerTypes = this.newHandlerTypes;
    this.newHandlerTypes.length = 0;
  }

  public resize( e ): void {
    this.coreObject.setSize( e.target.innerWidth, e.target.innerHeight );
    this.childNodes.forEach( child => {
      child.setSize( this.canvas.width, this.canvas.height );
    });
    this.setViewport();
  }

  public setViewport() {
    this.childNodes.forEach( child => {
      this.coreObject.setViewport(
        child.getAttribute( "left" ) * this.canvas.width,
        child.getAttribute( "bottom" ) * this.canvas.height,
        child.getAttribute( "width" ) * this.canvas.width,
        child.getAttribute( "height" ) * this.canvas.height
      );
    });
  }

  public appendHook() {
    this.setViewport();
  }

  public removeHook() {
    this.setViewport();
  }

  constructor( tagName: string, gomlDoc ) {
    super( tagName, gomlDoc );
    this.canvasHandler = e => {
      const offsetX = e.offsetX === undefined ? e.layerX : e.offsetX;
      const offsetY = e.offsetY === undefined ? e.layerY : e.offsetY;

      for ( let i = this.childNodes.length, child; i > 0; i-- ) { // 後に描画されるVPからチェック
        child = this.childNodes[ i - 1 ];
        if ( child._isCollision( offsetX, offsetY ) ) {
          child._triggerEvent( e, offsetX, offsetY );
          break;
        }
      }

    };

    this.setNewHandlerType = type => {
      if ( this.newHandlerTypes.indexOf( type ) === -1 ) {
        this.newHandlerTypes.push( type );
      }
    };

    this.addCanvasEvent = type => {
      if ( this.handlerTypes.indexOf( type ) === -1 ) {
        this.canvas.addEventListener( type, this.canvasHandler, false );
      }
    };

    this.removeCanvasEvent = type => {
      if ( this.newHandlerTypes.indexOf( type ) === -1 ) {
        this.canvas.removeEventListener( type, this.canvasHandler, false );
      }
    };
  }

}

class VpNode extends BaseNode {
  public cameraObject;
  private width: number;
  private height: number;
  private scene;
  private raycaster = new THREE.Raycaster;
  private tmpVec = new THREE.Vector3;

  public _isCollision( offsetX, offsetY ): boolean {
    let ratioX = offsetX / this.width;
    let ratioY = offsetY / this.height;

    return ratioX > this.getAttribute( "left" )
      && ratioX < this.getAttribute( "left" ) + this.getAttribute( "width" )
      && ratioY < ( 1 - this.getAttribute( "bottom" ) )
      && ratioY > ( 1 - this.getAttribute( "bottom" ) - this.getAttribute( "height" ) );
  }

  public _triggerEvent( e, offsetX, offsetY ): void {
    let ratioX = 2 * ( offsetX - this.getAttribute( "left" ) * this.width ) / ( this.getAttribute( "width" ) * this.width ) - 1;
    let ratioY = -2 * ( offsetY
      - ( 1 - this.getAttribute( "bottom" ) - this.getAttribute( "height" ) ) * this.height ) /
      ( this.getAttribute( "height" ) * this.height ) + 1;

    if ( this.scene._allHandlerTypeList.indexOf( e.type ) !== -1 ) {
      this.raycaster.setFromCamera( this.tmpVec.set( ratioX, ratioY, 0 ), this.cameraObject );
      let result = this.raycaster.intersectObject( this.scene.coreObject, true )[ 0 ];

      if ( result ) {
        getElement( result.object ).dispatchEvent( this.ownerDocument.createEvent( e ) );
      }
    }
  }

  public render( renderer ) {
    if ( this.cameraObject ) {
      renderer.render( this.scene.coreObject, this.cameraObject );
      return this.scene._allHandlerTypeList;
    } else {
      return [];
    }
  }

  public setSize( width: number, height: number ): void {
    this.width = width;
    this.height = height;
    this.setAspect();
  }

  public attrHook( name: string, value ): void {
    switch ( name ) {
    case "cam":
      const cam = this.ownerDocument.body.querySelector( value );
      if ( !cam ) {
        errorMessage( 'The cam of rdr element can not be found in the selector "' + value + '".' );
      } else {

        let scene = cam.parentNode;
        while ( scene.tagName !== "scene" ) {
          scene = scene.parentNode;
        }
        this.scene = scene;
        this.cameraObject = cam.coreObject;
        this.setAspect();
      }

      break;
    case "width":
    case "height":
      this.setAspect();
      if ( this.parentNode ) {
        this.parentNode.setViewport();
      }
      break;
    case "left":
    case "bottom":
      if ( this.parentNode ) {
        this.parentNode.setViewport();
      }
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
const geoCorePool = [];
const mtlPool = [];
const mtlCorePool = [];

export default {
  body: class extends BaseNode {
    constructor( gomlDoc ) {
      super( "body", gomlDoc );
    }
  },

  cam: class extends GomlNode {

    constructor( gomlDoc ) {
      super( "cam", gomlDoc );
      this.coreObject = new THREE.PerspectiveCamera;
    }
  },

  head: class extends BaseNode {
    constructor( gomlDoc ) {
      super( "head", gomlDoc );
    }
  },

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
      super.attrHook( name, value );
      let index;

      switch ( name ) {
      case "geo":
        index = geoPool.indexOf( value );
        if ( index !== -1 ) {
          this.coreObject.geometry = geoCorePool[ index ];
        } else {
          if ( value.type === "Custom" ) {
            const geometry = this.coreObject.geometry = new THREE.Geometry;
            if ( value.vertices ) {
              value.vertices.forEach( function( vec ) {
                geometry.vertices.push( new THREE.Vector3( vec[ 0 ], vec[ 1 ], vec[ 2 ] ) );
              });
            }
          } else {
            this.coreObject.geometry = new THREE[ value.type + "Geometry" ](
              value.value[ 0 ],
              value.value[ 1 ],
              value.value[ 2 ],
              value.value[ 3 ],
              value.value[ 4 ],
              value.value[ 5 ] );
          }
          geoPool.push( value );
          geoCorePool[ geoPool.length - 1 ] = this.coreObject.geometry;
        }
        break;

      case "mtl":
        index = mtlPool.indexOf( value );
        if ( index !== -1 ) {
          this.coreObject.material = mtlCorePool[ index ];
        } else {
          mtlPool.push( value );
          mtlCorePool[ mtlPool.length - 1 ] = this.coreObject.material = createMaterial( value );
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

  rdrs: class extends BaseNode {
    constructor( gomlDoc ) {
      super( "rdrs", gomlDoc );
    }
  },

  scene: class extends GomlNode {

    constructor( gomlDoc ) {
      super( "scene", gomlDoc );
      this.coreObject = new THREE.Scene;
    }
  },

  scenes: class extends BaseNode {
    constructor( gomlDoc ) {
      super( "scenes", gomlDoc );
    }
  },

  sprite: class extends GomlNode {

    public attrHook( name: string, value ): void {
      super.attrHook( name, value );

      switch ( name ) {
      case "mtl":
        if ( value.cacheId !== undefined ) {
          this.coreObject.material = mtlPool[ value.cacheId ];
        } else {
          value.cacheId = mtlPool.length;
          mtlPool.push( this.coreObject.material = createMaterial( value ) );
        }
        break;
      }
    }

    constructor( gomlDoc ) {
      super( "sprite", gomlDoc );
      this.coreObject = new THREE.Sprite;
    }
  },

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
