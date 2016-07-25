import BaseNode from "./BaseNode";
import errorMessage from "../utils/errorMessage";
import { updateGoml as update } from "../update";
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
      child.setSize( this.canvas.width, this.canvas.height );
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

      if ( value.hidpi ) {
        let ratio = 2||window.devicePixelRatio;
        let scaleText = "scale(" + 1 / ratio + ") translate(" + 50 * ( 1 - ratio ) + "%," + 50 * ( 1 - ratio ) + "%)";

        canvasData.container.style.width = ratio + "00%";
        canvasData.container.style.height = ratio + "00%";
        canvasData.container.style.transform = scaleText;
        canvasData.container.style.webkitTransform = scaleText;
      } else {
        canvasData.container.style.width = "100%";
        canvasData.container.style.height = "100%";
      }

      this.coreObject = new THREE.WebGLRenderer( value );
      this.coreObject.autoClear = false;

      this.updateFn = this.render.bind( this );
      update( this.updateFn );

      this.coreObject.setSize( canvasData.container.clientWidth, canvasData.container.clientHeight );
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
    case "gamma":
      this.coreObject.gammaInput = value;
      this.coreObject.gammaOutput = value;
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
        return vp.pickElementByPixel( x - vp.getAttribute( "left" ) * this.canvas.width,
          y - vp.getAttribute( "bottom" ) * this.canvas.height );
      }
    }
  }

  public pickElementByRatio( x: number, y: number ) {
    const vps = this.getVpByReverse();
    for ( let i = 0, l = vps.length, vp; i < l; i++ ) {
      vp = vps[ i ];
      if ( vp._isCollision( x, y, true ) ) {
        return vp.pickElementByRatio( ( x - vp.getAttribute( "left" ) ) / vp.getAttribute( "width" ),
          ( y - vp.getAttribute( "bottom" ) ) / vp.getAttribute( "height" ) );
      }
    }
  }

  public pickPointByPixel( x: number, y: number, element ) {
    const vps = this.getVpByReverse();
    for ( let i = 0, l = vps.length, vp; i < l; i++ ) {
      vp = vps[ i ];
      if ( vp._isCollision( x, y ) ) {
        return vp.pickPointByPixel( x - vp.getAttribute( "left" ) * this.canvas.width,
          y - vp.getAttribute( "bottom" ) * this.canvas.height, element );
      }
    }
  }

  public pickPointByRatio( x: number, y: number, element ) {
    const vps = this.getVpByReverse();
    for ( let i = 0, l = vps.length, vp; i < l; i++ ) {
      vp = vps[ i ];
      if ( vp._isCollision( x, y, true ) ) {
        return vp.pickPointByRatio( ( x - vp.getAttribute( "left" ) ) / vp.getAttribute( "width" ),
          ( y - vp.getAttribute( "bottom" ) ) / vp.getAttribute( "height" ), element );
      }
    }
  }

  constructor( gomlDoc ) {
    super( "rdr", gomlDoc );
    this.canvasHandler = e => {
      const offsetX = e.offsetX !== undefined ? e.offsetX : e.layerX !== undefined ? e.layerX
        : e.touches[ 0 ].pageX - this.canvas.offsetLeft;
      const offsetY = e.offsetY !== undefined ? e.offsetY : e.layerY !== undefined ? e.layerY
        : e.touches[ 0 ].pageY - this.canvas.offsetTop;

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
