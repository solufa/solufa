import BaseNode from "./BaseNode";
import errorMessage from "../utils/errorMessage";
import { updateS as update } from "../update";
import createCanvas from "./createCanvas";

export default class extends BaseNode {
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

  public pickPointByPixel( x: number, y: number, element ) {
    const vps = this.getVpByReverse();
    for ( let i = 0, l = vps.length, vp; i < l; i++ ) {
      vp = vps[ i ];
      if ( vp._isCollision( x, y ) ) {
        return vp.pickPointByPixel( x, y, element );
      }
    }
  }

  public pickPointByRatio( x: number, y: number, element ) {
    const vps = this.getVpByReverse();
    for ( let i = 0, l = vps.length, vp; i < l; i++ ) {
      vp = vps[ i ];
      if ( vp._isCollision( x, y, true ) ) {
        return vp.pickPointByRatio( x, y, element );
      }
    }
  }

  constructor( gomlDoc ) {
    super( "rdr", gomlDoc );
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

};
