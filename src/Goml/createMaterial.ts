import * as THREE from "three";

const txrPool = [];
const txrCorePool = [];

export default ( value ) => {

  const param = Object.assign( {}, value.value );

  for ( let key in value.value ) {
    if ( /(map|Map)$/.test( key ) ) {
      let tmp = value.value[ key ];
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
            txr.image.addEventListener( "load", function() {
              this.needsUpdate = true;
            }.bind( txr ), false );
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
        }

        txr.minFilter = THREE.LinearFilter;
        txr.magFilter = THREE.LinearFilter;

        Object.defineProperty( tmp, "needsUpdate", {
            get: function () {
              return txrCorePool[ txrPool.indexOf( this ) ].needsUpdate;
            },
            set: function ( bool ) {
              let txr = txrCorePool[ txrPool.indexOf( this ) ];
              if ( !bool ) { txr.needsUpdate = bool; return; }

              switch ( this.type ) {
              case "image":
                if ( typeof this.src === "string" ) {
                  txr.image.src = this.src;
                } else {
                  txr.image = this.src;
                  txr.image.addEventListener( "load", function() {
                    this.needsUpdate = true;
                  }.bind( txr ), false );
                }
                break;
              case "canvas":
              case "video":
                txr.image = this.src;
                break;
              }
              txr.needsUpdate = bool;
            },
        });

        txrPool.push( tmp );
        txrCorePool.push( txr );
      }
      param[ key ] = txr;
    }
  }

  return new THREE[ value.type + "Material" ]( param );
};
