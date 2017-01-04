// solufa material object <-> three.js material instance

/*
  solufa material object
  http://solufa.io/document/?category=object&article=material
*/

import * as THREE from "three";

// solufa material objectのプール
const mtlPool = [];

// three.js material instanceのプール
const mtlCorePool = [];

// solufa texture object
// http://solufa.io/document/?category=object&article=texture
const txrPool = [];

// three.js texture instance
const txrCorePool = [];

export default function( value ) {
  const idx = mtlPool.indexOf( value );

  if ( idx !== -1 ) {
    // 複数のmeshでthreejs material instanceを共有したい
    return mtlCorePool[ idx ];
  } else {
    mtlPool.push( value );

    const param = Object.assign( {}, value.value );

    for ( let key in value.value ) {
      if ( !value.value.hasOwnProperty( key ) ) {
        continue;
      }

      let tmp = value.value[ key ];
      if ( typeof tmp === "object" ) {
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

    const mtl = new THREE[ value.type + "Material" ]( param );
    mtlCorePool.push( mtl );

    return mtl;
  }

};
