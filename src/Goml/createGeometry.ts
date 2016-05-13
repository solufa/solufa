import * as THREE from "three";

export default ( value ) => {

    if ( value.type === "Buffer" ) {
      const geometry = new THREE.BufferGeometry;
      for ( let key in value.attrs ) {
        if ( key ) { // if使わないとlintに怒られる
          geometry.addAttribute( key, new THREE.BufferAttribute( new Float32Array( value.attrs[ key ] ), key === "uv" ? 2 : 3 ) );
        }
      }


      return geometry;
    } else {
      return new THREE[ value.type + "Geometry" ](
        value.value[ 0 ],
        value.value[ 1 ],
        value.value[ 2 ],
        value.value[ 3 ],
        value.value[ 4 ],
        value.value[ 5 ] );
    }
};
