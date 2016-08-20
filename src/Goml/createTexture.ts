import * as THREE from "three";

const txrPool = [];
const txrCorePool = [];

export default function( tmp ) {
  let txr;
  let index = txrPool.indexOf( tmp );

  if ( index !== -1 ) {
    txr = txrCorePool[ index ];
  } else {

    switch ( tmp.type ) {
    case "image":
      if ( typeof tmp.src === "string" ) {
        txr = new THREE.Texture( new Image );
        txr.image.addEventListener( "load", function() {
          this.needsUpdate = true;
        }.bind( txr ), false );

        delete txr.image.crossOrigin; // for FireFox

        if ( !/^data:image/.test( tmp.src ) ) {
          txr.image.crossOrigin = "anonymous";
        }
        txr.image.src = tmp.src;
      } else {
        txr = new THREE.Texture( tmp.src );
        txr.image.addEventListener( "load", function( object ) {
          this.needsUpdate = true;
          if ( object.onload ) {
            object.onload( this );
          }
        }.bind( txr, tmp ), false );
      }
      break;

    case "canvas":
      txr = new THREE.Texture( tmp.src );
      txr.needsUpdate = true;
      break;

    case "video":
      txr = new THREE.VideoTexture( tmp.src );
      txr.format = THREE.RGBFormat;
      break;

    case "cube":
      txr = new THREE.CubeTextureLoader().load( tmp.src, tmp.onload );
      break;
    }

    txr.minFilter = THREE.LinearFilter;
    txr.magFilter = THREE.LinearFilter;

    Object.defineProperty( tmp, "needsUpdate", {
        get: function () {
          return txrCorePool[ txrPool.indexOf( this ) ].needsUpdate;
        },
        set: function ( bool ) {
          let texture = txrCorePool[ txrPool.indexOf( this ) ];
          if ( !bool ) { texture.needsUpdate = bool; return; }

          switch ( this.type ) {
          case "image":
            if ( typeof this.src === "string" ) {
              texture.image.src = this.src;
            } else {
              texture.image = this.src;
              texture.image.addEventListener( "load", function() {
                this.needsUpdate = true;
              }.bind( texture ), false );
            }
            break;
          case "canvas":
          case "video":
            texture.image = this.src;
            break;
          }
          texture.needsUpdate = bool;
        },
    });

    txrPool.push( tmp );
    txrCorePool.push( txr );
  }

  return txr;
};
