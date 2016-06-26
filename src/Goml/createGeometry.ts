import * as THREE from "three";

const attrsPool = [];
const attrsCorePool = [];
const indexAttrsCorePool = [];

export default ( value ) => {

  let geometry;

  if ( value.type === "Buffer" ) {
    geometry = new THREE.BufferGeometry;
  } else {
    geometry = new THREE[ value.type + "Geometry" ](
      value.value[ 0 ],
      value.value[ 1 ],
      value.value[ 2 ],
      value.value[ 3 ],
      value.value[ 4 ],
      value.value[ 5 ],
      value.value[ 6 ],
      value.value[ 7 ] );
  }

  if ( value.attrs ) {
    let tmp = value.attrs;
    let length = tmp.position.length / 3;
    let index = attrsPool.indexOf( tmp );

    if ( index !== -1 ) {
      geometry.attributes = attrsCorePool[ index ];
    } else {

      for ( let key in tmp ) {
        if ( key === "index" ) {
          geometry.setIndex( Array.isArray( tmp[ key ] ) ? new THREE.Uint16Attribute( tmp[ key ], 1 ) : tmp[ key ] );
        } else {
          geometry.addAttribute( key, Array.isArray( tmp[ key ] ) ?
            new THREE.Float32Attribute( tmp[ key ], tmp[ key ].length / length ) : tmp[ key ] );
        }
      }

      attrsPool.push( tmp );
      attrsCorePool.push( geometry.attributes );
      indexAttrsCorePool.push( geometry.getIndex() );

      Object.defineProperty( tmp, "needsUpdate", {
        get: function () {
          return attrsCorePool[ attrsPool.indexOf( this ) ].position.needsUpdate;
        },
        set: function ( bool ) {
          let index = attrsPool.indexOf( this );
          for ( let key in this ) {
            if ( key === "index" ) {
              indexAttrsCorePool[ index ].array.set( this[ key ] );
              indexAttrsCorePool[ index ].needsUpdate = true;
            } else {
              attrsCorePool[ index ][ key ].array.set( this[ key ] );
              attrsCorePool[ index ][ key ].needsUpdate = true;
            }
          }
        },
      });
    }

  }

  return geometry;
};
