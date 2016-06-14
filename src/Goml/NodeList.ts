import * as THREE from "three";
import BaseNode from "./BaseNode";
import createMaterial from "./createMaterial";
import createGeometry from "./createGeometry";
import { setCoreObject as setObject } from "./adminCoreObject";
import RdrNode from "./RdrNode";
import VpNode from "./VpNode";
import physics from "./physics";

const tmpVec = new THREE.Vector3; // for translate

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

  public getScene() {
    let scene = this;

    while ( scene.tagName !== "scene" ) {
      scene = scene.parentNode;
    }

    return scene;
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

  public translate( x, y, z ) {
    tmpVec.set( x, y, z );
    let length = tmpVec.length();
    this.coreObject.translateOnAxis( tmpVec.normalize(), length );
  }

  public translateX( distance ) {
    this.coreObject.translateX( distance );
  }

  public translateY( distance ) {
    this.coreObject.translateY( distance );
  }

  public translateZ( distance ) {
    this.coreObject.translateZ( distance );
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
        this.setHelper( lightType[ this.getAttribute( "init" ).type ], value && this.coreObject );
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

    private _physicsStyleNeedsUpdate = false;

    get physicsStyleNeedsUpdate() {
      return this._physicsStyleNeedsUpdate;
    }
    set physicsStyleNeedsUpdate( bool ) {
      this._physicsStyleNeedsUpdate = bool;
      if ( bool ) { physics.styleUpdate( this ); }
    }

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

    public appendedHook() {
      if ( this.getAttribute( "physics" ) ) {
        physics.addElement( this, this.getAttribute( "physics" ) );
      }
    }

    public removedHook() {
      if ( this.getAttribute( "physics" ) ) {
        physics.removeElement( this );
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

  ocam: class extends GomlNode {

    public setAttrHook( name: string, value ): void {
      super.setAttrHook( name, value );

      if ( /^(zoom|near|far)$/.test( name ) ) {
        this.coreObject[ name ] = value;
        this.coreObject.updateProjectionMatrix();
      } else if ( name === "width" ) {
        this.coreObject.left = value / - 2;
        this.coreObject.right = value / 2;
        this.coreObject.updateProjectionMatrix();
      } else if ( name === "height" ) {
        this.coreObject.top = value / 2;
        this.coreObject.bottom = value / - 2;
        this.coreObject.updateProjectionMatrix();
      }
    }

    constructor( gomlDoc ) {
      super( "ocam", gomlDoc );
      this.coreObject = new THREE.OrthographicCamera( -1, 1, 1, -1 );
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

  rdr: RdrNode,

  rdrs: class extends BaseNode {
    constructor( gomlDoc ) {
      super( "rdrs", gomlDoc );
    }
  },

  scene: class extends GomlNode {
    public setAttrHook( name: string, value ): void {
      super.setAttrHook( name, value );

      if ( name === "physicsWorld" ) {
        physics.createWorld( this, value );
      }
    }

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

  vp: VpNode,

  vps: class extends BaseNode {

    public appendHook( childNode ) {
      childNode.setSize( this.parentNode.canvas.width, this.parentNode.canvas.height );
    }

    constructor( gomlDoc ) {
      super( "vps", gomlDoc );
    }
  },
};
