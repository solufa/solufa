import * as THREE from "three";
import BaseNode from "./BaseNode";
import errorMessage from "../utils/errorMessage";
import { updateS as update } from "../update";
import createCanvas from "./createCanvas";
import createMaterial from "./createMaterial";
import { setCoreObject as setObject } from "./adminCoreObject";
import { getGomlElement as getElement } from "./adminCoreObject";

class GomlNode extends BaseNode {
  private _coreObject;
  private _lightHelper;
  private _cameraHelper;

  get coreObject() {
    return this._coreObject;
  }
  set coreObject( object ) {
    this._coreObject = object;
    setObject( this );
  }

  public attrHook( name, value ) {
    switch ( name ) {
    case "display":
      this.coreObject.visible = value !== false;
      break;
    case "castShadow":
    case "receiveShadow":
      this.coreObject[ name ] = !!value;
      break;
    }
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

  public setHelper( type, object ) {
    if ( object ) {
      const helper = new THREE[ type + "Helper" ]( object );
      this.coreObject.add( helper );
      if ( type === "Camera" ) {
        this._cameraHelper = helper;
      } else {
        this._lightHelper = helper;
      }
    } else {
      let helper;
      if ( type === "Camera" ) {
        helper = this._cameraHelper;
        delete this._cameraHelper;
      } else {
        helper = this._lightHelper;
        delete this._lightHelper;
      }
      this.coreObject.remove( helper );
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
  private renderEachVp;
  private resizeEachVp;
  private arrayForGetVpByReverse = [];

  public appendHook( child ) {
    if ( child.tagName === "vp" ) {
      this.resizeEachVp( child );
    } else {
      for ( let i = 0, l = child.childNodes.length; i < l; i++ ) {
        this.resizeEachVp( child.childNodes[ i ] );
      }
    }
  }

  public attrHook( name: string, value ) {
    switch ( name ) {
    case "init":
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

      this.coreObject.setSize( frame.clientWidth, frame.clientHeight );
      break;
    case "enableShadow":
      this.coreObject.shadowMap.enabled = value;
    }
  }

  public render(): void {
    this.coreObject.clear();

    this.traverseVp( this.renderEachVp );

    this.newHandlerTypes.forEach( this.addCanvasEvent );

    this.handlerTypes.forEach( this.removeCanvasEvent );

    this.handlerTypes = this.newHandlerTypes;
    this.newHandlerTypes.length = 0;
  }

  public resize( e ): void {
    this.coreObject.setSize( e.target.innerWidth, e.target.innerHeight );
    this.traverseVp( this.resizeEachVp );
    this.dispatchEvent( this.ownerDocument.createEvent( e ) );
  }

  public pickElementByPixel( x: number, y: number ) {
    const vps = this.getVpByReverse();
    for ( let i = 0, l = vps.length, vp; i < l; i++ ) {
      vp = vps[ i ];
      if ( vp._isCollision( x, y ) ) {
        return vp._triggerEvent( x, y );
      }
    }
  }

  public pickElementByRatio( x: number, y: number ) {
    const vps = this.getVpByReverse();
    for ( let i = 0, l = vps.length, vp; i < l; i++ ) {
      vp = vps[ i ];
      if ( vp._isCollision( x, y, true ) ) {
        return vp._triggerEvent( x, y, null, true );
      }
    }
  }

  private traverseVp( callback ) {
    this.childNodes.forEach( child => {
      if ( child.tagName === "vps" ) {
        child.childNodes.forEach( callback );
      } else {
        callback( child );
      }
    });
  }

  private getVpByReverse() {
    const vpList = this.arrayForGetVpByReverse;

    for ( let i = this.childNodes.length - 1, child; i > - 1; i-- ) {
      child = this.childNodes[ i ];
      if ( child.tagName === "vps" ) {
        for ( let j = child.childNodes.length - 1; j > -1; j-- ) {
          vpList.push( child.childNodes[ j ] );
        }
      } else {
        vpList.push( child );
      }
    }

    return vpList;
  }

  constructor( tagName: string, gomlDoc ) {
    super( tagName, gomlDoc );
    this.canvasHandler = e => {
      const offsetX = e.offsetX === undefined ? e.layerX : e.offsetX;
      const offsetY = e.offsetY === undefined ? e.layerY : e.offsetY;

      const vps = this.getVpByReverse();
      for ( let i = 0, l = vps.length, vp; i < l; i++ ) {
        vp = vps[ i ];
        if ( vp._isCollision( offsetX, offsetY ) ) {
          return vp._triggerEvent( offsetX, offsetY, e );
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

    this.renderEachVp = vp => {
      vp.render( this.coreObject ).forEach( this.setNewHandlerType );
    };

    this.resizeEachVp = vp => {
      vp.setSize( this.canvas.width, this.canvas.height );
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

  public _isCollision( offsetX, offsetY, isRatio ): boolean {
    let ratioX = isRatio ? offsetX : offsetX / this.width;
    let ratioY = isRatio ? offsetY : offsetY / this.height;

    return ratioX > this.getAttribute( "left" )
      && ratioX < this.getAttribute( "left" ) + this.getAttribute( "width" )
      && ratioY < ( 1 - this.getAttribute( "bottom" ) )
      && ratioY > ( 1 - this.getAttribute( "bottom" ) - this.getAttribute( "height" ) );
  }

  public _triggerEvent( offsetX, offsetY, e, isRatio ) {
    let ratioX = isRatio ? 2 * offsetX - 1
      : 2 * ( offsetX - this.getAttribute( "left" ) * this.width ) / ( this.getAttribute( "width" ) * this.width ) - 1;
    let ratioY = isRatio ? -2 * offsetY + 1
      : - 2 * ( offsetY - ( 1 - this.getAttribute( "bottom" ) - this.getAttribute( "height" ) ) * this.height ) /
      ( this.getAttribute( "height" ) * this.height ) + 1;

    if ( !e || this.scene._allHandlerTypeList.indexOf( e.type ) !== -1 ) {
      this.raycaster.setFromCamera( this.tmpVec.set( ratioX, ratioY, 0 ), this.cameraObject );
      let result = this.raycaster.intersectObject( this.scene.coreObject, true )[ 0 ];

      if ( result ) {
        let target = result.object;
        while ( !getElement( target ) ) {
          target = target.parent;
        }

        if ( e ) {
          getElement( target ).dispatchEvent( this.ownerDocument.createEvent( e ) );
        } else {
          return getElement( target );
        }
      }
    }
  }

  public render( renderer ) {
    if ( this.cameraObject ) {
      renderer.setViewport(
        +this.getAttribute( "left" ) * this.width,
        +this.getAttribute( "bottom" ) * this.height,
        +this.getAttribute( "width" ) * this.width,
        +this.getAttribute( "height") * this.height
      );
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

    public attrHook( name: string, value ): void {
      super.attrHook( name, value );

      if ( /^(fov|near|far)$/.test( name ) ) {
        this.coreObject[ name ] = value;
        this.coreObject.updateProjectionMatrix();
      }
    }

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

      switch ( name ) {
      case "type":
        this.coreObject = new THREE[ lightType[ value ] ];
        break;
      case "helper":
        if ( !this.coreObject ) { break; }
        this.setHelper( lightType[ this.getAttribute( "type" ) ], value && this.coreObject );
        if ( this.getAttribute( "castShadow" ) ) {
          this.setHelper( "Camera", value && this.coreObject.shadow.camera );
        }
        break;
      case "castShadow":
        if ( typeof value === "object" ) {
          const shadow = this.coreObject.shadow;
          for ( let key in value ) {
            if ( key === "mapSize" ) {
              shadow.mapSize.width =
              shadow.mapSize.height = value[ key ];
            } else if ( key === "bias" ) {
              shadow.bias = value[ key ];
            } else {
              shadow.camera[ key ] = value[ key ];
            }
          }
        }
        break;
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
          geoCorePool.push( this.coreObject.geometry );
        }
        break;

      case "mtl":
        index = mtlPool.indexOf( value );
        if ( index !== -1 ) {
          this.coreObject.material = mtlCorePool[ index ];
        } else {
          mtlPool.push( value );
          mtlCorePool.push( this.coreObject.material = createMaterial( value ) );
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

  vps: class extends BaseNode {
    constructor( gomlDoc ) {
      super( "vps", gomlDoc );
    }
  },
};
