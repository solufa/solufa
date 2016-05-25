import * as THREE from "three";

export default ( value ) => {

    if ( value.type === "Buffer" ) {
      const geometry = new THREE.BufferGeometry;
      for ( let key in value.attrs ) {
        if ( key ) { // if使わないとlintに怒られる
          geometry.addAttribute( key, new THREE.BufferAttribute( new Float32Array( value.attrs[ key ] ),
            key === "index" ? 1 : key === "uv" ? 2 : 3 ) );
        }
      }


      return geometry;
    } else {
      const geometry = new THREE[ value.type + "Geometry" ](
        value.value[ 0 ],
        value.value[ 1 ],
        value.value[ 2 ],
        value.value[ 3 ],
        value.value[ 4 ],
        value.value[ 5 ],
        value.value[ 6 ],
        value.value[ 7 ] );

      /*if ( value.faceVertexUvs ) {
        value.faceVertexUvs.forEach( ( array, i0 ) => {
          geometry.faceVertexUvs[ i0 ] = geometry.faceVertexUvs[ i0 ] || [];
          array.forEach( ( uvs, i1 ) => {
            geometry.faceVertexUvs[ i0 ][ i1 ] = geometry.faceVertexUvs[ i0 ][ i1 ] || [];
            uvs.forEach( ( uv, i2 ) => {
                geometry.faceVertexUvs[ i0 ][ i1 ][ i2 ] = new THREE.Vector2( uv[ 0 ], uv[ 1 ] );
            });
          });
        });
      }*/

      if ( value.attrs ) {
        for ( let key in value.attrs ) {
          if ( key ) {
            geometry.addAttribute( key, new THREE.BufferAttribute( new Float32Array( value.attrs[ key ] ),
              key === "index" ? 1 : key === "uv" ? 2 : 3 ) );
          }
        }
      }

      return geometry;
    }
};
