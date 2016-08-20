import * as THREE from "three";
import createTexture from "./createTexture";

const mtlPool = [];
const mtlCorePool = [];

export default function( value ) {
  const idx = mtlPool.indexOf( value );

  if ( idx !== -1 ) {
    return mtlCorePool[ idx ];
  } else {
    mtlPool.push( value );

    const param = Object.assign( {}, value.value );

    for ( let key in value.value ) {
      if ( !key ) { // todo: hasOwn...
        continue;
      }

      let tmp = value.value[ key ];
      if ( typeof tmp === "object" ) {
        param[ key ] = createTexture( tmp );
      }
    }

    const mtl = new THREE[ value.type + "Material" ]( param );
    mtlCorePool.push( mtl );

    return mtl;
  }

};
