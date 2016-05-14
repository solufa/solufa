import * as THREE from "three";

const txrPool = [];
const txrCorePool = [];

export default ( value ) => {

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
          txr = new THREE.Texture( new Image );
          txr.image.addEventListener( "load", function() {
            this.needsUpdate = true;
          }.bind( txr ), false );

          txr.sourceFile = tmp.src;
          delete txr.image.crossOrigin; // for FireFox

          if ( !/^data:image/.test( tmp.src ) ) {
            txr.image.crossOrigin = "anonymous";
          }
          txr.image.src = tmp.src;
          break;

        case "canvas":
          txr = new THREE.Texture( tmp.canvas );
          txr.needsUpdate = true;
          break;

        case "video":
          txr = new THREE.VideoTexture( tmp.video );
          txr.minFilter = THREE.LinearFilter;
          txr.magFilter = THREE.LinearFilter;
          txr.format = THREE.RGBFormat;
          break;
        }

        Object.defineProperty( tmp, "needsUpdate", {
            get: function () {
              return txrCorePool[ txrPool.indexOf( this ) ].needsUpdate;
            },
            set: function ( bool ) {
              txrCorePool[ txrPool.indexOf( this ) ].needsUpdate = bool;
            },
        });

        txrPool.push( tmp );
        txrCorePool.push( txr );
      }
      value.value[ key ] = txr;
    }
  }

  return new THREE[ value.type + "Material" ]( value.value );
};
