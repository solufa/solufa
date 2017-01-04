import BaseNode from "./BaseNode";
import errorMessage from "../utils/errorMessage";
import { getGomlElement as getElement } from "./adminCoreObject";

export default class extends BaseNode {
  public cameraObject;
  private width: number;
  private height: number;
  private scene;
  private raycaster = new THREE.Raycaster;
  private tmpVec = new THREE.Vector3;

  // canvas上の座標に自分自身が存在するかどうか
  public _isCollision( offsetX, offsetY, isRatio ): boolean {
    let ratioX = isRatio ? offsetX : offsetX / this.width;
    let ratioY = isRatio ? offsetY : offsetY / this.height;

    return ratioX > this.getAttribute( "left" )
      && ratioX < this.getAttribute( "left" ) + this.getAttribute( "width" )
      && ratioY < ( 1 - this.getAttribute( "bottom" ) )
      && ratioY > ( 1 - this.getAttribute( "bottom" ) - this.getAttribute( "height" ) );
  }

  // 指定位置にあるsolufa elementにイベントを発行する
  public _triggerEvent( offsetX, offsetY, e ) {

    if ( this.scene._allHandlerTypeList.indexOf( e.type ) !== -1 ) {
      const result = this.pickElementByPixel( offsetX, offsetY );
      if ( result ) {
        result.dispatchEvent( this.ownerDocument.createEvent( e ) );
      }
    }
  }

  // canvasの左上を基準としたピクセル位置にあるsolufa elementを返す
  public pickElementByPixel( x: number, y: number ) {
    const ratioX = ( x - this.getAttribute( "left" ) * this.width ) / ( this.getAttribute( "width" ) * this.width );
    const ratioY = ( y - ( 1 - this.getAttribute( "bottom" ) - this.getAttribute( "height" ) ) * this.height ) /
      ( this.getAttribute( "height" ) * this.height );
    return this.pickElementByRatio( ratioX, ratioY );
  }

  // canvasの左上を基準とした比率位置にあるsolufa elementを返す
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

  // 指定位置からrayを飛ばしてthree.jsの情報を返す
  public pickPointByPixel( x: number, y: number, element ) {
    const ratioX = ( x - this.getAttribute( "left" ) * this.width ) / ( this.getAttribute( "width" ) * this.width );
    const ratioY = ( y - ( 1 - this.getAttribute( "bottom" ) - this.getAttribute( "height" ) ) * this.height ) /
      ( this.getAttribute( "height" ) * this.height );
    return this.pickPointByRatio( ratioX, ratioY, element );
  }

  public pickPointByRatio( x: number, y: number, element ) {
    const ratioX = 2 * x - 1;
    const ratioY = -2 * y + 1;

    this.raycaster.setFromCamera( this.tmpVec.set( ratioX, ratioY, 0 ), this.cameraObject );
    return this.raycaster.intersectObject( ( element && element.coreObject ) || this.scene.coreObject, true )[ 0 ];
  }

  // solufa elementのcanvas上における座標を返す
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
      const aspect = +this.getAttribute( "width" ) * this.width / ( +this.getAttribute( "height" ) * this.height );
      if ( this.cameraObject instanceof THREE.PerspectiveCamera ) {
        this.cameraObject.aspect = aspect;
      } else { // OrthographicCamera
        const cam = getElement( this.cameraObject );
        const width = cam.getAttribute( "width" );
        const height = cam.getAttribute( "height" );

        if ( width && height ) { // user manual
          return;
        } else if ( width ) {
          this.cameraObject.top = width / aspect / 2;
          this.cameraObject.bottom = width / aspect / - 2;
        } else if ( height ) {
          this.cameraObject.left = height * aspect / - 2;
          this.cameraObject.right = height * aspect / 2;
        }
      }
      this.cameraObject.updateProjectionMatrix();
    }
  }

  constructor( gomlDoc ) {
    super( "vp", gomlDoc );
    this.setAttribute( "width", 1 );
    this.setAttribute( "height", 1 );
    this.setAttribute( "top", 0 );
    this.setAttribute( "left", 0 );
  }

};
