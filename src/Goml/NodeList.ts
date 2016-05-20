import * as THREE from "three";
import BaseNode from "./BaseNode";
import errorMessage from "../utils/errorMessage";
import { updateS as update } from "../update";
import createCanvas from "./createCanvas";
import createMaterial from "./createMaterial";
import createGeometry from "./createGeometry";
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

  public setAttrHook( name, value ) {
    switch ( name ) {
    case "display":
      this.coreObject.visible = value !== false;
      break;
    case "rotateOrder":
      this.coreObject.rotation.order = value;
      break;
    case "castShadow":
    case "receiveShadow":
      this.coreObject[ name ] = !!value;
      break;
    }
  }

  public getAttrHook( name ) {
    switch ( name ) {
    case "display":
      return this.coreObject.visible;
    case "rotateOrder":
      return this.coreObject.rotation.order;
    case "castShadow":
    case "receiveShadow":
      return this.coreObject[ name ];
    default:
      return super.getAttrHook( name );
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

  public setAttrHook( name: string, value ) {
    switch ( name ) {
    case "init":
      if ( this.coreObject ) {
        break;
        /*this.coreObject.resetGLState();
        this.coreObject.dispose();
        this.canvas = null;
        this.coreObject = null;

        update( this.updateFn, false );
        this.updateFn = null;*/
      }

      const frame = document.querySelector( value.frame );
      if ( !frame ) {
        errorMessage( 'HTML element can not be found by the selector of "' + value.frame + '".' );
        break;
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
      this.coreObject.setClearColor( 0, 1 );
      break;
    case "clearColor":
      this.coreObject.setClearColor( value, this.coreObject.getClearAlpha() );
      break;
    case "clearAlpha":
      this.coreObject.setClearColor( this.coreObject.getClearColor().getHex(), value );
      break;
    case "enableShadow":
      this.coreObject.shadowMap.enabled = value;
      break;
    }
  }

  public render(): void {
    if ( this.getAttribute( "enabled" ) !== false ) {
      this.coreObject.clear();
      this.traverseVp( this.renderEachVp );
    }

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
        return vp.pickElementByPixel( x, y );
      }
    }
  }

  public pickElementByRatio( x: number, y: number ) {
    const vps = this.getVpByReverse();
    for ( let i = 0, l = vps.length, vp; i < l; i++ ) {
      vp = vps[ i ];
      if ( vp._isCollision( x, y, true ) ) {
        return vp.pickElementByRatio( x, y );
      }
    }
  }

  public pickObjectByPixel( x: number, y: number ) {
    const vps = this.getVpByReverse();
    for ( let i = 0, l = vps.length, vp; i < l; i++ ) {
      vp = vps[ i ];
      if ( vp._isCollision( x, y ) ) {
        return vp.pickObjectByPixel( x, y );
      }
    }
  }

  public pickObjectByRatio( x: number, y: number ) {
    const vps = this.getVpByReverse();
    for ( let i = 0, l = vps.length, vp; i < l; i++ ) {
      vp = vps[ i ];
      if ( vp._isCollision( x, y, true ) ) {
        return vp.pickObjectByRatio( x, y );
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
    vpList.length = 0;

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

  public _triggerEvent( offsetX, offsetY, e ) {

    if ( this.scene._allHandlerTypeList.indexOf( e.type ) !== -1 ) {
      const result = this.pickElementByPixel( offsetX, offsetY );
      if ( result ) {
        result.dispatchEvent( this.ownerDocument.createEvent( e ) );
      }
    }
  }

  public pickElementByPixel( x: number, y: number ) {
    const ratioX = ( x - this.getAttribute( "left" ) * this.width ) / ( this.getAttribute( "width" ) * this.width );
    const ratioY = ( y - ( 1 - this.getAttribute( "bottom" ) - this.getAttribute( "height" ) ) * this.height ) /
      ( this.getAttribute( "height" ) * this.height );
    return this.pickElementByRatio( ratioX, ratioY );
  }

  public pickElementByRatio( x: number, y: number ) {
    const ratioX = 2 * x - 1;
    const ratioY = -2 * y + 1;

    this.raycaster.setFromCamera( this.tmpVec.set( ratioX, ratioY, 0 ), this.cameraObject );
    const result = this.raycaster.intersectObject( this.scene.coreObject, true )[ 0 ];

    if ( result ) {
      let target = result.object;
      while ( !getElement( target ) ) {
        target = target.parent;
      }

      return getElement( target );
    } else {
      return null;
    }
  }

  public pickObjectByPixel( x: number, y: number ) {
    const ratioX = ( x - this.getAttribute( "left" ) * this.width ) / ( this.getAttribute( "width" ) * this.width );
    const ratioY = ( y - ( 1 - this.getAttribute( "bottom" ) - this.getAttribute( "height" ) ) * this.height ) /
      ( this.getAttribute( "height" ) * this.height );
    return this.pickObjectByRatio( ratioX, ratioY );
  }

  public pickObjectByRatio( x: number, y: number ) {
    const ratioX = 2 * x - 1;
    const ratioY = -2 * y + 1;

    this.raycaster.setFromCamera( this.tmpVec.set( ratioX, ratioY, 0 ), this.cameraObject );
    return this.raycaster.intersectObject( this.scene.coreObject, true )[ 0 ];
  }

  public getElementOffsetFromCanvas( element ) {
    let matrix = element.coreObject.matrixWorld.elements;
    this.tmpVec.set( matrix[ 12 ], matrix[ 13 ], matrix[ 14 ] ).project( this.cameraObject );
    return {
      left: this.getAttribute( "width" ) * this.width / 2 * ( 1 + this.tmpVec.x ) + this.getAttribute( "left" ) * this.width,
      top: this.getAttribute( "height") * this.height / 2 * ( 1 - this.tmpVec.y )
        + ( 1 - this.getAttribute( "bottom" ) - this.getAttribute( "height" ) ) * this.height,
    };
  }

  public render( renderer ) {
    if ( this.cameraObject && this.getAttribute( "enabled" ) !== false ) {
      renderer.setViewport(
        this.getAttribute( "left" ) * this.width,
        this.getAttribute( "bottom" ) * this.height,
        this.getAttribute( "width" ) * this.width,
        this.getAttribute( "height") * this.height
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

  public setAttrHook( name: string, value ): void {
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
      let right = this.getAttribute( "right" );
      if ( typeof right === "number" ) {
        this.setAttribute( "left", 1 - value - right );
      }
      this.setAspect();
      break;
    case "height":
      let top = this.getAttribute( "top" );
      if ( typeof top === "number" ) {
        this.setAttribute( "bottom", 1 - value - top );
      }
      this.setAspect();
      break;
    case "top":
      this.setAttribute( "bottom", 1 - value - this.getAttribute( "height" ) );
      break;
    case "right":
      this.setAttribute( "left", 1 - value - this.getAttribute( "width" ) );
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

    public setAttrHook( name: string, value ): void {
      super.setAttrHook( name, value );

      if ( /^(fov|near|far)$/.test( name ) ) {
        this.coreObject[ name ] = value;
        this.coreObject.updateProjectionMatrix();
      }
    }

    public getAttrHook( name: string ) {

      if ( /^(fov|near|far)$/.test( name ) ) {
        return this.coreObject[ name ];
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

    public setAttrHook( name: string, value ): void {
      super.setAttrHook( name, value );

      switch ( name ) {
      case "init":
        if ( this.coreObject ) { break; }
        let param = value.value || [];
        this.coreObject = new THREE[ lightType[ value.type ] ]( param[ 0 ], param[ 1 ], param[ 2 ], param[ 3 ], param[ 4 ], param[ 5 ] );
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

  line: class extends GomlNode {

    public setAttrHook( name: string, value ): void {
      super.setAttrHook( name, value );
      let index;

      switch ( name ) {
      case "geo":
        index = geoPool.indexOf( value );
        if ( index !== -1 ) {
          this.coreObject.geometry = geoCorePool[ index ];
        } else {
          geoPool.push( value );
          geoCorePool.push( this.coreObject.geometry = createGeometry( value ) );
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
      super( "line", gomlDoc );
      this.coreObject = new THREE.Line;
    }
  },

  mesh: class extends GomlNode {

    public setAttrHook( name: string, value ): void {
      super.setAttrHook( name, value );
      let index;

      switch ( name ) {
      case "geo":
        index = geoPool.indexOf( value );
        if ( index !== -1 ) {
          this.coreObject.geometry = geoCorePool[ index ];
        } else {
          geoPool.push( value );
          geoCorePool.push( this.coreObject.geometry = createGeometry( value ) );
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

  points: class extends GomlNode {

    public setAttrHook( name: string, value ): void {
      super.setAttrHook( name, value );
      let index;

      switch ( name ) {
      case "geo":
        index = geoPool.indexOf( value );
        if ( index !== -1 ) {
          this.coreObject.geometry = geoCorePool[ index ];
        } else {
          geoPool.push( value );
          geoCorePool.push( this.coreObject.geometry = createGeometry( value ) );
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
      super( "points", gomlDoc );
      this.coreObject = new THREE.Points;
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

    public setAttrHook( name: string, value ): void {
      super.setAttrHook( name, value );

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
