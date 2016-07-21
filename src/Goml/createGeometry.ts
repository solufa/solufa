import * as THREE from "three";

const geoPool = [];
const geoCorePool = [];

const attrsPool = [];
const attrsCorePool = [];
const indexAttrsCorePool = [];

export default function( value ) {

  const idx = geoPool.indexOf( value );
  if ( idx !== -1 ) {
    return geoCorePool[ idx ];
  } else {
    geoPool.push( value );
    let geometry;

    if ( value.type === "Buffer" ) {
      geometry = new THREE.BufferGeometry;
    } else if ( value.type === "Custom" ) {
      geometry = new THREE.Geometry;
      value.vertices.forEach( function( vec ) {
        geometry.vertices.push( new THREE.Vector3( vec[ 0 ], vec[ 1 ], vec[ 2 ] ) );
      });

      if ( value.faceVertexUvs ) {
        value.faceVertexUvs.forEach( function( faceVertexUv, i ) {
          geometry.faceVertexUvs[ i ] = geometry.faceVertexUvs[ i ] || [];
          faceVertexUv.forEach( function( uv ) {
            geometry.faceVertexUvs[ i ].push([
              new THREE.Vector2( uv[ 0 ][ 0 ], uv[ 0 ][ 1 ] ),
              new THREE.Vector2( uv[ 1 ][ 0 ], uv[ 1 ][ 1 ] ),
              new THREE.Vector2( uv[ 2 ][ 0 ], uv[ 2 ][ 1 ] ),
            ]);
          });
        });
      }

      if ( value.faces ) {
        value.faces.forEach( function( face ) {
          geometry.faces.push( new THREE.Face3(
            face[ 0 ],
            face[ 1 ],
            face[ 2 ],
            face[ 3 ] && new THREE.Vector3( face[ 3 ][ 0 ], face[ 3 ][ 1 ], face[ 3 ][ 2 ] ),
            face[ 4 ] && new THREE.Color( face[ 4 ] ),
            face[ 5 ]
          ));
        });

        if ( !value.faces[ 0 ][ 3 ] ) {
          geometry.computeFaceNormals();
          geometry.computeVertexNormals();
        }
      }

      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();

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
          if ( key === "needsUpdate" ) {
            continue;
          }

          if ( key === "index" ) {
            geometry.setIndex( Array.isArray( tmp[ key ] ) ? new THREE.Uint16Attribute( tmp[ key ], 1 )
              : new THREE.BufferAttribute( tmp[ key ], 1 ) );
          } else {
            geometry.addAttribute( key, Array.isArray( tmp[ key ] ) ?
              new THREE.Float32Attribute( tmp[ key ], tmp[ key ].length / length )
                : new THREE.BufferAttribute( tmp[ key ], tmp[ key ].length / length ) );
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
              if ( key === "needsUpdate" ) {
                continue;
              }

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

      if ( !tmp.normal ) {
        geometry.computeVertexNormals();
      }

    }

    geoCorePool.push( geometry );
    return geometry;
  }

};
